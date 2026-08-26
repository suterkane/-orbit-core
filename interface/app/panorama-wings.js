(()=>{
  'use strict';
  
  // ============= PANORAMA WINGS: LIVE-DATEN SYSTEM =============
  // Left Wing: Briefing (Vault-Daten, Wetter, Nächste Aufgabe)
  // Right Wing: Crypto-Live + Gmail-Status + Aufgaben-Counter
  
  const REFRESH_INTERVALS={
    vault:600000,      // 10 minutes
    crypto:30000,      // 30 seconds (live)
    gmail:300000,      // 5 minutes
    weather:600000,    // 10 minutes
    tasks:120000       // 2 minutes
  };
  
  const CRYPTO_SYMBOLS=['BTC','ETH','SOL'];
  const VAULT_ENDPOINT='https://api.open-meteo.com/v1/forecast'; // Fallback endpoint
  
  let state={
    vault:{},
    crypto:{},
    gmail:{unread:0,subject:''},
    weather:{temp:0,weather:'',wind:0},
    tasks:{today:0,overdue:0,total:0}
  };
  
  // ===== Utility Functions =====
  const qs=selector=>document.querySelector(selector);
  const qsa=selector=>document.querySelectorAll(selector);
  const setText=(id,text)=>{const el=qs(`#${id}`);if(el)el.textContent=text;};
  const setHTML=(id,html)=>{const el=qs(`#${id}`);if(el)el.innerHTML=html;};
  
  // ===== WETTER (Open-Meteo) =====
  async function fetchWeather(){
    try{
      const lat=52.52, lon=13.40; // Berlin (customize if needed)
      const url=`${VAULT_ENDPOINT}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe/Berlin`;
      const r=await fetch(url,{cache:'no-store'});
      const data=await r.json();
      const current=data.current;
      const temp=Math.round(current.temperature_2m);
      const weather=describeWeatherCode(current.weather_code);
      const wind=Math.round(current.wind_speed_10m);
      
      state.weather={temp,weather,wind};
      updateWeatherDisplay();
      return state.weather;
    }catch(e){
      console.warn('[PANORAMA] Weather fetch failed:',e.message);
      return state.weather;
    }
  }
  
  function describeWeatherCode(code){
    const map={
      0:'☀ Klar',1:'🌤 Meist klar',2:'⛅ Teilweise bewölkt',3:'☁ Bewölkt',
      45:'🌫 Neblig',48:'🌫 Rauhreif',51:'🌦 Nieseln',53:'🌧 Nieselregen',
      61:'🌧 Regen',63:'🌧 Mässiger Regen',65:'⛈ Starker Regen',
      71:'❄ Schneefall',80:'🌧 Regenschauer',95:'⛈ Gewitter'
    };
    return map[code]||'🌡 Bedeckt';
  }
  
  function updateWeatherDisplay(){
    const w=state.weather;
    setText('panorama-weather',`${w.temp}° ${w.weather}`);
    setText('panorama-weather-detail',`Wind ${w.wind} km/h`);
  }
  
  // ===== CRYPTO LIVE (CoinGecko API, kostenlos) =====
  async function fetchCrypto(){
    try{
      const ids=CRYPTO_SYMBOLS.join(',').toLowerCase();
      const url=`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24h_change=true`;
      const r=await fetch(url,{cache:'no-store'});
      const data=await r.json();
      
      state.crypto={};
      CRYPTO_SYMBOLS.forEach(sym=>{
        const key=sym.toLowerCase();
        const price=data[key]?.eur||0;
        const change=data[key]?.eur_24h_change||0;
        state.crypto[sym]={price:Math.round(price*100)/100,change:Math.round(change*100)/100};
      });
      
      updateCryptoDisplay();
      return state.crypto;
    }catch(e){
      console.warn('[PANORAMA] Crypto fetch failed:',e.message);
      return state.crypto;
    }
  }
  
  function updateCryptoDisplay(){
    const container=qs('#panorama-crypto-list');
    if(!container)return;
    
    let html='';
    Object.entries(state.crypto).forEach(([sym,data])=>{
      const arrow=data.change>=0?'📈':'📉';
      const color=data.change>=0?'#00e5ff':'#ff6b6b';
      html+=`<div class="crypto-item">
        <span class="crypto-symbol">${sym}</span>
        <span class="crypto-price">€${data.price.toFixed(2)}</span>
        <span class="crypto-change" style="color:${color}">${arrow} ${Math.abs(data.change).toFixed(1)}%</span>
      </div>`;
    });
    
    container.innerHTML=html;
  }
  
  // ===== GMAIL STATUS =====
  async function fetchGmailStatus(){
    try{
      const mailStatus=qs('#panoramaMail');
      const mailCount=qs('#mailCount');
      
      // Versuche aus lokalen UI-Elementen zu lesen
      let unread=0;
      if(mailStatus){
        const text=mailStatus.textContent||'';
        const match=text.match(/\\d+/);
        if(match)unread=parseInt(match[0],10);
      }
      
      state.gmail={
        unread,
        status:unread?`${unread} ungelesen`:'Posteingän aktuell'
      };
      
      updateGmailDisplay();
      return state.gmail;
    }catch(e){
      console.warn('[PANORAMA] Gmail check failed:',e.message);
      return state.gmail;
    }
  }
  
  function updateGmailDisplay(){
    const badge=qs('#panorama-gmail-badge');
    const status=qs('#panorama-gmail-status');
    
    if(badge){
      badge.textContent=state.gmail.unread;
      badge.style.visibility=state.gmail.unread?'visible':'hidden';
    }
    if(status){
      status.textContent=state.gmail.status;
    }
  }
  
  // ===== AUFGABEN-COUNTER =====
  async function fetchTasksStatus(){
    try{
      // Lese aus UI-Elementen
      let today=0, overdue=0, total=0;
      
      const todayEl=qs('#todayCount');
      const overdueEl=qs('#overdueCount');
      const openEl=qs('#openCount');
      
      if(todayEl)today=parseInt(todayEl.textContent,10)||0;
      if(overdueEl)overdue=parseInt(overdueEl.textContent,10)||0;
      if(openEl)total=parseInt(openEl.textContent,10)||0;
      
      state.tasks={today,overdue,total};
      updateTasksDisplay();
      return state.tasks;
    }catch(e){
      console.warn('[PANORAMA] Tasks fetch failed:',e.message);
      return state.tasks;
    }
  }
  
  function updateTasksDisplay(){
    const t=state.tasks;
    setText('panorama-tasks-counter',`${t.total} offen`);
    setText('panorama-tasks-today',`${t.today} heute`);
    setText('panorama-tasks-overdue',`${t.overdue} überfällig`);
    
    // Aktualisiere auch die Modul-Anzeige
    const module=qs('[data-task-module]');
    if(module){
      let priority='Keine aktiven Aufgaben';
      if(t.overdue>0)priority=`⚠ ${t.overdue} überfällig`;
      else if(t.today>0)priority=`📅 ${t.today} heute fällig`;
      else if(t.total>0)priority=`📋 ${t.total} geplant`;
      
      const strong=module.querySelector('strong');
      if(strong)strong.textContent=priority;
    }
  }
  
  // ===== VAULT DATEN (Simulated/Local) =====
  async function fetchVaultData(){
    try{
      // Simulierte Vault-Daten aus LocalStorage oder Fallback
      const stored=localStorage.getItem('orbit.vault.briefing')||'{}';
      const data=JSON.parse(stored);
      
      state.vault={
        focus:data.focus||'ORBIT · FRIDAY',
        mission:data.mission||'Mission 21 · Begleiter',
        status:data.status||'ONLINE'
      };
      
      updateVaultDisplay();
      return state.vault;
    }catch(e){
      console.warn('[PANORAMA] Vault fetch failed:',e.message);
      return state.vault;
    }
  }
  
  function updateVaultDisplay(){
    setText('panorama-vault-focus',state.vault.focus);
    setText('panorama-vault-mission',state.vault.mission);
  }
  
  // ===== DISPLAY UPDATES =====
  function updateLeftWing(){
    // Weather
    updateWeatherDisplay();
    
    // Next Task / Priority
    const nextTask=state.tasks.overdue?'Überfällige Aufgabe':
                  state.tasks.today?'Aufgabe heute':
                  'Keine geplante Aufgabe';
    setText('panorama-priority',nextTask);
    
    // Vault focus
    updateVaultDisplay();
  }
  
  function updateRightWing(){
    updateCryptoDisplay();
    updateGmailDisplay();
    updateTasksDisplay();
  }
  
  // ===== REFRESH SCHEDULER =====
  const refreshTasks={};
  
  function scheduleRefresh(key,interval,fetchFn){
    if(refreshTasks[key])clearInterval(refreshTasks[key]);
    
    // Sofort laden
    fetchFn().catch(e=>console.error(`[PANORAMA] Initial fetch ${key} failed:`,e));
    
    // Dann periodisch
    refreshTasks[key]=setInterval(()=>{
      fetchFn().catch(e=>console.error(`[PANORAMA] Refresh ${key} failed:`,e));
    },interval);
  }
  
  function startAllRefreshes(){
    scheduleRefresh('vault',REFRESH_INTERVALS.vault,fetchVaultData);
    scheduleRefresh('crypto',REFRESH_INTERVALS.crypto,fetchCrypto);
    scheduleRefresh('gmail',REFRESH_INTERVALS.gmail,fetchGmailStatus);
    scheduleRefresh('weather',REFRESH_INTERVALS.weather,fetchWeather);
    scheduleRefresh('tasks',REFRESH_INTERVALS.tasks,fetchTasksStatus);
  }
  
  function stopAllRefreshes(){
    Object.values(refreshTasks).forEach(id=>clearInterval(id));
  }
  
  // ===== INITIALIZATION =====
  function init(){
    const params=new URLSearchParams(location.search);
    if(params.get('panorama')!=='dual')return;
    
    console.log('[PANORAMA] Wings system initializing...');
    
    // Wait for DOM
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',()=>startAllRefreshes());
    }else{
      startAllRefreshes();
    }
  }
  
  // ===== PUBLIC API =====
  window.ORBITPanoramaWings={
    state,
    fetchWeather,
    fetchCrypto,
    fetchGmailStatus,
    fetchTasksStatus,
    fetchVaultData,
    startRefreshes:startAllRefreshes,
    stopRefreshes:stopAllRefreshes,
    telemetry:()=>({
      state,
      refreshTasks:Object.keys(refreshTasks),
      active:Object.keys(refreshTasks).length>0
    })
  };
  
  // Start
  init();
})();
