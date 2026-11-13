// This suite uses a disposable LOCAL Postgres database, never DATABASE_URL or real mailboxes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { userInfo } from 'node:os';
import pg from 'pg';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson from '../../prisma/contract.json' with {type:'json'};
import { contactEmails, emptyContactFilters } from '../../lib/email-contacts.ts';

const port=Number(process.env.MIGRATION_TEST_PORT);
if(!Number.isSafeInteger(port)||port<=0)throw new Error('Set MIGRATION_TEST_PORT to a disposable local Postgres port.');
const config={host:'127.0.0.1',port,user:userInfo().username};
registerHooks({resolve(specifier,context,next){
 if(specifier==='server-only')return {url:'data:text/javascript,export {}',shortCircuit:true};
 if(specifier==='@/prisma/db')return {url:'data:text/javascript,export const db=globalThis.emailTestDb',shortCircuit:true};
 if(specifier==='@/lib/current-employee')return {url:'data:text/javascript,export async function currentEmployee(){return globalThis.emailTestEmployee}',shortCircuit:true};
 if(specifier==='next/cache')return {url:'data:text/javascript,export function revalidatePath(){}',shortCircuit:true};
 if(specifier.startsWith('@/lib/'))return next(new URL(`../../${specifier.slice(2)}.ts`,import.meta.url).href,context);
 if(specifier==='./email-contacts')return next(new URL('../../lib/email-contacts.ts',import.meta.url).href,context);
 return next(specifier,context);
}});

