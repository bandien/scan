// ==========================================
// 01_Utils.gs — TIỆN ÍCH DÙNG CHUNG
// ==========================================

/** Trả JSON response chuẩn cho mọi endpoint */
function contentResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Trang status khi truy cập trực tiếp URL GAS */
function statusPage() {
  return HtmlService.createHtmlOutput(
    "<div style='font-family:sans-serif;padding:20px;background:#f0f4f8;border-radius:10px'>" +
    "<h2>✅ BanDienScan Backend v3 is Live!</h2>" +
    "<p>Backend đang hoạt động. Dùng hàm <code>testConnection</code> trong Script Editor để kiểm tra.</p>" +
    "</div>"
  );
}

/** Ghi audit log — non-fatal, không block operation chính */
function writeAuditLog(user, action, target, details) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEETS.AUDIT_LOG);
    if (sheet) sheet.appendRow([new Date(), user, action, target, details]);
  } catch (_) {}
}

/** Gửi cảnh báo qua Telegram / Discord nếu đã cấu hình */
function sendAlert(message) {
  try {
    if (DISCORD_WEBHOOK_URL) {
      UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, {
        method: "post", contentType: "application/json",
        payload: JSON.stringify({ content: message })
      });
    }
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      UrlFetchApp.fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "post", contentType: "application/json",
        payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
      });
    }
  } catch (_) {}
}

/** Validate Work Order payload — trả về error string hoặc null nếu OK */
function validateWOPayload(params) {
  const valid = {
    priorities: ['Low', 'Medium', 'High', 'Urgent'],
    types:      ['Corrective', 'Preventive', 'Emergency', 'Inspection', 'Construction'],
    statuses:   ['New', 'Assigned', 'In Progress', 'Done', 'Closed', 'Cancelled']
  };
  if (params.priority && !valid.priorities.includes(params.priority))
    return 'Priority phải là: ' + valid.priorities.join(', ');
  if (params.type && !valid.types.includes(params.type))
    return 'Type phải là: ' + valid.types.join(', ');
  if (params.status && !valid.statuses.includes(params.status))
    return 'Status phải là: ' + valid.statuses.join(', ');
  if (params.cost !== undefined && params.cost !== '' && isNaN(Number(params.cost)))
    return 'Cost phải là số hợp lệ';
  return null;
}

/** Tự động phân khu vực từ tên/vị trí thiết bị */
function determineArea(name, location, index) {
  const n = String(name || '').toLowerCase();
  const l = String(location || '').toLowerCase();
  const checks = [
    [['tầng 1','t1','tang 1','floor 1','f1'], 'Tầng 1'],
    [['tầng 2','t2','tang 2','floor 2','f2'], 'Tầng 2'],
    [['tầng 3','t3','tang 3','floor 3','f3'], 'Tầng 3'],
    [['mái','sân thượng','roof','rooftop'],   'Mái'],
    [['hầm','basement','b1','b2'],            'Tầng hầm'],
    [['khu a','kho a','kho thành phẩm'],      'Khu A'],
    [['khu b','block b','sảnh b'],            'Khu B'],
  ];
  for (const [kws, area] of checks) {
    if (kws.some(k => l.includes(k) || n.includes(k))) return area;
  }
  return ['Khu A','Khu B','Tầng 1','Tầng 2','Tầng 3','Mái','Tầng hầm'][index % 7];
}

/** Tự động phân loại thiết bị từ tên */
function determineEquipmentType(name, location, index) {
  const n = String(name || '').toLowerCase();
  const checks = [
    [['điều hòa','điều hoà','fcu','chiller','cassette','vav','ahu'], 'Điều hòa'],
    [['bơm','pump','áp lực','hút ẩm'],                              'Máy bơm'],
    [['thang máy','lift','elevator','escalator'],                    'Thang máy'],
    [['điện','tủ điện','db','msb','ats','máy phát','generator','ups','biến áp'], 'Hệ thống điện'],
    [['pccc','cứu hỏa','phòng cháy','bình chữa cháy','báo cháy','fire'], 'PCCC'],
    [['camera','cctv','cam','nvr','dvr'],                            'Camera'],
  ];
  for (const [kws, type] of checks) {
    if (kws.some(k => n.includes(k))) return type;
  }
  return ['Điều hòa','Máy bơm','Thang máy','Hệ thống điện','PCCC','Camera'][index % 6];
}

/** Shorthand: mở Spreadsheet và lấy sheet theo tên */
function getSheet(sheetName) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(sheetName);
}

/** Tìm row index (1-based) của một UID trong sheet Devices */
function findDeviceRow(uid) {
  const sheet = getSheet(SHEETS.DEVICES);
  if (!sheet) return -1;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(uid).trim()) return i + 1;
  }
  return -1;
}
