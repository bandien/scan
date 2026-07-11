// ==========================================
// 04_Devices.gs — QUẢN LÝ THIẾT BỊ
// ==========================================

/** GET: Tra cứu thiết bị đơn lẻ theo UID + 3 lịch sử gần nhất */
function handleGetDevice(e) {
  const uid = e.parameter.uid;
  if (!uid) return contentResponse({ status: "error", message: "Missing UID" });

  const devSheet = getSheet(SHEETS.DEVICES);
  if (!devSheet) return contentResponse({ status: "error", message: "Devices sheet not found" });

  const devData = devSheet.getDataRange().getValues();
  let device = null;
  for (let i = 1; i < devData.length; i++) {
    if (String(devData[i][0]) === String(uid)) {
      device = mapDeviceRow(devData[i]);
      break;
    }
  }
  if (!device) return contentResponse({ status: "not_found", message: "Device not found" });

  // Attach recent history
  const logSheet = getSheet(SHEETS.LOGS);
  const logData  = logSheet ? logSheet.getDataRange().getValues() : [];
  device.history = [];
  for (let i = logData.length - 1; i > 0; i--) {
    if (String(logData[i][1]) === String(uid)) {
      device.history.push({ date: logData[i][0], notes: logData[i][3] });
      if (device.history.length >= 3) break;
    }
  }

  return contentResponse({ status: "success", data: device });
}

/** GET: Lịch sử bảo trì của một thiết bị (5 lần gần nhất) */
function handleGetDeviceHistory(e) {
  const { uid } = e.parameter;
  if (!uid) return contentResponse({ status: "error", message: "Missing UID" });

  const logSheet = getSheet(SHEETS.LOGS);
  if (!logSheet) return contentResponse({ status: "error", message: "Logs sheet not found" });

  const logData = logSheet.getDataRange().getValues();
  const history = [];
  for (let i = logData.length - 1; i >= 1; i--) {
    if (String(logData[i][1]) === String(uid)) {
      history.push({ time: logData[i][0], action: logData[i][2], notes: logData[i][3], user: logData[i][4] });
      if (history.length >= 5) break;
    }
  }
  return contentResponse({ status: "success", history });
}

/** GET: Export toàn bộ devices (để debug/migrate) */
function handleTempDumpDevices(e) {
  const targetId = e.parameter.sheetId || SHEET_ID;
  const sheet    = SpreadsheetApp.openById(targetId).getSheetByName(SHEETS.DEVICES);
  if (!sheet) return contentResponse({ status: "error", message: "Devices sheet not found" });
  const devices  = sheet.getDataRange().getValues().slice(1).filter(r => r[0]).map(mapDeviceRow);
  return contentResponse({ status: "success", devices });
}

/** POST: Thêm thiết bị mới */
function handleCreateDevice(params) {
  const sheet = getSheet(SHEETS.DEVICES);
  if (!sheet) return contentResponse({ status: "error", message: "Devices sheet not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(params.uid).trim())
      return contentResponse({ status: "error", message: "UID đã tồn tại!" });
  }

  const area   = params.area           || determineArea(params.name, params.location, data.length);
  const eqType = params.equipmentType  || determineEquipmentType(params.name, params.location, data.length);

  sheet.appendRow([
    params.uid || '', params.name || '', params.location || '',
    params.specs || '', params.cycle || 30, params.nextMaintenance || '',
    params.manager || 'Chưa phân công', params.shift || 'Chưa phân công',
    params.warningDays || 7, params.manufactureDate || '', params.installationDate || '',
    'IN', params.project || '', params.serialNumber || '', area, eqType
  ]);

  writeAuditLog(params.user || 'System', 'createDevice', params.uid, 'Created via Web App');
  sendAlert(`✨ Thiết bị mới: ${params.name} | UID: ${params.uid} | Vị trí: ${params.location}`);
  return contentResponse({ status: "success", message: "Đã thêm thiết bị mới" });
}

/** POST: Tạo hàng loạt thiết bị */
function handleCreateDevicesBatch(params) {
  const sheet = getSheet(SHEETS.DEVICES);
  if (!sheet) return contentResponse({ status: "error", message: "Devices sheet not found" });

  const data       = sheet.getDataRange().getValues();
  const existing   = new Set(data.slice(1).map(r => String(r[0]).trim()));
  const toAppend   = [];
  const skipped    = [];

  (params.devices || []).forEach(d => {
    const uid = String(d.uid).trim();
    if (existing.has(uid)) { skipped.push(uid); return; }
    const area   = d.area          || determineArea(d.name, d.location, data.length + toAppend.length);
    const eqType = d.equipmentType || determineEquipmentType(d.name, d.location, data.length + toAppend.length);
    toAppend.push([
      uid, d.name || '', d.location || '', d.specs || '', d.cycle || 30,
      d.nextMaintenance || '', d.manager || 'Chưa phân công', d.shift || 'Chưa phân công',
      d.warningDays || 7, d.manufactureDate || '', d.installationDate || '',
      'IN', d.project || '', d.serialNumber || '', area, eqType
    ]);
    existing.add(uid);
  });

  if (toAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, toAppend.length, 16).setValues(toAppend);
    writeAuditLog(params.user || 'System', 'createDevicesBatch', `${toAppend.length} devices`, 'Batch created');
    sendAlert(`⚡ Tạo hàng loạt: ${toAppend.length} thiết bị mới cho dự án "${params.project || 'N/A'}"`);
  }

  return contentResponse({ status: "success", addedCount: toAppend.length, skipped });
}

