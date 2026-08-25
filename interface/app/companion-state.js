(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.ORBITCompanionState=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const PROTOCOL_VERSION=1;
  const COMPANION_ENTRY_ID='__orbit_companion_state_v1__';
  const DEVICE_TYPES=new Set(['pc','iphone']);
  const VOICE_STATES=new Set(['idle','listening','thinking','speaking','confirm','error']);
  const SHARED_FIELDS=['activeView','voice','mission','conversation','handoff'];
  const DEVICE_ID=/^[A-Za-z0-9_-]{3,64}$/;

  function validDeviceId(value){if(!DEVICE_ID.test(String(value||'')))throw new Error('DEVICE_ID');return String(value)}
  function validDeviceType(value){if(!DEVICE_TYPES.has(value))throw new Error('DEVICE_TYPE');return value}
  function stamp(value,at,by){return{value,at:Number(at)||0,by:String(by||'')}}
  function clone(value){return JSON.parse(JSON.stringify(value))}
  function cleanText(value,max=500){return String(value||'').slice(0,max)}
  function cleanView(value){return/^[a-z][a-z0-9-]{0,31}$/.test(String(value||''))?String(value):'dashboard'}
  function cleanVoice(value){const state=VOICE_STATES.has(value?.state)?value.state:'idle';return{state}}
  function cleanMission(value){return{id:cleanText(value?.id,80),label:cleanText(value?.label,180)}}
  function cleanConversation(value){return{turnId:cleanText(value?.turnId,96),userText:cleanText(value?.userText),replyText:cleanText(value?.replyText)}}
  function cleanHandoff(value){
    if(!value)return null;
    const status=value.status==='acknowledged'?'acknowledged':'pending';
    return{id:cleanText(value.id,96),sourceDeviceId:cleanText(value.sourceDeviceId,64),targetDeviceId:cleanText(value.targetDeviceId,64),route:cleanView(value.route),status,acknowledgedBy:status==='acknowledged'?cleanText(value.acknowledgedBy,64):''};
  }
  const cleaners={activeView:cleanView,voice:cleanVoice,mission:cleanMission,conversation:cleanConversation,handoff:cleanHandoff};

  function createCompanionState({deviceId,deviceType,now=Date.now()}={}){
    const id=validDeviceId(deviceId),type=validDeviceType(deviceType),at=Number(now)||0;
    return{version:PROTOCOL_VERSION,revision:0,updatedAt:at,updatedBy:id,devices:{[id]:{id,type,status:'online',lastSeen:at}},shared:{
      activeView:stamp('dashboard',at,id),voice:stamp({state:'idle'},at,id),mission:stamp({id:'',label:''},at,id),conversation:stamp({turnId:'',userText:'',replyText:''},at,id),handoff:stamp(null,at,id)
    }};
  }

  function sanitizeCompanionState(input){
    const state=input&&typeof input==='object'?input:{};
    const devices={};
    for(const [key,raw] of Object.entries(state.devices||{})){
      if(!DEVICE_ID.test(key)||!raw||!DEVICE_TYPES.has(raw.type))continue;
      devices[key]={id:key,type:raw.type,status:raw.status==='offline'?'offline':'online',lastSeen:Math.max(0,Number(raw.lastSeen)||0)};
    }
    const shared={};
    for(const field of SHARED_FIELDS){
      const raw=state.shared?.[field]||{};
      shared[field]=stamp(cleaners[field](raw.value),Math.max(0,Number(raw.at)||0),DEVICE_ID.test(String(raw.by||''))?String(raw.by):'system');
    }
    const updatedAt=Math.max(0,Number(state.updatedAt)||0);
    const updatedBy=DEVICE_ID.test(String(state.updatedBy||''))?String(state.updatedBy):'system';
    return{version:PROTOCOL_VERSION,revision:Math.max(0,Math.floor(Number(state.revision)||0)),updatedAt,updatedBy,devices,shared};
  }

  function compareStamped(a,b){
    if(a.at!==b.at)return a.at-b.at;
    if(a.by!==b.by)return a.by.localeCompare(b.by);
    return JSON.stringify(a.value).localeCompare(JSON.stringify(b.value));
  }

  function mergeCompanionState(left,right){
    const a=sanitizeCompanionState(left),b=sanitizeCompanionState(right),devices={};
    for(const id of new Set([...Object.keys(a.devices),...Object.keys(b.devices)])){
      const x=a.devices[id],y=b.devices[id];
      if(!x)devices[id]=y;else if(!y)devices[id]=x;else devices[id]=y.lastSeen>x.lastSeen?y:y.lastSeen<x.lastSeen?x:(JSON.stringify(y).localeCompare(JSON.stringify(x))>=0?y:x);
    }
    const shared={};
    for(const field of SHARED_FIELDS)shared[field]=compareStamped(a.shared[field],b.shared[field])>=0?a.shared[field]:b.shared[field];
    const updatedAt=Math.max(a.updatedAt,b.updatedAt),candidates=[a,b].filter(state=>state.updatedAt===updatedAt),updatedBy=candidates.map(state=>state.updatedBy).sort().at(-1)||'system';
    return sanitizeCompanionState({version:PROTOCOL_VERSION,revision:Math.max(a.revision,b.revision),updatedAt,updatedBy,devices,shared});
  }

  function reduceCompanionState(input,action={},meta={}){
    const state=sanitizeCompanionState(input),deviceId=validDeviceId(meta.deviceId),now=Number(meta.now)||Date.now(),existing=state.devices[deviceId],deviceType=validDeviceType(meta.deviceType||existing?.type);
    state.devices[deviceId]={id:deviceId,type:deviceType,status:action.status==='offline'?'offline':'online',lastSeen:now};
    if(action.type==='shared-update'){
      for(const [field,value] of Object.entries(action.patch||{}))if(SHARED_FIELDS.includes(field)&&field!=='handoff')state.shared[field]=stamp(cleaners[field](value),now,deviceId);
    }else if(action.type==='handoff-request'){
      const target=validDeviceId(action.targetDeviceId),id=cleanText(meta.eventId,96);if(!id)throw new Error('HANDOFF_ID');
      state.shared.handoff=stamp({id,sourceDeviceId:deviceId,targetDeviceId:target,route:cleanView(action.route),status:'pending',acknowledgedBy:''},now,deviceId);
    }else if(action.type==='handoff-ack'){
      const current=state.shared.handoff.value;if(!current||current.id!==action.handoffId)throw new Error('HANDOFF_MISMATCH');
      state.shared.handoff=stamp({...current,status:'acknowledged',acknowledgedBy:deviceId},now,deviceId);
    }else if(action.type!=='presence')throw new Error('ACTION_TYPE');
    state.revision+=1;state.updatedAt=now;state.updatedBy=deviceId;
    return sanitizeCompanionState(state);
  }

  function listOnlineDevices(input,now=Date.now(),ttl=45000){
    const state=sanitizeCompanionState(input),threshold=Math.max(0,Number(ttl)||0);
    return Object.values(state.devices).filter(device=>device.status==='online'&&Number(now)-device.lastSeen<=threshold).sort((a,b)=>a.id.localeCompare(b.id));
  }

  function packSyncEntries(entries,state){
    const userEntries=Array.isArray(entries)?entries.filter(entry=>entry&&entry.id!==COMPANION_ENTRY_ID):[];
    return[...clone(userEntries),{id:COMPANION_ENTRY_ID,category:'system',companionState:sanitizeCompanionState(state)}];
  }

  function unpackSyncEntries(payload){
    if(!Array.isArray(payload))return{entries:[],companion:null};
    const entries=[],envelopes=[];
    for(const entry of payload){
      if(entry&&entry.id===COMPANION_ENTRY_ID)envelopes.push(entry);
      else if(entry&&typeof entry==='object')entries.push(clone(entry));
    }
    const raw=envelopes.at(-1)?.companionState;
    const valid=raw&&typeof raw==='object'&&!Array.isArray(raw)&&raw.version===PROTOCOL_VERSION;
    return{entries,companion:valid?sanitizeCompanionState(raw):null};
  }

  return{PROTOCOL_VERSION,COMPANION_ENTRY_ID,createCompanionState,sanitizeCompanionState,mergeCompanionState,reduceCompanionState,listOnlineDevices,packSyncEntries,unpackSyncEntries};
});
