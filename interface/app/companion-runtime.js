(function(root,factory){
  const stateApi=typeof module!=='undefined'&&module.exports?require('./companion-state.js'):root.ORBITCompanionState;
  const api=factory(stateApi,root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.ORBITCompanionRuntimeFactory=api;
})(typeof window!=='undefined'?window:globalThis,function(stateApi,root){
  'use strict';

  const STORAGE_KEY='orbit.companion.state.v1';
  const DEVICE_ID_KEY='orbit.device.id.v1';
  const CHANNEL_NAME='orbit-companion-v1';
  const VALID_DEVICE_ID=/^[A-Za-z0-9_-]{3,64}$/;

  function resolveDeviceType(navigatorLike={}){
    const userAgent=String(navigatorLike.userAgent||''),platform=String(navigatorLike.platform||'');
    return /iPhone|iPad|iPod/i.test(userAgent)||platform==='iPhone'||platform==='iPad'||(platform==='MacIntel'&&Number(navigatorLike.maxTouchPoints)>1)?'iphone':'pc';
  }

  function getOrCreateDeviceId(storage,generator){
    const saved=String(storage?.getItem(DEVICE_ID_KEY)||'');
    if(VALID_DEVICE_ID.test(saved))return saved;
    const create=generator||(()=>`device-${root.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)}`);
    const generated=String(create());
    if(!VALID_DEVICE_ID.test(generated))throw new Error('DEVICE_ID');
    storage?.setItem(DEVICE_ID_KEY,generated);return generated;
  }

  function createCompanionRuntime({deviceId,deviceType,storage=root.localStorage,channelFactory,now=Date.now}={}){
    if(!stateApi)throw new Error('COMPANION_STATE_REQUIRED');
    let disposed=false,listeners=new Set(),channel=null;
    const fresh=stateApi.createCompanionState({deviceId,deviceType,now:now()});
    let current=fresh;
    try{
      const saved=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');
      if(saved&&typeof saved==='object')current=stateApi.reduceCompanionState(saved,{type:'presence',status:'online'},{deviceId,deviceType,now:now()});
    }catch{}

    function ensureActive(){if(disposed)throw new Error('RUNTIME_DISPOSED')}
    function persist(){try{storage?.setItem(STORAGE_KEY,JSON.stringify(stateApi.sanitizeCompanionState(current)))}catch{}}
    function notify(){const value=snapshot();for(const listener of listeners)listener(value)}
    function publish(){try{channel?.postMessage(stateApi.sanitizeCompanionState(current))}catch{}}
    function commit(next,{broadcast=true}={}){current=stateApi.sanitizeCompanionState(next);persist();notify();if(broadcast)publish();return snapshot()}
    function snapshot(){return stateApi.sanitizeCompanionState(current)}
    function ingest(remote){
      ensureActive();
      const merged=stateApi.mergeCompanionState(current,remote);
      if(JSON.stringify(merged)!==JSON.stringify(current))commit(merged,{broadcast:false});
      return snapshot();
    }
    function updateShared(patch){ensureActive();return commit(stateApi.reduceCompanionState(current,{type:'shared-update',patch},{deviceId,deviceType,now:now()}))}
    function heartbeat(status='online'){ensureActive();return commit(stateApi.reduceCompanionState(current,{type:'presence',status},{deviceId,deviceType,now:now()}))}
    function requestHandoff(targetDeviceId,route,eventId){
      ensureActive();
      const next=stateApi.reduceCompanionState(current,{type:'handoff-request',targetDeviceId,route},{deviceId,deviceType,now:now(),eventId});
      commit(next);return snapshot().shared.handoff.value;
    }
    function acknowledgeHandoff(handoffId){ensureActive();return commit(stateApi.reduceCompanionState(current,{type:'handoff-ack',handoffId},{deviceId,deviceType,now:now()}))}
    function pendingHandoff(){const value=current.shared.handoff.value;return value?.status==='pending'&&value.targetDeviceId===deviceId?JSON.parse(JSON.stringify(value)):null}
    function subscribe(listener){ensureActive();if(typeof listener!=='function')throw new Error('LISTENER');listeners.add(listener);return()=>listeners.delete(listener)}
    function dispose(){if(disposed)return;disposed=true;try{channel?.close()}catch{}channel=null;listeners.clear()}

    const makeChannel=channelFactory||((name)=>typeof root.BroadcastChannel==='function'?new root.BroadcastChannel(name):null);
    channel=makeChannel?.(CHANNEL_NAME)||null;
    if(channel)channel.onmessage=event=>{if(!disposed&&event?.data)ingest(event.data)};
    persist();
    return{snapshot,ingest,updateShared,heartbeat,requestHandoff,acknowledgeHandoff,pendingHandoff,subscribe,dispose,deviceId,deviceType};
  }

  return{STORAGE_KEY,DEVICE_ID_KEY,CHANNEL_NAME,resolveDeviceType,getOrCreateDeviceId,createCompanionRuntime};
});
