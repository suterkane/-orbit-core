(function(root){
  'use strict';

  function normalize(text=''){return String(text).trim().replace(/[.!?]+$/,'').replace(/\s+/g,' ')}
  function parseVoiceIntent(input=''){
    const text=normalize(input),lower=text.toLocaleLowerCase('de-DE');
    if(/^(stopp|stop|ruhe|abbrechen)(\s+friday)?$/.test(lower))return{type:'stop'};
    if(/(systemstatus|system status|wie ist der status|statusbericht)/.test(lower))return{type:'status'};
    if(/(zentrale|dashboard|hauptansicht)/.test(lower)&&/(öffne|zeig|zurück)/.test(lower))return{type:'view',target:'dashboard'};
    if(/(aufgaben|eingang|einträge)/.test(lower)&&/(öffne|zeig|meine|zum)/.test(lower))return{type:'view',target:'inbox'};
    let match=text.match(/^(?:neue\s+)?aufgabe\s+(.+)$/i);
    if(match)return{type:'capture',category:'task',text:match[1].trim()};
    match=text.match(/^(?:merke\s+dir\s+)?idee\s+(.+)$/i);
    if(match)return{type:'capture',category:'idea',text:match[1].trim()};
    match=text.match(/^(?:merke\s+dir|notiere)\s+(.+)$/i);
    if(match)return{type:'capture',category:'thought',text:match[1].trim()};
    if(/^(mach\s+(sie|ihn|das)\s+wichtig|setze\s+(die\s+)?priorität|priorisiere\s+(sie|ihn|das))$/i.test(text))return{type:'context',action:'mark-important'};
    return{type:'unknown',text};
  }

  function runContextAction(intent,context,app){
    if(intent.action!=='mark-important')return{ok:false,reply:'Dafür fehlt mir noch die Dialogverbindung.',replyKey:'unknown'};
    if(!context.lastEntryId)return{ok:false,reply:'Mir fehlt der vorherige Bezug.',replyKey:'missingContext'};
    const changed=app?.markImportant?.(context.lastEntryId);
    return changed
      ?{ok:true,reply:'Priorität gesetzt.',replyKey:'important'}
      :{ok:false,reply:'Der vorherige Eintrag ist nicht mehr verfügbar.',replyKey:'missingContext'};
  }

  if(typeof module!=='undefined'&&module.exports)module.exports={parseVoiceIntent,runContextAction};
  if(typeof document==='undefined')return;

  const Recognition=root.SpeechRecognition||root.webkitSpeechRecognition;
  const button=document.querySelector('#voiceCoreBtn');
  const panel=document.querySelector('#voiceDialogue');
  const transcript=document.querySelector('#voiceTranscript');
  const response=document.querySelector('#voiceResponse');
  const state=document.querySelector('#voiceState');
  let recognition=null,listening=false,replyAudio=null;
  const context={lastEntryId:''};
  const replyFiles={dashboard:'voice-zentrale.ogg',inbox:'voice-aufgaben.ogg',captured:'voice-erfasst.ogg',important:'voice-prioritaet.ogg',missingContext:'voice-bezug-fehlt.ogg',status:'voice-status.ogg',unknown:'voice-unklar.ogg'};

  function setState(next,label){const sharedState=next==='replying'?'speaking':next;if(state)state.textContent=label;if(button){button.dataset.state=next;button.setAttribute('aria-pressed',next==='listening'?'true':'false')}panel?.classList.toggle('active',next!=='idle');root.ORBITCompanion?.updateShared({voice:{state:sharedState}})}
  function stopReply(){try{replyAudio?.pause()}catch{}replyAudio=null;root.ORBITFriday?.stopSpeaking?.()}
  function playReply(key){const file=replyFiles[key];if(!file)return;stopReply();replyAudio=new Audio(`assets/${file}`);replyAudio.volume=.92;replyAudio.play().catch(()=>{})}
  function reply(text,key){if(response)response.textContent=text;root.ORBITCompanion?.updateShared({conversation:{turnId:root.crypto?.randomUUID?.()||`turn-${Date.now()}`,userText:transcript?.textContent||'',replyText:text}});setState('replying','FRIDAY antwortet');playReply(key);setTimeout(()=>{if(!listening)setState('idle','Bereit')},2200)}
  function systemSummary(){const overdue=Number(document.querySelector('#overdueCount')?.textContent)||0,today=Number(document.querySelector('#todayCount')?.textContent)||0;return overdue?`${overdue} überfällige Aufgabe${overdue===1?'':'n'}. Priorität empfohlen.`:today?`${today} Aufgabe${today===1?' ist':'n sind'} heute aktiv.`:'Alle Systeme sind stabil. Keine akute Terminlage.'}
  function execute(intent){
    if(intent.type==='stop'){stopReply();setState('idle','Unterbrochen');if(response)response.textContent='Ausgabe gestoppt.';return}
    if(intent.type==='view'){root.ORBITApp?.setView?.(intent.target);reply(intent.target==='dashboard'?'Zentrale geöffnet.':'Aufgaben geöffnet.',intent.target);return}
    if(intent.type==='capture'){const captured=root.ORBITApp?.capture?.(intent.text,intent.category);context.lastEntryId=captured?.id||'';reply('Erfasst.','captured');return}
    if(intent.type==='context'){const result=runContextAction(intent,context,root.ORBITApp);reply(result.reply,result.replyKey);return}
    if(intent.type==='status'){reply(systemSummary(),'status');return}
    reply('Dafür fehlt mir noch die Dialogverbindung. Ich habe die Anfrage angezeigt.','unknown')
  }
  function startListening(){
    stopReply();
    if(!Recognition){reply('Spracherkennung wird von diesem Browser nicht unterstützt.','unknown');return}
    if(listening){recognition?.stop();return}
    recognition=new Recognition();recognition.lang='de-DE';recognition.interimResults=true;recognition.continuous=false;recognition.maxAlternatives=1;
    recognition.onstart=()=>{listening=true;setState('listening','Ich höre zu …');if(transcript)transcript.textContent='Sprich jetzt.'};
    recognition.onresult=event=>{let finalText='',interim='';for(let i=event.resultIndex;i<event.results.length;i++){const value=event.results[i][0].transcript;if(event.results[i].isFinal)finalText+=value;else interim+=value}if(transcript)transcript.textContent=finalText||interim||'Sprich jetzt.';if(finalText)execute(parseVoiceIntent(finalText))};
    recognition.onerror=event=>{listening=false;const denied=event.error==='not-allowed'||event.error==='service-not-allowed';reply(denied?'Mikrofonfreigabe erforderlich.':'Ich habe Sie nicht verstanden.','unknown')};
    recognition.onend=()=>{listening=false;if(button?.dataset.state==='listening')setState('idle','Bereit')};
    setState('listening','Mikrofon wird aktiviert …');if(transcript)transcript.textContent='Warte auf Mikrofonfreigabe.';
    try{recognition.start()}catch{listening=false;setState('idle','Bereit')}
  }

  button?.addEventListener('click',startListening);
  root.ORBITVoiceCore={parseVoiceIntent,startListening,execute,stop:()=>{recognition?.stop();stopReply();setState('idle','Bereit')}};
  setState('idle',Recognition?'Bereit':'Browser ohne Spracheingabe');
})(typeof window!=='undefined'?window:globalThis);
