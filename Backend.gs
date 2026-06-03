/**
 * GOOGLE APPS SCRIPT - BACKEND FOR QR-UID SYSTEM (SECURED)
 * 
 * Instructions:
 * 1. Create a Google Sheet.
 * 2. Rename Sheet1 to "Devices" and add columns: UID, Name, Location.
 * 3. Add another sheet named "Logs" and add columns: Timestamp, UID, Items, Notes, User.
 * 4. Open Extensions > Apps Script.
 * 5. Paste this code and Deploy as Web App (Execute as: Me, Access: Anyone).
 */

// ==========================================
// CONFIGURATION / CẤU HÌNH
// ==========================================
// Nếu dùng Script độc lập, hãy dán ID của Google Sheet vào đây.
// Nếu Script được gắn trực tiếp vào Sheet (Container-bound), nó sẽ tự lấy ID.
const MANUAL_SHEET_ID = "1K_5jb0-TrshgCyNs_l5jjTpVjwdmHI-l9gpSHWXTdSg"; 
const API_TOKEN = "HAPU_QR_SECRET_2026"; 

// [TÙY CHỌN] Webhook nhận thông báo tự động
const DISCORD_WEBHOOK_URL = ""; // VD: "https://discord.com/api/webhooks/..."
const TELEGRAM_BOT_TOKEN = "8123778511:AAFofqkL1DBCgl41GVXPWaq6keNG2HDfj1I";
const TELEGRAM_CHAT_ID = "-4279433930";

// Tự động xác định SHEET_ID
const SHEET_ID = MANUAL_SHEET_ID ? MANUAL_SHEET_ID : (function() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet().getId();
  } catch (e) {
    return MANUAL_SHEET_ID;
  }
})();
// ==========================================

