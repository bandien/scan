// ==========================================
// js/config.js — CẤU HÌNH ỨNG DỤNG
// ==========================================
// Nguồn duy nhất cho CONFIG và i18n.
// Load TRƯỚC tất cả module khác.

const CONFIG = {
  gasUrl:      'https://script.google.com/macros/s/AKfycbzW4TxDarLBOpZvO8hnE0R65IsCd95a5l-XPASjUmZNuefH5MiWMs8lCpLpggzFwyXK/exec',
  apiToken:    'HAPU_QR_SECRET_2026',
  appTitle:    'BanDienScan',
  companyName: 'HAPU Complex',
  version:     'v3.0.0',
  // Thời gian giữ localStorage trước khi force-refresh (giờ)
  cacheMaxAge: 24,
};

const TRANSLATIONS = {
  vi: {
    app_title:         "Hệ thống UID-QR",
    app_subtitle:      "Quản lý bảo trì thông minh",
    btn_scan:          "QUÉT MÃ THIẾT BỊ",
    placeholder_uid:   "Nhập UID tay...",
    btn_go:            "GỬI",
    badge_active:      "Đang hoạt động",
    checklist_title:   "DANH MỤC KIỂM TRA",
    check1_title:      "Nguồn & Pin",
    check1_desc:       "Kiểm tra điện áp",
    check2_title:      "Rung động",
    check2_desc:       "Tiếng ồn & Nhiệt",
    check3_title:      "Vệ sinh",
    check3_desc:       "Lau chùi & tra dầu",
    field_notes:       "GHI CHÚ THỰC ĐỊA",
    placeholder_notes: "Nhập kết quả đo / quan sát...",
    btn_complete:      "HOÀN TẤT KIỂM TRA",
    login_title:       "Đăng nhập Ban Điện",
    login_username:    "Tên đăng nhập",
    login_pin:         "PIN",
    login_btn:         "ĐĂNG NHẬP",
    logout:            "Đăng xuất",
    menu_scan:         "Quét QR",
    menu_dashboard:    "Dashboard",
    menu_kanban:       "Kanban",
    menu_calendar:     "Lịch bảo trì",
    menu_devices:      "Thiết bị",
    menu_metering:     "Đồng hồ",    // Phase 11
    sync_ok:           "Đã đồng bộ",
    sync_pending:      "Chờ đồng bộ",
    sync_offline:      "Offline",
    // Phase 11 - Metering
    metering_title:    "ĐỒNG HỒ ĐIỆN & NƯỚC",
    meter_enter_value: "Nhập chỉ số đồng hồ",
    meter_photo:       "Chụp ảnh đồng hồ",
    meter_submit:      "GHI CHỈ SỐ",
    meter_history:     "Lịch sử",
    meter_alert:       "⚡ Vượt ngưỡng!",
    // Spare Parts
    parts_suggested:   "Vật tư đề xuất",
    parts_used:        "Vật tư sử dụng",
    parts_placeholder: "Danh sách vật tư đề xuất...",
    parts_lookup_store: "Tra cứu vật tư từ kho",
    parts_search_placeholder: "Nhập tên vật tư để tìm...",
  },
  en: {
    app_title:         "UID-QR System",
    app_subtitle:      "Smart Maintenance Management",
    btn_scan:          "SCAN DEVICE",
    placeholder_uid:   "Enter UID manually...",
    btn_go:            "SEND",
    badge_active:      "Active",
    checklist_title:   "MAINTENANCE CHECKLIST",
    check1_title:      "Power & Battery",
    check1_desc:       "Check voltage",
    check2_title:      "Vibration",
    check2_desc:       "Noise & Heat",
    check3_title:      "Cleaning",
    check3_desc:       "Clean & lubricate",
    field_notes:       "FIELD NOTES",
    placeholder_notes: "Enter readings / observations...",
    btn_complete:      "COMPLETE INSPECTION",
    login_title:       "Electrical Dept Login",
    login_username:    "Username",
    login_pin:         "Password / PIN",
    login_btn:         "LOGIN",
    logout:            "Logout",
    menu_scan:         "Scan QR",
    menu_dashboard:    "Dashboard",
    menu_kanban:       "Kanban",
    menu_calendar:     "PM Calendar",
    menu_devices:      "Devices",
    menu_metering:     "Meters",    // Phase 11
    sync_ok:           "Synced",
    sync_pending:      "Pending sync",
    sync_offline:      "Offline",
    // Phase 11 - Metering
    metering_title:    "ELECTRIC & WATER METERS",
    meter_enter_value: "Enter meter reading",
    meter_photo:       "Take meter photo",
    meter_submit:      "RECORD READING",
    meter_history:     "History",
    meter_alert:       "⚡ Threshold exceeded!",
    // Spare Parts
    parts_suggested:   "Proposed Materials",
    parts_used:        "Used Materials",
    parts_placeholder: "List proposed parts/materials...",
    parts_lookup_store: "Lookup from Inventory",
    parts_search_placeholder: "Type part name to search...",
  }
};

// Ngôn ngữ hiện tại (lấy từ localStorage hoặc mặc định 'vi')
let currentLang = localStorage.getItem('lang') || 'vi';

/** Lấy chuỗi dịch */
function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS['vi'])[key] || key;
}

/** Đặt ngôn ngữ và refresh giao diện */
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(key);
  });
}

// Legacy aliases (tương thích với code cũ trong index.html)
const gasUrl    = CONFIG.gasUrl;
const API_TOKEN = CONFIG.apiToken;
