(()=>{
  // FRIDAY is the real launch screen, not a one-time onboarding screen.
  localStorage.removeItem('orbit.started');

  const orb=()=>document.querySelector('#fridayVoiceOrb');
  let speakTimer=null;
  let launchTimer=null;
  let launching=false;

  function setSpeaking(active=true,duration=0){
    const el=orb();if(!el)return;
    el.classList.toggle('speaking',!!active);
    clearTimeout(speakTimer);
    if(active&&duration>0)speakTimer=setTimeout(()=>setSpeaking(false),duration);
  }

  function getGreeting(){
    const hour=new Date().getHours();
    if(hour<11)return'Guten Morgen, Rene. Friday ist bereit.';
    if(hour<18)return'Guten Tag, Rene. Friday ist bereit.';
    return'Guten Abend, Rene. Friday ist bereit.';
  }

  function pickGermanVoice(){
    if(!('speechSynthesis'in window))return null;
    const voices=window.speechSynthesis.getVoices();
    const german=voices.filter(v=>(v.lang||'').toLowerCase().startsWith('de'));
    if(!german.length)return null;
    const preferred=german.find(v=>/female|anna|katja|petra|hedda|siri|google deutsch/i.test(v.name||''));
    return preferred||german[0];
  }

  function speak(text,{onend}={}){
    if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined'){
      setSpeaking(true,1100);
      setTimeout(()=>{setSpeaking(false);onend?.()},1000);
      return false;
    }

    const synth=window.speechSynthesis;
    synth.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='de-DE';
    const voice=pickGermanVoice();
    if(voice)utterance.voice=voice;
    utterance.rate=.96;
    utterance.pitch=1.06;
    utterance.volume=1;

    let finished=false;
    const finish=()=>{
      if(finished)return;
      finished=true;
      clearTimeout(launchTimer);
      setSpeaking(false);
      onend?.();
    };

    utterance.onstart=()=>setSpeaking(true);
    utterance.onend=finish;
    utterance.onerror=finish;
    setSpeaking(true);
    synth.speak(utterance);
    launchTimer=setTimeout(finish,5000);
    return true;
  }

  function launchApp(){
    const greeting=document.querySelector('.friday-greeting span');
    if(greeting)greeting.textContent='ORBIT ist bereit.';
    if(typeof window.showApp==='function')window.showApp();
  }

  function launchWithVoice(event){
    if(launching)return;
    launching=true;
    event.preventDefault();
    event.stopImmediatePropagation();
    const greeting=document.querySelector('.friday-greeting span');
    if(greeting)greeting.textContent='FRIDAY spricht …';
    speak(getGreeting(),{onend:launchApp});
  }

  window.ORBITFriday={setSpeaking,speak};

  document.addEventListener('DOMContentLoaded',()=>{
    const btn=document.querySelector('#initiateBtn');
    if(btn)btn.addEventListener('click',launchWithVoice,{capture:true});
    if('speechSynthesis'in window){
      window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged',()=>window.speechSynthesis.getVoices(),{once:true});
    }
  });
})();
