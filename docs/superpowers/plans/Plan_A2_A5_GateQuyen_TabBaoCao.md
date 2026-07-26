# Plan A2 + A5 — Gate Quyền Ghi hộ & Tab Báo cáo/Cá nhân

**Ngày lập**: 2026-07-26  
**Phụ thuộc**: A1 (staffDirectory đã có)  
**File chính**: `nhatky/index.html`, `css/app.css`  
**Không sửa**: bất kỳ file `.gs` nào

---

## Task 1 — Gate quyền Ghi hộ [~5 phút]

**File**: `nhatky/index.html`

### RED — Test thất bại trước:
```js
// Test: User role='user' → không thấy field ghi hộ
expect(document.querySelector('.nk-field--behalf').style.display).toBe('none');
// Test: User role='Manager' → thấy field ghi hộ  
expect(document.querySelector('.nk-field--behalf').style.display).not.toBe('none');
```

### GREEN — Code tối thiểu:
```js
function canWriteOnBehalf() {
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  if (!user) return false;
  const role = (user.role || user.position || '').toLowerCase();
  return ['manager','admin','quản lý','tổ trưởng'].some(r => role.includes(r));
}
```

HTML: Bọc `<div class="nk-field nk-field--behalf">` cho cả 2 field (checkbox + select)

Trong `openNewTaskModal()`:
```js
document.querySelector('.nk-field--behalf').style.display = canWriteOnBehalf() ? '' : 'none';
```

**Verification**: `await expect(page.locator('.nk-field--behalf')).not.toBeVisible()`

---

## Task 2 — Datalist Assignee từ staffDirectory [~5 phút]

**File**: `nhatky/index.html`

### RED:
```js
// Test: datalist xuất hiện sau loadStaff
expect(document.querySelectorAll('#staffDatalist option').length).toBeGreaterThan(0);
```

### GREEN:
```html
<!-- Thay thế input fAssignee -->
<input type="text" id="fAssignee" placeholder="Tên kỹ thuật viên" list="staffDatalist" autocomplete="off">
<datalist id="staffDatalist"></datalist>
```

```js
function populateAssigneeDatalist() {
  const dl = document.getElementById('staffDatalist');
  if (!dl || staffDirectory.length === 0) return;
  dl.innerHTML = staffDirectory
    .map(s => `<option value="${escapeAttr(s.fullName || s.name || '')}">${getShortName(s.fullName||s.name||'')} · ${s.dept||''}</option>`)
    .join('');
}
```

Gọi `populateAssigneeDatalist()` sau `loadStaff()` trong `initApp()`.

**Verification**: Playwright type vào fAssignee → datalist suggestions visible

---

## Task 3 — Fix loadStaffIntoSelect dùng staffDirectory [~5 phút]

**File**: `nhatky/index.html`

### RED:
```js
// Test: select fBehalfPerson không chứa "Nguyễn Quốc Thắng" hardcode
// mà thay vào đó là tên từ staffDirectory
```

### GREEN:
```js
async function loadStaffIntoSelect() {
  const sel = document.getElementById('fBehalfPerson');
  if (!sel || sel.options.length > 1) return;

  // Dùng staffDirectory đã có sẵn từ loadStaff() (A1)
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const myTeam = user ? (user.team || user.teamGroup || '') : '';
  
  let list = [...staffDirectory];
  // Sắp xếp: cùng tổ lên trên
  if (myTeam) {
    list.sort((a, b) => {
      const aMatch = (a.dept || '').includes(myTeam);
      const bMatch = (b.dept || '').includes(myTeam);
      return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
    });
  }

  sel.innerHTML = '<option value="">-- Chọn người --</option>' +
    list.map(s => {
      const n = s.fullName || s.name || '';
      const short = getShortName(n);
      return `<option value="${escapeAttr(n)}">${short} · ${s.dept || ''}</option>`;
    }).join('');
}
```

**Xóa hoàn toàn** fallback hardcode 4 tên.

**Verification**: `document.querySelectorAll('#fBehalfPerson option').length > 1`

---

## Task 4 — Screen Báo cáo [~10 phút]

**File**: `nhatky/index.html`, `css/app.css`

### RED:
```js
// Test: bấm navReport → screenReport visible, screenMain hidden
expect(page.locator('#screenReport')).toBeVisible();
expect(page.locator('#screenMain')).not.toBeVisible();
```

### GREEN — HTML:
```html
<!-- Sau screenDetail -->
<div class="nk-app" id="screenReport" style="display:none">
  <header class="nk-appbar">
    <div class="nk-appbar__icon">📊</div>
    <div class="nk-appbar__title">
      <div class="nk-appbar__name">Báo cáo</div>
    </div>
    <button class="nk-appbar__theme" id="btnThemeReport">🌙</button>
  </header>
  <main class="nk-content" id="reportBody"></main>
  <nav class="nk-bottomnav"><!-- copy bottom-nav --></nav>
</div>
```

