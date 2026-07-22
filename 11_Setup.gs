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
  // LOGS: Bổ sung 3 cột ERPNext ở cuối để đồng bộ
  const logsSheet = ensureSheet(ss, SHEETS.LOGS, ["Timestamp","UID","Items","Notes","User","ImageUrl","SyncStatus","ERPNextID","SyncMessage"]);
  ensureColumnsExist_(logsSheet, ["SyncStatus", "ERPNextID", "SyncMessage"]);

  const userSheet = ensureSheet(ss, SHEETS.USERS, ["Username","PIN","Role","Teams","Ghi chú","Cập nhật lúc","Cập nhật bởi","Phone","Họ và tên","Tên thường gọi"]);
  if (typeof ensureUserAdminColumns_ === "function") ensureUserAdminColumns_(userSheet);
  ensureSheet(ss, SHEETS.CHECKLISTS, ["Type","ID","Title","Description"]);
  ensureSheet(ss, SHEETS.WORK_ORDERS, [
    "WO_ID","Type","Priority","Status","AssetUID","AssignedTo",
    "DueDate","Description","PartsUsed","CreatedAt","Cost","SubTasks","Project","RequestSource"
  ]);
  ensureSheet(ss, SHEETS.AUDIT_LOG, ["Timestamp","User","Action","Target","Details"]);
  ensureSheet(ss, SHEETS.PROJECTS, ["ProjectID","Name","Status","StartDate","EndDate"]);
  ensureSheet(ss, SHEETS.SHIFTS, ["ShiftID","Name","Description","Status"]);
  ensureSheet(ss, SHEETS.INVENTORY, ["PartCode","Name","Stock","MinStock","Unit"]);

  // ERP Party Master Sheets (SSOT)
  ensureSheet(ss, SHEETS.KH_NCC, ["ID","Loai","Name","ContactPerson","Phone","Email","TaxCode","Address","Labels"]);
  ensureSheet(ss, SHEETS.PERSONAL_CONTACTS, ["ID","OwnerUsername","FullName","Phone","DeptOrNote","Email","UpdatedAt"]);

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
  
  // METER_READINGS: Bổ sung 3 cột ERPNext ở cuối để đồng bộ
  const readingSheet = ensureSheet(ss, SHEETS.METER_READINGS, [
    "ReadingID","MeterID","Value","PhotoUrl","Timestamp","User","Calculated","Alert","SyncStatus","ERPNextID","SyncMessage"
  ]);
  ensureColumnsExist_(readingSheet, ["SyncStatus", "ERPNextID", "SyncMessage"]);

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

