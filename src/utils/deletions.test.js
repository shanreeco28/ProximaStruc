import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canRequestDeletion, canReviewDeletion, deletionKey, deletionReason, isDeletionAdmin, RECORD_COLLECTIONS } from './deletions.js';
test('only admins delete directly; creators across all roles can request their own data',()=>{
  for(const systemRole of ['admin','manager','engineer','supervisor','RE','RTO','guest']) {
    const user={uid:systemRole,email:'person@example.test',systemRole};
    assert.equal(isDeletionAdmin(user),systemRole==='admin');
    assert.equal(canRequestDeletion(user,{createdBy:'PERSON@example.test'}),true);
    assert.equal(canRequestDeletion(user,{createdBy:'other@example.test'}),false);
    assert.equal(canRequestDeletion(user,{}),false);
  }
});
test('review must be pending and independent, with admin authority preserved',()=>{
  const pending={status:'pending',requestedByUid:'creator'};
  assert.equal(canReviewDeletion({uid:'other',systemRole:'manager'},pending),true);
  assert.equal(canReviewDeletion({uid:'creator',systemRole:'manager'},pending),false);
  assert.equal(canReviewDeletion({uid:'creator',systemRole:'admin'},pending),true);
  assert.equal(canReviewDeletion({uid:'other',systemRole:'engineer'},pending),false);
  assert.equal(canReviewDeletion({uid:'other',systemRole:'manager'},{...pending,status:'approved'}),false);
});
test('deletion targets and reasons reject invalid input',()=>{
  for(const collection of Object.keys(RECORD_COLLECTIONS)) assert.equal(deletionKey(collection,'record'),`${collection}:record`);
  for(const [collection,id] of [['unknown','record'],['tasks',''],['materials','bad/path']]) assert.throws(()=>deletionKey(collection,id));
  assert.throws(()=>deletionReason(' '));assert.throws(()=>deletionReason('x'.repeat(2001)));assert.equal(deletionReason(' Duplicate '),'Duplicate');
});
