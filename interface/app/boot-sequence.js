(()=>{
  const wrap=()=>document.querySelector('.friday-core-wrap');
  const orb=()=>document.querySelector('#fridayVoiceOrb');
  const status=()=>document.querySelector('.friday-greeting span');
  const timers=[];

  function clearTimers(){while(timers.length)clearTimeout(timers.pop())}
  function setPhase(n,text){const w=wrap();if(!w)return;w.dataset.bootPhase=String(n);if(text&&status())status().textContent=text}
  function buildHud(){
    const w=wrap();
    if(!w||w.querySelector('.friday-boot-hud'))return;
    const hud=document.createElement('div');
    hud.className='friday-boot-hud';
    hud.setAttribute('aria-hidden','true');
    hud.innerHTML=`<span class="boot-scan"></span><span class="boot-arc"></span><span class="boot-arc arc-b"></span><span class="boot-cross"></span><span class="boot-module m1">Neural Link<b>Handshake</b></span><span class="boot-module m2">Voice Core<b>Routing</b></span><span class="boot-module m3">Orbit Sync<b>Secure Link</b></span><span class="boot-module m4">Systems<b>Nominal</b></span><span class="boot-spark"></span><span class="boot-spark"></span><span class="boot-spark"></span>`;
    w.prepend(hud);
    w.dataset.bootPhase='0';
  }

  function runBoot(){
    clearTimers();
    const w=wrap();if(!w)return;
    w.classList.remove('voice-active','system-online');
    setPhase(1,'NEURAL LINK · HANDSHAKE');
    timers.push(setTimeout(()=>setPhase(2,'VOICE CORE · INITIALISIERT'),520));
    timers.push(setTimeout(()=>setPhase(3,'ORBIT SYNC · VERBINDUNG STABIL'),1050));
    timers.push(setTimeout(()=>setPhase(4,'ALLE SYSTEME · NOMINAL'),1580));
  }

  function stateChanged(state){
    const w=wrap();if(!w)return;
    if(state==='booting'){runBoot();return}
    if(state==='speaking'){
      if(!w.dataset.bootPhase||Number(w.dataset.bootPhase)<4)setPhase(4);
      w.classList.add('voice-active');
      w.classList.remove('system-online');
      return;
    }
    w.classList.remove('voice-active');
    if(state==='online'){
      w.classList.add('system-online');
      setPhase(4,'ORBIT IST BEREIT');
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    buildHud();
    const o=orb();if(!o)return;
    stateChanged(o.dataset.state||'idle');
    new MutationObserver(()=>stateChanged(o.dataset.state||'idle')).observe(o,{attributes:true,attributeFilter:['data-state','class']});
  });
})();
