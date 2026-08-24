(()=>{
  const DB_NAME='orbit-private-media-v1';
  const STORE='media';
  const KEY='friday-theme';
  let currentUrl='';

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  async function putBlob(blob){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(blob,KEY);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}
  async function getBlob(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}
  async function hasMusic(){try{return !!(await getBlob())}catch{return false}}
  async function play({volume=.34,loop=true}={}){
    const blob=await getBlob();if(!blob)return null;
    if(currentUrl)URL.revokeObjectURL(currentUrl);currentUrl=URL.createObjectURL(blob);
    const audio=new Audio(currentUrl);audio.loop=loop;audio.preload='auto';audio.volume=volume;await audio.play();return audio;
  }
  async function chooseFile(){
    return new Promise(resolve=>{
      const input=document.createElement('input');input.type='file';input.accept='audio/*,.m4a,.mp3,.wav,.aac';input.style.display='none';document.body.appendChild(input);
      input.onchange=async()=>{const file=input.files?.[0];if(!file){input.remove();resolve(false);return}try{await putBlob(file);resolve(true)}catch{resolve(false)}finally{input.remove()}};
      input.click();
    });
  }
  async function refreshUi(){const status=document.querySelector('#privateMusicStatus');if(status)status.textContent=await hasMusic()?'Private FRIDAY-Musik gespeichert · bereit':'Noch keine private Musik gespeichert'}
  function installSettingsUi(){
    const form=document.querySelector('#settingsDialog form');if(!form||document.querySelector('#privateMusicBtn'))return;
    const done=form.querySelector('button.primary-btn.full');
    const wrap=document.createElement('div');wrap.style.cssText='display:grid;gap:8px;margin:14px 0;padding:12px;border:1px solid rgba(242,189,98,.18);background:rgba(20,8,5,.45)';
    wrap.innerHTML='<strong style="font-size:11px;letter-spacing:.08em">PRIVATE FRIDAY-MUSIK</strong><span id="privateMusicStatus" style="font-size:10px;color:#b9a99f">Status wird geprüft …</span><button id="privateMusicBtn" type="button" class="primary-btn">Private Musik auswählen</button>';
    form.insertBefore(wrap,done);
    wrap.querySelector('#privateMusicBtn').onclick=async()=>{const btn=wrap.querySelector('#privateMusicBtn');btn.disabled=true;btn.textContent='Musik wird gespeichert …';const ok=await chooseFile();btn.disabled=false;btn.textContent=ok?'Musik gespeichert ✓':'Private Musik auswählen';await refreshUi()};
    refreshUi();
  }
  window.ORBITPrivateMusic={play,chooseFile,hasMusic,refreshUi};
  document.addEventListener('DOMContentLoaded',installSettingsUi);
})();