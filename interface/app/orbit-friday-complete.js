// ORBIT FRIDAY - Complete WebGL + Audio System
(function() {
  'use strict';
  
  console.log('🚀 ORBIT FRIDAY initializing...');
  
  // === AUDIO ===
  let audioContext = null;
  let sounds = {};
  let musicBuffer = null;
  let musicSource = null;
  let musicGain = null;
  
  // === THREE.JS ===
  let scene, camera, renderer;
  let rings = [];
  let particles = [];
  let core;
  let time = 0;
  
  // === UI ===
  const statusEl = document.getElementById('status');
  const btnEl = document.getElementById('initiate-btn');
  
  // === AUDIO INIT ===
  async function initAudio() {
    console.log('🔊 Loading audio...');
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('✓ AudioContext created');
      
      // Load sounds
      const soundFiles = ['boot', 'beep', 'beep-high', 'processing', 'confirm', 'data-transfer'];
      for (const name of soundFiles) {
        try {
          const res = await fetch(`./private-assets/sounds/${name}.wav`);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            sounds[name] = await audioContext.decodeAudioData(buf);
            console.log(`✓ ${name}`);
          }
        } catch (e) {
          console.warn(`⚠ ${name} failed`);
        }
      }
      
      // Load music
      try {
        const mRes = await fetch('./private-assets/friday-theme.m4a');
        if (mRes.ok) {
          console.log('📥 Downloading music...');
          const mBuf = await mRes.arrayBuffer();
          console.log('🎵 Decoding music...');
          musicBuffer = await audioContext.decodeAudioData(mBuf);
          console.log('✓ Music ready:', musicBuffer.duration.toFixed(1), 's');
        } else {
          console.error('❌ Music not found');
        }
      } catch (e) {
        console.error('❌ Music failed:', e.message);
      }
      
      return true;
    } catch (e) {
      console.error('❌ Audio init failed:', e);
      return false;
    }
  }
  
  function playSound(name, vol = 0.5) {
    if (!audioContext || !sounds[name]) return;
    try {
      audioContext.resume();
      const src = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      src.buffer = sounds[name];
      gain.gain.value = vol;
      src.connect(gain);
      gain.connect(audioContext.destination);
      src.start(0);
      console.log('🔊', name);
    } catch (e) {
      console.error('Sound error:', e);
    }
  }
  
  function playMusic() {
    if (!audioContext || !musicBuffer) {
      console.error('❌ Music not ready');
      return false;
    }
    
    try {
      if (musicSource) try { musicSource.stop(); } catch(e) {}
      
      audioContext.resume();
      
      musicSource = audioContext.createBufferSource();
      musicGain = audioContext.createGain();
      
      musicSource.buffer = musicBuffer;
      musicSource.loop = true;
      musicGain.gain.value = 0.5;
      
      musicSource.connect(musicGain);
      musicGain.connect(audioContext.destination);
      
      musicSource.start(0);
      console.log('🎵 Music playing');
      return true;
    } catch (e) {
      console.error('❌ Music playback failed:', e);
      return false;
    }
  }
  
  // === THREE.JS SCENE ===
  function initScene() {
    console.log('🎨 Building 3D scene...');
    const canvas = document.getElementById('canvas');
    
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    
    // Core (orange)
    const coreGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff9500, transparent: true, opacity: 1 });
    core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);
    
    const light = new THREE.PointLight(0xff9500, 4, 40);
    scene.add(light);
    
    // Rings
    for (let i = 0; i < 12; i++) {
      const radius = 1.5 + i * 0.7;
      const geo = new THREE.TorusGeometry(radius, 0.05, 16, 100);
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00e5ff : 0x00b8d4,
        transparent: true,
        opacity: 0.85 - i * 0.05,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI * 0.5;
      ring.userData = { speed: 0.0004 + i * 0.0002, wobblePhase: Math.random() * Math.PI * 2 };
      scene.add(ring);
      rings.push(ring);
    }
    
    // Particles
    const pGeo = new THREE.BufferGeometry();
    const pCount = 500;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 3 + Math.random() * 7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.1, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    const pSys = new THREE.Points(pGeo, pMat);
    scene.add(pSys);
    particles.push(pSys);
    
    const ambient = new THREE.AmbientLight(0x00e5ff, 0.4);
    scene.add(ambient);
    
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    console.log('✓ Scene ready');
  }
  
  function animate() {
    requestAnimationFrame(animate);
    time += 0.016;
    
    // Rings
    rings.forEach(ring => {
      ring.rotation.y += ring.userData.speed;
      const wobble = Math.sin(time * 0.6 + ring.userData.wobblePhase) * 0.2;
      ring.rotation.x = Math.PI * 0.5 + wobble;
      const pulse = 1 + Math.sin(time * 2.5) * 0.03;
      ring.scale.set(pulse, pulse, pulse);
    });
    
    // Core
    if (core) {
      const pulse = 1 + Math.sin(time * 3.5) * 0.2;
      core.scale.set(pulse, pulse, pulse);
      core.rotation.y += 0.015;
    }
    
    // Particles
    particles.forEach(ps => {
      ps.rotation.y += 0.0005;
      const pos = ps.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] += Math.sin(time + i * 0.01) * 0.003;
      }
      ps.geometry.attributes.position.needsUpdate = true;
    });
    
    // Camera
    camera.position.x = Math.sin(time * 0.1) * 1.2;
    camera.position.y = 5 + Math.cos(time * 0.15) * 0.7;
    camera.lookAt(0, 0, 0);
    
    renderer.render(scene, camera);
  }
  
  // === BOOT SEQUENCE ===
  async function boot() {
    btnEl.disabled = true;
    
    if (audioContext) await audioContext.resume();
    
    playSound('boot', 0.5);
    statusEl.textContent = 'FRIDAY INITIALISIERUNG...';
    await sleep(1000);
    
    playSound('beep', 0.4);
    statusEl.textContent = 'ORBIT CORE HOCHFAHREN';
    await sleep(800);
    
    playSound('processing', 0.35);
    statusEl.textContent = 'NEURALE SCHNITTSTELLE VERBINDEN';
    await sleep(900);
    
    playSound('beep-high', 0.3);
    statusEl.textContent = 'SPRACHSYSTEM AKTIVIEREN';
    await sleep(700);
    
    playSound('data-transfer', 0.3);
    statusEl.textContent = 'SICHERHEITSPROTOKOLLE LADEN';
    await sleep(800);
    
    const musicOk = playMusic();
    
    playSound('confirm', 0.5);
    statusEl.textContent = musicOk ? 'FRIDAY ONLINE · ALLE SYSTEME BEREIT' : 'FRIDAY ONLINE · KEIN AUDIO';
    
    await sleep(2000);
    statusEl.textContent = 'GUTEN TAG, MISTER STARK.';
  }
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // === INIT ===
  window.addEventListener('DOMContentLoaded', async () => {
    initScene();
    animate();
    await initAudio();
    
    btnEl.addEventListener('click', boot);
    
    console.log('✓ ORBIT FRIDAY ready');
  });
  
})();
