// =============================================================================
// js/bottomnav.js — Thanh điều hướng dưới dùng chung cho các trang vệ tinh
// =============================================================================
// Tự nhúng bottom-nav (Kế hoạch / Nhật ký / Quét QR / Menu / Cá nhân) vào cuối
// <body>. Không phụ thuộc Bootstrap JS — menu dropup chạy vanilla, nên dùng
// được cả trên trang không nạp bootstrap.bundle (vd: pump_info.html).
//
// Cách dùng (đặt cuối <body>, sau css/shared.css đã được link):
//   <script src="js/bottomnav.js" data-root="./"></script>          (trang ở gốc)
//   <script src="../js/bottomnav.js" data-root="../"></script>      (trang con)
// Tuỳ chọn: data-active="plan|log|scan|menu|personal" để tô sáng tab hiện tại.
//
// index.html và nhatky/index.html có nav riêng gắn logic trong trang (đổi tab
// SPA, dropdown Bootstrap, phân quyền chi tiết) — KHÔNG dùng file này ở đó.
(function () {
  'use strict';

  const script = document.currentScript;
  const root = (script && script.dataset.root) || './';
  const active = (script && script.dataset.active) || '';

  function isAdmin() {
    try {
      const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      if (!raw) return false;
      const role = (JSON.parse(raw).role || '').toLowerCase();
      return role === 'admin' || role === 'manager' || role === 'quản lý';
    } catch (e) { return false; }
  }

  const TABS = [
    { key: 'plan',     icon: 'bi-clipboard-check', label: 'Kế hoạch', href: root + 'nhatky/index.html#tasklist' },
    { key: 'log',      icon: 'bi-journal-text',    label: 'Nhật ký',  href: root + 'nhatky/index.html#loghistory' },
    { key: 'scan',     icon: 'bi-qr-code-scan',    label: 'Quét QR',  href: root + 'index.html' },
    { key: 'menu',     icon: 'bi-list',            label: 'Menu',     href: null },
    { key: 'personal', icon: 'bi-person',          label: 'Cá nhân',  href: root + 'nhatky/index.html#personal' }
  ];

  const MENU_DAILY = [
    { icon: 'bi-water',            label: 'Thông tin & Check vận hành bơm', href: root + 'pump_info.html' },
    { icon: 'bi-flag-fill',        label: 'Checklist Cơ Điện Sân Golf',     href: root + 'sangolf/' },
    { icon: 'bi-calendar-range',   label: 'Phân ca trực',                   href: root + 'phanca/' },
    { icon: 'bi-journal-check',    label: 'Nhật ký công việc',              href: root + 'nhatky/' }
  ];
  const MENU_ADMIN = [
    { icon: 'bi-alarm',    label: 'Cài đặt đồng hồ bơm',   href: root + 'hengio/' },
    { icon: 'bi-qr-code',  label: 'In mã QR máy bơm',      href: root + 'print_pumps.html' },
    { icon: 'bi-bar-chart-fill', label: 'Báo cáo công việc tổ', href: root + 'nhatky/index.html#stats' },
    { icon: 'bi-person-workspace', label: 'Câu hỏi phỏng vấn', href: root + 'phongvan/' },
    { icon: 'bi-cpu-fill', label: 'Giám sát Server Uptime', href: root + 'status.html' },
    { icon: 'bi-history',  label: 'Nhật ký Thay đổi',       href: root + 'changelog.html' },
    { icon: 'bi-tools',    label: 'Chẩn đoán EBYTE NA111',  href: root + 'na111.html' }
  ];

  function menuLinks(items) {
    return items.map(m => `<a href="${m.href}"><i class="bi ${m.icon}"></i>${m.label}</a>`).join('');
  }

  // "Cài đặt ứng dụng" gọi prompt cài PWA (js/pwa.js) thay vì điều hướng —
  // chỉ hiện khi pwa.js đã nạp trên trang. iOS Safari không bắn được sự kiện
  // cài đặt nên luôn hướng dẫn thao tác tay khi trình duyệt không hỗ trợ prompt.
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

  // Hiện số phiên bản cuối menu — trước đây chỉ index.html biết đang chạy bản
  // nào, các trang vệ tinh không có cách nào tra cứu khi cần hỗ trợ từ xa.
  function versionFooter() {
    const version = (typeof CONFIG !== 'undefined' && CONFIG.version) || '';
    if (!version) return '';
    return `<div class="px-3 py-1 text-center text-muted" style="font-size:.72rem;">Phiên bản ${version}</div>`;
  }

  function build() {
    document.body.classList.add('has-bds-bottom-nav');

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
      versionFooter();

    const nav = document.createElement('nav');
    nav.className = 'bds-bottom-nav';
    nav.setAttribute('aria-label', 'Điều hướng chính');
    nav.innerHTML = TABS.map(t => {
      const cls = 'bds-bottom-nav-item' + (t.key === active ? ' active' : '');
      if (t.key === 'menu') {
        return `<button type="button" class="${cls}" id="bdsNavMenuBtn"><i class="bi ${t.icon}"></i><span>${t.label}</span></button>`;
      }
      return `<a class="${cls}" href="${t.href}"><i class="bi ${t.icon}"></i><span>${t.label}</span></a>`;
    }).join('');

    document.body.appendChild(menu);
    document.body.appendChild(nav);

    const btn = document.getElementById('bdsNavMenuBtn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (menu.classList.contains('open') && !menu.contains(e.target)) menu.classList.remove('open');
    });
    document.getElementById('bdsInstallAppBtn').addEventListener('click', handleInstallClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
