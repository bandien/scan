// ==========================================
// 08_Checklists.gs — QUẢN LÝ MẪU CHECKLIST
// ==========================================

function handleCreateChecklistItem(params) {
  const sheet = getSheet(SHEETS.CHECKLISTS);
  if (!sheet) return contentResponse({ status: "error", message: "Checklists sheet not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][0]).trim().toLowerCase() === String(params.type).trim().toLowerCase() &&
      String(data[i][1]).trim() === String(params.id).trim()
    ) return contentResponse({ status: "error", message: "ID cho loại thiết bị này đã tồn tại!" });
  }

  sheet.appendRow([
    String(params.type).trim().toLowerCase(),
    String(params.id).trim(),
    params.title || '',
    params.desc  || ''
  ]);
  writeAuditLog(params.user || 'System', 'createChecklistItem', params.id, `Created: ${params.title} [${params.type}]`);
  return contentResponse({ status: "success", message: "Đã thêm hạng mục" });
}

function handleUpdateChecklistItem(params) {
  const sheet = getSheet(SHEETS.CHECKLISTS);
  if (!sheet) return contentResponse({ status: "error", message: "Checklists sheet not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][0]).trim().toLowerCase() === String(params.originalType).trim().toLowerCase() &&
      String(data[i][1]).trim() === String(params.originalId).trim()
    ) {
      sheet.getRange(i+1, 1).setValue(String(params.type).trim().toLowerCase());
      sheet.getRange(i+1, 2).setValue(String(params.id).trim());
      sheet.getRange(i+1, 3).setValue(params.title || '');
      sheet.getRange(i+1, 4).setValue(params.desc  || '');
      writeAuditLog(params.user || 'System', 'updateChecklistItem', params.id, `Updated: ${params.title}`);
      return contentResponse({ status: "success", message: "Đã cập nhật hạng mục" });
    }
  }
  return contentResponse({ status: "error", message: "Hạng mục không tìm thấy" });
}

function handleDeleteChecklistItem(params) {
  const sheet = getSheet(SHEETS.CHECKLISTS);
  if (!sheet) return contentResponse({ status: "error", message: "Checklists sheet not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][0]).trim().toLowerCase() === String(params.type).trim().toLowerCase() &&
      String(data[i][1]).trim() === String(params.id).trim()
    ) {
      sheet.deleteRow(i + 1);
      writeAuditLog(params.user || 'System', 'deleteChecklistItem', params.id, `Deleted [${params.type}]`);
      return contentResponse({ status: "success", message: "Đã xóa hạng mục" });
    }
  }
  return contentResponse({ status: "error", message: "Hạng mục không tìm thấy" });
}
