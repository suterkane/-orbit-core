const assert = require('node:assert/strict');
const path = require('node:path');
const { createCompanionRuntime, resolveDeviceType, getOrCreateDeviceId } = require(path.join(__dirname, '..', 'interface', 'app', 'companion-runtime.js'));

function memoryStorage(){
  const values = new Map();
  return { getItem:key=>values.has(key)?values.get(key):null, setItem:(key,value)=>values.set(key,String(value)), removeItem:key=>values.delete(key) };
}

function channelBus(){
  const channels = new Set();
  return {
    create(){
      const channel = { onmessage:null, closed:false, postMessage(data){for(const peer of channels)if(peer!==channel&&!peer.closed)peer.onmessage?.({data:JSON.parse(JSON.stringify(data))})}, close(){channel.closed=true;channels.delete(channel)} };
      channels.add(channel);return channel;
    },
    size(){return channels.size},
  };
}

let clock = 1000;
assert.equal(resolveDeviceType({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',platform:'iPhone',maxTouchPoints:5}), 'iphone');
assert.equal(resolveDeviceType({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X)',platform:'MacIntel',maxTouchPoints:5}), 'iphone', 'iPadOS desktop user agent must be treated as companion');
assert.equal(resolveDeviceType({userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',platform:'Win32',maxTouchPoints:0}), 'pc');
const identityStorage = memoryStorage();
let generated = 0;
const firstId = getOrCreateDeviceId(identityStorage, () => `generated-${++generated}`);
assert.equal(firstId, 'generated-1');
assert.equal(getOrCreateDeviceId(identityStorage, () => `generated-${++generated}`), 'generated-1');
identityStorage.setItem('orbit.device.id.v1', 'bad id');
assert.equal(getOrCreateDeviceId(identityStorage, () => `generated-${++generated}`), 'generated-2');

const bus = channelBus();
const pcStorage = memoryStorage();
const phoneStorage = memoryStorage();
const pc = createCompanionRuntime({ deviceId:'pc-main', deviceType:'pc', storage:pcStorage, channelFactory:()=>bus.create(), now:()=>clock });
const phone = createCompanionRuntime({ deviceId:'iphone-main', deviceType:'iphone', storage:phoneStorage, channelFactory:()=>bus.create(), now:()=>clock });
assert.equal(bus.size(), 2);

clock = 1100;
pc.updateShared({ activeView:'missions', mission:{id:'companion',label:'Geräte verbinden'}, voice:{state:'thinking'} });
assert.equal(phone.snapshot().shared.activeView.value, 'missions');
assert.equal(phone.snapshot().shared.mission.value.id, 'companion');
assert.equal(phone.snapshot().shared.voice.value.state, 'thinking');

clock = 1200;
const event = pc.requestHandoff('iphone-main', 'missions', 'handoff-runtime-1');
assert.equal(event.id, 'handoff-runtime-1');
assert.equal(phone.pendingHandoff()?.targetDeviceId, 'iphone-main');
clock = 1300;
phone.acknowledgeHandoff('handoff-runtime-1');
assert.equal(pc.snapshot().shared.handoff.value.status, 'acknowledged');

const persistedPhone = JSON.parse(phoneStorage.getItem('orbit.companion.state.v1'));
assert.equal(persistedPhone.shared.handoff.value.status, 'acknowledged');
phone.dispose();
assert.equal(bus.size(), 1);

const resumedPhone = createCompanionRuntime({ deviceId:'iphone-main', deviceType:'iphone', storage:phoneStorage, channelFactory:()=>bus.create(), now:()=>clock });
assert.equal(resumedPhone.snapshot().shared.mission.value.id, 'companion');
assert.equal(resumedPhone.pendingHandoff(), null);

const dirtyRemote = pc.snapshot();
dirtyRemote.syncKey = 'secret';
dirtyRemote.shared.voice.value.token = 'secret';
clock = 1400;
resumedPhone.ingest(dirtyRemote);
assert.doesNotMatch(JSON.stringify(resumedPhone.snapshot()), /secret|syncKey|token/);

pc.dispose();
resumedPhone.dispose();
assert.equal(bus.size(), 0);
assert.throws(()=>pc.updateShared({activeView:'dashboard'}), /RUNTIME_DISPOSED/);

console.log('ORBIT Companion runtime contracts passed');
