const assert = require('node:assert/strict');
const path = require('node:path');

const modulePath = path.join(__dirname, '..', 'interface', 'app', 'companion-state.js');
const companion = require(modulePath);

assert.equal(companion.PROTOCOL_VERSION, 1);

const pc = companion.createCompanionState({ deviceId: 'pc-main', deviceType: 'pc', now: 1000 });
const phone = companion.createCompanionState({ deviceId: 'iphone-main', deviceType: 'iphone', now: 1000 });
assert.equal(pc.devices['pc-main'].type, 'pc');
assert.equal(phone.devices['iphone-main'].type, 'iphone');
assert.equal(pc.shared.activeView.value, 'dashboard');
assert.equal(pc.shared.voice.value.state, 'idle');

const pcUpdated = companion.reduceCompanionState(pc, {
  type: 'shared-update',
  patch: {
    activeView: 'missions',
    voice: { state: 'thinking' },
    mission: { id: 'companion', label: 'PC und iPhone verbinden' },
    conversation: { turnId: 'turn-1', userText: 'Status', replyText: 'System stabil.' },
  },
}, { deviceId: 'pc-main', now: 2000 });

const phoneUpdated = companion.reduceCompanionState(phone, {
  type: 'shared-update',
  patch: { activeView: 'inbox', voice: { state: 'listening' } },
}, { deviceId: 'iphone-main', now: 2100 });

const mergedA = companion.mergeCompanionState(pcUpdated, phoneUpdated);
const mergedB = companion.mergeCompanionState(phoneUpdated, pcUpdated);
assert.deepEqual(mergedA, mergedB, 'merge must be commutative so devices converge');
assert.equal(mergedA.shared.activeView.value, 'inbox', 'newer field update must win');
assert.equal(mergedA.shared.voice.value.state, 'listening');
assert.equal(mergedA.shared.mission.value.id, 'companion', 'unrelated older fields must survive a merge');
assert.equal(mergedA.shared.conversation.value.turnId, 'turn-1');

const handoff = companion.reduceCompanionState(mergedA, {
  type: 'handoff-request', targetDeviceId: 'iphone-main', route: 'missions',
}, { deviceId: 'pc-main', now: 2200, eventId: 'handoff-1' });
assert.equal(handoff.shared.handoff.value.id, 'handoff-1');
assert.equal(handoff.shared.handoff.value.status, 'pending');
assert.equal(handoff.shared.handoff.value.targetDeviceId, 'iphone-main');

const acknowledged = companion.reduceCompanionState(handoff, {
  type: 'handoff-ack', handoffId: 'handoff-1',
}, { deviceId: 'iphone-main', now: 2300 });
assert.equal(acknowledged.shared.handoff.value.status, 'acknowledged');
assert.equal(acknowledged.shared.handoff.value.acknowledgedBy, 'iphone-main');
assert.throws(() => companion.reduceCompanionState(acknowledged, {
  type: 'handoff-ack', handoffId: 'different-id',
}, { deviceId: 'iphone-main', now: 2400 }), /HANDOFF_MISMATCH/);

const presence = companion.reduceCompanionState(acknowledged, {
  type: 'presence', status: 'online',
}, { deviceId: 'pc-main', deviceType: 'pc', now: 5000 });
assert.deepEqual(companion.listOnlineDevices(presence, 5000, 45000).map(device => device.id).sort(), ['iphone-main', 'pc-main']);
assert.deepEqual(companion.listOnlineDevices(presence, 50000, 45000).map(device => device.id), ['pc-main']);

const dirty = JSON.parse(JSON.stringify(presence));
dirty.syncKey = 'must-not-leave-device';
dirty.accessToken = 'secret';
dirty.shared.voice.value.token = 'secret';
dirty.shared.conversation.value.userText = 'x'.repeat(900);
dirty.unknown = { password: 'secret' };
const safe = companion.sanitizeCompanionState(dirty);
const serialized = JSON.stringify(safe);
assert.doesNotMatch(serialized, /must-not-leave-device|secret|syncKey|accessToken|password/);
assert.ok(safe.shared.conversation.value.userText.length <= 500);
assert.deepEqual(Object.keys(safe).sort(), ['devices', 'revision', 'shared', 'updatedAt', 'updatedBy', 'version']);

assert.throws(() => companion.createCompanionState({ deviceId: 'bad id', deviceType: 'pc', now: 1 }), /DEVICE_ID/);
assert.throws(() => companion.createCompanionState({ deviceId: 'tablet', deviceType: 'tablet', now: 1 }), /DEVICE_TYPE/);

const userEntries = [{ id: 'task-1', text: 'Test', category: 'task' }];
const packed = companion.packSyncEntries(userEntries, dirty);
assert.equal(packed.length, 2);
assert.deepEqual(packed[0], userEntries[0]);
assert.equal(packed[1].id, companion.COMPANION_ENTRY_ID);
assert.equal(packed[1].category, 'system');
assert.doesNotMatch(JSON.stringify(packed[1]), /must-not-leave-device|secret|syncKey|accessToken|password/);
const unpacked = companion.unpackSyncEntries(packed);
assert.deepEqual(unpacked.entries, userEntries);
assert.deepEqual(unpacked.companion, safe);
const malformed = companion.unpackSyncEntries([...userEntries, { id: companion.COMPANION_ENTRY_ID, companionState: 'broken' }]);
assert.deepEqual(malformed.entries, userEntries);
assert.equal(malformed.companion, null);
assert.equal(companion.unpackSyncEntries('not-an-array').entries.length, 0);

console.log('ORBIT Companion state protocol contracts passed');
