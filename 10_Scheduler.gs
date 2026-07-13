// ==========================================
// 10_Scheduler.gs — TÁC VỤ ĐỊNH KỲ (Time-based Triggers)
// ==========================================
// Cài trigger trong Script Editor:
//   Edit → Triggers → checkMaintenanceDue → Time-driven → Day timer → 7:00–8:00 AM

/** Kiểm tra thiết bị đến hạn/quá hạn bảo trì — chạy hàng ngày lúc 7h sáng */
function checkMaintenanceDue() {
  const sheet = getSheet(SHEETS.DEVICES);
  if (!sheet) return;

  const today = new Date(); today.setHours(0,0,0,0);
  const data  = sheet.getDataRange().getValues().slice(1).filter(r => r[0]);

  const overdue    = [];
  const approaching = [];

  data.forEach(r => {
    const nextStr = String(r[5] || '').trim();
    if (!nextStr) return;
    const nextDate = new Date(nextStr);
    if (isNaN(nextDate)) return;
    nextDate.setHours(0,0,0,0);
    const warningDays = parseInt(r[8]) || 7;
    const diffDays    = Math.ceil((nextDate - today) / 86400000);

    if      (diffDays < 0)           overdue.push(`🔴 Quá hạn ${Math.abs(diffDays)}d: ${r[1]} (${r[0]}) — Tổ: ${r[6]}`);
    else if (diffDays === 0)          overdue.push(`🟠 Hôm nay: ${r[1]} (${r[0]}) — Tổ: ${r[6]}`);
    else if (diffDays <= warningDays) approaching.push(`🟡 Còn ${diffDays}d: ${r[1]} (${r[0]}) — Tổ: ${r[6]}`);
  });

  if (!overdue.length && !approaching.length) return;

  const lines = [];
  if (overdue.length)     lines.push(`⚠️ ĐẾN HẠN/QUÁ HẠN (${overdue.length}):\n${overdue.join('\n')}`);
  if (approaching.length) lines.push(`🔔 SẮP ĐẾN HẠN (${approaching.length}):\n${approaching.join('\n')}`);
  sendAlert(lines.join('\n\n'));
}

/** Gửi báo cáo tổng hợp tuần — cài trigger Weekly, Thứ Hai 8h sáng */
function weeklyMeterReport() {
  const ptSheet  = getSheet(SHEETS.METER_POINTS);
  const rdSheet  = getSheet(SHEETS.METER_READINGS);
  if (!ptSheet || !rdSheet) return;

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const readings = rdSheet.getDataRange().getValues().slice(1)
    .filter(r => r[0] && new Date(r[4]) >= weekAgo);

  if (!readings.length) return;

  const totalByType = {};
  const pts = ptSheet.getDataRange().getValues().slice(1).filter(r => r[0]);
  readings.forEach(r => {
    const pt = pts.find(p => String(p[0]).trim() === String(r[1]).trim());
    const type = pt ? (pt[1] || 'Khác') : 'Khác';
    totalByType[type] = (totalByType[type] || 0) + (Number(r[6]) || 0);
  });

  const lines = Object.entries(totalByType).map(([t, v]) => `• ${t}: ${v.toFixed(1)}`);
  sendAlert(`📊 BÁO CÁO TIÊU THỤ TUẦN (${readings.length} lần đọc):\n${lines.join('\n')}`);
}

/**
 * Tác vụ chạy định kỳ để tự động đồng bộ dữ liệu ngầm lên ERPNext.
 * Hướng dẫn cài đặt Trigger trong Apps Script Editor:
 *   1. Chọn biểu tượng Đồng hồ (Triggers) ở thanh bên trái.
 *   2. Chọn "Add Trigger" ở dưới cùng bên phải.
 *   3. Chọn hàm chạy: triggerERPNextSync
 *   4. Chọn nguồn sự kiện: Time-driven (Theo thời gian).
 *   5. Chọn kiểu: Minutes timer -> Every 10 minutes (hoặc 15 minutes).
 *   6. Nhấn Save để lưu.
 */
function triggerERPNextSync() {
  syncAllPendingData();
}

