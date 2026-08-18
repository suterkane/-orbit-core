(()=>{
  const orb=()=>document.querySelector('#fridayVoiceOrb');
  let speakTimer=null;
  let launching=false;

  function setSpeaking(active=true,duration=0){
    const el=orb();if(!el)return;
    el.classList.toggle('speaking',!!active);
    clearTimeout(speakTimer);
    if(active&&duration>0)speakTimer=setTimeout(()=>setSpeaking(false),duration);
  }

  function launchWithVoice(event){
    if(launching)return;
    launching=true;
    event.preventDefault();
    event.stopImmediatePropagation();
    setSpeaking(true,1100);
    const greeting=document.querySelector('.friday-greeting span');
    if(greeting)greeting.textContent='FRIDAY verbindet sich …';
    setTimeout(()=>{
      setSpeaking(false);
      if(typeof window.showApp==='function')window.showApp();
      else document.querySelector('#initiateBtn')?.click();
    },900);
  }

  window.ORBITFriday={setSpeaking};

  document.addEventListener('DOMContentLoaded',()=>{
    const btn=document.querySelector('#initiateBtn');
    if(btn)btn.addEventListener('click',launchWithVoice,{capture:true});
  });
})();
