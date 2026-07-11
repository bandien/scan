// ==========================================
// 09_Metering.gs — ĐO LƯỜNG & NĂNG LƯỢNG (Phase 11)
// ==========================================
// Sheet MeterPoints:  MeterID | Type | Name | Location | Multiplier | Threshold | Unit | Notes
// Sheet MeterReadings: ReadingID | MeterID | Value | PhotoUrl | Timestamp | User | Calculated | Alert

function handleGetMeterPoints(e) {
  const sheet = getSheet(SHEETS.METER_POINTS);
  if (!sheet) return contentResponse({ status: "error", message: "MeterPoints sheet not found. Chạy setupMeteringSheets() trước." });

  const points = sheet.getDataRange().getValues().slice(1).filter(r => r[0]).map(r => ({
    meterId:    r[0],
    type:       r[1] || "Điện",    // Điện | Nước | Gas
    name:       r[2] || "",
    location:   r[3] || "",
    multiplier: Number(r[4]) || 1,
    threshold:  Number(r[5]) || 0,
    unit:       r[6] || "kWh",
    notes:      r[7] || "",
    lastReading: r[8] || null,     // cache từ lần đọc cuối
    lastDate:    r[9] || null
  }));
  return contentResponse({ status: "success", points });
}

function handleGetMeterHistory(e) {
  const { meterId, limit } = e.parameter;
  if (!meterId) return contentResponse({ status: "error", message: "Missing meterId" });

  const sheet = getSheet(SHEETS.METER_READINGS);
  if (!sheet) return contentResponse({ status: "error", message: "MeterReadings sheet not found" });

  const maxRows = parseInt(limit) || 12;
  const data    = sheet.getDataRange().getValues().slice(1);
  const history = data
    .filter(r => String(r[1]).trim() === String(meterId).trim())
    .slice(-maxRows)
    .reverse()
    .map(r => ({
      readingId:  r[0],
      meterId:    r[1],
      value:      Number(r[2]) || 0,
      photoUrl:   r[3] || "",
      timestamp:  r[4],
      user:       r[5] || "",
      calculated: Number(r[6]) || 0,  // sản lượng = (value - prev) × multiplier
      alert:      r[7] === true || r[7] === "TRUE"
    }));

  return contentResponse({ status: "success", history });
}

function handleGetMeterStats(e) {
  const sheet = getSheet(SHEETS.METER_READINGS);
  const ptSheet = getSheet(SHEETS.METER_POINTS);
  if (!sheet || !ptSheet) return contentResponse({ status: "error", message: "Metering sheets not found" });

  const data   = sheet.getDataRange().getValues().slice(1).filter(r => r[0]);
  const points = ptSheet.getDataRange().getValues().slice(1).filter(r => r[0]);

  // Tính tổng tiêu thụ 6 tháng gần nhất theo từng đồng hồ
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); sixMonthsAgo.setDate(1);
  const byMeter = {};
  const byMonth = {};

  data.forEach(r => {
    const d = new Date(r[4]);
    if (!r[0] || d < sixMonthsAgo) return;
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    byMeter[r[1]] = (byMeter[r[1]] || 0) + (Number(r[6]) || 0);
    byMonth[key]  = (byMonth[key]  || 0) + (Number(r[6]) || 0);
  });

  // Cảnh báo vượt ngưỡng
  const alerts = points
    .filter(p => p[5] > 0 && (byMeter[p[0]] || 0) > Number(p[5]))
    .map(p => ({ meterId: p[0], name: p[2], threshold: p[5], actual: byMeter[p[0]] || 0 }));

  return contentResponse({ status: "success", byMeter, byMonth, alerts });
}

