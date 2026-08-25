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
      <div class="boot-vignette"></div>
      <div class="boot-scanline"></div>
      <div class="boot-reactor">
        <span class="reactor-ring rr-1"></span>
        <span class="reactor-ring rr-2"></span>
        <span class="reactor-ring rr-3"></span>
        <span class="reactor-ring rr-4"></span>
        <span class="reactor-ring rr-5"></span>
        <span class="reactor-ticks"></span>
        <span class="reactor-energy-track"></span>
        <span class="reactor-energy-runner runner-a"></span>
        <span class="reactor-energy-runner runner-b"></span>
        <span class="reactor-energy-runner runner-c"></span>
        <span class="reactor-sweep"></span>
        <span class="reactor-cross"></span>
        <span class="reactor-pulse"></span>
        <span class="reactor-shock"></span>
        <span class="reactor-orbit-dot dot-a"></span>
        <span class="reactor-orbit-dot dot-b"></span>
        <span class="reactor-orbit-dot dot-c"></span>
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
    w.style.setProperty('--boot-progress01','0');
  }

  function updatePanels(value){
    const w=wrap();
    if(!w)return;
    const checkpoints=[10,24,40,58,74,88];
    w.querySelectorAll('.boot-panel').forEach((panel,index)=>{
      const on=value>=checkpoints[index];
      panel.classList.toggle('online',on);
      const b=panel.querySelector('b');
      if(b)b.textContent=on?'ONLINE':'STANDBY';
    });
  }

  function phaseFor(value){
    if(value<12)return[1,'CORE ASSEMBLY · ENERGIEAUFBAU'];
    if(value<30)return[2,'VOICE CORE · INITIALISIERUNG'];
    if(value<48)return[3,'ORBIT SYNC · SECURE LINK'];
    if(value<67)return[4,'SYSTEMMODULE · LADEN'];
    if(value<86)return[5,'KERNSTABILISIERUNG · FINAL'];
    return[6,'ALLE SYSTEME · NOMINAL'];
  }

  function stageClass(value){
    if(value<12)return'energy-stage-1';
    if(value<35)return'energy-stage-2';
    if(value<60)return'energy-stage-3';
    if(value<85)return'energy-stage-4';
    return'energy-stage-5';
  }

  function animateProgress(duration=7200){
    return new Promise(resolve=>{
      const w=wrap();
      if(!w){resolve();return;}
      const number=w.querySelector('.boot-progress strong');
      const start=performance.now();
      let lastPhase=-1;
      let lastStage='';

      const frame=now=>{
        const raw=Math.min(1,(now-start)/duration);
        const eased=raw<.78
          ? (1-Math.pow(1-raw/.78,2.25))*.90
          : .90+((raw-.78)/.22)*.10;
        const value=Math.min(100,Math.floor(eased*100));
        const p01=(value/100).toFixed(3);
        w.style.setProperty('--boot-progress',String(value));
        w.style.setProperty('--boot-progress01',p01);
        w.style.setProperty('--energy-speed',String(Math.max(.42,1.35-value*.0085))+'s');
        if(number)number.textContent=String(value).padStart(2,'0');
        updatePanels(value);

        const nextStage=stageClass(value);
        if(nextStage!==lastStage){
          ['energy-stage-1','energy-stage-2','energy-stage-3','energy-stage-4','energy-stage-5'].forEach(c=>w.classList.remove(c));
          w.classList.add(nextStage);
          lastStage=nextStage;
        }

        const [phase,text]=phaseFor(value);
        if(phase!==lastPhase){lastPhase=phase;setPhase(phase,text)}
        if(raw<1){raf=requestAnimationFrame(frame);return;}

        raf=0;
        w.classList.add('boot-complete');
        setPhase(6,'ORBIT CORE · 100% · ONLINE');
        timers.push(setTimeout(()=>resolve(),900));
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
    w.classList.remove('voice-active','system-online','boot-complete','boot-running','energy-stage-1','energy-stage-2','energy-stage-3','energy-stage-4','energy-stage-5');
    void w.offsetWidth;
    w.classList.add('boot-running','energy-stage-1');
    w.dataset.bootPhase='1';
    w.style.setProperty('--boot-progress','0');
    w.style.setProperty('--boot-progress01','0');
    w.style.setProperty('--energy-speed','1.35s');
    const n=w.querySelector('.boot-progress strong');
    if(n)n.textContent='00';
    w.querySelectorAll('.boot-panel').forEach(p=>{p.classList.remove('online');const b=p.querySelector('b');if(b)b.textContent='STANDBY'});
    await animateProgress(7200);
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
