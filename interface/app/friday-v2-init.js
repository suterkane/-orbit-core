// FRIDAY v2 Init — warte bis alle Module geladen sind
(()=>{
  const INIT_TIMEOUT=5000;
  const requiredModules=['ORBITStorageV2','ORBITNeuralCore','ORBITFridayAI','ORBITVoiceV2'];
  let initTimer=null;
  
  function checkReady(){
    const ready=requiredModules.every(m=>window[m]);
    if(ready){
      clearTimeout(initTimer);
      console.log('✓ FRIDAY v2 modules ready',{
        storage:!!window.ORBITStorageV2,
        neural:!!window.ORBITNeuralCore,
        ai:!!window.ORBITFridayAI,
        voice:!!window.ORBITVoiceV2
      });
      document.dispatchEvent(new Event('FRIDAYv2Ready'));
      window.ORBITStorageV2?.initDB?.();
      window.ORBITFridayAI?.init?.();
      window.ORBITVoiceV2?.initVoice?.();
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
  
  // Timeout nach 5s (fallback starte trotzdem)
  initTimer=setTimeout(()=>{
    clearInterval(checkInterval);
    console.warn('⚠ FRIDAY v2 init timeout',{
      storage:!!window.ORBITStorageV2,
      neural:!!window.ORBITNeuralCore,
      ai:!!window.ORBITFridayAI,
      voice:!!window.ORBITVoiceV2
    });
    document.dispatchEvent(new Event('FRIDAYv2Ready'));
  },INIT_TIMEOUT);
  
  window.FRIDAYv2Init={checkReady};
})();
