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

// ==========================================
// CẤU HÌNH TÍCH HỢP ERPNEXT
// ==========================================
const ERPNEXT_CONFIG = (() => {
  let userProperties = null;
  try {
    userProperties = PropertiesService.getScriptProperties();
  } catch (e) {
    Logger.log("Không thể truy cập Script Properties: " + e.toString());
  }

  const getProp = (key, fallback) => {
    if (userProperties) {
      const val = userProperties.getProperty(key);
      if (val !== null && val !== undefined) return val.trim();
    }
    return fallback;
  };

  return {
    // Trạng thái bật/tắt đồng bộ chung
    ENABLED: getProp("ERPNEXT_ENABLED", "true") === "true",

    // URL của hệ thống ERPNext (Frappe Instance)
    BASE_URL: getProp("ERPNEXT_BASE_URL", "https://your-erpnext-domain.com"),

    // Key & Secret để xác thực (Sinh ra từ tài khoản User trên ERPNext)
    API_KEY: getProp("ERPNEXT_API_KEY", "YOUR_API_KEY_HERE"),
    API_SECRET: getProp("ERPNEXT_API_SECRET", "YOUR_API_SECRET_HERE"),

    // Chế độ chạy thử nghiệm (Chỉ log payload, không ghi dữ liệu thực tế)
    DRY_RUN: getProp("ERPNEXT_DRY_RUN", "false") === "true",

    // Định nghĩa tên Doctype trên ERPNext để đồng bộ
    DOCTYPES: {
      METER_READINGS: getProp("ERPNEXT_DOCTYPE_METER_READINGS", "Energy Point Log"),
      MAINTENANCE_LOGS: getProp("ERPNEXT_DOCTYPE_MAINTENANCE_LOGS", "Asset Maintenance Log")
    }
  };
})();
