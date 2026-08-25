const assert = require('node:assert/strict');
const path = require('node:path');
const stateApi = require(path.join(__dirname, '..', 'interface', 'app', 'companion-state.js'));
const { createCompanionSyncAdapter } = require(path.join(__dirname, '..', 'interface', 'app', 'companion-sync.js'));

let current = stateApi.createCompanionState({deviceId:'pc-main',deviceType:'pc',now:1000});
const runtime = {
  snapshot:()=>stateApi.sanitizeCompanionState(current),
  ingest:remote=>{current=stateApi.mergeCompanionState(current,remote);return stateApi.sanitizeCompanionState(current)},
};
const adapter = createCompanionSyncAdapter({stateApi,runtime});
const tasks = [{id:'task-1',text:'Alpha',category:'task'}];
const payload = adapter.pack(tasks);
assert.equal(payload.length, 2);
assert.equal(payload[1].id, stateApi.COMPANION_ENTRY_ID);

const phone = stateApi.reduceCompanionState(
  stateApi.createCompanionState({deviceId:'iphone-main',deviceType:'iphone',now:1000}),
  {type:'shared-update',patch:{activeView:'inbox',voice:{state:'listening'}}},
  {deviceId:'iphone-main',deviceType:'iphone',now:2000},
);
const remotePayload = stateApi.packSyncEntries([{id:'task-2',text:'Beta',category:'thought'}],phone);
const result = adapter.ingest(remotePayload);
assert.deepEqual(result.entries,[{id:'task-2',text:'Beta',category:'thought'}]);
assert.equal(result.companion.shared.activeView.value,'inbox');
assert.equal(runtime.snapshot().shared.voice.value.state,'listening');
assert.equal(result.changed,true);

const unchanged = adapter.ingest(stateApi.packSyncEntries(result.entries,runtime.snapshot()));
assert.equal(unchanged.changed,false);
const malformed = adapter.ingest([{id:'task-3',text:'Gamma'},{id:stateApi.COMPANION_ENTRY_ID,companionState:'bad'}]);
assert.deepEqual(malformed.entries,[{id:'task-3',text:'Gamma'}]);
assert.equal(malformed.companion,null);
assert.equal(runtime.snapshot().shared.activeView.value,'inbox');

console.log('ORBIT Companion sync adapter contracts passed');
