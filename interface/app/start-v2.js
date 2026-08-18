(()=>{
  const orb=()=>document.querySelector('#fridayVoiceOrb');
  let speakTimer=null;
  function setSpeaking(active=true,duration=0){
    const el=orb();if(!el)return;
    el.classList.toggle('speaking',!!active);
    clearTimeout(speakTimer);
    if(active&&duration>0)speakTimer=setTimeout(()=>setSpeaking(false),duration);
  }
  window.ORBITFriday={setSpeaking};
  document.addEventListener('DOMContentLoaded',()=>{
    const btn=document.querySelector('#initiateBtn');
    if(btn)btn.addEventListener('click',()=>setSpeaking(true,1500),{capture:true});
  });
})();
