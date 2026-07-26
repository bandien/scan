const fs = require('fs');
let html = fs.readFileSync('nhatky/index.html', 'utf8');

// 1. Helper function for saving to localStorage
const cacheHelpers = `
function saveToCache() {
  localStorage.setItem('nk_plans', JSON.stringify(allPlans));
  localStorage.setItem('nk_logs', JSON.stringify(allLogs));
}

function loadFromCache() {
  try {
    const plansStr = localStorage.getItem('nk_plans');
    const logsStr = localStorage.getItem('nk_logs');
    if (plansStr) allPlans = JSON.parse(plansStr);
    if (logsStr) allLogs = JSON.parse(logsStr);
  } catch (e) {
    console.warn('Lỗi đọc cache:', e);
  }
}

function showSyncToast() {
  const el = document.getElementById('nk-sync-toast');
  if (el) el.style.display = 'block';
}

function hideSyncToast() {
  const el = document.getElementById('nk-sync-toast');
  if (el) el.style.display = 'none';
}
`;

if (!html.includes('function saveToCache(')) {
  html = html.replace('let allLogs = [];', 'let allLogs = [];\n' + cacheHelpers);
}

// 2. Inject sync toast UI
const syncToastHtml = `
<div id="nk-sync-toast" style="display: none; position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: var(--warning-light, #fff8e1); color: var(--warning-color, #ff9800); padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid var(--warning-color, #ff9800);">
  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle; border-width: 0.15em;"></span>
  Đang đồng bộ...
</div>
`;
if (!html.includes('id="nk-sync-toast"')) {
  html = html.replace('</body>', syncToastHtml + '\n</body>');
}

// 3. Update loadPlans()
const oldLoadPlans = `async function loadPlans() {
  const board = document.getElementById('mainBoard');
  board.innerHTML = \`<div class="nk-spinner"><div class="nk-spinner__ring"></div> Đang tải công việc...</div>\`;

  try {
    const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
    const username = user ? (user.username || user.name || '') : '';
    const res = await window.bdsApiFetch('getPlans', { user: username });

    if (res && res.status === 'success' && res.plans) {
      allPlans = res.plans;
      allLogs = res.logs || [];
      allPlans.sort((a, b) => {
        const da = new Date((planField(a,'Date','date') || '') + ' ' + (planField(a,'Time','time') || '00:00')).getTime();
        const db = new Date((planField(b,'Date','date') || '') + ' ' + (planField(b,'Time','time') || '00:00')).getTime();
        return isNaN(da) || isNaN(db) ? 0 : db - da;
      });
    } else {
      allPlans = [];
    }
    
    renderMainBoard();
  } catch (err) {
    board.innerHTML = \`<div class="nk-empty"><div class="nk-empty__icon">⚠️</div>Lỗi kết nối/dữ liệu: \${escapeHtml(err.message)}<br><small>Thử lại sau vài giây</small></div>\`;
  }
}`;

const newLoadPlans = `async function loadPlans() {
  const board = document.getElementById('mainBoard');
  
  // 1. Load from cache immediately
  loadFromCache();
  if (allPlans.length > 0) {
    renderMainBoard();
    showSyncToast();
  } else {
    board.innerHTML = \`<div class="nk-spinner"><div class="nk-spinner__ring"></div> Đang tải công việc...</div>\`;
  }

  // 2. Fetch fresh data in background
  try {
    const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
    const username = user ? (user.username || user.name || '') : '';
    const res = await window.bdsApiFetch('getPlans', { user: username });

    if (res && res.status === 'success' && res.plans) {
      allPlans = res.plans;
      allLogs = res.logs || [];
      allPlans.sort((a, b) => {
        const da = new Date((planField(a,'Date','date') || '') + ' ' + (planField(a,'Time','time') || '00:00')).getTime();
        const db = new Date((planField(b,'Date','date') || '') + ' ' + (planField(b,'Time','time') || '00:00')).getTime();
        return isNaN(da) || isNaN(db) ? 0 : db - da;
      });
      saveToCache(); // Cache it
    } else if (!allPlans.length) {
      allPlans = [];
    }
    
    hideSyncToast();
    renderMainBoard();
  } catch (err) {
    hideSyncToast();
    if (allPlans.length === 0) {
      board.innerHTML = \`<div class="nk-empty"><div class="nk-empty__icon">⚠️</div>Lỗi kết nối/dữ liệu: \${escapeHtml(err.message)}<br><small>Dùng bản lưu nháp</small></div>\`;
    } else {
      showToast('Không thể đồng bộ dữ liệu mới: ' + err.message, 'danger');
    }
  }
}`;

html = html.replace(oldLoadPlans, newLoadPlans);

fs.writeFileSync('nhatky/index.html', html);