function handleSubmitMeterReading(params) {
  const { meterId, value, photoBase64, mimeType, user, notes } = params;
  if (!meterId) return contentResponse({ status: "error", message: "Thiếu meterId" });
  if (value === undefined || value === null || isNaN(Number(value)))
    return contentResponse({ status: "error", message: "Chỉ số đồng hồ không hợp lệ" });

  // Lưu ảnh nếu có
  let photoUrl = "";
  if (photoBase64) {
    try {
      const folderName = "QR_Meter_Images";
      let folders = DriveApp.getFoldersByName(folderName);
      const folder  = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      const blob    = Utilities.newBlob(
        Utilities.base64Decode(photoBase64),
        mimeType || "image/jpeg",
        `METER_${meterId}_${Date.now()}`
      );
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      photoUrl = file.getUrl();
    } catch (err) { photoUrl = "Error: " + err.toString(); }
  }

  const readingSheet = getSheet(SHEETS.METER_READINGS);
  const ptSheet      = getSheet(SHEETS.METER_POINTS);
  if (!readingSheet) return contentResponse({ status: "error", message: "MeterReadings sheet not found" });

  // Lấy chỉ số lần đọc trước để tính sản lượng
  const history    = readingSheet.getDataRange().getValues().slice(1);
  const prevReading = history.filter(r => String(r[1]).trim() === String(meterId).trim()).slice(-1)[0];
  const prevValue   = prevReading ? Number(prevReading[2]) : 0;

  // Lấy hệ số nhân từ MeterPoints
  let multiplier = 1, threshold = 0;
  if (ptSheet) {
    const ptData = ptSheet.getDataRange().getValues().slice(1);
    const pt = ptData.find(r => String(r[0]).trim() === String(meterId).trim());
    if (pt) { multiplier = Number(pt[4]) || 1; threshold = Number(pt[5]) || 0; }
  }

  const currentValue = Number(value);
  const calculated   = (currentValue - prevValue) * multiplier;
  const isAlert      = threshold > 0 && calculated > threshold;

  // Tạo ReadingID
  const readingId = `RD-${meterId}-${Date.now()}`;

  readingSheet.appendRow([
    readingId, meterId, currentValue, photoUrl,
    new Date(), user || "Mobile User", calculated, isAlert
  ]);

  // Cập nhật cache lastReading trong MeterPoints
  if (ptSheet) {
    const ptData = ptSheet.getDataRange().getValues();
    for (let i = 1; i < ptData.length; i++) {
      if (String(ptData[i][0]).trim() === String(meterId).trim()) {
        ptSheet.getRange(i + 1, 9).setValue(currentValue);  // Col I: lastReading
        ptSheet.getRange(i + 1, 10).setValue(new Date());   // Col J: lastDate
        break;
      }
    }
  }

  writeAuditLog(user || "System", "submitMeterReading", meterId, `Value: ${currentValue} | Sản lượng: ${calculated.toFixed(2)}`);

  if (isAlert) {
    sendAlert(`⚡ CẢNH BÁO vượt ngưỡng!\nĐồng hồ: ${meterId}\nSản lượng: ${calculated.toFixed(2)}\nNgưỡng: ${threshold}`);
  }

  return contentResponse({ status: "success", readingId, calculated: calculated.toFixed(2), alert: isAlert });
}

function handleCreateMeterPoint(params) {
  if (!params.meterId) return contentResponse({ status: "error", message: "Thiếu meterId" });
  if (!params.name)    return contentResponse({ status: "error", message: "Thiếu tên đồng hồ" });

  const sheet = getSheet(SHEETS.METER_POINTS);
  if (!sheet) return contentResponse({ status: "error", message: "MeterPoints sheet not found" });

  const data = sheet.getDataRange().getValues();
  if (data.slice(1).some(r => String(r[0]).trim() === String(params.meterId).trim()))
    return contentResponse({ status: "error", message: "MeterID đã tồn tại" });

  sheet.appendRow([
    params.meterId.trim(), params.type || "Điện", params.name.trim(),
    params.location || "", Number(params.multiplier) || 1,
    Number(params.threshold) || 0, params.unit || "kWh", params.notes || "", "", ""
  ]);
  writeAuditLog(params.user || "System", "createMeterPoint", params.meterId, "Created: " + params.name);
  return contentResponse({ status: "success", meterId: params.meterId });
}

function handleUpdateMeterPoint(params) {
  if (!params.meterId) return contentResponse({ status: "error", message: "Thiếu meterId" });

  const sheet = getSheet(SHEETS.METER_POINTS);
  if (!sheet) return contentResponse({ status: "error", message: "MeterPoints sheet not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(params.meterId).trim()) {
      const set = (col, val) => { if (val !== undefined) sheet.getRange(i+1, col).setValue(val); };
      set(2, params.type); set(3, params.name); set(4, params.location);
      set(5, Number(params.multiplier) || 1); set(6, Number(params.threshold) || 0);
      set(7, params.unit); set(8, params.notes);
      writeAuditLog(params.user || "System", "updateMeterPoint", params.meterId, "Updated");
      return contentResponse({ status: "success" });
    }
  }
  return contentResponse({ status: "error", message: "MeterPoint không tìm thấy" });
}
