const CACHE='orbit-neural-core-v2-panorama-r15';
const FALLBACK='index.html';
const CORE=['./','index.html','styles.css?v=8','start-v2.js?v=27','three.r128.min.js','neural-core-v2.js?v=7','audio-mix.js?v=1','panorama.js?v=1','friday-v2-storage.js','friday-v2-neural.js','friday-v2-voice.js','friday-v2-briefing.js','friday-v2-ai.js','friday-v2-hologram.js','friday-v2-voice-advanced.js','friday-v2-audio-engine.js','assets/orbit-cinematic-boot.m4a'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(
    fetch(event.request,{cache:'no-store'}).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return response;
    }).catch(()=>caches.match(event.request).then(hit=>hit||caches.match(FALLBACK)))
  );
});
