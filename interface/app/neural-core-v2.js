(function(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.ORBITNeuralCoreV2=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';

  const FORMS=Object.freeze(['sphere','wordmark','network','microphone','guardian','info','clock','modules']);
  const ICON_FORMS=new Set(['wordmark','microphone','guardian','info','clock']);
  const STATES=Object.freeze(['dormant','assembling','idle','listening','thinking','speaking','confirm','error','docking','suspended']);
  const PARTICLE_BUDGET=Object.freeze({reduced:1500,low:1500,balanced:3200,high:7500,ultra:12000});
  const ASSEMBLY_DURATION=2600;
  const TIER=Object.freeze({
    reduced:{dpr:1,fps:20,connections:0,maxPoint:4},low:{dpr:1,fps:30,connections:0,maxPoint:4},
    balanced:{dpr:1.35,fps:60,connections:96,maxPoint:5},high:{dpr:1.75,fps:60,connections:256,maxPoint:6},
    ultra:{dpr:2,fps:60,connections:512,maxPoint:7}
  });
  const STATE_TARGETS=Object.freeze({
    dormant:{form:'sphere',cohesion:.38,turbulence:.08,brightness:.46,connections:0},
    assembling:{form:'sphere',cohesion:.72,turbulence:.34,brightness:.9,connections:.12},
    idle:{form:'sphere',cohesion:.84,turbulence:.12,brightness:.78,connections:.1},
    listening:{form:'microphone',cohesion:.94,turbulence:.07,brightness:1.05,connections:.08},
    thinking:{form:'network',cohesion:.7,turbulence:.28,brightness:.92,connections:.28},
    speaking:{form:'sphere',cohesion:.82,turbulence:.2,brightness:1.18,connections:.2},
    confirm:{form:'info',cohesion:.95,turbulence:.04,brightness:1.25,connections:.06},
    error:{form:'guardian',cohesion:.55,turbulence:.38,brightness:1.0,connections:.1},
    docking:{form:'sphere',cohesion:1,turbulence:.02,brightness:.86,connections:.06},
    suspended:{form:'sphere',cohesion:1,turbulence:0,brightness:.45,connections:0}
  });

  function resolveQuality({reducedMotion=false,width=1024,dpr=1,hardwareConcurrency=4,deviceMemory=4}={}){
    if(reducedMotion)return'reduced';
    if(width<760||dpr>2.25)return hardwareConcurrency<=2?'low':'balanced';
    if(hardwareConcurrency<=2||deviceMemory&&deviceMemory<=2)return'low';
    if(width>1700&&hardwareConcurrency>=8&&dpr<=2)return'ultra';
    return'high';
  }
  const QUALITY_ORDER=Object.freeze(['reduced','low','balanced','high','ultra']);
  class RuntimeQualityGovernor{
    constructor(initialQuality,onDegrade=()=>{},options={}){this.quality=TIER[initialQuality]?initialQuality:'balanced';this.onDegrade=onDegrade;this.slowFrameMs=options.slowFrameMs||22;this.slowFrames=options.slowFrames||45;this.recoveryFrames=options.recoveryFrames||90;this.slowCount=0;this.recoveryCount=0;this.armed=true}
    sample(frameMs){if(!Number.isFinite(frameMs)||frameMs<=0)return this.quality;if(frameMs>this.slowFrameMs){this.recoveryCount=0;if(this.armed&&++this.slowCount>=this.slowFrames)this.degrade()}else{this.slowCount=0;if(!this.armed&&++this.recoveryCount>=this.recoveryFrames){this.armed=true;this.recoveryCount=0}}return this.quality}
    degrade(){const index=QUALITY_ORDER.indexOf(this.quality);if(index<=0)return;this.quality=QUALITY_ORDER[index-1];this.slowCount=0;this.armed=false;this.onDegrade(this.quality)}
  }
  function fract(n){return n-Math.floor(n)}
  function rand(i,salt=0){return fract(Math.sin(i*127.1+salt*311.7)*43758.5453123)}
  function put(a,i,x,y,z){a[i*3]=x;a[i*3+1]=y;a[i*3+2]=z}
  function spherePoint(i,n,r=1){const y=1-2*(i+.5)/n,rr=Math.sqrt(Math.max(0,1-y*y)),a=i*2.3999632297;return[Math.cos(a)*rr*r,y*r,Math.sin(a)*rr*r]}
  function linePoint(i,n,x1,y1,x2,y2,z=.02){const t=n<2?0:i/(n-1);return[x1+(x2-x1)*t,y1+(y2-y1)*t,z]}
  const GLYPHS={
    O:['111','101','101','101','111'],R:['110','101','110','101','101'],B:['110','101','110','101','110'],I:['111','010','010','010','111'],T:['111','010','010','010','010']
  };
  const WORDMARK_LIT=[];
  {let cursor=0;for(const ch of 'ORBIT'){const glyph=GLYPHS[ch];for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(glyph[row][col]==='1')WORDMARK_LIT.push([cursor+col,row]);cursor+=4}}
  const GUARDIAN_LINES=[[-.62,.38,-.42,.82],[-.42,.82,.42,.82],[.42,.82,.62,.38],[.62,.38,.54,-.42],[.54,-.42,.24,-.78],[.24,-.78,0,-.9],[0,-.9,-.24,-.78],[-.24,-.78,-.54,-.42],[-.54,-.42,-.62,.38],[-.48,.18,-.12,.02],[.48,.18,.12,.02],[-.34,-.32,0,-.52],[0,-.52,.34,-.32],[-.2,.52,.2,.52]];
  function sampleWordmark(i){const [col,row]=WORDMARK_LIT[i%WORDMARK_LIT.length],jx=(rand(i,2)-.5)*.072,jy=(rand(i,3)-.5)*.132;return[(col-9.5)*.06+jx,(2-row)*.108+jy,(rand(i,4)-.5)*.018]}
  function sampleForm(form,i,n){
    const jitter=(rand(i,11)-.5)*.025;
    if(form==='sphere'){const shell=rand(i,41),r=shell<.18?.08+Math.sqrt(shell/.18)*.24:shell<.5?.34+((shell-.18)/.32)*.46:.88+jitter;const spatial=Math.floor(rand(i,42)*n);return spherePoint(spatial,n,r)}
    if(form==='wordmark')return sampleWordmark(i,n);
    if(form==='network'){const cluster=i%9,local=Math.floor(i/9),a=cluster*2.3999,r=.25+(cluster%3)*.34,cx=Math.cos(a)*r,cy=Math.sin(a)*r*.72,cz=((cluster%4)-1.5)*.12;if(local%5===0){const next=(cluster+1)%9,b=next*2.3999,nr=.25+(next%3)*.34;return linePoint(local%37,37,cx,cy,Math.cos(b)*nr,Math.sin(b)*nr*.72,cz)}return[cx+(rand(i,4)-.5)*.24,cy+(rand(i,5)-.5)*.24,cz+(rand(i,6)-.5)*.18]}
    if(form==='microphone'){const q=i/n,z=(rand(i,7)-.5)*.04;if(q<.45){const a=i/(n*.45)*Math.PI*2;return[Math.cos(a)*.28,.32+Math.sin(a)*.46,z]}if(q<.74){const a=Math.PI+(i-n*.45)/(n*.29)*Math.PI;return[Math.cos(a)*.5,.12+Math.sin(a)*.68,z]}if(q<.88)return linePoint(i%160,160,0,-.56,0,-.9,z);return linePoint(i%160,160,-.43,-.9,.43,-.9,z)}
    if(form==='guardian'){const s=GUARDIAN_LINES[i%GUARDIAN_LINES.length],local=Math.floor(i/GUARDIAN_LINES.length)%120,p=linePoint(local,120,s[0],s[1],s[2],s[3],(rand(i,7)-.5)*.055);return p}
    if(form==='info'){const q=i/n;if(q<.55){const a=i/(n*.55)*Math.PI*2;return[Math.cos(a)*.94,Math.sin(a)*.94,(rand(i,8)-.5)*.035]}if(q<.72){const a=(i-n*.55)/(n*.17)*Math.PI*2;return[Math.cos(a)*.1,.34+Math.sin(a)*.1,(rand(i,9)-.5)*.035]}return[(rand(i,10)-.5)*.055,.12-(i-n*.72)/(n*.28)*.7,(rand(i,11)-.5)*.035]}
    if(form==='clock'){if(i<n*.72){const a=i/(n*.72)*Math.PI*2;return[Math.cos(a),Math.sin(a),0]}if(i<n*.86)return linePoint(i%200,200,0,0,0,.58,.02);return linePoint(i%200,200,0,0,.55,-.35,.02)}
    if(form==='modules'){const module=i%7;if(module===0)return spherePoint(Math.floor(i/7),Math.ceil(n/7),.48);const a=(module-1)/6*Math.PI*2,cx=Math.cos(a)*1.18,cy=Math.sin(a)*1.18*.7,p=spherePoint(Math.floor(i/7),Math.ceil(n/7),.18);return[cx+p[0],cy+p[1],p[2]]}
    return spherePoint(i,n);
  }
  function createMorphAtlas(count){const n=Math.max(1,Math.floor(count)),atlas={};for(const form of FORMS){const a=new Float32Array(n*3);for(let i=0;i<n;i++){const p=sampleForm(form,i,n);put(a,i,p[0],p[1],p[2])}atlas[form]=a}return atlas}

  class CoreStateMachine{
    constructor(){this.state='dormant';this.targets=STATE_TARGETS.dormant}
    setState(next){if(!STATES.includes(next))return false;this.state=next;this.targets=STATE_TARGETS[next];return true}
  }

  class NeuralCoreSound{
    constructor(host=root){this.root=host;this.ctx=null;this.master=null;this.voiceActive=false;this.lastCue='';this.tonesStarted=0}
    unlock(){const AudioCtx=this.root.AudioContext||this.root.webkitAudioContext;if(!AudioCtx)return false;try{if(!this.ctx){this.ctx=new AudioCtx();this.master=this.ctx.createGain();this.master.gain.value=.18;this.master.connect(this.ctx.destination)}this.ctx.resume?.();return true}catch{return false}}
    setVoiceActive(active){this.voiceActive=!!active;if(!this.ctx||!this.master)return;const t=this.ctx.currentTime,g=this.master.gain;g.cancelScheduledValues(t);g.setValueAtTime(Math.max(.0001,g.value),t);g.linearRampToValueAtTime(active?.0001:.18,t+.035)}
    tone(frequency,endFrequency,offset,duration,gain,type='sine'){const t=this.ctx.currentTime+offset,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(endFrequency,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);this.tonesStarted++;o.stop(t+duration+.025)}
    cue(state){if(!this.ctx||this.voiceActive||state===this.lastCue)return false;const cues={listening:[392,523,.16,.018,'sine'],thinking:[277,330,.2,.014,'triangle'],confirm:[523,784,.18,.02,'sine'],error:[196,147,.22,.018,'sawtooth']},c=cues[state];if(state==='assembling'){this.tone(92,246,0,.42,.055);this.tone(184,622,.08,.34,.026,'triangle')}else if(c)this.tone(c[0],c[1],0,c[2],c[3],c[4]);else return false;this.lastCue=state;return true}
    telemetry(){return{state:this.ctx?.state||'locked',voiceActive:this.voiceActive,lastCue:this.lastCue,tonesStarted:this.tonesStarted,masterGain:this.master?.gain?.value??0}}
    dispose(){try{this.ctx?.close?.()}catch{}this.ctx=null;this.master=null}
  }

  function init(options={}){
    if(!root.document)return null;
    const canvas=options.canvas||root.document.querySelector('#fridayHologram');
    const container=options.container||root.document.querySelector('#splash');
    if(!canvas||!container)return null;
    const reducedMotion=root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let quality=options.preferredQuality&&options.preferredQuality!=='auto'?options.preferredQuality:resolveQuality({reducedMotion,width:root.innerWidth,dpr:root.devicePixelRatio||1,hardwareConcurrency:root.navigator?.hardwareConcurrency||4,deviceMemory:root.navigator?.deviceMemory||4});
    if(!TIER[quality])quality='balanced';
    const machine=new CoreStateMachine(),sound=new NeuralCoreSound(root),count=PARTICLE_BUDGET[quality],atlas=createMorphAtlas(count);
    if(!root.THREE){const fallback=root.document.createElement('div');fallback.className='neural-core-fallback';fallback.setAttribute('aria-hidden','true');container.appendChild(fallback);const api=createFallbackApi(machine,fallback,sound);root.ORBITNeuralCore=api;return api}
    const THREE=root.THREE;
    let renderer;
    try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:false})}catch(error){const fallback=root.document.createElement('div');fallback.className='neural-core-fallback';container.appendChild(fallback);const api=createFallbackApi(machine,fallback,sound);root.ORBITNeuralCore=api;return api}
    renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,TIER[quality].dpr));renderer.setClearColor(0x000000,0);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,50);camera.position.z=4.35;
    const geometry=new THREE.BufferGeometry(),source=new Float32Array(count*3),target=new Float32Array(atlas.sphere),seed=new Float32Array(count),layer=new Float32Array(count),energyBias=new Float32Array(count),colorBias=new Float32Array(count),sizeBias=new Float32Array(count);
    for(let i=0;i<count;i++){const p=spherePoint(i,count,1.15+rand(i,20)*.85),spin=rand(i,21)*Math.PI*2;put(source,i,p[0]+Math.cos(spin)*.38,p[1]*1.08,p[2]+Math.sin(spin)*.38);seed[i]=rand(i,22);layer[i]=i%11===0?2:i%3===0?1:0;energyBias[i]=.55+rand(i,23)*.8;colorBias[i]=rand(i,24);sizeBias[i]=.82+rand(i,25)*1.05}
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(source),3));geometry.setAttribute('positionA',new THREE.BufferAttribute(source,3));geometry.setAttribute('positionB',new THREE.BufferAttribute(target,3));geometry.setAttribute('seed',new THREE.BufferAttribute(seed,1));geometry.setAttribute('layer',new THREE.BufferAttribute(layer,1));geometry.setAttribute('energyBias',new THREE.BufferAttribute(energyBias,1));geometry.setAttribute('colorBias',new THREE.BufferAttribute(colorBias,1));geometry.setAttribute('sizeBias',new THREE.BufferAttribute(sizeBias,1));
    const uniforms={uTime:{value:0},uMorph:{value:0},uRms:{value:0},uLow:{value:0},uMid:{value:0},uHigh:{value:0},uTransient:{value:0},uTurbulence:{value:.1},uBrightness:{value:.8},uPointScale:{value:55},uMaxPointSize:{value:TIER[quality].maxPoint},uReduced:{value:reducedMotion?1:0},uError:{value:0}};
    const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`
      attribute vec3 positionA; attribute vec3 positionB; attribute float seed; attribute float layer; attribute float energyBias; attribute float colorBias; attribute float sizeBias;
      uniform float uTime,uMorph,uRms,uLow,uMid,uHigh,uTransient,uTurbulence,uPointScale,uMaxPointSize,uReduced; varying float vOpacity; varying float vColor;
      void main(){float delayed=smoothstep(seed*.18,.82+seed*.18,uMorph);vec3 p=mix(positionA,positionB,delayed);vec3 normal=normalize(p+vec3(.0001));float n1=sin(dot(normal,vec3(5.7,7.3,4.9))+uTime*.7+seed*9.0);float n2=sin(dot(normal,vec3(13.1,9.7,11.3))-uTime*1.2+seed*19.0);float voice=uLow*energyBias*.12+uMid*sin(seed*19.0+uTime*4.0)*.045+uHigh*n2*.025;p+=normal*(n1*uTurbulence*(1.0-uReduced*.8)+voice+uTransient*.05*(1.0-seed));vec4 mvPosition=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mvPosition;float perspective=uPointScale/max(1.0,-mvPosition.z);gl_PointSize=clamp(sizeBias*perspective*(1.0+uRms*.45),1.0,uMaxPointSize);vOpacity=.42+layer*.12+uRms*.28;vColor=colorBias;}`,
      fragmentShader:`precision mediump float;uniform float uBrightness,uError;varying float vOpacity;varying float vColor;void main(){vec2 q=gl_PointCoord*2.0-1.0;float r2=dot(q,q);if(r2>1.0)discard;float core=exp(-r2*9.0);float halo=smoothstep(1.0,0.0,r2)*.32;vec3 cyan=mix(vec3(0.0,.55,.72),vec3(.68,1.0,1.0),vColor);vec3 amber=vec3(1.0,.42,.08);vec3 color=mix(cyan,amber,uError);gl_FragColor=vec4(color*uBrightness,(core+halo)*vOpacity);}`});
    const particles=new THREE.Points(geometry,material);particles.frustumCulled=false;scene.add(particles);
    const ringGroup=new THREE.Group(),ringMaterial=new THREE.LineBasicMaterial({color:0x20ddff,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false});
    for(let ringIndex=0;ringIndex<3;ringIndex++){const ringPoints=[];for(let j=0;j<160;j++){const a=j/160*Math.PI*2,r=1.08+ringIndex*.12;ringPoints.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0))}const ringGeometry=new THREE.BufferGeometry().setFromPoints(ringPoints),ring=new THREE.LineLoop(ringGeometry,ringMaterial.clone());ring.rotation.x=(ringIndex-1)*.62;ring.rotation.y=ringIndex*.72;ring.userData.speed=(ringIndex%2?-.11:.08)*(ringIndex+1);ringGroup.add(ring)}scene.add(ringGroup);
    const maxConnections=TIER[quality].connections,connectionGeometry=new THREE.BufferGeometry(),connectionA=new Float32Array(maxConnections*6),connectionB=new Float32Array(maxConnections*6);
    function syncConnections(form){const formTarget=atlas[form];for(let i=0;i<maxConnections;i++){const p=i%count,q=(i*37+17)%count;for(let axis=0;axis<3;axis++){connectionA[i*6+axis]=source[p*3+axis];connectionA[i*6+3+axis]=source[q*3+axis];connectionB[i*6+axis]=formTarget[p*3+axis];connectionB[i*6+3+axis]=formTarget[q*3+axis]}}const a=connectionGeometry.getAttribute('positionA'),b=connectionGeometry.getAttribute('positionB');if(a){a.needsUpdate=true;b.needsUpdate=true}}
    syncConnections('sphere');connectionGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(connectionA),3));connectionGeometry.setAttribute('positionA',new THREE.BufferAttribute(connectionA,3));connectionGeometry.setAttribute('positionB',new THREE.BufferAttribute(connectionB,3));connectionGeometry.setDrawRange(0,maxConnections*2);
    const connectionUniforms={uMorph:uniforms.uMorph,uOpacity:{value:0}};
    const connectionMaterial=new THREE.ShaderMaterial({uniforms:connectionUniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`attribute vec3 positionA;attribute vec3 positionB;uniform float uMorph;void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(mix(positionA,positionB,uMorph),1.0);}`,fragmentShader:`precision mediump float;uniform float uOpacity;void main(){gl_FragColor=vec4(.18,.82,1.0,uOpacity);}`});
    const connections=new THREE.LineSegments(connectionGeometry,connectionMaterial);connections.frustumCulled=false;scene.add(connections);
    let raf=0,running=true,disposed=false,last=0,morphStart=0,morphDuration=750,morphForm='sphere',holdTimer=0,dockTimer=0,assemblyTimer=0,measuredFrames=0,totalFrameMs=0,maxFrameMs=0;
    const voice={rms:0,low:0,mid:0,high:0,transient:0};
    const governor=new RuntimeQualityGovernor(quality,applyRuntimeQuality,{slowFrameMs:1000/TIER[quality].fps*1.35});
    function applyRuntimeQuality(next){quality=next;renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,TIER[quality].dpr));uniforms.uMaxPointSize.value=TIER[quality].maxPoint;geometry.setDrawRange(0,Math.min(count,PARTICLE_BUDGET[quality]));connectionGeometry.setDrawRange(0,Math.min(maxConnections,TIER[quality].connections)*2);governor.slowFrameMs=1000/TIER[quality].fps*1.35;resize()}
    function resize(){const w=canvas.clientWidth||root.innerWidth||1,h=canvas.clientHeight||root.innerHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();uniforms.uPointScale.value=Math.min(w,h)*.16}
    function schedule(){if(running&&!raf)raf=root.requestAnimationFrame(render)}
    function render(now){raf=0;if(!running||disposed)return;if(last&&now-last<1000/TIER[quality].fps){schedule();return}const frameMs=last?now-last:0,dt=Math.min(.05,frameMs/1000);last=now;if(frameMs){measuredFrames++;totalFrameMs+=frameMs;maxFrameMs=Math.max(maxFrameMs,frameMs);governor.sample(frameMs)}uniforms.uTime.value=now/1000;if(morphStart)uniforms.uMorph.value=Math.min(1,(now-morphStart)/morphDuration);for(const k of ['rms','low','mid','high','transient']){const target=voice[k],rate=target>uniforms['u'+k[0].toUpperCase()+k.slice(1)].value?14:4;const u=uniforms['u'+k[0].toUpperCase()+k.slice(1)];u.value+=(target-u.value)*Math.min(1,dt*rate);voice[k]*=k==='transient'?.72:.985}const t=machine.targets,targetTurbulence=morphForm==='wordmark'?.008:ICON_FORMS.has(morphForm)?.018:t.turbulence;uniforms.uTurbulence.value+=(targetTurbulence-uniforms.uTurbulence.value)*Math.min(1,dt*10);uniforms.uBrightness.value+=(t.brightness-uniforms.uBrightness.value)*Math.min(1,dt*4);uniforms.uError.value+=(machine.state==='error'?1:0-uniforms.uError.value)*Math.min(1,dt*5);const connectionTarget=ICON_FORMS.has(morphForm)?0:Math.min(.16,t.connections);connectionUniforms.uOpacity.value+=(connectionTarget-connectionUniforms.uOpacity.value)*Math.min(1,dt*8);if(ICON_FORMS.has(morphForm))particles.rotation.y+=(0-particles.rotation.y)*Math.min(1,dt*9);else particles.rotation.y+=dt*(reducedMotion?.015:.07);connections.rotation.y=particles.rotation.y;const ringTarget=morphForm==='sphere'&&machine.state!=='dormant'?1:0;ringGroup.children.forEach(ring=>{ring.material.opacity+=(ringTarget*.22-ring.material.opacity)*Math.min(1,dt*5);ring.rotation.z+=dt*ring.userData.speed});ringGroup.rotation.y=particles.rotation.y*.55;renderer.render(scene,camera);schedule()}
    function morphTo(form,{duration=750,hold=0}={}){if(!FORMS.includes(form))return false;clearTimeout(holdTimer);const a=geometry.getAttribute('positionA'),b=geometry.getAttribute('positionB');a.array.set(b.array);a.needsUpdate=true;b.array.set(atlas[form]);b.needsUpdate=true;source.set(a.array);syncConnections(form);uniforms.uMorph.value=0;morphStart=root.performance.now();morphDuration=Math.max(1,reducedMotion?1:duration);morphForm=form;canvas.dataset.morph=form;if(hold>0&&form!=='sphere')holdTimer=setTimeout(()=>morphTo('sphere',{duration:650}),morphDuration+hold);schedule();return true}
    function setState(state){if(!machine.setState(String(state).toLowerCase()))return false;canvas.dataset.state=machine.state;sound.cue(machine.state);if(machine.targets.form!==morphForm)morphTo(machine.targets.form,{duration:state==='assembling'?ASSEMBLY_DURATION:750});if(state==='suspended')suspend();else resume();return true}
    function pushVoiceFrame(frame={}){for(const k of Object.keys(voice))voice[k]=Math.max(0,Math.min(1,Number(frame[k])||0));sound.setVoiceActive(!!frame.active||frame.phase==='speaking');if(frame.phase&&STATES.includes(frame.phase))setState(frame.phase);schedule();return true}
    function assemble(){clearTimeout(assemblyTimer);machine.setState('assembling');sound.cue(machine.state);canvas.dataset.state='assembling';canvas.dataset.assembling='true';source.set(createScatter(count));geometry.getAttribute('positionA').needsUpdate=true;geometry.getAttribute('positionB').array.set(atlas.sphere);geometry.getAttribute('positionB').needsUpdate=true;syncConnections('sphere');uniforms.uMorph.value=0;morphStart=root.performance.now();morphDuration=reducedMotion?1:ASSEMBLY_DURATION;assemblyTimer=setTimeout(()=>{canvas.dataset.assembling='false';setState('idle');morphTo('wordmark',{duration:700,hold:700})},reducedMotion?20:ASSEMBLY_DURATION);resume();return true}
    function dockTo(element){if(!element||!element.getBoundingClientRect)return false;clearTimeout(dockTimer);setState('docking');element.classList.add('neural-docked');const r=element.getBoundingClientRect(),sx=r.width/Math.max(1,root.innerWidth),sy=r.height/Math.max(1,root.innerHeight),tx=r.left+r.width/2-root.innerWidth/2,ty=r.top+r.height/2-root.innerHeight/2;if(canvas.parentNode!==root.document.body)root.document.body.appendChild(canvas);Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:'20',pointerEvents:'none'});canvas.style.transformOrigin='50% 50%';canvas.style.transition=reducedMotion?'none':'transform 550ms cubic-bezier(.2,.8,.2,1)';canvas.style.transform=`translate(${tx}px,${ty}px) scale(${Math.max(.08,Math.min(sx,sy))})`;canvas.dataset.layout='docking';dockTimer=setTimeout(()=>{element.appendChild(canvas);Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'3',transform:'none',transition:'none'});canvas.dataset.layout='docked';resize();setState('idle')},reducedMotion?0:560);return true}
    function undock(){canvas.style.transform='';canvas.dataset.layout='splash';setState('idle')}
    function suspend(){running=false;if(raf)root.cancelAnimationFrame(raf);raf=0;machine.state='suspended';canvas.dataset.state='suspended'}
    function resume(){if(disposed)return false;if(machine.state==='suspended')machine.setState('idle');if(!running){running=true;last=0;schedule()}return true}
    function rebuild(){geometry.getAttribute('positionA').needsUpdate=true;geometry.getAttribute('positionB').needsUpdate=true;resume()}
    function visibility(){if(root.document.hidden)suspend();else resume()}
    function contextLost(e){e.preventDefault();suspend()}
    function dispose(){if(disposed)return;disposed=true;suspend();sound.dispose();clearTimeout(holdTimer);clearTimeout(dockTimer);clearTimeout(assemblyTimer);root.removeEventListener('resize',resize);root.document.removeEventListener('visibilitychange',visibility);root.removeEventListener('pagehide',suspend);root.removeEventListener('pageshow',resume);canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',rebuild);scene.remove(particles);scene.remove(connections);scene.remove(ringGroup);ringGroup.children.forEach(ring=>{ring.geometry.dispose();ring.material.dispose()});geometry.dispose();material.dispose();connectionGeometry.dispose();connectionMaterial.dispose();renderer.dispose()}
    root.addEventListener('resize',resize,{passive:true});root.document.addEventListener('visibilitychange',visibility);root.addEventListener('pagehide',suspend);root.addEventListener('pageshow',resume);canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',rebuild);resize();schedule();
    const api={setState,morphTo,pushVoiceFrame,dockTo,undock,assemble,unlockAudio:()=>sound.unlock(),suspend,resume,dispose,state:()=>machine.state,form:()=>morphForm,telemetry:()=>({state:machine.state,form:morphForm,morph:uniforms.uMorph.value,quality,drawCount:Math.min(count,PARTICLE_BUDGET[quality]),canvasWidth:canvas.width,canvasHeight:canvas.height,layout:canvas.dataset.layout||'splash',measuredFrames,averageFrameMs:measuredFrames?totalFrameMs/measuredFrames:0,maxFrameMs,sound:sound.telemetry()}),get quality(){return quality}};root.ORBITNeuralCore=api;return api;
  }
  function createScatter(count){const a=new Float32Array(count*3);for(let i=0;i<count;i++){const p=spherePoint(i,count,2.1+rand(i,31)*1.9),spin=rand(i,32)*6.283;put(a,i,p[0]+Math.cos(spin)*.8,p[1]*1.25,p[2]+Math.sin(spin)*.8)}return a}
  function createFallbackApi(machine,element,sound){return{quality:'fallback',unlockAudio:()=>sound.unlock(),setState(s){const ok=machine.setState(s);if(ok){element.dataset.state=s;sound.cue(machine.state)}return ok},morphTo(f){if(!FORMS.includes(f))return false;element.dataset.form=f;return true},pushVoiceFrame(f){sound.setVoiceActive(!!f?.active||f?.phase==='speaking');element.style.setProperty('--voice',String(Math.max(0,Math.min(1,Number(f?.rms)||0))));return true},dockTo(){return false},undock(){},assemble(){element.classList.add('assembled');machine.setState('assembling');sound.cue(machine.state);return true},suspend(){},resume(){},dispose(){sound.dispose();element.remove()},state:()=>machine.state}}
  if(root.document){const boot=()=>init();if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
  return{FORMS,STATES,PARTICLE_BUDGET,ASSEMBLY_DURATION,TIER,STATE_TARGETS,resolveQuality,createMorphAtlas,CoreStateMachine,RuntimeQualityGovernor,NeuralCoreSound,init};
});
