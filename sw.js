const CACHE='veille-v2';
const SHELL=['./','index.html','manifest.webmanifest','icon.svg','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/icon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.origin===location.origin&&/\.json$/.test(u.pathname)){
    // Données : toujours la version du jour si le réseau répond, sinon la dernière gardée
    e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(u.pathname,c));return r})
      .catch(()=>caches.match(u.pathname).then(r=>{if(!r)throw new Error('offline');const h=new Headers(r.headers);h.set('x-veille-cache','1');return r.blob().then(b=>new Response(b,{status:200,headers:h}))})));
    return}
  if(u.origin===location.origin){
    // Page : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
    return}
  // Polices Google : cache d'abord
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const c=n.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return n})))}
});
