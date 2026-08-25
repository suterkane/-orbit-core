(function(root,factory){
  const stateApi=typeof module!=='undefined'&&module.exports?require('./companion-state.js'):root.ORBITCompanionState;
  const api=factory(stateApi);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.ORBITCompanionSyncFactory=api;
})(typeof window!=='undefined'?window:globalThis,function(defaultStateApi){
  'use strict';

  function createCompanionSyncAdapter({stateApi=defaultStateApi,runtime}={}){
    if(!stateApi||!runtime)throw new Error('COMPANION_SYNC_DEPENDENCY');
    function pack(entries){return stateApi.packSyncEntries(entries,runtime.snapshot())}
    function ingest(payload){
      const unpacked=stateApi.unpackSyncEntries(payload),before=JSON.stringify(runtime.snapshot());
      let companion=null;
      if(unpacked.companion)companion=runtime.ingest(unpacked.companion);
      const changed=!!companion&&JSON.stringify(runtime.snapshot())!==before;
      return{entries:unpacked.entries,companion,changed};
    }
    return{pack,ingest};
  }

  return{createCompanionSyncAdapter};
});
