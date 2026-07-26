const fs = require('fs');
let html = fs.readFileSync('nhatky/index.html', 'utf8');

// Update markPlanDone
const oldMarkPlanDone = `async function markPlanDone(plan, btn) {
  const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
  const userName = user ? (user.name || user.username || 'Ẩn danh') : 'Ẩn danh';
  const id   = planField(plan, 'PlanID', 'id', 'planId');

  btn.disabled = true;
  btn.textContent = '⏳ Đang cập nhật...';

  try {
    const payload = { ...plan, status: 'Hoàn thành', updatedBy: userName };
    await window.bdsApiPost('savePlan', payload);
    plan.Status = 'Hoàn thành';
    showToast('Đã cập nhật: Hoàn thành ✓', 'success');
    navigateToMain();
    loadPlans();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'danger');
    btn.disabled = false;
    btn.textContent = '✓ Nghiệm thu · Chốt sổ';
  }
}`;

const newMarkPlanDone = `async function markPlanDone(plan, btn) {
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
}`;

if (html.includes(oldMarkPlanDone)) {
  html = html.replace(oldMarkPlanDone, newMarkPlanDone);
}

// Update saveNewTask
const searchSaveNewTask = `  const btn = document.getElementById('btnSaveNewTask');
  btn.disabled = true;
  btn.textContent = '⏳ Đang lưu...';

  try {
    await window.bdsApiPost('savePlan', payload);
    showToast('Đã tạo công việc mới ✓', 'success');
    closeNewTaskModal();
    // Reset form
    ['fTask','fArea','fAssignee','fSourceText'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.value = '';
    });
    loadPlans();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Tạo việc';
  }`;

const replaceSaveNewTask = `  const btn = document.getElementById('btnSaveNewTask');
  
  // Optimistic Update
  const fakeId = 'TEMP_' + Date.now();
  const fakePlan = { ...payload, PlanID: fakeId, id: fakeId, Status: 'Đang làm' };
  allPlans.unshift(fakePlan);
  saveToCache();
  
  showToast('Đã tạo công việc mới ✓', 'success');
  closeNewTaskModal();
  renderMainBoard();
  showSyncToast();
  
  // Reset form
  ['fTask','fArea','fAssignee','fSourceText'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });

  try {
    const res = await window.bdsApiPost('savePlan', payload);
    // Background refresh
    window.bdsApiFetch('getPlans', { user: uName }).then(r => {
      if (r && r.status === 'success' && r.plans) {
        allPlans = r.plans;
        allLogs = r.logs || [];
        saveToCache();
        renderMainBoard();
      }
    });
    hideSyncToast();
  } catch (err) {
    hideSyncToast();
    showToast('Lỗi đồng bộ tạo việc: ' + err.message, 'danger');
    allPlans = allPlans.filter(p => p.id !== fakeId && p.PlanID !== fakeId);
    saveToCache();
    renderMainBoard();
  }`;

if (html.includes(searchSaveNewTask)) {
  html = html.replace(searchSaveNewTask, replaceSaveNewTask);
}

fs.writeFileSync('nhatky/index.html', html);
