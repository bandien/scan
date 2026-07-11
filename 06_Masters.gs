// ==========================================
// 06_Masters.gs �� DỮ LIỆU DANH MỤC
// (Projects, Shifts, Locations)
// ==========================================

// ── PROJECTS ────────────────────────────────────────────────────────────────

function handleGetProjects(e) {
  const sheet = getSheet(SHEETS.PROJECTS);
  if (!sheet) return contentResponse({ status: "error", message: "Projects sheet not found" });
  const projects = sheet.getDataRange().getValues().slice(1).filter(r => r[0]).map(r => ({
    id: r[0], name: r[1], status: r[2] || "Active", startDate: r[3] || "", endDate: r[4] || ""
  }));
  return contentResponse({ status: "success", projects });
}

function handleCreateProject(params) {
  if (!String(params.name || '').trim()) return contentResponse({ status: "error", message: "Tên dự án không được để trống" });
  const sheet = getSheet(SHEETS.PROJECTS);
  if (!sheet) return contentResponse({ status: "error", message: "Projects sheet not found" });
  const id = genId("PRJ", sheet.getLastRow(), 3);
  sheet.appendRow([id, params.name.trim(), params.status || "Active", params.startDate || "", params.endDate || ""]);
  writeAuditLog(params.user || "System", "createProject", id, "Created: " + params.name);
  return contentResponse({ status: "success", projectId: id, name: params.name.trim() });
}

function handleUpdateProject(params) {
  if (!params.projectId) return contentResponse({ status: "error", message: "Thiếu mã dự án" });
  if (!String(params.name || '').trim()) return contentResponse({ status: "error", message: "Tên không được để trống" });
  const sheet = getSheet(SHEETS.PROJECTS);
  if (!sheet) return contentResponse({ status: "error", message: "Projects sheet not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(params.projectId).trim()) {
      const oldName = data[i][1]; const newName = params.name.trim();
      sheet.getRange(i+1, 2).setValue(newName);
      sheet.getRange(i+1, 3).setValue(params.status || "Active");
      sheet.getRange(i+1, 4).setValue(params.startDate || "");
      sheet.getRange(i+1, 5).setValue(params.endDate || "");
      if (oldName !== newName) syncDeviceField(12, oldName, newName); // Col 13 = Project
      writeAuditLog(params.user || "System", "updateProject", params.projectId, "Updated: " + newName);
      return contentResponse({ status: "success", projectId: params.projectId, name: newName });
    }
  }
  return contentResponse({ status: "error", message: "Không tìm thấy dự ��n" });
}

function handleDeleteProject(params) {
  return deleteFromSheet(SHEETS.PROJECTS, params.projectId, "projectId",
    (name) => syncDeviceField(12, name, ""), // clear project col
    params.user, "Deleted project");
}

// ── SHIFTS ───────────────────────────────────────────────────────────────────

function handleGetShifts(e) {
  const sheet = getSheet(SHEETS.SHIFTS);
  if (!sheet) return contentResponse({ status: "error", message: "Shifts sheet not found" });
  const shifts = sheet.getDataRange().getValues().slice(1).filter(r => r[0]).map(r => ({
    id: r[0], name: r[1], description: r[2] || "", status: r[3] || "Active"
  }));
  return contentResponse({ status: "success", shifts });
}

function handleCreateShift(params) {
  if (!String(params.name || '').trim()) return contentResponse({ status: "error", message: "Tên ca trực không được để trống" });
  const sheet = getSheet(SHEETS.SHIFTS);
  if (!sheet) return contentResponse({ status: "error", message: "Shifts sheet not found" });
  const id = genId("SHF", sheet.getLastRow(), 3);
  sheet.appendRow([id, params.name.trim(), params.description || "", params.status || "Active"]);
  writeAuditLog(params.user || "System", "createShift", id, "Created: " + params.name);
  return contentResponse({ status: "success", shiftId: id, name: params.name.trim() });
}

function handleUpdateShift(params) {
  if (!params.shiftId) return contentResponse({ status: "error", message: "Thiếu mã ca trực" });
  if (!String(params.name || '').trim()) return contentResponse({ status: "error", message: "Tên không được để trống" });
  const sheet = getSheet(SHEETS.SHIFTS);
  if (!sheet) return contentResponse({ status: "error", message: "Shifts sheet not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(params.shiftId).trim()) {
      const oldName = data[i][1]; const newName = params.name.trim();
      sheet.getRange(i+1, 2).setValue(newName);
      sheet.getRange(i+1, 3).setValue(params.description || "");
      sheet.getRange(i+1, 4).setValue(params.status || "Active");
      if (oldName !== newName) syncDeviceField(7, oldName, newName); // Col 8 = Shift
      writeAuditLog(params.user || "System", "updateShift", params.shiftId, "Updated: " + newName);
      return contentResponse({ status: "success", shiftId: params.shiftId, name: newName });
    }
  }
  return contentResponse({ status: "error", message: "Không tìm thấy ca trực" });
}

