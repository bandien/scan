// ==========================================
// 00_Config.gs — CẤU HÌNH TRUNG TÂM
// ==========================================
// File này là nguồn duy nhất cho mọi hằng số.
// Tất cả module khác đọc từ đây — KHÔNG hardcode ở nơi khác.

const MANUAL_SHEET_ID = "1K_5jb0-TrshgCyNs_l5jjTpVjwdmHI-l9gpSHWXTdSg";
const API_TOKEN       = "HAPU_QR_SECRET_2026";

// Webhook thông báo (để trống nếu không dùng)
const DISCORD_WEBHOOK_URL = "";
const TELEGRAM_BOT_TOKEN  = "8123778511:AAFofqkL1DBCgl41GVXPWaq6keNG2HDfj1I";
const TELEGRAM_CHAT_ID    = "-4279433930";

// Tự động resolve Sheet ID (hỗ trợ cả container-bound lẫn standalone script)
const SHEET_ID = MANUAL_SHEET_ID
  ? MANUAL_SHEET_ID
  : (() => {
      try { return SpreadsheetApp.getActiveSpreadsheet().getId(); }
      catch (e) { return MANUAL_SHEET_ID; }
    })();

// Tên các Sheet chuẩn — dùng hằng số để tránh typo
const SHEETS = {
  DEVICES:      "Devices",
  LOGS:         "Logs",
  USERS:        "Users",
  CHECKLISTS:   "Checklists",
  WORK_ORDERS:  "WorkOrders",
  AUDIT_LOG:    "AuditLog",
  PROJECTS:     "Projects",
  SHIFTS:       "Shifts",
  INVENTORY:    "Inventory",
  STAFF:        "Users",
  METER_POINTS: "MeterPoints",      // Phase 11
  METER_READINGS: "MeterReadings",  // Phase 11
};
