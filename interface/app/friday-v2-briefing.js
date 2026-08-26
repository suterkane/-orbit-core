// FRIDAY v2 Briefing — Obsidian Vault + Local Storage
(()=>{
  let cachedBriefing=null,lastUpdate=0;
  const UPDATE_INTERVAL=3600000; // 1 hour
  
  async function loadBriefing(){
    const now=Date.now();
    if(cachedBriefing&&(now-lastUpdate)<UPDATE_INTERVAL){
      return cachedBriefing;
    }
    
    try{
      const resp=await fetch('./vault_briefing.json?_='+Date.now(),{cache:'no-store'});
      if(!resp.ok)throw new Error('Vault briefing not found');
      const data=await resp.json();
      cachedBriefing=data;
      lastUpdate=now;
      
      // Store in IndexedDB for offline access
      if(window.ORBITStorageV2){
        window.ORBITStorageV2.saveBriefing(data);
      }
      
      return data;
    }catch(err){
      console.error('[BRIEFING] Error loading:',err);
      // Fallback to IndexedDB cached version
      if(window.ORBITStorageV2){
        return await window.ORBITStorageV2.getBriefing();
      }
      return null;
    }
  }
  
  async function formatBriefing(data){
    if(!data)return '';
    const parts=[];
    
    if(data.date)parts.push(`Heute ist ${data.date}.`);
    if(data.projects)parts.push(`Aktive Projekte: ${data.projects.slice(0,3).join(', ')}.`);
    if(data.crypto)parts.push(`Crypto: ${data.crypto.text || ''}`);
    if(data.health)parts.push(`Gesundheit: ${data.health}`);
    
    return parts.filter(Boolean).join(' ');
  }
  
  window.ORBITBriefingV2={loadBriefing,formatBriefing};
})();
