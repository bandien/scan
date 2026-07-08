// ==========================================
// 02_Router.gs — ĐIỀU PHỐI REQUEST
// ==========================================
// doGet và doPost chỉ làm 1 việc: route đến đúng handler.
// Logic nghiệp vụ KHÔNG được viết ở đây.

function doGet(e) {
  // Phục vụ Frontend index.html trực tiếp từ GAS (1-Click Deployment)
  if (!e || !e.parameter || !e.parameter.action) {
    try {
      const template = HtmlService.createTemplateFromFile('index');
      template.gasUrl = ScriptApp.getService().getUrl();
      template.apiToken = API_TOKEN;
      return template.evaluate()
        .setTitle("Hệ thống bảo trì QR Code - Ban Điện Hapulico")
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } catch (err) {
      return statusPage();
    }
  }

  const { action, token, uid } = e.parameter;

  // Ping không cần token
  if (action === 'ping') return contentResponse({ status: "success", message: "Pong! Backend v3 is live." });

  // Auth check
  if (token !== API_TOKEN) return contentResponse({ status: "error", message: "Unauthorized: Invalid API Token" });

  try {
    switch (action) {
      case 'setupHeaders':      return handleSetupHeaders(e);
      case 'login':             return handleLogin(e);
      case 'getDeviceHistory':  return handleGetDeviceHistory(e);
      case 'getWorkOrders':     return handleGetWorkOrders(e);
      case 'getInventory':      return handleGetInventory(e);
      case 'getStaff':          return handleGetStaff(e);
      case 'getProjects':       return handleGetProjects(e);
      case 'getShifts':         return handleGetShifts(e);
      case 'getAnalyticsData':  return handleGetAnalyticsData(e);
      case 'getMaintenanceDue': return handleGetMaintenanceDue(e);
      case 'getMeterPoints':    return handleGetMeterPoints(e);     // Phase 11
      case 'getMeterHistory':   return handleGetMeterHistory(e);    // Phase 11
      case 'getMeterStats':     return handleGetMeterStats(e);      // Phase 11
      case 'tempDumpDevices':   return handleTempDumpDevices(e);
      case 'migrateDevicesData':return handleMigrateDevicesData(e);
      default:                  return handleGetDevice(e);          // UID lookup
    }
  } catch (err) {
    return contentResponse({ status: "error", message: "Server Error (GET): " + err.toString() });
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);

    // Xử lý các action tích hợp từ Claude AI (không yêu cầu API Token)
    if (params.action === "addPhieu" || params.action === "getSttMoi") {
      try {
        if (params.action === "addPhieu") {
          const result = themPhieuMoi(params.data);
          return contentResponse({ success: true, stt: result.stt });
        } else {
          return contentResponse({ success: true, stt: laySttMoi() });
        }
      } catch (innerErr) {
        return contentResponse({ success: false, message: innerErr.toString() });
      }
    }

    if (params.token !== API_TOKEN) return contentResponse({ status: "error", message: "Unauthorized access" });

    // Dispatch table — thêm action mới vào đây, KHÔNG sửa logic khác
    const DISPATCH = {
      // Devices
      createDevice:         handleCreateDevice,
      createDevicesBatch:   handleCreateDevicesBatch,
      updateDevice:         handleUpdateDevice,
      logInOut:             handleLogInOut,
      // Work Orders
      createWO:             handleCreateWO,
      updateWOStatus:       handleUpdateWOStatus,
      updateWO:             handleUpdateWO,
      deleteWO:             handleDeleteWO,
      // Daily work logs
      createWorkLog:        handleCreateWorkLog,
      seedWorkLogsDemo:     handleSeedWorkLogsDemo,
      // Masters
      createProject:        handleCreateProject,
      updateProject:        handleUpdateProject,
      deleteProject:        handleDeleteProject,
      createShift:          handleCreateShift,
      updateShift:          handleUpdateShift,
      deleteShift:          handleDeleteShift,
      createLocation:       handleCreateLocation,
      updateLocation:       handleUpdateLocation,
      deleteLocation:       handleDeleteLocation,
      // Auth
      changePassword:       handleChangePassword,
      // Checklists
      createChecklistItem:  handleCreateChecklistItem,
      updateChecklistItem:  handleUpdateChecklistItem,
      deleteChecklistItem:  handleDeleteChecklistItem,
      // Metering (Phase 11)
      submitMeterReading:   handleSubmitMeterReading,
      createMeterPoint:     handleCreateMeterPoint,
      updateMeterPoint:     handleUpdateMeterPoint,
    };

    const handler = DISPATCH[params.action];
    if (handler) return handler(params);

    // Default: checklist submission
    return handleChecklistSubmit(params);

  } catch (err) {
    return contentResponse({ status: "error", message: "Server Error (POST): " + err.toString() });
  }
}

function ensureWorkLogsSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("WorkLogs");
  const headers = [
    "LogID","CreatedAt","WorkDate","Employee","Shift","Progress",
    "StartTime","EndTime","Task","Result","Issue","NextAction","PlanID","SyncStatus"
  ];

  if (!sheet) sheet = ss.insertSheet("WorkLogs");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  }
  return sheet;
}

