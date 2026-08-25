const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='orbit.entries.v1';
const SYNC_KEY_STORAGE='orbit.sync.key.v1';
const SYNC_URL='https://vhmokhunkvoctavmrjwl.supabase.co/functions/v1/orbit-sync';
let entries=JSON.parse(localStorage.getItem(KEY)||'[]');
let editingId=null;
let syncKey=localStorage.getItem(SYNC_KEY_STORAGE)||'';
let syncReady=false;
let syncBusy=false;
let syncTimer=null;
let pollTimer=null;

function setStorageStatus(text){const el=$('#storageStatus');if(el)el.textContent=text}
function persistLocal(){localStorage.setItem(KEY,JSON.stringify(entries))}
async function syncRequest(method,body){
  const r=await fetch(SYNC_URL,{method,headers:{'Content-Type':'application/json','x-orbit-sync-key':syncKey},body:body?JSON.stringify(body):undefined});
  if(r.status===401)throw new Error('SYNC_KEY');
  if(!r.ok)throw new Error(`SYNC_${r.status}`);
  return r.json();
}
async function pushCloud(){
  if(!syncReady||syncBusy)return;
  syncBusy=true;
  try{await syncRequest('POST',{entries});setStorageStatus('CLOUD · SYNCHRON')}catch{setStorageStatus('CLOUD · FEHLER')}finally{syncBusy=false}
}
function scheduleCloudPush(){
  if(!syncReady)return;
  clearTimeout(syncTimer);
  syncTimer=setTimeout(pushCloud,180);
}
async function pullCloud(){
  if(!syncReady||syncBusy)return;
  syncBusy=true;
  try{
    const state=await syncRequest('GET');
    if(Array.isArray(state.entries)&&state.entries.length){
      const remote=JSON.stringify(state.entries),local=JSON.stringify(entries);
      if(remote!==local){entries=state.entries;persistLocal();renderAll()}
    }
    setStorageStatus('CLOUD · SYNCHRON');
  }catch{setStorageStatus('CLOUD · FEHLER')}finally{syncBusy=false}
}
async function connectSync(){
  if(!syncKey){setStorageStatus('LOKAL · SYNC NICHT VERBUNDEN');return}
  setStorageStatus('CLOUD · VERBINDEN');
  try{
    const state=await syncRequest('GET');
    if(Array.isArray(state.entries)&&state.entries.length){entries=state.entries;persistLocal()}
    else if(entries.length){await syncRequest('POST',{entries})}
    syncReady=true;
    setStorageStatus('CLOUD · SYNCHRON');
    renderAll();
    if(!pollTimer)pollTimer=setInterval(pullCloud,15000);
  }catch(err){
    syncReady=false;
    if(err.message==='SYNC_KEY'){
      localStorage.removeItem(SYNC_KEY_STORAGE);syncKey='';setStorageStatus('LOKAL · SYNC NICHT VERBUNDEN');
    }else setStorageStatus('CLOUD · FEHLER');
  }
}
async function setupSync(){
  const entered=prompt('ORBIT Sync-Code eingeben. Derselbe Code verbindet PC und iPhone.');
  if(!entered)return;
  syncKey=entered.trim();
  localStorage.setItem(SYNC_KEY_STORAGE,syncKey);
  await connectSync();
}

function save(){persistLocal();renderAll();scheduleCloudPush()}
function isoToday(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function dateOnly(v){return v?new Date(v+'T12:00:00'):null}
function diffDays(v){if(!v)return null;const t=dateOnly(isoToday()),d=dateOnly(v);return Math.round((d-t)/86400000)}
function openEntries(){return entries.filter(e=>!e.completed)}
function taskEntries(){return openEntries().filter(e=>e.category==='task')}
function todayTasks(){return taskEntries().filter(e=>diffDays(e.due)===0)}
function overdueTasks(){return taskEntries().filter(e=>diffDays(e.due)<0)}
function weekTasks(){return taskEntries().filter(e=>{const n=diffDays(e.due);return n>=1&&n<=7})}
function plannedTasks(){return taskEntries().filter(e=>diffDays(e.due)>=1).sort((a,b)=>a.due.localeCompare(b.due))}

function showApp(){localStorage.setItem('orbit.started','1');$('#splash').classList.add('hidden');$('#app').classList.remove('hidden');renderAll();connectSync()}
if(localStorage.getItem('orbit.started')==='1')showApp();

function setView(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));window.scrollTo({top:0,behavior:'smooth'})}
$$('.bottom-nav button').forEach(b=>b.onclick=()=>setView(b.dataset.view));

function routeFilter(route){setView('inbox');$('#categoryFilter').value=route==='open'?'all':'task';$('#dateFilter').value=route==='open'?'all':route;renderEntries()}
$$('[data-route]').forEach(b=>b.onclick=()=>routeFilter(b.dataset.route));

function addQuick(){const text=$('#quickInput').value.trim();if(!text)return;entries.unshift({id:crypto.randomUUID(),text,category:'thought',due:'',important:false,completed:false,createdAt:new Date().toISOString()});$('#quickInput').value='';save()}
$('#captureBtn').onclick=addQuick;$('#quickInput').addEventListener('keydown',e=>{if(e.key==='Enter')addQuick()});
$('#newEntryBtn').onclick=()=>openDialog();