function doGet(e) {
  // 1. Xử lý khi nhấn nút 'Run' trong Editor hoặc truy cập trình duyệt trực tiếp
  if (!e || !e.parameter) {
    return HtmlService.createHtmlOutput(
      "<div style='font-family: sans-serif; padding: 20px; border-radius: 10px; background: #f0f4f8;'>" +
      "<h2>✅ BanDienScan Backend is Live!</h2>" +
      "<p>Hệ thống Backend đang hoạt động tốt.</p>" +
      "<p><b>Hướng dẫn:</b> Để kiểm tra cấu hình, hãy chọn hàm <code style='background:#eee;padding:2px 5px'>testConnection</code> trên thanh công cụ Script Editor và nhấn <b>Run</b>.</p>" +
      "<p>Dữ liệu API chỉ có thể truy cập thông qua Web App URL từ ứng dụng di động.</p></div>"
    );
  }

  const token = e.parameter.token;
  const uid = e.parameter.uid;
  const action = e.parameter.action;

  // 2. Phản hồi nhanh cho lệnh ping (Không cần token nếu chỉ để check live)
  if (action === 'ping') {
    return contentResponse({ status: "success", message: "Pong! Backend is responsive." });
  }

  // 3. Kiểm tra bảo mật (Security Check)
  if (token !== API_TOKEN) {
    return contentResponse({ status: "error", message: "Unauthorized: Invalid API Token" });
  }

  try {
    switch (action) {
      case 'setupHeaders': {
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const devSheet = ss.getSheetByName("Devices");
        if (devSheet) {
          devSheet.getRange(1, 10).setValue("Manufacture Date");
          devSheet.getRange(1, 11).setValue("Installation Date");
          devSheet.getRange(1, 12).setValue("Status");
          devSheet.getRange(1, 13).setValue("Project");
          devSheet.getRange(1, 14).setValue("Serial Number");
          devSheet.getRange(1, 15).setValue("Area");
          devSheet.getRange(1, 16).setValue("EquipmentType");
        }
        const userSheet = ss.getSheetByName("Users");
        if (userSheet) {
          userSheet.getRange(1, 4).setValue("Teams");
        }
        // Auto-create Projects sheet if it doesn't exist
        let projSheet = ss.getSheetByName("Projects");
        if (!projSheet) {
          projSheet = ss.insertSheet("Projects");
          projSheet.getRange(1, 1, 1, 5).setValues([["ProjectID", "Name", "Status", "StartDate", "EndDate"]]);
          projSheet.getRange(1, 1, 1, 5).setFontWeight("bold");
        }
        // Auto-create Shifts sheet if it doesn't exist
        let shiftSheet = ss.getSheetByName("Shifts");
        if (!shiftSheet) {
          shiftSheet = ss.insertSheet("Shifts");
          shiftSheet.getRange(1, 1, 1, 4).setValues([["ShiftID", "Name", "Description", "Status"]]);
          shiftSheet.getRange(1, 1, 1, 4).setFontWeight("bold");
        }
        // Auto-create AuditLog sheet if it doesn't exist
        let auditSheet = ss.getSheetByName("AuditLog");
        if (!auditSheet) {
          auditSheet = ss.insertSheet("AuditLog");
          auditSheet.getRange(1, 1, 1, 5).setValues([["Timestamp", "User", "Action", "Target", "Details"]]);
          auditSheet.getRange(1, 1, 1, 5).setFontWeight("bold");
        }
        return contentResponse({ status: "success", message: "Headers configured. Projects, Shifts, AuditLog & Area/EquipmentType columns ensured." });
      }

      case 'login': {
        const pin = e.parameter.pin;
        const userParam = e.parameter.username || e.parameter.user; // support both parameters
        if (!pin || !userParam) return contentResponse({ status: "error", message: "Missing credentials" });

        const ss = SpreadsheetApp.openById(SHEET_ID);
        const userSheet = ss.getSheetByName("Users");
        if (!userSheet) return contentResponse({ status: "error", message: "Users sheet not found" });
        const users = userSheet.getDataRange().getValues();
        let userRole = null; let userName = null; let userTeams = "";
        
        for (let i = 1; i < users.length; i++) {
          if (String(users[i][0]).trim().toLowerCase() === String(userParam).trim().toLowerCase() 
              && String(users[i][1]).trim() == String(pin).trim()) {
            userName = users[i][0];
            userRole = users[i][2];
            userTeams = users[i][3] || "";
            break;
          }
        }
        if (!userRole) return contentResponse({ status: "error", message: "Sai tên đăng nhập hoặc mật khẩu" });
        
        writeAuditLog(userName, "Login", "Web App", "Đăng nhập thành công");
        
        // Preload devices
        const devSheet = ss.getSheetByName("Devices");
        const devData = devSheet ? devSheet.getDataRange().getValues() : [];
        let devices = [];
        for (let i = 1; i < devData.length; i++) {
          devices.push({
            uid: devData[i][0],
            name: devData[i][1],
            location: devData[i][2],
            specs: devData[i][3] || "N/A",
            cycle: devData[i][4] || 30,
            nextMaintenance: devData[i][5] || "",
            manager: devData[i][6] || "Chưa phân công",
            shift: devData[i][7] || "Chưa phân công",
            warningDays: devData[i][8] || 7,
            manufactureDate: devData[i][9] || "",
            installationDate: devData[i][10] || "",
            status: devData[i][11] || "IN",
            project: devData[i][12] || "",
            serialNumber: devData[i][13] || "",
            area: devData[i][14] || "",
            equipmentType: devData[i][15] || ""
          });
        }

        const checkSheet = ss.getSheetByName("Checklists");
        const checklists = checkSheet ? checkSheet.getDataRange().getValues().slice(1).map(r => ({ type: r[0], id: r[1], title: r[2], desc: r[3] })) : [];

        // Preload users list for AssignedTo dropdown
        let usersList = [];
        for (let i = 1; i < users.length; i++) {
          usersList.push({
            name: users[i][0],
            role: users[i][2],
            teams: users[i][3] || ""
          });
        }

        return contentResponse({ 
          status: "success", 
          user: { name: userName, role: userRole, teams: userTeams },
          devices: devices,
          checklists: checklists,
          users: usersList
        });
      }

      case 'getDeviceHistory': {
        if (!uid) return contentResponse({ status: "error", message: "Missing UID" });
        const logSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Logs");
        if (!logSheet) return contentResponse({ status: "error", message: "Logs sheet not found" });
        const logData = logSheet.getDataRange().getValues();
        let history = [];
        for (let i = logData.length - 1; i >= 1; i--) {
          if (String(logData[i][1]) === String(uid)) {
            history.push({
              time: logData[i][0],
              action: logData[i][2],
              notes: logData[i][3],
              user: logData[i][4]
            });
          }
          if (history.length >= 5) break;
        }
        return contentResponse({ status: "success", history: history });
      }

      case 'getWorkOrders': {
        const role = e.parameter.role;
        const username = e.parameter.username;
        const woSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("WorkOrders");
        if (!woSheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });
        const woData = woSheet.getDataRange().getValues();
        const workOrders = [];
        for (let i = 1; i < woData.length; i++) {
          const wo = {
            woId:        woData[i][0],
            type:        woData[i][1],
            priority:    woData[i][2],
            status:      woData[i][3],
            assetUID:    woData[i][4],
            assignedTo:  woData[i][5],
            dueDate:     woData[i][6],
            description: woData[i][7],
            partsUsed:   woData[i][8],
            createdAt:   woData[i][9],
            cost:        woData[i][10] || 0,
            subTasks:    woData[i][11] || '',
            project:     woData[i][12] || '',
            requestSource: woData[i][13] || "Noi bo"
          };
          if (role === 'Technician' && username) {
            if (String(wo.assignedTo).trim().toLowerCase() === String(username).trim().toLowerCase()) {
              workOrders.push(wo);
            }
          } else {
            workOrders.push(wo);
          }
        }
        return contentResponse({ status: "success", workOrders: workOrders });
      }

      case 'getInventory': {
        const invSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Inventory");
        if (!invSheet) return contentResponse({ status: "error", message: "Inventory sheet not found" });
        const invData = invSheet.getDataRange().getValues();
        const inventory = [];
        const headers = invData[0] || [];
        for (let i = 1; i < invData.length; i++) {
          const item = {};
          for (let j = 0; j < headers.length; j++) {
            item[headers[j]] = invData[i][j];
          }
          inventory.push(item);
        }
        return contentResponse({ status: "success", inventory: inventory });
      }

      case 'getStaff': {
        const staffSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Staff");
        if (!staffSheet) return contentResponse({ status: "error", message: "Staff sheet not found" });
        const staffData = staffSheet.getDataRange().getValues();
        const staff = [];
        for (let i = 1; i < staffData.length; i++) {
          if (!staffData[i][0]) continue;
          staff.push({ id: staffData[i][0], name: staffData[i][1], position: staffData[i][2], dept: staffData[i][3], phone: staffData[i][4] || "" });
        }
        return contentResponse({ status: "success", staff: staff });
      }

      case 'getProjects': {
        const projSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Projects");
        if (!projSheet) return contentResponse({ status: "error", message: "Projects sheet not found" });
        const projData = projSheet.getDataRange().getValues();
        const projects = [];
        for (let i = 1; i < projData.length; i++) {
          if (!projData[i][0]) continue;
          projects.push({ id: projData[i][0], name: projData[i][1], status: projData[i][2] || "Active", startDate: projData[i][3] || "", endDate: projData[i][4] || "" });
        }
        return contentResponse({ status: "success", projects: projects });
      }

      case 'getShifts': {
        const shiftSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Shifts");
        if (!shiftSheet) return contentResponse({ status: "error", message: "Shifts sheet not found" });
        const shiftData = shiftSheet.getDataRange().getValues();
        const shifts = [];
        for (let i = 1; i < shiftData.length; i++) {
          if (!shiftData[i][0]) continue;
          shifts.push({ id: shiftData[i][0], name: shiftData[i][1], description: shiftData[i][2] || "", status: shiftData[i][3] || "Active" });
        }
        return contentResponse({ status: "success", shifts: shifts });
      }

      case 'getAnalyticsData': {
        const adSS = SpreadsheetApp.openById(SHEET_ID);
        const adDevices = adSS.getSheetByName("Devices").getDataRange().getValues().slice(1).filter(r => r[0]);
        const adLogs = adSS.getSheetByName("Logs").getDataRange().getValues().slice(1);
        const adWOSheet = adSS.getSheetByName("WorkOrders");
        const adWOs = adWOSheet ? adWOSheet.getDataRange().getValues().slice(1) : [];

        const adToday = new Date(); adToday.setHours(0, 0, 0, 0);
        let adOverdue = 0;
        adDevices.forEach(r => {
          if (r[5]) { const d = new Date(r[5]); d.setHours(0,0,0,0); if (d < adToday) adOverdue++; }
        });

        const adWOByStatus = {};
        adWOs.forEach(r => { const s = r[3] || 'New'; adWOByStatus[s] = (adWOByStatus[s] || 0) + 1; });

        const adSixMonthsAgo = new Date(); adSixMonthsAgo.setMonth(adSixMonthsAgo.getMonth() - 5); adSixMonthsAgo.setDate(1); adSixMonthsAgo.setHours(0,0,0,0);
        const adLogsByMonth = {};
        adLogs.forEach(r => {
          if (!r[0]) return;
          const d = new Date(r[0]);
          if (d >= adSixMonthsAgo) {
            const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            adLogsByMonth[key] = (adLogsByMonth[key] || 0) + 1;
          }
        });

        const adByArea = {};
        adDevices.forEach(r => { 
          const a = r[14] || 'Chưa phân khu'; // Index 14 is Area (Column O)
          adByArea[a] = (adByArea[a] || 0) + 1; 
        });

        const adActive = (adWOByStatus['New']||0) + (adWOByStatus['Assigned']||0) + (adWOByStatus['In Progress']||0);
        return contentResponse({
          status: 'success',
          kpi: { total: adDevices.length, overdue: adOverdue, activeWOs: adActive, doneWOs: adWOByStatus['Done'] || 0 },
          woByStatus: adWOByStatus,
          logsByMonth: adLogsByMonth,
          byArea: adByArea
        });
      }

      case 'getMaintenanceDue': {
        const dmSS = SpreadsheetApp.openById(SHEET_ID);
        const dmData = dmSS.getSheetByName("Devices").getDataRange().getValues().slice(1);
        const dmToday = new Date();
        dmToday.setHours(0, 0, 0, 0);
        const dmSchedule = dmData
          .filter(r => r[0])
          .map(r => {
            const rawNext = r[5];
            let nextMaintenance = null, daysUntil = null, scheduleStatus = 'never';
            if (rawNext) {
              const nextDate = new Date(rawNext);
              if (!isNaN(nextDate)) {
                nextDate.setHours(0, 0, 0, 0);
                nextMaintenance = Utilities.formatDate(nextDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
                daysUntil = Math.round((nextDate - dmToday) / (1000 * 60 * 60 * 24));
                scheduleStatus = daysUntil < 0 ? 'overdue' : (daysUntil <= 3 ? 'due_soon' : 'scheduled');
              }
            }
            return { uid: r[0], name: r[1], location: r[2], cycle: r[4], nextMaintenance, daysUntil, scheduleStatus };
          });
        return contentResponse({ status: 'success', data: dmSchedule });
      }

      case 'tempDumpDevices': {
        const targetId = e.parameter.sheetId || SHEET_ID;
        const dumpSS = SpreadsheetApp.openById(targetId);
        const dumpData = dumpSS.getSheetByName("Devices").getDataRange().getValues();
        const dumpDevices = dumpData.slice(1).map((r, i) => ({ 
          index: i + 2, 
          uid: r[0] || '', 
          name: r[1] || '', 
          location: r[2] || '',
          specs: r[3] || '',
          cycle: r[4] || '',
          next: r[5] || '',
          manager: r[6] || '',
          shift: r[7] || '',
          warningDays: r[8] || '',
          manufactureDate: r[9] || '',
          installationDate: r[10] || '',
          status: r[11] || '',
          project: r[12] || '',
          serialNumber: r[13] || '',
          area: r[14] || '',
          equipmentType: r[15] || ''
        }));
        return contentResponse({ status: "success", devices: dumpDevices });
      }

      case 'migrateDevicesData': {
        return migrateDevicesData();
      }

      default: {
        if (!uid) return contentResponse({ status: "error", message: "Unknown action or Missing UID" });
        const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
        const devData = devSheet.getDataRange().getValues();
        let deviceData = null;
        for (let i = 1; i < devData.length; i++) {
          if (String(devData[i][0]) === String(uid)) {
            deviceData = {
              uid: devData[i][0],
              name: devData[i][1],
              location: devData[i][2],
              specs: devData[i][3] || "N/A",
              cycle: devData[i][4] || 30,
              nextMaintenance: devData[i][5] || "",
              manager: devData[i][6] || "Chưa phân công",
              shift: devData[i][7] || "Chưa phân công",
              warningDays: devData[i][8] || 7,
              manufactureDate: devData[i][9] || "",
              installationDate: devData[i][10] || "",
              status: devData[i][11] || "IN",
              project: devData[i][12] || "",
              serialNumber: devData[i][13] || "",
              area: devData[i][14] || "",
              equipmentType: devData[i][15] || ""
            };
            break;
          }
        }
        if (!deviceData) return contentResponse({ status: "not_found", message: "Device not found" });

        // Get recent history
        const logSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Logs");
        const logData = logSheet ? logSheet.getDataRange().getValues() : [];
        let history = [];
        for (let i = logData.length - 1; i > 0; i--) {
          if (String(logData[i][1]) === String(uid)) {
            history.push({
              date: logData[i][0],
              notes: logData[i][3]
            });
            if (history.length >= 3) break;
          }
        }
        deviceData.history = history;

        return contentResponse({ status: "success", data: deviceData });
      }
    }
  } catch (err) {
    return contentResponse({ status: "error", message: "Server Error (GET): " + err.toString() });
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    
    // Security Check
    if (params.token !== API_TOKEN) {
      return contentResponse({ status: "error", message: "Unauthorized access" });
    }

    // action=createDevice - Admin can add device from Web App
    if (params.action === 'createDevice') {
      const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
      if (!devSheet) return contentResponse({ status: "error", message: "Devices sheet not found" });

      // Check if UID already exists
      const devData = devSheet.getDataRange().getValues();
      for (let i = 1; i < devData.length; i++) {
        if (String(devData[i][0]).trim() === String(params.uid).trim()) {
          return contentResponse({ status: "error", message: "UID đã tồn tại!" });
        }
      }

      const area = params.area || determineArea(params.name || '', params.location || '', devData.length);
      const eqType = params.equipmentType || determineEquipmentType(params.name || '', params.location || '', devData.length);

      devSheet.appendRow([
        params.uid || '',
        params.name || '',
        params.location || '',
        params.specs || '',
        params.cycle || 30,
        params.nextMaintenance || '',
        params.manager || 'Chưa phân công',
        params.shift || 'Chưa phân công',
        params.warningDays || 7,
        params.manufactureDate || '',
        params.installationDate || '',
        'IN', // Column 12: Status
        params.project || '', // Column 13: Project
        params.serialNumber || '', // Column 14: Serial Number
        area, // Column 15: Area
        eqType // Column 16: EquipmentType
      ]);

      // Write audit log entry
      writeAuditLog(params.user || 'System', 'createDevice', params.uid, 'Created new device via Web App');
      
      const msg = `✨ **Thiết bị mới:** ${params.name}\n**UID:** ${params.uid}\n**Vị trí:** ${params.location}\n**Tổ:** ${params.manager}\n**Lịch bảo trì:** ${params.cycle} ngày/lần (Tới hạn: ${params.nextMaintenance || 'Chưa rõ'} - Báo trước: ${params.warningDays || 7} ngày)`;
      sendAlert(msg);

      return contentResponse({ status: "success", message: "Đã thêm thiết bị mới" });
    }

    // action=createDevicesBatch - Admin/Manager can add multiple devices at once
    if (params.action === 'createDevicesBatch') {
      const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
      if (!devSheet) return contentResponse({ status: "error", message: "Devices sheet not found" });

      const devData = devSheet.getDataRange().getValues();
      const existingUids = new Set();
      for (let i = 1; i < devData.length; i++) {
        existingUids.add(String(devData[i][0]).trim());
      }

      const newDevices = params.devices || [];
      const rowsToAppend = [];
      const skippedUids = [];

      newDevices.forEach(d => {
        const uid = String(d.uid).trim();
        if (existingUids.has(uid)) {
          skippedUids.push(uid);
        } else {
          const area = d.area || determineArea(d.name || '', d.location || '', devData.length + rowsToAppend.length);
          const eqType = d.equipmentType || determineEquipmentType(d.name || '', d.location || '', devData.length + rowsToAppend.length);
          rowsToAppend.push([
            uid,
            d.name || '',
            d.location || '',
            d.specs || '',
            d.cycle || 30,
            d.nextMaintenance || '',
            d.manager || 'Chưa phân công',
            d.shift || 'Chưa phân công',
            d.warningDays || 7,
            d.manufactureDate || '',
            d.installationDate || '',
            'IN', // Status
            d.project || '', // Project
            d.serialNumber || '', // Serial Number
            area, // Area
            eqType // EquipmentType
          ]);
          existingUids.add(uid);
        }
      });

      if (rowsToAppend.length > 0) {
        const lastRow = devSheet.getLastRow();
        devSheet.getRange(lastRow + 1, 1, rowsToAppend.length, 16).setValues(rowsToAppend);
        writeAuditLog(params.user || 'System', 'createDevicesBatch', `${rowsToAppend.length} devices`, `Batch created ${rowsToAppend.length} devices via Web App`);
        sendAlert(`⚡ **Tạo hàng loạt:** Đã tạo thành công ${rowsToAppend.length} thiết bị mới cho dự án "${params.project || 'Chưa phân công'}".`);
      }

      return contentResponse({ 
        status: "success", 
        addedCount: rowsToAppend.length, 
        skipped: skippedUids 
      });
    }

    // action=updateDevice — Update an existing device details
    if (params.action === 'updateDevice') {
      const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
      if (!devSheet) return contentResponse({ status: "error", message: "Devices sheet not found" });

      const devData = devSheet.getDataRange().getValues();
      let rowIdx = -1;
      for (let i = 1; i < devData.length; i++) {
        if (String(devData[i][0]).trim() === String(params.uid).trim()) {
          rowIdx = i + 1;
          break;
        }
      }

      if (rowIdx === -1) {
        return contentResponse({ status: "error", message: "Không tìm thấy thiết bị để cập nhật" });
      }

      // Update cells
      devSheet.getRange(rowIdx, 2).setValue(params.name || '');
      devSheet.getRange(rowIdx, 3).setValue(params.location || '');
      devSheet.getRange(rowIdx, 5).setValue(params.cycle || 30);
      devSheet.getRange(rowIdx, 6).setValue(params.nextMaintenance || '');
      devSheet.getRange(rowIdx, 7).setValue(params.manager || 'Chưa phân công');
      devSheet.getRange(rowIdx, 8).setValue(params.shift || 'Chưa phân công');
      devSheet.getRange(rowIdx, 9).setValue(params.warningDays || 7);
      devSheet.getRange(rowIdx, 10).setValue(params.manufactureDate || '');
      devSheet.getRange(rowIdx, 11).setValue(params.installationDate || '');
      devSheet.getRange(rowIdx, 13).setValue(params.project || '');
      devSheet.getRange(rowIdx, 14).setValue(params.serialNumber || '');
      if (params.area !== undefined) devSheet.getRange(rowIdx, 15).setValue(params.area);
      if (params.equipmentType !== undefined) devSheet.getRange(rowIdx, 16).setValue(params.equipmentType);

      writeAuditLog(params.user || 'System', 'updateDevice', params.uid, 'Updated device details via Web App');
      return contentResponse({ status: "success", message: "Đã cập nhật thiết bị thành công" });
    }

    // action=createWO — Create a new Work Order with auto-generated WO_ID (WO-YYYYMM-NNNNN)
    if (params.action === 'createWO') {
      if (!params.description || !String(params.description).trim()) {
        return contentResponse({ status: "error", message: "Mô tả công việc không được để trống" });
      }

      const validationError = validateWOPayload(params);
      if (validationError) return contentResponse({ status: "error", message: validationError });

      const woSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("WorkOrders");
      if (!woSheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });

      // Build WO_ID: WO-YYYYMM-NNNNN based on last row count
      const now = new Date();
      const yyyymm = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0');
      const lastRow = woSheet.getLastRow();
      const seq = String(lastRow).padStart(5, '0');
      const woId = 'WO-' + yyyymm + '-' + seq;

      // Parse cost as number (default 0)
      const cost = params.cost ? Number(params.cost) : 0;

      // SubTasks: accept JSON string or plain text (each line = 1 subtask)
      let subTasks = '';
      if (params.subTasks) {
        try {
          // If already JSON array, keep as-is
          const parsed = JSON.parse(params.subTasks);
          subTasks = JSON.stringify(parsed);
        } catch (e) {
          // Convert plain text lines to JSON array
          const lines = String(params.subTasks).split('\n').filter(l => l.trim());
          subTasks = JSON.stringify(lines.map(l => ({ title: l.trim(), done: false })));
        }
      }

      woSheet.appendRow([
        woId,
        params.type        || '',
        params.priority    || 'Medium',
        params.status      || 'New',
        params.assetUID    || '',
        params.assignedTo  || '',
        params.dueDate     || '',
        params.description || '',
        params.partsUsed   || '',
        now,
        cost,
        subTasks,
        params.project     || '',
        params.requestSource || "Noi bo"
      ]);

      // Write audit log entry
      writeAuditLog(params.user || 'System', 'createWO', woId, 'Created new Work Order');

      return contentResponse({ status: "success", woId: woId });
    }

    // action=updateWOStatus — Update status of an existing Work Order and log to AuditLog
    if (params.action === 'updateWOStatus') {
      if (!params.woId && !params.wo_id) {
        return contentResponse({ status: "error", message: "Missing woId" });
      }
      const targetWoId = params.woId || params.wo_id;
      if (!params.status) {
        return contentResponse({ status: "error", message: "Missing status" });
      }

      const woSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("WorkOrders");
      if (!woSheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });

      const woData = woSheet.getDataRange().getValues();
      let updated = false;
      for (let i = 1; i < woData.length; i++) {
        if (String(woData[i][0]).trim() === String(targetWoId).trim()) {
          woSheet.getRange(i + 1, 4).setValue(params.status); // Column D = Status
          updated = true;
          break;
        }
      }

      if (!updated) return contentResponse({ status: "error", message: "Work Order not found" });

      // Write audit log entry
      const details = params.notes ? params.status + ' — ' + params.notes : params.status;
      writeAuditLog(params.user || 'System', 'updateWOStatus', targetWoId, details);

      return contentResponse({ status: "success" });
    }

    // action=updateWO — Full update of a Work Order (all fields)
    if (params.action === 'updateWO') {
      const targetWoId = params.woId || params.wo_id;
      if (!targetWoId) {
        return contentResponse({ status: "error", message: "Missing woId" });
      }

      const validationError = validateWOPayload(params);
      if (validationError) return contentResponse({ status: "error", message: validationError });

      const woSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("WorkOrders");
      if (!woSheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });

      const woData = woSheet.getDataRange().getValues();
      let updated = false;
      for (let i = 1; i < woData.length; i++) {
        if (String(woData[i][0]).trim() === String(targetWoId).trim()) {
          const row = i + 1;
          // Update each field if provided (columns B-M, indices 2-13)
          if (params.type !== undefined)        woSheet.getRange(row, 2).setValue(params.type);
          if (params.priority !== undefined)    woSheet.getRange(row, 3).setValue(params.priority);
          if (params.status !== undefined)      woSheet.getRange(row, 4).setValue(params.status);
          if (params.assetUID !== undefined)    woSheet.getRange(row, 5).setValue(params.assetUID);
          if (params.assignedTo !== undefined)  woSheet.getRange(row, 6).setValue(params.assignedTo);
          if (params.dueDate !== undefined)     woSheet.getRange(row, 7).setValue(params.dueDate);
          if (params.description !== undefined) woSheet.getRange(row, 8).setValue(params.description);
          if (params.partsUsed !== undefined)   woSheet.getRange(row, 9).setValue(params.partsUsed);
          if (params.cost !== undefined)        woSheet.getRange(row, 11).setValue(Number(params.cost) || 0);
          if (params.subTasks !== undefined) {
            let subTasks = params.subTasks;
            if (typeof subTasks !== 'string') subTasks = JSON.stringify(subTasks);
            woSheet.getRange(row, 12).setValue(subTasks);
          }
          if (params.project !== undefined)     woSheet.getRange(row, 13).setValue(params.project);
          updated = true;
          break;
        }
      }

      if (!updated) return contentResponse({ status: "error", message: "Work Order not found" });

      writeAuditLog(params.user || 'System', 'updateWO', targetWoId, 'Updated Work Order fields');
      return contentResponse({ status: "success" });
    }

    // action=deleteWO — Delete a Work Order (Admin only, enforced by frontend)
    if (params.action === 'deleteWO') {
      const targetWoId = params.woId || params.wo_id;
      if (!targetWoId) {
        return contentResponse({ status: "error", message: "Missing woId" });
      }

      const woSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("WorkOrders");
      if (!woSheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });

      const woData = woSheet.getDataRange().getValues();
      let deleted = false;
      for (let i = 1; i < woData.length; i++) {
        if (String(woData[i][0]).trim() === String(targetWoId).trim()) {
          woSheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      if (!deleted) return contentResponse({ status: "error", message: "Work Order not found" });

      writeAuditLog(params.user || 'System', 'deleteWO', targetWoId, 'Deleted Work Order');
      return contentResponse({ status: "success" });
    }

    // action=createProject
    if (params.action === "createProject") {
      if (!params.name || !String(params.name).trim()) return contentResponse({ status: "error", message: "Tên dự án không được để trống" });
      const projSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Projects");
      if (!projSheet) return contentResponse({ status: "error", message: "Projects sheet not found" });
      const now = new Date();
      const yyyymm = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, "0");
      const seq = String(projSheet.getLastRow()).padStart(3, "0");
      const projectId = "PRJ-" + yyyymm + "-" + seq;
      projSheet.appendRow([projectId, params.name.trim(), params.status || "Active", params.startDate || "", params.endDate || ""]);
      writeAuditLog(params.user || "System", "createProject", projectId, "Created project: " + params.name);
      return contentResponse({ status: "success", projectId: projectId, name: params.name.trim() });
    }

    // action=updateProject
    if (params.action === "updateProject") {
      if (!params.projectId) return contentResponse({ status: "error", message: "Thiếu mã dự án" });
      if (!params.name || !String(params.name).trim()) return contentResponse({ status: "error", message: "Tên dự án không được để trống" });
      const projSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Projects");
      if (!projSheet) return contentResponse({ status: "error", message: "Projects sheet not found" });
      
      const projData = projSheet.getDataRange().getValues();
      let rowIdx = -1;
      for (let i = 1; i < projData.length; i++) {
        if (String(projData[i][0]).trim() === String(params.projectId).trim()) {
          rowIdx = i + 1;
          break;
        }
      }
      if (rowIdx === -1) {
        return contentResponse({ status: "error", message: "Không tìm thấy dự án để cập nhật" });
      }
      
      const oldName = projData[rowIdx-1][1];
      const newName = params.name.trim();
      
      projSheet.getRange(rowIdx, 2).setValue(newName);
      projSheet.getRange(rowIdx, 3).setValue(params.status || "Active");
      projSheet.getRange(rowIdx, 4).setValue(params.startDate || "");
      projSheet.getRange(rowIdx, 5).setValue(params.endDate || "");
      
      // If project name changed, we also rename the project string on all associated devices
      if (oldName !== newName) {
        const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
        if (devSheet) {
          const devData = devSheet.getDataRange().getValues();
          for (let j = 1; j < devData.length; j++) {
            if (String(devData[j][12]).trim() === String(oldName).trim()) { // Column 13: Project (Index 12)
              devSheet.getRange(j + 1, 13).setValue(newName);
            }
          }
        }
      }
      
      writeAuditLog(params.user || "System", "updateProject", params.projectId, "Updated project: " + newName);
      return contentResponse({ status: "success", projectId: params.projectId, name: newName });
    }

    // action=deleteProject
    if (params.action === "deleteProject") {
      if (!params.projectId) return contentResponse({ status: "error", message: "Thiếu mã dự án" });
      const projSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Projects");
      if (!projSheet) return contentResponse({ status: "error", message: "Projects sheet not found" });
      
      const projData = projSheet.getDataRange().getValues();
      let rowIdx = -1;
      for (let i = 1; i < projData.length; i++) {
        if (String(projData[i][0]).trim() === String(params.projectId).trim()) {
          rowIdx = i + 1;
          break;
        }
      }
      if (rowIdx === -1) {
        return contentResponse({ status: "error", message: "Không tìm thấy dự án để xóa" });
      }
      
      const projName = projData[rowIdx-1][1];
      
      projSheet.deleteRow(rowIdx);
      
      // Set Project column to empty for all devices associated with this project name
      const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
      if (devSheet) {
        const devData = devSheet.getDataRange().getValues();
        for (let j = 1; j < devData.length; j++) {
          if (String(devData[j][12]).trim() === String(projName).trim()) { // Column 13: Project
            devSheet.getRange(j + 1, 13).setValue("");
          }
        }
      }
      
      writeAuditLog(params.user || "System", "deleteProject", params.projectId, "Deleted project: " + projName);
      return contentResponse({ status: "success", message: "Đã xóa dự án thành công" });
    }

    // action=createShift
    if (params.action === "createShift") {
      if (!params.name || !String(params.name).trim()) return contentResponse({ status: "error", message: "Tên ca trực không được để trống" });
      const shiftSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Shifts");
      if (!shiftSheet) return contentResponse({ status: "error", message: "Shifts sheet not found" });
      const now = new Date();
      const yyyymm = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, "0");
      const seq = String(shiftSheet.getLastRow()).padStart(3, "0");
      const shiftId = "SHF-" + yyyymm + "-" + seq;
      shiftSheet.appendRow([shiftId, params.name.trim(), params.description || "", params.status || "Active"]);
      writeAuditLog(params.user || "System", "createShift", shiftId, "Created shift: " + params.name);
      return contentResponse({ status: "success", shiftId: shiftId, name: params.name.trim() });
    }

    // action=updateShift
    if (params.action === "updateShift") {
      if (!params.shiftId) return contentResponse({ status: "error", message: "Thiếu mã ca trực" });
      if (!params.name || !String(params.name).trim()) return contentResponse({ status: "error", message: "Tên ca trực không được để trống" });
      const shiftSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Shifts");
      if (!shiftSheet) return contentResponse({ status: "error", message: "Shifts sheet not found" });
      
      const shiftData = shiftSheet.getDataRange().getValues();
      let rowIdx = -1;
      for (let i = 1; i < shiftData.length; i++) {
        if (String(shiftData[i][0]).trim() === String(params.shiftId).trim()) {
          rowIdx = i + 1;
          break;
        }
      }
      if (rowIdx === -1) {
        return contentResponse({ status: "error", message: "Không tìm thấy ca trực để cập nhật" });
      }
      
      const oldName = shiftData[rowIdx-1][1];
      const newName = params.name.trim();
      
      shiftSheet.getRange(rowIdx, 2).setValue(newName);
      shiftSheet.getRange(rowIdx, 3).setValue(params.description || "");
      shiftSheet.getRange(rowIdx, 4).setValue(params.status || "Active");
      
      // If shift name changed, we also rename the shift string on all associated devices
      if (oldName !== newName) {
        const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
        if (devSheet) {
          const devData = devSheet.getDataRange().getValues();
          for (let j = 1; j < devData.length; j++) {
            if (String(devData[j][7]).trim() === String(oldName).trim()) { // Column 8: Shift (Index 7)
              devSheet.getRange(j + 1, 8).setValue(newName);
            }
          }
        }
      }
      
      writeAuditLog(params.user || "System", "updateShift", params.shiftId, "Updated shift: " + newName);
      return contentResponse({ status: "success", shiftId: params.shiftId, name: newName });
    }

    // action=deleteShift
    if (params.action === "deleteShift") {
      if (!params.shiftId) return contentResponse({ status: "error", message: "Thiếu mã ca trực" });
      const shiftSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Shifts");
      if (!shiftSheet) return contentResponse({ status: "error", message: "Shifts sheet not found" });
      
      const shiftData = shiftSheet.getDataRange().getValues();
      let rowIdx = -1;
      for (let i = 1; i < shiftData.length; i++) {
        if (String(shiftData[i][0]).trim() === String(params.shiftId).trim()) {
          rowIdx = i + 1;
          break;
        }
      }
      if (rowIdx === -1) {
        return contentResponse({ status: "error", message: "Không tìm thấy ca trực để xóa" });
      }
      
      const shiftName = shiftData[rowIdx-1][1];
      
      shiftSheet.deleteRow(rowIdx);
      
      // Set Shift column to "Chưa phân công" for all devices associated with this shift name
      const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
      if (devSheet) {
        const devData = devSheet.getDataRange().getValues();
        for (let j = 1; j < devData.length; j++) {
          if (String(devData[j][7]).trim() === String(shiftName).trim()) { // Column 8: Shift
            devSheet.getRange(j + 1, 8).setValue("Chưa phân công");
          }
        }
      }
      
      writeAuditLog(params.user || "System", "deleteShift", params.shiftId, "Deleted shift: " + shiftName);
      return contentResponse({ status: "success", message: "Đã xóa ca trực thành công" });
    }

    // action=createLocation
    if (params.action === "createLocation") {
      if (!params.name || !String(params.name).trim()) return contentResponse({ status: "error", message: "Tên địa điểm không được để trống" });
      const locUid = String(params.uid || "").trim().toUpperCase();
      if (!locUid) return contentResponse({ status: "error", message: "Mã địa điểm (UID) không được để trống" });
      
      const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
      if (!devSheet) return contentResponse({ status: "error", message: "Devices sheet not found" });
      
      // Check if UID already exists
      const devData = devSheet.getDataRange().getValues();
      for (let i = 1; i < devData.length; i++) {
        if (String(devData[i][0]).trim().toUpperCase() === locUid) {
          return contentResponse({ status: "error", message: "Mã địa điểm (UID) đã tồn tại!" });
        }
      }
      
      devSheet.appendRow([
        locUid,
        params.name.trim(),
        params.name.trim(), // Location = Name
        "Địa điểm lắp đặt", // Specs = "Địa điểm lắp đặt"
        30, // Cycle = 30
        "", // Next Maintenance
        "Chưa phân công", // Manager
        "Chưa phân công", // Shift
        7, // Warning days
        "", // Mfg date
        "", // Install date
        "IN", // Status
        "", // Project
        "", // Serial number
        "", // Area
        ""  // EquipmentType
      ]);
      
      writeAuditLog(params.user || "System", "createLocation", locUid, "Created location device: " + params.name);
      return contentResponse({ status: "success", uid: locUid, name: params.name.trim() });
    }

    // action=updateLocation
    if (params.action === "updateLocation") {
      if (!params.uid) return contentResponse({ status: "error", message: "Thiếu mã địa điểm (UID)" });
      if (!params.name || !String(params.name).trim()) return contentResponse({ status: "error", message: "Tên địa điểm không được để trống" });
      
      const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
      if (!devSheet) return contentResponse({ status: "error", message: "Devices sheet not found" });
      
      const devData = devSheet.getDataRange().getValues();
      let rowIdx = -1;
      for (let i = 1; i < devData.length; i++) {
        if (String(devData[i][0]).trim() === String(params.uid).trim()) {
          rowIdx = i + 1;
          break;
        }
      }
      if (rowIdx === -1) {
        return contentResponse({ status: "error", message: "Không tìm thấy địa điểm để cập nhật" });
      }
      
      const oldName = devData[rowIdx-1][1];
      const newName = params.name.trim();
      
      // Update the location device row: Name (Col B) and Location (Col C)
      devSheet.getRange(rowIdx, 2).setValue(newName);
      devSheet.getRange(rowIdx, 3).setValue(newName);
      
      // Update all devices installed at this oldLocation name to the new name (Col C)
      if (oldName !== newName) {
        for (let j = 1; j < devData.length; j++) {
          if (String(devData[j][2]).trim() === String(oldName).trim() && j + 1 !== rowIdx) {
            devSheet.getRange(j + 1, 3).setValue(newName);
          }
        }
      }
      
      writeAuditLog(params.user || "System", "updateLocation", params.uid, "Updated location name from " + oldName + " to " + newName);
      return contentResponse({ status: "success", uid: params.uid, name: newName });
    }

    // action=deleteLocation
    if (params.action === "deleteLocation") {
      if (!params.uid) return contentResponse({ status: "error", message: "Thiếu mã địa điểm (UID)" });
      
      const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
      if (!devSheet) return contentResponse({ status: "error", message: "Devices sheet not found" });
      
      const devData = devSheet.getDataRange().getValues();
      let rowIdx = -1;
      for (let i = 1; i < devData.length; i++) {
        if (String(devData[i][0]).trim() === String(params.uid).trim()) {
          rowIdx = i + 1;
          break;
        }
      }
      if (rowIdx === -1) {
        return contentResponse({ status: "error", message: "Không tìm thấy địa điểm để xóa" });
      }
      
      const locName = devData[rowIdx-1][1];
      
      // Update all other devices installed at this deleted location to "Chưa phân công" (Col C)
      for (let j = 1; j < devData.length; j++) {
        if (j + 1 !== rowIdx && String(devData[j][2]).trim() === String(locName).trim()) {
          devSheet.getRange(j + 1, 3).setValue("Chưa phân công");
        }
      }
      
      // Delete the location device row
      devSheet.deleteRow(rowIdx);
      
      writeAuditLog(params.user || "System", "deleteLocation", params.uid, "Deleted location: " + locName);
      return contentResponse({ status: "success", message: "Đã xóa địa điểm thành công" });
    }

    // action=changePassword — Change user PIN in Users sheet
    if (params.action === 'changePassword') {
      const userSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Users");
      if (!userSheet) return contentResponse({ status: "error", message: "Users sheet not found" });

      const users = userSheet.getDataRange().getValues();
      let foundIndex = -1;
      
      // Find user and verify old password (Username: Col A, PIN: Col B)
      for (let i = 1; i < users.length; i++) {
        if (String(users[i][0]).trim().toLowerCase() === String(params.username).trim().toLowerCase() 
            && String(users[i][1]) == String(params.oldPin)) {
          foundIndex = i + 1;
          break;
        }
      }

      if (foundIndex === -1) {
        return contentResponse({ status: "error", message: "Mật khẩu cũ không chính xác" });
      }

      // Update password
      userSheet.getRange(foundIndex, 2).setValue(params.newPin);
      
      // Log the event
      writeAuditLog(params.username, 'changePassword', params.username, 'User changed their own password');

      return contentResponse({ status: "success" });
    }

    // action=createChecklistItem — Create a new checklist item in the Checklists tab
    if (params.action === 'createChecklistItem') {
      const checkSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Checklists");
      if (!checkSheet) return contentResponse({ status: "error", message: "Checklists sheet not found" });

      // Check if ID already exists for this type
      const checkData = checkSheet.getDataRange().getValues();
      for (let i = 1; i < checkData.length; i++) {
        if (String(checkData[i][0]).trim().toLowerCase() === String(params.type).trim().toLowerCase() && 
            String(checkData[i][1]).trim() === String(params.id).trim()) {
          return contentResponse({ status: "error", message: "ID cho loại thiết bị này đã tồn tại!" });
        }
      }

      checkSheet.appendRow([
        String(params.type).trim().toLowerCase(),
        String(params.id).trim(),
        params.title || '',
        params.desc || ''
      ]);

      writeAuditLog(params.user || 'System', 'createChecklistItem', params.id, 'Created new checklist item: ' + params.title + ' for type: ' + params.type);
      return contentResponse({ status: "success", message: "Đã thêm hạng mục thành công" });
    }

    // action=updateChecklistItem — Update an existing checklist item in the Checklists tab
    if (params.action === 'updateChecklistItem') {
      const checkSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Checklists");
      if (!checkSheet) return contentResponse({ status: "error", message: "Checklists sheet not found" });

      const checkData = checkSheet.getDataRange().getValues();
      let updated = false;
      for (let i = 1; i < checkData.length; i++) {
        if (String(checkData[i][0]).trim().toLowerCase() === String(params.originalType).trim().toLowerCase() && 
            String(checkData[i][1]).trim() === String(params.originalId).trim()) {
          checkSheet.getRange(i + 1, 1).setValue(String(params.type).trim().toLowerCase());
          checkSheet.getRange(i + 1, 2).setValue(String(params.id).trim());
          checkSheet.getRange(i + 1, 3).setValue(params.title || '');
          checkSheet.getRange(i + 1, 4).setValue(params.desc || '');
          updated = true;
          break;
        }
      }

      if (!updated) return contentResponse({ status: "error", message: "Hạng mục không tìm thấy" });

      writeAuditLog(params.user || 'System', 'updateChecklistItem', params.id, 'Updated checklist item: ' + params.title + ' for type: ' + params.type);
      return contentResponse({ status: "success", message: "Đã cập nhật hạng mục" });
    }

    // action=deleteChecklistItem — Delete a checklist item from the Checklists tab
    if (params.action === 'deleteChecklistItem') {
      const checkSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Checklists");
      if (!checkSheet) return contentResponse({ status: "error", message: "Checklists sheet not found" });

      const checkData = checkSheet.getDataRange().getValues();
      let deleted = false;
      for (let i = 1; i < checkData.length; i++) {
        if (String(checkData[i][0]).trim().toLowerCase() === String(params.type).trim().toLowerCase() && 
            String(checkData[i][1]).trim() === String(params.id).trim()) {
          checkSheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      if (!deleted) return contentResponse({ status: "error", message: "Hạng mục không tìm thấy" });

      writeAuditLog(params.user || 'System', 'deleteChecklistItem', params.id, 'Deleted checklist item for type: ' + params.type);
      return contentResponse({ status: "success", message: "Đã xóa hạng mục" });
    }

    // action=logInOut — Record IN/OUT movement and update Device status
    if (params.action === 'logInOut') {
      const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
      const logSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Logs");
      
      const devData = devSheet.getDataRange().getValues();
      let updated = false;
      for (let i = 1; i < devData.length; i++) {
        if (String(devData[i][0]) === String(params.uid)) {
          // Update Status in Column L (12)
          devSheet.getRange(i + 1, 12).setValue(params.status); 
          // If a new location is specified, update it too in Column C (3)
          if (params.newLocation) {
            devSheet.getRange(i + 1, 3).setValue(params.newLocation);
          }
          updated = true;
          break;
        }
      }
      
      // Append to Logs
      logSheet.appendRow([
        new Date(),
        params.uid,
        params.status, // IN or OUT
        params.notes || '',
        params.user || 'Mobile User'
      ]);

      return contentResponse({ status: "success", updated: updated });
    }

    // Default Action: Check-list submission with optional Image
    const logSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Logs");
    
    let imageUrl = "";
    if (params.image && params.image.base64) {
      try {
        // Find or Create Folder
        const folderName = "QR_Maintenance_Images";
        let folders = DriveApp.getFoldersByName(folderName);
        let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
        
        // Save Image
        const contentType = params.image.mimeType || "image/jpeg";
        const decodeData = Utilities.base64Decode(params.image.base64);
        const blob = Utilities.newBlob(decodeData, contentType, "IMG_" + params.uid + "_" + new Date().getTime());
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        imageUrl = file.getUrl();
      } catch (err) {
        // Fallback if Drive fails
        imageUrl = "Error saving image: " + err.toString();
      }
    }

    logSheet.appendRow([
      new Date(),
      params.uid,
      JSON.stringify(params.items),
      params.notes,
      params.user || "Mobile User",
      imageUrl // Column F: Image URL
    ]);

    // Update Next Maintenance Date based on Cycle
    const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
    const devData = devSheet.getDataRange().getValues();
    for (let i = 1; i < devData.length; i++) {
      if (devData[i][0] == params.uid) {
        let cycle = devData[i][4] || 30; // Default to 30 days if not set
        let nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + parseInt(cycle));
        devSheet.getRange(i + 1, 6).setValue(nextDate); // Column F (6)
        break;
      }
    }

    return contentResponse({ status: "success" });
  } catch (err) {
    return contentResponse({ status: "error", message: err.toString() });
  }
}

