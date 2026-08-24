(()=>{
  'use strict';

  const canvas=document.querySelector('#fridayHologram');
  const splash=document.querySelector('#splash');
  if(!canvas||!splash||!window.THREE)return;

  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=window.matchMedia('(max-width: 700px)').matches;
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x00070a,.055);

  const camera=new THREE.PerspectiveCamera(52,1,.1,100);
  camera.position.set(0,3.2,9.2);
  camera.lookAt(0,0,0);

  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!mobile,powerPreference:'high-performance'});
  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1.5:2));

  const root=new THREE.Group();
  root.rotation.x=-.12;
  scene.add(root);

  const rings=[];
  const cyan=0x00e5ff;
  const orange=0xff9500;
  for(let i=0;i<8;i++){
    const radius=1.3+i*.43;
    const geometry=new THREE.TorusGeometry(radius,.018+(i%3)*.008,8,mobile?72:120);
    const material=new THREE.MeshBasicMaterial({color:i%3===1?orange:cyan,transparent:true,opacity:.78-i*.055,blending:THREE.AdditiveBlending,depthWrite:false});
    const ring=new THREE.Mesh(geometry,material);
    ring.rotation.x=Math.PI/2+(i-3.5)*.075;
    ring.rotation.y=(i%2?1:-1)*.12;
    ring.userData={speed:(i%2?1:-1)*(.0017+i*.00022),phase:i*.7};
    root.add(ring);
    rings.push(ring);
  }

  const coreGeometry=new THREE.IcosahedronGeometry(.58,mobile?2:3);
  const coreMaterial=new THREE.MeshBasicMaterial({color:cyan,transparent:true,opacity:.72,wireframe:true,blending:THREE.AdditiveBlending,depthWrite:false});
  const core=new THREE.Mesh(coreGeometry,coreMaterial);
  root.add(core);

  const haloGeometry=new THREE.SphereGeometry(.82,24,16);
  const haloMaterial=new THREE.MeshBasicMaterial({color:orange,transparent:true,opacity:.09,blending:THREE.AdditiveBlending,depthWrite:false});
  const halo=new THREE.Mesh(haloGeometry,haloMaterial);
  root.add(halo);

  const count=mobile?220:380;
  const positions=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const radius=2.3+Math.random()*4.4;
    const theta=Math.random()*Math.PI*2;
    const y=(Math.random()-.5)*5.4;
    positions[i*3]=Math.cos(theta)*radius;
    positions[i*3+1]=y;
    positions[i*3+2]=Math.sin(theta)*radius*.48;
  }
  const particlesGeometry=new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const particles=new THREE.Points(particlesGeometry,new THREE.PointsMaterial({color:cyan,size:mobile?.035:.045,transparent:true,opacity:.62,blending:THREE.AdditiveBlending,depthWrite:false}));
  scene.add(particles);

  let width=0,height=0,frame=0,visible=true;
  function resize(){
    const rect=splash.getBoundingClientRect();
    const nextWidth=Math.max(1,Math.round(rect.width));
    const nextHeight=Math.max(1,Math.round(rect.height));
    if(nextWidth===width&&nextHeight===height)return;
    width=nextWidth;height=nextHeight;
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
  }

  function render(now=0){
    if(!visible)return;
    frame=requestAnimationFrame(render);
    resize();
    const t=now*.001;
    if(!reduceMotion){
      rings.forEach((ring,i)=>{
        ring.rotation.z+=ring.userData.speed;
        ring.rotation.x=Math.PI/2+(i-3.5)*.075+Math.sin(t*.55+ring.userData.phase)*.035;
      });
      core.rotation.x=t*.24;
      core.rotation.y=t*.36;
      const pulse=1+Math.sin(t*2.4)*.09;
      core.scale.setScalar(pulse);
      halo.scale.setScalar(1.05+Math.sin(t*1.7)*.08);
      particles.rotation.y=t*.025;
      root.rotation.z=Math.sin(t*.18)*.055;
      camera.position.x=Math.sin(t*.16)*.42;
      camera.position.y=3.2+Math.cos(t*.21)*.18;
      camera.lookAt(0,0,0);
    }
    renderer.render(scene,camera);
  }

  const observer=new MutationObserver(()=>{
    const shouldRun=!splash.classList.contains('hidden')&&document.visibilityState==='visible';
    if(shouldRun&&!visible){visible=true;render(performance.now())}
    else if(!shouldRun&&visible){visible=false;cancelAnimationFrame(frame)}
  });
  observer.observe(splash,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){visible=false;cancelAnimationFrame(frame)}
    else if(!splash.classList.contains('hidden')&&!visible){visible=true;render(performance.now())}
  });
  window.addEventListener('resize',resize,{passive:true});
  render();
  window.ORBITHologram={renderer,scene,camera,rings,dispose(){visible=false;cancelAnimationFrame(frame);observer.disconnect();renderer.dispose()}};
})();
