// FRIDAY v2 Audio Engine — Web Audio API, Real-time FFT, Frequency Bands
(()=>{
  let audioCtx=null,analyser=null,dataArray=null;
  let bassAnalyser=null,midAnalyser=null,trebleAnalyser=null;
  let bassData=null,midData=null,trebleData=null;
  let audioSource=null;
  
  const FREQUENCY_BANDS={
    bass:{min:20,max:250},
    mid:{min:250,max:2000},
    treble:{min:2000,max:20000}
  };
  
  function init(audioElement){
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return console.warn('Web Audio API not supported');
    
    audioCtx=new AudioContext();
    
    // Main analyser
    analyser=audioCtx.createAnalyser();
    analyser.fftSize=256;
    analyser.smoothingTimeConstant=0.85;
    dataArray=new Uint8Array(analyser.frequencyBinCount);
    
    // Connect audio source
    if(audioElement){
      audioSource=audioCtx.createMediaElementAudioSource(audioElement);
      audioSource.connect(analyser);
    }
    
    analyser.connect(audioCtx.destination);
    
    // Separate analysers for frequency bands
    bassAnalyser=audioCtx.createAnalyser();
    midAnalyser=audioCtx.createAnalyser();
    trebleAnalyser=audioCtx.createAnalyser();
    
    bassData=new Uint8Array(bassAnalyser.frequencyBinCount);
    midData=new Uint8Array(midAnalyser.frequencyBinCount);
    trebleData=new Uint8Array(trebleAnalyser.frequencyBinCount);
    
    console.log('[AUDIO] Web Audio Engine initialized');
  }
  
  function getFrequencyData(){
    if(!analyser)return null;
    
    analyser.getByteFrequencyData(dataArray);
    const avg=dataArray.reduce((a,b)=>a+b)/dataArray.length;
    
    // Calculate frequency band averages
    const bandSize=Math.floor(dataArray.length/3);
    const bassAvg=dataArray.slice(0,bandSize).reduce((a,b)=>a+b)/bandSize;
    const midAvg=dataArray.slice(bandSize,bandSize*2).reduce((a,b)=>a+b)/bandSize;
    const trebleAvg=dataArray.slice(bandSize*2).reduce((a,b)=>a+b)/bandSize;
    
    return{
      overall:avg,
      bass:bassAvg,
      mid:midAvg,
      treble:trebleAvg,
      spectrum:Array.from(dataArray),
      normalized:{
        overall:avg/255,
        bass:bassAvg/255,
        mid:midAvg/255,
        treble:trebleAvg/255
      }
    };
  }
  
  function startVisualization(callback){
    function visualize(){
      requestAnimationFrame(visualize);
      const data=getFrequencyData();
      if(data&&callback)callback(data);
    }
    visualize();
  }
  
  function resume(){
    if(audioCtx)audioCtx.resume();
  }
  
  function suspend(){
    if(audioCtx)audioCtx.suspend();
  }
  
  function createGainNode(){
    return audioCtx.createGain();
  }
  
  function createBiquadFilter(){
    return audioCtx.createBiquadFilter();
  }
  
  window.ORBITAudioEngine={
    init,
    getFrequencyData,
    startVisualization,
    resume,
    suspend,
    createGainNode,
    createBiquadFilter,
    get context(){return audioCtx;},
    get analyser(){return analyser;}
  };
})();
