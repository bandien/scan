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
