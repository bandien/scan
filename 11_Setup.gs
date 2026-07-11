// ==========================================
// 11_Setup.gs — CÀI ĐẶT & CHẨN ĐOÁN
// ==========================================
// Chạy các hàm này trong Script Editor để cấu hình ban đầu.

/** Hàm cấp quyền + kiểm tra tất cả sheet cần thiết */
function testConnection() {
  Logger.log("🚀 BanDienScan Backend v3 — Chẩn đoán hệ thống...");
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    Logger.log("✅ Kết nối Spreadsheet: " + ss.getName() + " | ID: " + SHEET_ID);

    const required = Object.values(SHEETS);
    required.forEach(name => {
      const s = ss.getSheetByName(name);
      Logger.log(s ? `✅ [${name}]: ${s.getLastRow()} dòng` : `❌ [${name}]: KHÔNG TỒN TẠI`);
    });
    Logger.log("💡 Nếu có sheet ❌, hãy chạy setupAllSheets() để tạo tự động.");
  } catch (e) {
    Logger.log("❌ Lỗi kết nối: " + e.toString());
  }
}

/** Khởi tạo TẤT CẢ sheet cần thiết nếu chưa có */
function setupAllSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  ensureSheet(ss, SHEETS.DEVICES, [
    "UID","Name","Location","Specs","Cycle","NextMaintenance",
    "Manager","Shift","WarningDays","ManufactureDate","InstallationDate",
    "Status","Project","SerialNumber","Area","EquipmentType"
  ]);
  ensureSheet(ss, SHEETS.LOGS, ["Timestamp","UID","Items","Notes","User","ImageUrl"]);
  ensureSheet(ss, SHEETS.USERS, ["Username","FullName","PasswordHash","Role","Teams","CreatedAt","LastLoginAt"]);
  ensureSheet(ss, SHEETS.CHECKLISTS, ["Type","ID","Title","Description"]);
  ensureSheet(ss, SHEETS.WORK_ORDERS, [
    "WO_ID","Type","Priority","Status","AssetUID","AssignedTo",
    "DueDate","Description","PartsUsed","CreatedAt","Cost","SubTasks","Project","RequestSource"
  ]);
  ensureSheet(ss, SHEETS.AUDIT_LOG, ["Timestamp","User","Action","Target","Details"]);
  ensureSheet(ss, SHEETS.PROJECTS, ["ProjectID","Name","Status","StartDate","EndDate"]);
  ensureSheet(ss, SHEETS.SHIFTS, ["ShiftID","Name","Description","Status"]);
  ensureSheet(ss, SHEETS.INVENTORY, ["PartCode","Name","Stock","MinStock","Unit"]);
  ensureSheet(ss, SHEETS.STAFF, ["StaffID","Name","Position","Department","Phone"]);

  // Phase 11 — Metering
  setupMeteringSheets(ss);

  Logger.log("🎉 setupAllSheets hoàn tất. Tất cả sheet đã sẵn sàng.");
}

/** Khởi tạo 2 sheet Metering (Phase 11) */
function setupMeteringSheets(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SHEET_ID);
  ensureSheet(ss, SHEETS.METER_POINTS, [
    "MeterID","Type","Name","Location","Multiplier","Threshold","Unit","Notes","LastReading","LastDate"
  ]);
  ensureSheet(ss, SHEETS.METER_READINGS, [
    "ReadingID","MeterID","Value","PhotoUrl","Timestamp","User","Calculated","Alert"
  ]);
  Logger.log("✅ Metering sheets initialized: MeterPoints, MeterReadings");
}

/** GET route handler — gọi từ Router */
function handleSetupHeaders(e) {
  try {
    setupAllSheets();
    return contentResponse({ status: "success", message: "All sheets initialized (v3)" });
  } catch (err) {
    return contentResponse({ status: "error", message: err.toString() });
  }
}

/** GET: Data dump + migration */
function handleMigrateDevicesData(e) {
  try {
    const sheet = getSheet(SHEETS.DEVICES);
    if (!sheet) return contentResponse({ status: "error", message: "Devices sheet not found" });

    sheet.getRange(1, 15).setValue("Area");
    sheet.getRange(1, 16).setValue("EquipmentType");

    const data    = sheet.getDataRange().getValues();
    let   updated = 0;
    for (let i = 1; i < data.length; i++) {
      const area   = determineArea(data[i][1], data[i][2], i);
      const eqType = determineEquipmentType(data[i][1], data[i][2], i);
      sheet.getRange(i+1, 15).setValue(area);
      sheet.getRange(i+1, 16).setValue(eqType);
      updated++;
    }
    return contentResponse({ status: "success", message: `Migrated ${updated} rows.` });
  } catch (err) {
    return contentResponse({ status: "error", message: err.toString() });
  }
}

// ── Internal helper ───────────────────────────────────────────────────────────
function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    Logger.log("  ➕ Tạo mới sheet: " + name);
  }
  if (headers && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  }
  return sheet;
}

/** Kiểm tra nhanh endpoint từ Script Editor */
function ping() {
  return contentResponse({ status: "success", message: "Pong! BanDienScan Backend v3 active." });
}
