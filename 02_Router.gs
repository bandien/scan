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
      // getWorkOrders: đã gỡ — WorkOrders được thay bằng NhatKyPlans (xem 20_MigrateWorkOrders.gs)
      case 'getInventory':      return handleGetInventory(e);
      case 'getStaff':          return handleGetStaff(e);
      case 'getPartners':       return handleGetPartners(e);
      case 'getErpParties':     return handleGetErpParties(e);
      case 'cleanupDuplicateErpParties': return handleCleanupDuplicateErpParties(e);
      case 'getPersonalContacts':    return handleGetPersonalContacts(e);
      case 'savePersonalContact':   return handleSavePersonalContact(e);
      case 'deletePersonalContact': return handleDeletePersonalContact(e);
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
      case 'getPumps':          return handleGetPumps(e);
      case 'getPumpChecks':     return handleGetPumpChecks(e);
      case 'getMeterStatus':    return handleGetMeterStatus(e);
      case 'getPlans':          return handleGetPlans(e);           // Kế hoạch trang nhatky
      case 'getGolfTemplates':  return handleGetGolfTemplates(e);   // Checklist sân golf (trang sangolf)
      case 'getGolfRuns':       return handleGetGolfRuns(e);        // Checklist sân golf (trang sangolf)
      case 'getGolfStatus':     return handleGetGolfStatus(e);      // Tóm tắt vận hành sân golf (cho trang nhatky)
      case 'getWorkLogs':       return handleGetWorkLogs(e);        // Nhật ký cả tổ (trang nhatky)
      case 'nhatkyAccounts':    return handleListAccounts(e);       // Danh sách tài khoản trang nhatky
      case 'tempDumpDevices':   return handleTempDumpDevices(e);
      case 'migrateDevicesData':return handleMigrateDevicesData(e);
      case 'migrateAccounts':   return handleMigrateAccountsEndpoint(); // Migration for Nhatky accounts
      case 'syncERPNext':       return handleSyncERPNext(e);
      case 'testERPNext':       return handleTestERPNext(e);
      case 'exportAllData':     return handleExportAllData(e);        // Export toan bo cho ERPNext sync
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
      // Work Orders: đã gỡ route tạo/sửa mới — thay bằng NhatKyPlans (xem 20_MigrateWorkOrders.gs).
      // Các handler cũ (handleCreateWO/handleUpdateWO/handleUpdateWOStatus/handleDeleteWO) vẫn còn
      // trong 05_WorkOrders.gs nhưng không còn action nào gọi tới.
      // Daily work logs
      createWorkLog:        handleCreateWorkLog,
      seedWorkLogsDemo:     handleSeedWorkLogsDemo,
      savePlan:             handleSavePlan,
      nhatkyExtensionOptions: handleNhatKyExtensionOptions,
      savePlanFromExtension: handleSavePlanFromExtension,
      deletePlan:           handleDeletePlan,
      nhatkyRegister:       handleNhatKyRegister,
      nhatkyLogin:          handleNhatKyLogin,
      nhatkyChangePin:      handleNhatKyChangePin,
      listUsers:            handleListUsers,
      saveUser:             handleSaveUser,
      deleteUser:           handleDeleteUser,
      savePumpTimerSetting: handleSavePumpTimerSetting,
      seedPumpTimerSettings: handleSeedPumpTimerSettings,
      getPumps:             handleGetPumps,
      savePump:             handleSavePump,
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
      deletePlan:           handleDeletePlan,
      nhatkyRegister:       handleNhatKyRegister,
      nhatkyLogin:          handleNhatKyLogin,
      nhatkyChangePin:      handleNhatKyChangePin,
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
      submitPumpCheck:      handleSubmitPumpCheck,
      // Checklist sân golf (trang sangolf)
      saveGolfRun:          handleSaveGolfRun,
      submitGolfRun:        handleSubmitGolfRun,
      confirmGolfHandover:  handleConfirmGolfHandover,
      seedGolfTemplates:    handleSeedGolfTemplates,
      upsertGolfTemplateItem: handleUpsertGolfTemplateItem,
      deleteGolfTemplateItem: handleDeleteGolfTemplateItem,
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
    "Rating","RecordedBy","Quantity","Unit","Teams","StepID"
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
    if (String(sheet.getRange(1, 20).getValue()).trim() === "") {
      // Nhật ký ghi cho một bước cụ thể của kế hoạch (nhatky/index.html — steps)
      sheet.getRange(1, 20).setValue("StepID").setFontWeight("bold");
    }
  }
  return sheet;
}

