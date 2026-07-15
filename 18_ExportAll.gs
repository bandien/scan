// ==========================================
// 18_ExportAll.gs — EXPORT TOÀN BỘ DỮ LIỆU CHO ERPNEXT SYNC
// ==========================================
// Endpoint dùng bởi sync_to_erpnext/download_sheets.py
// GET action=exportAllData → trả JSON tất cả 8 sheet trong 1 lần gọi

/**
 * Export toàn bộ dữ liệu từ tất cả sheet chính.
 * Trả về JSON gồm 8 mảng: devices, logs, users, checklists,
 * workOrders, auditLog, meterPoints, meterReadings.
 */
function handleExportAllData(e) {
  const startTime = new Date();
  const result = { status: "success" };

  // 1. Devices
  try {
    const devSheet = getSheet(SHEETS.DEVICES);
    result.devices = devSheet
      ? devSheet.getDataRange().getValues().slice(1).filter(r => r[0]).map(mapDeviceRow)
      : [];
  } catch (_) { result.devices = []; }

  // 2. Logs (Maintenance Logs)
  try {
    const logSheet = getSheet(SHEETS.LOGS);
    if (logSheet) {
      const data = logSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      result.logs = data.slice(1).filter(r => r[0] || r[1]).map(r => {
        const row = {};
        headers.forEach((h, i) => { row[h] = r[i] !== undefined ? r[i] : ""; });
        return row;
      });
    } else {
      result.logs = [];
    }
  } catch (_) { result.logs = []; }

  // 3. Users
  try {
    const userSheet = getSheet(SHEETS.USERS);
    if (userSheet) {
      const data = userSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      result.users = data.slice(1).filter(r => r[0]).map(r => {
        const row = {};
        headers.forEach((h, i) => { row[h] = r[i] !== undefined ? r[i] : ""; });
        return row;
      });
    } else {
      result.users = [];
    }
  } catch (_) { result.users = []; }

  // 4. Checklists
  try {
    const ckSheet = getSheet(SHEETS.CHECKLISTS);
    if (ckSheet) {
      const data = ckSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      result.checklists = data.slice(1).filter(r => r[0]).map(r => {
        const row = {};
        headers.forEach((h, i) => { row[h] = r[i] !== undefined ? r[i] : ""; });
        return row;
      });
    } else {
      result.checklists = [];
    }
  } catch (_) { result.checklists = []; }

  // 5. WorkOrders
  try {
    const woSheet = getSheet(SHEETS.WORK_ORDERS);
    if (woSheet) {
      const data = woSheet.getDataRange().getValues().slice(1);
      result.workOrders = data.filter(r => r[0]).map(r => ({
        woId: r[0], type: r[1], priority: r[2], status: r[3],
        assetUID: r[4], assignedTo: r[5], dueDate: r[6], description: r[7],
        partsUsed: r[8], createdAt: r[9], cost: r[10] || 0,
        subTasks: r[11] || '', project: r[12] || '', requestSource: r[13] || "Noi bo"
      }));
    } else {
      result.workOrders = [];
    }
  } catch (_) { result.workOrders = []; }

  // 6. AuditLog
  try {
    const auditSheet = getSheet(SHEETS.AUDIT_LOG);
    if (auditSheet) {
      const data = auditSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      result.auditLog = data.slice(1).filter(r => r[0]).map(r => {
        const row = {};
        headers.forEach((h, i) => { row[h] = r[i] !== undefined ? r[i] : ""; });
        return row;
      });
    } else {
      result.auditLog = [];
    }
  } catch (_) { result.auditLog = []; }

  // 7. MeterPoints
  try {
    const mpSheet = getSheet(SHEETS.METER_POINTS);
    result.meterPoints = mpSheet
      ? mpSheet.getDataRange().getValues().slice(1).filter(r => r[0]).map(r => ({
          meterId: r[0], type: r[1] || "Điện", name: r[2] || "",
          location: r[3] || "", multiplier: Number(r[4]) || 1,
          threshold: Number(r[5]) || 0, unit: r[6] || "kWh",
          notes: r[7] || "", lastReading: r[8] || null, lastDate: r[9] || null
        }))
      : [];
  } catch (_) { result.meterPoints = []; }

  // 8. MeterReadings
  try {
    const mrSheet = getSheet(SHEETS.METER_READINGS);
    if (mrSheet) {
      const data = mrSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      result.meterReadings = data.slice(1).filter(r => r[0]).map(r => {
        const row = {};
        headers.forEach((h, i) => { row[h] = r[i] !== undefined ? r[i] : ""; });
        return row;
      });
    } else {
      result.meterReadings = [];
    }
  } catch (_) { result.meterReadings = []; }

  // Metadata
  const elapsed = (new Date() - startTime) / 1000;
  result.meta = {
    exportedAt: new Date().toISOString(),
    elapsedSeconds: elapsed,
    counts: {
      devices:       result.devices.length,
      logs:          result.logs.length,
      users:         result.users.length,
      checklists:    result.checklists.length,
      workOrders:    result.workOrders.length,
      auditLog:      result.auditLog.length,
      meterPoints:   result.meterPoints.length,
      meterReadings: result.meterReadings.length,
    }
  };

  return contentResponse(result);
}
