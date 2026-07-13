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

  // Ping hộ status.html (giới hạn host trong 13_UptimeProxy.gs, không cần token)
  if (action === 'pingUrl') return handlePingUrl(e);

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
      case 'getRosterStaff':    return handleGetRosterStaff(e);      // Bảng phân ca (trang phanca)
      case 'getRosterWeek':     return handleGetRosterWeek(e);       // Bảng phân ca (trang phanca)
      case 'getAnalyticsData':  return handleGetAnalyticsData(e);
      case 'getMaintenanceDue': return handleGetMaintenanceDue(e);
      case 'getMeterPoints':    return handleGetMeterPoints(e);     // Phase 11
      case 'getMeterHistory':   return handleGetMeterHistory(e);    // Phase 11
      case 'getMeterStats':     return handleGetMeterStats(e);      // Phase 11
      case 'getPumpTimerSettings': return handleGetPumpTimerSettings(e);
      case 'getPlans':          return handleGetPlans(e);           // Kế hoạch trang nhatky
      case 'getWorkLogs':       return handleGetWorkLogs(e);        // Nhật ký cả tổ (trang nhatky)
      case 'nhatkyAccounts':    return handleListAccounts(e);       // Danh sách tài khoản trang nhatky
      case 'tempDumpDevices':   return handleTempDumpDevices(e);
      case 'migrateDevicesData':return handleMigrateDevicesData(e);
      case 'migrateAccounts':   return handleMigrateAccountsEndpoint(); // Migration for Nhatky accounts
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
      savePlan:             handleSavePlan,
      deletePlan:           handleDeletePlan,
      nhatkyRegister:       handleNhatKyRegister,
      nhatkyLogin:          handleNhatKyLogin,
      listUsers:            handleListUsers,
      saveUser:             handleSaveUser,
      deleteUser:           handleDeleteUser,
      savePumpTimerSetting: handleSavePumpTimerSetting,
      seedPumpTimerSettings: handleSeedPumpTimerSettings,
      saveRosterWeek:       handleSaveRosterWeek,       // Bảng phân ca (trang phanca)
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
    "StartTime","EndTime","Task","Result","Issue","NextAction","PlanID","SyncStatus",
    "Rating","RecordedBy","Quantity","Unit","Teams"
  ];

  if (!sheet) sheet = ss.insertSheet("WorkLogs");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  } else {
    if (String(sheet.getRange(1, 15).getValue()).trim() === "") {
      // Sheet cũ chưa có 2 cột đánh giá từng người → bổ sung tiêu đề
      sheet.getRange(1, 15, 1, 2).setValues([["Rating", "RecordedBy"]]).setFontWeight("bold");
    }
    if (String(sheet.getRange(1, 17).getValue()).trim() === "") {
      // Cột số lượng để tính lũy kế theo kế hoạch
      sheet.getRange(1, 17).setValue("Quantity").setFontWeight("bold");
    }
    if (String(sheet.getRange(1, 18).getValue()).trim() === "") {
      sheet.getRange(1, 18).setValue("Unit").setFontWeight("bold");
    }
    sheet.getRange(1, 19).setValue("Teams").setFontWeight("bold");
  }
  return sheet;
}

// Nhật ký của cả tổ (mặc định 7 ngày gần nhất) để mọi máy cùng thấy
function handleGetWorkLogs(e) {
  const user = e && e.parameter ? e.parameter.user : "";
  const userTeams = typeof getUserTeams_ === "function" ? getUserTeams_(user) : "";

  const sheet = ensureWorkLogsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "success", logs: [] });

  const isPrivileged = typeof isPrivilegedTeams_ === "function" && isPrivilegedTeams_(userTeams);
  // Không có tài khoản, hoặc tài khoản chưa được phân nhóm tổ → không trả về nhật ký nào
  if (!isPrivileged && (!userTeams || userTeams === "- Chưa phân tổ -")) {
    return contentResponse({ status: "success", logs: [] });
  }

  const days = Math.max(1, parseInt(e.parameter.days, 10) || 7);
  const cutoff = Utilities.formatDate(new Date(Date.now() - days * 86400000), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const maxRows = 400;
  const startRow = Math.max(2, lastRow - maxRows + 1);
  const rows = sheet.getRange(startRow, 1, lastRow - startRow + 1, 19).getValues();

  const logs = [];
  rows.forEach(function(r) {
    if (!String(r[0]).trim()) return;
    const workDate = formatPlanDate_(r[2]);
    if (workDate && workDate < cutoff) return;

    // Không có quyền admin → chỉ lấy đúng nhật ký của tổ mình
    if (!isPrivileged) {
      const rTeam = String(r[18] || "").trim();
      if (typeof userCanAccessTeam_ !== "function" || !userCanAccessTeam_(userTeams, rTeam)) return;
    }

    logs.push({
      id: String(r[0]),
      createdAt: r[1] instanceof Date ? r[1].toISOString() : String(r[1] || ""),
      workDate: workDate,
      employee: String(r[3] || ""),
      shift: String(r[4] || ""),
      progress: String(r[5] || ""),
      startTime: formatLogTime_(r[6]),
      endTime: formatLogTime_(r[7]),
      selectedTask: String(r[8] || ""),
      result: String(r[9] || ""),
      issue: String(r[10] || ""),
      nextAction: String(r[11] || ""),
      planId: String(r[12] || ""),
      rating: String(r[14] || ""),
      recordedBy: String(r[15] || ""),
      quantity: r[16] === "" || r[16] === null ? "" : Number(r[16]),
      unit: String(r[17] || ""),
      teams: String(r[18] || ""),
      syncStatus: "synced"
    });
  });
  logs.reverse(); // mới nhất trước
  return contentResponse({ status: "success", logs: logs });
}

