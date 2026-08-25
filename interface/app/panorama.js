(()=>{
  'use strict';
  const params=new URLSearchParams(location.search);
  if(params.get('panorama')!=='dual')return;
  document.documentElement.classList.add('orbit-panorama');
  document.documentElement.dataset.panorama='dual-5120x1440';
  function setText(id,value){const el=document.getElementById(id);if(el&&value)el.textContent=String(value)}
  function applyBriefing(data={}){setText('panoramaDate',data.date);setText('panoramaCalendar',data.calendarText);setText('panoramaMail',data.mailText);setText('panoramaTasks',data.taskText);setText('panoramaPriority',data.priority)}
  applyBriefing({date:new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())});
  window.ORBITPanorama={
    active:true,
    geometry:{width:5120,height:1440,monitorWidth:2560,monitors:2},
    applyBriefing,
    telemetry:()=>({active:true,width:innerWidth,height:innerHeight,aspect:innerWidth/Math.max(1,innerHeight),screenX:window.screenX,screenY:window.screenY})
  };
})();