// Write a row to the AuditLog sheet (columns: Timestamp, User, Action, Target, Details)
function writeAuditLog(user, action, target, details) {
  try {
    const auditSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("AuditLog");
    if (!auditSheet) return;
    auditSheet.appendRow([new Date(), user, action, target, details]);
  } catch (err) {
    // Non-fatal: audit failure must not block the main operation
  }
}

// Send alert to Telegram / Discord if configured
function sendAlert(message) {
  try {
    if (DISCORD_WEBHOOK_URL) {
      UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({ content: message })
      });
    }
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
      });
    }
  } catch (err) {
    // Ignore alert failure
  }
}

// Hàm chạy định kỳ (Daily Trigger) để kiểm tra lịch bảo trì
function checkMaintenanceDue() {
  const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
  if (!devSheet) return;
  const devData = devSheet.getDataRange().getValues();
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let dueList = [];
  let approachingList = [];
  
  for (let i = 1; i < devData.length; i++) {
    const nextStr = String(devData[i][5]).trim();
    if (nextStr) {
      const nextDate = new Date(nextStr);
      if (!isNaN(nextDate)) {
        const warningDays = parseInt(devData[i][8]) || 7; // Column I (index 8)
        
        // Calculate difference in days
        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          dueList.push(`- 🔴 **Quá hạn ${Math.abs(diffDays)} ngày:** ${devData[i][1]} (${devData[i][0]}) - Tổ: ${devData[i][6]}`);
        } else if (diffDays === 0) {
          dueList.push(`- 🟠 **Hôm nay:** ${devData[i][1]} (${devData[i][0]}) - Tổ: ${devData[i][6]}`);
        } else if (diffDays <= warningDays) {
          approachingList.push(`- 🟡 **Còn ${diffDays} ngày:** ${devData[i][1]} (${devData[i][0]}) - Tổ: ${devData[i][6]}`);
        }
      }
    }
  }
  
  let msgLines = [];
  if (dueList.length > 0) {
    msgLines.push(`⚠️ **ĐẾN HẠN/QUÁ HẠN BẢO TRÌ (${dueList.length})** ⚠️`);
    msgLines.push(dueList.join("\n"));
  }
  if (approachingList.length > 0) {
    if (msgLines.length > 0) msgLines.push("\n");
    msgLines.push(`🔔 **SẮP ĐẾN HẠN BẢO TRÌ (${approachingList.length})** 🔔`);
    msgLines.push(approachingList.join("\n"));
  }

  if (msgLines.length > 0) {
    sendAlert(msgLines.join("\n"));
  }
}

