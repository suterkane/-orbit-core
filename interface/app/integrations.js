(()=>{
  const GOOGLE_GATEWAY='https://vhmokhunkvoctavmrjwl.supabase.co/functions/v1/google-oauth';
  const SYNC_KEY_STORAGE='orbit.sync.key.v1';
  let calendarRows=[];
  let mailRows=[];
  let dashboardOverlay={today:0,week:0,expectedToday:null,expectedWeek:null};

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
    const r=await fetch(`${GOOGLE_GATEWAY}${path}`,{headers:{'x-orbit-sync-key':key,'Accept':'application/json'},cache:'no-store'});
    const raw=await r.text();
    let data={};
    try{data=raw?JSON.parse(raw):{}}catch{throw new Error('INVALID_RESPONSE')}
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

  function eventDate(v){
    if(!v)return null;
    const d=new Date(v.length===10?`${v}T12:00:00`:v);
    return Number.isNaN(d.getTime())?null:d;
  }

  function dayKey(d){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function applyCalendarToDashboard(){
    const todayEl=qs('#todayCount'),weekEl=qs('#weekCount'),hero=qs('#heroText'),focus=qs('#nextFocus');
    if(!todayEl||!weekEl)return;
    const now=new Date(),todayKey=dayKey(now),weekEnd=new Date(now);
    weekEnd.setDate(weekEnd.getDate()+7);
    const dated=calendarRows.map(e=>({event:e,date:eventDate(e.start)})).filter(x=>x.date);
    const calendarToday=dated.filter(x=>dayKey(x.date)===todayKey).length;
    const calendarWeek=dated.filter(x=>x.date>now&&x.date<=weekEnd&&dayKey(x.date)!==todayKey).length;
    const shownToday=Number(todayEl.textContent)||0;
    const shownWeek=Number(weekEl.textContent)||0;
    const taskToday=dashboardOverlay.expectedToday!==null&&shownToday===dashboardOverlay.expectedToday?Math.max(0,shownToday-dashboardOverlay.today):shownToday;
    const taskWeek=dashboardOverlay.expectedWeek!==null&&shownWeek===dashboardOverlay.expectedWeek?Math.max(0,shownWeek-dashboardOverlay.week):shownWeek;
    const combinedToday=taskToday+calendarToday;
    const combinedWeek=taskWeek+calendarWeek;
    todayEl.textContent=combinedToday;
    weekEl.textContent=combinedWeek;
    dashboardOverlay={today:calendarToday,week:calendarWeek,expectedToday:combinedToday,expectedWeek:combinedWeek};
    const overdue=Number(qs('#overdueCount')?.textContent)||0;
    if(overdue===0){
      if(combinedToday>0&&hero)hero.textContent=`${combinedToday} Termin${combinedToday===1?' oder Aufgabe':'e oder Aufgaben'} heute im Fokus.`;
      else if(combinedWeek>0&&hero)hero.textContent=`${combinedWeek} Termin${combinedWeek===1?' oder Aufgabe':'e oder Aufgaben'} in den nächsten sieben Tagen.`;
    }
    const upcoming=dated.filter(x=>x.date>=now).sort((a,b)=>a.date-b.date)[0];
    if(upcoming&&focus){
      const strong=focus.querySelector('strong'),small=focus.querySelector('small');
      const current=strong?.textContent||'';
      if(!current||current==='Keine geplante Aufgabe'||current===focus.dataset.calendarTitle){
        if(strong)strong.textContent=upcoming.event.summary||'Kalendertermin';
        if(small)small.textContent=`${formatEventStart(upcoming.event.start)} · Google Kalender`;
        focus.dataset.calendarTitle=upcoming.event.summary||'Kalendertermin';
        focus.onclick=null;
      }
    }
  }

  function ensureMailDialog(){
    let dialog=qs('#mailReaderDialog');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='mailReaderDialog';
    dialog.innerHTML='<div class="dialog-head"><div><span class="eyebrow">GMAIL / ORBIT</span><h3 id="mailReaderSubject">E-Mail</h3></div><button id="mailReaderClose" class="icon-btn" type="button">×</button></div><p id="mailReaderMeta"></p><div id="mailReaderBody"></div>';
    document.body.appendChild(dialog);
    const body=dialog.querySelector('#mailReaderBody');
    body.style.whiteSpace='pre-wrap';body.style.lineHeight='1.55';body.style.maxHeight='58vh';body.style.overflow='auto';body.style.padding='14px 0';body.style.color='#e8ddd4';body.style.fontSize='13px';
    const meta=dialog.querySelector('#mailReaderMeta');meta.style.color='#b9a99f';meta.style.fontSize='11px';meta.style.lineHeight='1.5';
    dialog.querySelector('#mailReaderClose').onclick=()=>dialog.close();
    return dialog;
  }

  function openMail(id){
    const mail=mailRows.find(m=>m.id===id);if(!mail)return;
    const dialog=ensureMailDialog();
    dialog.querySelector('#mailReaderSubject').textContent=mail.subject||'(Ohne Betreff)';
    dialog.querySelector('#mailReaderMeta').textContent=`Von: ${mail.from||'Unbekannt'}${mail.to?`\nAn: ${mail.to}`:''}${mail.date?`\n${mail.date}`:''}`;
    dialog.querySelector('#mailReaderBody').textContent=mail.body||mail.snippet||'Für diese Nachricht ist kein Textinhalt verfügbar.';
    dialog.showModal();
  }

  function renderMail(data){
    const rows=Array.isArray(data?.messages)?data.messages:[];
    mailRows=rows;
    const preview=qs('#mailPreview');
    if(qs('#mailHeadline'))qs('#mailHeadline').textContent=rows.length?`${rows.length} aktuelle E-Mails`:'E-Mail';
    if(qs('#mailStatus'))qs('#mailStatus').textContent='Gmail · verbunden';
    if(!preview)return;
    if(!rows.length){preview.innerHTML='<span>Keine aktuellen Nachrichten im Posteingang.</span>';return}
    preview.innerHTML=rows.slice(0,3).map(m=>`<div class="integration-row" data-mail-id="${esc(m.id)}" role="button" tabindex="0" title="In ORBIT öffnen" style="cursor:pointer;padding:7px 0;border-bottom:1px solid rgba(242,189,98,.09)"><b>${esc(m.subject||'(Ohne Betreff)')}</b><small>${esc(m.from||'')}</small></div>`).join('');
    preview.querySelectorAll('[data-mail-id]').forEach(row=>{
      row.addEventListener('click',()=>openMail(row.dataset.mailId));
      row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openMail(row.dataset.mailId)}});
    });
  }

  function renderCalendar(data){
    const rows=Array.isArray(data?.events)?data.events:[];
    calendarRows=rows;
    const preview=qs('#calendarPreview');
    if(qs('#calendarHeadline'))qs('#calendarHeadline').textContent=rows.length?'Nächste Termine':'Kalender';
    if(qs('#calendarStatus'))qs('#calendarStatus').textContent='Google Kalender · verbunden';
    if(preview){
      if(!rows.length)preview.innerHTML='<span>Keine kommenden Termine gefunden.</span>';
      else preview.innerHTML=rows.slice(0,3).map(e=>`<div class="integration-row"><b>${esc(e.summary||'(Ohne Titel)')}</b><small>${esc(formatEventStart(e.start))}</small></div>`).join('');
    }
    applyCalendarToDashboard();
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
      else if(err.status===401){localStorage.removeItem(SYNC_KEY_STORAGE);setGoogleStatus('Sync-Code ungültig · bitte erneut verbinden');}
      else setGoogleStatus(`Google-Verbindung prüfen · ${err.message||'Fehler'}`);
    }
  }

  async function connectGoogle(){
    setGoogleStatus('Google-Freigabe wird vorbereitet …');
    let url='';
    try{
      const data=await gateway('/start',{interactive:true});
      url=typeof data?.url==='string'?data.url.trim():'';
      if(!url)throw new Error('START_NO_URL');
    }catch(err){
      if(err.message==='NO_KEY')setGoogleStatus('ORBIT Sync-Code für sichere Verbindung erforderlich');
      else if(err.status===401){localStorage.removeItem(SYNC_KEY_STORAGE);setGoogleStatus('Sync-Code ungültig · bitte erneut auf Gmail verbinden klicken');}
      else if(err.message==='google_not_configured')setGoogleStatus('Google OAuth wartet auf Client-Freigabe');
      else setGoogleStatus(`Google-Freigabe Fehler · ${err.message||'unbekannt'}`);
      return;
    }
    setGoogleStatus('Google wird geöffnet …');
    window.location.href=url;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    qs('#taskQuickBtn')?.addEventListener('click',openTaskDialog);
    qs('#mailConnectBtn')?.addEventListener('click',async()=>{
      const status=qs('#mailStatus')?.textContent||'';
      if(status.includes('verbunden'))await loadGoogleData();else await connectGoogle();
    });
    qs('#calendarConnectBtn')?.addEventListener('click',async()=>{
      const status=qs('#calendarStatus')?.textContent||'';
      if(status.includes('verbunden'))await loadGoogleData();else await connectGoogle();
    });
    ['#captureBtn','#entryForm','#deleteBtn'].forEach(s=>qs(s)?.addEventListener('click',()=>setTimeout(applyCalendarToDashboard,50)));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&calendarRows.length)setTimeout(applyCalendarToDashboard,100)});
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

  window.ORBITIntegrations={openTaskDialog,connectGoogle,loadGoogleData,applyCalendarToDashboard,openMail};
})();