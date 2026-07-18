// =============================================================================
// js/app-header.js — Header dùng chung tự động nhúng cho tất cả các trang
// =============================================================================
// Tự động tạo và nhúng <header class="app-header"> vào đầu trang.
//
// Cách dùng (đặt trong <head> hoặc trước </body>, sau css/shared.css):
//   <script src="js/app-header.js" data-title="Thông tin & Vận Hành Bơm" data-sub="BanDienScan" data-icon="bi-water" data-back="index.html"></script>
//
// Thuộc tính tùy chọn (data-attributes):
//   - data-root: "./" hoặc "../" (đường dẫn tương đối)
//   - data-title: Tiêu đề trang
//   - data-sub: Phụ đề trang (mặc định: BanDienScan)
//   - data-icon: Icon bootstrap (mặc định: bi-lightning-charge-fill)
//   - data-back: Link quay lại (VD: index.html). Nếu để trống sẽ không hiện nút Back.
//   - data-target: Chèn vào container đặc biệt; mặc định header là con trực tiếp của body.
//   - data-hidden="true": Khởi tạo ẩn cho trang có màn hình đăng nhập.
(function () {
  'use strict';

  const script = document.currentScript;
  const root = (script && script.dataset.root) || './';
  const title = (script && script.dataset.title) || 'BanDienScan';
  const subtitle = (script && script.dataset.sub) || 'BanDienScan';
  const backUrl = (script && script.dataset.back) || '';
  const icon = (script && script.dataset.icon) || 'bi-lightning-charge-fill';
  const initiallyHidden = script && script.dataset.hidden === 'true';
  let headerElement = null;
  let desiredVisible = !initiallyHidden;
  let currentBackHandler = null;

  function setVisible(visible) {
    desiredVisible = Boolean(visible);
    if (headerElement) headerElement.hidden = !desiredVisible;
  }

  function update(options) {
    if (!headerElement) return;
    const next = options || {};
    const titleEl = headerElement.querySelector('[data-header-title]');
    const subtitleEl = headerElement.querySelector('[data-header-subtitle]');
    const iconEl = headerElement.querySelector('[data-header-icon]');
    const backEl = headerElement.querySelector('[data-header-back]');
    const extraEl = headerElement.querySelector('[data-header-extra]');
    const titleViews = headerElement.querySelectorAll('[data-header-title-view]');
    const searchViews = headerElement.querySelectorAll('[data-header-search-view]');
    const searchInput = headerElement.querySelector('[data-header-search]');
    if (titleEl && next.title != null) titleEl.textContent = next.title;
    if (subtitleEl && next.subtitle != null) subtitleEl.textContent = next.subtitle;
    if (iconEl && next.icon) iconEl.className = `bi ${next.icon}`;
    currentBackHandler = typeof next.onBack === 'function' ? next.onBack : null;
    let detailMode = false;
    if (backEl) {
      const nextBackUrl = next.backUrl != null ? next.backUrl : '';
      const hasBack = Boolean(nextBackUrl || currentBackHandler);
      detailMode = hasBack;
      backEl.hidden = !hasBack;
      backEl.setAttribute('href', nextBackUrl || '#');
    }
    if (extraEl) extraEl.innerHTML = next.extraHtml || '';
    const searchMode = next.mode === 'search';
    titleViews.forEach(view => { view.hidden = searchMode; });
    searchViews.forEach(view => { view.hidden = !searchMode; });
    headerElement.classList.toggle('app-header-search-mode', searchMode);
    headerElement.classList.toggle('app-header-detail-mode', detailMode);
    if (searchInput && next.searchPlaceholder) searchInput.placeholder = next.searchPlaceholder;
  }

  window.BDSAppHeader = { setVisible, update };

  function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle("dark-mode");
    document.documentElement.setAttribute("data-bs-theme", isDark ? "dark" : "light");
    localStorage.setItem("bandien_theme", isDark ? "dark" : "light");
    const iconEl = document.getElementById("themeIcon");
    if (iconEl) iconEl.className = isDark ? "bi bi-sun-fill text-warning" : "bi bi-moon-stars-fill";
  }
  window.toggleDarkMode = toggleDarkMode;

  function initTheme() {
    const saved = localStorage.getItem("bandien_theme") || "light";
    if (saved === "dark") {
      document.documentElement.classList.add("dark-mode");
      document.documentElement.setAttribute("data-bs-theme", "dark");
    }
    const iconEl = document.getElementById("themeIcon");
    if (iconEl) iconEl.className = saved === "dark" ? "bi bi-sun-fill text-warning" : "bi bi-moon-stars-fill";
  }

  function buildHeader() {
    initTheme();
    // Tránh chèn trùng nếu trang đã có header.app-header sẵn
    if (document.querySelector('header.app-header')) return;

    const header = document.createElement('header');
    header.className = 'app-header';
    headerElement = header;
    
    header.innerHTML = `
      <div class="header-inner">
        <div class="header-left min-w-0" data-header-title-view>
          <a href="${backUrl || '#'}" class="btn-back flex-shrink-0" data-header-back title="Quay lại" ${backUrl ? '' : 'hidden'}><i class="bi bi-arrow-left"></i></a>
          <div class="brand-mark flex-shrink-0"><i class="bi ${icon}" data-header-icon></i></div>
          <div class="header-titles min-w-0">
            <div class="app-title text-truncate" data-header-title>${title}</div>
            <div class="header-sub text-truncate" data-header-subtitle>${subtitle}</div>
          </div>
        </div>
        <div class="app-header-search" data-header-search-view hidden>
          <i class="bi bi-search"></i>
          <input type="search" data-header-search placeholder="Tìm kiếm" autocomplete="off" aria-label="Tìm kiếm">
        </div>
        <div class="header-right" data-header-title-view>
          <span id="syncBadge" class="sync-pill me-1" style="display:none;"><i class="bi bi-cloud-check-fill me-1"></i>Đồng bộ</span>
          <span data-header-extra></span>
          <a class="app-header-action app-header-home" href="${root}index.html" title="Trang chủ" aria-label="Trang chủ"><i class="bi bi-house-fill"></i></a>
          <a class="app-header-action app-header-personal" href="${root}nhatky/index.html#personal" title="Cá nhân" aria-label="Trang cá nhân"><i class="bi bi-person-fill"></i></a>
        </div>
        <div class="app-header-search-actions" data-header-search-view hidden>
          <a class="app-header-search-action" href="${root}index.html" title="Quét mã QR" aria-label="Quét mã QR"><i class="bi bi-qr-code-scan"></i></a>
          <button class="app-header-search-action" type="button" data-header-plus title="Mở tiện ích" aria-label="Mở tiện ích"><i class="bi bi-plus-lg"></i></button>
        </div>
      </div>
    `;

    const targetSelector = (script && script.dataset.target) || '';
    const targetEl = targetSelector ? document.querySelector(targetSelector) : null;

    if (targetEl) {
      targetEl.insertBefore(header, targetEl.firstChild);
    } else {
      document.body.insertBefore(header, document.body.firstChild);
    }
    setVisible(desiredVisible);
    header.addEventListener('click', event => {
      const back = event.target.closest('[data-header-back]');
      if (back && currentBackHandler) {
        event.preventDefault();
        currentBackHandler();
      }
      const personal = event.target.closest('.app-header-personal');
      if (personal && /[\\\/]nhatky[\\\/]index\.html$/i.test(window.location.pathname)) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('bds:navigate', { detail: { screen: 'personal' } }));
      }
      if (event.target.closest('[data-header-plus]')) {
        event.stopPropagation();
        window.dispatchEvent(new CustomEvent('bds:menu'));
      }
    });
    const searchInput = header.querySelector('[data-header-search]');
    if (searchInput) searchInput.addEventListener('input', () => {
      window.dispatchEvent(new CustomEvent('bds:search', { detail: { query: searchInput.value } }));
    });

    // fontscale.js thường được nạp sớm trong <head>; bind lại sau khi nút vừa
    // được component tạo ra. Hàm bind dùng cơ chế idempotent nên không gắn trùng.
    if (window.BD_FontScale) window.BD_FontScale.bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildHeader);
  } else {
    buildHeader();
  }
})();
