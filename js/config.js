// ==========================================
// js/config.js — CẤU HÌNH ỨNG DỤNG
// ==========================================
// Nguồn duy nhất cho CONFIG.
// Load TRƯỚC tất cả module khác.

const CONFIG = {
  gasUrl:      'https://script.google.com/macros/s/AKfycbzW4TxDarLBOpZvO8hnE0R65IsCd95a5l-XPASjUmZNuefH5MiWMs8lCpLpggzFwyXK/exec',
  apiToken:    'HAPU_QR_SECRET_2026',
  appTitle:    'BanDienScan',
  companyName: 'HAPU Complex',
  version:     'v2.11.0', // Giữ đồng bộ với CONFIG inline trong index.html và mục mới nhất của CHANGELOG.md
  // Thời gian giữ localStorage trước khi force-refresh (giờ)
  cacheMaxAge: 24,
};

// Legacy aliases (tương thích với code cũ trong index.html)
const gasUrl    = CONFIG.gasUrl;
const API_TOKEN = CONFIG.apiToken;