// Nhật ký của cả tổ (mặc định 7 ngày gần nhất) để mọi máy cùng thấy
function handleGetWorkLogs(e) {
  const user = e && e.parameter ? e.parameter.user : "";
  const userTeams = typeof getUserTeams_ === "function" ? getUserTeams_(user) : "";
  const userRole = typeof getUserRole_ === "function" ? getUserRole_(user) : "";

  const sheet = ensureWorkLogsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "success", logs: [] });

  const isPrivileged =
    (typeof isPrivilegedRole_ === "function" && isPrivilegedRole_(userRole)) ||
    (typeof isPrivilegedTeams_ === "function" && isPrivilegedTeams_(userTeams));
  // Không có tài khoản, hoặc tài khoản chưa được phân nhóm tổ → không trả về nhật ký nào
  if (!isPrivileged && (!userTeams || userTeams === "- Chưa phân tổ -")) {
    return contentResponse({ status: "success", logs: [] });
  }

  const days = Math.max(1, parseInt(e.parameter.days, 10) || 7);
  const cutoff = Utilities.formatDate(new Date(Date.now() - days * 86400000), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const maxRows = 400;
  const startRow = Math.max(2, lastRow - maxRows + 1);
  const rows = sheet.getRange(startRow, 1, lastRow - startRow + 1, 20).getValues();

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
      stepId: String(r[19] || ""),
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
  const userRole = typeof getUserRole_ === "function" ? getUserRole_(user) : "";
  const requestedTeam = String(payload.teams || "").trim();
  const isPrivileged =
    (typeof isPrivilegedRole_ === "function" && isPrivilegedRole_(userRole)) ||
    (typeof isPrivilegedTeams_ === "function" && isPrivilegedTeams_(userTeams));
  if (!isPrivileged && (typeof userCanAccessTeam_ !== "function" || !userCanAccessTeam_(userTeams, requestedTeam))) {
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
    requestedTeam,
    payload.stepId || ""
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

/** POST: Ghi nhận kiểm tra trạng thái vận hành bơm */
function handleSubmitPumpCheck(params) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("PumpChecks");
  if (!sheet) {
    sheet = ss.insertSheet("PumpChecks");
    sheet.appendRow(["Timestamp", "PumpID", "PumpName", "Status", "TimerSettings", "Operator", "Notes", "LoggedAt"]);
    sheet.getRange("A1:H1").setFontWeight("bold");
  }

  const timestamp = params.timestamp ? new Date(params.timestamp) : new Date();
  sheet.appendRow([
    timestamp,
    params.pumpId || "",
    params.pumpName || "",
    params.status || "",
    params.timerSettings || "",
    params.operator || "",
    params.notes || "",
    new Date()
  ]);

  writeAuditLog(params.operator || "System", "submitPumpCheck", params.pumpId, `Status: ${params.status} | Operator: ${params.operator}`);
  return contentResponse({ status: "success" });
}

/** GET: Tải nhật ký kiểm tra trạng thái vận hành bơm */
function handleGetPumpChecks(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("PumpChecks");
  if (!sheet) return contentResponse({ status: "success", history: [] });

  const { pumpId, limit } = e.parameter;
  const maxRows = parseInt(limit, 10) || 50;
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return contentResponse({ status: "success", history: [] });

  const data = values.slice(1);
  
  let filtered = data;
  if (pumpId) {
    filtered = data.filter(r => String(r[1]).trim() === String(pumpId).trim());
  }

  const history = filtered
    .slice(-maxRows)
    .reverse()
    .map(r => ({
      timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0] || ""),
      pumpId: String(r[1] || ""),
      pumpName: String(r[2] || ""),
      status: String(r[3] || ""),
      timerSettings: String(r[4] || ""),
      operator: String(r[5] || ""),
      notes: String(r[6] || ""),
      loggedAt: r[7] instanceof Date ? r[7].toISOString() : String(r[7] || "")
    }));

  return contentResponse({ status: "success", history });
}

