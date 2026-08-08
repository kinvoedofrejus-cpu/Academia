const CACHE_NAME = "academia-cache-v1";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (evenement) => {
  self.skipWaiting();
  evenement.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(
        noms
          .filter((nom) => nom !== CACHE_NAME)
          .map((nom) => caches.delete(nom))
      )
    ).then(() => self.clients.claim())
  );
});

// Réseau d'abord (pour rester à jour), repli sur le cache hors-ligne.
// Ne met en cache que la coquille de l'app ; jamais les appels vers le
// serveur central de licences (autre origine, jamais intercepté ici).
self.addEventListener("fetch", (evenement) => {
  const url = new URL(evenement.request.url);
  if (url.origin !== self.location.origin) return;

  evenement.respondWith(
    fetch(evenement.request)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(evenement.request, copie));
        return reponse;
      })
      .catch(() => caches.match(evenement.request))
  );
});
