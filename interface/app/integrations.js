(()=>{
  const GOOGLE_GATEWAY='https://vhmokhunkvoctavmrjwl.supabase.co/functions/v1/google-oauth';
  const SYNC_KEY_STORAGE='orbit.sync.key.v1';

  function qs(s){return document.querySelector(s)}
  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function getSyncKey(interactive=false){
    let key=(localStorage.getItem(SYNC_KEY_STORAGE)||'').trim();
    if(!key&&interactive){
      const entered=prompt('Für die sichere Google-Verbindung einmal den ORBIT Sync-Code eingeben.');
      if(entered){key=entered.trim();localStorage.setItem(SYNC_KEY_STORAGE,key)}
    }
    return key;
  }

  async function gateway(path,{interactive=false}={}){
    const key=getSyncKey(interactive);
    if(!key)throw new Error('NO_KEY');
    const r=await fetch(`${GOOGLE_GATEWAY}${path}`,{headers:{'x-orbit-sync-key':key,'Accept':'application/json'}});
    let data={};try{data=await r.json()}catch{}
    if(!r.ok){const err=new Error(data?.error||`HTTP_${r.status}`);err.status=r.status;err.data=data;throw err}
    return data;
  }

  function openTaskDialog(){
    try{
      if(typeof window.openDialog==='function')window.openDialog();
      else qs('#newEntryBtn')?.click();
      const cat=qs('#editCategory');
      if(cat)cat.value='task';
      const due=qs('#editDue');
      if(due&&!due.value){
        const d=new Date();
        due.value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
      }
      qs('#editText')?.focus();
      const status=qs('#taskQuickStatus');
      if(status)status.textContent='Aufgabenmodus geöffnet.';
    }catch{}
  }

  function setGoogleStatus(text){
    if(qs('#mailStatus'))qs('#mailStatus').textContent=text;
    if(qs('#calendarStatus'))qs('#calendarStatus').textContent=text;
  }

  function formatEventStart(v){
    if(!v)return'';
    const d=new Date(v.length===10?`${v}T12:00:00`:v);
    if(Number.isNaN(d.getTime()))return v;
    return new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',hour:v.length===10?undefined:'2-digit',minute:v.length===10?undefined:'2-digit'}).format(d);
  }

  function renderMail(data){
    const rows=Array.isArray(data?.messages)?data.messages:[];
    const preview=qs('#mailPreview');
    if(qs('#mailHeadline'))qs('#mailHeadline').textContent=rows.length?`${rows.length} aktuelle E-Mails`:'E-Mail';
    if(qs('#mailStatus'))qs('#mailStatus').textContent='Gmail · verbunden';
    if(!preview)return;
    if(!rows.length){preview.innerHTML='<span>Keine aktuellen Nachrichten im Posteingang.</span>';return}
    preview.innerHTML=rows.slice(0,3).map(m=>`<div class="integration-row"><b>${esc(m.subject||'(Ohne Betreff)')}</b><small>${esc(m.from||'')}</small></div>`).join('');
  }

  function renderCalendar(data){
    const rows=Array.isArray(data?.events)?data.events:[];
    const preview=qs('#calendarPreview');
    if(qs('#calendarHeadline'))qs('#calendarHeadline').textContent=rows.length?'Nächste Termine':'Kalender';
    if(qs('#calendarStatus'))qs('#calendarStatus').textContent='Google Kalender · verbunden';
    if(!preview)return;
    if(!rows.length){preview.innerHTML='<span>Keine kommenden Termine gefunden.</span>';return}
    preview.innerHTML=rows.slice(0,3).map(e=>`<div class="integration-row"><b>${esc(e.summary||'(Ohne Titel)')}</b><small>${esc(formatEventStart(e.start))}</small></div>`).join('');
  }

  async function loadGoogleData(){
    const key=getSyncKey(false);
    if(!key){setGoogleStatus('Google-Verbindung noch nicht eingerichtet');return}
    try{
      const status=await gateway('/status');
      if(!status.configured){setGoogleStatus('Google OAuth wartet auf Einrichtung');return}
      if(!status.connected){setGoogleStatus('Google-Verbindung erforderlich');return}
      setGoogleStatus('Live-Daten werden geladen …');
      const [mail,calendar]=await Promise.all([gateway('/data?resource=gmail'),gateway('/data?resource=calendar')]);
      renderMail(mail);renderCalendar(calendar);
      const mb=qs('#mailConnectBtn'),cb=qs('#calendarConnectBtn');
      if(mb)mb.textContent='Gmail aktualisieren';
      if(cb)cb.textContent='Kalender aktualisieren';
    }catch(err){
      if(err.message==='NO_KEY')setGoogleStatus('Google-Verbindung noch nicht eingerichtet');
      else setGoogleStatus('Google-Verbindung prüfen');
    }
  }

  async function connectGoogle(){
    setGoogleStatus('Google-Freigabe wird vorbereitet …');
    try{
      const data=await gateway('/start',{interactive:true});
      if(data?.url){window.location.assign(data.url);return}
      setGoogleStatus('Google-Freigabe konnte nicht gestartet werden');
    }catch(err){
      if(err.message==='NO_KEY')setGoogleStatus('ORBIT Sync-Code für sichere Verbindung erforderlich');
      else if(err.message==='google_not_configured')setGoogleStatus('Google OAuth wartet auf Client-Freigabe');
      else setGoogleStatus('Google-Freigabe konnte nicht gestartet werden');
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if(!window.ORBITCommandInput){
      const commandScript=document.createElement('script');
      commandScript.src='command-input.js?v=1';
      commandScript.defer=true;
      document.body.appendChild(commandScript);
    }

    qs('#taskQuickBtn')?.addEventListener('click',openTaskDialog);
    qs('#mailConnectBtn')?.addEventListener('click',async()=>{
      const status=qs('#mailStatus')?.textContent||'';
      if(status.includes('verbunden'))await loadGoogleData();else await connectGoogle();
    });
    qs('#calendarConnectBtn')?.addEventListener('click',async()=>{
      const status=qs('#calendarStatus')?.textContent||'';
      if(status.includes('verbunden'))await loadGoogleData();else await connectGoogle();
    });

    const params=new URLSearchParams(location.search);
    if(params.get('google')==='connected'){
      history.replaceState({},'',location.pathname);
      setGoogleStatus('Google verbunden · Live-Daten werden geladen …');
      loadGoogleData();
    }else if(params.get('google')==='error'){
      history.replaceState({},'',location.pathname);
      setGoogleStatus('Google-Freigabe abgebrochen');
    }else loadGoogleData();
  });

  window.ORBITIntegrations={openTaskDialog,connectGoogle,loadGoogleData};
})();