/** GET: Lấy trạng thái hoạt động hiện tại của máy bơm từ MeterReadings */
function handleGetMeterStatus(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("MeterReadings");
  if (!sheet) return contentResponse({ status: "success", lastEvent: null });

  const { pumpId } = e.parameter;
  if (!pumpId) return contentResponse({ status: "error", message: "Missing pumpId" });

  const targetMeterId = `PUMP_${pumpId}`;
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return contentResponse({ status: "success", lastEvent: null });

  const data = values.slice(1);
  const pumpReadings = data.filter(r => String(r[1]).trim() === targetMeterId);
  if (pumpReadings.length === 0) return contentResponse({ status: "success", lastEvent: null });

  const lastRow = pumpReadings[pumpReadings.length - 1];
  const val = Number(lastRow[2]);
  const timestamp = lastRow[4] instanceof Date ? lastRow[4].toISOString() : String(lastRow[4] || "");
  const operator = String(lastRow[5] || "");

  return contentResponse({
    status: "success",
    lastEvent: {
      action: val === 1 ? "START" : "STOP",
      timestamp: timestamp,
      operator: operator,
      notes: val === 1 ? "Bật máy bơm" : "Tắt máy bơm"
    }
  });
}

// ==========================================
// DYNAMIC PUMP DIRECTORY CONFIGURATION
// ==========================================
function ensurePumpsSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("Pumps");
  const headers = ["ID", "Name", "FlowRate", "Source", "SettingID", "MonitorOnly", "Na111Id", "ModbusId", "UpdatedAt", "UpdatedBy"];
  
  if (!sheet) sheet = ss.insertSheet("Pumps");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    
    // Seed with defaults
    const defaults = [
      [1, "Bơm 160kW hút từ hồ lán trại", 244, "Hồ lán trại", "PUMP-160KW-LAN-TRAI", "TRUE", "NA111-01", "1", new Date(), "Seed"],
      [2, "Bơm hoả tiễn 18,5kW", 27.95, "Hồ lán trại", "PUMP-HOATIEN-18_5KW", "FALSE", "NA111-01", "2", new Date(), "Seed"],
      [3, "Bơm hoả tiễn 30kW", 45.33, "Hồ lán trại", "PUMP-HOATIEN-30KW", "FALSE", "NA111-01", "3", new Date(), "Seed"],
      [4, "Bơm hoả tiễn 22kW", 45.33, "Hồ lán trại", "PUMP-HOATIEN-22KW", "FALSE", "NA111-01", "4", new Date(), "Seed"],
      [5, "Bơm LK1", 1, "Giếng khoan LK1", "PUMP-LK1", "FALSE", "NA111-02", "1", new Date(), "Seed"],
      [6, "Bơm LK2", 2, "Giếng khoan LK2", "PUMP-LK2", "FALSE", "NA111-02", "2", new Date(), "Seed"],
      [7, "Bơm LK3", 3, "Giếng khoan LK3", "PUMP-LK3", "FALSE", "NA111-02", "3", new Date(), "Seed"],
      [8, "Bơm LK4", 4, "Giếng khoan LK4", "PUMP-LK4", "FALSE", "NA111-02", "4", new Date(), "Seed"],
      [9, "Bơm LK5", 5, "Giếng khoan LK5", "PUMP-LK5", "FALSE", "NA111-02", "5", new Date(), "Seed"],
      [10, "Bơm LK6", 6, "Giếng khoan LK6", "PUMP-LK6", "FALSE", "NA111-02", "6", new Date(), "Seed"],
      [11, "Bơm LK7", 7, "Giếng khoan LK7", "PUMP-LK7", "FALSE", "NA111-02", "7", new Date(), "Seed"],
      [12, "Bơm LK8", 8, "Giếng khoan LK8", "PUMP-LK8", "FALSE", "NA111-02", "8", new Date(), "Seed"],
      [13, "Bơm LK9", 9, "Giếng khoan LK9", "PUMP-LK9", "FALSE", "NA111-02", "9", new Date(), "Seed"],
      [14, "Bơm LK10", 10, "Giếng khoan LK10", "PUMP-LK10", "FALSE", "NA111-02", "10", new Date(), "Seed"],
      [15, "Bơm LK11", 11, "Giếng khoan LK11", "PUMP-LK11", "FALSE", "NA111-02", "11", new Date(), "Seed"],
      [16, "Bơm LK12", 12, "Giếng khoan LK12", "PUMP-LK12", "FALSE", "NA111-02", "12", new Date(), "Seed"],
      [17, "Bơm LK13", 1, "Giếng khoan LK13", "PUMP-LK13", "FALSE", "NA111-02", "13", new Date(), "Seed"],
      [18, "Bơm LK14", 1, "Giếng khoan LK14", "PUMP-LK14", "FALSE", "NA111-02", "14", new Date(), "Seed"],
      [19, "Bơm LK15", 1, "Giếng khoan LK15", "PUMP-LK15", "FALSE", "NA111-02", "15", new Date(), "Seed"],
      [20, "Bơm hoả tiễn 30kW số 01", 86, "Hồ trung tâm", "PUMP-HO-TRUNG-TAM-01", "FALSE", "NA111-03", "1", new Date(), "Seed"],
      [21, "Bơm hoả tiễn 30kW số 02", 86, "Hồ trung tâm", "PUMP-HO-TRUNG-TAM-02", "FALSE", "NA111-03", "2", new Date(), "Seed"],
      [24, "Bơm 160kW số 01 hút từ hồ nước mặt ngoài sân", 154, "Hồ ngoài sân (nước suối)", "PUMP-SUOI-CUN-160KW", "TRUE", "NA111-04", "1", new Date(), "Seed"],
      [25, "Bơm tưới cỏ hồ trung tâm (rainbird)", 0, "Hồ trung tâm", "PUMP-HO-TRUNG-TAM-RAINBIRD", "FALSE", "NA111-03", "3", new Date(), "Seed"],
      [26, "Bơm tưới cỏ hồ 16-17 (rainbird)", 0, "Hồ 16-17", "PUMP-HO-16-17-RAINBIRD", "FALSE", "NA111-03", "4", new Date(), "Seed"]
    ];
    sheet.getRange(2, 1, defaults.length, defaults[0].length).setValues(defaults);
  } else {
    // Check if headers need migration
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (currentHeaders.indexOf("Na111Id") === -1) {
      sheet.clearContents();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
      const defaults = [
        [1, "Bơm 160kW hút từ hồ lán trại", 244, "Hồ lán trại", "PUMP-160KW-LAN-TRAI", "TRUE", "NA111-01", "1", new Date(), "Seed"],
        [2, "Bơm hoả tiễn 18,5kW", 27.95, "Hồ lán trại", "PUMP-HOATIEN-18_5KW", "FALSE", "NA111-01", "2", new Date(), "Seed"],
        [3, "Bơm hoả tiễn 30kW", 45.33, "Hồ lán trại", "PUMP-HOATIEN-30KW", "FALSE", "NA111-01", "3", new Date(), "Seed"],
        [4, "Bơm hoả tiễn 22kW", 45.33, "Hồ lán trại", "PUMP-HOATIEN-22KW", "FALSE", "NA111-01", "4", new Date(), "Seed"],
        [5, "Bơm LK1", 1, "Giếng khoan LK1", "PUMP-LK1", "FALSE", "NA111-02", "1", new Date(), "Seed"],
        [6, "Bơm LK2", 2, "Giếng khoan LK2", "PUMP-LK2", "FALSE", "NA111-02", "2", new Date(), "Seed"],
        [7, "Bơm LK3", 3, "Giếng khoan LK3", "PUMP-LK3", "FALSE", "NA111-02", "3", new Date(), "Seed"],
        [8, "Bơm LK4", 4, "Giếng khoan LK4", "PUMP-LK4", "FALSE", "NA111-02", "4", new Date(), "Seed"],
        [9, "Bơm LK5", 5, "Giếng khoan LK5", "PUMP-LK5", "FALSE", "NA111-02", "5", new Date(), "Seed"],
        [10, "Bơm LK6", 6, "Giếng khoan LK6", "PUMP-LK6", "FALSE", "NA111-02", "6", new Date(), "Seed"],
        [11, "Bơm LK7", 7, "Giếng khoan LK7", "PUMP-LK7", "FALSE", "NA111-02", "7", new Date(), "Seed"],
        [12, "Bơm LK8", 8, "Giếng khoan LK8", "PUMP-LK8", "FALSE", "NA111-02", "8", new Date(), "Seed"],
        [13, "Bơm LK9", 9, "Giếng khoan LK9", "PUMP-LK9", "FALSE", "NA111-02", "9", new Date(), "Seed"],
        [14, "Bơm LK10", 10, "Giếng khoan LK10", "PUMP-LK10", "FALSE", "NA111-02", "10", new Date(), "Seed"],
        [15, "Bơm LK11", 11, "Giếng khoan LK11", "PUMP-LK11", "FALSE", "NA111-02", "11", new Date(), "Seed"],
        [16, "Bơm LK12", 12, "Giếng khoan LK12", "PUMP-LK12", "FALSE", "NA111-02", "12", new Date(), "Seed"],
        [17, "Bơm LK13", 1, "Giếng khoan LK13", "PUMP-LK13", "FALSE", "NA111-02", "13", new Date(), "Seed"],
        [18, "Bơm LK14", 1, "Giếng khoan LK14", "PUMP-LK14", "FALSE", "NA111-02", "14", new Date(), "Seed"],
        [19, "Bơm LK15", 1, "Giếng khoan LK15", "PUMP-LK15", "FALSE", "NA111-02", "15", new Date(), "Seed"],
        [20, "Bơm hoả tiễn 30kW số 01", 86, "Hồ trung tâm", "PUMP-HO-TRUNG-TAM-01", "FALSE", "NA111-03", "1", new Date(), "Seed"],
        [21, "Bơm hoả tiễn 30kW số 02", 86, "Hồ trung tâm", "PUMP-HO-TRUNG-TAM-02", "FALSE", "NA111-03", "2", new Date(), "Seed"],
        [24, "Bơm 160kW số 01 hút từ hồ nước mặt ngoài sân", 154, "Hồ ngoài sân (nước suối)", "PUMP-SUOI-CUN-160KW", "TRUE", "NA111-04", "1", new Date(), "Seed"],
        [25, "Bơm tưới cỏ hồ trung tâm (rainbird)", 0, "Hồ trung tâm", "PUMP-HO-TRUNG-TAM-RAINBIRD", "FALSE", "NA111-03", "3", new Date(), "Seed"],
        [26, "Bơm tưới cỏ hồ 16-17 (rainbird)", 0, "Hồ 16-17", "PUMP-HO-16-17-RAINBIRD", "FALSE", "NA111-03", "4", new Date(), "Seed"]
      ];
      sheet.getRange(2, 1, defaults.length, defaults[0].length).setValues(defaults);
    }
  }
  return sheet;
}

