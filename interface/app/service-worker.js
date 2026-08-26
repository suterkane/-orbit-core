const CACHE='orbit-neural-core-v2-panorama-r13';
const FALLBACK='index.html';
const CORE=['./','index.html','styles.css?v=8','start-v2.css?v=21','three.r128.min.js','neural-core-v2.js?v=7','audio-mix.js?v=1','panorama.css?v=1','panorama.js?v=1','assets/friday-neural-de.ogg','assets/orbit-cinematic-boot.m4a','assets/voice-zentrale.ogg','assets/voice-aufgaben.ogg','assets/voice-erfasst.ogg','assets/voice-prioritaet.ogg','assets/voice-bezug-fehlt.ogg','assets/voice-status.ogg','assets/voice-unklar.ogg','start-v2.js?v=25','companion-state.js?v=1','companion-runtime.js?v=1','companion-sync.js?v=1','app.js?v=13','voice-core.js?v=5','integrations.js?v=8','integrations.css?v=1','manifest.webmanifest'];

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
