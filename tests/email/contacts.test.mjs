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
