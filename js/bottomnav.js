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
    { icon: 'bi-flag-fill',        label: 'Checklist Cơ Điện Sân Golf',     href: root + 'sangolf/index.html' },
    { icon: 'bi-journal-plus',    label: 'Tạo việc phát sinh', action: 'quick-task' },
    { icon: 'bi-plus-square',     label: 'Thêm kế hoạch', action: 'add-plan' },
    { icon: 'bi-calendar-week',   label: 'Lịch tuần', href: root + 'nhatky/index.html#week' },
    { icon: 'bi-arrow-clockwise', label: 'Nạp lại dữ liệu', action: 'reload-plans' },
    { icon: 'bi-person-badge',     label: 'Trang cá nhân & Cài đặt',       href: root + 'nhatky/index.html#personal' },
    { icon: 'bi-bar-chart-line-fill', label: 'Báo cáo công việc',          href: root + 'nhatky/index.html#stats' },
    { icon: 'bi-water',            label: 'Thông tin & Check vận hành bơm', href: root + 'pump_info.html' },
    { icon: 'bi-file-earmark-spreadsheet-fill', label: 'Hướng dẫn báo cáo nước (18h)', action: 'water-report-guide' },
    { icon: 'bi-alarm',            label: 'Xem cài đặt đồng hồ bơm',      href: root + 'hengio/index.html' },
    { icon: 'bi-calendar-range',   label: 'Phân ca trực Ban Điện',          href: root + 'phanca/' }
  ];
  const MENU_ADMIN = [
    { icon: 'bi-qr-code',          label: 'In mã QR máy bơm',         href: root + 'print_pumps.html' },
    { icon: 'bi-person-workspace', label: 'Câu hỏi phỏng vấn',        href: root + 'phongvan/' },
    { icon: 'bi-cpu-fill',         label: 'Giám sát Server Uptime',    href: root + 'status.html' },
    { icon: 'bi-history',          label: 'Nhật ký Thay đổi',          href: root + 'changelog.html' },
    { icon: 'bi-diagram-3',        label: 'Sơ đồ Hệ thống',            href: root + 'architecture.html' },
    { icon: 'bi-tools',            label: 'Chẩn đoán EBYTE NA111',     href: root + 'na111.html' }
  ];

  function menuLinks(items) {
    return items.map(m => m.action
      ? `<button type="button" class="bds-nav-menu-link" data-bds-action="${m.action}"><i class="bi ${m.icon}"></i>${m.label}</button>`
      : `<a href="${m.href}"><i class="bi ${m.icon}"></i>${m.label}</a>`
    ).join('');
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

  function injectStyles() {
    if (document.getElementById('bds-water-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'bds-water-modal-styles';
    style.textContent = `
      .bds-water-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      .bds-water-modal-backdrop.open {
        opacity: 1;
        pointer-events: auto;
      }
      .bds-water-modal {
        background: var(--bds-surface);
        color: var(--bds-on-surface);
        width: min(440px, 92%);
        max-height: 85vh;
        border-radius: 20px;
        border: 1px solid var(--bds-line);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        transform: translateY(20px);
        transition: transform 0.2s ease;
        overflow: hidden;
      }
      .bds-water-modal-backdrop.open .bds-water-modal {
        transform: translateY(0);
      }
      .bds-water-modal-header {
        padding: 16px;
        border-bottom: 1px solid var(--bds-line);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .bds-water-modal-title {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--bds-primary);
      }
      .bds-water-modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--bds-muted);
        line-height: 1;
        padding: 4px;
      }
      .bds-water-modal-close:hover {
        color: var(--bds-on-surface);
      }
      .bds-water-modal-body {
        padding: 16px;
        overflow-y: auto;
        font-size: 0.9rem;
        line-height: 1.5;
      }
      .bds-water-modal-body h6 {
        font-weight: 700;
        margin-top: 12px;
        margin-bottom: 6px;
        color: var(--bds-on-surface);
      }
      .bds-water-step {
        display: flex;
        gap: 10px;
        margin-bottom: 12px;
      }
      .bds-water-step-num {
        background: var(--bds-primary-light);
        color: var(--bds-primary);
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 0.8rem;
        flex-shrink: 0;
        margin-top: 2px;
      }
      .bds-water-step-content {
        flex: 1;
      }
      .bds-water-cred-box {
        background: var(--bds-surface-low);
        border: 1px dashed var(--bds-line);
        border-radius: 8px;
        padding: 8px 12px;
        margin: 8px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: var(--bds-font-mono);
        font-size: 0.8rem;
      }
      .bds-water-copy-section {
        background: var(--bds-surface-low);
        border-radius: 12px;
        padding: 12px;
        margin-top: 16px;
        border: 1px solid var(--bds-line);
      }
      .bds-water-template-text {
        width: 100%;
        height: 140px;
        font-family: var(--bds-font-mono);
        font-size: 0.8rem;
        background: var(--bds-surface);
        border: 1px solid var(--bds-line);
        border-radius: 8px;
        padding: 8px;
        resize: none;
        margin-bottom: 8px;
        color: var(--bds-on-surface);
      }
      .bds-water-btn-group {
        display: flex;
        gap: 8px;
      }
      .bds-water-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.15s ease, background-color 0.15s ease;
        border: none;
      }
      .bds-water-btn:active {
        opacity: 0.8;
      }
      .bds-water-btn-primary {
        background: var(--bds-primary);
        color: var(--bds-on-primary);
      }
      .bds-water-btn-secondary {
        background: var(--bds-surface-high);
        color: var(--bds-on-surface);
      }
    `;
    document.head.appendChild(style);
  }

  function getTodayString() {
    const d = new Date();
    const date = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${date}/${month}/${year}`;
  }

  function getTemplateText() {
    const today = getTodayString();
    return `Báo cáo vận hành nước ngày ${today}:
1. Tổng giờ chạy bơm (18h hôm qua - 18h hôm nay): ... giờ
2. Số liệu chốt lúc 18h00 từ hiện trường:
- Đồng hồ tổng đầu vào: ... m³
- Đồng hồ phân phối: ... m³
- Mực nước bể ngầm: ... m
- Mực nước bể mái: ... m
- Áp lực đường ống: ... bar
3. Tình trạng vận hành: Bình thường.`;
  }

  function showWaterReportModal() {
    injectStyles();
    
    let backdrop = document.getElementById('bdsWaterReportModalBackdrop');
    if (backdrop) {
      backdrop.parentNode.removeChild(backdrop);
    }
    
    backdrop = document.createElement('div');
    backdrop.id = 'bdsWaterReportModalBackdrop';
    backdrop.className = 'bds-water-modal-backdrop';
    
    backdrop.innerHTML = `
      <div class="bds-water-modal">
        <div class="bds-water-modal-header">
          <div class="bds-water-modal-title">
            <i class="bi bi-file-earmark-spreadsheet-fill"></i>
            <span>Báo cáo nước hàng ngày</span>
          </div>
          <button type="button" class="bds-water-modal-close" id="bdsWaterCloseBtn">&times;</button>
        </div>
        <div class="bds-water-modal-body">
          <div class="bds-water-step">
            <div class="bds-water-step-num">1</div>
            <div class="bds-water-step-content">
              <strong>Giờ chạy máy bơm:</strong> Đăng nhập KySon để cộng giờ chạy bơm từ 18h hôm qua đến 18h hôm nay.
              <div class="bds-water-cred-box">
                <span>TK: <strong>vanhanh</strong> / MK: <strong>vanhanh</strong></span>
                <button type="button" class="btn btn-sm btn-link p-0 text-decoration-none" id="bdsWaterCopyCredsBtn" style="font-size:0.75rem;"><i class="bi bi-clipboard"></i> Copy</button>
              </div>
              <div class="d-flex gap-2">
                <a href="https://kyson.tdh.io.vn/" target="_blank" class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-1" style="font-size:0.75rem; border-radius:6px; text-decoration:none;">
                  <i class="bi bi-box-arrow-up-right"></i> Mở Web KySon
                </a>
              </div>
            </div>
          </div>
          <div class="bds-water-step">
            <div class="bds-water-step-num">2</div>
            <div class="bds-water-step-content">
              <strong>Số liệu hiện trường:</strong> Lấy chỉ số từ nhân viên vận hành tại thời điểm chốt 18h00.
            </div>
          </div>
          <div class="bds-water-step">
            <div class="bds-water-step-num">3</div>
            <div class="bds-water-step-content">
              <strong>Cập nhật Excel:</strong> Điền các chỉ số vào file báo cáo và lưu lại.
            </div>
          </div>
          <div class="bds-water-step">
            <div class="bds-water-step-num">4</div>
            <div class="bds-water-step-content">
              <strong>Gửi Email:</strong> Gửi file báo cáo đính kèm qua email của Lãnh đạo.
            </div>
          </div>
          
          <div class="bds-water-copy-section">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong style="font-size:0.85rem;"><i class="bi bi-chat-left-dots-fill text-primary me-1"></i> Mẫu tin nhắn tóm tắt:</strong>
            </div>
            <textarea class="bds-water-template-text" id="bdsWaterTemplateText" readonly>${getTemplateText()}</textarea>
            <div class="bds-water-btn-group">
              <button type="button" class="bds-water-btn bds-water-btn-primary" id="bdsWaterCopyMsgBtn">
                <i class="bi bi-clipboard-check"></i> Copy tin nhắn
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(backdrop);
    
    const closeBtn = backdrop.querySelector('#bdsWaterCloseBtn');
    const copyCredsBtn = backdrop.querySelector('#bdsWaterCopyCredsBtn');
    const copyMsgBtn = backdrop.querySelector('#bdsWaterCopyMsgBtn');
    const textarea = backdrop.querySelector('#bdsWaterTemplateText');
    
    const closeModal = () => {
      backdrop.classList.remove('open');
      setTimeout(() => {
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      }, 200);
    };
    
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
    
    copyCredsBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('vanhanh / vanhanh').then(() => {
        const origText = copyCredsBtn.innerHTML;
        copyCredsBtn.innerHTML = '<i class="bi bi-check-lg"></i> Đã Copy';
        setTimeout(() => {
          copyCredsBtn.innerHTML = origText;
        }, 1500);
      }).catch(err => {
        alert('Không thể copy: ' + err);
      });
    });
    
    copyMsgBtn.addEventListener('click', () => {
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(textarea.value).then(() => {
        const origText = copyMsgBtn.innerHTML;
        copyMsgBtn.innerHTML = '<i class="bi bi-check-lg"></i> Đã copy tin nhắn!';
        setTimeout(() => {
          copyMsgBtn.innerHTML = origText;
        }, 2000);
      }).catch(err => {
        alert('Không thể copy: ' + err);
      });
    });
    
    setTimeout(() => {
      backdrop.classList.add('open');
    }, 10);
  }

  function build() {
    const menu = document.createElement('div');
    menu.className = 'bds-nav-menu';
    menu.id = 'bdsNavMenu';
    const dailyItems = spaMode ? MENU_DAILY : MENU_DAILY.filter(item => !item.action || item.action === 'water-report-guide');
    menu.innerHTML =
      `<div class="bds-nav-menu-header"><i class="bi bi-grid-fill me-1"></i> Menu tiện ích</div>` +
      menuLinks(dailyItems) +
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
    
    // Đăng ký bộ lắng nghe click cho menu dùng chung cho cả SPA và non-SPA
    menu.addEventListener('click', event => {
      const action = event.target.closest('[data-bds-action]');
      if (action) {
        event.preventDefault();
        menu.classList.remove('open');
        document.body.classList.remove('bds-menu-open');
        if (action.dataset.bdsAction === 'water-report-guide') {
          showWaterReportModal();
          return;
        }
        if (spaMode) {
          window.dispatchEvent(new CustomEvent('bds:action', { detail: { action: action.dataset.bdsAction } }));
        }
        return;
      }
      const link = event.target.closest('a[href*="nhatky/index.html#"]');
      if (!link) return;
      const screen = link.getAttribute('href').split('#')[1];
      if (!screen) return;
      if (spaMode) {
        event.preventDefault();
        menu.classList.remove('open');
        window.dispatchEvent(new CustomEvent('bds:navigate', { detail: { screen } }));
      }
    });

    if (spaMode) {
      nav.addEventListener('click', event => {
        const item = event.target.closest('[data-nav-screen]');
        if (item) window.dispatchEvent(new CustomEvent('bds:navigate', { detail: { screen: item.dataset.navScreen } }));
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
