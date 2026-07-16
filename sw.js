// =============================================================================
// sw.js — Service Worker cho BanDienScan (PWA)
// =============================================================================
// Mục tiêu: app dùng được khi sóng yếu/mất mạng ngoài sân golf, cài được ra
// màn hình chính điện thoại. Phải đặt ở ROOT (không phải trong js/) vì scope
// mặc định của Service Worker chỉ phủ được thư mục chứa nó trở xuống.
//
// Chiến lược:
// - API GAS (script.google.com): KHÔNG cache — dữ liệu vận hành luôn phải mới.
// - Trang & tài nguyên cùng gốc (HTML, css/, js/): network-first — nhân viên
//   luôn thấy bản mới nhất khi có mạng, rơi về cache khi mất mạng/sóng yếu.
// - Thư viện CDN (Bootstrap, icon, font — URL đã gắn version cố định):
//   cache-first, vì nội dung không đổi theo version đã ghim.
//
// Tăng CACHE_VERSION mỗi khi đổi danh sách APP_SHELL để buộc nạp lại cache cũ.
const CACHE_VERSION = 'bds-shell-v1';
const RUNTIME_CACHE = 'bds-runtime-v1';

const APP_SHELL = [
  './',
  'index.html',
  'pump_info.html',
  'meter.html',
  'sangolf/',
  'phanca/',
  'hengio/',
  'phongvan/',
  'nhatky/',
  'css/shared.css',
  'js/config.js',
  'js/api.js',
  'js/sso.js',
  'js/bottomnav.js',
  'js/fontscale.js',
  'js/pwa.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch((err) => console.warn('SW: bỏ qua asset lỗi', url, err)))
      ))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys
        .filter((k) => k !== CACHE_VERSION && k !== RUNTIME_CACHE)
        .map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isApiCall(url) {
  return url.hostname === 'script.google.com';
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // Không can thiệp POST — luôn đi thẳng backend

  const url = new URL(req.url);
  if (isApiCall(url)) return; // Dữ liệu vận hành/API luôn phải là bản mới nhất

  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('index.html')))
    );
  } else {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(() => cached);
      })
    );
  }
});
