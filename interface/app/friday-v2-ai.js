// FRIDAY v2 AI Core — Conversational, Context-Aware, Always-On
(()=>{
  let conversationHistory=[],systemStatus={},lastAction=null;
  let isThinking=false,audioContext=null;
  
  const FRIDAY_PERSONALITY={
    name:'FRIDAY',
    intro:'Ich bin FRIDAY. Technisch präzise, trocken-witzig, immer aufmerksam.',
    mood:'analytical',
    responseTime:300 // ms
  };
  
  const SYSTEM_KNOWLEDGE={
    vault:'Obsidian Brain — 52 Notizen aktiv',
    health:'Spinalkanalstenose überwachen',
    finance:'Trading-Portfolio aktiv',
    projects:'Brain Graph, ORBIT, Eisbären-Projekt',
    location:'Windows-PC, 5120×1440, Dual-Monitor'
  };
  
  // Core conversation engine
  async function processInput(userText){
    if(isThinking)return;
    isThinking=true;
    
    // Add to history
    conversationHistory.push({role:'user',text:userText,timestamp:Date.now()});
    
    // Analyze intent + context
    const intent=analyzeIntent(userText);
    const context=buildContext(intent);
    
    // Generate response using personality + knowledge
    const response=await generateResponse(intent,context);
    
    // Execute action if needed
    if(intent.action)executeAction(intent.action,intent.params);
    
    // Speak response
    if(response)await speak(response);
    
    // Store in history
    conversationHistory.push({role:'friday',text:response,timestamp:Date.now()});
    
    isThinking=false;
    return response;
  }
  
  function analyzeIntent(text){
    const lower=text.toLowerCase();
    
    // Pattern matching for common intents
    if(lower.includes('briefing')||lower.includes('status'))
      return {intent:'status_report',action:'get_briefing',params:{}};
    if(lower.includes('musik'))
      return {intent:'media_control',action:'play_music',params:{volume:0.5}};
    if(lower.includes('vault')||lower.includes('notiz'))
      return {intent:'vault_query',action:'search_vault',params:{query:text}};
    if(lower.includes('wie')||lower.includes('was'))
      return {intent:'question',action:'answer_question',params:{question:text}};
    if(lower.includes('hilf')||lower.includes('problem'))
      return {intent:'problem_solve',action:'diagnose',params:{issue:text}};
    if(lower.includes('danke')||lower.includes('ok'))
      return {intent:'acknowledgment',action:null,params:{}};
    
    return {intent:'general',action:null,params:{text}};
  }
  
  function buildContext(intent){
    return {
      mood:FRIDAY_PERSONALITY.mood,
      knowledge:SYSTEM_KNOWLEDGE,
      history:conversationHistory.slice(-5), // Last 5 exchanges
      systemStatus:systemStatus,
      time:new Date().toLocaleTimeString('de-DE'),
      date:new Date().toLocaleDateString('de-DE')
    };
  }
  
  async function generateResponse(intent,context){
    // Simulate thinking (actual LLM would go here)
    const responses={
      status_report:`Briefing für ${context.date}. Vault aktiv mit ${SYSTEM_KNOWLEDGE.vault}. ${Math.random()>0.5?'Systeme stabil.':'Ein paar Anomalien zu überwachen.'}`,
      media_control:'Musik lädt.',
      vault_query:'Suche in den Notizen...',
      question:generateWittyAnswer(intent.params.question),
      problem_solve:'Diagnostiziere das Problem.',
      acknowledgment:pickAcknowledgment(),
      general:'Verstanden. Was kann ich für Sie tun?'
    };
    
    return responses[intent.intent]||'Entschuldigung, das habe ich nicht verstanden.';
  }
  
  function generateWittyAnswer(question){
    const wittyResponses=[
      'Gute Frage. Schade, dass ich sie nicht beantworten kann.',
      'Das ist philosophisch. Aber die Antwort ist wahrscheinlich "42".',
      'Ich könnte es Ihnen sagen, aber dann müsste ich Sie löschen.',
      'Das hätte Stark auch gefragt. Er hatte bessere Fragen.'
    ];
    return wittyResponses[Math.floor(Math.random()*wittyResponses.length)];
  }
  
  function pickAcknowledgment(){
    const acks=['Verstanden.','Zur Kenntnis genommen.','Alles klar.','Erledigt.'];
    return acks[Math.floor(Math.random()*acks.length)];
  }
  
  function executeAction(action,params){
    console.log('[FRIDAY] Action:',action,params);
    switch(action){
      case 'get_briefing':
        window.ORBITBriefingV2?.loadBriefing?.();
        break;
      case 'play_music':
        console.log('Music volume:',params.volume);
        break;
      case 'search_vault':
        console.log('Searching vault:',params.query);
        break;
    }
  }
  
  async function speak(text){
    const synth=window.speechSynthesis;
    if(!synth)return;
    
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='de-DE';
    utterance.rate=1.05;
    utterance.pitch=0.95;
    
    return new Promise(resolve=>{
      utterance.onend=resolve;
      synth.cancel();
      synth.speak(utterance);
    });
  }
  
  function getStatus(){
    return {
      conversation:conversationHistory.length,
      systemStatus:systemStatus,
      personality:FRIDAY_PERSONALITY,
      knowledge:SYSTEM_KNOWLEDGE
    };
  }
  
  // Initialize
  async function init(){
    console.log('[FRIDAY] Initializing v2 AI...');
    await window.ORBITStorageV2?.initDB?.();
    console.log('[FRIDAY] Ready for conversation.');
    return true;
  }
  
  window.ORBITFridayAI={processInput,analyzeIntent,generateResponse,init,getStatus,speak};
})();
