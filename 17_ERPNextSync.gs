// ==========================================
// 17_ERPNextSync.gs — ĐỒNG BỘ DỮ LIỆU ERPNEXT
// ==========================================

/**
 * Hàm chung gọi REST API của ERPNext (Frappe API)
 * @param {string} endpoint - Đường dẫn ví dụ "/api/resource/Asset"
 * @param {string} method - "GET", "POST", "PUT", "DELETE"
 * @param {Object} [payload] - Body gửi kèm nếu có
 * @returns {Object} - { success: boolean, data?: Object, error?: string }
 */
function callERPNextAPI(endpoint, method, payload) {
  if (!ERPNEXT_CONFIG.ENABLED) {
    return { success: false, error: "Đồng bộ ERPNext đang bị TẮT trong cấu hình." };
  }

  const url = ERPNEXT_CONFIG.BASE_URL.replace(/\/$/, "") + endpoint;
  
  const headers = {
    "Authorization": "token " + ERPNEXT_CONFIG.API_KEY + ":" + ERPNEXT_CONFIG.API_SECRET,
    "Content-Type": "application/json",
    "Accept": "application/json",
    "ngrok-skip-browser-warning": "6024"
  };

  const options = {
    "method": method,
    "headers": headers,
    "muteHttpExceptions": true
  };

  if (payload) {
    options.payload = JSON.stringify(payload);
  }

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode >= 200 && responseCode < 300) {
      try {
        const json = JSON.parse(responseText);
        return { success: true, data: json.data || json };
      } catch (_) {
        return { success: true, raw: responseText };
      }
    } else {
      return { 
        success: false, 
        error: "HTTP " + responseCode + " - " + responseText.substring(0, 500) 
      };
    }
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Đồng bộ tất cả dữ liệu chốt chỉ số chưa đồng bộ
 * Giới hạn tối đa 30 dòng mỗi lần chạy để tránh quá giờ Script
 */
