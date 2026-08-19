(()=>{
  const wrap=()=>document.querySelector('.friday-core-wrap');
  const status=()=>document.querySelector('.friday-greeting span');
  const timers=[];
  let raf=0;
  let running=false;

  function clearAll(){
    while(timers.length)clearTimeout(timers.pop());
    if(raf)cancelAnimationFrame(raf);
    raf=0;
  }

  function setPhase(n,text){
    const w=wrap();
    if(!w)return;
    w.dataset.bootPhase=String(n);
    if(text&&status())status().textContent=text;
  }

  function buildHud(){
    const w=wrap();
    if(!w||w.querySelector('.friday-boot-hud'))return;
    const hud=document.createElement('div');
    hud.className='friday-boot-hud';
    hud.setAttribute('aria-hidden','true');
    hud.innerHTML=`
      <div class="boot-curtain curtain-top"></div>
      <div class="boot-curtain curtain-bottom"></div>
      <div class="boot-grid"></div>
      <div class="boot-scanline"></div>
      <div class="boot-reactor">
        <span class="reactor-ring rr-1"></span>
        <span class="reactor-ring rr-2"></span>
        <span class="reactor-ring rr-3"></span>
        <span class="reactor-ring rr-4"></span>
        <span class="reactor-ring rr-5"></span>
        <span class="reactor-ticks"></span>
        <span class="reactor-sweep"></span>
        <span class="reactor-cross"></span>
        <span class="reactor-pulse"></span>
        <div class="boot-progress"><strong>0</strong><span>%</span><small>SYSTEM BOOT</small></div>
      </div>
      <div class="boot-panel bp-1"><span>NEURAL LINK</span><b>STANDBY</b></div>
      <div class="boot-panel bp-2"><span>VOICE CORE</span><b>STANDBY</b></div>
      <div class="boot-panel bp-3"><span>ORBIT SYNC</span><b>STANDBY</b></div>
      <div class="boot-panel bp-4"><span>SECURITY</span><b>STANDBY</b></div>
      <div class="boot-panel bp-5"><span>MEMORY GRID</span><b>STANDBY</b></div>
      <div class="boot-panel bp-6"><span>MISSION CORE</span><b>STANDBY</b></div>
      <div class="boot-flare"></div>
    `;
    w.prepend(hud);
    w.dataset.bootPhase='0';
    w.style.setProperty('--boot-progress','0');
  }

  function updatePanels(value){
    const w=wrap();
    if(!w)return;
    const checkpoints=[12,26,42,58,74,88];
    w.querySelectorAll('.boot-panel').forEach((panel,index)=>{
      const on=value>=checkpoints[index];
      panel.classList.toggle('online',on);
      const b=panel.querySelector('b');
      if(b)b.textContent=on?'ONLINE':'STANDBY';
    });
  }

  function phaseFor(value){
    if(value<15)return[1,'NEURAL LINK · HANDSHAKE'];
    if(value<35)return[2,'VOICE CORE · INITIALISIERUNG'];
    if(value<55)return[3,'ORBIT SYNC · SECURE LINK'];
    if(value<75)return[4,'SYSTEMMODULE · LADEN'];
    if(value<95)return[5,'KERNSTABILISIERUNG · FINAL'];
    return[6,'ALLE SYSTEME · NOMINAL'];
  }

  function animateProgress(duration=3300){
    return new Promise(resolve=>{
      const w=wrap();
      if(!w){resolve();return;}
      const number=w.querySelector('.boot-progress strong');
      const start=performance.now();
      let lastPhase=-1;

      const frame=now=>{
        const raw=Math.min(1,(now-start)/duration);
        const eased=1-Math.pow(1-raw,3);
        const value=Math.min(100,Math.floor(eased*100));
        w.style.setProperty('--boot-progress',String(value));
        if(number)number.textContent=String(value).padStart(2,'0');
        updatePanels(value);
        const [phase,text]=phaseFor(value);
        if(phase!==lastPhase){lastPhase=phase;setPhase(phase,text)}
        if(raw<1){raf=requestAnimationFrame(frame);return;}
        raf=0;
        w.classList.add('boot-complete');
        setPhase(6,'ORBIT CORE · 100% · ONLINE');
        timers.push(setTimeout(()=>resolve(),650));
      };
      raf=requestAnimationFrame(frame);
    });
  }

  async function play(){
    if(running)return;
    running=true;
    clearAll();
    buildHud();
    const w=wrap();
    if(!w){running=false;return;}
    w.classList.remove('voice-active','system-online','boot-complete','boot-running');
    void w.offsetWidth;
    w.classList.add('boot-running');
    w.dataset.bootPhase='1';
    w.style.setProperty('--boot-progress','0');
    const n=w.querySelector('.boot-progress strong');
    if(n)n.textContent='00';
    w.querySelectorAll('.boot-panel').forEach(p=>{p.classList.remove('online');const b=p.querySelector('b');if(b)b.textContent='STANDBY'});
    await animateProgress();
    running=false;
  }

  function stateChanged(state){
    const w=wrap();
    if(!w)return;
    if(state==='speaking'){
      w.classList.add('voice-active');
      w.classList.remove('system-online');
      return;
    }
    w.classList.remove('voice-active');
    if(state==='online'){
      w.classList.add('system-online');
      setPhase(6,'ORBIT IST BEREIT');
    }
  }

  window.ORBITBoot={play};

  document.addEventListener('DOMContentLoaded',()=>{
    buildHud();
    const o=document.querySelector('#fridayVoiceOrb');
    if(!o)return;
    stateChanged(o.dataset.state||'idle');
    new MutationObserver(()=>stateChanged(o.dataset.state||'idle')).observe(o,{attributes:true,attributeFilter:['data-state','class']});
  });
})();