function handleCreateWorkLog(params) {
  const payload = params.payload || params;
  const employee = String(payload.employee || "").trim();
  const task = String(payload.selectedTask || payload.task || "").trim();
  const result = String(payload.result || "").trim();

  if (!employee) return contentResponse({ status: "error", message: "Thiếu tên nhân viên" });
  if (!task) return contentResponse({ status: "error", message: "Thiếu đầu việc" });
  if (!result) return contentResponse({ status: "error", message: "Thiếu kết quả thực hiện" });

  const logId = payload.id || ("LOG-" + new Date().getTime());
  const sheet = ensureWorkLogsSheet_();
  sheet.appendRow([
    logId,
    payload.createdAt || new Date(),
    payload.workDate || "",
    employee,
    payload.shift || "",
    payload.progress || "",
    payload.startTime || "",
    payload.endTime || "",
    task,
    result,
    payload.issue || "",
    payload.nextAction || "",
    payload.planId || "",
    "synced"
  ]);

  writeAuditLog(employee, "createWorkLog", logId, "Ghi nhật ký công việc từ trang nhatky");
  return contentResponse({ status: "success", logId: logId });
}

function seedWorkLogsDemo() {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const rows = [
    ["07:30","08:05","Nguyễn Văn An","Ca sáng","Hoàn thành","Tầng hầm B1 | Tủ MSB-B1: Kiểm tra nhiệt độ đầu cốt và vệ sinh mặt tủ.","Nhiệt độ đầu cốt bình thường, không có mùi khét, đã vệ sinh bụi mặt tủ.","","Theo dõi lại trong ca chiều."],
    ["08:10","08:35","Trần Minh Đức","Ca sáng","Hoàn thành","Phòng bơm | Tủ điều khiển bơm nước sạch: Kiểm tra Auto/Manual.","Chế độ Auto/Manual hoạt động ổn định, đèn báo đầy đủ, contactor đóng cắt bình thường.","",""],
    ["08:40","09:15","Lê Quốc Huy","Ca sáng","Cần hỗ trợ","Sân vườn | Chiếu sáng cảnh quan: Kiểm tra đèn lỗi khu lối đi.","Ghi nhận 3 bóng không sáng tại lối đi hồ cảnh quan.","Cần thay bóng và kiểm tra lại hộp nối chống nước.","Đề xuất cấp 3 bóng LED và băng keo chống thấm."],
    ["09:20","09:50","Nguyễn Văn An","Ca sáng","Hoàn thành","Trạm biến áp | Máy phát dự phòng: Kiểm tra mức dầu, nước làm mát, ắc quy.","Mức dầu và nước làm mát đạt, điện áp ắc quy 25.6V.","","Chạy thử theo lịch tuần."],
    ["10:00","10:25","Phạm Tuấn Anh","Ca sáng","Hoàn thành","Tầng 1 | Tủ DB-L1: Kiểm tra CB nhánh khu văn phòng.","CB nhánh không nhảy, tải ổn định, đã siết nhẹ lại nhãn cảnh báo.","",""],
    ["10:30","11:00","Trần Minh Đức","Ca sáng","Đang làm","Phòng kỹ thuật | Quạt thông gió: Kiểm tra tiếng ồn và rung.","Quạt chạy được nhưng có tiếng ồn nhẹ khi khởi động.","Cần vệ sinh cánh và kiểm tra bạc đạn.","Theo dõi thêm sau khi vệ sinh."],
    ["13:30","14:05","Lê Quốc Huy","Ca chiều","Hoàn thành","Khu A | Công tơ điện tổng: Ghi nhận chỉ số và ảnh hiện trạng.","Đã ghi chỉ số, niêm phong còn nguyên, mặt kính sạch.","",""],
    ["14:10","14:45","Phạm Tuấn Anh","Ca chiều","Hoàn thành","Tầng 2 | Tủ điện hành lang: Kiểm tra đèn báo và vệ sinh.","Đèn báo pha sáng đủ, bên trong tủ khô ráo, đã vệ sinh bụi.","",""],
    ["15:00","15:35","Nguyễn Văn An","Ca chiều","Cần hỗ trợ","Bãi xe | Chiếu sáng: Kiểm tra tuyến đèn gần cổng phụ.","Một nhánh đèn chập chờn khi bật tải.","Nghi tiếp xúc kém tại hộp nối.","Cần mở hộp nối kiểm tra khi có đủ dụng cụ."],
    ["16:00","16:25","Trần Minh Đức","Ca chiều","Hoàn thành","Phòng bơm | Bơm nước thải: Kiểm tra phao mức và chạy thử.","Phao mức tác động bình thường, bơm chạy không rung bất thường.","","Vệ sinh hố gom theo lịch định kỳ."]
  ];

  const sheet = ensureWorkLogsSheet_();
  rows.forEach((item, index) => {
    sheet.appendRow([
      "LOG-MAU-" + today.replace(/-/g, "") + "-" + String(index + 1).padStart(2, "0"),
      new Date(),
      today,
      item[2],
      item[3],
      item[4],
      item[0],
      item[1],
      item[5],
      item[6],
      item[7],
      item[8],
      "",
      "seeded"
    ]);
  });
  return "Seeded " + rows.length + " WorkLogs rows into " + SHEET_ID;
}

function handleSeedWorkLogsDemo(params) {
  const message = seedWorkLogsDemo();
  return contentResponse({ status: "success", message: message });
}