function syncPendingMeterReadings() {
  const sheet = getSheet(SHEETS.METER_READINGS);
  if (!sheet) {
    Logger.log("❌ Không tìm thấy sheet MeterReadings");
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // Lấy dòng tiêu đề để xác định index động của các cột
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  
  const colIdx = {
    readingId: headers.indexOf("ReadingID"),
    meterId: headers.indexOf("MeterID"),
    value: headers.indexOf("Value"),
    photoUrl: headers.indexOf("PhotoUrl"),
    timestamp: headers.indexOf("Timestamp"),
    user: headers.indexOf("User"),
    calculated: headers.indexOf("Calculated"),
    alert: headers.indexOf("Alert"),
    syncStatus: headers.indexOf("SyncStatus"),
    erpnextId: headers.indexOf("ERPNextID"),
    syncMessage: headers.indexOf("SyncMessage")
  };

  // Kiểm tra xem các cột cần thiết có tồn tại không
  if (colIdx.syncStatus === -1 || colIdx.erpnextId === -1 || colIdx.syncMessage === -1) {
    Logger.log("⚠️ Thiếu cột ERPNext trên Sheet MeterReadings. Đang bổ sung...");
    ensureColumnsExist_(sheet, ["SyncStatus", "ERPNextID", "SyncMessage"]);
    return syncPendingMeterReadings(); // Gọi lại sau khi cập nhật cấu trúc
  }

  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  let syncCount = 0;
  const maxSyncRows = 30; // Giới hạn số dòng mỗi phiên

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // Số thứ tự dòng trên sheet (1-indexed, bỏ qua header)
    const status = String(row[colIdx.syncStatus] || "").trim();

    if (status === "Synced" || status === "DryRun") continue;

    const readingId  = row[colIdx.readingId];
    const meterId    = row[colIdx.meterId];
    const value      = Number(row[colIdx.value]);
    const photoUrl   = row[colIdx.photoUrl];
    const timestamp  = row[colIdx.timestamp];
    const user       = row[colIdx.user];
    const calculated = Number(row[colIdx.calculated]);
    const isAlert    = !!row[colIdx.alert];

    Logger.log("🔄 Đang đồng bộ chỉ số đồng hồ " + meterId + " (ID: " + readingId + ")...");

    const payload = {
      "meter_point": String(meterId).trim(),
      "reading_value": value,
      "reading_date": Utilities.formatDate(new Date(timestamp), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      "captured_by": user,
      "remarks": "Đồng bộ từ QR Scan. Tiêu thụ: " + calculated + (isAlert ? " [CẢNH BÁO VƯỢT NGƯỠNG]" : ""),
      "photo_url": photoUrl || "",
      "source_reading_id": readingId
    };

    if (ERPNEXT_CONFIG.DRY_RUN) {
      Logger.log("🧪 [DRY RUN] Payload đồng bộ Meter Reading: " + JSON.stringify(payload));
      sheet.getRange(rowNum, colIdx.syncStatus + 1).setValue("DryRun");
      sheet.getRange(rowNum, colIdx.erpnextId + 1).setValue("DRY-RUN-ID");
      sheet.getRange(rowNum, colIdx.syncMessage + 1).setValue("Thử nghiệm thành công");
      syncCount++;
      continue;
    }

    // Gửi lên ERPNext
    const endpoint = "/api/resource/" + encodeURIComponent(ERPNEXT_CONFIG.DOCTYPES.METER_READINGS);
    const result = callERPNextAPI(endpoint, "POST", payload);

    if (result.success) {
      const erpName = result.data.name || "N/A";
      sheet.getRange(rowNum, colIdx.syncStatus + 1).setValue("Synced");
      sheet.getRange(rowNum, colIdx.erpnextId + 1).setValue(erpName);
      sheet.getRange(rowNum, colIdx.syncMessage + 1).setValue("Đồng bộ thành công lúc " + new Date().toLocaleString());
      Logger.log("✅ Đồng bộ thành công: " + erpName);
    } else {
      sheet.getRange(rowNum, colIdx.syncStatus + 1).setValue("Failed");
      sheet.getRange(rowNum, colIdx.syncMessage + 1).setValue(result.error);
      Logger.log("❌ Đồng bộ thất bại: " + result.error);
    }

    syncCount++;
    if (syncCount >= maxSyncRows) {
      Logger.log("⏳ Đạt giới hạn đồng bộ " + maxSyncRows + " dòng. Tạm dừng để chạy phiên sau.");
      break;
    }
  }
}

/**
 * Đồng bộ tất cả dữ liệu checklist bảo trì thiết bị chưa đồng bộ
 * Giới hạn tối đa 30 dòng mỗi lần chạy
 */
function syncPendingMaintenanceLogs() {
  const sheet = getSheet(SHEETS.LOGS);
  if (!sheet) {
    Logger.log("❌ Không tìm thấy sheet Logs");
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());

  const colIdx = {
    timestamp: headers.indexOf("Timestamp"),
    uid: headers.indexOf("UID"),
    items: headers.indexOf("Items"),
    notes: headers.indexOf("Notes"),
    user: headers.indexOf("User"),
    imageUrl: headers.indexOf("ImageUrl"),
    syncStatus: headers.indexOf("SyncStatus"),
    erpnextId: headers.indexOf("ERPNextID"),
    syncMessage: headers.indexOf("SyncMessage")
  };

  if (colIdx.syncStatus === -1 || colIdx.erpnextId === -1 || colIdx.syncMessage === -1) {
    Logger.log("⚠️ Thiếu cột ERPNext trên Sheet Logs. Đang bổ sung...");
    ensureColumnsExist_(sheet, ["SyncStatus", "ERPNextID", "SyncMessage"]);
    return syncPendingMaintenanceLogs();
  }

  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  let syncCount = 0;
  const maxSyncRows = 30;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;
    const status = String(row[colIdx.syncStatus] || "").trim();

    if (status === "Synced" || status === "DryRun") continue;

    const timestamp = row[colIdx.timestamp];
    const uid       = row[colIdx.uid];
    const items     = row[colIdx.items];
    const notes     = row[colIdx.notes];
    const user      = row[colIdx.user];
    const imageUrl  = row[colIdx.imageUrl];

    Logger.log("🔄 Đang đồng bộ bảo trì thiết bị " + uid + "...");

    // Ánh xạ trường cho Doctype bảo trì
    const payload = {
      "asset": String(uid).trim(),
      "maintenance_date": Utilities.formatDate(new Date(timestamp), "GMT+7", "yyyy-MM-dd"),
      "performed_by": user,
      "remarks": (notes ? notes + " | " : "") + "Checklist: " + items,
      "image_url": imageUrl || "",
      "source_log_timestamp": Utilities.formatDate(new Date(timestamp), "GMT+7", "yyyy-MM-dd HH:mm:ss")
    };

    if (ERPNEXT_CONFIG.DRY_RUN) {
      Logger.log("🧪 [DRY RUN] Payload đồng bộ Maintenance Log: " + JSON.stringify(payload));
      sheet.getRange(rowNum, colIdx.syncStatus + 1).setValue("DryRun");
      sheet.getRange(rowNum, colIdx.erpnextId + 1).setValue("DRY-RUN-ID");
      sheet.getRange(rowNum, colIdx.syncMessage + 1).setValue("Thử nghiệm thành công");
      syncCount++;
      continue;
    }

    const endpoint = "/api/resource/" + encodeURIComponent(ERPNEXT_CONFIG.DOCTYPES.MAINTENANCE_LOGS);
    const result = callERPNextAPI(endpoint, "POST", payload);

    if (result.success) {
      const erpName = result.data.name || "N/A";
      sheet.getRange(rowNum, colIdx.syncStatus + 1).setValue("Synced");
      sheet.getRange(rowNum, colIdx.erpnextId + 1).setValue(erpName);
      sheet.getRange(rowNum, colIdx.syncMessage + 1).setValue("Đồng bộ thành công lúc " + new Date().toLocaleString());
      Logger.log("✅ Đồng bộ thành công: " + erpName);
    } else {
      sheet.getRange(rowNum, colIdx.syncStatus + 1).setValue("Failed");
      sheet.getRange(rowNum, colIdx.syncMessage + 1).setValue(result.error);
      Logger.log("❌ Đồng bộ thất bại: " + result.error);
    }

    syncCount++;
    if (syncCount >= maxSyncRows) {
      Logger.log("⏳ Đạt giới hạn đồng bộ " + maxSyncRows + " dòng. Tạm dừng.");
      break;
    }
  }
}

