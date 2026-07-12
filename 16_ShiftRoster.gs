// ==========================================
// 16_ShiftRoster.gs — BẢNG PHÂN CA (trang phanca)
// ==========================================
// - GET  action=getRosterStaff {team?}         → danh sách nhân sự theo tổ, đọc từ DanhSachNhanSu
// - GET  action=getRosterWeek  {weekStart}      → dữ liệu phân ca đã lưu của 1 tuần
// - POST action=saveRosterWeek {weekStart,staff,cells,rules,user} → lưu/ghi đè 1 tuần
//
// DanhSachNhanSu và XepLichTuan thuộc về XepLich.gs (bộ xếp lịch riêng, chạy qua menu Sheet) —
// module này chỉ ĐỌC DanhSachNhanSu để lấy danh sách nhân sự dùng chung, không đụng tới
// XepLichTuan hay thuật toán scheduleWithRules/scheduleGolfTeam.

const ROSTER_SHEET_NAME = "PhanCaGolf";
const ROSTER_DEFAULT_TEAM = "Cơ điện sân Golf";

function ensureRosterSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(ROSTER_SHEET_NAME);
  const headers = ["WeekStart", "StaffJson", "CellsJson", "RulesJson", "UpdatedAt", "UpdatedBy"];

  if (!sheet) sheet = ss.insertSheet(ROSTER_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  }
  sheet.getRange("A:A").setNumberFormat("@"); // Ép cột WeekStart về văn bản thuần, tránh Sheets tự parse "yyyy-MM-dd" thành Date
  return sheet;
}

function rosterWeekKey_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return String(value || "").trim();
}

function findRosterRow_(sheet, weekStart) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const target = rosterWeekKey_(weekStart);
  for (let i = 0; i < values.length; i++) {
    if (rosterWeekKey_(values[i][0]) === target) return i + 2;
  }
  return 0;
}

function handleGetRosterStaff(e) {
  const team = (e && e.parameter && e.parameter.team) ? e.parameter.team : ROSTER_DEFAULT_TEAM;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.USERS || "Users");
  if (!sheet) return contentResponse({ status: "success", staff: [] });

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "success", staff: [] });

  const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  const staff = rows
    .filter(r => String(r[1] || "").trim() && String(r[4] || "").trim().toLowerCase() === team.trim().toLowerCase())
    .map(r => ({ name: String(r[1]).trim(), team: String(r[4]).trim() }));

  return contentResponse({ status: "success", staff: staff });
}

function handleGetRosterWeek(e) {
  const weekStart = e && e.parameter ? e.parameter.weekStart : "";
  if (!weekStart) return contentResponse({ status: "error", message: "Thiếu weekStart" });

  const sheet = ensureRosterSheet_();
  const rowIndex = findRosterRow_(sheet, weekStart);
  if (!rowIndex) return contentResponse({ status: "success", found: false });

  const row = sheet.getRange(rowIndex, 1, 1, 6).getValues()[0];
  const parse = json => { try { return JSON.parse(json || "null"); } catch (_) { return null; } };

  return contentResponse({
    status: "success",
    found: true,
    weekStart: rosterWeekKey_(row[0]),
    staff: parse(row[1]),
    cells: parse(row[2]),
    rules: parse(row[3]),
    updatedAt: row[4] instanceof Date ? row[4].toISOString() : String(row[4] || ""),
    updatedBy: String(row[5] || "")
  });
}

function handleSaveRosterWeek(params) {
  const payload = params.payload || params;
  const weekStart = String(payload.weekStart || "").trim();
  if (!weekStart) return contentResponse({ status: "error", message: "Thiếu weekStart" });

  const sheet = ensureRosterSheet_();
  const rowIndex = findRosterRow_(sheet, weekStart);
  const targetRow = rowIndex || sheet.getLastRow() + 1;
  const user = params.user || payload.user || "Web";

  sheet.getRange(targetRow, 1, 1, 6).setValues([[
    weekStart,
    JSON.stringify(payload.staff || []),
    JSON.stringify(payload.cells || {}),
    JSON.stringify(payload.rules || {}),
    new Date(),
    user
  ]]);

  writeAuditLog(user, "saveRosterWeek", weekStart, "Cập nhật phân ca tuần");
  return contentResponse({ status: "success", weekStart: weekStart });
}
