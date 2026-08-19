(()=>{
  function qs(s){return document.querySelector(s)}

  function openTaskDialog(){
    try{
      if(typeof window.openDialog==='function')window.openDialog();
      else qs('#newEntryBtn')?.click();
      const cat=qs('#editCategory');
      if(cat)cat.value='task';
      const due=qs('#editDue');
      if(due&&!due.value){
        const d=new Date();
        due.value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
      }
      const text=qs('#editText');
      text?.focus();
      const status=qs('#taskQuickStatus');
      if(status)status.textContent='Aufgabenmodus geöffnet.';
    }catch{}
  }

  function openGoogle(url,type){
    const status=qs(type==='mail'?'#mailStatus':'#calendarStatus');
    if(status)status.textContent='Live-Verbindung folgt nach Google-Freigabe';
    window.open(url,'_blank','noopener,noreferrer');
  }

  document.addEventListener('DOMContentLoaded',()=>{
    qs('#taskQuickBtn')?.addEventListener('click',openTaskDialog);
    qs('#mailConnectBtn')?.addEventListener('click',()=>openGoogle('https://mail.google.com/mail/u/0/#inbox','mail'));
    qs('#calendarConnectBtn')?.addEventListener('click',()=>openGoogle('https://calendar.google.com/calendar/u/0/r','calendar'));
  });

  window.ORBITIntegrations={openTaskDialog};
})();