/**
 * Hàm tổng hợp để Trigger gọi định kỳ hàng loạt
 */
function syncAllPendingData() {
  Logger.log("🚀 Bắt đầu tiến trình đồng bộ dữ liệu ngầm lên ERPNext...");
  try {
    syncPendingMeterReadings();
    syncPendingMaintenanceLogs();
    Logger.log("🏁 Hoàn thành tiến trình đồng bộ.");
  } catch (err) {
    Logger.log("❌ Lỗi tiến trình đồng bộ: " + err.toString());
  }
}

/**
 * Kiểm tra kết nối nhanh với ERPNext
 */
function testERPNextConnection() {
  Logger.log("🔍 Đang kiểm tra kết nối tới ERPNext: " + ERPNEXT_CONFIG.BASE_URL);
  
  // Thử kiểm tra API lấy thông tin hệ thống thô hoặc danh sách Asset giới hạn 1
  const endpoint = "/api/resource/Asset?limit_page_length=1";
  const result = callERPNextAPI(endpoint, "GET");
  
  if (result.success) {
    Logger.log("✅ Kết nối ERPNext THÀNH CÔNG!");
    Logger.log("Dữ liệu trả về mẫu: " + JSON.stringify(result.data));
    return true;
  } else {
    Logger.log("❌ Kết nối ERPNext THẤT BẠI: " + result.error);
    return false;
  }
}

/**
 * GET Handler: Kích hoạt đồng bộ thủ công qua API
 */
function handleSyncERPNext(e) {
  try {
    syncAllPendingData();
    return contentResponse({ 
      status: "success", 
      message: "Đã kích hoạt đồng bộ ERPNext thành công. Vui lòng kiểm tra trạng thái trên Google Sheet." 
    });
  } catch (err) {
    return contentResponse({ status: "error", message: err.toString() });
  }
}

/**
 * GET Handler: Kiểm thử kết nối API tới ERPNext
 */
function handleTestERPNext(e) {
  try {
    const connected = testERPNextConnection();
    if (connected) {
      return contentResponse({ 
        status: "success", 
        message: "Kết nối tới ERPNext THÀNH CÔNG! Đã lấy được dữ liệu mẫu từ hệ thống." 
      });
    } else {
      return contentResponse({ 
        status: "error", 
        message: "Không thể kết nối tới ERPNext. Vui lòng kiểm tra lại cấu hình URL hoặc API Key/Secret." 
      });
    }
  } catch (err) {
    return contentResponse({ status: "error", message: err.toString() });
  }
}

