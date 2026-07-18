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
    "DoneQty","FollowUpDate","Source","SourceText","Steps",
    "Labels","AssetUID","CreatedAt","Cost","PartsUsed","Project"
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
    if (String(sheet.getRange(1, 21).getValue()).trim() === "") {
      // Nguồn tạo kế hoạch (ví dụ Zalo Web) và nội dung gốc để truy vết
      sheet.getRange(1, 21, 1, 2).setValues([["Source", "SourceText"]]).setFontWeight("bold");
    }
    if (String(sheet.getRange(1, 23).getValue()).trim() === "") {
      // Steps: các bước thực hiện của việc nhiều người/nhiều giai đoạn — JSON
      // [{id, title, assignees, done, doneAt, doneBy}] (cùng pattern subTasks của WO)
      sheet.getRange(1, 23).setValue("Steps").setFontWeight("bold");
    }
    if (String(sheet.getRange(1, 24).getValue()).trim() === "") {
      // Labels: nhãn đa chọn tự do (vd "Cần hỗ trợ", "Đã chốt sổ") — tách state khỏi cờ cảnh báo
      sheet.getRange(1, 24).setValue("Labels").setFontWeight("bold");
    }
    if (String(sheet.getRange(1, 25).getValue()).trim() === "") {
      // AssetUID/CreatedAt/Cost/PartsUsed/Project: phục vụ hợp nhất dữ liệu từ WorkOrders
      sheet.getRange(1, 25, 1, 5).setValues([["AssetUID", "CreatedAt", "Cost", "PartsUsed", "Project"]]).setFontWeight("bold");
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

// Trạng thái hợp lệ hiện hành. "Cần hỗ trợ" là giá trị legacy (trước khi tách state/label) —
// được quy đổi sang state "Đang làm" + label "Cần hỗ trợ" thay vì là 1 state riêng.
const PLAN_VALID_STATUSES = ["Chưa làm", "Đang làm", "Hoàn thành", "Đã hủy"];
const PLAN_VALID_PRIORITIES = ["Khẩn cấp", "Cao", "Trung bình", "Thấp", "Không có"];
const PLAN_LEGACY_STATUS_LABEL_MAP = { "Cần hỗ trợ": { status: "Đang làm", label: "Cần hỗ trợ" } };

// Quy đổi 1 giá trị status: giá trị legacy → {status hợp lệ, label bổ sung nếu có}.
// Áp dụng ở cả đường đọc (handleGetPlans) và đường ghi (handleSavePlan) để không phụ
// thuộc thứ tự deploy backend/frontend, và không cần ghi đè hàng loạt lên sheet cũ.
function normalizePlanStatus_(status) {
  const raw = String(status || "").trim();
  const legacy = PLAN_LEGACY_STATUS_LABEL_MAP[raw];
  if (legacy) return { status: legacy.status, extraLabel: legacy.label };
  return { status: raw, extraLabel: null };
}

function parsePlanLabels_(raw) {
  return String(raw || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
}

// Validate payload trước khi ghi. Chấp nhận status legacy (đã quy đổi trước khi validate).
function validatePlanPayload_(status, priority) {
  if (status && !PLAN_VALID_STATUSES.includes(status)) {
    return "Status phải là: " + PLAN_VALID_STATUSES.join(", ");
  }
  if (priority && !PLAN_VALID_PRIORITIES.includes(priority)) {
    return "Priority phải là: " + PLAN_VALID_PRIORITIES.join(", ");
  }
  return null;
}

function handleGetPlans(e) {
  const user = e && e.parameter ? e.parameter.user : "";
  const userTeams = typeof getUserTeams_ === "function" ? getUserTeams_(user) : "";
  const userRole = typeof getUserRole_ === "function" ? getUserRole_(user) : "";

  const sheet = ensurePlansSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "success", plans: [] });

  const isPrivileged =
    (typeof isPrivilegedRole_ === "function" && isPrivilegedRole_(userRole)) ||
    (typeof isPrivilegedTeams_ === "function" && isPrivilegedTeams_(userTeams));
  // Không có tài khoản, hoặc tài khoản chưa được phân nhóm tổ → không trả về kế hoạch nào
  if (!isPrivileged && (!userTeams || userTeams === "- Chưa phân tổ -")) {
    return contentResponse({ status: "success", plans: [] });
  }

  let totals = null; // Lazy-load only when some plan rows have empty DoneQty
  const rows = sheet.getRange(2, 1, lastRow - 1, 29).getValues();
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
      const normalized = normalizePlanStatus_(r[9]);
      const labels = parsePlanLabels_(r[23]);
      if (normalized.extraLabel && !labels.includes(normalized.extraLabel)) labels.push(normalized.extraLabel);
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
        status: normalized.status,
        watcher: String(r[12] || ""),
        collaborators: String(r[13] || ""),
        dateEnd: formatPlanDate_(r[14]),
        type: String(r[15] || ""),
        planQty: r[16] === "" || r[16] === null ? "" : Number(r[16]),
        unit: String(r[17] || ""),
        doneQty: doneQtyVal,
        followUpDate: formatPlanDate_(r[19]),
        source: String(r[20] || ""),
        sourceText: String(r[21] || ""),
        steps: String(r[22] || ""),
        labels: labels,
        assetUID: String(r[24] || ""),
        createdAt: r[25] instanceof Date ? r[25].toISOString() : String(r[25] || ""),
        cost: r[26] === "" || r[26] === null ? "" : Number(r[26]),
        partsUsed: String(r[27] || ""),
        project: String(r[28] || "")
      };
    });

  return contentResponse({ status: "success", plans: plans });
}

