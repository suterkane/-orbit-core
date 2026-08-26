// FRIDAY v2 Voice — Web Speech + TTS + Intent Parser
(()=>{
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const SpeechSynthesis=window.speechSynthesis;
  let recognizer=null,isListening=false;
  
  const COMMANDS={
    'vault aktualisieren':{intent:'refresh_vault',action:'reload'},
    'nächster termin':{intent:'next_event',action:'query'},
    'musik lauter':{intent:'volume_up',action:'control'},
    'musik leiser':{intent:'volume_down',action:'control'},
    'briefing neu laden':{intent:'reload_briefing',action:'reload'},
    'hilfe':{intent:'help',action:'info'}
  };
  
  function initVoice(){
    if(!SpeechRecognition)return console.warn('Speech Recognition not supported');
    recognizer=new SpeechRecognition();
    recognizer.lang='de-DE';
    recognizer.continuous=false;
    recognizer.interimResults=true;
    
    recognizer.onstart=()=>{ isListening=true; console.log('[VOICE] Listening...'); };
    recognizer.onresult=(e)=>{
      let transcript='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        transcript+=e.results[i][0].transcript;
      }
      const cmd=parseIntent(transcript.toLowerCase());
      if(cmd){handleCommand(cmd);console.log('[VOICE] Command:',cmd.intent);}
    };
    recognizer.onend=()=>{ isListening=false; console.log('[VOICE] Stopped'); };
  }
  
  function parseIntent(text){
    for(const [pattern,cmd] of Object.entries(COMMANDS)){
      if(text.includes(pattern))return cmd;
    }
    return null;
  }
  
  function handleCommand(cmd){
    switch(cmd.action){
      case 'reload':
        window.ORBITIntegrations?.loadGoogleData?.();
        speak('Vault aktualisiert.');
        break;
      case 'control':
        console.log('Volume control:',cmd.intent);
        break;
      case 'info':
        speak('Ich bin FRIDAY. Sag einen Befehl.');
        break;
    }
  }
  
  function startListening(){ if(recognizer&&!isListening)recognizer.start(); }
  function stopListening(){ if(recognizer)recognizer.abort(); }
  
  function speak(text){
    if(!SpeechSynthesis)return;
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='de-DE';
    utterance.rate=1.0;
    SpeechSynthesis.cancel();
    SpeechSynthesis.speak(utterance);
  }
  
  window.ORBITVoiceV2={initVoice,startListening,stopListening,speak};
})();
