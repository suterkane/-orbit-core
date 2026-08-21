(()=>{
  const input=document.querySelector('#quickInput');
  const button=document.querySelector('#captureBtn');
  if(!input||!button)return;

  const pad=n=>String(n).padStart(2,'0');
  const toIso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const shiftDays=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return toIso(d)};

  function parseCommand(raw){
    let text=raw.trim();
    let category='thought';
    let due='';
    let important=false;

    if(/^(aufgabe|task)\b[:\-]?\s*/i.test(text)){
      category='task';
      text=text.replace(/^(aufgabe|task)\b[:\-]?\s*/i,'').trim();
    }else if(/^(idee|idea)\b[:\-]?\s*/i.test(text)){
      category='idea';
      text=text.replace(/^(idee|idea)\b[:\-]?\s*/i,'').trim();
    }else if(/^(gedanke|notiz|note)\b[:\-]?\s*/i.test(text)){
      category='thought';
      text=text.replace(/^(gedanke|notiz|note)\b[:\-]?\s*/i,'').trim();
    }else if(/^(erinnere mich|erinnerung)\b/i.test(text)){
      category='task';
      text=text.replace(/^(erinnere mich(?: daran)?(?:,)?|erinnerung)\b[:\-]?\s*/i,'').trim();
    }

    if(/\bheute\b/i.test(text)){
      category='task';
      due=shiftDays(0);
      text=text.replace(/\bheute\b/ig,'').replace(/\s{2,}/g,' ').trim();
    }else if(/\bmorgen\b/i.test(text)){
      category='task';
      due=shiftDays(1);
      text=text.replace(/\bmorgen\b/ig,'').replace(/\s{2,}/g,' ').trim();
    }else if(/\bübermorgen\b/i.test(text)){
      category='task';
      due=shiftDays(2);
      text=text.replace(/\bübermorgen\b/ig,'').replace(/\s{2,}/g,' ').trim();
    }

    if(/(^|\s)(wichtig|priorität|prio)(\s|$)/i.test(text)){
      important=true;
      text=text.replace(/(^|\s)(wichtig|priorität|prio)(?=\s|$)/ig,' ').replace(/\s{2,}/g,' ').trim();
    }

    return{text:text||raw.trim(),category,due,important};
  }

  function captureCommand(){
    const raw=input.value.trim();
    if(!raw)return;
    const parsed=parseCommand(raw);
    entries.unshift({
      id:crypto.randomUUID(),
      text:parsed.text,
      category:parsed.category,
      due:parsed.due,
      important:parsed.important,
      completed:false,
      createdAt:new Date().toISOString()
    });
    input.value='';
    save();

    const hero=document.querySelector('#heroText');
    if(hero){
      const kind=parsed.category==='task'?'Aufgabe':parsed.category==='idea'?'Idee':'Gedanke';
      const when=parsed.due?` · ${parsed.due===shiftDays(0)?'heute':parsed.due===shiftDays(1)?'morgen':'terminiert'}`:'';
      hero.textContent=`${kind} erfasst${when}.`;
    }
  }

  button.onclick=captureCommand;
  input.addEventListener('keydown',event=>{
    if(event.key!=='Enter')return;
    event.preventDefault();
    event.stopImmediatePropagation();
    captureCommand();
  },true);

  window.ORBITCommandInput={parse:parseCommand,capture:captureCommand};
})();