// Validate Work Order payload — returns error message or null
function validateWOPayload(params) {
  const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
  const validTypes = ['Corrective', 'Preventive', 'Emergency', 'Inspection'];
  const validStatuses = ['New', 'Assigned', 'In Progress', 'Done', 'Closed', 'Cancelled'];

  if (params.priority && validPriorities.indexOf(params.priority) === -1) {
    return 'Priority phải là: ' + validPriorities.join(', ');
  }
  if (params.type && validTypes.indexOf(params.type) === -1) {
    return 'Type phải là: ' + validTypes.join(', ');
  }
  if (params.status && validStatuses.indexOf(params.status) === -1) {
    return 'Status phải là: ' + validStatuses.join(', ');
  }
  if (params.cost !== undefined && params.cost !== '' && isNaN(Number(params.cost))) {
    return 'Cost phải là số hợp lệ';
  }
  return null;
}

// Ensure WorkOrders sheet has all required headers (A-M)
function setupWorkOrderHeaders() {
  const woSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("WorkOrders");
  if (!woSheet) {
    console.error('WorkOrders sheet not found');
    return;
  }
  const headers = ['WO_ID', 'Type', 'Priority', 'Status', 'AssetUID', 'AssignedTo', 'DueDate', 'Description', 'PartsUsed', 'CreatedAt', 'Cost', 'SubTasks', 'Project'];
  const currentHeaders = woSheet.getRange(1, 1, 1, woSheet.getLastColumn()).getValues()[0];
  
  // Only set headers if they don't match
  if (currentHeaders.length < headers.length || String(currentHeaders[10]) !== 'Cost') {
    woSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    console.log('WorkOrders headers updated: ' + headers.join(', '));
  } else {
    console.log('WorkOrders headers already correct.');
  }
}

function contentResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// THIẾT LẬP & KIỂM TRA (FOR EDITOR)
// ==========================================

/**
 * Hàm này dùng để kích hoạt bảng cấp quyền (Authorization) và kiểm tra kết nối Sheets.
 * Hãy chọn hàm này trong danh sách và nhấn "Run" ở Script Editor.
 */
function testAuthorization() {
  console.log("--- ĐANG KIỂM TRA KẾT NỐI ---");
  console.log("Sheet ID đang sử dụng: " + SHEET_ID);
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    console.log("Kết nối Spreadsheet thành công: " + ss.getName());
    
    const sheets = ["Users", "Devices", "Logs", "Checklists", "WorkOrders", "AuditLog", "Projects", "Shifts"];
    sheets.forEach(name => {
      const s = ss.getSheetByName(name);
      if (s) {
        console.log("✅ Tìm thấy sheet: " + name + " (" + s.getLastRow() + " hàng)");
      } else {
        console.warn("❌ KHÔNG tìm thấy sheet: " + name);
      }
    });
    
    console.log("--- HOÀN TẤT KIỂM TRA ---");
    console.log("Nếu bạn thấy các thông báo '✅' ở trên, Backend đã sẵn sàng!");
  } catch (err) {
    console.error("❌ LỖI KẾT NỐI: " + err.toString());
    console.error("Vui lòng kiểm tra lại MANUAL_SHEET_ID và đảm bảo bạn đã cấp quyền truy cập.");
  }
}