/** GET/POST: Tự động tra cứu & cập nhật Tên thường gọi cho toàn bộ tài khoản trong sheet Users */
function handlePopulateShortNames(e) {
  try {
    const sheet = getSheet(SHEETS.USERS);
    if (!sheet) return contentResponse({ status: "error", message: "Không tìm thấy sheet Users" });

    const prepared = ensureUserAdminColumns_(sheet);
    const data = prepared.data;
    const schema = prepared.schema;

    if (schema.shortNameIndex < 0) {
      return contentResponse({ status: "error", message: "Cột Tên thường gọi chưa được khởi tạo" });
    }

    let payloadMap = {};
    if (e && e.postData && e.postData.contents) {
      try {
        const body = JSON.parse(e.postData.contents);
        payloadMap = body.map || body.mapping || {};
      } catch (_) {}
    }

    const rows = data.slice(1);
    let updatedCount = 0;
    const computedList = [];

    function formatShortName_(rawName) {
      if (!rawName) return "";
      const raw = String(rawName).trim();
      if (!raw) return "";
      const parts = raw.split(/\s+/);
      if (parts.length <= 2) return raw;
      const mainName = parts[parts.length - 1];
      const initials = parts.slice(0, parts.length - 1).map(function(p) { return p.charAt(0).toUpperCase(); }).join("");
      return mainName + " " + initials;
    }

    rows.forEach(function(row, idx) {
      const username = String(row[schema.usernameIndex] || "").trim();
      const fullName = schema.fullNameIndex >= 0 ? String(row[schema.fullNameIndex] || "").trim() : "";
      const existingShort = schema.shortNameIndex >= 0 ? String(row[schema.shortNameIndex] || "").trim() : "";

      const nameToUse = fullName || username;
      const keyLower = nameToUse.toLowerCase();
      const userKeyLower = username.toLowerCase();

      let shortName = existingShort;
      if (!shortName) {
        if (payloadMap[keyLower]) shortName = payloadMap[keyLower];
        else if (payloadMap[userKeyLower]) shortName = payloadMap[userKeyLower];
        else shortName = formatShortName_(nameToUse);
      }

      computedList.push({
        rowIndex: idx + 2,
        username: username,
        fullName: fullName,
        shortName: shortName
      });
    });

    const nameCounts = {};
    computedList.forEach(function(item) {
      const key = item.shortName.toLowerCase();
      nameCounts[key] = (nameCounts[key] || 0) + 1;
    });

    computedList.forEach(function(item) {
      const key = item.shortName.toLowerCase();
      if (nameCounts[key] > 1 && item.fullName && item.fullName.split(/\s+/).length > 2) {
        item.shortName = formatShortName_(item.fullName);
      }
    });

    computedList.forEach(function(item) {
      sheet.getRange(item.rowIndex, schema.shortNameIndex + 1).setValue(item.shortName);
      updatedCount++;
    });

    return contentResponse({
      status: "success",
      message: "Đã cập nhật Tên thường gọi cho " + updatedCount + " tài khoản trong sheet Users.",
      updatedCount: updatedCount,
      sample: computedList.slice(0, 10)
    });
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

// ── Hàm hỗ trợ tạo username từ họ tên ──────────────────────────────────────────
function removeVietnameseTones_(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
}

function generateUsername_(fullName) {
  if (!fullName) return "";
  let cleanName = removeVietnameseTones_(fullName).toLowerCase().trim();
  let parts = cleanName.split(/\s+/);
  if (parts.length === 1) return parts[0];
  let lastName = parts.pop();
  let initials = parts.map(p => p.charAt(0)).join("");
  return lastName + initials;
}

// ── Hàm dồn dữ liệu từ NhatKyAccounts sang Users ─────────────────────────────
function migrateAccountsToUsers() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const nhatkySheet = ss.getSheetByName("NhatKyAccounts");
  if (!nhatkySheet) {
    Logger.log("❌ Không tìm thấy sheet NhatKyAccounts");
    return "Không tìm thấy sheet NhatKyAccounts";
  }
  
  const userSheet = getSheet(SHEETS.USERS);
  const nhatkyData = nhatkySheet.getDataRange().getValues();
  if (nhatkyData.length < 2) {
    Logger.log("❌ Không có dữ liệu để dồn (Sheet NhatKyAccounts trống)");
    return "Không có dữ liệu để dồn (Sheet NhatKyAccounts trống)";
  }
  
  const newRows = [];
  // Cấu trúc Users: ["Username","PIN","Role","Teams"]
  // Cấu trúc NhatKyAccounts cũ: cột cuối là thông tin tổ, được chuyển về Users.Teams
  
  for (let i = 1; i < nhatkyData.length; i++) {
    let r = nhatkyData[i];
    let fullName = String(r[0]).trim();
    if (!fullName) continue;
    
    let username = generateUsername_(fullName);
    let pin = "12345678";
    let role = "User";
    let teams = r[4] || "- Chưa phân tổ -";
    
    newRows.push([username, pin, role, teams]);
  }
  
  if (newRows.length > 0) {
    userSheet.getRange(userSheet.getLastRow() + 1, 1, newRows.length, 4).setValues(newRows);
    Logger.log(`✅ Đã dồn thành công ${newRows.length} tài khoản sang sheet Users.`);
    Logger.log(`⚠️ Lưu ý: PIN mặc định của các tài khoản này là '12345678'`);
    return `Đã dồn thành công ${newRows.length} tài khoản.`;
  } else {
    return "Không có dữ liệu hợp lệ để dồn.";
  }
}

function deleteNhatKyAccountsSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("NhatKyAccounts");
  if (sheet) {
    ss.deleteSheet(sheet);
    return "Đã xóa thành công sheet NhatKyAccounts.";
  } else {
    return "Không tìm thấy sheet NhatKyAccounts (có thể đã bị xóa trước đó).";
  }
}

