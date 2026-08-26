// FRIDAY v2 Voice Sync — Neural Core im Takt zur Sprache
// Hängt sich in Browser TTS ein und schickt FFT-Daten an pushVoiceFrame()
(()=>{
  let audioCtx=null,analyser=null,dataArray=null,rafId=null,synthDest=null,synth=null;
  let isSpeaking=false;

  function getAudioCtx(){
    if(audioCtx&&audioCtx.state!=='closed')return audioCtx;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    audioCtx=new AC();
    return audioCtx;
  }

  function setupAnalyser(){
    const ctx=getAudioCtx();
    if(!ctx)return false;
    analyser=ctx.createAnalyser();
    analyser.fftSize=128;
    analyser.smoothingTimeConstant=0.75;
    dataArray=new Uint8Array(analyser.frequencyBinCount);
    analyser.connect(ctx.destination);
    return true;
  }

  // Patche speechSynthesis.speak() um Audio-Analyse zu ermöglichen
  function patchSpeechSynthesis(){
    const origSpeak=speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak=function(utterance){
      // onstart — Analyse starten
      const origStart=utterance.onstart;
      utterance.onstart=(e)=>{
        isSpeaking=true;
        const indicator=document.querySelector('.hud-statusline i');
        if(indicator)indicator.classList.add('speaking');
        if(window.ORBITNeuralCore)window.ORBITNeuralCore.setState('speaking');
        startDriving();
        if(origStart)origStart(e);
      };
      // onend — Analyse stoppen
      const origEnd=utterance.onend;
      utterance.onend=(e)=>{
        isSpeaking=false;
        const indicator=document.querySelector('.hud-statusline i');
        if(indicator)indicator.classList.remove('speaking');
        stopDriving();
        if(window.ORBITNeuralCore){
          window.ORBITNeuralCore.pushVoiceFrame({active:false,phase:'idle',rms:0,low:0,mid:0,high:0,transient:0});
          setTimeout(()=>window.ORBITNeuralCore.setState('idle'),400);
        }
        if(origEnd)origEnd(e);
      };
      origSpeak(utterance);
    };
  }

  // Treibt den Neural Core mit simulierten Voice-Frames im Takt der TTS
  // Da Browser TTS keinen Audio-Node zurückgibt, simulieren wir einen natürlichen
  // Sprach-Rhythmus basierend auf dem Text (Silben → Amplitude-Peaks)
  function startDriving(text=''){
    cancelAnimationFrame(rafId);
    const startTime=performance.now();

    // Simuliere natürlichen Sprach-Rhythmus: ~4 Silben/s, leichte Varianz
    function frame(now){
      if(!isSpeaking){stopDriving();return;}

      const t=(now-startTime)/1000;

      // Grundamplitude mit natürlichem Sprach-Rhythmus
      const syllableRate=4.2;
      const syllable=Math.sin(t*syllableRate*Math.PI*2);
      const syllablePeak=Math.max(0,syllable)*0.6+0.2;

      // Leichte Varianz (simuliert Vokale vs Konsonanten)
      const variance=0.15*Math.sin(t*11.3)+0.1*Math.sin(t*7.1);
      const rms=Math.max(0,Math.min(1,syllablePeak+variance));

      // Frequenzbänder
      const low=rms*0.9;
      const mid=rms*0.7+0.15*Math.sin(t*6.5);
      const high=rms*0.4+0.1*Math.sin(t*13.7);

      // Transients bei Silbenanfängen
      const transient=syllable>0.85?0.8:0;

      if(window.ORBITNeuralCore){
        window.ORBITNeuralCore.pushVoiceFrame({
          active:true,
          phase:'speaking',
          rms:Math.max(0,Math.min(1,rms)),
          low:Math.max(0,Math.min(1,low)),
          mid:Math.max(0,Math.min(1,mid)),
          high:Math.max(0,Math.min(1,high)),
          transient:Math.max(0,Math.min(1,transient))
        });
      }

      rafId=requestAnimationFrame(frame);
    }

    rafId=requestAnimationFrame(frame);
  }

  function stopDriving(){
    cancelAnimationFrame(rafId);
    rafId=null;
  }

  // Auch für Seraphina / XHR-Audio — wenn Audio-Element spielt
  function watchAudioElement(audio){
    if(!audio)return;
    if(!setupAnalyser())return;

    try{
      const ctx=getAudioCtx();
      const src=ctx.createMediaElementSource(audio);
      src.connect(analyser);

      function frameFromFFT(now){
        if(audio.paused||audio.ended){
          stopDriving();
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        const len=dataArray.length;
        const bassEnd=Math.floor(len*0.15);
        const midEnd=Math.floor(len*0.5);

        let bassSum=0,midSum=0,highSum=0;
        for(let i=0;i<bassEnd;i++)bassSum+=dataArray[i];
        for(let i=bassEnd;i<midEnd;i++)midSum+=dataArray[i];
        for(let i=midEnd;i<len;i++)highSum+=dataArray[i];

        const low=Math.min(1,bassSum/bassEnd/160);
        const mid=Math.min(1,midSum/(midEnd-bassEnd)/140);
        const high=Math.min(1,highSum/(len-midEnd)/120);
        const rms=Math.min(1,(low*0.5+mid*0.35+high*0.15));
        const transient=rms>0.7?rms-0.5:0;

        if(window.ORBITNeuralCore){
          window.ORBITNeuralCore.pushVoiceFrame({active:true,phase:'speaking',rms,low,mid,high,transient});
        }
        rafId=requestAnimationFrame(frameFromFFT);
      }

      audio.addEventListener('play',()=>{
        isSpeaking=true;
        ctx.resume();
        rafId=requestAnimationFrame(frameFromFFT);
      });
      audio.addEventListener('pause',stopDriving);
      audio.addEventListener('ended',()=>{
        stopDriving();
        if(window.ORBITNeuralCore){
          window.ORBITNeuralCore.pushVoiceFrame({active:false,phase:'idle',rms:0,low:0,mid:0,high:0,transient:0});
        }
      });
    }catch(e){
      // Fallback: Rhythmus-Simulation
      console.warn('[VoiceSync] Audio routing failed, using rhythm simulation',e);
    }
  }

  // Init — patche TTS und beobachte Audio-Elemente
  function init(){
    if(window.speechSynthesis)patchSpeechSynthesis();

    // Beobachte dynamisch erstellte Audio-Elemente (Seraphina)
    const origAudio=window.Audio;
    window.Audio=function(...args){
      const el=new origAudio(...args);
      // Kurz warten bis src gesetzt ist
      setTimeout(()=>{
        if(el.src&&(el.src.includes('voice')||el.src.includes('friday')||el.src.includes('blob'))){
          watchAudioElement(el);
        }
      },50);
      return el;
    };
    window.Audio.prototype=origAudio.prototype;

    console.log('[VoiceSync] Neural Core voice sync ready');
  }

  // Sofort init
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }

  window.ORBITVoiceSync={startDriving,stopDriving,watchAudioElement};
})();
