// Monetag Push Notifications — DEVE ficar no topo antes de qualquer outro código
try { importScripts('https://vfrhtga.com/pfe/current/sw.pfe.js'); } catch(e) {}

// Ansen Animes - Service Worker (PWA)
const CACHE_NAME = "ansen-pwa-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/favicon.ico",
  "/og-cover.jpg",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Network first fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
