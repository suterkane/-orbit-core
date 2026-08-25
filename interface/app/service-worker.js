const CACHE='orbit-neural-core-v2-presence-r4';
const FALLBACK='index.html';
const CORE=['./','index.html','styles.css?v=5','start-v2.css?v=20','three.r128.min.js','neural-core-v2.js?v=6','audio-mix.js?v=1','assets/friday-neural-de.ogg','assets/voice-zentrale.ogg','assets/voice-aufgaben.ogg','assets/voice-erfasst.ogg','assets/voice-prioritaet.ogg','assets/voice-bezug-fehlt.ogg','assets/voice-status.ogg','assets/voice-unklar.ogg','start-v2.js?v=18','app.js?v=10','voice-core.js?v=3','handoff.js?v=1','integrations.js?v=5','integrations.css?v=1','handoff.css?v=1','manifest.webmanifest'];

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
