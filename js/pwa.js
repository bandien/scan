// =============================================================================
// js/pwa.js — Đăng ký Service Worker + gợi ý cài đặt ứng dụng (PWA)
// =============================================================================
// Cùng quy ước data-root với js/bottomnav.js vì trang GitHub Pages nằm dưới
// subpath (/scan/), không phải domain gốc, nên không thể đăng ký sw.js bằng
// đường dẫn tương đối cố định — mỗi trang phải tự khai báo mình cách root bao xa.
//
// Cách dùng (đặt sau css/shared.css, TRƯỚC js/bottomnav.js không bắt buộc):
//   <script src="js/pwa.js" data-root="./"></script>          (trang ở gốc)
//   <script src="../js/pwa.js" data-root="../"></script>      (trang con)
(function () {
  'use strict';

  const script = document.currentScript;
  const root = (script && script.dataset.root) || './';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(root + 'sw.js', { scope: root }).catch((err) => {
        console.warn('Không đăng ký được Service Worker:', err);
      });
    });
  }

  // Bắt sự kiện cài đặt ra màn hình chính — trình duyệt tự bắn sự kiện này khi
  // đủ điều kiện (đã có manifest + SW + dùng HTTPS). Lưu lại để BD_PWA.promptInstall()
  // gọi được từ nút trong menu (js/bottomnav.js) thay vì phải chờ banner mặc định.
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
  });

  async function promptInstall() {
    if (!deferredInstallPrompt) {
      return { supported: false };
    }
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return { supported: true, outcome: choice.outcome };
  }

  function canInstall() {
    return Boolean(deferredInstallPrompt);
  }

  window.BD_PWA = { promptInstall, canInstall };
})();
