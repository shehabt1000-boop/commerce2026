javascript
const CACHE_NAME = 'sharqia-v1';
const urlsToCache = [
    './',
    // يمكنك إضافة أي ملفات أخرى تريد تخزينها مؤقتاً هنا
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});