function openDialog(id=null){editingId=id;const e=id?entries.find(x=>x.id===id):null;$('#dialogTitle').textContent=e?'Eintrag bearbeiten':'Neuer Eintrag';$('#editText').value=e?.text||'';$('#editCategory').value=e?.category||'thought';$('#editDue').value=e?.due||'';$('#editImportant').checked=!!e?.important;$('#deleteBtn').style.visibility=e?'visible':'hidden';$('#entryDialog').showModal()}
$('#entryForm').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;const text=$('#editText').value.trim();if(!text){e.preventDefault();return}if(editingId){const item=entries.find(x=>x.id===editingId);Object.assign(item,{text,category:$('#editCategory').value,due:$('#editDue').value,important:$('#editImportant').checked})}else{entries.unshift({id:crypto.randomUUID(),text,category:$('#editCategory').value,due:$('#editDue').value,important:$('#editImportant').checked,completed:false,createdAt:new Date().toISOString()})}editingId=null;save()});
$('#deleteBtn').onclick=()=>{if(!editingId)return;if(confirm('Diesen Eintrag wirklich dauerhaft löschen?')&&confirm('Letzte Sicherheitsabfrage: Löschen bestätigen?')){entries=entries.filter(e=>e.id!==editingId);editingId=null;$('#entryDialog').close();save()}};
$('#settingsBtn').onclick=()=>$('#settingsDialog').showModal();
const storageStatus=$('#storageStatus');
if(storageStatus){storageStatus.title='Antippen, um ORBIT Sync einzurichten';storageStatus.onclick=()=>setupSync()}
window.ORBITSync={connect:setupSync};

function label(cat){return cat==='task'?'Aufgabe':cat==='idea'?'Idee':'Gedanke'}
function formatDue(due){if(!due)return'Ohne Termin';const n=diffDays(due);if(n===0)return'Heute';if(n===1)return'Morgen';if(n<0)return`${Math.abs(n)} Tag${Math.abs(n)===1?'':'e'} überfällig`;return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(dateOnly(due))}
function filtered(){const q=$('#searchInput').value.trim().toLowerCase(),cat=$('#categoryFilter').value,df=$('#dateFilter').value;return entries.filter(e=>{if(q&&!e.text.toLowerCase().includes(q))return false;if(cat!=='all'&&e.category!==cat)return false;if(df==='today'&&!(e.category==='task'&&!e.completed&&diffDays(e.due)===0))return false;if(df==='overdue'&&!(e.category==='task'&&!e.completed&&diffDays(e.due)<0))return false;if(df==='planned'&&!(e.category==='task'&&!e.completed&&diffDays(e.due)>=1))return false;if(df==='week'&&!(e.category==='task'&&!e.completed&&diffDays(e.due)>=1&&diffDays(e.due)<=7))return false;return true}).sort((a,b)=>Number(b.important)-Number(a.important)||Number(a.completed)-Number(b.completed)||new Date(b.createdAt)-new Date(a.createdAt))}
function renderEntries(){const list=$('#entryList'),rows=filtered();if(!rows.length){list.innerHTML='<div class="empty">Keine passenden Einträge. Friday hält diesen Bereich sauber.</div>';return}list.innerHTML=rows.map(e=>`<article class="entry ${e.completed?'completed':''}"><button class="star" data-star="${e.id}" title="Wichtig">${e.important?'★':'☆'}</button><div><h4>${escapeHtml(e.text)}</h4><p>${label(e.category)} · ${formatDue(e.due)}</p></div><div><button data-done="${e.id}" title="Erledigt">${e.completed?'↺':'✓'}</button><button data-edit="${e.id}" title="Bearbeiten">⋯</button></div></article>`).join('');$$('[data-edit]').forEach(b=>b.onclick=()=>openDialog(b.dataset.edit));$$('[data-done]').forEach(b=>b.onclick=()=>{const e=entries.find(x=>x.id===b.dataset.done);e.completed=!e.completed;save()});$$('[data-star]').forEach(b=>b.onclick=()=>{const e=entries.find(x=>x.id===b.dataset.star);e.important=!e.important;save()})}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
$('#searchInput').oninput=renderEntries;$('#categoryFilter').onchange=renderEntries;$('#dateFilter').onchange=renderEntries;

function renderDashboard(){const today=todayTasks(),over=overdueTasks(),week=weekTasks(),open=openEntries(),next=plannedTasks()[0];$('#todayCount').textContent=today.length;$('#overdueCount').textContent=over.length;$('#weekCount').textContent=week.length;$('#openCount').textContent=open.length;$('#heroText').textContent=over.length?`${over.length} überfällige Aufgabe${over.length===1?' wartet':'n warten'}. Priorität empfohlen.`:today.length?`${today.length} Aufgabe${today.length===1?' ist':'n sind'} heute fällig.`:week.length?`${week.length} Aufgabe${week.length===1?' liegt':'n liegen'} in den nächsten sieben Tagen.`:'Keine akute Terminlage.';const f=$('#nextFocus');if(next){f.querySelector('strong').textContent=next.text;f.querySelector('small').textContent=`${formatDue(next.due)} · Antippen für geplante Aufgaben`;f.onclick=()=>routeFilter('planned')}else{f.querySelector('strong').textContent='Keine geplante Aufgabe';f.querySelector('small').textContent='Friday hält den Kurs frei.';f.onclick=null}}
function renderAll(){renderDashboard();renderEntries()}
function captureFromVoice(text,category='thought'){const clean=String(text||'').trim();if(!clean)return null;const entry={id:crypto.randomUUID(),text:clean,category:['task','idea','thought'].includes(category)?category:'thought',due:'',important:false,completed:false,createdAt:new Date().toISOString()};entries.unshift(entry);save();return entry}
function markImportant(id){const entry=entries.find(item=>item.id===id);if(!entry)return false;entry.important=true;save();return true}
window.ORBITApp={setView,capture:captureFromVoice,markImportant,render:renderAll};
renderAll();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')pullCloud()});
window.addEventListener('online',()=>pullCloud());
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));