test('private segments and verified CC tracking work against the actual schema',async t=>{
 const database=`email_segments_test_${randomBytes(8).toString('hex')}`;
 const admin=new pg.Client({...config,database:'postgres'});await admin.connect();
 let client,runtime;
 const keys=['EMAIL_TRACKING_CC_ADDRESS','EMAIL_TRACKING_WEBHOOK_SECRET','EMAIL_TRACKING_ALLOWED_SENDERS'];
 const previousEnv=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 try{
  await admin.query(`CREATE DATABASE "${database}"`);
  const url=`postgresql://${encodeURIComponent(config.user)}@127.0.0.1:${port}/${database}`;
  const migrate=()=>{const result=spawnSync(process.execPath,['node_modules/prisma/dist/prisma.js','db','migrate'],{cwd:new URL('../../',import.meta.url),encoding:'utf8',timeout:30000,env:{...process.env,DATABASE_URL:url,DO_NOT_TRACK:'1'}});assert.equal(result.status,0,`${result.stdout}\n${result.stderr}`);};
  migrate();migrate();
  client=new pg.Client({...config,database});await client.connect();
  runtime=postgres({contractJson,url});globalThis.emailTestDb=runtime;
  globalThis.emailTestEmployee={id:1,roles:['COORDINATOR']};
  const actions=await import('../../app/email/actions.ts');
  const {loadEmailContacts}=await import('../../lib/email-contacts-server.ts');
  const {POST}=await import('../../app/api/email-tracking/route.ts');
  await client.query(`INSERT INTO public."Employee"(id,name,email,password,roles,"updatedAt")VALUES
    (1,'Coordinator','Coordinator@example.test','unused',ARRAY['COORDINATOR'],now()),
    (2,'Marketer','marketer@example.test','unused',ARRAY['MARKETER'],now());
    INSERT INTO public."School"(id,name,address,email,type,relationship,region,"updatedAt")VALUES(1,'School','{}','school@example.test','PRIMARY','AVERAGE','ONE',now());
    INSERT INTO public."Contact"(id,name,email,"contactRole","schoolId","updatedAt")VALUES
    (1,'Alice','Alice@example.test','TEACHER',1,now()),(2,'Bob','bob@example.test','PARTNER',NULL,now());`);
  const contactsBefore=await loadEmailContacts();
  let segment;
  await t.test('saves server-filtered snapshots and preserves the saved contact details',async()=>{
   segment=await actions.saveEmailSegment('Teachers',{...emptyContactFilters,role:'TEACHER',contacts:[{email:'injected@example.test'}]});
   assert.equal(segment.contactCount,1);
   await runtime.orm.public.Contact.where({id:1}).update({name:'Renamed Alice',email:'new-alice@example.test'});
   const saved=await actions.getEmailSegment(segment.id);
   assert.equal(saved.contacts[0].name,'Alice');assert.equal(saved.contacts[0].email,'Alice@example.test');
   assert.deepEqual(contactEmails(saved.contacts),['Alice@example.test']);
   await runtime.orm.public.Contact.where({id:1}).update({email:'Alice@example.test'});
   assert.equal((await loadEmailContacts())[0].lastTrackedEmailAt,null);
   await assert.rejects(actions.saveEmailSegment('Empty',{...emptyContactFilters,name:'nonexistent'}),/no contacts/i);
  });
  await t.test('other creators and unauthorized roles cannot read or delete private segments',async()=>{
   globalThis.emailTestEmployee={id:2,roles:['MARKETER']};
   await assert.rejects(actions.getEmailSegment(segment.id),/not found/i);await assert.rejects(actions.deleteEmailSegment(segment.id),/not found/i);
   const own=await actions.saveEmailSegment('Marketing list',emptyContactFilters);assert.equal(own.contactCount,2);
   globalThis.emailTestEmployee={id:3,roles:['LECTURER']};await assert.rejects(actions.getEmailSegment(own.id),/Only/);await assert.rejects(actions.saveEmailSegment('No',emptyContactFilters),/Only/);
   globalThis.emailTestEmployee=null;await assert.rejects(actions.getEmailSegment(segment.id),/Only/);
   globalThis.emailTestEmployee={id:1,roles:['COORDINATOR']};assert.equal((await actions.getEmailSegment(segment.id)).contactCount,1);
  });
  process.env.EMAIL_TRACKING_CC_ADDRESS='tracking@example.test';process.env.EMAIL_TRACKING_WEBHOOK_SECRET='test-secret-'.repeat(5);process.env.EMAIL_TRACKING_ALLOWED_SENDERS='shared@example.test';
  const message=overrides=>({messageId:'<message-1@example.test>',from:'coordinator@example.test',to:['alice@example.test'],cc:['tracking@example.test'],sentAt:'2026-11-01T12:00:00Z',senderVerified:true,...overrides});
  const post=async(payload,token=process.env.EMAIL_TRACKING_WEBHOOK_SECRET)=>POST(new Request('https://crm.example.test/api/email-tracking',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)}));
  const trackedContact=()=>runtime.orm.public.Contact.where({id:1}).first();
  await t.test('rejects unauthorized relays, spoofed senders, missing CC, and future timestamps without changing data',async()=>{
   assert.equal((await post(message(), 'wrong-secret')).status,401);
   assert.equal((await post(message({senderVerified:false}))).status,403);
   assert.equal((await post(message({from:'outsider@example.test'}))).status,403);
   assert.equal((await post(message({cc:[]}))).status,400);
   assert.equal((await post(message({sentAt:'2099-01-01T12:00:00Z'}))).status,400);
   assert.equal((await post(message({messageId:'<oversized>',extra:'x'.repeat(70000)}))).status,413);
   assert.equal((await trackedContact()).lastTrackedEmailAt,null);
   assert.equal((await runtime.orm.public.TrackedEmail.all().toArray()).length,0);
  });
  await t.test('records verified emails once and identifies the sender from the employee directory',async()=>{
   const response=await post(message());assert.equal(response.status,200);assert.deepEqual(await response.json(),{matchedContacts:1,duplicate:false});
   const contact=await trackedContact();assert.equal(Date.parse(contact.lastTrackedEmailAt),Date.parse('2026-11-01T12:00:00Z'));assert.equal(contact.last_contacted_byId,1);
   const repeated=await post(message());assert.equal(repeated.status,200);assert.equal((await repeated.json()).duplicate,true);
   assert.equal((await runtime.orm.public.Interaction.where({contactId:1}).all().toArray()).length,1);
   assert.equal((await post(message({to:['bob@example.test']}))).status,409);
   const saved=await actions.getEmailSegment(segment.id);assert.equal(saved.contacts[0].lastTrackedEmailAt,null);
  });
  await t.test('backdated and concurrent messages never move contact dates backwards',async()=>{
   assert.equal((await post(message({messageId:'<older>',sentAt:'2026-10-01T12:00:00Z'}))).status,200);
   assert.equal(Date.parse((await trackedContact()).lastTrackedEmailAt),Date.parse('2026-11-01T12:00:00Z'));
   const results=await Promise.all([post(message({messageId:'<newest>',sentAt:'2026-11-04T12:00:00Z'})),post(message({messageId:'<middle>',sentAt:'2026-11-02T12:00:00Z'}))]);
   assert.ok(results.every(r=>r.status===200));assert.equal(Date.parse((await trackedContact()).lastTrackedEmailAt),Date.parse('2026-11-04T12:00:00Z'));
  });
  await t.test('organization senders and visible CC recipients are tracked without inventing an employee identity',async()=>{
   const response=await post(message({messageId:'<organization>',from:'shared@example.test',to:['bob@example.test'],cc:['tracking@example.test','ALICE@example.test'],sentAt:'2026-11-05T12:00:00Z'}));
   assert.equal(response.status,200);assert.equal((await response.json()).matchedContacts,2);
   assert.equal((await trackedContact()).last_contacted_byId,null);
  });
  await t.test('a failed multi-contact update rolls back everything and the same Message-ID can be retried',async()=>{
   const before=(await trackedContact()).lastTrackedEmailAt;
   await client.query(`CREATE FUNCTION reject_tracking_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.id=2 THEN RAISE EXCEPTION 'test failure'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER reject_tracking_test BEFORE UPDATE ON public."Contact" FOR EACH ROW EXECUTE FUNCTION reject_tracking_test();`);
   const payload=message({messageId:'<rollback>',to:['alice@example.test','bob@example.test'],sentAt:'2026-11-06T12:00:00Z'});
   const failed=await post(payload);assert.equal(failed.status,500);assert.equal((await trackedContact()).lastTrackedEmailAt,before);
   assert.equal(await runtime.orm.public.TrackedEmail.where({id:'<rollback>'}).first(),null);
   await client.query('DROP TRIGGER reject_tracking_test ON public."Contact"; DROP FUNCTION reject_tracking_test()');
   assert.equal((await post(payload)).status,200);
  });
  await t.test('last CC-tracked email remains distinct from a newer phone interaction',async()=>{
   await runtime.orm.public.Interaction.create({contactId:1,schoolId:1,employeeId:2,mode:'PHONE',contactedAt:'2026-11-08T12:00:00Z'});
   assert.equal((await post(message({messageId:'<after-phone>',sentAt:'2026-11-07T12:00:00Z'}))).status,200);
   const contact=await trackedContact();
   assert.equal(Date.parse(contact.lastTrackedEmailAt),Date.parse('2026-11-07T12:00:00Z'));
   assert.equal(Date.parse(contact.last_contacted),Date.parse('2026-11-08T12:00:00Z'));assert.equal(contact.last_contacted_byId,2);
  });
  await t.test('deleting a live contact does not alter its saved snapshot; deleting a segment keeps contacts',async()=>{
   await runtime.orm.public.Contact.where({id:1}).delete();assert.deepEqual(contactEmails((await actions.getEmailSegment(segment.id)).contacts),['Alice@example.test']);
   await actions.deleteEmailSegment(segment.id);await assert.rejects(actions.getEmailSegment(segment.id),/not found/i);
   assert.ok(await runtime.orm.public.Contact.where({id:2}).first());
   assert.equal(contactsBefore[0].lastTrackedEmailAt,null);
  });
 }finally{
  for(const key of keys){if(previousEnv[key]===undefined)delete process.env[key];else process.env[key]=previousEnv[key];}
  await runtime?.close();await client?.end();await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH(FORCE)`);await admin.end();delete globalThis.emailTestDb;delete globalThis.emailTestEmployee;
 }
});