function handleDeleteShift(params) {
  return deleteFromSheet(SHEETS.SHIFTS, params.shiftId, "shiftId",
    (name) => syncDeviceField(7, name, "Chưa phân công"),
    params.user, "Deleted shift");
}

// ── LOCATIONS ────────────────────────────────────────────────────────────────
// Locations được lưu dưới dạng hàng thiết bị đặc biệt trong sheet Devices

function handleCreateLocation(params) {
  const locUid = String(params.uid || "").trim().toUpperCase();
  if (!locUid) return contentResponse({ status: "error", message: "Mã địa điểm không được để trống" });
  if (!String(params.name || '').trim()) return contentResponse({ status: "error", message: "Tên địa điểm không được để trống" });

  const sheet = getSheet(SHEETS.DEVICES);
  if (!sheet) return contentResponse({ status: "error", message: "Devices sheet not found" });

  const data = sheet.getDataRange().getValues();
  if (data.slice(1).some(r => String(r[0]).trim().toUpperCase() === locUid))
    return contentResponse({ status: "error", message: "Mã địa đi���m đã tồn tại!" });

  sheet.appendRow([locUid, params.name.trim(), params.name.trim(),
    "Địa điểm lắp đặt", 30, "", "Chưa phân công", "Chưa phân công", 7, "", "", "IN", "", "", "", ""]);
  writeAuditLog(params.user || "System", "createLocation", locUid, "Created: " + params.name);
  return contentResponse({ status: "success", uid: locUid, name: params.name.trim() });
}

function handleUpdateLocation(params) {
  if (!params.uid) return contentResponse({ status: "error", message: "Thiếu mã địa điểm" });
  if (!String(params.name || '').trim()) return contentResponse({ status: "error", message: "Tên không được để trống" });

  const sheet  = getSheet(SHEETS.DEVICES);
  const rowIdx = findDeviceRow(params.uid);
  if (rowIdx === -1) return contentResponse({ status: "error", message: "Không tìm thấy địa điểm" });

  const oldName = sheet.getRange(rowIdx, 2).getValue();
  const newName = params.name.trim();
  sheet.getRange(rowIdx, 2).setValue(newName);
  sheet.getRange(rowIdx, 3).setValue(newName);

  // Cập nhật Location column (col 3) của mọi thiết bị đang ở địa điểm này
  if (oldName !== newName) {
    const data = sheet.getDataRange().getValues();
    for (let j = 1; j < data.length; j++) {
      if (j + 1 !== rowIdx && String(data[j][2]).trim() === String(oldName).trim())
        sheet.getRange(j + 1, 3).setValue(newName);
    }
  }

  writeAuditLog(params.user || "System", "updateLocation", params.uid, `${oldName} → ${newName}`);
  return contentResponse({ status: "success", uid: params.uid, name: newName });
}

function handleDeleteLocation(params) {
  if (!params.uid) return contentResponse({ status: "error", message: "Thiếu mã địa điểm" });

  const sheet  = getSheet(SHEETS.DEVICES);
  const rowIdx = findDeviceRow(params.uid);
  if (rowIdx === -1) return contentResponse({ status: "error", message: "Không tìm thấy địa điểm" });

  const locName = sheet.getRange(rowIdx, 2).getValue();
  const data    = sheet.getDataRange().getValues();
  for (let j = 1; j < data.length; j++) {
    if (j + 1 !== rowIdx && String(data[j][2]).trim() === String(locName).trim())
      sheet.getRange(j + 1, 3).setValue("Chưa phân công");
  }

  sheet.deleteRow(rowIdx);
  writeAuditLog(params.user || "System", "deleteLocation", params.uid, "Deleted: " + locName);
  return contentResponse({ status: "success", message: "Đã xóa địa điểm" });
}

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Tạo ID dạng PREFIX-YYYYMM-NNN */
function genId(prefix, lastRow, pad) {
  const now = new Date();
  const yyyymm = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, "0");
  return `${prefix}-${yyyymm}-${String(lastRow).padStart(pad, "0")}`;
}

/** Đồng bộ đổi tên/xóa một giá trị trong cột devices (0-based col index) */
function syncDeviceField(colIndex, oldValue, newValue) {
  const sheet = getSheet(SHEETS.DEVICES);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]).trim() === String(oldValue).trim())
      sheet.getRange(i + 1, colIndex + 1).setValue(newValue);
  }
}

/** Xóa 1 hàng từ sheet theo ID (cột A), và chạy callback với tên của row đó */
function deleteFromSheet(sheetName, id, idField, onDelete, user, logMsg) {
  if (!id) return contentResponse({ status: "error", message: `Thiếu ${idField}` });
  const sheet = getSheet(sheetName);
  if (!sheet) return contentResponse({ status: "error", message: `${sheetName} sheet not found` });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      const name = data[i][1];
      if (onDelete) onDelete(name);
      sheet.deleteRow(i + 1);
      writeAuditLog(user || "System", logMsg, id, "Deleted: " + name);
      return contentResponse({ status: "success", message: "Đã xóa thành công" });
    }
  }
  return contentResponse({ status: "error", message: "Không tìm thấy mục cần xóa" });
}
