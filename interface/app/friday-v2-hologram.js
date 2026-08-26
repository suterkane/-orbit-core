// FRIDAY v2 Hologram — Three.js Neural Visualization + Music Reactivity
(()=>{
  let scene,camera,renderer,particles=[],analyser=null,dataArray=null;
  let particleSystem=null,orbitRing=null,pulseShader=null;
  const PARTICLE_COUNT=5000;
  
  function init(container){
    if(!container)return;
    
    // Three.js setup
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x030e17);
    scene.fog=new THREE.Fog(0x030e17,50,100);
    
    camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
    camera.position.z=15;
    
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Particle system
    const geometry=new THREE.BufferGeometry();
    const positions=new Float32Array(PARTICLE_COUNT*3);
    const colors=new Float32Array(PARTICLE_COUNT*3);
    
    for(let i=0;i<PARTICLE_COUNT;i++){
      positions[i*3]=Math.random()*40-20;
      positions[i*3+1]=Math.random()*40-20;
      positions[i*3+2]=Math.random()*40-20;
      
      colors[i*3]=0;
      colors[i*3+1]=229/255;
      colors[i*3+2]=255/255;
    }
    
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    
    const material=new THREE.PointsMaterial({
      size:0.1,
      vertexColors:true,
      transparent:true,
      sizeAttenuation:true
    });
    
    particleSystem=new THREE.Points(geometry,material);
    scene.add(particleSystem);
    
    // Orbit ring
    const ringGeometry=new THREE.TorusGeometry(8,0.2,16,100);
    const ringMaterial=new THREE.MeshBasicMaterial({color:0x00e5ff,wireframe:false});
    orbitRing=new THREE.Mesh(ringGeometry,ringMaterial);
    orbitRing.rotation.x=Math.PI*0.3;
    scene.add(orbitRing);
    
    // Central sphere
    const coreGeometry=new THREE.SphereGeometry(2,32,32);
    const coreMaterial=new THREE.MeshPhongMaterial({
      color:0x00e5ff,
      emissive:0x00a5d5,
      wireframe:false
    });
    const core=new THREE.Mesh(coreGeometry,coreMaterial);
    scene.add(core);
    
    // Audio analyser
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(AudioCtx){
      try{
        const ctx=new AudioCtx();
        analyser=ctx.createAnalyser();
        analyser.fftSize=256;
        dataArray=new Uint8Array(analyser.frequencyBinCount);
      }catch(e){console.log('Audio analyser failed:',e);}
    }
    
    window.addEventListener('resize',onWindowResize);
    animate();
  }
  
  function animate(){
    requestAnimationFrame(animate);
    
    // Rotate orbit ring
    if(orbitRing){
      orbitRing.rotation.z+=0.0002;
      orbitRing.rotation.x+=0.0001;
    }
    
    // Update particles
    if(particleSystem&&particleSystem.geometry){
      const positions=particleSystem.geometry.attributes.position.array;
      for(let i=0;i<PARTICLE_COUNT;i++){
        positions[i*3]+=Math.sin(Date.now()*0.0001+i)*0.01;
        positions[i*3+1]+=Math.cos(Date.now()*0.0001+i)*0.01;
      }
      particleSystem.geometry.attributes.position.needsUpdate=true;
    }
    
    // Audio reactivity
    if(analyser&&dataArray){
      analyser.getByteFrequencyData(dataArray);
      const avg=dataArray.reduce((a,b)=>a+b)/dataArray.length;
      if(particleSystem)particleSystem.scale.set(1+avg/500,1+avg/500,1+avg/500);
    }
    
    renderer.render(scene,camera);
  }
  
  function onWindowResize(){
    const w=window.innerWidth;
    const h=window.innerHeight;
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w,h);
  }
  
  function setMusicReactivity(analyserNode){
    analyser=analyserNode;
  }
  
  window.ORBITHologram={init,setMusicReactivity};
})();
