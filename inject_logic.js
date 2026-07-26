const fs = require('fs');
let html = fs.readFileSync('nhatky/index.html', 'utf8');

// 1. Define allLogs global variable
if (!html.includes('let allLogs = [];')) {
  html = html.replace('let allPlans = [];', 'let allPlans = [];\nlet allLogs = [];');
}

// 2. Capture res.logs in loadPlans
if (!html.includes('allLogs = res.logs || [];')) {
  html = html.replace('allPlans = res.plans;', 'allPlans = res.plans;\n      allLogs = res.logs || [];');
}

// 3. Inject JS logic for Logs and Handover (at the end before </body>)
const jsLogic = `
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
  
  showToast('Đang lưu nhật ký...');
  closeLogModal();
  try {
    const res = await window.bdsApiFetch('savePlan', {
      ...plan,
      actionLog: JSON.stringify([logData]) // fake action to trigger backend
    });
    if (res && res.status === 'success') {
      showToast('Đã lưu nhật ký', 'success');
      // Tạm thời push vào local để render
      allLogs.push(logData);
      renderDetailScreen(planId);
    } else {
      showToast('Lỗi: ' + res?.message);
    }
  } catch (err) {
    showToast('Lỗi kết nối: ' + err.message);
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
  
  showToast('Đang lưu bàn giao...');
  closeHandoverModal();
  try {
    const res = await window.bdsApiFetch('savePlan', updatedPlan);
    if (res && res.status === 'success') {
      showToast('Đã bàn giao', 'success');
      Object.assign(plan, updatedPlan);
      renderDetailScreen(planId);
      renderMainBoard();
    } else {
      showToast('Lỗi: ' + res?.message);
    }
  } catch (err) {
    showToast('Lỗi kết nối: ' + err.message);
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
    return \`<div style="font-size: 0.85rem; color: var(--text-secondary);">Chưa có nhật ký/bàn giao.</div>\`;
  }
  
  // Sort desc
  items.sort((a,b) => b.when.localeCompare(a.when));
  
  return items.map(it => \`
    <div class="nk-tl-item" style="border-left: 2px solid var(--border-color); padding-left: 15px; position: relative; margin-bottom: 10px;">
      <div style="position: absolute; left: -6px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: \${it.tag === 'Bàn giao' ? 'var(--warning-color)' : 'var(--primary-color)'};"></div>
      <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 2px;">\${escapeHtml(it.when)} · \${escapeHtml(it.who)}</div>
      <div style="font-size: 0.9rem; color: var(--text-primary);">
        \${it.tag ? \`<strong>\${escapeHtml(it.text)}</strong> <span style="background: var(--warning-light); color: var(--warning-color); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">\${it.tag}</span>\` : escapeHtml(it.text)}
      </div>
    </div>
  \`).join('');
}
`;

if (!html.includes('function openLogModal(')) {
  html = html.replace('</script>\n</body>', jsLogic + '\n</script>\n</body>');
}

// 4. Update renderDetailScreen to use openLogModal, openHandoverModal, and renderTimelineHtml
const search3 = `  // ── Khu 3: Nhật ký ──────────────────────────────────────────────────────
  let sec3 = \`
    <div class="nk-section">
      <div class="nk-section__label"><span class="n">③</span> Nhật ký & Phát sinh</div>
      <div class="nk-tl">
        <div class="nk-tl-item">
          <div class="nk-tl-when">\${escapeHtml(date)} · \${escapeHtml(sender)}</div>
          <div class="nk-tl-text">Tạo công việc.</div>
        </div>
      </div>
      <button class="nk-attach" onclick="showToast('Tính năng đang hoàn thiện','')">＋ Ghi nhật ký</button>
    </div>\`;`;

const replace3 = `  // ── Khu 3: Nhật ký ──────────────────────────────────────────────────────
  let sec3 = \`
    <div class="nk-section">
      <div class="nk-section__label"><span class="n">③</span> Nhật ký & Phát sinh</div>
      <div class="nk-tl" style="margin-top: 10px;">
        \${renderTimelineHtml(id)}
      </div>
      <button class="nk-btn nk-btn--outline" style="margin-top: 10px; width: 100%; border-style: dashed;" onclick="openLogModal('\${escapeAttr(String(id))}')">＋ Ghi nhật ký</button>
    </div>\`;`;

if (html.includes(search3)) {
  html = html.replace(search3, replace3);
}

const search4 = `<button class="nk-btn nk-btn--ghost" onclick="showToast('Tính năng đang hoàn thiện','')">⇄ Bàn giao</button>`;
const replace4 = `<button class="nk-btn nk-btn--ghost" onclick="openHandoverModal('\${escapeAttr(String(id))}')">⇄ Bàn giao</button>`;
if (html.includes(search4)) {
  html = html.replace(search4, replace4);
}

fs.writeFileSync('nhatky/index.html', html);
