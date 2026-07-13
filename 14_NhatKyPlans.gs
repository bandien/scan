// ==========================================
// 14_NhatKyPlans.gs — KẾ HOẠCH CÔNG VIỆC (trang nhatky)
// ==========================================
// Trang nhatky trước đây đọc kế hoạch từ file tĩnh plan.json (phải sửa file
// và push GitHub mỗi lần đổi). Module này chuyển kế hoạch về Google Sheets:
// - GET  action=getPlans            → trả toàn bộ kế hoạch
// - POST action=savePlan  {payload} → thêm mới hoặc cập nhật theo PlanID
// - POST action=deletePlan {id}     → xóa kế hoạch
// plan.json chỉ còn là fallback khi không gọi được backend.

function ensurePlansSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("NhatKyPlans");
  const headers = [
    "PlanID","Date","Time","Team","Area","Asset","Task",
    "Assignee","Priority","Status","UpdatedAt","UpdatedBy",
    "Watcher","Collaborators","DateEnd","Type","PlanQty","Unit",
    "DoneQty"
  ];

  if (!sheet) sheet = ss.insertSheet("NhatKyPlans");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  } else {
    if (String(sheet.getRange(1, 13).getValue()).trim() === "") {
      // Sheet cũ chưa có 2 cột Watcher/Collaborators → bổ sung tiêu đề
      sheet.getRange(1, 13, 1, 2).setValues([["Watcher", "Collaborators"]]).setFontWeight("bold");
    }
    if (String(sheet.getRange(1, 15).getValue()).trim() === "") {
      // Sheet cũ chưa có cột DateEnd (việc kéo dài nhiều ngày)
      sheet.getRange(1, 15).setValue("DateEnd").setFontWeight("bold");
    }
    if (String(sheet.getRange(1, 16).getValue()).trim() === "") {
      // Phân loại: Kế hoạch / Phát sinh
      sheet.getRange(1, 16).setValue("Type").setFontWeight("bold");
    }
    if (String(sheet.getRange(1, 17).getValue()).trim() === "") {
      // Khối lượng kế hoạch + đơn vị (đối chiếu với lũy kế đã ghi)
      sheet.getRange(1, 17, 1, 2).setValues([["PlanQty", "Unit"]]).setFontWeight("bold");
    }
    if (String(sheet.getRange(1, 19).getValue()).trim() === "") {
      // DoneQty: Lũy kế đã hoàn thành (cộng dồn từ work logs)
      sheet.getRange(1, 19).setValue("DoneQty").setFontWeight("bold");
    }
    if (String(sheet.getRange(1, 20).getValue()).trim() === "") {
      // FollowUpDate: ngày nhắc/xem lại tiếp theo, tách riêng với DateEnd deadline cuối
      sheet.getRange(1, 20).setValue("FollowUpDate").setFontWeight("bold");
    }
  }
  // Date/Time/DateEnd lưu dạng text để trả về đúng chuỗi yyyy-MM-dd / HH:mm-HH:mm
  sheet.getRange("B:C").setNumberFormat("@");
  sheet.getRange("O:O").setNumberFormat("@");
  sheet.getRange("T:T").setNumberFormat("@");
  return sheet;
}

// Lũy kế số lượng đã ghi theo từng kế hoạch (cộng cột Quantity của WorkLogs)
function planQuantityTotals_() {
  const totals = {};
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("WorkLogs");
  if (!sheet || sheet.getLastRow() < 2) return totals;
  // Cột M..Q: PlanID, SyncStatus, Rating, RecordedBy, Quantity
  const rows = sheet.getRange(2, 13, sheet.getLastRow() - 1, 5).getValues();
  rows.forEach(function(r) {
    const planId = String(r[0]).trim();
    const qty = parseFloat(String(r[4]).replace(",", "."));
    if (planId && !isNaN(qty)) totals[planId] = (totals[planId] || 0) + qty;
  });
  return totals;
}

function formatPlanDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(value || "").trim();
}

