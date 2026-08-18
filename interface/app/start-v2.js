(()=>{
  // FRIDAY is the real launch screen, not a one-time onboarding screen.
  localStorage.removeItem('orbit.started');

  const orb=()=>document.querySelector('#fridayVoiceOrb');
  const statusText=()=>document.querySelector('.friday-greeting span');
  let speakTimer=null;
  let launchTimer=null;
  let launching=false;

  function setSpeaking(active=true,duration=0){
    const el=orb();if(!el)return;
    el.classList.toggle('speaking',!!active);
    el.setAttribute('aria-busy',active?'true':'false');
    clearTimeout(speakTimer);
    if(active&&duration>0)speakTimer=setTimeout(()=>setSpeaking(false),duration);
  }

  function getGreeting(){
    const hour=new Date().getHours();
    if(hour<11)return'Guten Morgen, Rene. Friday ist bereit.';
    if(hour<18)return'Guten Tag, Rene. Friday ist bereit.';
    return'Guten Abend, Rene. Friday ist bereit.';
  }

  function getGermanVoices(){
    if(!('speechSynthesis'in window))return[];
    return window.speechSynthesis.getVoices().filter(v=>(v.lang||'').toLowerCase().startsWith('de'));
  }

  function pickGermanVoice(){
    const german=getGermanVoices();
    if(!german.length)return null;

    const preferredNames=[
      /anna/i,/petra/i,/katja/i,/hedda/i,/marlene/i,/vicki/i,/siri/i,/google deutsch/i
    ];
    for(const pattern of preferredNames){
      const match=german.find(v=>pattern.test(v.name||''));
      if(match)return match;
    }

    return german.find(v=>(v.lang||'').toLowerCase()==='de-de')||german[0];
  }

  function warmVoices(){
    if(!('speechSynthesis'in window))return;
    window.speechSynthesis.getVoices();
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
    utterance.rate=.94;
    utterance.pitch=1.08;
    utterance.volume=1;

    let finished=false;
    const finish=()=>{
      if(finished)return;
      finished=true;
      clearTimeout(launchTimer);
      setSpeaking(false);
      onend?.();
    };

    utterance.onstart=()=>{
      setSpeaking(true);
      const status=statusText();
      if(status)status.textContent='FRIDAY spricht …';
    };
    utterance.onend=finish;
    utterance.onerror=finish;

    // iOS Safari occasionally pauses synthesis when the page changes state.
    // resume() is harmless elsewhere and keeps the greeting deterministic.
    synth.resume?.();
    synth.speak(utterance);
    setSpeaking(true);
    launchTimer=setTimeout(finish,6000);
    return true;
  }

  function launchApp(){
    const status=statusText();
    if(status)status.textContent='ORBIT ist bereit.';
    if(typeof window.showApp==='function')window.showApp();
  }

  function launchWithVoice(event){
    if(launching)return;
    launching=true;
    event.preventDefault();
    event.stopImmediatePropagation();
    const status=statusText();
    if(status)status.textContent='FRIDAY initialisiert …';
    speak(getGreeting(),{onend:launchApp});
  }

  window.ORBITFriday={setSpeaking,speak,getGreeting,pickGermanVoice};

  document.addEventListener('DOMContentLoaded',()=>{
    const btn=document.querySelector('#initiateBtn');
    if(btn)btn.addEventListener('click',launchWithVoice,{capture:true});
    warmVoices();
    if('speechSynthesis'in window){
      window.speechSynthesis.addEventListener?.('voiceschanged',warmVoices,{once:true});
    }
  });
})();
