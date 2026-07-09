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
    "Watcher","Collaborators"
  ];

  if (!sheet) sheet = ss.insertSheet("NhatKyPlans");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  } else if (String(sheet.getRange(1, 13).getValue()).trim() === "") {
    // Sheet cũ chưa có 2 cột Watcher/Collaborators → bổ sung tiêu đề
    sheet.getRange(1, 13, 1, 2).setValues([["Watcher", "Collaborators"]]).setFontWeight("bold");
  }
  // Date/Time lưu dạng text để trả về đúng chuỗi yyyy-MM-dd / HH:mm-HH:mm
  sheet.getRange("B:C").setNumberFormat("@");
  return sheet;
}

function formatPlanDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(value || "").trim();
}

function handleGetPlans(e) {
  const sheet = ensurePlansSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "success", plans: [] });

  const rows = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
  const plans = rows
    .filter(function(r) { return String(r[0]).trim() !== ""; })
    .map(function(r) {
      return {
        id: String(r[0]),
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
        collaborators: String(r[13] || "")
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
    String(payload.collaborators || "")
  ];

  const rowIndex = findPlanRow_(sheet, planId);
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  writeAuditLog(payload.updatedBy || "nhatky", "savePlan", planId, rowIndex > 0 ? "Cập nhật kế hoạch" : "Thêm kế hoạch mới");
  return contentResponse({ status: "success", planId: planId });
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
