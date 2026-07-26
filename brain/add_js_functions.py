import codecs, re

with codecs.open('nhatky/index.html', 'r', 'utf-8') as f:
    content = f.read()

# ── CHANGE 1: Replace loadStaffIntoSelect (remove hardcode, use staffDirectory) ──
old_load = '''async function loadStaffIntoSelect() {
  const sel = document.getElementById('fBehalfPerson');
  if (sel.options.length > 1) return; // Already loaded

  try {
    const res = await window.bdsApiFetch('getStaff', {});
    const list = res.staff || res.users || [];
    list.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.name || s.username;
      opt.textContent = s.name || s.username;
      sel.appendChild(opt);
    });
  } catch {
    // Fallback: dùng danh sách cứng nếu không tải được
    ['Nguyễn Quốc Thắng', 'Đinh Văn Hậu', 'Hoàng Việt Hoàng', 'Nguyễn Đức Phong'].forEach(n => {
      const opt = document.createElement('option');
      opt.value = n; opt.textContent = n;
      sel.appendChild(opt);
    });
  }
}'''

new_load = '''// ── A2: Gate quyền ghi hộ ────────────────────────────────────────────────────
function canWriteOnBehalf() {
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  if (!user) return false;
  const role = (user.role || user.position || '').toLowerCase();
  return ['manager','admin','quản lý','tổ trưởng','to truong','truong phong'].some(r => role.includes(r));
}

function populateAssigneeDatalist() {
  const dl = document.getElementById('staffDatalist');
  if (!dl) return;
  if (staffDirectory.length === 0) return;
  dl.innerHTML = staffDirectory.map(s => {
    const n = s.fullName || s.name || '';
    const short = getShortName(n);
    const dept = s.dept || s.team || '';
    return `<option value="${escapeAttr(n)}">${short}${dept ? ' · ' + dept : ''}</option>`;
  }).join('');
}

async function loadStaffIntoSelect() {
  const sel = document.getElementById('fBehalfPerson');
  if (!sel) return;
  if (sel.options.length > 1) return; // Already loaded

  // Dùng staffDirectory đã có từ loadStaff() — không hardcode
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const myTeam = user ? (user.team || user.teamGroup || '') : '';

  let list = [...staffDirectory];
  // Sắp xếp: cùng tổ lên trước
  if (myTeam) {
    list.sort((a, b) => {
      const aMatch = (a.dept || a.team || '').toLowerCase().includes(myTeam.toLowerCase());
      const bMatch = (b.dept || b.team || '').toLowerCase().includes(myTeam.toLowerCase());
      return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
    });
  }

  if (list.length === 0) {
    // Nếu staffDirectory trống, thử load lại
    try {
      await loadStaff();
      list = [...staffDirectory];
    } catch {}
  }

  sel.innerHTML = '<option value="">-- Chọn người --</option>' +
    list.map(s => {
      const n = s.fullName || s.name || '';
      const short = getShortName(n);
      const dept = s.dept || s.team || '';
      return `<option value="${escapeAttr(n)}">${short}${dept ? ' · ' + dept : ''}</option>`;
    }).join('');
}'''

if old_load in content:
    content = content.replace(old_load, new_load)
    print("OK: replaced loadStaffIntoSelect with canWriteOnBehalf + populateAssigneeDatalist + new loadStaffIntoSelect")
else:
    print("WARN: old_load not found exactly, trying line-by-line...")
    # Try without exact whitespace
    idx = content.find('async function loadStaffIntoSelect()')
    if idx != -1:
        end_idx = content.find('\n}\n', idx) + 3
        content = content[:idx] + new_load + content[end_idx:]
        print(f"OK: replaced at idx {idx}")
    else:
        print("ERROR: not found!")


# ── CHANGE 2: Update openNewTaskModal to show/hide behalfSection ──
old_open = '''function openNewTaskModal() {
  document.getElementById('modalNewTask').classList.add('is-open');
  document.getElementById('fTask').focus();
  // Set ngày mặc định = hôm nay
  const tStr = todayStr();
  const fDate = document.getElementById('fDateEnd');
  if (fDate && !fDate.value) fDate.value = tStr;
}'''

new_open = '''function openNewTaskModal() {
  document.getElementById('modalNewTask').classList.add('is-open');
  document.getElementById('fTask').focus();
  // Set ngày mặc định = hôm nay
  const tStr = todayStr();
  const fDate = document.getElementById('fDateEnd');
  if (fDate && !fDate.value) fDate.value = tStr;
  // A2: Chỉ hiện section ghi hộ nếu user là Manager/Admin
  const behalfSec = document.getElementById('behalfSection');
  if (behalfSec) behalfSec.style.display = canWriteOnBehalf() ? '' : 'none';
}'''

