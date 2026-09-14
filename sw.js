// Increment for every published release. Never force activation or reload an open brew.
const CACHE = 'nor-apa-v1';
const ROOT = new URL('./', self.location.href);
const FILES = ['./','index.html','assets/app.css','assets/icon.svg','manifest.webmanifest','assets/vendor/bootstrap.min.css','assets/fonts/plex-sans.woff2','assets/fonts/plex-mono.woff2','js/app.js','js/core.js','js/db.js','data/templates/altbier.json','data/public/demo.json'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(p=>new URL(p,ROOT).href)))));
self.addEventListener('activate', event => event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('nor-apa-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch', event => {
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    // Public releases should refresh online; cached copies remain readable offline.
    if(url.pathname.includes('/data/public/')) {
      try {const fresh=await fetch(event.request);if(fresh.ok)await cache.put(event.request,fresh.clone());return fresh;}catch{const old=await cache.match(event.request);return old||new Response('Offline nicht verfügbar',{status:503});}
    }
    const cached=await cache.match(event.request);if(cached)return cached;
    try{return await fetch(event.request);}catch{if(event.request.mode==='navigate')return (await cache.match(new URL('index.html',ROOT).href));return new Response('Offline nicht verfügbar',{status:503});}
  })());
});