/** POST: Cập nhật thông tin thiết bị */
function handleUpdateDevice(params) {
  const sheet  = getSheet(SHEETS.DEVICES);
  if (!sheet) return contentResponse({ status: "error", message: "Devices sheet not found" });

  const rowIdx = findDeviceRow(params.uid);
  if (rowIdx === -1) return contentResponse({ status: "error", message: "Không tìm thấy thiết bị" });

  const set = (col, val) => { if (val !== undefined) sheet.getRange(rowIdx, col).setValue(val); };
  set(2,  params.name);           set(3,  params.location);
  set(5,  params.cycle || 30);    set(6,  params.nextMaintenance);
  set(7,  params.manager);        set(8,  params.shift);
  set(9,  params.warningDays);    set(10, params.manufactureDate);
  set(11, params.installationDate); set(13, params.project);
  set(14, params.serialNumber);   set(15, params.area);
  set(16, params.equipmentType);

  writeAuditLog(params.user || 'System', 'updateDevice', params.uid, 'Updated via Web App');
  return contentResponse({ status: "success", message: "Đã cập nhật thiết bị" });
}

/** POST: Ghi nhận IN/OUT kho */
function handleLogInOut(params) {
  const devSheet = getSheet(SHEETS.DEVICES);
  const logSheet = getSheet(SHEETS.LOGS);

  const rowIdx = findDeviceRow(params.uid);
  if (rowIdx !== -1) {
    devSheet.getRange(rowIdx, 12).setValue(params.status);
    if (params.newLocation) devSheet.getRange(rowIdx, 3).setValue(params.newLocation);
  }

  logSheet.appendRow([new Date(), params.uid, params.status, params.notes || '', params.user || 'Mobile User']);
  return contentResponse({ status: "success", updated: rowIdx !== -1 });
}

/** POST: Ghi checklist bảo trì (default POST action) + cập nhật ngày bảo trì tiếp */
function handleChecklistSubmit(params) {
  const logSheet = getSheet(SHEETS.LOGS);

  // Lưu ảnh lên Drive nếu có
  let imageUrl = "";
  if (params.image && params.image.base64) {
    try {
      const folderName = "QR_Maintenance_Images";
      let folders = DriveApp.getFoldersByName(folderName);
      const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      const blob   = Utilities.newBlob(
        Utilities.base64Decode(params.image.base64),
        params.image.mimeType || "image/jpeg",
        `IMG_${params.uid}_${Date.now()}`
      );
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      imageUrl = file.getUrl();
    } catch (err) { imageUrl = "Error: " + err.toString(); }
  }

  logSheet.appendRow([
    new Date(), params.uid, JSON.stringify(params.items),
    params.notes, params.user || "Mobile User", imageUrl
  ]);

  // Cập nhật ngày bảo trì kế tiếp
  const devSheet = getSheet(SHEETS.DEVICES);
  const rowIdx   = findDeviceRow(params.uid);
  if (rowIdx !== -1) {
    const cycle    = devSheet.getRange(rowIdx, 5).getValue() || 30;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + parseInt(cycle));
    devSheet.getRange(rowIdx, 6).setValue(nextDate);
  }

  return contentResponse({ status: "success" });
}