if old_open in content:
    content = content.replace(old_open, new_open)
    print("OK: updated openNewTaskModal with gate check")
else:
    print("WARN: old_open not found")


# ── CHANGE 3: Add renderReportScreen + renderProfileScreen + doLogout ──
# Inject after loadStaffIntoSelect block, before "// Save new task"
inject_marker = '// Save new task'

new_js = '''// ── A5: Báo cáo & Profile ─────────────────────────────────────────────────────
function renderReportScreen() {
  const today = todayStr();
  const body = document.getElementById('reportBody');
  if (!body) return;

  // Tính stats
  const todayPlans = allPlans.filter(p => {
    const d = p.Date || p.date || '';
    return d === today;
  });
  const total   = allPlans.length; // tổng toàn bộ
  const doing   = allPlans.filter(p => (p.Status||p.status||'') === 'Đang làm').length;
  const help    = allPlans.filter(p => ['Cần hỗ trợ','Khẩn cấp'].includes(p.Status||p.status||'')).length;
  const done    = allPlans.filter(p => ['Hoàn thành','Nghiệm thu · Chốt sổ','Hoàn thành · Chốt sổ'].includes(p.Status||p.status||'')).length;

  // Top assignees
  const assigneeCount = {};
  allPlans.forEach(p => {
    const a = p.Assignee || p.assignee || 'Không rõ';
    const short = getShortName(a) || a;
    assigneeCount[short] = (assigneeCount[short] || 0) + 1;
  });
  const topAssignees = Object.entries(assigneeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  body.innerHTML = `
    <div style="padding: 16px;">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--ink-muted);margin-bottom:12px">Tổng quan (toàn bộ)</div>
      <div class="nk-stat-grid">
        <div class="nk-stat-card">
          <div class="nk-stat-card__num" style="color:var(--dot-doing,#f59e0b)">${doing}</div>
          <div class="nk-stat-card__lbl">Đang làm</div>
        </div>
        <div class="nk-stat-card">
          <div class="nk-stat-card__num" style="color:var(--dot-help,#ef4444)">${help}</div>
          <div class="nk-stat-card__lbl">Cần hỗ trợ</div>
        </div>
        <div class="nk-stat-card">
          <div class="nk-stat-card__num" style="color:var(--dot-done,#28a745)">${done}</div>
          <div class="nk-stat-card__lbl">Hoàn thành</div>
        </div>
        <div class="nk-stat-card">
          <div class="nk-stat-card__num" style="color:var(--brand)">${total}</div>
          <div class="nk-stat-card__lbl">Tổng việc</div>
        </div>
      </div>

      ${topAssignees.length > 0 ? `
      <div style="margin-top:20px">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--ink-muted);margin-bottom:10px">Top kỹ thuật viên</div>
        <div class="nk-report-table">
          ${topAssignees.map(([name, count], i) => `
          <div class="nk-report-row">
            <div class="nk-report-row__rank">${i + 1}</div>
            <div class="nk-report-row__name">${escapeHtml(name)}</div>
            <div class="nk-report-row__count">${count} việc</div>
          </div>`).join('')}
        </div>
      </div>` : ''}
    </div>`;

  // Sync theme button
  const themeBtn = document.getElementById('btnThemeReport');
  if (themeBtn) {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    themeBtn.textContent = cur === 'dark' ? '☀️' : '🌙';
    themeBtn.onclick = toggleTheme;
  }
  // Sub text
  const sub = document.getElementById('reportSub');
  if (sub) sub.textContent = today;
}

function renderProfileScreen() {
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const name = user ? (user.name || user.username || 'Ẩn danh') : 'Ẩn danh';
  const role = user ? (user.role || user.position || '') : '';
  const team = user ? (user.team || user.teamGroup || '') : '';
  const uname = user ? (user.username || '') : '';
  const initial = name.charAt(0).toUpperCase();

  const body = document.getElementById('profileBody');
  if (!body) return;
  body.innerHTML = `
    <div class="nk-profile">
      <div class="nk-profile__avatar">${escapeHtml(initial)}</div>
      <div class="nk-profile__name" id="profileName">${escapeHtml(name)}</div>
      <div class="nk-profile__meta">${escapeHtml(role)}${team ? ' · ' + escapeHtml(team) : ''}${uname ? ' · @' + escapeHtml(uname) : ''}</div>

      <div class="nk-profile__section-label">Giao diện</div>
      <div class="nk-profile__actions">
        <button class="nk-profile__action" onclick="toggleTheme()">
          🎨 Đổi giao diện <span id="profileThemeName">${document.documentElement.getAttribute('data-theme') === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
      </div>

      <div class="nk-profile__section-label" style="margin-top:16px">Tài khoản</div>
      <div class="nk-profile__actions">
        <button class="nk-profile__action nk-profile__action--danger" onclick="doLogout()">
          🚪 Đăng xuất
        </button>
      </div>

      <div style="margin-top:24px;font-size:10px;color:var(--ink-muted);text-align:center">
        Nhật ký Công việc · Ban Điện · v2.14
      </div>
    </div>`;

  // Sync theme button
  const themeBtn = document.getElementById('btnThemeProfile');
  if (themeBtn) {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    themeBtn.textContent = cur === 'dark' ? '☀️' : '🌙';
    themeBtn.onclick = toggleTheme;
  }
}

function doLogout() {
  if (!confirm('Đăng xuất khỏi tài khoản này?')) return;
  localStorage.removeItem('currentUser');
  localStorage.removeItem('nk_plans');
  localStorage.removeItem('nk_logs');
  localStorage.removeItem('staffDirectory');
  showToast('Đã đăng xuất', 'success');
  setTimeout(() => window.location.reload(), 900);
}

function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('nk_theme', next);
  const icon = next === 'dark' ? '☀️' : '🌙';
  ['btnTheme','btnThemeReport','btnThemeProfile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = icon;
  });
  const ptn = document.getElementById('profileThemeName');
  if (ptn) ptn.textContent = next === 'dark' ? 'Dark' : 'Light';
}

// Save new task'''

