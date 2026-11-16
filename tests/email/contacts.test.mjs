import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canUseEmailContacts, contactEmails, emailDate, emptyContactFilters, filterEmailContacts, validateContactFilters } from '../../lib/email-contacts.ts';
const contact = {id:1,name:'Jana Nováková',email:'Jana@example.test',role:'TEACHER',schoolId:1,school:'School A',branchId:2,branch:'TWO',region:'ONE',lastTrackedEmailAt:'2026-11-10T23:30:00Z'};
const other = {...contact,id:2,name:'Peter',email:'peter@example.test',role:'PARTNER',schoolId:null,school:'',branchId:null,branch:'',region:'TWO',lastTrackedEmailAt:null};
const filters = values => validateContactFilters({...emptyContactFilters,...values});

test('combines contact filters and handles unassigned relationships',()=>{
 assert.deepEqual(filterEmailContacts([contact,other],filters({name:'jana',email:'EXAMPLE',role:'TEACHER',school:'1',branch:'2',region:'ONE'})),[contact]);
 assert.deepEqual(filterEmailContacts([contact,other],filters({school:'none',branch:'none'})),[other]);
 assert.equal(filterEmailContacts([contact],filters({school:'2'})).length,0);
});
test('last-email filters use inclusive Prague calendar days and distinguish never tracked',()=>{
 assert.equal(emailDate(contact.lastTrackedEmailAt),'2026-11-11');
 assert.deepEqual(filterEmailContacts([contact,other],filters({lastEmail:'never'})),[other]);
 assert.deepEqual(filterEmailContacts([contact,other],filters({since:'2026-11-11',until:'2026-11-11'})),[contact]);
 assert.equal(filterEmailContacts([contact],filters({until:'2026-11-10'})).length,0);
 assert.equal(filterEmailContacts([other],filters({since:'2026-01-01'})).length,0);
 assert.equal(emailDate('2026-06-01T22:30:00Z'),'2026-06-02');
});
test('rejects invalid dates and excessive filter input',()=>{
 assert.throws(()=>filters({since:'2026-02-30'}));
 assert.throws(()=>filters({since:'2026-11-12',until:'2026-11-11'}));
 assert.throws(()=>filters({name:'x'.repeat(201)}));
 assert.throws(()=>filters({role:42}));
});
test('copying uses every matching address, removes duplicates, and excludes invalid addresses',()=>{
 const contacts=Array.from({length:120},(_,i)=>({...contact,id:i,email:`person${i}@example.test`}));
 assert.equal(contactEmails(contacts).length,120);
 assert.deepEqual(contactEmails([contact,{...other,email:' jana@EXAMPLE.test '},{...other,email:'invalid'},{...other,email:'test@example.test\r\nBcc: x@example.test'}]),['Jana@example.test']);
 assert.equal(contact.lastTrackedEmailAt,'2026-11-10T23:30:00Z');
});
test('email contacts access is limited to administrators, coordinators, and marketers',()=>{
 for(const role of ['ADMIN','MARKETER','COORDINATOR','NEWSLETTER_COORDINATOR','SCHOOL_NETWORK_COORDINATOR'])assert.equal(canUseEmailContacts([role]),true);
 for(const role of ['LECTURER','BRANCH_DIRECTOR','PROJECT_MANAGER'])assert.equal(canUseEmailContacts([role]),false);
 assert.equal(canUseEmailContacts([]),false);
});

const newsletterContact = { ...contact,
 smartEmailing: { lists: [{id:7,name:'PNS Teachers',status:'unsubscribed'},{id:8,name:'PNS Parents',status:'confirmed'}],blacklisted:false,hardBounced:true,softBounces:0 },
 smartCampaigns: [
  {name:'Teachers November',deliveredAt:'2026-11-10T10:00:00Z',openDates:['2026-11-10','2026-11-13'],clickDates:[]},
  {name:'Parents October',deliveredAt:'2026-10-10T10:00:00Z',openDates:[],clickDates:['2026-10-11']},
 ],
};
test('mailing list, subscription and current bounce filters combine without treating missing data as healthy',()=>{
 const find=values=>filterEmailContacts([newsletterContact,other],filters(values));
 assert.deepEqual(find({mailingList:'7',subscription:'unsubscribed',bounce:'hard'}),[newsletterContact]);
 assert.equal(find({mailingList:'7',subscription:'subscribed'}).length,0);
 assert.deepEqual(find({mailingList:'8',subscription:'subscribed'}),[newsletterContact]);
 assert.deepEqual(find({subscription:'unknown',bounce:'unknown'}),[other]);
 assert.equal(find({bounce:'none'}).length,0);
 const healthy={...newsletterContact,smartEmailing:{...newsletterContact.smartEmailing,hardBounced:false}};
 assert.deepEqual(filterEmailContacts([healthy],filters({bounce:'none'})),[healthy]);
 assert.equal(filterEmailContacts([{...healthy,smartEmailing:{...healthy.smartEmailing,blacklisted:true}}],filters({subscription:'subscribed'})).length,0);
});
test('engagement and campaign filters refer to the same campaign and any matching day, not just the latest event',()=>{
 const find=values=>filterEmailContacts([newsletterContact,other],filters(values));
 assert.deepEqual(find({campaign:'teachers',engagement:'opened',engagementSince:'2026-11-10',engagementUntil:'2026-11-10'}),[newsletterContact]);
 assert.equal(find({campaign:'teachers',engagement:'clicked'}).length,0);
 assert.deepEqual(find({campaign:'parents',engagement:'clicked'}),[newsletterContact]);
 assert.deepEqual(find({campaign:'teachers',engagement:'unopened',engagementSince:'2026-11-11',engagementUntil:'2026-11-12'}),[newsletterContact]);
 assert.equal(find({engagement:'unclicked'}).length,0);
 assert.equal(find({campaign:'nonexistent'}).length,0);
 // Missing imported history must not imply that an unknown contact ignored newsletters.
 assert.equal(filterEmailContacts([other],filters({engagement:'unopened'})).length,0);
 assert.equal(filterEmailContacts([{...newsletterContact,lastTrackedEmailAt:null}],filters({lastEmail:'never',bounce:'none'})).length,0);
});
test('new filter values and date ranges are validated; older saved filter sets receive defaults',()=>{
 for (const values of [{subscription:'invalid'},{bounce:'invalid'},{engagement:'invalid'},{mailingList:'nope'},{engagement:'opened',engagementSince:'2026-02-30'},{engagement:'clicked',engagementSince:'2026-11-14',engagementUntil:'2026-11-13'},{engagementSince:'2026-11-10'}])assert.throws(()=>filters(values));
 const old=validateContactFilters({name:'Jana',lastEmail:'any'});
 assert.equal(old.mailingList,'');assert.equal(old.engagement,'any');assert.equal(old.subscription,'any');
});
