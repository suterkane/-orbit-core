(()=>{
  localStorage.removeItem('orbit.started');
  const VOICE_URL='https://vhmokhunkvoctavmrjwl.supabase.co/functions/v1/friday-voice';
  const SYNC_KEY_STORAGE='orbit.sync.key.v1';
  const FRIDAY_VOICE_PROFILE={lang:'de-DE',rate:1.0,pitch:1.0,volume:1};
  const orb=()=>document.querySelector('#fridayVoiceOrb');
  const statusText=()=>document.querySelector('.friday-greeting span');
  let speakTimer=null,launchTimer=null,launching=false,activeAudio=null,activeAudioUrl='',activeSource=null;
  let musicCtx=null,musicMaster=null,musicNodes=[],pulseTimer=null,melodyTimer=null;

  function setOrbState(state='idle'){const el=orb();if(!el)return;el.dataset.state=state;el.classList.toggle('speaking',state==='speaking');el.setAttribute('aria-busy',state==='speaking'?'true':'false')}
  function setMusicLevel(level=.18,time=.35){if(!musicMaster||!musicCtx)return;const now=musicCtx.currentTime;musicMaster.gain.cancelScheduledValues(now);musicMaster.gain.setValueAtTime(Math.max(musicMaster.gain.value,.0001),now);musicMaster.gain.linearRampToValueAtTime(level,now+time)}
  function setSpeaking(active=true,duration=0){setOrbState(active?'speaking':'idle');clearTimeout(speakTimer);setMusicLevel(active?.09:.22,.18);if(active&&duration>0)speakTimer=setTimeout(()=>setSpeaking(false),duration)}
  function getGreeting(){const h=new Date().getHours();if(h<11)return'Guten Morgen, Mister Stark. ORBIT ist online.';if(h<18)return'Guten Tag, Mister Stark. ORBIT ist online.';return'Guten Abend, Mister Stark. ORBIT ist online.'}

  function startBootMusic(){
    if(musicCtx){musicCtx.resume?.();setMusicLevel(.24,.25);return}
    const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
    try{
      musicCtx=new AudioCtx();musicCtx.resume?.();
      musicMaster=musicCtx.createGain();musicMaster.gain.value=.0001;musicMaster.connect(musicCtx.destination);
      const filter=musicCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1850;filter.Q.value=.72;filter.connect(musicMaster);musicNodes.push(filter);
      const now=musicCtx.currentTime;
      [[73.42,'sine',.34],[110,'triangle',.18],[146.83,'sine',.105],[220,'sine',.052],[293.66,'sine',.024]].forEach(([freq,type,g])=>{const o=musicCtx.createOscillator(),gain=musicCtx.createGain();o.type=type;o.frequency.value=freq;gain.gain.value=g;o.connect(gain);gain.connect(filter);o.start();musicNodes.push(o,gain)});
      const shimmer=musicCtx.createOscillator(),shimmerGain=musicCtx.createGain();shimmer.type='sine';shimmer.frequency.value=440;shimmerGain.gain.value=.024;shimmer.connect(shimmerGain);shimmerGain.connect(filter);shimmer.start();musicNodes.push(shimmer,shimmerGain);
      musicMaster.gain.exponentialRampToValueAtTime(.24,now+.55);
      let beat=0;
      const pulse=()=>{if(!musicCtx||musicCtx.state==='closed')return;const t=musicCtx.currentTime,o=musicCtx.createOscillator(),g=musicCtx.createGain();o.type='sine';o.frequency.setValueAtTime(62,t);o.frequency.exponentialRampToValueAtTime(43,t+.28);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(beat%4===0?.34:.18,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+.34);o.connect(g);g.connect(musicMaster);o.start(t);o.stop(t+.36);beat++};
      pulse();pulseTimer=setInterval(pulse,690);
      const notes=[293.66,329.63,440,392,329.63,293.66,246.94,293.66];let noteIndex=0;
      const melody=()=>{if(!musicCtx||musicCtx.state==='closed')return;const t=musicCtx.currentTime,o=musicCtx.createOscillator(),g=musicCtx.createGain();o.type='triangle';o.frequency.value=notes[noteIndex++%notes.length];g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.055,t+.06);g.gain.exponentialRampToValueAtTime(.0001,t+1.05);o.connect(g);g.connect(filter);o.start(t);o.stop(t+1.1)};
      melodyTimer=setInterval(melody,1380);
    }catch{stopBootMusic(true)}
  }
  function stopBootMusic(immediate=false){if(!musicCtx)return;clearInterval(pulseTimer);clearInterval(melodyTimer);pulseTimer=null;melodyTimer=null;try{const ctx=musicCtx,master=musicMaster,now=ctx.currentTime;if(master){master.gain.cancelScheduledValues(now);master.gain.setValueAtTime(Math.max(master.gain.value,.0001),now);master.gain.exponentialRampToValueAtTime(.0001,now+(immediate?.05:.7))}setTimeout(()=>{musicNodes.forEach(n=>{try{n.stop?.()}catch{}});musicNodes=[];try{ctx.close()}catch{}},immediate?80:800)}catch{}musicCtx=null;musicMaster=null}
  function cleanupAudio(){try{activeAudio?.pause()}catch{}try{activeSource?.stop()}catch{}activeAudio=null;activeSource=null;if(activeAudioUrl){URL.revokeObjectURL(activeAudioUrl);activeAudioUrl=''}}

  async function speakSeraphina(text,{onend}={}){
    const syncKey=(localStorage.getItem(SYNC_KEY_STORAGE)||'').trim();if(!syncKey)return false;
    try{
      const response=await fetch(VOICE_URL,{method:'POST',headers:{'Content-Type':'application/json','x-orbit-sync-key':syncKey},body:JSON.stringify({text}),cache:'no-store'});if(!response.ok)return false;
      const blob=await response.blob();if(!blob.size)return false;cleanupAudio();let finished=false;
      const finish=()=>{if(finished)return;finished=true;clearTimeout(launchTimer);setSpeaking(false);cleanupAudio();onend?.()};
      if(musicCtx&&musicCtx.state!=='closed'){
        await musicCtx.resume?.();const buffer=await musicCtx.decodeAudioData(await blob.arrayBuffer());const source=musicCtx.createBufferSource(),gain=musicCtx.createGain();gain.gain.value=1;source.buffer=buffer;source.connect(gain);gain.connect(musicCtx.destination);activeSource=source;source.onended=finish;setSpeaking(true);const status=statusText();if(status)status.textContent='FRIDAY spricht · SERAPHINA HD';source.start();launchTimer=setTimeout(finish,10000);return true;
      }
      activeAudioUrl=URL.createObjectURL(blob);activeAudio=new Audio(activeAudioUrl);activeAudio.preload='auto';activeAudio.onplay=()=>{setSpeaking(true);const status=statusText();if(status)status.textContent='FRIDAY spricht · SERAPHINA HD'};activeAudio.onended=finish;activeAudio.onerror=finish;await activeAudio.play();launchTimer=setTimeout(finish,10000);return true;
    }catch{cleanupAudio();setSpeaking(false);return false}
  }
  function getGermanVoices(){if(!('speechSynthesis'in window))return[];return window.speechSynthesis.getVoices().filter(v=>(v.lang||'').toLowerCase().startsWith('de'))}
  function pickGermanVoice(){const german=getGermanVoices();if(!german.length)return null;const scored=german.map(v=>{const n=(v.name||'').toLowerCase();let score=0;if(n.includes('premium')||n.includes('enhanced'))score+=120;if(n.includes('anna'))score+=100;if(n.includes('petra'))score+=80;if(n.includes('online')&&n.includes('natural'))score+=75;if(n.includes('katja'))score+=70;if(n.includes('microsoft'))score+=45;if(n.includes('google deutsch'))score+=35;if((v.lang||'').toLowerCase()==='de-de')score+=15;return{v,score}}).sort((a,b)=>b.score-a.score);return scored[0]?.v||german[0]}
  function warmVoices(){if('speechSynthesis'in window)window.speechSynthesis.getVoices()}
  function speakBrowser(text,{onend}={}){if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return false;const synth=window.speechSynthesis;synth.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang=FRIDAY_VOICE_PROFILE.lang;const voice=pickGermanVoice();if(voice)utterance.voice=voice;utterance.rate=FRIDAY_VOICE_PROFILE.rate;utterance.pitch=FRIDAY_VOICE_PROFILE.pitch;utterance.volume=FRIDAY_VOICE_PROFILE.volume;let finished=false;const finish=()=>{if(finished)return;finished=true;clearTimeout(launchTimer);setSpeaking(false);onend?.()};utterance.onstart=()=>{setSpeaking(true);const status=statusText();if(status)status.textContent=`FRIDAY spricht · FALLBACK ${voice?.name||'BROWSER'}`};utterance.onend=finish;utterance.onerror=finish;synth.resume?.();synth.speak(utterance);setSpeaking(true);launchTimer=setTimeout(finish,7500);return true}
  async function speak(text,{onend}={}){const status=statusText();if(status)status.textContent='FRIDAY initialisiert Seraphina HD …';const played=await speakSeraphina(text,{onend});if(played)return true;if(status)status.textContent='FRIDAY startet lokale Notfallstimme …';return speakBrowser(text,{onend})}
  function launchApp(){const status=statusText();setOrbState('online');if(status)status.textContent='FRIDAY · ONLINE';setMusicLevel(.16,.8);if(typeof window.showApp==='function')window.showApp()}
  async function launchWithVoice(event){if(launching)return;launching=true;event.preventDefault();event.stopImmediatePropagation();startBootMusic();const status=statusText();setOrbState('booting');if(status)status.textContent='FRIDAY fährt Systeme hoch …';let voiceDone=false,bootDone=false;const maybeLaunch=()=>{if(voiceDone&&bootDone)launchApp()},voiceEnd=()=>{voiceDone=true;maybeLaunch()};speak(getGreeting(),{onend:voiceEnd}).then(started=>{if(!started){voiceDone=true;maybeLaunch()}});try{if(window.ORBITBoot?.play)await window.ORBITBoot.play()}catch{}bootDone=true;maybeLaunch();setTimeout(()=>{if(!voiceDone){voiceDone=true;maybeLaunch()}},6000)}

  window.ORBITFriday={setSpeaking,setOrbState,setMusicLevel,speak,getGreeting,pickGermanVoice,speakSeraphina,startBootMusic,stopBootMusic,voiceProfile:FRIDAY_VOICE_PROFILE};
  document.addEventListener('DOMContentLoaded',()=>{const btn=document.querySelector('#initiateBtn');if(btn)btn.addEventListener('click',launchWithVoice,{capture:true});setOrbState('idle');warmVoices();if('speechSynthesis'in window)window.speechSynthesis.addEventListener?.('voiceschanged',warmVoices,{once:true})});
})();