/**
 * Hàm ping đơn giản cho phép gọi từ bên ngoài để kiểm tra API live hay không.
 */
function ping() {
  return contentResponse({ status: "success", message: "Pong! API is active." });
}

// ==========================================
// SCHEMA MIGRATION / CẬP NHẬT CẤU TRÚC SHEET
// ==========================================

function setupDevicesSchema() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Devices");
  if (!sheet) { console.error("❌ Không tìm thấy sheet Devices"); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const addIfMissing = (colName, index) => {
    if (headers.length < index || !headers[index - 1]) {
      sheet.getRange(1, index).setValue(colName);
      console.log(`✅ Đã thêm cột ${index}: ${colName}`);
    } else {
      console.log(`ℹ️ Cột ${index} đã có: ${headers[index - 1]}`);
    }
  };

  addIfMissing("Area", 15);
  addIfMissing("EquipmentType", 16);
  console.log("🎉 setupDevicesSchema hoàn tất.");
}

// ==========================================
// DIAGNOSTIC TOOLS / CÔNG CỤ CHẨN ĐOÁN
// ==========================================

/**
 * Kiểm tra kết nối và cấu hình Sheet.
 * Chạy hàm này lần đầu để cấp quyền truy cập và kiểm tra cấu trúc bảng.
 */