function handleGetPlans(e) {
  const user = e && e.parameter ? e.parameter.user : "";
  const userTeams = typeof getUserTeams_ === "function" ? getUserTeams_(user) : "";

  const sheet = ensurePlansSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "success", plans: [] });

  const isPrivileged = typeof isPrivilegedTeams_ === "function" && isPrivilegedTeams_(userTeams);
  // Không có tài khoản, hoặc tài khoản chưa được phân nhóm tổ → không trả về kế hoạch nào
  if (!isPrivileged && (!userTeams || userTeams === "- Chưa phân tổ -")) {
    return contentResponse({ status: "success", plans: [] });
  }

  let totals = null; // Lazy-load only when some plan rows have empty DoneQty
  const rows = sheet.getRange(2, 1, lastRow - 1, 20).getValues();
  const plans = rows
    .filter(function(r) {
      if (String(r[0]).trim() === "") return false;
      // Không có quyền admin → chỉ lấy đúng việc của tổ mình
      if (!isPrivileged) {
        const rTeam = String(r[3] || "").trim();
        if (typeof userCanAccessTeam_ !== "function" || !userCanAccessTeam_(userTeams, rTeam)) return false;
      }
      return true;
    })
    .map(function(r) {
      const id = String(r[0]);
      let doneQtyVal = r[18];
      if (doneQtyVal === "" || doneQtyVal === null) {
        if (totals === null) {
          totals = planQuantityTotals_();
        }
        doneQtyVal = totals[id] || 0;
      } else {
        doneQtyVal = Number(doneQtyVal);
      }
      return {
        id: id,
        date: formatPlanDate_(r[1]),
        time: String(r[2] || ""),
        team: String(r[3] || ""),
        area: String(r[4] || ""),
        asset: String(r[5] || ""),
        task: String(r[6] || ""),
        assignee: String(r[7] || ""),
        priority: String(r[8] || ""),
        status: String(r[9] || ""),
        watcher: String(r[12] || ""),
        collaborators: String(r[13] || ""),
        dateEnd: formatPlanDate_(r[14]),
        type: String(r[15] || ""),
        planQty: r[16] === "" || r[16] === null ? "" : Number(r[16]),
        unit: String(r[17] || ""),
        doneQty: doneQtyVal,
        followUpDate: formatPlanDate_(r[19])
      };
    });

  return contentResponse({ status: "success", plans: plans });
}

function handleSavePlan(params) {
  const payload = params.payload || {};
  const date = formatPlanDate_(payload.date);
  const task = String(payload.task || "").trim();

  if (!date) return contentResponse({ status: "error", message: "Thiếu ngày kế hoạch" });
  if (!task) return contentResponse({ status: "error", message: "Thiếu nội dung công việc" });

  const sheet = ensurePlansSheet_();
  const planId = String(payload.id || "").trim() || ("PLAN-" + date.replace(/-/g, "") + "-" + new Date().getTime());
  
  const rowIndex = findPlanRow_(sheet, planId);
  // Preserve current DoneQty in the sheet or set to 0 for new plans
  let doneQty = 0;
  if (rowIndex > 0) {
    doneQty = sheet.getRange(rowIndex, 19).getValue();
    if (doneQty === "" || doneQty === null) doneQty = 0;
  }

  const row = [
    planId,
    date,
    String(payload.time || ""),
    String(payload.team || ""),
    String(payload.area || ""),
    String(payload.asset || ""),
    task,
    String(payload.assignee || ""),
    String(payload.priority || ""),
    String(payload.status || "Chưa làm"),
    new Date(),
    String(payload.updatedBy || ""),
    String(payload.watcher || ""),
    String(payload.collaborators || ""),
    formatPlanDate_(payload.dateEnd),
    String(payload.type || "Kế hoạch"),
    payload.planQty === 0 || payload.planQty ? payload.planQty : "",
    String(payload.unit || ""),
    Number(doneQty),
    formatPlanDate_(payload.followUpDate)
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  writeAuditLog(payload.updatedBy || "nhatky", "savePlan", planId, rowIndex > 0 ? "Cập nhật kế hoạch" : "Thêm kế hoạch mới");
  return contentResponse({ status: "success", planId: planId });
}

// Cộng dồn lũy kế DoneQty trực tiếp trên dòng kế hoạch
function incrementPlanDoneQty_(planId, qty) {
  if (!planId || isNaN(qty) || qty <= 0) return;
  try {
    const sheet = ensurePlansSheet_();
    const rowIndex = findPlanRow_(sheet, planId);
    if (rowIndex > 0) {
      const cell = sheet.getRange(rowIndex, 19);
      const currentVal = Number(cell.getValue() || 0);
      cell.setValue(currentVal + qty);
    }
  } catch (e) {
    console.error("Error in incrementPlanDoneQty_: " + e.toString());
  }
}

function handleDeletePlan(params) {
  const planId = String((params.payload && params.payload.id) || params.id || "").trim();
  if (!planId) return contentResponse({ status: "error", message: "Thiếu PlanID" });

  const sheet = ensurePlansSheet_();
  const rowIndex = findPlanRow_(sheet, planId);
  if (rowIndex < 2) return contentResponse({ status: "error", message: "Không tìm thấy kế hoạch: " + planId });

  sheet.deleteRow(rowIndex);
  writeAuditLog((params.payload && params.payload.updatedBy) || "nhatky", "deletePlan", planId, "Xóa kế hoạch");
  return contentResponse({ status: "success", planId: planId });
}

function findPlanRow_(sheet, planId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === planId) return i + 2;
  }
  return 0;
}