function handleSavePlan(params) {
  const payload = params.payload || {};
  const date = formatPlanDate_(payload.date);
  const task = String(payload.task || "").trim();
  const actor = String(payload.updatedBy || "").trim();
  const actorTeams = typeof getUserTeams_ === "function" ? getUserTeams_(actor) : "";
  const actorRole = typeof getUserRole_ === "function" ? getUserRole_(actor) : "";
  const isPrivileged =
    (typeof isPrivilegedRole_ === "function" && isPrivilegedRole_(actorRole)) ||
    (typeof isPrivilegedTeams_ === "function" && isPrivilegedTeams_(actorTeams));
  const requestedTeam = String(payload.team || "").trim();

  if (!date) return contentResponse({ status: "error", message: "Thiếu ngày kế hoạch" });
  if (!task) return contentResponse({ status: "error", message: "Thiếu nội dung công việc" });
  if (!isPrivileged && (typeof userCanAccessTeam_ !== "function" || !userCanAccessTeam_(actorTeams, requestedTeam))) {
    return contentResponse({ status: "error", message: "Tổ không thuộc quyền của tài khoản" });
  }

  // Quy đổi status legacy (vd client cũ gửi "Cần hỗ trợ") trước khi validate/ghi
  const normalizedStatus = normalizePlanStatus_(payload.status || "Chưa làm");
  const validationError = validatePlanPayload_(normalizedStatus.status, payload.priority);
  if (validationError) return contentResponse({ status: "error", message: validationError });

  const sheet = ensurePlansSheet_();
  const planId = String(payload.id || "").trim() || ("PLAN-" + date.replace(/-/g, "") + "-" + new Date().getTime());

  const rowIndex = findPlanRow_(sheet, planId);
  // Preserve current DoneQty in the sheet or set to 0 for new plans
  let doneQty = 0;
  let preservedSource = "";
  let preservedSourceText = "";
  let preservedSteps = "";
  let preservedLabels = "";
  let preservedAssetUID = "";
  let preservedCreatedAt = "";
  let preservedCost = "";
  let preservedPartsUsed = "";
  let preservedProject = "";
  if (rowIndex > 0) {
    doneQty = sheet.getRange(rowIndex, 19).getValue();
    if (doneQty === "" || doneQty === null) doneQty = 0;
    const sourceValues = sheet.getRange(rowIndex, 21, 1, 2).getValues()[0];
    preservedSource = String(sourceValues[0] || "");
    preservedSourceText = String(sourceValues[1] || "");
    preservedSteps = String(sheet.getRange(rowIndex, 23).getValue() || "");
    const extraValues = sheet.getRange(rowIndex, 24, 1, 6).getValues()[0];
    preservedLabels = String(extraValues[0] || "");
    preservedAssetUID = String(extraValues[1] || "");
    preservedCreatedAt = extraValues[2] || "";
    preservedCost = extraValues[3];
    preservedPartsUsed = String(extraValues[4] || "");
    preservedProject = String(extraValues[5] || "");
  }

  // Nếu payload gửi labels, cộng dồn thêm extraLabel (vd "Cần hỗ trợ" từ status legacy) tránh mất cờ cảnh báo
  let labelsOut = payload.labels === undefined ? preservedLabels : parsePlanLabels_(payload.labels).join(", ");
  if (normalizedStatus.extraLabel) {
    const labelsArr = parsePlanLabels_(labelsOut);
    if (!labelsArr.includes(normalizedStatus.extraLabel)) labelsArr.push(normalizedStatus.extraLabel);
    labelsOut = labelsArr.join(", ");
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
    normalizedStatus.status,
    new Date(),
    String(payload.updatedBy || ""),
    String(payload.watcher || ""),
    String(payload.collaborators || ""),
    formatPlanDate_(payload.dateEnd),
    String(payload.type || "Kế hoạch"),
    payload.planQty === 0 || payload.planQty ? payload.planQty : "",
    String(payload.unit || ""),
    Number(doneQty),
    formatPlanDate_(payload.followUpDate),
    payload.source === undefined ? preservedSource : String(payload.source || ""),
    payload.sourceText === undefined ? preservedSourceText : String(payload.sourceText || ""),
    payload.steps === undefined ? preservedSteps : String(payload.steps || ""),
    labelsOut,
    payload.assetUID === undefined ? preservedAssetUID : String(payload.assetUID || ""),
    rowIndex > 0 ? preservedCreatedAt : new Date(),
    payload.cost === undefined ? preservedCost : (payload.cost === "" ? "" : Number(payload.cost)),
    payload.partsUsed === undefined ? preservedPartsUsed : String(payload.partsUsed || ""),
    payload.project === undefined ? preservedProject : String(payload.project || "")
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
  const actor = String((params.payload && params.payload.updatedBy) || params.updatedBy || "").trim();
  const actorTeams = typeof getUserTeams_ === "function" ? getUserTeams_(actor) : "";
  const actorRole = typeof getUserRole_ === "function" ? getUserRole_(actor) : "";
  const isPrivileged =
    (typeof isPrivilegedRole_ === "function" && isPrivilegedRole_(actorRole)) ||
    (typeof isPrivilegedTeams_ === "function" && isPrivilegedTeams_(actorTeams));

  const sheet = ensurePlansSheet_();
  const rowIndex = findPlanRow_(sheet, planId);
  if (rowIndex < 2) return contentResponse({ status: "error", message: "Không tìm thấy kế hoạch: " + planId });
  const planTeam = String(sheet.getRange(rowIndex, 4).getValue() || "").trim();
  if (!isPrivileged && (typeof userCanAccessTeam_ !== "function" || !userCanAccessTeam_(actorTeams, planTeam))) {
    return contentResponse({ status: "error", message: "Tổ không thuộc quyền của tài khoản" });
  }

  sheet.deleteRow(rowIndex);
  writeAuditLog(actor || "nhatky", "deletePlan", planId, "Xóa kế hoạch");
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