if inject_marker in content:
    content = content.replace(inject_marker, new_js)
    print("OK: injected renderReportScreen, renderProfileScreen, doLogout, toggleTheme")
else:
    print("ERROR: inject_marker not found!")

# ── CHANGE 4: Update btnTheme to use toggleTheme() ──
old_theme_handler = '''document.getElementById('btnTheme').addEventListener('click', () => {
  const cur  = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('nk_theme', next);
  document.getElementById('btnTheme').textContent = next === 'dark' ? '☀️' : '🌙';
});'''

new_theme_handler = "document.getElementById('btnTheme').addEventListener('click', toggleTheme);"

if old_theme_handler in content:
    content = content.replace(old_theme_handler, new_theme_handler)
    print("OK: updated btnTheme to use toggleTheme()")
else:
    print("WARN: old_theme_handler not found")

# ── CHANGE 5: Update navProfile listener to use navigateToProfile() ──
old_profile_listener = '''// Profile nav item
document.getElementById('navProfile').addEventListener('click', e => {
  e.preventDefault();
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  if (!user) { showToast('Chưa đăng nhập', 'danger'); return; }
  const name = user.name || user.username || 'Ẩn danh';
  const role = user.role || user.position || '';
  showToast(name + (role ? ' · ' + role : ''));
});'''

new_profile_listener = '''// Profile nav item
document.getElementById('navProfile').addEventListener('click', e => {
  e.preventDefault();
  navigateToProfile();
});'''

if old_profile_listener in content:
    content = content.replace(old_profile_listener, new_profile_listener)
    print("OK: updated navProfile to navigateToProfile()")
else:
    print("WARN: old_profile_listener not found")

# ── CHANGE 6: Call populateAssigneeDatalist after loadStaff in initApp ──
old_init = '''  // Load plans
  await loadPlans();
  loadStaff(); // Tải danh bạ nền (không block UI)'''

new_init = '''  // Load plans
  await loadPlans();
  loadStaff().then(populateAssigneeDatalist); // Tải danh bạ nền + fill datalist'''

if old_init in content:
    content = content.replace(old_init, new_init)
    print("OK: updated initApp to call populateAssigneeDatalist after loadStaff")
else:
    print("WARN: old_init not found")

with codecs.open('nhatky/index.html', 'w', 'utf-8') as f:
    f.write(content)

print("\nAll changes applied! File saved.")

# Verify key functions present
checks = ['canWriteOnBehalf', 'populateAssigneeDatalist', 'renderReportScreen', 'renderProfileScreen', 'doLogout', 'toggleTheme', 'navigateToReport', 'navigateToProfile']
with codecs.open('nhatky/index.html', 'r', 'utf-8') as f:
    v = f.read()
for fn in checks:
    print(f"  {'OK' if fn in v else 'MISSING'}: {fn}")