function testConnection() {
  console.log("🚀 Bắt đầu chẩn đoán hệ thống QR-UID...");
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    console.log("✅ Kết nối Spreadsheet thành công: " + ss.getName());
    console.log("ID: " + SHEET_ID);
    
    const requiredSheets = ["Users", "Devices", "Logs", "Checklists", "WorkOrders", "AuditLog", "Inventory"];
    console.log("--- Kiểm tra các Tab dữ liệu ---");
    
    requiredSheets.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet) {
        console.log(`✅ [${name}]: Tìm thấy (${sheet.getLastRow()} dòng)`);
      } else {
        console.warn(`❌ [${name}]: KHÔNG TÌM THẤY! Bạn cần tạo tab này.`);
      }
    });
    
    console.log("---");
    console.log("💡 Chẩn đoán hoàn tất. Nếu mọi tab đều báo ✅, hệ thống đã sẵn sàng Deploy.");
  } catch (e) {
    console.error("❌ Lỗi nghiêm trọng: " + e.toString());
    console.log("👉 Gợi ý: Hãy kiểm tra lại MANUAL_SHEET_ID và đảm bảo Script có quyền truy cập.");
  }
}

function migrateDevicesData() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName("Devices");
    if (!sheet) {
      return contentResponse({ status: "error", message: "Devices sheet not found" });
    }
    
    // Set headers
    sheet.getRange(1, 15).setValue("Area");
    sheet.getRange(1, 16).setValue("EquipmentType");
    
    const values = sheet.getDataRange().getValues();
    let updated = 0;
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const name = String(row[1] || '').trim();
      const location = String(row[2] || '').trim();
      
      const area = determineArea(name, location, i);
      const eqType = determineEquipmentType(name, location, i);
      
      sheet.getRange(i + 1, 15).setValue(area);
      sheet.getRange(i + 1, 16).setValue(eqType);
      updated++;
    }
    
    return contentResponse({ status: "success", message: "Migrated " + updated + " rows successfully." });
  } catch (err) {
    return contentResponse({ status: "error", message: "Migration failed: " + err.toString() });
  }
}

