(()=>{
  // FRIDAY is the real launch screen, not a one-time onboarding screen.
  localStorage.removeItem('orbit.started');

  const VOICE_URL='https://vhmokhunkvoctavmrjwl.supabase.co/functions/v1/friday-voice';
  const SYNC_KEY_STORAGE='orbit.sync.key.v1';
  const FRIDAY_VOICE_PROFILE={lang:'de-DE',rate:1.02,pitch:1.0,volume:1};
  const orb=()=>document.querySelector('#fridayVoiceOrb');
  const statusText=()=>document.querySelector('.friday-greeting span');
  let speakTimer=null,launchTimer=null,launching=false,activeAudio=null,activeAudioUrl='',activeSource=null;
  let musicCtx=null,musicMaster=null,musicNodes=[];

  function setOrbState(state='idle'){
    const el=orb();if(!el)return;
    el.dataset.state=state;
    el.classList.toggle('speaking',state==='speaking');
    el.setAttribute('aria-busy',state==='speaking'?'true':'false');
  }
  function setSpeaking(active=true,duration=0){
    setOrbState(active?'speaking':'idle');clearTimeout(speakTimer);
    if(musicMaster&&musicCtx){
      const now=musicCtx.currentTime;
      musicMaster.gain.cancelScheduledValues(now);
      musicMaster.gain.linearRampToValueAtTime(active?0.035:0.095,now+.18);
    }
    if(active&&duration>0)speakTimer=setTimeout(()=>setSpeaking(false),duration);
  }
  function getGreeting(){
    const hour=new Date().getHours();
    if(hour<11)return'Guten Morgen, Mister Stark. ORBIT ist online.';
    if(hour<18)return'Guten Tag, Mister Stark. ORBIT ist online.';
    return'Guten Abend, Mister Stark. ORBIT ist online.';
  }
  function startBootMusic(){
    if(musicCtx)return;
    const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
    try{
      musicCtx=new AudioCtx();musicMaster=musicCtx.createGain();musicMaster.gain.value=0.0001;musicMaster.connect(musicCtx.destination);
      const now=musicCtx.currentTime;
      const tones=[98,146.83,196,293.66];
      tones.forEach((freq,i)=>{
        const osc=musicCtx.createOscillator(),gain=musicCtx.createGain();
        osc.type=i===1?'triangle':'sine';osc.frequency.value=freq;gain.gain.value=i===0?.24:i===3?.035:.10;
        osc.connect(gain);gain.connect(musicMaster);osc.start();musicNodes.push(osc,gain);
      });
      const lfo=musicCtx.createOscillator(),lfoGain=musicCtx.createGain();lfo.frequency.value=.38;lfoGain.gain.value=.012;lfo.connect(lfoGain);lfoGain.connect(musicMaster.gain);lfo.start();musicNodes.push(lfo,lfoGain);
      musicMaster.gain.exponentialRampToValueAtTime(.095,now+.7);
      musicCtx.resume?.();
    }catch{stopBootMusic(true)}
  }
  function stopBootMusic(immediate=false){
    if(!musicCtx)return;
    try{
      const ctx=musicCtx,master=musicMaster,now=ctx.currentTime;
      if(master){master.gain.cancelScheduledValues(now);master.gain.setValueAtTime(Math.max(master.gain.value,.0001),now);master.gain.exponentialRampToValueAtTime(.0001,now+(immediate?.05:.65))}
      setTimeout(()=>{musicNodes.forEach(n=>{try{n.stop?.()}catch{}});musicNodes=[];try{ctx.close()}catch{}},immediate?80:760);
    }catch{}
    musicCtx=null;musicMaster=null;
  }
  function cleanupAudio(){
    try{activeAudio?.pause()}catch{}
    try{activeSource?.stop()}catch{}
    activeAudio=null;activeSource=null;
    if(activeAudioUrl){URL.revokeObjectURL(activeAudioUrl);activeAudioUrl=''}
  }
  async function speakSeraphina(text,{onend}={}){
    const syncKey=(localStorage.getItem(SYNC_KEY_STORAGE)||'').trim();
    if(!syncKey)return false;
    try{
      const response=await fetch(VOICE_URL,{method:'POST',headers:{'Content-Type':'application/json','x-orbit-sync-key':syncKey},body:JSON.stringify({text}),cache:'no-store'});
      if(!response.ok)return false;
      const blob=await response.blob();if(!blob.size)return false;
      cleanupAudio();
      let finished=false;
      const finish=()=>{if(finished)return;finished=true;clearTimeout(launchTimer);setSpeaking(false);cleanupAudio();onend?.()};

      // Web Audio is already unlocked by the INITIATE tap. This keeps Seraphina smooth on iPhone
      // instead of falling back to the metallic system speech voice.
      if(musicCtx&&musicCtx.state!=='closed'){
        await musicCtx.resume?.();
        const buffer=await musicCtx.decodeAudioData(await blob.arrayBuffer());
        const source=musicCtx.createBufferSource(),gain=musicCtx.createGain();
        gain.gain.value=1;source.buffer=buffer;source.connect(gain);gain.connect(musicCtx.destination);
        activeSource=source;source.onended=finish;
        setSpeaking(true);const status=statusText();if(status)status.textContent='FRIDAY spricht · SERAPHINA HD';
        source.start();launchTimer=setTimeout(finish,10000);return true;
      }

      activeAudioUrl=URL.createObjectURL(blob);activeAudio=new Audio(activeAudioUrl);activeAudio.preload='auto';
      activeAudio.onplay=()=>{setSpeaking(true);const status=statusText();if(status)status.textContent='FRIDAY spricht · SERAPHINA HD'};
      activeAudio.onended=finish;activeAudio.onerror=finish;
      await activeAudio.play();launchTimer=setTimeout(finish,10000);return true;
    }catch{cleanupAudio();setSpeaking(false);return false}
  }
  function getGermanVoices(){
    if(!('speechSynthesis'in window))return[];
    return window.speechSynthesis.getVoices().filter(v=>(v.lang||'').toLowerCase().startsWith('de'));
  }
  function pickGermanVoice(){
    const german=getGermanVoices();if(!german.length)return null;
    const scored=german.map(v=>{
      const n=(v.name||'').toLowerCase();let score=0;
      if(n.includes('premium')||n.includes('enhanced'))score+=120;
      if(n.includes('anna'))score+=100;
      if(n.includes('petra'))score+=80;
      if(n.includes('online')&&n.includes('natural'))score+=75;
      if(n.includes('katja'))score+=70;
      if(n.includes('microsoft'))score+=45;
      if(n.includes('google deutsch'))score+=35;
      if((v.lang||'').toLowerCase()==='de-de')score+=15;
      return{v,score};
    }).sort((a,b)=>b.score-a.score);
    return scored[0]?.v||german[0];
  }
  function warmVoices(){if('speechSynthesis'in window)window.speechSynthesis.getVoices()}
  function speakBrowser(text,{onend}={}){
    if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return false;
    const synth=window.speechSynthesis;synth.cancel();
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang=FRIDAY_VOICE_PROFILE.lang;
    const voice=pickGermanVoice();if(voice)utterance.voice=voice;
    utterance.rate=FRIDAY_VOICE_PROFILE.rate;utterance.pitch=FRIDAY_VOICE_PROFILE.pitch;utterance.volume=FRIDAY_VOICE_PROFILE.volume;
    let finished=false;
    const finish=()=>{if(finished)return;finished=true;clearTimeout(launchTimer);setSpeaking(false);onend?.()};
    utterance.onstart=()=>{setSpeaking(true);const status=statusText();if(status)status.textContent=`FRIDAY spricht · ${voice?.name||'BROWSER'}`};
    utterance.onend=finish;utterance.onerror=finish;
    synth.resume?.();synth.speak(utterance);setSpeaking(true);launchTimer=setTimeout(finish,7500);return true;
  }
  async function speak(text,{onend}={}){
    const status=statusText();if(status)status.textContent='FRIDAY initialisiert Seraphina …';
    const played=await speakSeraphina(text,{onend});if(played)return true;
    if(status)status.textContent='FRIDAY startet lokale Ersatzstimme …';
    return speakBrowser(text,{onend});
  }
  function launchApp(){
    const status=statusText();setOrbState('online');if(status)status.textContent='FRIDAY · ONLINE';
    stopBootMusic();
    if(typeof window.showApp==='function')window.showApp();
  }
  async function launchWithVoice(event){
    if(launching)return;launching=true;event.preventDefault();event.stopImmediatePropagation();
    startBootMusic();
    const status=statusText();setOrbState('booting');if(status)status.textContent='FRIDAY fährt Systeme hoch …';
    const greeting=getGreeting();
    let voiceDone=false,bootDone=false;
    const maybeLaunch=()=>{if(voiceDone&&bootDone)launchApp()};
    const voiceEnd=()=>{voiceDone=true;maybeLaunch()};

    speak(greeting,{onend:voiceEnd}).then(started=>{if(!started){voiceDone=true;maybeLaunch()}});
    try{if(window.ORBITBoot?.play)await window.ORBITBoot.play()}catch{}
    bootDone=true;maybeLaunch();

    // Never strand the launch screen, but give the cloud voice enough time to arrive.
    setTimeout(()=>{if(!voiceDone){voiceDone=true;maybeLaunch()}},6000);
  }

  window.ORBITFriday={setSpeaking,setOrbState,speak,getGreeting,pickGermanVoice,speakSeraphina,startBootMusic,stopBootMusic,voiceProfile:FRIDAY_VOICE_PROFILE};
  document.addEventListener('DOMContentLoaded',()=>{
    const btn=document.querySelector('#initiateBtn');if(btn)btn.addEventListener('click',launchWithVoice,{capture:true});
    setOrbState('idle');warmVoices();
    if('speechSynthesis'in window)window.speechSynthesis.addEventListener?.('voiceschanged',warmVoices,{once:true});
  });
})();