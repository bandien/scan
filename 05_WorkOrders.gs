// ==========================================
// 05_WorkOrders.gs — QUẢN LÝ PHIẾU CÔNG VIỆC
// ==========================================

function handleGetWorkOrders(e) {
  const { role, username } = e.parameter;
  const sheet = getSheet(SHEETS.WORK_ORDERS);
  if (!sheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });

  const data = sheet.getDataRange().getValues().slice(1);
  const workOrders = data.filter(r => r[0]).map(r => ({
    woId: r[0], type: r[1], priority: r[2], status: r[3],
    assetUID: r[4], assignedTo: r[5], dueDate: r[6], description: r[7],
    partsUsed: r[8], createdAt: r[9], cost: r[10] || 0,
    subTasks: r[11] || '', project: r[12] || '', requestSource: r[13] || "Noi bo"
  })).filter(wo => {
    if (role === 'Technician' && username)
      return String(wo.assignedTo).trim().toLowerCase() === String(username).trim().toLowerCase();
    return true;
  });

  return contentResponse({ status: "success", workOrders });
}

function handleCreateWO(params) {
  if (!String(params.description || '').trim())
    return contentResponse({ status: "error", message: "Mô tả không được để trống" });

  const err = validateWOPayload(params);
  if (err) return contentResponse({ status: "error", message: err });

  const sheet = getSheet(SHEETS.WORK_ORDERS);
  if (!sheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });

  const now    = new Date();
  const yyyymm = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
  const woId   = 'WO-' + yyyymm + '-' + String(sheet.getLastRow()).padStart(5, '0');

  let subTasks = '';
  if (params.subTasks) {
    try { subTasks = JSON.stringify(JSON.parse(params.subTasks)); }
    catch (_) {
      subTasks = JSON.stringify(
        String(params.subTasks).split('\n').filter(l => l.trim()).map(l => ({ title: l.trim(), done: false }))
      );
    }
  }

  sheet.appendRow([
    woId, params.type || '', params.priority || 'Medium', params.status || 'New',
    params.assetUID || '', params.assignedTo || '', params.dueDate || '',
    params.description || '', params.partsUsed || '', now,
    Number(params.cost) || 0, subTasks, params.project || '', params.requestSource || "Noi bo"
  ]);

  writeAuditLog(params.user || 'System', 'createWO', woId, 'Created Work Order');
  return contentResponse({ status: "success", woId });
}

function handleUpdateWOStatus(params) {
  const targetId = params.woId || params.wo_id;
  if (!targetId) return contentResponse({ status: "error", message: "Missing woId" });
  if (!params.status) return contentResponse({ status: "error", message: "Missing status" });

  const sheet = getSheet(SHEETS.WORK_ORDERS);
  if (!sheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(targetId).trim()) {
      sheet.getRange(i + 1, 4).setValue(params.status);
      const detail = params.notes ? `${params.status} — ${params.notes}` : params.status;
      writeAuditLog(params.user || 'System', 'updateWOStatus', targetId, detail);
      return contentResponse({ status: "success" });
    }
  }
  return contentResponse({ status: "error", message: "Work Order not found" });
}

function handleUpdateWO(params) {
  const targetId = params.woId || params.wo_id;
  if (!targetId) return contentResponse({ status: "error", message: "Missing woId" });

  const err = validateWOPayload(params);
  if (err) return contentResponse({ status: "error", message: err });

  const sheet = getSheet(SHEETS.WORK_ORDERS);
  if (!sheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(targetId).trim()) {
      const row = i + 1;
      const set = (col, val) => { if (val !== undefined) sheet.getRange(row, col).setValue(val); };
      set(2, params.type);     set(3, params.priority); set(4, params.status);
      set(5, params.assetUID); set(6, params.assignedTo); set(7, params.dueDate);
      set(8, params.description); set(9, params.partsUsed); set(11, Number(params.cost) || 0);
      if (params.subTasks !== undefined) {
        let st = params.subTasks;
        if (typeof st !== 'string') st = JSON.stringify(st);
        sheet.getRange(row, 12).setValue(st);
      }
      set(13, params.project);
      writeAuditLog(params.user || 'System', 'updateWO', targetId, 'Updated fields');
      return contentResponse({ status: "success" });
    }
  }
  return contentResponse({ status: "error", message: "Work Order not found" });
}

function handleDeleteWO(params) {
  const targetId = params.woId || params.wo_id;
  if (!targetId) return contentResponse({ status: "error", message: "Missing woId" });

  const sheet = getSheet(SHEETS.WORK_ORDERS);
  if (!sheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(targetId).trim()) {
      sheet.deleteRow(i + 1);
      writeAuditLog(params.user || 'System', 'deleteWO', targetId, 'Deleted');
      return contentResponse({ status: "success" });
    }
  }
  return contentResponse({ status: "error", message: "Work Order not found" });
}