### GREEN — JS: `renderReportScreen()`
```js
function renderReportScreen() {
  const today = todayStr();
  const todayPlans = allPlans.filter(p => (p.Date || p.date || '') === today);
  const stats = {
    doing:   todayPlans.filter(p => (p.Status||p.status||'') === 'Đang làm').length,
    help:    todayPlans.filter(p => ['Cần hỗ trợ','Khẩn cấp'].includes(p.Status||p.status||'')).length,
    done:    todayPlans.filter(p => ['Hoàn thành','Nghiệm thu · Chốt sổ'].includes(p.Status||p.status||'')).length,
    total:   todayPlans.length
  };
  // Render 4 stat cards + bảng assignee top 5
  document.getElementById('reportBody').innerHTML = `...`;
}
```

### GREEN — CSS:
```css
.nk-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px; }
.nk-stat-card { background: var(--bg-surface); border-radius: 12px; padding: 16px; text-align: center; }
.nk-stat-card__num { font-size: 32px; font-weight: 900; color: var(--brand); }
.nk-stat-card__lbl { font-size: 11px; color: var(--ink-muted); font-weight: 700; }
```

**Verification**: `await expect(page.locator('.nk-stat-card')).toHaveCount(4)`

---

## Task 5 — Screen Cá nhân [~10 phút]

**File**: `nhatky/index.html`, `css/app.css`

### RED:
```js
// Test: bấm navProfile → screenProfile visible, tên user đúng
expect(page.locator('#profileName')).toContainText('Hau DV');
```

### GREEN — HTML:
```html
<div class="nk-app" id="screenProfile" style="display:none">
  <header class="nk-appbar">
    <div class="nk-appbar__title"><div class="nk-appbar__name">Cá nhân</div></div>
    <button class="nk-appbar__theme" id="btnThemeProfile">🌙</button>
  </header>
  <main class="nk-content" id="profileBody"></main>
  <nav class="nk-bottomnav"><!-- copy --></nav>
</div>
```

### GREEN — JS: `renderProfileScreen()`
```js
function renderProfileScreen() {
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const name = user ? (user.name || user.username || 'Ẩn danh') : 'Ẩn danh';
  const role = user ? (user.role || user.position || '') : '';
  const team = user ? (user.team || user.teamGroup || '') : '';
  // Avatar circle + thông tin + dark toggle + đăng xuất
  document.getElementById('profileBody').innerHTML = `
    <div class="nk-profile">
      <div class="nk-profile__avatar">${name.charAt(0).toUpperCase()}</div>
      <div id="profileName" class="nk-profile__name">${escapeHtml(name)}</div>
      <div class="nk-profile__meta">${escapeHtml(role)}${team ? ' · ' + escapeHtml(team) : ''}</div>
      <div class="nk-profile__actions">
        <button class="nk-profile__action" onclick="toggleTheme()">🎨 Đổi giao diện</button>
        <button class="nk-profile__action nk-profile__action--danger" onclick="doLogout()">🚪 Đăng xuất</button>
      </div>
    </div>`;
}

function doLogout() {
  localStorage.clear();
  showToast('Đã đăng xuất', 'success');
  setTimeout(() => window.location.reload(), 800);
}
```

### GREEN — CSS:
```css
.nk-profile { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; }
.nk-profile__avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--brand); color: #fff; display: grid; place-items: center; font-size: 36px; font-weight: 900; margin-bottom: 12px; }
.nk-profile__name { font-size: 20px; font-weight: 800; }
.nk-profile__meta { font-size: 13px; color: var(--ink-muted); margin-top: 4px; }
.nk-profile__actions { width: 100%; margin-top: 32px; display: flex; flex-direction: column; gap: 10px; }
.nk-profile__action { width: 100%; padding: 14px; border: 1.5px solid var(--line); border-radius: 10px; background: var(--bg-surface); font-size: 14px; font-weight: 700; cursor: pointer; }
.nk-profile__action--danger { color: var(--danger, #dc3545); border-color: var(--danger, #dc3545); }
```

**Verification**: Playwright bấm Cá nhân → `#profileName` visible với tên đúng

---

## Task 6 — Verification toàn bộ

```bash
# Syntax check
python brain/fix_step_wrap.py  # chỉ để extract JS
node --check brain/extracted.js

# E2E tests (28 cũ + mới cho A2/A5)
npx playwright test tests/nhatky.spec.js --reporter=line
```

Target: **0 lỗi, tất cả tests pass**

---

## Lưu vào docs

File này sẽ được copy sang `docs/superpowers/plans/Plan_A2_A5_GateQuyen_TabBaoCao.md`
