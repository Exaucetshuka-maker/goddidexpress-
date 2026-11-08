/* Service worker minimal : l'application s'installe et affiche un message si le téléphone est hors connexion. Rien n'est mis en cache : le site est toujours à jour. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(function () {
    return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GOD DID EXPRESS</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0E0D0C;color:#fff;font-family:sans-serif;text-align:center;padding:24px"><div><h1 style="color:#FF7A1A">GOD DID EXPRESS</h1><p>Pas de connexion internet. Réessaie dans un instant.</p></div>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  }));
});
