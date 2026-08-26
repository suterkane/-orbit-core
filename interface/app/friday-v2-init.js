// FRIDAY v2 Init — warte bis alle Module geladen sind
(()=>{
  const INIT_TIMEOUT=5000;
  const requiredModules=['ORBITStorageV2','ORBITNeuralCore','FRIDAY'];
  let initTimer=null;
  
  function checkReady(){
    const ready=requiredModules.every(m=>window[m]);
    if(ready){
      clearTimeout(initTimer);
      console.log('✓ FRIDAY v2 modules ready',{storage:!!window.ORBITStorageV2,neural:!!window.ORBITNeuralCore,ai:!!window.FRIDAY});
      document.dispatchEvent(new Event('FRIDAYv2Ready'));
      window.ORBITStorageV2?.initDB?.();
      return true;
    }
    return false;
  }
  
  // Check jede 100ms
  const checkInterval=setInterval(()=>{
    if(checkReady()){
      clearInterval(checkInterval);
    }
  },100);
  
  // Timeout nach 5s
  initTimer=setTimeout(()=>{
    clearInterval(checkInterval);
    console.warn('⚠ FRIDAY v2 init timeout',{storage:!!window.ORBITStorageV2,neural:!!window.ORBITNeuralCore,ai:!!window.FRIDAY});
  },INIT_TIMEOUT);
  
  window.FRIDAYv2Init={checkReady};
})();
