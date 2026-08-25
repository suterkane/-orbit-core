(()=>{
  const GOOGLE_GATEWAY='https://vhmokhunkvoctavmrjwl.supabase.co/functions/v1/google-oauth';
  const SYNC_KEY_STORAGE='orbit.sync.key.v1';
  let calendarRows=[],mailRows=[],needsGmailModify=false,currentMailId='';
  let dashboardOverlay={today:0,week:0,expectedToday:null,expectedWeek:null};
  const qs=s=>document.querySelector(s);
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function getSyncKey(interactive=false){
    let key=(localStorage.getItem(SYNC_KEY_STORAGE)||'').trim();
    if(!key&&interactive){setGoogleStatus('Google-Verbindung nicht eingerichtet');return''}
    return key;
  }

  async function gateway(path,{interactive=false,method='GET',body=null}={}){
    const key=getSyncKey(interactive);if(!key)throw new Error('NO_KEY');
    const headers={'x-orbit-sync-key':key,'Accept':'application/json'};
    if(body!==null)headers['Content-Type']='application/json';
    const r=await fetch(`${GOOGLE_GATEWAY}${path}`,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:'no-store'});
    const raw=await r.text();let data={};
    try{data=raw?JSON.parse(raw):{}}catch{throw new Error('INVALID_RESPONSE')}
    if(!r.ok){const err=new Error(data?.error||`HTTP_${r.status}`);err.status=r.status;err.data=data;throw err}
    return data;
  }

  function openTaskDialog(){
    try{if(typeof window.openDialog==='function')window.openDialog();else qs('#newEntryBtn')?.click();const cat=qs('#editCategory');if(cat)cat.value='task';const due=qs('#editDue');if(due&&!due.value){const d=new Date();due.value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}qs('#editText')?.focus();const status=qs('#taskQuickStatus');if(status)status.textContent='Aufgabenmodus geöffnet.'}catch{}
  }

  function setGoogleStatus(text){if(qs('#mailStatus'))qs('#mailStatus').textContent=text;if(qs('#calendarStatus'))qs('#calendarStatus').textContent=text}
  function formatEventStart(v){if(!v)return'';const d=new Date(v.length===10?`${v}T12:00:00`:v);if(Number.isNaN(d.getTime()))return v;return new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',hour:v.length===10?undefined:'2-digit',minute:v.length===10?undefined:'2-digit'}).format(d)}
  function eventDate(v){if(!v)return null;const d=new Date(v.length===10?`${v}T12:00:00`:v);return Number.isNaN(d.getTime())?null:d}
  function dayKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}

  function applyCalendarToDashboard(){
    const todayEl=qs('#todayCount'),weekEl=qs('#weekCount'),hero=qs('#heroText'),focus=qs('#nextFocus');if(!todayEl||!weekEl)return;
    const now=new Date(),todayKey=dayKey(now),weekEnd=new Date(now);weekEnd.setDate(weekEnd.getDate()+7);
    const dated=calendarRows.map(e=>({event:e,date:eventDate(e.start)})).filter(x=>x.date);
    const calendarToday=dated.filter(x=>dayKey(x.date)===todayKey).length;
    const calendarWeek=dated.filter(x=>x.date>now&&x.date<=weekEnd&&dayKey(x.date)!==todayKey).length;
    const shownToday=Number(todayEl.textContent)||0,shownWeek=Number(weekEl.textContent)||0;
    const taskToday=dashboardOverlay.expectedToday!==null&&shownToday===dashboardOverlay.expectedToday?Math.max(0,shownToday-dashboardOverlay.today):shownToday;
    const taskWeek=dashboardOverlay.expectedWeek!==null&&shownWeek===dashboardOverlay.expectedWeek?Math.max(0,shownWeek-dashboardOverlay.week):shownWeek;
    const combinedToday=taskToday+calendarToday,combinedWeek=taskWeek+calendarWeek;todayEl.textContent=combinedToday;weekEl.textContent=combinedWeek;
    dashboardOverlay={today:calendarToday,week:calendarWeek,expectedToday:combinedToday,expectedWeek:combinedWeek};
    const overdue=Number(qs('#overdueCount')?.textContent)||0;if(overdue===0){if(combinedToday>0&&hero)hero.textContent=`${combinedToday} Termin${combinedToday===1?' oder Aufgabe':'e oder Aufgaben'} heute im Fokus.`;else if(combinedWeek>0&&hero)hero.textContent=`${combinedWeek} Termin${combinedWeek===1?' oder Aufgabe':'e oder Aufgaben'} in den nächsten sieben Tagen.`}
    const upcoming=dated.filter(x=>x.date>=now).sort((a,b)=>a.date-b.date)[0];if(upcoming&&focus){const strong=focus.querySelector('strong'),small=focus.querySelector('small'),current=strong?.textContent||'';if(!current||current==='Keine geplante Aufgabe'||current===focus.dataset.calendarTitle){if(strong)strong.textContent=upcoming.event.summary||'Kalendertermin';if(small)small.textContent=`${formatEventStart(upcoming.event.start)} · Google Kalender`;focus.dataset.calendarTitle=upcoming.event.summary||'Kalendertermin';focus.onclick=null}}
  }

  function buildBriefingData(){
    const now=new Date(),today=dayKey(now),weekEnd=new Date(now);weekEnd.setDate(weekEnd.getDate()+7);
    const dated=calendarRows.map(event=>({event,date:eventDate(event.start)})).filter(x=>x.date).sort((a,b)=>a.date-b.date);
    const todayEvents=dated.filter(x=>dayKey(x.date)===today);
    const weekEvents=dated.filter(x=>x.date>now&&x.date<=weekEnd);
    const nextEvent=dated.find(x=>x.date>=now)||null;
    const overdue=Number(qs('#overdueCount')?.textContent)||0,open=Number(qs('#openCount')?.textContent)||0;
    const mails=mailRows.slice(0,2).map(mail=>String(mail.subject||'E-Mail ohne Betreff').replace(/\s+/g,' ').trim().slice(0,120));
    const calendarText=nextEvent?`${nextEvent.event.summary||'Kalendertermin'}, ${formatEventStart(nextEvent.event.start)}`:todayEvents.length?`${todayEvents.length} Termine heute`:weekEvents.length?`${weekEvents.length} Termine in den nächsten sieben Tagen`:'Keine dringenden Termine';
    const mailText=mails.length?`${mailRows.length} aktuell. ${mails.join('. ')}`:'Keine neuen E-Mails';
    const taskText=overdue?`${overdue} überfällig, ${open} offen`:open?`${open} Aufgaben offen`:'Keine offenen Aufgaben';
    const priority=overdue?'Überfällige Aufgaben zuerst':nextEvent?(nextEvent.event.summary||'Nächsten Termin vorbereiten'):open?'Offene Aufgaben priorisieren':'Keine akute Priorität';
    return{date:new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now),mailCount:mailRows.length,mails,mailText,todayEvents:todayEvents.length,weekEvents:weekEvents.length,nextEvent:nextEvent?{summary:nextEvent.event.summary||'Kalendertermin',start:formatEventStart(nextEvent.event.start)}:null,calendarText,overdue,open,taskText,priority};
  }

  function buildBriefingSummary(data=buildBriefingData()){
    const parts=[];
    parts.push(data.mailCount?`Im Posteingang liegen ${data.mailCount} aktuelle E-Mail${data.mailCount===1?'':'s'}.`:'Der Posteingang ist ruhig.');
    if(data.mails.length)parts.push(`Relevant sind ${data.mails.join(' und ')}.`);
    if(data.nextEvent)parts.push(`Der nächste Termin ist ${data.nextEvent.summary}, ${data.nextEvent.start}.`);else parts.push('Im Kalender liegt kein dringender Termin an.');
    if(data.overdue)parts.push(`${data.overdue} Aufgabe${data.overdue===1?' ist':'n sind'} überfällig.`);else if(data.open)parts.push(`${data.open} offene Aufgabe${data.open===1?' wartet':'n warten'} in ORBIT.`);
    parts.push(`Nächste Priorität: ${data.priority}.`);
    return parts.join(' ');
  }

  async function getBriefingData(){try{await loadGoogleData()}catch{}return buildBriefingData()}
  async function getBriefingSummary(){const data=await getBriefingData();return buildBriefingSummary(data)}

  function ensureMailReader(){
    let overlay=qs('#mailReaderOverlay');if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='mailReaderOverlay';overlay.hidden=true;
    overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(3,2,2,.86);backdrop-filter:blur(12px);padding:max(18px,env(safe-area-inset-top)) 16px max(18px,env(safe-area-inset-bottom));overflow:auto';
    overlay.innerHTML='<section style="max-width:760px;margin:4vh auto;background:linear-gradient(145deg,#1d0a07,#080504);border:1px solid #6f3b24;border-radius:20px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.5)"><div class="dialog-head"><div><span class="eyebrow">GMAIL / ORBIT</span><h3 id="mailReaderSubject">E-Mail</h3></div><button id="mailReaderClose" class="icon-btn" type="button">×</button></div><p id="mailReaderMeta" style="white-space:pre-wrap;color:#b9a99f;font-size:11px;line-height:1.5"></p><div id="mailReaderBody" style="white-space:pre-wrap;line-height:1.6;max-height:58vh;overflow:auto;padding:14px 0;color:#e8ddd4;font-size:13px"></div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px"><button id="mailReaderTrash" type="button" class="danger-btn">In Papierkorb</button><button id="mailReaderDone" type="button" class="primary-btn">Fertig</button></div></section>';
    document.body.appendChild(overlay);
    const close=()=>{overlay.hidden=true;currentMailId=''};
    overlay.querySelector('#mailReaderClose').onclick=close;overlay.querySelector('#mailReaderDone').onclick=close;
    overlay.querySelector('#mailReaderTrash').onclick=()=>trashCurrentMail();
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});return overlay;
  }

  function openMail(id){
    const mail=mailRows.find(m=>m.id===id);if(!mail)return;currentMailId=id;
    const overlay=ensureMailReader();overlay.querySelector('#mailReaderSubject').textContent=mail.subject||'(Ohne Betreff)';
    overlay.querySelector('#mailReaderMeta').textContent=`Von: ${mail.from||'Unbekannt'}${mail.to?`\nAn: ${mail.to}`:''}${mail.date?`\n${mail.date}`:''}`;
    overlay.querySelector('#mailReaderBody').textContent=mail.body||mail.snippet||'Für diese Nachricht ist kein Textinhalt verfügbar.';
    const trash=overlay.querySelector('#mailReaderTrash');trash.textContent=needsGmailModify?'Papierkorb freischalten':'In Papierkorb';trash.disabled=false;overlay.hidden=false;
  }

  async function trashCurrentMail(){
    if(!currentMailId)return;
    if(needsGmailModify){const ok=confirm('ORBIT braucht einmal die Gmail-Berechtigung zum Verschieben in den Papierkorb. Jetzt freischalten?');if(ok)connectGoogle();return}
    const mail=mailRows.find(m=>m.id===currentMailId);if(!confirm(`Diese E-Mail in den Gmail-Papierkorb verschieben?\n\n${mail?.subject||'E-Mail'}`))return;
    const btn=qs('#mailReaderTrash');if(btn){btn.disabled=true;btn.textContent='Wird verschoben …'}
    try{await gateway('/trash',{method:'POST',body:{id:currentMailId}});mailRows=mailRows.filter(m=>m.id!==currentMailId);const overlay=qs('#mailReaderOverlay');if(overlay)overlay.hidden=true;currentMailId='';if(qs('#mailStatus'))qs('#mailStatus').textContent='E-Mail in Papierkorb verschoben';await loadGoogleData()}catch(err){if(btn){btn.disabled=false;btn.textContent='In Papierkorb'}const msg=String(err?.message||'');if(err?.status===403||msg.includes('insufficient')||msg.includes('permission')){needsGmailModify=true;if(qs('#mailStatus'))qs('#mailStatus').textContent='Papierkorb-Freigabe erforderlich';if(confirm('Google muss die Papierkorb-Funktion einmal freigeben. Jetzt Berechtigung erweitern?'))connectGoogle();return}alert(`Papierkorb konnte nicht ausgeführt werden: ${msg||'Unbekannter Fehler'}`)}
  }

  function renderMail(data){
    const rows=Array.isArray(data?.messages)?data.messages:[];mailRows=rows;const preview=qs('#mailPreview');
    if(qs('#mailHeadline'))qs('#mailHeadline').textContent=rows.length?`${rows.length} aktuelle E-Mails`:'E-Mail';
    if(qs('#mailStatus'))qs('#mailStatus').textContent=needsGmailModify?'Gmail · verbunden · Papierkorb-Freigabe offen':'Gmail · verbunden';
    if(!preview)return;if(!rows.length){preview.innerHTML='<span>Keine aktuellen Nachrichten im Posteingang.</span>';return}
    preview.innerHTML=rows.slice(0,3).map(m=>`<button type="button" class="integration-row mail-open" data-mail-id="${esc(m.id)}" style="width:100%;text-align:left;cursor:pointer;padding:9px 0;border:0;border-bottom:1px solid rgba(242,189,98,.12);background:transparent;color:inherit"><b style="display:block;color:#f1e5da">${esc(m.subject||'(Ohne Betreff)')}</b><small style="display:block;color:#b9a99f">${esc(m.from||'')}</small><em style="display:block;margin-top:3px;color:#d6a95c;font-size:9px;font-style:normal;letter-spacing:.08em">ÖFFNEN ›</em></button>`).join('');
  }

  function renderCalendar(data){const rows=Array.isArray(data?.events)?data.events:[];calendarRows=rows;const preview=qs('#calendarPreview');if(qs('#calendarHeadline'))qs('#calendarHeadline').textContent=rows.length?'Nächste Termine':'Kalender';if(qs('#calendarStatus'))qs('#calendarStatus').textContent='Google Kalender · verbunden';if(preview)preview.innerHTML=!rows.length?'<span>Keine kommenden Termine gefunden.</span>':rows.slice(0,3).map(e=>`<div class="integration-row"><b>${esc(e.summary||'(Ohne Titel)')}</b><small>${esc(formatEventStart(e.start))}</small></div>`).join('');applyCalendarToDashboard()}

  async function loadGoogleData(){
    const key=getSyncKey(false);if(!key){setGoogleStatus('Google-Verbindung noch nicht eingerichtet');return}
    try{const status=await gateway('/status');if(!status.configured){setGoogleStatus('Google OAuth wartet auf Einrichtung');return}if(!status.connected){setGoogleStatus('Google-Verbindung erforderlich');return}needsGmailModify=!!status.needs_modify;setGoogleStatus('Live-Daten werden geladen …');const [mail,calendar]=await Promise.all([gateway('/data?resource=gmail'),gateway('/data?resource=calendar')]);renderMail(mail);renderCalendar(calendar);const mb=qs('#mailConnectBtn'),cb=qs('#calendarConnectBtn');if(mb)mb.textContent=needsGmailModify?'Papierkorb freischalten':'Gmail aktualisieren';if(cb)cb.textContent='Kalender aktualisieren'}catch(err){if(err.message==='NO_KEY')setGoogleStatus('Google-Verbindung noch nicht eingerichtet');else if(err.status===401){localStorage.removeItem(SYNC_KEY_STORAGE);setGoogleStatus('Sync-Code ungültig · bitte erneut verbinden')}else setGoogleStatus(`Google-Verbindung prüfen · ${err.message||'Fehler'}`)}
  }

  async function connectGoogle(){setGoogleStatus('Google-Freigabe wird vorbereitet …');let url='';try{const data=await gateway('/start',{interactive:true});url=typeof data?.url==='string'?data.url.trim():'';if(!url)throw new Error('START_NO_URL')}catch(err){if(err.message==='NO_KEY')setGoogleStatus('ORBIT Sync-Code für sichere Verbindung erforderlich');else if(err.status===401){localStorage.removeItem(SYNC_KEY_STORAGE);setGoogleStatus('Sync-Code ungültig · bitte erneut auf Gmail verbinden klicken')}else if(err.message==='google_not_configured')setGoogleStatus('Google OAuth wartet auf Client-Freigabe');else setGoogleStatus(`Google-Freigabe Fehler · ${err.message||'unbekannt'}`);return}setGoogleStatus('Google wird geöffnet …');window.location.href=url}

  document.addEventListener('DOMContentLoaded',()=>{
    qs('#taskQuickBtn')?.addEventListener('click',openTaskDialog);
    qs('#mailConnectBtn')?.addEventListener('click',async()=>{if(needsGmailModify)await connectGoogle();else{const status=qs('#mailStatus')?.textContent||'';if(status.includes('verbunden'))await loadGoogleData();else await connectGoogle()}});
    qs('#calendarConnectBtn')?.addEventListener('click',async()=>{const status=qs('#calendarStatus')?.textContent||'';if(status.includes('verbunden'))await loadGoogleData();else await connectGoogle()});
    qs('#mailPreview')?.addEventListener('click',e=>{const btn=e.target.closest('[data-mail-id]');if(btn)openMail(btn.dataset.mailId)});
    ['#captureBtn','#entryForm','#deleteBtn'].forEach(s=>qs(s)?.addEventListener('click',()=>setTimeout(applyCalendarToDashboard,50)));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&calendarRows.length)setTimeout(applyCalendarToDashboard,100)});
    const params=new URLSearchParams(location.search);if(params.get('google')==='connected'){history.replaceState({},'',location.pathname);setGoogleStatus('Google verbunden · Live-Daten werden geladen …');loadGoogleData()}else if(params.get('google')==='error'){history.replaceState({},'',location.pathname);setGoogleStatus('Google-Freigabe abgebrochen')}else loadGoogleData();
  });

  window.ORBITIntegrations={openTaskDialog,connectGoogle,loadGoogleData,applyCalendarToDashboard,openMail,trashCurrentMail,getBriefingData,getBriefingSummary,buildBriefingData,buildBriefingSummary};
})();
