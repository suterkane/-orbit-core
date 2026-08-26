// FRIDAY v2 Storage — IndexedDB + LocalStorage
(()=>{
  let db=null;
  const DB_NAME='ORBIT_V2';
  const DB_VERSION=1;
  let initPromise=null;
  
  async function initDB(){
    // Return existing promise if already initializing (prevent race condition)
    if(initPromise)return initPromise;
    
    initPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onerror=()=>reject(req.error);
      req.onsuccess=()=>{
        db=req.result;
        resolve(db);
      };
      req.onupgradeneeded=(e)=>{
        const db=e.target.result;
        if(!db.objectStoreNames.contains('briefing')){
          db.createObjectStore('briefing',{keyPath:'id'});
        }
        if(!db.objectStoreNames.contains('state')){
          db.createObjectStore('state',{keyPath:'key'});
        }
      };
    });
    
    return initPromise;
  }
  
  async function saveBriefing(data){
    if(!db)await initDB();
    const tx=db.transaction(['briefing'],'readwrite');
    const store=tx.objectStore('briefing');
    return new Promise((resolve,reject)=>{
      const req=store.put({id:'latest',data,timestamp:Date.now()});
      req.onerror=()=>reject(req.error);
      req.onsuccess=()=>resolve();
    });
  }
  
  async function getBriefing(){
    if(!db)await initDB();
    const tx=db.transaction(['briefing'],'readonly');
    const store=tx.objectStore('briefing');
    return new Promise((resolve,reject)=>{
      const req=store.get('latest');
      req.onerror=()=>reject(req.error);
      req.onsuccess=()=>resolve(req.result?.data||null);
    });
  }
  
  function saveState(key,value){
    localStorage.setItem('ORBIT_'+key,JSON.stringify(value));
  }
  
  function getState(key){
    const val=localStorage.getItem('ORBIT_'+key);
    return val?JSON.parse(val):null;
  }
  
  window.ORBITStorageV2={initDB,saveBriefing,getBriefing,saveState,getState};
})();
