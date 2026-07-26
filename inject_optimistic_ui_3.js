const fs = require('fs');
let html = fs.readFileSync('nhatky/index.html', 'utf8');

// Update submitLog
const searchSubmitLog = `  showToast('Đang lưu nhật ký...');
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
  }`;

const replaceSubmitLog = `  // Optimistic UI
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
  }`;

if (html.includes(searchSubmitLog)) {
  html = html.replace(searchSubmitLog, replaceSubmitLog);
}

// Update submitHandover
const searchSubmitHandover = `  showToast('Đang lưu bàn giao...');
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
  }`;

const replaceSubmitHandover = `  // Optimistic UI
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
  }`;

if (html.includes(searchSubmitHandover)) {
  html = html.replace(searchSubmitHandover, replaceSubmitHandover);
}

fs.writeFileSync('nhatky/index.html', html);
