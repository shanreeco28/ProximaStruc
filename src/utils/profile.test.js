import { test } from 'node:test';
import assert from 'node:assert/strict';
import { personalProfileUpdates } from './profile.js';

test('profile edits trim personal fields and exclude account/access settings', () => {
  assert.deepEqual(personalProfileUpdates({name:' Alex ',role:' Engineer ',phone:' +65 6123 4567 ',birthday:'1990-01-01',systemRole:'admin',email:'someone@example.test',organization:'Other company'}), {
    name:'Alex',role:'Engineer',phone:'+65 6123 4567',birthday:'1990-01-01',
  });
});
test('profile validation rejects invalid dates, phone numbers and missing names', () => {
  for(const values of [{name:' '},{name:'A'.repeat(121)},{name:'Alex',role:'A'.repeat(121)},{name:'Alex',birthday:'2026-02-30'},{name:'Alex',birthday:'9999-01-01'},{name:'Alex',phone:'not a phone number'}]) {
    assert.throws(()=>personalProfileUpdates(values));
  }
  assert.deepEqual(personalProfileUpdates({name:'Alex'}),{name:'Alex',role:'',phone:'',birthday:''});
});
