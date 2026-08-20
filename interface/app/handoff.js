(()=>{
  const originalShowApp=window.showApp;
  let handingOff=false;

  function finishHandoff(){
    const splash=document.querySelector('#splash');
    const app=document.querySelector('#app');
    splash?.classList.add('hidden');
    splash?.classList.remove('handoff-out');
    if(app){
      app.classList.add('orbit-ready');
      setTimeout(()=>app.classList.remove('orbit-arriving','orbit-ready'),1250);
    }
  }

  window.showApp=function(){
    if(handingOff)return;
    handingOff=true;

    const splash=document.querySelector('#splash');
    const app=document.querySelector('#app');
    if(!splash||!app||typeof originalShowApp!=='function'){
      originalShowApp?.();
      handingOff=false;
      return;
    }

    app.classList.remove('hidden');
    app.classList.add('orbit-arriving');
    splash.classList.add('handoff-out');

    setTimeout(()=>{
      originalShowApp();
      app.classList.remove('hidden');
      requestAnimationFrame(()=>requestAnimationFrame(finishHandoff));
    },620);

    setTimeout(()=>{handingOff=false},1900);
  };
})();
