// FRIDAY v2 Neural Core — 3D Visualization + Music Reactivity
(()=>{
  const SAMPLE_RATE=44100;
  const FFT_SIZE=256;
  let analyser=null,dataArray=null,canvas=null,ctx=null;
  let particles=[],hologramMesh=null;
  
  function init(){
    canvas=document.querySelector('#neural-canvas');
    if(!canvas)return;
    ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx)return;
    
    // Set canvas size
    const rect=canvas.getBoundingClientRect();
    canvas.width=rect.width*window.devicePixelRatio;
    canvas.height=rect.height*window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio,window.devicePixelRatio);
    
    // Initialize audio analyzer
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(AudioCtx){
      try{
        const audioCtx=new AudioCtx();
        analyser=audioCtx.createAnalyser();
        analyser.fftSize=FFT_SIZE;
        dataArray=new Uint8Array(analyser.frequencyBinCount);
      }catch{}
    }
    
    // Initialize particles
    particles=Array.from({length:50},()=>({
      x:Math.random()*rect.width,
      y:Math.random()*rect.height,
      vx:(Math.random()-0.5)*2,
      vy:(Math.random()-0.5)*2,
      life:1
    }));
  }
  
  function draw(){
    if(!ctx||!canvas)return;
    const w=canvas.width,h=canvas.height;
    
    // Clear with fade
    ctx.fillStyle='rgba(3,17,23,0.1)';
    ctx.fillRect(0,0,w,h);
    
    // Draw hologram circle
    const cx=w/2,cy=h/2,r=Math.min(w,h)*0.3;
    ctx.strokeStyle='rgba(0,229,255,0.3)';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.stroke();
    
    // Draw particles
    particles.forEach(p=>{
      p.x+=p.vx;
      p.y+=p.vy;
      p.life*=0.98;
      
      if(p.x<0||p.x>w)p.vx*=-1;
      if(p.y<0||p.y>h)p.vy*=-1;
      
      ctx.fillStyle=`rgba(0,229,255,${p.life*0.5})`;
      ctx.fillRect(p.x-1,p.y-1,2,2);
    });
    
    requestAnimationFrame(draw);
  }
  
  window.ORBITNeuralV2={init,draw};
})();