function handleMigrateAccountsEndpoint() {
  try {
    const msg = deleteNhatKyAccountsSheet();
    return contentResponse({ status: "success", message: msg });
  } catch (err) {
    return contentResponse({ status: "error", message: err.toString() });
  }
}

/** Hàm kiểm tra và tự động bổ sung cột nếu chưa có cho các sheet hiện hữu */
function ensureColumnsExist_(sheet, requiredColumns) {
  if (!sheet) return;
  const lastCol = sheet.getLastColumn();
  let headers = [];
  if (lastCol > 0) {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  }
  
  requiredColumns.forEach(col => {
    if (headers.indexOf(col) === -1) {
      const nextCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, nextCol).setValue(col).setFontWeight("bold");
      Logger.log("  ➕ Đã thêm cột '" + col + "' vào sheet " + sheet.getName());
    }
  });
}

/**
 * TỰ ĐỘNG CẤU HÌNH TOÀN BỘ TÍCH HỢP ERPNEXT (1-Click Setup)
 * Chỉ cần chọn hàm này và bấm "Run" (Chạy) trong Apps Script Editor.
 */
function setupERPNextIntegration() {
  Logger.log("🏁 Bắt đầu thiết lập tích hợp ERPNext tự động...");
  
  const props = PropertiesService.getScriptProperties();
  
  // 1. Ghi nhận các thông số kết nối bảo mật
  props.setProperty("ERPNEXT_BASE_URL", "https://royal-expend-ripping.ngrok-free.dev");
  props.setProperty("ERPNEXT_API_KEY", "884c6a8bccf6bb1");
  props.setProperty("ERPNEXT_API_SECRET", "f45e10911905f66");
  props.setProperty("ERPNEXT_ENABLED", "true");
  props.setProperty("ERPNEXT_DRY_RUN", "false");
  
  Logger.log("✅ Đã ghi nhận thông số kết nối vào Script Properties.");
  
  // 2. Chạy di chuyển cấu trúc bảng (thêm các cột SyncStatus, ERPNextID, SyncMessage)
  Logger.log("🔄 Đang kiểm tra và nâng cấp cấu trúc bảng Google Sheet...");
  setupAllSheets();
  
  // 3. Khởi tạo trigger chạy ngầm tự động (nếu chưa có)
  Logger.log("⏰ Đang thiết lập trigger chạy ngầm 10 phút...");
  setupERPNextTrigger_();
  
  // 4. Kiểm thử kết nối thực tế tới ERPNext
  Logger.log("🔍 Đang chạy kiểm thử kết nối tới ERPNext...");
  const connected = testERPNextConnection();
  
  if (connected) {
    Logger.log("🎉 THÀNH CÔNG! Dự án đã được cấu hình và kết nối hoàn tất tới ERPNext.");
  } else {
    Logger.log("❌ THẤT BẠI! Không thể kết nối tới ERPNext. Vui lòng kiểm tra lại trạng thái của ngrok.");
  }
}

/** Tạo trigger thời gian chạy ngầm 10 phút (nếu chưa tồn tại) */
function setupERPNextTrigger_() {
  const triggers = ScriptApp.getProjectTriggers();
  let exists = false;
  
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "triggerERPNextSync") {
      exists = true;
      break;
    }
  }
  
  if (!exists) {
    ScriptApp.newTrigger("triggerERPNextSync")
      .timeBased()
      .everyMinutes(10)
      .create();
    Logger.log("➕ Đã tạo mới trigger chạy ngầm triggerERPNextSync (mỗi 10 phút).");
  } else {
    Logger.log("➖ Trigger chạy ngầm đã tồn tại, bỏ qua tạo mới.");
  }
}

