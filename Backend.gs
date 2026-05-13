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
const MANUAL_SHEET_ID = "1aK1KMrG5Bn4hYy-QSS5SAST_Xl4Ta_hCbVmqyHXJjUo"; 
const API_TOKEN = "HAPU_QR_SECRET_2026"; 

// Tự động xác định SHEET_ID
const SHEET_ID = (function() {
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
      "<h2>✅ QR System Backend is Live!</h2>" +
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
    if (action === 'login') {
    const pin = e.parameter.pin;
    const username = e.parameter.username;
    if (!pin || !username) return contentResponse({ status: "error", message: "Missing credentials" });

    const userSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Users");
    if (!userSheet) return contentResponse({ status: "error", message: "Users sheet not found" });
    const users = userSheet.getDataRange().getValues();
    let userRole = null; let userName = null;
    
    // Check Username + PIN (Users sheet: A=Username, B=PIN, C=Role)
    for (let i = 1; i < users.length; i++) {
      if (String(users[i][0]).trim().toLowerCase() === String(username).trim().toLowerCase() 
          && String(users[i][1]) == String(pin)) {
        userName = users[i][0];
        userRole = users[i][2];
        break;
      }
    }

    if (!userRole) return contentResponse({ status: "error", message: "Sai tên đăng nhập hoặc mật khẩu" });

    // Preload devices
    const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
    const devData = devSheet.getDataRange().getValues();
    let devices = [];
    for (let i = 1; i < devData.length; i++) {
      devices.push({
        uid: devData[i][0],
        name: devData[i][1],
        location: devData[i][2],
        specs: devData[i][3] || "N/A",
        cycle: devData[i][4] || 30,
        nextMaintenance: devData[i][5] || ""
      });
    }

    // Preload checklists from "Checklists" sheet
    const checkSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Checklists");
    let checklists = [];
    if (checkSheet) {
      const checkData = checkSheet.getDataRange().getValues();
      for (let i = 1; i < checkData.length; i++) {
        checklists.push({
          type: String(checkData[i][0]).trim().toLowerCase(),
          id: checkData[i][1],
          title: checkData[i][2],
          desc: checkData[i][3]
        });
      }
    }

    if (action === 'getDeviceHistory') {
      const logSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Logs");
      const logData = logSheet.getDataRange().getValues();
      let history = [];
      
      // Duyệt ngược từ cuối lên để lấy dữ liệu mới nhất
      for (let i = logData.length - 1; i >= 1; i--) {
        if (String(logData[i][1]) === String(uid)) {
          history.push({
            time: logData[i][0],
            action: logData[i][2], // IN, OUT hoặc Checklist JSON
            notes: logData[i][3],
            user: logData[i][4]
          });
        }
        if (history.length >= 5) break;
      }
      return contentResponse({ status: "success", history: history });
    }

    return contentResponse({ 
      status: "success", 
      user: { name: userName, role: userRole },
      devices: devices,
      checklists: checklists
    });
  }

  // action=getWorkOrders — Return work orders list (filtered by assignedTo if role is Technician)
  if (action === 'getWorkOrders') {
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
        createdAt:   woData[i][9]
      };
      // Technicians only see their own assigned work orders
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

  // action=getInventory — Return parts list from Inventory sheet
  if (action === 'getInventory') {
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

  if (!uid) return contentResponse({ status: "error", message: "Missing UID" });

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
  const data = sheet.getDataRange().getValues();
  let deviceData = null;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == uid) {
      deviceData = {
        uid: data[i][0],
        name: data[i][1],
        location: data[i][2],
        specs: data[i][3] || "N/A",
        cycle: data[i][4] || 30,
        nextMaintenance: data[i][5] || ""
      };
      break;
    }
  }

  if (!deviceData) return contentResponse({ status: "not_found", message: "Device not found" });

  // Get recent history
  const logSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Logs");
  const logData = logSheet.getDataRange().getValues();
  let history = [];
  for (let i = logData.length - 1; i > 0; i--) {
    if (logData[i][1] == uid) {
      history.push({
        date: logData[i][0],
        notes: logData[i][3]
      });
      if (history.length >= 3) break;
    }
  }
  deviceData.history = history;

  return contentResponse({ status: "success", data: deviceData });
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

    // action=createWO — Create a new Work Order with auto-generated WO_ID (WO-YYYYMM-NNNNN)
    if (params.action === 'createWO') {
      const woSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("WorkOrders");
      if (!woSheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });

      // Build WO_ID: WO-YYYYMM-NNNNN based on last row count
      const now = new Date();
      const yyyymm = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0');
      const lastRow = woSheet.getLastRow();
      const seq = String(lastRow).padStart(5, '0'); // sequential based on total rows
      const woId = 'WO-' + yyyymm + '-' + seq;

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
        now
      ]);

      // Write audit log entry
      writeAuditLog(params.user || 'System', 'createWO', woId, 'Created new Work Order');

      return contentResponse({ status: "success", woId: woId });
    }

    // action=updateWOStatus — Update status of an existing Work Order and log to AuditLog
    if (params.action === 'updateWOStatus') {
      if (!params.woId || !params.status) {
        return contentResponse({ status: "error", message: "Missing woId or status" });
      }

      const woSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("WorkOrders");
      if (!woSheet) return contentResponse({ status: "error", message: "WorkOrders sheet not found" });

      const woData = woSheet.getDataRange().getValues();
      let updated = false;
      for (let i = 1; i < woData.length; i++) {
        if (String(woData[i][0]).trim() === String(params.woId).trim()) {
          woSheet.getRange(i + 1, 4).setValue(params.status); // Column D = Status
          updated = true;
          break;
        }
      }

      if (!updated) return contentResponse({ status: "error", message: "Work Order not found" });

      // Write audit log entry
      const details = params.notes ? params.status + ' — ' + params.notes : params.status;
      writeAuditLog(params.user || 'System', 'updateWOStatus', params.woId, details);

      return contentResponse({ status: "success" });
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

    // action=logInOut — Record IN/OUT movement and update Device status
    if (params.action === 'logInOut') {
      const devSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Devices");
      const logSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Logs");
      
      const devData = devSheet.getDataRange().getValues();
      let updated = false;
      for (let i = 1; i < devData.length; i++) {
        if (String(devData[i][0]) === String(params.uid)) {
          // Update Status in a new column (assuming Column G / 7 for Status)
          devSheet.getRange(i + 1, 7).setValue(params.status); 
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

function contentResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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

