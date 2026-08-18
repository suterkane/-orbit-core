const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='orbit.entries.v1';
let entries=JSON.parse(localStorage.getItem(KEY)||'[]');
let editingId=null;

function save(){localStorage.setItem(KEY,JSON.stringify(entries));renderAll()}
function isoToday(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function dateOnly(v){return v?new Date(v+'T12:00:00'):null}
function diffDays(v){if(!v)return null;const t=dateOnly(isoToday()),d=dateOnly(v);return Math.round((d-t)/86400000)}
function openEntries(){return entries.filter(e=>!e.completed)}
function taskEntries(){return openEntries().filter(e=>e.category==='task')}
function todayTasks(){return taskEntries().filter(e=>diffDays(e.due)===0)}
function overdueTasks(){return taskEntries().filter(e=>diffDays(e.due)<0)}
function weekTasks(){return taskEntries().filter(e=>{const n=diffDays(e.due);return n>=1&&n<=7})}
function plannedTasks(){return taskEntries().filter(e=>diffDays(e.due)>=1).sort((a,b)=>a.due.localeCompare(b.due))}

function showApp(){localStorage.setItem('orbit.started','1');$('#splash').classList.add('hidden');$('#app').classList.remove('hidden');renderAll()}
$('#initiateBtn').onclick=showApp;
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

function label(cat){return cat==='task'?'Aufgabe':cat==='idea'?'Idee':'Gedanke'}
function formatDue(due){if(!due)return'Ohne Termin';const n=diffDays(due);if(n===0)return'Heute';if(n===1)return'Morgen';if(n<0)return`${Math.abs(n)} Tag${Math.abs(n)===1?'':'e'} überfällig`;return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(dateOnly(due))}
function filtered(){const q=$('#searchInput').value.trim().toLowerCase(),cat=$('#categoryFilter').value,df=$('#dateFilter').value;return entries.filter(e=>{if(q&&!e.text.toLowerCase().includes(q))return false;if(cat!=='all'&&e.category!==cat)return false;if(df==='today'&&!(e.category==='task'&&!e.completed&&diffDays(e.due)===0))return false;if(df==='overdue'&&!(e.category==='task'&&!e.completed&&diffDays(e.due)<0))return false;if(df==='planned'&&!(e.category==='task'&&!e.completed&&diffDays(e.due)>=1))return false;if(df==='week'&&!(e.category==='task'&&!e.completed&&diffDays(e.due)>=1&&diffDays(e.due)<=7))return false;return true}).sort((a,b)=>Number(b.important)-Number(a.important)||Number(a.completed)-Number(b.completed)||new Date(b.createdAt)-new Date(a.createdAt))}
function renderEntries(){const list=$('#entryList'),rows=filtered();if(!rows.length){list.innerHTML='<div class="empty">Keine passenden Einträge. Friday hält diesen Bereich sauber.</div>';return}list.innerHTML=rows.map(e=>`<article class="entry ${e.completed?'completed':''}"><button class="star" data-star="${e.id}" title="Wichtig">${e.important?'★':'☆'}</button><div><h4>${escapeHtml(e.text)}</h4><p>${label(e.category)} · ${formatDue(e.due)}</p></div><div><button data-done="${e.id}" title="Erledigt">${e.completed?'↺':'✓'}</button><button data-edit="${e.id}" title="Bearbeiten">⋯</button></div></article>`).join('');$$('[data-edit]').forEach(b=>b.onclick=()=>openDialog(b.dataset.edit));$$('[data-done]').forEach(b=>b.onclick=()=>{const e=entries.find(x=>x.id===b.dataset.done);e.completed=!e.completed;save()});$$('[data-star]').forEach(b=>b.onclick=()=>{const e=entries.find(x=>x.id===b.dataset.star);e.important=!e.important;save()})}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
$('#searchInput').oninput=renderEntries;$('#categoryFilter').onchange=renderEntries;$('#dateFilter').onchange=renderEntries;

function renderDashboard(){const today=todayTasks(),over=overdueTasks(),week=weekTasks(),open=openEntries(),next=plannedTasks()[0];$('#todayCount').textContent=today.length;$('#overdueCount').textContent=over.length;$('#weekCount').textContent=week.length;$('#openCount').textContent=open.length;$('#heroText').textContent=over.length?`${over.length} überfällige Aufgabe${over.length===1?' wartet':'n warten'}. Priorität empfohlen.`:today.length?`${today.length} Aufgabe${today.length===1?' ist':'n sind'} heute fällig.`:week.length?`${week.length} Aufgabe${week.length===1?' liegt':'n liegen'} in den nächsten sieben Tagen.`:'Keine akute Terminlage.';const f=$('#nextFocus');if(next){f.querySelector('strong').textContent=next.text;f.querySelector('small').textContent=`${formatDue(next.due)} · Antippen für geplante Aufgaben`;f.onclick=()=>routeFilter('planned')}else{f.querySelector('strong').textContent='Keine geplante Aufgabe';f.querySelector('small').textContent='Friday hält den Kurs frei.';f.onclick=null}}
function renderAll(){renderDashboard();renderEntries()}
renderAll();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));