function determineArea(name, location, index) {
  const n = String(name || '').toLowerCase();
  const l = String(location || '').toLowerCase();
  
  if (l.includes('tầng 1') || l.includes('t1') || l.includes('tang 1') || l.includes('floor 1') || l.includes('f1')) return 'Tầng 1';
  if (l.includes('tầng 2') || l.includes('t2') || l.includes('tang 2') || l.includes('floor 2') || l.includes('f2')) return 'Tầng 2';
  if (l.includes('tầng 3') || l.includes('t3') || l.includes('tang 3') || l.includes('floor 3') || l.includes('f3')) return 'Tầng 3';
  if (l.includes('mái') || l.includes('sân thượng') || l.includes('roof') || l.includes('rooftop')) return 'Mái';
  if (l.includes('hầm') || l.includes('basement') || l.includes('b1') || l.includes('b2')) return 'Tầng hầm';
  if (l.includes('khu a') || l.includes('kho a') || l.includes('kho thanh pham') || l.includes('kho thành phẩm') || l.includes('khu a')) return 'Khu A';
  if (l.includes('khu b') || l.includes('block b') || l.includes('sảnh b')) return 'Khu B';
  
  // Try matching from name if location doesn't match
  if (n.includes('tầng 1') || n.includes('t1') || n.includes('tang 1')) return 'Tầng 1';
  if (n.includes('tầng 2') || n.includes('t2') || n.includes('tang 2')) return 'Tầng 2';
  if (n.includes('tầng 3') || n.includes('t3') || n.includes('tang 3')) return 'Tầng 3';
  if (n.includes('mái') || n.includes('roof')) return 'Mái';
  if (n.includes('hầm') || n.includes('basement') || n.includes('b1') || n.includes('b2')) return 'Tầng hầm';
  
  // Cyclic distribution if no name/location match
  const areas = ['Khu A', 'Khu B', 'Tầng 1', 'Tầng 2', 'Tầng 3', 'Mái', 'Tầng hầm'];
  return areas[index % areas.length];
}

function determineEquipmentType(name, location, index) {
  const n = String(name || '').toLowerCase();
  const l = String(location || '').toLowerCase();
  
  if (n.includes('điều hòa') || n.includes('điều hoà') || n.includes('ac') || n.includes('fcu') || n.includes('chiller') || n.includes('cassette') || n.includes('vav') || n.includes('ahu')) return 'Điều hòa';
  if (n.includes('bơm') || n.includes('pump') || n.includes('áp lực') || n.includes('hút ẩm')) return 'Máy bơm';
  if (n.includes('thang máy') || n.includes('lift') || n.includes('elevator') || n.includes('escalator')) return 'Thang máy';
  if (n.includes('điện') || n.includes('tủ điện') || n.includes('db') || n.includes('msb') || n.includes('ats') || n.includes('máy phát') || n.includes('generator') || n.includes('ups') || n.includes('biến áp')) return 'Hệ thống điện';
  if (n.includes('pccc') || n.includes('cứu hỏa') || n.includes('phòng cháy') || n.includes('bình chữa cháy') || n.includes('còi báo') || n.includes('báo cháy') || n.includes('fire')) return 'PCCC';
  if (n.includes('camera') || n.includes('cctv') || n.includes('cam') || n.includes('nvr') || n.includes('dvr')) return 'Camera';
  
  // Cyclic distribution if no keyword match
  const types = ['Điều hòa', 'Máy bơm', 'Thang máy', 'Hệ thống điện', 'PCCC', 'Camera'];
  return types[index % types.length];
}
