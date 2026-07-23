// =============================================================================
// js/bottomnav.js — Thanh điều hướng dưới dùng chung cho các trang vệ tinh
// =============================================================================
// Tự nhúng bottom-nav 4 tab (Công việc / Nhật ký / Danh bạ / Cá nhân) vào cuối
// <body>. Không phụ thuộc Bootstrap JS — menu dropup chạy vanilla, nên dùng
// được cả trên trang không nạp bootstrap.bundle (vd: pump_info.html).
//
// Cách dùng (đặt cuối <body>, sau css/shared.css đã được link):
//   <script src="js/bottomnav.js" data-root="./"></script>          (trang ở gốc)
//   <script src="../js/bottomnav.js" data-root="../"></script>      (trang con)
// Tuỳ chọn: data-active="plan|log|contacts|personal" để tô sáng tab hiện tại.
//
// data-hidden="true": khởi tạo ở trạng thái ẩn (dùng cho trang có đăng nhập).
(function () {
  'use strict';

  const script = document.currentScript;
  const root = (script && script.dataset.root) || './';
  const active = (script && script.dataset.active) || '';
  const initiallyHidden = script && script.dataset.hidden === 'true';
  const spaMode = script && script.dataset.spa === 'true';

  let navElement = null;
  let menuElement = null;
  let desiredVisible = !initiallyHidden;
  let desiredActive = active;

  function setVisible(visible) {
    desiredVisible = Boolean(visible);
    if (!navElement || !menuElement) return;
    navElement.hidden = !desiredVisible;
    if (!desiredVisible) menuElement.classList.remove('open');
    document.body.classList.toggle('has-bds-bottom-nav', desiredVisible);
  }

  function setActive(key) {
    desiredActive = key || '';
    if (!navElement) return;
    navElement.querySelectorAll('[data-nav-key]').forEach(item => {
      const isActive = item.dataset.navKey === desiredActive;
      item.classList.toggle('active', isActive);
      if (isActive) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  }

  function refreshSession() {
    const logout = document.getElementById('bdsLogoutBtn');
    if (logout) logout.hidden = !hasSession();
  }

  window.BDSBottomNav = { setVisible, setActive, refreshSession };

  function isAdmin() {
    try {
      const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      if (!raw) return false;
      const role = (JSON.parse(raw).role || '').toLowerCase();
      return role === 'admin' || role === 'manager' || role === 'quản lý';
    } catch (e) { return false; }
  }

  function hasSession() {
    return Boolean(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
  }

  const TABS = [
    { key: 'plan',     icon: 'bi-chat-square-text-fill', label: 'Công việc', href: root + 'nhatky/index.html#people' },
    { key: 'log',      icon: 'bi-journal-text',      label: 'Nhật ký',  href: root + 'nhatky/index.html#loghistory' },
    { key: 'contacts', icon: 'bi-person-lines-fill', label: 'Danh bạ', href: root + 'nhatky/index.html#contacts' },
    { key: 'personal', icon: 'bi-person-circle',     label: 'Cá nhân', href: root + 'nhatky/index.html#personal' }
  ];

  const MENU_DAILY = [
    { icon: 'bi-clipboard2-check-fill', label: 'Checklist Vận Hành Ca',     href: root + 'checklist.html' },
    { icon: 'bi-person-badge',     label: 'Trang cá nhân & Cài đặt',       href: root + 'nhatky/index.html#personal' },
    { icon: 'bi-bar-chart-line-fill', label: 'Báo cáo công việc',          href: root + 'nhatky/index.html#stats' },
    { icon: 'bi-water',            label: 'Thông tin & Check vận hành bơm', href: root + 'pump_info.html' },
    { icon: 'bi-flag-fill',        label: 'Checklist Cơ Điện Sân Golf',     href: root + 'sangolf/' },
    { icon: 'bi-calendar-range',   label: 'Phân ca trực Ban Điện',          href: root + 'phanca/' }
  ];
  const MENU_ADMIN = [
    { icon: 'bi-people-fill',     label: 'Quản lý tài khoản Users', href: root + 'nhatky/index.html#usermanagement' },
    { icon: 'bi-alarm',            label: 'Cài đặt đồng hồ bơm',      href: root + 'hengio/' },
    { icon: 'bi-qr-code',          label: 'In mã QR máy bơm',         href: root + 'print_pumps.html' },
    { icon: 'bi-person-workspace', label: 'Câu hỏi phỏng vấn',        href: root + 'phongvan/' },
    { icon: 'bi-cpu-fill',         label: 'Giám sát Server Uptime',    href: root + 'status.html' },
    { icon: 'bi-history',          label: 'Nhật ký Thay đổi',          href: root + 'changelog.html' }
  ];

  function menuLinks(items) {
    return items.map(m => `<a href="${m.href}"><i class="bi ${m.icon}"></i>${m.label}</a>`).join('');
  }

  function notify(msg) {
    if (typeof window.bdsShowToast === 'function') window.bdsShowToast(msg, 'warning', 5000);
    else alert(msg);
  }
  async function handleInstallClick(e) {
    e.preventDefault();
    if (window.BD_PWA && BD_PWA.canInstall()) {
      await BD_PWA.promptInstall();
    } else {
      notify('Mở menu trình duyệt (⋮ hoặc nút Chia sẻ) và chọn "Thêm vào Màn hình chính" để cài ứng dụng.');
    }
  }

  function versionFooter() {
    const version = (typeof CONFIG !== 'undefined' && CONFIG.version) || '';
    if (!version) return '';
    return `<div class="px-3 py-1 text-center text-muted" style="font-size:.72rem;">Phiên bản ${version}</div>`;
  }

  function build() {
    const menu = document.createElement('div');
    menu.className = 'bds-nav-menu';
    menu.id = 'bdsNavMenu';
    menu.innerHTML =
      `<div class="bds-nav-menu-header"><i class="bi bi-grid-fill me-1"></i> Menu tiện ích</div>` +
      menuLinks(MENU_DAILY) +
      (isAdmin()
        ? `<hr><div class="bds-nav-menu-header"><i class="bi bi-shield-lock-fill me-1"></i> Dành cho quản trị</div>` + menuLinks(MENU_ADMIN)
        : '') +
      `<hr><a href="#" id="bdsInstallAppBtn"><i class="bi bi-download"></i>Cài đặt ứng dụng</a>` +
      `<button type="button" class="bds-nav-menu-action bds-nav-menu-logout" id="bdsLogoutBtn" ${hasSession() ? '' : 'hidden'}><i class="bi bi-box-arrow-right"></i>Đăng xuất</button>` +
      versionFooter();

    const nav = document.createElement('nav');
    nav.className = 'bds-bottom-nav';
    nav.setAttribute('aria-label', 'Điều hướng chính');
    nav.innerHTML = TABS.map(t => {
      const cls = 'bds-bottom-nav-item' + (t.key === active ? ' active' : '');
      if (spaMode) {
        const screen = t.key === 'plan' ? 'people' : t.key === 'log' ? 'loghistory' : t.key === 'contacts' ? 'contacts' : 'personal';
        return `<button type="button" class="${cls}" data-nav-key="${t.key}" data-nav-screen="${screen}"><i class="bi ${t.icon}"></i><span>${t.label}</span></button>`;
      }
      return `<a class="${cls}" data-nav-key="${t.key}" href="${t.href}"><i class="bi ${t.icon}"></i><span>${t.label}</span></a>`;
    }).join('');

    document.body.appendChild(menu);
    document.body.appendChild(nav);
    menuElement = menu;
    navElement = nav;
    setVisible(desiredVisible);
    setActive(desiredActive);
    refreshSession();

    const btn = document.getElementById('bdsNavMenuBtn');
    if (btn) btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('open');
      });
    window.addEventListener('bds:menu', () => {
      menu.classList.toggle('open');
      document.body.classList.toggle('bds-menu-open', menu.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !e.target.closest('[data-header-plus]')) {
        menu.classList.remove('open');
        document.body.classList.remove('bds-menu-open');
      }
    });
    document.getElementById('bdsInstallAppBtn').addEventListener('click', handleInstallClick);
    const logoutBtn = document.getElementById('bdsLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
      if (!confirm('Đăng xuất khỏi tài khoản này?')) return;
      if (window.BD_SSO && typeof window.BD_SSO.logout === 'function') {
        window.BD_SSO.logout();
      } else {
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
      }
      window.location.reload();
    });
    if (spaMode) {
      nav.addEventListener('click', event => {
        const item = event.target.closest('[data-nav-screen]');
        if (item) window.dispatchEvent(new CustomEvent('bds:navigate', { detail: { screen: item.dataset.navScreen } }));
      });
      menu.addEventListener('click', event => {
        const link = event.target.closest('a[href*="nhatky/index.html#"]');
        if (!link) return;
        const screen = link.getAttribute('href').split('#')[1];
        if (!screen) return;
        event.preventDefault();
        menu.classList.remove('open');
        window.dispatchEvent(new CustomEvent('bds:navigate', { detail: { screen } }));
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
