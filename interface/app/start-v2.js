(()=>{
  // FRIDAY is the real launch screen, not a one-time onboarding screen.
  localStorage.removeItem('orbit.started');

  const VOICE_URL='https://vhmokhunkvoctavmrjwl.supabase.co/functions/v1/friday-voice';
  const SYNC_KEY_STORAGE='orbit.sync.key.v1';
  const FRIDAY_VOICE_PROFILE={
    lang:'de-DE',
    rate:1.03,
    pitch:1.08,
    volume:1
  };
  const orb=()=>document.querySelector('#fridayVoiceOrb');
  const statusText=()=>document.querySelector('.friday-greeting span');
  let speakTimer=null;
  let launchTimer=null;
  let launching=false;
  let activeAudio=null;
  let activeAudioUrl='';

  function setOrbState(state='idle'){
    const el=orb();
    if(!el)return;
    el.dataset.state=state;
    el.classList.toggle('speaking',state==='speaking');
    el.setAttribute('aria-busy',state==='speaking'?'true':'false');
  }

  function setSpeaking(active=true,duration=0){
    setOrbState(active?'speaking':'idle');
    clearTimeout(speakTimer);
    if(active&&duration>0)speakTimer=setTimeout(()=>setSpeaking(false),duration);
  }

  function getGreeting(){
    const hour=new Date().getHours();
    if(hour<11)return'Guten Morgen, Mister Stark. ORBIT ist online.';
    if(hour<18)return'Guten Tag, Mister Stark. ORBIT ist online.';
    return'Guten Abend, Mister Stark. ORBIT ist online.';
  }

  function cleanupAudio(){
    try{activeAudio?.pause()}catch{}
    activeAudio=null;
    if(activeAudioUrl){URL.revokeObjectURL(activeAudioUrl);activeAudioUrl=''}
  }

  async function speakSeraphina(text,{onend}={}){
    const syncKey=(localStorage.getItem(SYNC_KEY_STORAGE)||'').trim();
    if(!syncKey)return false;

    try{
      const response=await fetch(VOICE_URL,{
        method:'POST',
        headers:{'Content-Type':'application/json','x-orbit-sync-key':syncKey},
        body:JSON.stringify({text})
      });
      if(!response.ok)return false;

      const blob=await response.blob();
      if(!blob.size)return false;
      cleanupAudio();
      activeAudioUrl=URL.createObjectURL(blob);
      activeAudio=new Audio(activeAudioUrl);
      activeAudio.preload='auto';

      let finished=false;
      const finish=()=>{
        if(finished)return;
        finished=true;
        clearTimeout(launchTimer);
        setSpeaking(false);
        cleanupAudio();
        onend?.();
      };

      activeAudio.onplay=()=>{
        setSpeaking(true);
        const status=statusText();
        if(status)status.textContent='FRIDAY spricht · SERAPHINA HD';
      };
      activeAudio.onended=finish;
      activeAudio.onerror=finish;
      await activeAudio.play();
      launchTimer=setTimeout(finish,9000);
      return true;
    }catch{
      cleanupAudio();
      setSpeaking(false);
      return false;
    }
  }

  function getGermanVoices(){
    if(!('speechSynthesis'in window))return[];
    return window.speechSynthesis.getVoices().filter(v=>(v.lang||'').toLowerCase().startsWith('de'));
  }

  function pickGermanVoice(){
    const german=getGermanVoices();
    if(!german.length)return null;
    const preferredNames=[/anna/i,/katja/i,/petra/i,/hedda/i,/marlene/i,/vicki/i,/siri/i,/google deutsch/i];
    for(const pattern of preferredNames){
      const match=german.find(v=>pattern.test(v.name||''));
      if(match)return match;
    }
    return german.find(v=>(v.lang||'').toLowerCase()==='de-de')||german[0];
  }

  function warmVoices(){
    if('speechSynthesis'in window)window.speechSynthesis.getVoices();
  }

  function speakBrowser(text,{onend}={}){
    if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined'){
      setSpeaking(true,900);
      setTimeout(()=>{setSpeaking(false);onend?.()},850);
      return false;
    }

    const synth=window.speechSynthesis;
    synth.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=FRIDAY_VOICE_PROFILE.lang;
    const voice=pickGermanVoice();
    if(voice)utterance.voice=voice;
    utterance.rate=FRIDAY_VOICE_PROFILE.rate;
    utterance.pitch=FRIDAY_VOICE_PROFILE.pitch;
    utterance.volume=FRIDAY_VOICE_PROFILE.volume;

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
      if(status)status.textContent='FRIDAY spricht · FALLBACK';
    };
    utterance.onend=finish;
    utterance.onerror=finish;
    synth.resume?.();
    synth.speak(utterance);
    setSpeaking(true);
    launchTimer=setTimeout(finish,7500);
    return true;
  }

  async function speak(text,{onend}={}){
    const status=statusText();
    if(status)status.textContent='FRIDAY initialisiert Sprachkern …';
    const played=await speakSeraphina(text,{onend});
    if(played)return true;
    if(status)status.textContent='FRIDAY startet mit Ersatzstimme …';
    return speakBrowser(text,{onend});
  }

  function launchApp(){
    const status=statusText();
    setOrbState('online');
    if(status)status.textContent='FRIDAY · ONLINE';
    if(typeof window.showApp==='function')window.showApp();
  }

  async function launchWithVoice(event){
    if(launching)return;
    launching=true;
    event.preventDefault();
    event.stopImmediatePropagation();
    const status=statusText();
    setOrbState('booting');
    if(status)status.textContent='FRIDAY fährt Systeme hoch …';

    try{
      if(window.ORBITBoot?.play)await window.ORBITBoot.play();
    }catch{}

    if(status)status.textContent='FRIDAY Sprachkern wird aktiviert …';
    const started=await speak(getGreeting(),{onend:launchApp});
    if(!started)launchApp();
  }

  window.ORBITFriday={setSpeaking,setOrbState,speak,getGreeting,pickGermanVoice,speakSeraphina,voiceProfile:FRIDAY_VOICE_PROFILE};

  document.addEventListener('DOMContentLoaded',()=>{
    const btn=document.querySelector('#initiateBtn');
    if(btn)btn.addEventListener('click',launchWithVoice,{capture:true});
    setOrbState('idle');
    warmVoices();
    if('speechSynthesis'in window)window.speechSynthesis.addEventListener?.('voiceschanged',warmVoices,{once:true});
  });
})();
