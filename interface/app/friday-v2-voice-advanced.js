// FRIDAY v2 Advanced Voice — Context, Intent Confidence, Continuous Recognition
(()=>{
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let recognizer=null,isContinuous=false,lastTranscript='';
  let confidenceThreshold=0.6,commandBuffer=[];
  
  const COMMAND_LIBRARY={
    // Briefing & Status
    'briefing':'get_briefing','status':'get_briefing','wie geht es':'get_briefing',
    'was ist neu':'get_briefing','bericht':'get_briefing',
    
    // Musik
    'musik an':'play_music','musik aus':'stop_music','musik nächstes':'next_track',
    'musik lauter':'volume_up','musik leiser':'volume_down','lautstärke':'volume_set',
    
    // Vault & Notizen
    'vault':'search_vault','notiz':'search_vault','suche':'search_vault',
    'speichern':'save_note','neue notiz':'new_note','notizen':'list_notes',
    
    // Kontrolle
    'help':'help','hilfe':'help','was kannst du':'help','befehle':'help',
    'settings':'settings','einstellungen':'settings','theme':'theme_toggle',
    
    // System
    'neustart':'restart','shutdown':'shutdown','exit':'exit',
    'debug':'debug_mode','fehler':'debug_mode'
  };
  
  const COMMAND_PATTERNS=[
    {pattern:/^(musik|play)\s+(.+)$/i,intent:'play_playlist',param:2},
    {pattern:/^(lautstärke|volumen)\s+(\d+)$/i,intent:'volume_set',param:2},
    {pattern:/^(suche|find)\s+(.+)$/i,intent:'search_vault',param:2},
    {pattern:/^(notiz|note)\s+(.+)$/i,intent:'new_note',param:2},
    {pattern:/^(timer|alarm)\s+(\d+)$/i,intent:'set_timer',param:2}
  ];
  
  function init(){
    if(!SpeechRecognition)return console.warn('Speech Recognition not supported');
    
    recognizer=new SpeechRecognition();
    recognizer.lang='de-DE';
    recognizer.continuous=true;
    recognizer.interimResults=true;
    recognizer.maxAlternatives=3;
    
    recognizer.onstart=()=>{
      console.log('[VOICE] Recognition started');
      isContinuous=true;
    };
    
    recognizer.onresult=(e)=>{
      let finalTranscript='',interimTranscript='';
      
      for(let i=e.resultIndex;i<e.results.length;i++){
        const transcript=e.results[i][0].transcript;
        const confidence=e.results[i][0].confidence;
        
        if(e.results[i].isFinal){
          finalTranscript+=transcript+' ';
        }else{
          interimTranscript+=transcript;
        }
      }
      
      if(finalTranscript){
        lastTranscript=finalTranscript.trim();
        console.log('[VOICE] Final:',lastTranscript);
        processCommand(lastTranscript);
      }
      
      if(interimTranscript){
        console.log('[VOICE] Interim:',interimTranscript);
      }
    };
    
    recognizer.onerror=(e)=>{
      console.error('[VOICE] Error:',e.error);
    };
    
    recognizer.onend=()=>{
      isContinuous=false;
      console.log('[VOICE] Recognition ended');
    };
  }
  
  function processCommand(transcript){
    const lower=transcript.toLowerCase();
    
    // Try pattern matching first
    for(const {pattern,intent,param} of COMMAND_PATTERNS){
      const match=lower.match(pattern);
      if(match){
        executeCommand(intent,match[param]);
        return;
      }
    }
    
    // Try direct command match
    for(const [cmd,intent] of Object.entries(COMMAND_LIBRARY)){
      if(lower.includes(cmd)){
        executeCommand(intent,lower);
        return;
      }
    }
    
    // Fallback: send to AI for natural language processing
    if(window.ORBITFridayAI){
      window.ORBITFridayAI.processInput(transcript);
    }
  }
  
  function executeCommand(intent,param){
    const handlers={
      get_briefing:()=>window.ORBITBriefingV2?.loadBriefing?.(),
      play_music:()=>console.log('Playing music'),
      stop_music:()=>console.log('Stopping music'),
      volume_up:()=>console.log('Volume up'),
      volume_down:()=>console.log('Volume down'),
      search_vault:(p)=>console.log('Searching vault:',p),
      save_note:(p)=>console.log('Saving note:',p),
      help:()=>console.log('Available commands: briefing, musik an/aus, suche, notiz, help'),
      restart:()=>location.reload()
    };
    
    const handler=handlers[intent];
    if(handler)handler(param);
  }
  
  function start(){
    if(recognizer&&!isContinuous)recognizer.start();
  }
  
  function stop(){
    if(recognizer)recognizer.stop();
  }
  
  function abort(){
    if(recognizer)recognizer.abort();
  }
  
  window.ORBITVoiceAdvanced={init,start,stop,abort,processCommand};
})();