function formatLogTime_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "HH:mm");
  }
  return String(value || "");
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
  
  const user = payload.recordedBy || employee;
  const userTeams = typeof getUserTeams_ === "function" ? getUserTeams_(user) : "";
  const requestedTeam = String(payload.teams || "").trim();
  if (typeof userCanAccessTeam_ !== "function" || !userCanAccessTeam_(userTeams, requestedTeam)) {
    return contentResponse({ status: "error", message: "Tổ không thuộc quyền của tài khoản" });
  }

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
    "synced",
    payload.rating || "",
    payload.recordedBy || "",
    payload.quantity === 0 || payload.quantity ? payload.quantity : "",
    payload.unit || "",
    requestedTeam
  ]);

  // Cập nhật tăng dần lũy kế vào dòng kế hoạch (Incremental Update)
  const planId = String(payload.planId || "").trim();
  const qty = parseFloat(String(payload.quantity || "").replace(",", "."));
  if (planId && !isNaN(qty) && qty > 0) {
    incrementPlanDoneQty_(planId, qty);
  }

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

function ensurePumpTimerSettingsSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("PumpTimerSettings");
  const headers = [
    "SettingID","PumpName","Location","On1","Off1","On2","Off2",
    "Notes","UpdatedAt","UpdatedBy"
  ];

  if (!sheet) sheet = ss.insertSheet("PumpTimerSettings");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  }
  sheet.getRange("D:G").setNumberFormat("@");
  return sheet;
}

function pumpTimerDefaults_() {
  return [
    {
      settingId: "PUMP-SUOI-CUN-160KW",
      pumpName: "Bơm 160kW Suối Cun",
      location: "Suối Cun",
      on1: "12:20",
      off1: "16:00",
      on2: "22:00",
      off2: "08:30",
      notes: "Thời gian chạy bơm 160kW Suối Cun"
    },
    {
      settingId: "PUMP-HO-NHA-BAO-DUONG-1",
      pumpName: "Bơm hồ Nhà Bảo Dưỡng 1",
      location: "Hồ Nhà Bảo Dưỡng 1",
      on1: "12:00",
      off1: "16:30",
      on2: "20:30",
      off2: "09:00",
      notes: "Thời gian chạy bơm hồ Nhà Bảo Dưỡng 1"
    }
  ];
}

function readPumpTimerSettings_() {
  const sheet = ensurePumpTimerSettingsSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    if (!values[i][0]) continue;
    rows.push({
      settingId: values[i][0],
      pumpName: values[i][1],
      location: values[i][2],
      on1: pumpTimerText_(values[i][3]),
      off1: pumpTimerText_(values[i][4]),
      on2: pumpTimerText_(values[i][5]),
      off2: pumpTimerText_(values[i][6]),
      notes: values[i][7],
      updatedAt: values[i][8],
      updatedBy: values[i][9]
    });
  }
  return rows;
}

function pumpTimerText_(value) {
  if (value === null || value === undefined || value === "") return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "HH:mm");
  }
  return String(value).replace("h", ":").replace("-", ":").trim();
}

function handleGetPumpTimerSettings(e) {
  let rows = readPumpTimerSettings_();
  if (rows.length === 0) {
    seedPumpTimerSettings_();
    rows = readPumpTimerSettings_();
  }
  return contentResponse({ status: "success", data: rows });
}

function seedPumpTimerSettings_() {
  const sheet = ensurePumpTimerSettingsSheet_();
  const values = sheet.getDataRange().getValues();
  pumpTimerDefaults_().forEach(item => {
    const row = [
      item.settingId,
      item.pumpName,
      item.location,
      item.on1,
      item.off1,
      item.on2,
      item.off2,
      item.notes,
      new Date(),
      "Seed"
    ];
    let targetRow = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === item.settingId) {
        targetRow = i + 1;
        break;
      }
    }
    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  });
}

function handleSeedPumpTimerSettings(params) {
  seedPumpTimerSettings_();
  return contentResponse({ status: "success", data: readPumpTimerSettings_() });
}

function handleSavePumpTimerSetting(params) {
  const item = params.payload || params;
  const settingId = String(item.settingId || "").trim();
  if (!settingId) return contentResponse({ status: "error", message: "Thiếu SettingID" });
  if (!item.pumpName) return contentResponse({ status: "error", message: "Thiếu tên bơm" });

  const sheet = ensurePumpTimerSettingsSheet_();
  const values = sheet.getDataRange().getValues();
  const row = [
    settingId,
    item.pumpName || "",
    item.location || "",
    item.on1 || "",
    item.off1 || "",
    item.on2 || "",
    item.off2 || "",
    item.notes || "",
    new Date(),
    item.updatedBy || "Web"
  ];

  let targetRow = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === settingId) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 4, 1, 4).setNumberFormat("@");
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
    sheet.getRange(sheet.getLastRow(), 4, 1, 4).setNumberFormat("@");
  }

  writeAuditLog(item.updatedBy || "Web", "savePumpTimerSetting", settingId, "Cập nhật giờ cài đặt đồng hồ bơm");
  return contentResponse({ status: "success", settingId: settingId });
}
