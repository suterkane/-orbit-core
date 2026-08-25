(()=>{
  localStorage.removeItem('orbit.started');
  const VOICE_URL='https://vhmokhunkvoctavmrjwl.supabase.co/functions/v1/friday-voice';
  const SYNC_KEY_STORAGE='orbit.sync.key.v1';
  const PRIVATE_MUSIC_URL='./private-assets/friday-music.m4a';
  const BUNDLED_MUSIC_URL='./assets/orbit-cinematic-boot.m4a';
  const LOCAL_NEURAL_VOICE_URL='./assets/friday-neural-de.ogg';
  const HANDOFF_DELAY=4550;
  const MUSIC_MAX_MS=20000;
  const LOCAL_VOICE_RATE=1.12;
  const FRIDAY_VOICE_PROFILE={lang:'de-DE',rate:1.08,pitch:1.0,volume:1};
  const AUDIO_MIX=window.ORBITAudioMix||{private:.42,synthetic:.31,ducked:.14,handoff:.29};
  const orb=()=>document.querySelector('#fridayVoiceOrb');
  const statusText=()=>document.querySelector('.friday-greeting span');
  let speakTimer=null,launchTimer=null,launching=false,activeAudio=null,activeAudioUrl='',activeSource=null;
  let privateMusic=null,usingPrivateMusic=false,musicStopTimer=null;
  let musicCtx=null,musicMaster=null,musicNodes=[],pulseTimer=null,melodyTimer=null;

  function setOrbState(state='idle'){const el=orb();if(!el)return;el.dataset.state=state;el.classList.toggle('speaking',state==='speaking');el.setAttribute('aria-busy',state==='speaking'?'true':'false')}
  function setMusicLevel(level=.18,time=.35){
    if(usingPrivateMusic&&privateMusic){privateMusic.volume=Math.max(0,Math.min(1,level));return}
    if(!musicMaster||!musicCtx)return;const now=musicCtx.currentTime;musicMaster.gain.cancelScheduledValues(now);musicMaster.gain.setValueAtTime(Math.max(musicMaster.gain.value,.0001),now);musicMaster.gain.linearRampToValueAtTime(level,now+time)
  }
  function setSpeaking(active=true,duration=0){setMusicLevel(active?AUDIO_MIX.ducked:AUDIO_MIX.handoff,active?.18:.4);setOrbState(active?'speaking':'idle');if(window.ORBITNeuralCore){window.ORBITNeuralCore.setState(active?'speaking':'idle');window.ORBITNeuralCore.pushVoiceFrame({active,phase:active?'speaking':'idle',rms:active?.34:0,low:active?.42:0,mid:active?.3:0,high:active?.16:0,transient:active?.5:0})}clearTimeout(speakTimer);if(active&&duration>0)speakTimer=setTimeout(()=>setSpeaking(false),duration)}
  function pick(list){return list[Math.floor(Math.random()*list.length)]}
  function getSituation(){
    const overdue=Number(document.querySelector('#overdueCount')?.textContent)||0;
    const today=Number(document.querySelector('#todayCount')?.textContent)||0;
    return overdue>0?'serious':today===0?'light':'normal';
  }
  function getGreeting(){
    const h=new Date().getHours(),situation=getSituation();
    if(situation==='serious')return h<11?'Guten Morgen, Mister Stark. Wir haben etwas zu tun.':h<18?'Guten Tag, Mister Stark. Ich habe Prioritäten für Sie.':'Guten Abend, Mister Stark. Es gibt noch offene Punkte.';
    const pool=h<11?
      ['Guten Morgen, Boss.','Guten Morgen, Mister Stark.','Morgen, Boss. Ich bin schon wach.','Guten Morgen. Kaffee kann ich nicht machen, den Rest schon.']:
      h<18?
      ['Guten Tag, Boss.','Guten Tag, Mister Stark.','Da sind Sie ja, Boss.','Willkommen zurück, Mister Stark.']:
      ['Guten Abend, Boss.','Guten Abend, Mister Stark.','Da sind Sie ja, Boss. Der Tag war offenbar noch nicht teuer genug.','Guten Abend. Ich hatte schon befürchtet, Sie machen heute pünktlich Schluss.'];
    return pick(pool);
  }
  async function getVaultBriefing(){
    try{
      const r=await fetch('./vault_briefing.json?_='+Date.now(),{cache:'no-store'});
      if(!r.ok)return'';
      const d=await r.json();
      if(!d||!d.projects||!d.projects.length)return'';
      const names=d.projects.slice(0,3)
        .map(p=>p.replace(/Medizinische Chronik|HWS,BWS,LWS|HWS|BWS|LWS|-/g,' ').replace(/\s+/g,' ').trim())
        .filter(p=>p.length>3);
      return names.length?'Aktive Bereiche aus deinem Vault: '+names.join(', ')+'.':'';
    }catch{return''}
  }
  async function getBootNarration(){
    let briefing='',briefingData=null;
    try{if(window.ORBITIntegrations?.getBriefingData){briefingData=await window.ORBITIntegrations.getBriefingData();briefing=window.ORBITIntegrations.buildBriefingSummary(briefingData)}else if(window.ORBITIntegrations?.getBriefingSummary)briefing=await window.ORBITIntegrations.getBriefingSummary()}catch{}
    let vaultInfo='';try{vaultInfo=await getVaultBriefing()}catch{}
    const now=new Date(),dateText=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long'}).format(now);window.ORBITPanorama?.applyBriefing(briefingData||{date:dateText});
    const situation=getSituation();
    const closing=situation==='serious'?'Ich habe die kritischen Punkte priorisiert. Wir können anfangen.':pick(['Alle Systeme stabil. Bereit.','Systeme bereit, Boss.','ORBIT steht. Ich auch.','Bereit, Mister Stark.']);
    return [getGreeting(),`Heute ist ${dateText}.`,'ORBIT Core ist online.',briefing,vaultInfo,closing].filter(Boolean).join(' ');
  }

  async function tryBundledMusic(){
    try{
      const audio=new Audio(BUNDLED_MUSIC_URL);audio.loop=false;audio.preload='auto';audio.volume=AUDIO_MIX.private;
      await audio.play();privateMusic=audio;usingPrivateMusic=true;setMusicLevel(orb()?.dataset.state==='speaking'?AUDIO_MIX.ducked:AUDIO_MIX.private,.18);return true;
    }catch{try{privateMusic?.pause()}catch{}privateMusic=null;usingPrivateMusic=false;return false}
  }
  async function tryPrivateMusic(){
    if(privateMusic&&usingPrivateMusic){try{await privateMusic.play();return true}catch{return false}}
    try{
      const audio=new Audio(PRIVATE_MUSIC_URL);audio.loop=false;audio.preload='auto';audio.volume=AUDIO_MIX.private;
      await audio.play();privateMusic=audio;usingPrivateMusic=true;setMusicLevel(orb()?.dataset.state==='speaking'?AUDIO_MIX.ducked:AUDIO_MIX.private,.18);return true;
    }catch{try{privateMusic?.pause()}catch{}privateMusic=null;usingPrivateMusic=false;return false}
  }
  function startSyntheticMusic(){
    if(musicCtx){musicCtx.resume?.();setMusicLevel(AUDIO_MIX.synthetic,.25);return}
    const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
    try{
      musicCtx=new AudioCtx();musicCtx.resume?.();musicMaster=musicCtx.createGain();musicMaster.gain.value=.0001;musicMaster.connect(musicCtx.destination);
      const filter=musicCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1850;filter.Q.value=.72;filter.connect(musicMaster);musicNodes.push(filter);
      const now=musicCtx.currentTime;
      [[73.42,'sine',.34],[110,'triangle',.18],[146.83,'sine',.105],[220,'sine',.052],[293.66,'sine',.024]].forEach(([freq,type,g])=>{const o=musicCtx.createOscillator(),gain=musicCtx.createGain();o.type=type;o.frequency.value=freq;gain.gain.value=g;o.connect(gain);gain.connect(filter);o.start();musicNodes.push(o,gain)});
      const shimmer=musicCtx.createOscillator(),shimmerGain=musicCtx.createGain();shimmer.type='sine';shimmer.frequency.value=440;shimmerGain.gain.value=.024;shimmer.connect(shimmerGain);shimmerGain.connect(filter);shimmer.start();musicNodes.push(shimmer,shimmerGain);
      musicMaster.gain.exponentialRampToValueAtTime(AUDIO_MIX.synthetic,now+.55);
      let beat=0;const pulse=()=>{if(!musicCtx||musicCtx.state==='closed')return;const t=musicCtx.currentTime,o=musicCtx.createOscillator(),g=musicCtx.createGain();o.type='sine';o.frequency.setValueAtTime(62,t);o.frequency.exponentialRampToValueAtTime(43,t+.28);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(beat%4===0?.34:.18,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+.34);o.connect(g);g.connect(musicMaster);o.start(t);o.stop(t+.36);beat++};
      pulse();pulseTimer=setInterval(pulse,690);
      const notes=[293.66,329.63,440,392,329.63,293.66,246.94,293.66];let noteIndex=0;const melody=()=>{if(!musicCtx||musicCtx.state==='closed')return;const t=musicCtx.currentTime,o=musicCtx.createOscillator(),g=musicCtx.createGain();o.type='triangle';o.frequency.value=notes[noteIndex++%notes.length];g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.055,t+.06);g.gain.exponentialRampToValueAtTime(.0001,t+1.05);o.connect(g);g.connect(filter);o.start(t);o.stop(t+1.1)};melodyTimer=setInterval(melody,1380);
    }catch{stopBootMusic(true)}
  }
  async function startBootMusic(){const started=await tryBundledMusic()||await tryPrivateMusic();if(!started)startSyntheticMusic();clearTimeout(musicStopTimer);musicStopTimer=setTimeout(()=>stopBootMusic(),MUSIC_MAX_MS);return started}
  function stopBootMusic(immediate=false){
    clearTimeout(musicStopTimer);musicStopTimer=null;
    if(privateMusic){try{privateMusic.pause();privateMusic.currentTime=0}catch{}privateMusic=null;usingPrivateMusic=false}
    if(!musicCtx)return;clearInterval(pulseTimer);clearInterval(melodyTimer);pulseTimer=null;melodyTimer=null;try{const ctx=musicCtx,master=musicMaster,now=ctx.currentTime;if(master){master.gain.cancelScheduledValues(now);master.gain.setValueAtTime(Math.max(master.gain.value,.0001),now);master.gain.exponentialRampToValueAtTime(.0001,now+(immediate?.05:.7))}setTimeout(()=>{musicNodes.forEach(n=>{try{n.stop?.()}catch{}});musicNodes=[];try{ctx.close()}catch{}},immediate?80:800)}catch{}musicCtx=null;musicMaster=null
  }
  function cleanupAudio(){try{activeAudio?.pause()}catch{}try{activeSource?.stop()}catch{}activeAudio=null;activeSource=null;if(activeAudioUrl){URL.revokeObjectURL(activeAudioUrl);activeAudioUrl=''}}
  function stopSpeaking(){try{window.speechSynthesis?.cancel()}catch{}cleanupAudio();clearTimeout(launchTimer);clearTimeout(speakTimer);setSpeaking(false)}

  async function speakSeraphina(text,{onend}={}){
    const syncKey=(localStorage.getItem(SYNC_KEY_STORAGE)||'').trim();if(!syncKey)return false;
    try{
      const response=await fetch(VOICE_URL,{method:'POST',headers:{'Content-Type':'application/json','x-orbit-sync-key':syncKey},body:JSON.stringify({text}),cache:'no-store'});if(!response.ok)return false;
      const blob=await response.blob();if(!blob.size)return false;cleanupAudio();let finished=false;const finish=()=>{if(finished)return;finished=true;clearTimeout(launchTimer);setSpeaking(false);cleanupAudio();onend?.()};
      if(musicCtx&&musicCtx.state!=='closed'){await musicCtx.resume?.();const buffer=await musicCtx.decodeAudioData(await blob.arrayBuffer());const source=musicCtx.createBufferSource(),gain=musicCtx.createGain();gain.gain.value=1;source.buffer=buffer;source.connect(gain);gain.connect(musicCtx.destination);activeSource=source;source.onended=finish;setSpeaking(true);const status=statusText();if(status)status.textContent='FRIDAY spricht · SERAPHINA HD';source.start();launchTimer=setTimeout(finish,30000);return true}
      activeAudioUrl=URL.createObjectURL(blob);activeAudio=new Audio(activeAudioUrl);activeAudio.preload='auto';activeAudio.onplay=()=>{setSpeaking(true);const status=statusText();if(status)status.textContent='FRIDAY spricht · SERAPHINA HD'};activeAudio.onended=finish;activeAudio.onerror=finish;await activeAudio.play();launchTimer=setTimeout(finish,30000);return true;
    }catch{cleanupAudio();setSpeaking(false);return false}
  }
  function getGermanVoices(){if(!('speechSynthesis'in window))return[];return window.speechSynthesis.getVoices().filter(v=>(v.lang||'').toLowerCase().startsWith('de'))}
  function pickGermanVoice(){const german=getGermanVoices();if(!german.length)return null;const scored=german.map(v=>{const n=(v.name||'').toLowerCase();let score=0;if(n.includes('premium')||n.includes('enhanced'))score+=120;if(n.includes('anna'))score+=100;if(n.includes('petra'))score+=80;if(n.includes('online')&&n.includes('natural'))score+=75;if(n.includes('katja'))score+=70;if(n.includes('microsoft'))score+=45;if(n.includes('google deutsch'))score+=35;if((v.lang||'').toLowerCase()==='de-de')score+=15;return{v,score}}).sort((a,b)=>b.score-a.score);return scored[0]?.v||german[0]}
  function warmVoices(){if('speechSynthesis'in window)window.speechSynthesis.getVoices()}
  function speakBrowser(text,{onend}={}){if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return false;const synth=window.speechSynthesis;synth.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang=FRIDAY_VOICE_PROFILE.lang;const voice=pickGermanVoice();if(voice)utterance.voice=voice;utterance.rate=FRIDAY_VOICE_PROFILE.rate;utterance.pitch=FRIDAY_VOICE_PROFILE.pitch;utterance.volume=FRIDAY_VOICE_PROFILE.volume;let finished=false;const finish=()=>{if(finished)return;finished=true;clearTimeout(launchTimer);setSpeaking(false);onend?.()};utterance.onstart=()=>{setSpeaking(true);const status=statusText();if(status)status.textContent=`FRIDAY spricht · FALLBACK ${voice?.name||'BROWSER'}`};utterance.onend=finish;utterance.onerror=finish;synth.resume?.();synth.speak(utterance);setSpeaking(true);launchTimer=setTimeout(finish,30000);return true}
  async function speakLocalNeural({onend}={}){try{cleanupAudio();let finished=false;const finish=()=>{if(finished)return;finished=true;clearTimeout(launchTimer);setSpeaking(false);cleanupAudio();onend?.()};activeAudio=new Audio(LOCAL_NEURAL_VOICE_URL);activeAudio.preload='auto';activeAudio.playbackRate=LOCAL_VOICE_RATE;activeAudio.preservesPitch=true;activeAudio.onplay=()=>{setSpeaking(true);const status=statusText();if(status)status.textContent='FRIDAY spricht · NEURAL LOCAL'};activeAudio.onended=finish;activeAudio.onerror=finish;await activeAudio.play();launchTimer=setTimeout(finish,30000);return true}catch{cleanupAudio();setSpeaking(false);return false}}
  async function speak(text,{onend}={}){const status=statusText();if(status)status.textContent='FRIDAY initialisiert Seraphina HD …';const played=await speakSeraphina(text,{onend});if(played)return true;if(status)status.textContent='FRIDAY startet lokale Neuralstimme …';const localPlayed=await speakLocalNeural({onend});if(localPlayed)return true;if(status)status.textContent='FRIDAY startet Browser-Notfallstimme …';return speakBrowser(text,{onend})}
  function launchApp(){const status=statusText();setOrbState('online');if(status)status.textContent='FRIDAY · ONLINE';const app=document.querySelector('#app'),splash=document.querySelector('#splash'),target=document.querySelector('.hud-core');if(app){app.classList.remove('hidden');app.classList.add('handoff-underlay')}if(splash)splash.classList.add('handoff-out');window.ORBITNeuralCore?.dockTo(target);setTimeout(()=>{if(typeof window.showApp==='function')window.showApp();if(app)app.classList.remove('handoff-underlay')},560)}
  async function launchWithVoice(event){if(launching)return;launching=true;event.preventDefault();event.stopImmediatePropagation();window.ORBITNeuralCore?.unlockAudio();void startBootMusic();const status=statusText();setOrbState('booting');if(window.ORBITNeuralCore)window.ORBITNeuralCore.assemble();if(status)status.textContent='FRIDAY erstellt Lagebericht …';setTimeout(launchApp,HANDOFF_DELAY);const narration=await getBootNarration();speak(narration,{onend:()=>stopBootMusic()}).catch(()=>stopBootMusic())}

  window.ORBITFriday={setSpeaking,setOrbState,setMusicLevel,speak,stopSpeaking,getGreeting,getBootNarration,pickGermanVoice,speakSeraphina,speakLocalNeural,startBootMusic,stopBootMusic,voiceProfile:FRIDAY_VOICE_PROFILE,bundledMusicUrl:BUNDLED_MUSIC_URL,privateMusicUrl:PRIVATE_MUSIC_URL,localNeuralVoiceUrl:LOCAL_NEURAL_VOICE_URL};
  document.addEventListener('DOMContentLoaded',()=>{const btn=document.querySelector('#initiateBtn');if(btn)btn.addEventListener('click',launchWithVoice,{capture:true});setOrbState('idle');warmVoices();if('speechSynthesis'in window)window.speechSynthesis.addEventListener?.('voiceschanged',warmVoices,{once:true})});
})();
