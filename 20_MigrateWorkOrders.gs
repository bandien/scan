// ==========================================
// 20_MigrateWorkOrders.gs — MIGRATE WORKORDERS → NHATKYPLANS (chạy 1 lần)
// ==========================================
// WorkOrders (phiếu công việc gắn quét QR trong index.html) được gộp vào
// NhatKyPlans (đã Plane-hoá: state/priority chuẩn + labels). Hàm dưới đây
// CHỈ ĐỌC sheet WorkOrders và GHI THÊM dòng mới vào NhatKyPlans — không
// sửa/xóa gì trên WorkOrders, có thể chạy lại an toàn (bỏ qua ID đã có).
//
// Chạy: mở Apps Script Editor → chọn hàm migrateWorkOrdersToPlans_ → Run.

const WO_STATUS_TO_PLAN_STATUS_ = {
  "New": "Chưa làm",
  "Assigned": "Chưa làm",
  "In Progress": "Đang làm",
  "Done": "Hoàn thành",
  "Closed": "Hoàn thành",
  "Cancelled": "Đã hủy"
};
const WO_PRIORITY_TO_PLAN_PRIORITY_ = {
  "Low": "Thấp", "Medium": "Trung bình", "High": "Cao", "Urgent": "Khẩn cấp"
};
// Type cũ của WorkOrders → label (tách khỏi Type nhị phân Kế hoạch/Phát sinh của NhatKyPlans)
const WO_TYPE_TO_LABEL_ = {
  "Corrective": "Sửa chữa",
  "Preventive": "Bảo trì định kỳ",
  "Emergency": "Sự cố khẩn cấp",
  "Inspection": "Kiểm tra",
  "Construction": "Xây dựng"
};

function migrateWorkOrdersToPlans_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const woSheet = ss.getSheetByName(SHEETS.WORK_ORDERS);
  if (!woSheet || woSheet.getLastRow() < 2) {
    console.log("Không có WorkOrders để migrate.");
    return { migrated: 0, skipped: 0 };
  }

  const planSheet = ensurePlansSheet_();
  const existingIds = new Set(
    planSheet.getLastRow() >= 2
      ? planSheet.getRange(2, 1, planSheet.getLastRow() - 1, 1).getValues().map(function(r) { return String(r[0]).trim(); })
      : []
  );

  // Tra tên thiết bị theo UID để điền cột Asset (text hiển thị) — AssetUID giữ liên kết riêng
  const devSheet = ss.getSheetByName(SHEETS.DEVICES);
  const deviceNameByUID = {};
  if (devSheet && devSheet.getLastRow() >= 2) {
    devSheet.getRange(2, 1, devSheet.getLastRow() - 1, 2).getValues().forEach(function(r) {
      const uid = String(r[0] || "").trim();
      if (uid) deviceNameByUID[uid] = String(r[1] || "");
    });
  }

  const rows = woSheet.getRange(2, 1, woSheet.getLastRow() - 1, 14).getValues();
  let migrated = 0, skipped = 0;
  const newRows = [];

  rows.forEach(function(r) {
    const woId = String(r[0] || "").trim();
    if (!woId) return;
    if (existingIds.has(woId)) { skipped++; return; }

    const woType = String(r[1] || "").trim();
    const woPriority = String(r[2] || "").trim();
    const woStatus = String(r[3] || "").trim();
    const assetUID = String(r[4] || "").trim();
    const assignedTo = String(r[5] || "").trim();
    const dueDate = r[6];
    const description = String(r[7] || "").trim();
    const partsUsed = String(r[8] || "").trim();
    const createdAtRaw = r[9];
    const cost = r[10];
    const subTasks = String(r[11] || "").trim();
    const project = String(r[12] || "").trim();
    const requestSource = String(r[13] || "").trim();

    const labels = [];
    if (woType && WO_TYPE_TO_LABEL_[woType]) labels.push(WO_TYPE_TO_LABEL_[woType]);
    if (woStatus === "Closed") labels.push("Đã chốt sổ");
    if (requestSource && requestSource !== "Noi bo") labels.push("Yêu cầu: " + requestSource);

    const createdAtDate = createdAtRaw instanceof Date ? createdAtRaw : (createdAtRaw ? new Date(createdAtRaw) : new Date());

    newRows.push([
      woId,                                                       // PlanID — giữ nguyên WO_ID để truy vết
      formatPlanDate_(createdAtDate),                              // Date
      "",                                                          // Time
      "",                                                          // Team (không có mapping tin cậy)
      "",                                                          // Area
      deviceNameByUID[assetUID] || "",                             // Asset (tên thiết bị tra theo UID)
      description,                                                 // Task
      assignedTo,                                                  // Assignee
      WO_PRIORITY_TO_PLAN_PRIORITY_[woPriority] || "Trung bình",   // Priority
      WO_STATUS_TO_PLAN_STATUS_[woStatus] || "Chưa làm",           // Status
      new Date(),                                                  // UpdatedAt
      "migrateWorkOrdersToPlans_",                                 // UpdatedBy
      "",                                                          // Watcher
      "",                                                          // Collaborators
      formatPlanDate_(dueDate),                                    // DateEnd
      "Kế hoạch",                                                  // Type (nhị phân giữ nguyên; phân loại cũ → Labels)
      "",                                                          // PlanQty
      "",                                                          // Unit
      0,                                                           // DoneQty
      "",                                                          // FollowUpDate
      "WorkOrder",                                                 // Source
      woId,                                                        // SourceText — truy vết WO gốc
      subTasks,                                                    // Steps (cùng format JSON, copy thẳng)
      labels.join(", "),                                           // Labels
      assetUID,                                                    // AssetUID
      createdAtDate,                                               // CreatedAt (timestamp gốc)
      cost === "" || cost === null || cost === undefined ? "" : Number(cost), // Cost
      partsUsed,                                                   // PartsUsed
      project                                                      // Project
    ]);
    migrated++;
  });

  if (newRows.length > 0) {
    planSheet.getRange(planSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  const summary = "Migrated " + migrated + " WorkOrders sang NhatKyPlans, bỏ qua " + skipped + " đã tồn tại.";
  writeAuditLog("migrateWorkOrdersToPlans_", "migrateWorkOrders", "-", summary);
  console.log(summary);
  return { migrated: migrated, skipped: skipped };
}

function runMigration() {
  migrateWorkOrdersToPlans_();
}