function handleGetPumps(e) {
  const sheet = ensurePumpsSheet_();
  const values = sheet.getDataRange().getValues();
  const data = [];
  for (let i = 1; i < values.length; i++) {
    if (!values[i][0]) continue;
    data.push({
      id: Number(values[i][0]),
      name: String(values[i][1] || ""),
      flowRate: Number(values[i][2]) || 0,
      source: String(values[i][3] || ""),
      settingId: String(values[i][4] || ""),
      monitorOnly: String(values[i][5]).toUpperCase() === "TRUE",
      na111Id: String(values[i][6] || ""),
      modbusId: String(values[i][7] || "")
    });
  }
  return contentResponse({ status: "success", data: data });
}

function handleSavePump(params) {
  const item = params.payload || params;
  const id = Number(item.id);
  if (!id) return contentResponse({ status: "error", message: "Thiếu ID máy bơm" });
  if (!item.name) return contentResponse({ status: "error", message: "Thiếu tên máy bơm" });

  const sheet = ensurePumpsSheet_();
  const values = sheet.getDataRange().getValues();
  const row = [
    id,
    item.name || "",
    Number(item.flowRate) || 0,
    item.source || "",
    item.settingId || "",
    String(item.monitorOnly).toUpperCase() === "TRUE" ? "TRUE" : "FALSE",
    item.na111Id || "",
    item.modbusId || "",
    new Date(),
    item.updatedBy || "Web"
  ];

  let targetRow = -1;
  for (let i = 1; i < values.length; i++) {
    if (Number(values[i][0]) === id) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
    writeAuditLog(item.updatedBy || "Web", "savePump", String(id), "Cập nhật cấu hình máy bơm: " + item.name);
  } else {
    sheet.appendRow(row);
    writeAuditLog(item.updatedBy || "Web", "savePump", String(id), "Thêm mới cấu hình máy bơm: " + item.name);
  }

  return contentResponse({ status: "success", message: "Đã lưu thông tin máy bơm" });
}
