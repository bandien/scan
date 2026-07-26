
'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
let allPlans = [];
let allLogs = [];

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

let staffList = [];
let filterDate = 'today';   // 'today' | 'week' | 'all'
let searchQuery = '';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function getShortName(fullName) {
  if (!fullName) return '';
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return parts[parts.length - 1]; // Lấy tên cuối (Việt Nam)
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function parseJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const wrap = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'nk-toast' + (type ? ` nk-toast--${type}` : '');
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

if (window.bdsShowToast === undefined) {
  window.bdsShowToast = showToast;
}

// ─────────────────────────────────────────────────────────────────────────────
// HASH ROUTING (Main ↔ Detail)
// ─────────────────────────────────────────────────────────────────────────────
function showScreen(screen) {
  document.getElementById('screenMain').style.display   = screen === 'main'   ? '' : 'none';
  document.getElementById('screenDetail').classList.toggle('is-active', screen === 'detail');
}

function navigateToDetail(id) {
  window.location.hash = `#detail/${id}`;
}

function navigateToMain() {
  window.location.hash = '';
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);

function handleRoute() {
  const hash = window.location.hash;
  const m = hash.match(/^#detail\/(.+)$/);
  if (m) {
    const id = decodeURIComponent(m[1]);
    renderDetailScreen(id);
    showScreen('detail');
  } else {
    showScreen('main');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function planPhases(plan) {
  if (plan._phases) return plan._phases;
  if (plan.Phases || plan.phases) {
    const raw = plan.Phases || plan.phases;
    const parsed = parseJSON(raw);
    plan._phases = Array.isArray(parsed) ? parsed : [];
  } else if (plan.Steps || plan.steps) {
    const raw = plan.Steps || plan.steps;
    const steps = parseJSON(raw);
    plan._phases = Array.isArray(steps) ? [{ id: 'default', name: 'Bước thực hiện', steps }] : [];
  } else {
    plan._phases = [];
  }
  return plan._phases;
}

function planField(plan, ...keys) {
  for (const k of keys) {
    if (plan[k] !== undefined && plan[k] !== null && plan[k] !== '') return plan[k];
    const lower = k.charAt(0).toLowerCase() + k.slice(1);
    if (plan[lower] !== undefined && plan[lower] !== null && plan[lower] !== '') return plan[lower];
  }
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD DATA
// ─────────────────────────────────────────────────────────────────────────────
async function loadPlans() {
  const board = document.getElementById('mainBoard');
  
  // 1. Load from cache immediately
  loadFromCache();
  if (allPlans.length > 0) {
    renderMainBoard();
    showSyncToast();
  } else {
    board.innerHTML = `<div class="nk-spinner"><div class="nk-spinner__ring"></div> Đang tải công việc...</div>`;
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
      board.innerHTML = `<div class="nk-empty"><div class="nk-empty__icon">⚠️</div>Lỗi kết nối/dữ liệu: ${escapeHtml(err.message)}<br><small>Dùng bản lưu nháp</small></div>`;
    } else {
      showToast('Không thể đồng bộ dữ liệu mới: ' + err.message, 'danger');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER MAIN BOARD
// ─────────────────────────────────────────────────────────────────────────────
function renderMainBoard() {
  const board = document.getElementById('mainBoard');
  const today = todayStr();
  const week  = new Date(Date.now() + 7 * 86400000).toISOString().slice(0,10);
  const q     = searchQuery.trim().toLowerCase();

  let plans = allPlans;

  // Filter by search
  if (q) {
    plans = plans.filter(p => {
      const task = (planField(p,'Task','task') + ' ' + planField(p,'Area','area') + ' ' + planField(p,'Assignee','assignee')).toLowerCase();
      return task.includes(q);
    });
  }

  // Separate done/cancelled vs. active
  const cutoffWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  // Apply date filter before grouping
  let filtered = plans.filter(p => {
    const s = planField(p, 'Status', 'status');
    if (s === 'Hoàn thành' || s === 'Đã hủy') return false;
    if (filterDate === 'today') {
      const d = planField(p, 'Date', 'date');
      // Show: no date, date = today, or urgent/doing regardless of date
      const status = s;
      const urgent = planField(p, 'Priority', 'priority') === 'Khẩn cấp';
      const doing  = status === 'Đang làm' || status === 'Cần hỗ trợ' || status === 'Bàn giao';
      return !d || d === today || urgent || doing;
    }
    if (filterDate === 'week') {
      const d = planField(p, 'Date', 'date');
      return !d || d <= cutoffWeek;
    }
    return true; // 'all'
  });

  // Group
  const gUrgent   = [];
  const gDoing    = [];
  const gReview   = [];
  const gPlanned  = [];

  filtered.forEach(p => {
    const status   = planField(p, 'Status', 'status');
    const priority = planField(p, 'Priority', 'priority');

    const isUrgent = priority === 'Khẩn cấp' || status === 'Cần hỗ trợ' || status === 'Bàn giao';
    if (isUrgent) {
      gUrgent.push(p);
    } else if (status === 'Đang làm') {
      gDoing.push(p);
    } else if (status === 'Chờ nghiệm thu') {
      gReview.push(p);
    } else {
      gPlanned.push(p);
    }
  });

  function buildGroup(title, items, dotColor, groupId) {
    if (items.length === 0) return '';

    const rows = items.map(p => {
      const id       = planField(p, 'PlanID', 'id', 'planId');
      const task     = escapeHtml(planField(p, 'Task', 'task') || 'Không có tên');
      const assignee = getShortName(planField(p, 'Assignee', 'assignee'));
      const updBy    = getShortName(planField(p, 'UpdatedBy', 'updatedBy'));
      const area     = planField(p, 'Area', 'area');
      const date     = planField(p, 'Date', 'date');

      const who  = escapeHtml(assignee || updBy || 'Chưa giao');
      
      let badgeHtml = '';
      const phases = typeof planPhases === 'function' ? planPhases(p) : [];
      if (Array.isArray(phases) && phases.length > 0) {
        let totalSteps = 0;
        let doneSteps = 0;
        phases.forEach(ph => {
          const stps = ph.steps || [];
          totalSteps += stps.length;
          doneSteps += stps.filter(s => s.done).length;
        });
        if (totalSteps > 0) {
          badgeHtml = `<span style="background: var(--bg-surface-hover, #e0e0e0); color: var(--primary-color, #0b4d5e); padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px; margin-right: 5px;">GĐ ${doneSteps}/${totalSteps}</span>`;
        }
      }

      const meta = [
        `<span class="who">${who}</span>`,
        area ? `<span class="sep">·</span><span>${escapeHtml(area)}</span>` : '',
        date ? `<span class="sep">·</span><span>${date.slice(5)}</span>` : ''
      ].join('');

      return `
        <a class="nk-wrow" href="#detail/${escapeAttr(String(id))}" id="wrow-${escapeAttr(String(id))}">
          <div class="nk-wrow__dot" style="background:${dotColor}"></div>
          <div class="nk-wrow__main">
            <div class="nk-wrow__title">${badgeHtml}${task}</div>
            <div class="nk-wrow__meta">${meta}</div>
          </div>
          <div class="nk-wrow__chev">›</div>
        </a>`;
    }).join('');

    return `
      <div class="nk-group" id="grp-${groupId}">
        <div class="nk-group__header">
          <div class="nk-dot" style="background:${dotColor}"></div>
          <span class="nk-group__title">${escapeHtml(title)}</span>
          <span class="nk-group__count">${items.length}</span>
        </div>
        <div class="nk-list">${rows}</div>
      </div>`;
  }

  let html = '';
  html += buildGroup('Cần xử lý tiếp / Khẩn', gUrgent,  'var(--dot-urgent)', 'urgent');
  html += buildGroup('Đang làm',               gDoing,   'var(--dot-doing)',  'doing');
  html += buildGroup('Chờ nghiệm thu',         gReview,  'var(--dot-review)', 'review');
  html += buildGroup('Lịch sắp tới',           gPlanned, 'var(--dot-planned)','planned');

  if (!html) {
    html = `<div class="nk-empty"><div class="nk-empty__icon">✅</div>${q ? 'Không tìm thấy kết quả phù hợp.' : 'Không có công việc nào.'}</div>`;
  }

  board.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER DETAIL SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function renderDetailScreen(id) {
  const plan = allPlans.find(p => {
    const pid = String(planField(p, 'PlanID', 'id', 'planId'));
    return pid === String(id);
  });

  const body  = document.getElementById('detailBody');
  const title = document.getElementById('detailBarTitle');

  if (!plan) {
    body.innerHTML = `<div class="nk-empty"><div class="nk-empty__icon">❓</div>Không tìm thấy công việc này.<br><small>Có thể dữ liệu chưa tải xong.</small></div>`;
    title.textContent = 'Chi tiết';
    return;
  }

  const taskName   = planField(plan, 'Task', 'task') || 'Không có tên';
  const sender     = planField(plan, 'Assignee', 'assignee') || planField(plan, 'UpdatedBy', 'updatedBy') || 'Hệ thống';
  const date       = planField(plan, 'Date', 'date') || '';
  const time       = planField(plan, 'Time', 'time') || '';
  const area       = planField(plan, 'Area', 'area') || '';
  const sourceText = planField(plan, 'SourceText', 'sourceText') || '';
  const status     = planField(plan, 'Status', 'status') || '';

  title.textContent = taskName;

  // ── Khu 1: Chỉ đạo & Tiêu chí ──────────────────────────────────────────
  let sec1 = `
    <div class="nk-section">
      <div class="nk-section__label"><span class="n">①</span> Chỉ đạo & Tiêu chí</div>
      <div class="nk-kv"><span class="k">Người giao:</span> ${escapeHtml(sender)}</div>
      ${date ? `<div class="nk-kv"><span class="k">Thời gian:</span> ${escapeHtml(date)} ${escapeHtml(time)}</div>` : ''}
      ${area ? `<div class="nk-kv"><span class="k">Vị trí:</span> ${escapeHtml(area)}</div>` : ''}
      ${status ? `<div class="nk-kv"><span class="k">Trạng thái:</span> ${escapeHtml(status)}</div>` : ''}
      <div class="nk-quote">"${escapeHtml(taskName)}"</div>
      ${sourceText ? `<div class="nk-kv" style="margin-top:6px"><span class="k">Chi tiết:</span> ${escapeHtml(sourceText)}</div>` : ''}
    </div>`;

  // ── Khu 2: Giai đoạn & Bước ─────────────────────────────────────────────
  let sec2 = `
    <div class="nk-section">
      <div class="nk-section__label"><span class="n">②</span> Giai đoạn & Bước</div>
      ${renderFlatPhases(plan)}
    </div>`;

  // ── Khu 3: Nhật ký ──────────────────────────────────────────────────────
  let sec3 = `
    <div class="nk-section">
      <div class="nk-section__label"><span class="n">③</span> Nhật ký & Phát sinh</div>
      <div class="nk-tl" style="margin-top: 10px;">
        ${renderTimelineHtml(id)}
      </div>
      <button class="nk-btn nk-btn--outline" style="margin-top: 10px; width: 100%; border-style: dashed;" onclick="openLogModal('${escapeAttr(String(id))}')">＋ Ghi nhật ký</button>
    </div>`;

  // ── Actions ─────────────────────────────────────────────────────────────
  const isDone = status === 'Hoàn thành';
  let actions = `
    <div class="nk-actions">
      <button class="nk-btn nk-btn--ghost" onclick="openHandoverModal('${escapeAttr(String(id))}')">⇄ Bàn giao</button>
      ${!isDone
        ? `<button class="nk-btn nk-btn--primary" id="btnMarkDone">✓ Nghiệm thu · Chốt sổ</button>`
        : `<span class="nk-btn" style="background:var(--dot-done);color:#fff;pointer-events:none">✓ Đã hoàn thành</span>`
      }
    </div>`;

  body.innerHTML = `
    <div class="nk-sheet">
      ${sec1}${sec2}${sec3}${actions}
    </div>`;

  // Wire nút Chốt sổ
  const btnDone = document.getElementById('btnMarkDone');
  if (btnDone) {
    btnDone.addEventListener('click', () => markPlanDone(plan, btnDone));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER FLAT PHASES
// ─────────────────────────────────────────────────────────────────────────────
    function renderFlatPhases(plan) {
      const phases = planPhases(plan);
      const pid    = String(planField(plan, 'PlanID', 'id', 'planId'));

      if (phases.length === 0) {
        return `<div style="text-align:center; padding: 10px 0;">
          <button onclick="upgradeToPhases('${escapeAttr(pid)}')" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--primary-color); background: transparent; color: var(--primary-color); font-weight: 700; cursor: pointer;">
            ⚙️ Việc này phức tạp? Chia giai đoạn/bước
          </button>
        </div>`;
      }

      return phases.map((ph, idx) => {
        const steps   = ph.steps || [];
        const doneN   = steps.filter(s => s.done).length;
        const isDone  = ph.status === 'done' || (steps.length > 0 && doneN === steps.length);
        const isDoing = !isDone && doneN > 0;

        const cls  = isDone ? 'nk-pmark--done' : isDoing ? 'nk-pmark--doing' : 'nk-pmark--todo';
        const icon = isDone ? '✓' : isDoing ? '▸' : '○';
        const name = escapeHtml(ph.name || `Giai đoạn ${idx + 1}`);

        let stepsHtml = '';
        if (steps.length > 0) {
          stepsHtml = `<div class="nk-steps">` + steps.map(st => {
            const ckCls  = st.done ? 'nk-step__ck--done' : '';
            const txtCls = st.done ? 'nk-step__text--done' : '';
            
            // Task 7: Crowd-completion self-chip
            let selfChipHtml = '';
            const assignees = st.assignees || [];
            if (assignees.length >= 2) {
              const currentUser = (typeof BD_SSO !== 'undefined' ? BD_SSO.getUser()?.name : currentUserName) || '';
              const myName = normalizePerson(currentUser);
              if (myName && assignees.some(a => normalizePerson(a) === myName)) {
                const doneSet = new Set((st.doneByPeople || []).map(normalizePerson));
                const iAmDone = doneSet.has(myName);
                selfChipHtml = `<button class="nk-self-chip ${iAmDone ? 'is-done' : ''}" onclick="event.stopPropagation(); reportStepDone('${escapeAttr(pid)}','${escapeAttr(ph.id)}','${escapeAttr(st.id)}','${escapeAttr(currentUser)}')">${iAmDone ? '✓ Mình đã xong' : '○ Báo mình xong'}</button>`;
              }
            }
            
            return `
              <div class="nk-step">
                <div class="nk-step__ck ${ckCls}" style="cursor:pointer" onclick="togglePhaseStepDone('${escapeAttr(pid)}','${escapeAttr(ph.id)}','${escapeAttr(st.id)}')">${st.done ? '✓' : ''}</div>
                <div class="nk-step__text ${txtCls}">
                  <span onclick="renamePhaseStep('${escapeAttr(pid)}','${escapeAttr(ph.id)}','${escapeAttr(st.id)}')">${escapeHtml(st.title)}</span>
                  ${selfChipHtml}
                  ${stepPeopleProgressHtml(st)}
                </div>
                ${phaseStepAssigneeEditorHtml(plan, ph.id, st)}
                <button class="nk-step__del" onclick="deletePhaseStep('${escapeAttr(pid)}','${escapeAttr(ph.id)}','${escapeAttr(st.id)}')">&times;</button>
              </div>`;
          }).join('') + `</div>`;
        }

        return `
          <div class="nk-pline">
            <div class="nk-pmark ${cls}">${icon}</div>
            <div class="nk-pname" style="cursor:pointer" onclick="renamePhase('${escapeAttr(pid)}', '${escapeAttr(ph.id)}')">${name}</div>
            <div class="nk-pcount">${doneN}/${steps.length}</div>
            <button class="nk-step__del" style="margin-left: auto;" onclick="deletePhase('${escapeAttr(pid)}', '${escapeAttr(ph.id)}')">&times;</button>
          </div>
          ${stepsHtml}
          <button class="nk-add-step" onclick="addPhaseStep('${escapeAttr(pid)}', '${escapeAttr(ph.id)}')">＋ Thêm bước</button>`;
      }).join('') + `<button class="nk-add-step" style="padding-left:0; margin-top: 10px;" onclick="addPhase('${escapeAttr(pid)}')">＋ Thêm giai đoạn</button>`;
    }

    window.upgradeToPhases = function (planId) {
      updatePlanPhases(planId, phases => {
        phases.push({ id: "PHASE-" + Date.now().toString(36), name: "Thực hiện", order: 1, status: "todo", steps: [] });
      });
    };
    
    window.reportStepDone = function (planId, phaseId, stepId, name) {
      updatePlanPhases(planId, phases => {
        const phase = phases.find(p => p.id === phaseId);
        const step = phase && (phase.steps || []).find(s => s.id === stepId);
        if (step) { markStepDoneByPeople(step, [name], name); rollUpPhaseStatus_(phase); }
      });
    };


// ─────────────────────────────────────────────────────────────────────────────
// MARK DONE
// ─────────────────────────────────────────────────────────────────────────────
async function markPlanDone(plan, btn) {
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const userName = user ? (user.name || user.username || 'Ẩn danh') : 'Ẩn danh';
  const id   = planField(plan, 'PlanID', 'id', 'planId');

  // Optimistic Update
  const oldStatus = plan.Status;
  plan.Status = 'Hoàn thành';
  plan.status = 'Hoàn thành';
  
  saveToCache();
  showToast('Đã cập nhật: Hoàn thành ✓', 'success');
  navigateToMain();
  renderMainBoard();
  showSyncToast();

  try {
    const payload = { ...plan, status: 'Hoàn thành', updatedBy: userName };
    await window.bdsApiPost('savePlan', payload);
    hideSyncToast();
  } catch (err) {
    hideSyncToast();
    showToast('Lỗi đồng bộ: ' + err.message, 'danger');
    // Rollback
    plan.Status = oldStatus;
    plan.status = oldStatus;
    saveToCache();
    renderMainBoard();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────────────────
let searchTimer;
document.getElementById('searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = e.target.value;
    renderMainBoard();
  }, 250);
});

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: TẠO VIỆC MỚI
// ─────────────────────────────────────────────────────────────────────────────
function openNewTaskModal() {
  document.getElementById('modalNewTask').classList.add('is-open');
  document.getElementById('fTask').focus();
  // Set ngày mặc định = hôm nay
  const tStr = todayStr();
  const fDate = document.getElementById('fDateEnd');
  if (fDate && !fDate.value) fDate.value = tStr;
}

function closeNewTaskModal() {
  document.getElementById('modalNewTask').classList.remove('is-open');
}

document.getElementById('btnNewTask').addEventListener('click', openNewTaskModal);
document.getElementById('btnCloseNewTask').addEventListener('click', closeNewTaskModal);
document.getElementById('btnCancelNewTask').addEventListener('click', closeNewTaskModal);

// Close on overlay click
document.getElementById('modalNewTask').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeNewTaskModal();
});

// Expand toggle
document.getElementById('btnExpandFields').addEventListener('click', () => {
  const fields  = document.getElementById('expandFields');
  const iconEl  = document.getElementById('expandIcon');
  const labelEl = document.getElementById('expandLabel');
  const open    = fields.classList.toggle('is-open');
  iconEl.textContent  = open ? '▾' : '▸';
  labelEl.textContent = open ? 'Ẩn bớt' : 'Thêm thông tin';
});

// Write-on-behalf
document.getElementById('fWriteOnBehalf').addEventListener('change', e => {
  document.getElementById('fBehalfField').style.display = e.target.checked ? '' : 'none';
  if (e.target.checked) {
    loadStaffIntoSelect();
  }
});

async function loadStaffIntoSelect() {
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
}

// Save new task
document.getElementById('btnSaveNewTask').addEventListener('click', saveNewTask);

async function saveNewTask() {
  const task = document.getElementById('fTask').value.trim();
  if (!task) {
    showToast('Vui lòng nhập tên công việc', 'danger');
    document.getElementById('fTask').focus();
    return;
  }

  const user  = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const uName = user ? (user.name || user.username || 'Ẩn danh') : 'Ẩn danh';

  const behf  = document.getElementById('fWriteOnBehalf').checked;
  const assignee = behf
    ? document.getElementById('fBehalfPerson').value
    : document.getElementById('fAssignee').value.trim() || uName;

  const payload = {
    task,
    Task:       task,
    area:       document.getElementById('fArea').value.trim(),
    Area:       document.getElementById('fArea').value.trim(),
    assignee,
    Assignee:   assignee,
    updatedBy:  uName,
    UpdatedBy:  uName,
    date:       todayStr(),
    Date:       todayStr(),
    time:       new Date().toTimeString().slice(0,5),
    Time:       new Date().toTimeString().slice(0,5),
    priority:   document.getElementById('fPriority').value,
    type:       document.getElementById('fType').value,
    dateEnd:    document.getElementById('fDateEnd').value,
    sourceText: document.getElementById('fSourceText').value.trim(),
    status:     'Đang làm',
    Status:     'Đang làm'
  };

  const btn = document.getElementById('btnSaveNewTask');
  
  // Optimistic UI
  const fakeId = 'PLAN-' + Date.now();
  const fakePlan = { ...payload, id: fakeId, PlanID: fakeId, Status: 'Đang làm' };
  allPlans.unshift(fakePlan);
  saveToCache();
  
  showToast('Đã tạo công việc mới ✓', 'success');
  closeNewTaskModal();
  renderMainBoard();
  showSyncToast();

  // Reset form
  ['fTask','fArea','fAssignee','fSourceText'].forEach(id => {
    document.getElementById(id).value = '';
  });

  try {
    await window.bdsApiPost('savePlan', payload);
    hideSyncToast();
  } catch (err) {
    hideSyncToast();
    showToast('Lỗi đồng bộ tạo việc: ' + err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Lưu công việc';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DARK MODE TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  const saved = localStorage.getItem('nk_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

document.getElementById('btnTheme').addEventListener('click', () => {
  const cur  = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('nk_theme', next);
  document.getElementById('btnTheme').textContent = next === 'dark' ? '☀️' : '🌙';
});

// ─────────────────────────────────────────────────────────────────────────────
// DATE FILTER DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
const DATE_LABELS = { today: 'Hôm nay', week: '7 ngày', all: 'Tất cả' };

document.getElementById('datePickBtn').addEventListener('click', () => {
  const opts = ['today','week','all'];
  const idx  = opts.indexOf(filterDate);
  filterDate = opts[(idx + 1) % opts.length];
  document.getElementById('datePickBtn').textContent = DATE_LABELS[filterDate] + ' ▾';
  renderMainBoard();
});

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR / PROFILE / BACK BUTTON
// ─────────────────────────────────────────────────────────────────────────────
document.getElementById('avatarBtn').addEventListener('click', () => {
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const name = user ? (user.name || user.username || '?') : '?';
  const team = user ? (user.team || user.teamGroup || '') : '';
  showToast('Xin chào, ' + name + (team ? ' · ' + team : ''));
});

document.getElementById('btnDetailBack').addEventListener('click', () => {
  navigateToMain();
});

// Profile nav item
document.getElementById('navProfile').addEventListener('click', e => {
  e.preventDefault();
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  if (!user) { showToast('Chưa đăng nhập', 'danger'); return; }
  const name = user.name || user.username || 'Ẩn danh';
  const role = user.role || user.position || '';
  showToast(name + (role ? ' · ' + role : ''));
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN GUARD
// ─────────────────────────────────────────────────────────────────────────────
function checkLogin() {
  if (typeof BD_SSO === 'undefined') return true; // SSO chưa load → cho qua
  const user = BD_SSO.getUser();
  if (user && (user.username || user.name)) return true;
  // Chưa đăng nhập → hiện overlay yêu cầu đăng nhập
  showLoginOverlay();
  return false;
}

function showLoginOverlay() {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    return;
  }
  // Tạo overlay đăng nhập nhanh
  const div = document.createElement('div');
  div.id = 'loginOverlay';
  div.style.cssText = 'position:fixed;inset:0;background:var(--bg-overlay,rgba(0,0,0,.5));z-index:999;display:flex;align-items:flex-end;justify-content:center';
  div.innerHTML = `
    <div style="background:var(--bg-surface,#fff);border-radius:20px 20px 0 0;padding:24px 20px 32px;width:100%;max-width:640px">
      <h3 style="font-size:18px;font-weight:800;margin:0 0 16px">🔐 Đăng nhập</h3>
      <div style="margin-bottom:10px">
        <label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#666;display:block;margin-bottom:5px">Tên đăng nhập</label>
        <input id="liUser" type="text" placeholder="username" style="width:100%;padding:10px 12px;border:1.5px solid #d3dadd;border-radius:8px;font-size:14px">
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#666;display:block;margin-bottom:5px">Mật khẩu</label>
        <input id="liPass" type="password" placeholder="password" style="width:100%;padding:10px 12px;border:1.5px solid #d3dadd;border-radius:8px;font-size:14px">
      </div>
      <button id="liBtn" style="width:100%;padding:13px;background:#0b4d5e;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:800;cursor:pointer">Đăng nhập</button>
    </div>`;
  document.body.appendChild(div);

  document.getElementById('liBtn').addEventListener('click', async () => {
    const u = document.getElementById('liUser').value.trim();
    const p = document.getElementById('liPass').value.trim();
    if (!u || !p) { showToast('Vui lòng nhập đầy đủ', 'danger'); return; }

    const btn = document.getElementById('liBtn');
    btn.disabled = true; btn.textContent = '⏳ Đang xác thực...';

    try {
      const res = await window.bdsApiPost('login', { username: u, password: p });
      if (res && res.status === 'success' && res.user) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        div.remove();
        initApp();
      } else {
        showToast('Sai tên đăng nhập hoặc mật khẩu', 'danger');
        btn.disabled = false; btn.textContent = 'Đăng nhập';
      }
    } catch (err) {
      showToast('Lỗi kết nối: ' + err.message, 'danger');
      btn.disabled = false; btn.textContent = 'Đăng nhập';
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT APP
// ─────────────────────────────────────────────────────────────────────────────
async function initApp() {
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;

  // Áp dụng dark mode đã lưu
  const savedTheme = localStorage.getItem('nk_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('btnTheme').textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  // Cập nhật avatar
  if (user) {
    const name = user.name || user.username || 'H';
    document.getElementById('avatarBtn').textContent = name.charAt(0).toUpperCase();
  }

  // Cập nhật appbar sub (ngày trong tuần)
  const now = new Date();
  const dayNames = ['CN','T2','T3','T4','T5','T6','T7'];
  const sub = `${dayNames[now.getDay()]} ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}`;
  document.getElementById('appbarSub').textContent = sub;

  // Load plans
  await loadPlans();
  // loadStaff();
}

document.addEventListener('DOMContentLoaded', () => {
  // Kiểm tra login (không block — nếu SSO chưa sẵn sàng thì cứ load)
  initApp();
});

// --- PORTED FROM P4 ---
    function normalizePerson(value) {
      return String(value || "").trim().toLowerCase();
    }

    function formatStandardShortName(rawName) {
      if (!rawName) return "";
      const raw = String(rawName).trim();
      if (!raw) return "";

      const parts = raw.split(/\s+/);
      if (parts.length <= 2) return raw; // Ví dụ "Thắng NQ", "Hậu DV" -> đã ngắn gọn chuẩn

      const mainName = parts[parts.length - 1]; // "Thắng", "Hậu"
      const initials = parts.slice(0, parts.length - 1).map(p => p.charAt(0).toUpperCase()).join("");
      return `${mainName} ${initials}`; // "Thắng NQ", "Hậu DV"
    }

    function planPhases(plan) {
      if (!plan || !plan.phases) return [];
      try {
        const parsed = JSON.parse(plan.phases);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }

    // Gộp bước phẳng cũ + bước trong giai đoạn mới — dùng cho những chỗ chỉ cần
    // tính tổng tiến độ chung (vd cập nhật trạng thái việc khi ghi nhật ký).
    function allPlanSteps(plan) {

function allPlanSteps(plan) { return planPhases(plan).flatMap(ph => ph.steps || []); }

    function findAnyStep(plan, stepId) {
      if (!plan || !stepId) return null;
      const legacy = planSteps(plan).find(s => s.id === stepId);
      if (legacy) return legacy;
      for (const ph of planPhases(plan)) {
        const found = (ph.steps || []).find(s => s.id === stepId);
        if (found) return found;
      }
      return null;
    }

    // Như findAnyStep, nhưng kèm tên giai đoạn (null nếu là bước phẳng cũ, chưa
    // thuộc giai đoạn nào) — dùng để chú thích "nhật ký này thuộc bước/giai đoạn
    // nào" trên timeline (planTimelineHtml), vì log chỉ lưu stepId, không lưu tên.
    function findStepWithPhase(plan, stepId) {

    function stepDoneInfo(step) {
      const assignees = (step && step.assignees) || [];
      const doneNames = (step && step.doneByPeople) || [];
      const doneSet = new Set(doneNames.map(normalizePerson));
      const total = assignees.length;
      const doneCount = total ? assignees.filter(a => doneSet.has(normalizePerson(a))).length : (step && step.done ? 1 : 0);
      return { assignees, doneNames, total, doneCount, allDone: Boolean(step && step.done) };
    }

    // Ghi nhận (những) người đã Hoàn thành phần mình trên bước; đặt step.done theo
    // nguyên tắc "đủ người mới xong". `people` rỗng → dùng fallbackBy (người ghi).
    function markStepDoneByPeople(step, people, fallbackBy) {
      if (!step) return;
      const wasDone = step.done === true; // bước đã Xong (kể cả từ mô hình cũ) thì giữ Xong
      if (!Array.isArray(step.doneByPeople)) step.doneByPeople = [];
      const names = (people && people.length ? people : [fallbackBy]).filter(Boolean);
      names.forEach(nm => {
        if (!step.doneByPeople.some(n => normalizePerson(n) === normalizePerson(nm))) step.doneByPeople.push(nm);
      });
      const assignees = step.assignees || [];
      const doneSet = new Set(step.doneByPeople.map(normalizePerson));
      const allDone = assignees.length === 0 ? true : assignees.every(a => doneSet.has(normalizePerson(a)));
      // Chỉ tiến lên "Xong", không tự lùi: ghi thêm không bao giờ bỏ trạng thái đã Xong
      // (muốn bỏ Xong phải bấm tick thủ công ở toggleStepDone/togglePhaseStepDone).
      step.done = wasDone || allDone;
      step.doneAt = new Date().toISOString();
      step.doneBy = names[names.length - 1] || fallbackBy || "";
    }

    // Dòng tiến độ hiển thị dưới 1 bước: đã xong → ai xong; chưa xong nhiều người →
    // "x/y người đã xong" + tên. Dùng chung cho bước phẳng (stepRowHtml) và bước
    // trong giai đoạn (phaseStepRowHtml). Bước cũ (done qua mô hình cũ, không có
    // doneByPeople) vẫn hiển thị "đã xong" bình thường vì đọc step.done trực tiếp.
    function stepPeopleProgressHtml(step) {
      const info = stepDoneInfo(step);
      if (step.done) {
        const by = step.doneBy ? escapeHtml(getShortName(step.doneBy)) + " đã xong" : "Đã xong";
        return `<div class="step-done-note"><i class="bi bi-check2-circle me-1"></i>${by}${step.doneAt ? " · " + friendlyDate(step.doneAt.slice(0, 10)) : ""}</div>`;
      }
      if (info.total > 1 && info.doneCount > 0) {
        const doneList = (info.doneNames || []).map(n => escapeHtml(getShortName(n))).join(", ");
        return `<div class="step-progress-people"><i class="bi bi-people me-1"></i>${info.doneCount}/${info.total} người đã xong${doneList ? " · " + doneList : ""}</div>`;
      }
      return "";
    }

    function rollUpPhaseStatus_(phase) {
      if (!phase) return;
      const steps = phase.steps || [];
      phase.status = steps.length === 0 ? "todo" : steps.every(s => s.done) ? "done" : steps.some(s => s.done) ? "doing" : "todo";
    }

    window.addPhaseStep = function (planId, phaseId) {
      const title = prompt("Tên bước mới:");

// --- PORTED FROM TASK 2 ---

    let staffList = [];
    let staffDirectory = [];
    
    async function loadStaff() {
      try {
        const cachedNames = localStorage.getItem('bandien_nhatky_staff_v2');
        if (cachedNames) {
          const arr = JSON.parse(cachedNames);
          if (Array.isArray(arr) && arr.length > 0) staffList = arr;
        }
        const cachedDir = localStorage.getItem('bandien_nhatky_staff_directory_v1');
        if (cachedDir) {
          const arr = JSON.parse(cachedDir);
          if (Array.isArray(arr) && arr.length > 0) staffDirectory = arr;
        }

        if (staffList.length === 0 || staffDirectory.length === 0) {
          try {
            const res = await fetch('../danhba_chuan_hoa.json');
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                staffDirectory = data;
                staffList = data.map(d => d.fullName).filter(Boolean);
              }
            }
          } catch (e) { console.warn('Lỗi đọc fallback danhba_chuan_hoa.json:', e); }
        }

        const res = await window.bdsApiFetch('getStaff', { force: true });
        if (res && res.status === 'success' && Array.isArray(res.data)) {
          staffDirectory = res.data;
          staffList = res.data.map(d => d.fullName).filter(Boolean);
          localStorage.setItem('bandien_nhatky_staff_v2', JSON.stringify(staffList));
          localStorage.setItem('bandien_nhatky_staff_directory_v1', JSON.stringify(staffDirectory));
          
          if (typeof currentOpenPlanId !== 'undefined' && currentOpenPlanId) {
            openTaskDetail(currentOpenPlanId);
          }
        }
      } catch (err) {
        console.error('Lỗi loadStaff:', err);
      }
    }

    function getShortName(fullName) {
      if (!fullName) return "";
      const raw = String(fullName).trim();
      if (!raw) return "";

      // 1. Tra cứu trực tiếp trong staffDirectory (danh bạ / tài khoản)
      const person = staffDirectory.find(p =>
        (p.name && p.name.toLowerCase() === raw.toLowerCase()) ||
        (p.username && p.username.toLowerCase() === raw.toLowerCase()) ||
        (p.shortName && p.shortName.toLowerCase() === raw.toLowerCase())
      );

      // Nếu có tên thường gọi riêng trong danh bạ (vd "Chiến", "Huy pb", "Huy đh")
      if (person && person.shortName && person.shortName.trim()) {
        const customShort = person.shortName.trim();
        // Kiểm tra xem tên gọi đó có bị trùng đơn thuần (vd 2 người cùng tên "Thắng") không
        const duplicates = staffDirectory.filter(p => p.shortName && p.shortName.trim().toLowerCase() === customShort.toLowerCase());
        if (duplicates.length <= 1) {
          return customShort;
        }
        // Nếu bị trùng tên ngắn đơn lẻ, chuyển sang format chuẩn phân biệt: [Tên] [Chữ cái đầu Họ/Đệm]
        return formatStandardShortName(person.name || raw);
      }

      // 2. Không có tên gọi riêng hoặc tên đầy đủ -> định dạng chuẩn ngắn gọn (vd "Nguyễn Quốc Thắng" ➔ "Thắng NQ", "Đinh Văn Hậu" ➔ "Hậu DV")
      return formatStandardShortName(raw);
    }

    function knownPeopleNames() {
      const names = new Set(staffList);
      allPlans.flatMap(p => String(p.assignee || '').split(',')).forEach(n => names.add(n.trim()));
      allPlans.flatMap(p => allPlanSteps(p)).forEach(step => (step.assignees || []).forEach(n => names.add(String(n || '').trim())));
      return [...names].filter(Boolean).sort();
    }

    function filterNamesByTag(names, tagVal) {
      const val = String(tagVal || "").trim().toLowerCase();
      if (!val) return names;
      const matches = names.filter(name => {
        const person = staffDirectory.find(p =>
          (p.name && p.name.toLowerCase() === name.toLowerCase()) ||
          (p.username && p.username.toLowerCase() === name.toLowerCase())
        );
        if (!person) return false;
        const dept = (person.dept || "").toLowerCase();
        const labels = (person.labels || "").toLowerCase();
        return (dept && (dept.includes(val) || val.includes(dept)))
          || (labels && (labels.includes(val) || val.includes(labels)));
      });
      return matches.length > 0 ? matches : names;
    }

// --- PORTED FROM TASK 3 ---
    async function updatePlanPhases(planId, mutateFn) {
      const plan = allPlans.find(p => p.id === planId);
      if (!plan) return;
      const oldPhases = plan.phases;
      const oldStatus = plan.status;
      
      const phases = planPhases(plan);
      mutateFn(phases);
      plan.phases = JSON.stringify(phases);
      const steps = allPlanSteps(plan);
      if (steps.length > 0) {
        plan.status = steps.every(s => s.done) ? "Hoàn thành" : "Đang làm";
        plan.Status = plan.status;
      }
      
      const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
      const userName = user ? (user.name || user.username || 'Unknown') : 'Unknown';
      
      // Optimistic Update
      saveToCache();
      openTaskDetail(planId);
      renderMainBoard();
      showSyncToast();
      
      try {
        const payload = { ...plan, updatedBy: userName };
        await window.bdsApiPost('savePlan', payload);
        hideSyncToast();
      } catch (err) {
        hideSyncToast();
        showToast('Lỗi đồng bộ giai đoạn: ' + err.message, 'danger');
        plan.phases = oldPhases;
        plan.status = oldStatus;
        plan.Status = oldStatus;
        saveToCache();
        openTaskDetail(planId);
        renderMainBoard();
      }
    }

window.submitLog = async function() {
  const planId = document.getElementById('logPlanId').value;
  const result = document.getElementById('logResult').value.trim();
  const teams = document.getElementById('logTeams').value;
  
  if (!teams) return showToast('Vui lòng chọn tổ thực hiện');
  if (!result) return showToast('Vui lòng nhập kết quả');
  
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const uName = user ? (user.name || user.username || 'Ẩn danh') : 'Ẩn danh';
  const plan = allPlans.find(p => p.id === planId);

  const logData = {
    id: 'LOG-' + Date.now(),
    planId: planId,
    timestamp: new Date().toISOString(),
    author: uName,
    result: result,
    teams: [teams],
    photos: []
  };

  // Optimistic UI
  allLogs.push(logData);
  saveToCache();
  
  showToast('Đã lưu nhật ký', 'success');
  closeLogModal();
  renderDetailScreen(planId);
  showSyncToast();
  
  try {
    const res = await window.bdsApiFetch('savePlan', {
      ...plan,
      actionLog: JSON.stringify([logData])
    });
    hideSyncToast();
    if (!res || res.status !== 'success') {
      throw new Error(res?.message || 'Server error');
    }
  } catch (err) {
    hideSyncToast();
    showToast('Lỗi đồng bộ: ' + err.message, 'danger');
    allLogs.pop();
    saveToCache();
    renderDetailScreen(planId);
  }
};

window.submitHandover = async function() {
  const planId = document.getElementById('hoPlanId').value;
  const person = document.getElementById('hoPerson').value.trim();
  const note   = document.getElementById('hoNote').value.trim();

  if (!person) return showToast('Vui lòng nhập tên người nhận bàn giao');

  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const uName = user ? (user.name || user.username || 'Ẩn danh') : 'Ẩn danh';

  const plan = allPlans.find(p => p.id === planId);
  if (!plan) return;

  const handoverItem = {
    from: uName,
    to: person,
    at: new Date().toISOString(),
    note: note
  };

  const updatedPlan = {
    ...plan,
    assignee: person,
    Assignee: person,
    handover: JSON.stringify([handoverItem]),
    updatedBy: uName
  };

  // Optimistic UI
  const oldHandover = plan.handover;
  const oldAssignee = plan.assignee;
  Object.assign(plan, updatedPlan);
  saveToCache();
  
  showToast('Đã bàn giao', 'success');
  closeHandoverModal();
  renderDetailScreen(planId);
  renderMainBoard();
  showSyncToast();
  
  try {
    const res = await window.bdsApiFetch('savePlan', updatedPlan);
    hideSyncToast();
    if (!res || res.status !== 'success') {
      throw new Error(res?.message || 'Server error');
    }
  } catch (err) {
    hideSyncToast();
    showToast('Lỗi đồng bộ: ' + err.message, 'danger');
    plan.handover = oldHandover;
    plan.assignee = oldAssignee;
    plan.Assignee = oldAssignee;
    saveToCache();
    renderDetailScreen(planId);
    renderMainBoard();
  }
};

    window.addPhase = function (planId) {
      const name = prompt("Tên giai đoạn mới (vd Khảo sát, Vật tư, Thi công, Nghiệm thu):");
      if (!name || !name.trim()) return;
      updatePlanPhases(planId, phases => {
        phases.push({
          id: "PHASE-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          name: name.trim(), order: phases.length + 1, status: "todo", steps: []
        });
      });
    };

    window.renamePhase = function (planId, phaseId) {
      const plan = allPlans.find(item => item.id === planId);
      const phase = plan && planPhases(plan).find(p => p.id === phaseId);
      if (!phase) return;
      const name = prompt("Tên giai đoạn:", phase.name || "");
      if (name === null || !name.trim()) return;
      updatePlanPhases(planId, phases => {
        const ph = phases.find(p => p.id === phaseId);
        if (ph) ph.name = name.trim();
      });
    };

    window.deletePhase = function (planId, phaseId) {
      if (!confirm("Xoá giai đoạn này? Các bước trong giai đoạn sẽ bị xoá theo.")) return;
      updatePlanPhases(planId, phases => {
        const index = phases.findIndex(p => p.id === phaseId);
        if (index >= 0) phases.splice(index, 1);
      });
    };

    window.addPhaseStep = function (planId, phaseId) {
      const title = prompt("Tên bước mới:");
      if (!title || !title.trim()) return;
      updatePlanPhases(planId, phases => {
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) return;
        if (!phase.steps) phase.steps = [];
        phase.steps.push({
          id: "STEP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          title: title.trim(), assignees: [], done: false, doneAt: "", doneBy: "", photos: []
        });
        rollUpPhaseStatus_(phase);
      });
    };

    window.renamePhaseStep = function (planId, phaseId, stepId) {
      const plan = allPlans.find(item => item.id === planId);
      const phase = plan && planPhases(plan).find(p => p.id === phaseId);
      const step = phase && (phase.steps || []).find(s => s.id === stepId);
      if (!step) return;
      const title = prompt("Tên bước:", step.title || "");
      if (title === null || !title.trim()) return;
      updatePlanPhases(planId, phases => {
        const ph = phases.find(p => p.id === phaseId);
        const s = ph && (ph.steps || []).find(x => x.id === stepId);
        if (s) s.title = title.trim();
      });
    };

    window.deletePhaseStep = function (planId, phaseId, stepId) {
      if (!confirm("Xoá bước này?")) return;
      updatePlanPhases(planId, phases => {
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) return;
        const index = (phase.steps || []).findIndex(s => s.id === stepId);
        if (index >= 0) phase.steps.splice(index, 1);
        rollUpPhaseStatus_(phase);
      });
    };

    window.togglePhaseStepDone = function (planId, phaseId, stepId) {
      updatePlanPhases(planId, phases => {
        const phase = phases.find(p => p.id === phaseId);
        const step = phase && (phase.steps || []).find(s => s.id === stepId);
        if (!step) return;
        
        const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
        const userName = user ? (user.name || user.username || 'Unknown') : 'Unknown';
        
        step.done = !step.done;
        step.doneAt = step.done ? new Date().toISOString() : "";
        step.doneBy = step.done ? userName : "";
        // Tick tay là ghi đè cả bước → đồng bộ doneByPeople để hiển thị không lệch
        step.doneByPeople = step.done ? (step.assignees || []).slice() : [];
        rollUpPhaseStatus_(phase);
      });
    };


// --- PORTED FROM TASK 4 ---
    function escapeAttr(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function phaseStepAssigneeEditorHtml(plan, phaseId, step) {
      const names = step.assignees || [];
      const chips = names.map(name => `
        <span class="step-chip" title="${escapeAttr(name)}">${escapeHtml(getShortName(name))}<button type="button" onclick="event.stopPropagation(); removePhaseStepAssignee('${escapeAttr(plan.id)}','${escapeAttr(phaseId)}','${escapeAttr(step.id)}','${escapeAttr(name)}')">&times;</button></span>
      `).join("");
      const taken = new Set(names.map(normalizePerson));
      const options = filterNamesByTag(knownPeopleNames().filter(n => !taken.has(normalizePerson(n))), plan.team);
      return `<div class="step-assignees">${chips}
        <select class="step-add-select" title="${plan.team ? 'Lọc theo tổ: ' + escapeAttr(plan.team) : 'Gán người'}"
                onclick="event.stopPropagation()" onchange="addPhaseStepAssignee('${escapeAttr(plan.id)}','${escapeAttr(phaseId)}','${escapeAttr(step.id)}', this.value); this.value='';">
          <option value="">+ Gán người</option>
          ${options.map(n => `<option value="${escapeAttr(n)}">${escapeHtml(getShortName(n))}</option>`).join("")}
          <option value="__other__">➕ Nhập tên khác...</option>
        </select></div>`;
    }

    window.addPhaseStepAssignee = function (planId, phaseId, stepId, rawName) {
      let name = rawName === "__other__" ? (prompt("Tên người thực hiện:") || "") : rawName;
      if (!name || !name.trim()) return;
      updatePlanPhases(planId, phases => {
        const phase = phases.find(p => p.id === phaseId);
        const step = phase && (phase.steps || []).find(s => s.id === stepId);
        if (!step) return;
        if (!step.assignees) step.assignees = [];
        if (!step.assignees.some(n => normalizePerson(n) === normalizePerson(name))) step.assignees.push(name.trim());
      });
    };

    window.removePhaseStepAssignee = function (planId, phaseId, stepId, name) {
      updatePlanPhases(planId, phases => {
        const phase = phases.find(p => p.id === phaseId);
        const step = phase && (phase.steps || []).find(s => s.id === stepId);
        if (step) step.assignees = (step.assignees || []).filter(n => normalizePerson(n) !== normalizePerson(name));
      });
    };

}
}
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGS & HANDOVER (PLAN A2)
// ─────────────────────────────────────────────────────────────────────────────
function openLogModal(planId) {
  document.getElementById('logPlanId').value = planId;
  document.getElementById('logResult').value = '';
  document.getElementById('logTeams').value = '';
  document.getElementById('modalLog').classList.add('is-open');
}
function closeLogModal() {
  document.getElementById('modalLog').classList.remove('is-open');
}
document.getElementById('btnCloseLog')?.addEventListener('click', closeLogModal);
document.getElementById('btnCancelLog')?.addEventListener('click', closeLogModal);
document.getElementById('modalLog')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeLogModal();
});

document.getElementById('btnSubmitLog')?.addEventListener('click', async () => {
  const planId = document.getElementById('logPlanId').value;
  const result = document.getElementById('logResult').value.trim();
  const teams = document.getElementById('logTeams').value;
  
  if (!teams) return showToast('Vui lòng chọn tổ thực hiện');
  if (!result) return showToast('Vui lòng nhập kết quả');
  
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const username = user ? (user.username || user.name || '') : 'Unknown';
  
  const logData = {
    planId: planId,
    result: result,
    teams: teams,
    recordedBy: username,
    createdAt: new Date().toISOString(),
    workDate: todayStr(),
    startTime: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})
  };
  
  const plan = allPlans.find(p => String(p.id) === String(planId));
  if (!plan) return showToast('Không tìm thấy việc');
  
  // Optimistic UI
  allLogs.push(logData);
  saveToCache();
  
  showToast('Đã lưu nhật ký', 'success');
  closeLogModal();
  renderDetailScreen(planId);
  showSyncToast();
  
  try {
    const res = await window.bdsApiFetch('savePlan', {
      ...plan,
      actionLog: JSON.stringify([logData])
    });
    hideSyncToast();
    if (!res || res.status !== 'success') {
      throw new Error(res?.message || 'Server error');
    }
  } catch (err) {
    hideSyncToast();
    showToast('Lỗi đồng bộ: ' + err.message, 'danger');
    allLogs.pop();
    saveToCache();
    renderDetailScreen(planId);
  }
});

function openHandoverModal(planId) {
  document.getElementById('handoverPlanId').value = planId;
  document.getElementById('handoverAssignee').value = '';
  document.getElementById('handoverNote').value = '';
  document.getElementById('modalHandover').classList.add('is-open');
}
function closeHandoverModal() {
  document.getElementById('modalHandover').classList.remove('is-open');
}
document.getElementById('btnCloseHandover')?.addEventListener('click', closeHandoverModal);
document.getElementById('btnCancelHandover')?.addEventListener('click', closeHandoverModal);
document.getElementById('modalHandover')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeHandoverModal();
});

document.getElementById('btnSubmitHandover')?.addEventListener('click', async () => {
  const planId = document.getElementById('handoverPlanId').value;
  const assignee = document.getElementById('handoverAssignee').value.trim();
  const note = document.getElementById('handoverNote').value.trim();
  
  if (!assignee) return showToast('Vui lòng nhập người/tổ nhận việc');
  
  const plan = allPlans.find(p => String(p.id) === String(planId));
  if (!plan) return showToast('Không tìm thấy việc');
  
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const username = user ? (user.username || user.name || '') : 'Unknown';
  
  const handoverData = {
    at: new Date().toISOString(),
    fromUser: username,
    toUser: assignee,
    progressNote: note,
    pending: note
  };
  
  const updatedPlan = { ...plan };
  updatedPlan.handover = JSON.stringify(handoverData);
  updatedPlan.assignee = assignee; // Update assignee directly
  
  // Optimistic UI
  const oldHandover = plan.handover;
  const oldAssignee = plan.assignee;
  Object.assign(plan, updatedPlan);
  saveToCache();
  
  showToast('Đã bàn giao', 'success');
  closeHandoverModal();
  renderDetailScreen(planId);
  renderMainBoard();
  showSyncToast();
  
  try {
    const res = await window.bdsApiFetch('savePlan', updatedPlan);
    hideSyncToast();
    if (!res || res.status !== 'success') {
      throw new Error(res?.message || 'Server error');
    }
  } catch (err) {
    hideSyncToast();
    showToast('Lỗi đồng bộ: ' + err.message, 'danger');
    plan.handover = oldHandover;
    plan.assignee = oldAssignee;
    plan.Assignee = oldAssignee;
    saveToCache();
    renderDetailScreen(planId);
    renderMainBoard();
  }
});

// Helper timeline
function renderTimelineHtml(planId) {
  const planLogs = allLogs.filter(l => String(l.planId) === String(planId));
  const plan = allPlans.find(p => String(p.id) === String(planId));
  
  let items = planLogs.map(l => ({
    when: l.workDate + (l.startTime ? ' ' + l.startTime : ''),
    who: l.recordedBy || '',
    text: l.result || '',
    tag: ''
  }));
  
  if (plan && plan.handover) {
    try {
      const ho = JSON.parse(plan.handover);
      items.push({
        when: String(ho.at).slice(0, 10) + ' ' + String(ho.at).slice(11, 16),
        who: ho.fromUser || '',
        text: 'Bàn giao cho ' + (ho.toUser || 'người nhận') + (ho.progressNote ? ': ' + ho.progressNote : ''),
        tag: 'Bàn giao'
      });
    } catch(e) {}
  }
  
  if (items.length === 0) {
    return `<div style="font-size: 0.85rem; color: var(--text-secondary);">Chưa có nhật ký/bàn giao.</div>`;
  }
  
  // Sort desc
  items.sort((a,b) => b.when.localeCompare(a.when));
  
  return items.map(it => `
    <div class="nk-tl-item" style="border-left: 2px solid var(--border-color); padding-left: 15px; position: relative; margin-bottom: 10px;">
      <div style="position: absolute; left: -6px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: ${it.tag === 'Bàn giao' ? 'var(--warning-color)' : 'var(--primary-color)'};"></div>
      <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 2px;">${escapeHtml(it.when)} · ${escapeHtml(it.who)}</div>
      <div style="font-size: 0.9rem; color: var(--text-primary);">
        ${it.tag ? `<strong>${escapeHtml(it.text)}</strong> <span style="background: var(--warning-light); color: var(--warning-color); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">${it.tag}</span>` : escapeHtml(it.text)}
      </div>
    </div>
  `).join('');
}

