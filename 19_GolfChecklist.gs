// ==========================================
// 19_GolfChecklist.gs — CHECKLIST CƠ ĐIỆN SÂN GOLF
// ==========================================
// Số hóa sổ vận hành ChecklistCoDienSanGolf.xlsx cho Tổ Cơ Điện Sân Golf
// Kỳ Sơn Montana. Kế hoạch chi tiết: docs/PLAN_ChecklistGolf_SoHoa.md
//
// - GET  action=getGolfTemplates              → 4 mẫu (ca_sang, ca_toi, tuan, thang)
// - GET  action=getGolfRuns    {date|from,to} → các lượt thực hiện
// - POST action=saveGolfRun    {payload}      → tạo/ghi nháp (autosave)
// - POST action=submitGolfRun  {payload}      → chốt ca + bàn giao
// - POST action=confirmGolfHandover {payload} → ca sau xác nhận nhận bàn giao
// - POST action=seedGolfTemplates {force}     → nạp lại mẫu từ seed trong code
// - POST action=upsertGolfTemplateItem {..}   → thêm mới/sửa 1 hạng mục mẫu (Quản lý)
// - POST action=deleteGolfTemplateItem {templateId,itemId} → xóa 1 hạng mục mẫu (Quản lý)
// - GET  action=getGolfStatus                 → tóm tắt run mới nhất/mẫu (dùng ở trang nhatky)
//
// KHỞI TẠO MẪU THEO ĐỊA ĐIỂM / THỜI GIAN / CA TRỰC (sheet ChecklistTemplateDefs):
// - GET  action=getChecklistTemplateDefs {location?, includeInactive?} → danh sách định nghĩa mẫu
// - GET  action=getChecklistSchedule {date?, time?, location?} → mẫu nào áp dụng tại thời điểm đó
// - POST action=upsertChecklistTemplateDef {payload} → tạo/sửa định nghĩa mẫu (Quản lý);
//        tạo mới có thể nhân bản hạng mục từ mẫu có sẵn qua cloneFromTemplateId
// - POST action=deleteChecklistTemplateDef {templateId} → ngừng áp dụng mẫu (soft delete)
// Thiết kế chi tiết: docs/superpowers/specs/2026-07-29-checklist-template-init-design.md
//
// Mẫu lưu ở sheet GolfChecklistTemplates — sửa hạng mục chỉ cần sửa sheet,
// không cần deploy lại. Seed trong code chỉ dùng lần đầu hoặc khi force.
// Lưu ý: ItemID (A01, B01...) chỉ duy nhất TRONG PHẠM VI 1 templateId — luôn
// xác định 1 hạng mục bằng cặp (templateId, itemId), không dùng itemId riêng lẻ.

// ---------- SEED 4 MẪU (chuyển từ Excel, 1 phần tử = 1 dòng giấy) ----------
// InputType: check | number | time | timerange | text | group
// group: fields = [{key,label,type,unit,threshold}]
// Threshold: "min:45" | "max:80" | "range:6.5-7.5" — vi phạm thì UI tô đỏ

const GOLF_TEMPLATE_SEED = [
  // ============ CA SÁNG (5h00 – 13h00) ============
  { t: "ca_sang", tName: "Ca Sáng (5h00 – 13h00)", s: "A", sT: "Nhận ca & kiểm tra nước (4h45 – 6h00)", items: [
    { id: "A01", label: "Nhận bàn giao từ ca tối — ghi nhận tình trạng", type: "check" },
    { id: "A02", label: "Kiểm tra mức nước bể ngầm CLH — ≥ 50%", type: "number", unit: "cm", note: "Ghi cách tràn bao nhiêu cm" },
    { id: "A03", label: "Kiểm tra mức nước bể mái CLH — ≥ 50%", type: "number", unit: "cm", note: "Ghi cách tràn bao nhiêu cm" },
    { id: "A04", label: "Kiểm tra bể ngầm nhà bảo dưỡng", type: "number", unit: "cm", note: "Ghi cách tràn bao nhiêu cm" },
    { id: "A05", label: "Kiểm tra bể ngầm nhà tập", type: "number", unit: "cm", note: "Ghi cách tràn bao nhiêu cm" },
    { id: "A06", label: "Kiểm tra bể nước nhà chòi vườn", type: "number", unit: "cm", note: "Ghi cách tràn bao nhiêu cm" },
    { id: "A07", label: "Kiểm tra bể nước nhà xe", type: "number", unit: "cm", note: "Ghi cách tràn bao nhiêu cm" },
    { id: "A08", label: "Vận hành bơm tăng áp sinh hoạt CLH", type: "check" },
    { id: "A09", label: "Kiểm tra + Mở vận hành 3 suối trang trí", type: "group",
      note: "Sáng thứ 2 bảo dưỡng sân chỉ cấp nước nuôi súng",
      fields: [
        { key: "suoi15", label: "Suối 15 — giờ bật", type: "time" },
        { key: "suoi16", label: "Suối 16 — giờ bật", type: "time" },
        { key: "suoi6",  label: "Suối 6 — giờ bật",  type: "time" }
      ] },
    { id: "A10", label: "Kiểm tra mức nước 5 hồ", type: "group",
      note: "Ghi cách tràn bao nhiêu cm",
      fields: [
        { key: "ngoaisan",  label: "Hồ ngoài sân",  type: "number", unit: "cm" },
        { key: "lantrai",   label: "Hồ lán trại",   type: "number", unit: "cm" },
        { key: "trungtam",  label: "Hồ trung tâm",  type: "number", unit: "cm" },
        { key: "ho1617",    label: "Hồ 16-17",      type: "number", unit: "cm" },
        { key: "ho3",       label: "Hồ 3",          type: "number", unit: "cm" }
      ] },
    { id: "A11", label: "Kiểm tra + Vận hành bơm hồ", type: "group",
      note: "Bật cho đầy hồ trung tâm và hồ 16-17. Tắt khi mưa to và hồ đầy. Nếu chưa tắt yêu cầu ca tiếp theo kiểm tra thực hiện",
      fields: [
        { key: "bomngoaisan", label: "Bơm ngoài sân 160kW — bật/tắt",  type: "timerange" },
        { key: "bomlantrai",  label: "Bơm hồ lán trại 160kW — bật/tắt", type: "timerange" },
        { key: "bom1617",     label: "Bơm lên hồ 16-17 (kiêm tạo suối) — bật/tắt", type: "timerange" }
      ] }
  ]},
  { t: "ca_sang", tName: "Ca Sáng (5h00 – 13h00)", s: "B", sT: "Điện & chiếu sáng (6h00 – 7h00)", items: [
    { id: "B01", label: "Kiểm tra nhiệt độ hệ thống gia nhiệt — > 45°C", type: "group",
      fields: [
        { key: "may1", label: "Nhiệt độ máy 1", type: "number", unit: "℃", threshold: "min:45" },
        { key: "may2", label: "Nhiệt độ máy 2", type: "number", unit: "℃", threshold: "min:45" }
      ] },
    { id: "B02", label: "Đèn sân golf 18 hố — đã TẮT hoàn toàn", type: "check" },
    { id: "B03", label: "Đèn LED hắt trang trí CLH 4h45–5h30 sáng đủ 4 mặt ngoài nhà", type: "check" },
    { id: "B04", label: "Đèn chiếu sáng hành lang, sảnh CLH — đã TẮT hoàn toàn", type: "check" },
    { id: "B05", label: "Đồng hồ hẹn giờ sạc xe — đã CẮT lúc 6h00", type: "check" }
  ]},
  { t: "ca_sang", tName: "Ca Sáng (5h00 – 13h00)", s: "C", sT: "Đóng ca & bàn giao (12h30 – 13h00)", items: [
    { id: "C01", label: "Ghi nhật ký sự cố phát sinh trong ca sáng", type: "text" },
    { id: "C02", label: "Nội dung bàn giao đề nghị ca chiều thực hiện", type: "text" }
  ]},

  // ============ CA TỐI (13h00 – 21h00) ============
  { t: "ca_toi", tName: "Ca Tối (13h00 – 21h00)", s: "A", sT: "Nhận ca & kiểm tra nước (17h30 – 19h30)", items: [
    { id: "A01", label: "Nhận bàn giao từ ca sáng — ghi nhận tình trạng", type: "check" },
    { id: "A02", label: "Kiểm tra bể ngầm CLH — ≥ 50%", type: "number", unit: "cm", note: "Ghi cách tràn bao nhiêu cm" },
    { id: "A03", label: "Kiểm tra bể mái CLH — ≥ 50%", type: "number", unit: "cm", note: "Ghi cách tràn bao nhiêu cm" },
    { id: "A04", label: "Kiểm tra bể ngầm nhà bảo dưỡng", type: "number", unit: "cm", note: "Ghi cách tràn bao nhiêu cm" },
    { id: "A05", label: "Kiểm tra bể ngầm nhà tập & nhà xe", type: "number", unit: "cm", note: "Ghi cách tràn bao nhiêu cm" },
    { id: "A06", label: "Tắt vận hành 3 suối trang trí (17h30 – 18h30)", type: "group",
      fields: [
        { key: "suoi15", label: "Suối 15 — giờ tắt", type: "time" },
        { key: "suoi16", label: "Suối 16 — giờ tắt", type: "time" },
        { key: "suoi6",  label: "Suối 6 — giờ tắt",  type: "time" }
      ] },
    { id: "A07", label: "Kiểm tra mức nước 5 hồ", type: "group",
      note: "Ghi cách tràn bao nhiêu cm",
      fields: [
        { key: "ngoaisan",  label: "Hồ ngoài sân",  type: "number", unit: "cm" },
        { key: "lantrai",   label: "Hồ lán trại",   type: "number", unit: "cm" },
        { key: "trungtam",  label: "Hồ trung tâm",  type: "number", unit: "cm" },
        { key: "ho1617",    label: "Hồ 16-17",      type: "number", unit: "cm" },
        { key: "ho3",       label: "Hồ 3",          type: "number", unit: "cm" }
      ] },
    { id: "A08", label: "Kiểm tra + Vận hành bơm hồ", type: "group",
      note: "Bật cho đầy hồ trung tâm và hồ 16-17. Tắt khi mưa to và hồ đầy. Nếu chưa tắt yêu cầu ca tiếp theo kiểm tra thực hiện",
      fields: [
        { key: "bomngoaisan", label: "Bơm ngoài sân 160kW — bật/tắt",  type: "timerange" },
        { key: "bomlantrai",  label: "Bơm hồ lán trại 160kW — bật/tắt", type: "timerange" },
        { key: "bom1617",     label: "Bơm lên hồ 16-17 (kiêm tạo suối) — bật/tắt", type: "timerange" }
      ] },
    { id: "A09", label: "Kiểm tra nhiệt độ hệ thống gia nhiệt — > 45°C", type: "group",
      fields: [
        { key: "may1", label: "Nhiệt độ máy 1", type: "number", unit: "℃", threshold: "min:45" },
        { key: "may2", label: "Nhiệt độ máy 2", type: "number", unit: "℃", threshold: "min:45" }
      ] },
    { id: "A10", label: "Kiểm tra đèn LED hắt trang trí CLH (bật 18h00–22h30)", type: "check" },
    { id: "A11", label: "Kiểm tra đèn chiếu sáng hành lang, sảnh CLH", type: "check", note: "Ghi vị trí đèn đang dùng" },
    { id: "A12", label: "Phát hiện cột đèn / đèn hỏng trên sân — ghi số hiệu", type: "text" },
    { id: "A13", label: "Xác nhận tủ hẹn giờ sẽ ĐÓNG điện sạc lúc 22h00", type: "check" }
  ]},
  { t: "ca_toi", tName: "Ca Tối (13h00 – 21h00)", s: "B", sT: "Đóng ca & bàn giao (20h30 – 21h00)", items: [
    { id: "B01", label: "Tắt các thiết bị điện không cần thiết sau 21h00", type: "check", note: "Ghi vị trí điện còn dùng" },
    { id: "B02", label: "Ghi nhật ký sự cố phát sinh trong ca chiều", type: "text" },
    { id: "B03", label: "Nội dung bàn giao đề nghị ca sáng thực hiện", type: "text" }
  ]},

  // ============ KIỂM TRA TUẦN (thứ Hai đầu tuần) ============
  { t: "tuan", tName: "Kiểm Tra Tuần (thứ Hai)", s: "A", sT: "Hệ thống điện", items: [
    { id: "A01", label: "Đo điện áp 3 pha tủ MSB", type: "group",
      fields: [
        { key: "l1", label: "Volt L1", type: "number", unit: "V" },
        { key: "l2", label: "Volt L2", type: "number", unit: "V" },
        { key: "l3", label: "Volt L3", type: "number", unit: "V" }
      ] },
    { id: "A02", label: "Đo dòng tải MBA — ghi % Iđm", type: "number", unit: "%Iđm" },
    { id: "A03", label: "Kiểm tra tiếp điểm contactor tủ hẹn giờ sạc xe", type: "check" },
    { id: "A04", label: "Kiểm tra hạn kiểm định dụng cụ an toàn điện", type: "check" }
  ]},
  { t: "tuan", tName: "Kiểm Tra Tuần (thứ Hai)", s: "B", sT: "Bơm & tưới cỏ", items: [
    { id: "B01", label: "Kiểm tra dầu bôi trơn vòng bi bơm TB1 (63kW)", type: "check" },
    { id: "B02", label: "Kiểm tra dầu bôi trơn vòng bi bơm TB2 (140kW)", type: "check" },
    { id: "B03", label: "Kiểm tra van đường ống tưới — đóng mở bình thường", type: "check" },
    { id: "B04", label: "Đo pH nước tưới từ giếng LK13 — 6,5÷7,5", type: "number", unit: "pH", threshold: "range:6.5-7.5" },
    { id: "B05", label: "Kiểm tra mực nước động giếng khi bơm", type: "number", unit: "m" }
  ]},
  { t: "tuan", tName: "Kiểm Tra Tuần (thứ Hai)", s: "C", sT: "Chiếu sáng & xe điện", items: [
    { id: "C01", label: "Đếm đèn hỏng cần thay — ghi số hiệu cột", type: "text" },
    { id: "C02", label: "Kiểm tra kết nối controller LCU71TEC1 trên app", type: "check" },
    { id: "C03", label: "Vệ sinh bộ lọc FCU điều hòa CLH (cuộn trao đổi)", type: "check" },
    { id: "C04", label: "Ghi nhận xe điện cần bảo dưỡng pin định kỳ", type: "text" },
    { id: "C05", label: "Kiểm tra bình chữa cháy — áp kế, hạn sử dụng", type: "check" }
  ]},

  // ============ KIỂM TRA THÁNG (ngày 1, cần ≥ 2 KTV) ============
  { t: "thang", tName: "Kiểm Tra Tháng (ngày 1)", s: "A", sT: "Hệ thống điện — kiểm tra kỹ thuật", items: [
    { id: "A01", label: "Đo điện trở nối đất hệ thống — ≤ 4 Ω", type: "number", unit: "Ω", threshold: "max:4" },
    { id: "A02", label: "Đo kháng cách điện tuyến cáp chính — ≥ 1 MΩ", type: "number", unit: "MΩ", threshold: "min:1" },
    { id: "A03", label: "Kiểm tra nhiệt độ cuộn dây MBA — ≤ 80°C", type: "number", unit: "℃", threshold: "max:80" },
    { id: "A04", label: "Vệ sinh tủ điện chính — thổi bụi, siết đầu cốt", type: "check" },
    { id: "A05", label: "Test ATS tự động chuyển nguồn — ≤ 15 giây", type: "number", unit: "giây", threshold: "max:15" },
    { id: "A06", label: "Chạy tải máy phát điện 30 phút", type: "group",
      fields: [
        { key: "dienap", label: "Điện áp", type: "number", unit: "V" },
        { key: "tanso",  label: "Tần số",  type: "number", unit: "Hz" }
      ] },
    { id: "A07", label: "Kiểm tra và thay dầu nhớt máy phát (nếu đủ giờ vận hành)", type: "check" }
  ]},
  { t: "thang", tName: "Kiểm Tra Tháng (ngày 1)", s: "B", sT: "Bơm tưới & giếng khoan", items: [
    { id: "B01", label: "Bảo dưỡng đầu bơm TB1 — kiểm tra vòng bi, cánh bơm", type: "check" },
    { id: "B02", label: "Bảo dưỡng đầu bơm TB2 — kiểm tra vòng bi, cánh bơm", type: "check" },
    { id: "B03", label: "Ghi độ sụt mực nước giếng LK13 khi bơm liên tục 1h", type: "number", unit: "m" },
    { id: "B04", label: "Kiểm tra chất lượng nước giếng", type: "group",
      fields: [
        { key: "ph",    label: "Độ pH",   type: "number", unit: "pH", threshold: "range:6.5-7.5" },
        { key: "doduc", label: "Độ đục", type: "text" }
      ] },
    { id: "B05", label: "Vệ sinh bộ lọc đầu vào bơm Rainbird", type: "check" }
  ]},
  { t: "thang", tName: "Kiểm Tra Tháng (ngày 1)", s: "C", sT: "Điều hòa, chiếu sáng & xe điện", items: [
    { id: "C01", label: "Kiểm tra áp gas lạnh hệ thống điều hòa CLH", type: "check" },
    { id: "C02", label: "Vệ sinh dàn nóng, dàn lạnh điều hòa", type: "check" },
    { id: "C03", label: "Thay thế đèn hỏng trong tháng — ghi số lượng", type: "number", unit: "đèn" },
    { id: "C04", label: "Bảo dưỡng pin xe điện theo lịch (3 tháng/lần)", type: "check" },
    { id: "C05", label: "Kiểm tra hạn kiểm định bình chữa cháy", type: "check" }
  ]},
  { t: "thang", tName: "Kiểm Tra Tháng (ngày 1)", s: "D", sT: "Tổng kết tháng", items: [
    { id: "D01", label: "Tổng điện năng tiêu thụ tháng", type: "number", unit: "kWh" },
    { id: "D02", label: "Tổng điện năng sạc xe đêm (giờ thấp điểm)", type: "number", unit: "kWh" },
    { id: "D03", label: "Tổng nước tiêu thụ tháng", type: "number", unit: "m³" },
    { id: "D04", label: "Báo cáo sự cố phát sinh & hành động khắc phục", type: "text" },
    { id: "D05", label: "Đề xuất vật tư cần mua thay thế trong tháng tới", type: "text" }
  ]}
];

// ---------- SHEETS ----------

const GOLF_TEMPLATE_HEADERS = [
  "TemplateID","TemplateName","Section","SectionTitle","ItemID","Order",
  "Label","InputType","FieldsJSON","Unit","Threshold","Note","Active"
];

const GOLF_RUN_HEADERS = [
  "RunID","Date","TemplateID","Status","Operator","StartedAt","SubmittedAt",
  "HandoverNote","HandoverTo","ConfirmedBy","ConfirmedAt","UpdatedAt","UpdatedBy","ItemsJSON"
];

function ensureGolfTemplatesSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("GolfChecklistTemplates");
  if (!sheet) sheet = ss.insertSheet("GolfChecklistTemplates");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, GOLF_TEMPLATE_HEADERS.length)
      .setValues([GOLF_TEMPLATE_HEADERS]).setFontWeight("bold");
  }
  return sheet;
}

function ensureGolfRunsSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("GolfChecklistRuns");
  if (!sheet) sheet = ss.insertSheet("GolfChecklistRuns");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, GOLF_RUN_HEADERS.length)
      .setValues([GOLF_RUN_HEADERS]).setFontWeight("bold");
  }
  // Date lưu dạng text yyyy-MM-dd để trả về đúng chuỗi
  sheet.getRange("B:B").setNumberFormat("@");
  return sheet;
}

function seedGolfTemplateRows_(sheet) {
  const rows = [];
  GOLF_TEMPLATE_SEED.forEach(function(sec) {
    sec.items.forEach(function(item, idx) {
      rows.push([
        sec.t, sec.tName, sec.s, sec.sT,
        item.id, idx + 1,
        item.label, item.type,
        item.fields ? JSON.stringify(item.fields) : "",
        item.unit || "", item.threshold || "", item.note || "",
        "TRUE"
      ]);
    });
  });
  sheet.getRange(2, 1, rows.length, GOLF_TEMPLATE_HEADERS.length).setValues(rows);
  return rows.length;
}

// POST action=seedGolfTemplates — nạp mẫu. force=true để xóa và nạp lại.
function handleSeedGolfTemplates(params) {
  const sheet = ensureGolfTemplatesSheet_();
  if (sheet.getLastRow() > 1 && !params.force) {
    return contentResponse({ status: "error", message: "GolfChecklistTemplates đã có dữ liệu. Gửi force=true để nạp lại (mất chỉnh sửa tay trên sheet)." });
  }
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, GOLF_TEMPLATE_HEADERS.length).clearContent();
  }
  const count = seedGolfTemplateRows_(sheet);
  writeAuditLog(params.user || "System", "seedGolfTemplates", "GolfChecklistTemplates", "Seeded " + count + " items");
  return contentResponse({ status: "success", message: "Đã nạp " + count + " hạng mục" });
}

// GET action=getGolfTemplates — lần đầu tự seed nếu sheet trống
function handleGetGolfTemplates(e) {
  const sheet = ensureGolfTemplatesSheet_();
  if (sheet.getLastRow() < 2) seedGolfTemplateRows_(sheet);

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, GOLF_TEMPLATE_HEADERS.length).getValues();
  const items = rows
    .filter(function(r) { return String(r[0]).trim() !== "" && String(r[12]).toUpperCase() !== "FALSE"; })
    .map(function(r) {
      let fields = null;
      if (String(r[8]).trim()) {
        try { fields = JSON.parse(r[8]); } catch (_) {}
      }
      return {
        templateId:   String(r[0]),
        templateName: String(r[1]),
        section:      String(r[2]),
        sectionTitle: String(r[3]),
        itemId:       String(r[4]),
        order:        Number(r[5]) || 0,
        label:        String(r[6]),
        inputType:    String(r[7]),
        fields:       fields,
        unit:         String(r[9] || ""),
        threshold:    String(r[10] || ""),
        note:         String(r[11] || "")
      };
    });
  return contentResponse({ status: "success", items: items });
}

// Tìm dòng sheet của 1 hạng mục theo cặp (templateId, itemId) — ItemID lặp lại
// giữa các template (mỗi mẫu đều có A01, A02...) nên PHẢI khớp cả hai cột.
function findGolfTemplateItemRow_(sheet, templateId, itemId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues(); // TemplateID, TemplateName, Section, SectionTitle, ItemID
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === templateId && String(rows[i][4]).trim() === itemId) return i + 2;
  }
  return 0;
}

const GOLF_TEMPLATE_NAMES = {
  ca_sang: "Ca Sáng (5h00 – 13h00)",
  ca_toi:  "Ca Tối (13h00 – 21h00)",
  tuan:    "Kiểm Tra Tuần (thứ Hai)",
  thang:   "Kiểm Tra Tháng (ngày 1)"
};

// POST action=upsertGolfTemplateItem — payload {templateId, itemId, section, sectionTitle,
//   label, inputType, unit, threshold, note, fields, order, active, user}
// itemId rỗng → tạo hạng mục mới (ID tự sinh); itemId khớp dòng có sẵn → cập nhật tại chỗ.
function handleUpsertGolfTemplateItem(params) {
  const templateId = String(params.templateId || "").trim();
  const label = String(params.label || "").trim();
  if (!templateId) return contentResponse({ status: "error", message: "Thiếu mã mẫu (templateId)" });
  if (!label) return contentResponse({ status: "error", message: "Thiếu tên hạng mục" });

  const sheet = ensureGolfTemplatesSheet_();
  const templateName = String(params.templateName || GOLF_TEMPLATE_NAMES[templateId] || templateId);
  const section = String(params.section || "A").trim();
  const sectionTitle = String(params.sectionTitle || "");
  const inputType = String(params.inputType || "check");
  const unit = String(params.unit || "");
  const threshold = String(params.threshold || "");
  const note = String(params.note || "");
  const fieldsJson = params.fields
    ? (typeof params.fields === "string" ? params.fields : JSON.stringify(params.fields))
    : "";
  const active = params.active === false ? "FALSE" : "TRUE";

  let itemId = String(params.itemId || "").trim();
  const rowIndex = itemId ? findGolfTemplateItemRow_(sheet, templateId, itemId) : 0;

  if (rowIndex > 0) {
    const order = Number(params.order) || sheet.getRange(rowIndex, 6).getValue();
    sheet.getRange(rowIndex, 2, 1, GOLF_TEMPLATE_HEADERS.length - 1).setValues([[
      templateName, section, sectionTitle, itemId, order,
      label, inputType, fieldsJson, unit, threshold, note, active
    ]]);
    writeAuditLog(params.user || "System", "upsertGolfTemplateItem", templateId + "/" + itemId, "Updated: " + label);
    return contentResponse({ status: "success", message: "Đã cập nhật hạng mục", itemId: itemId });
  }

  if (!itemId) itemId = "CUSTOM-" + Date.now();
  const order = Number(params.order) || sheet.getLastRow();
  sheet.appendRow([
    templateId, templateName, section, sectionTitle, itemId, order,
    label, inputType, fieldsJson, unit, threshold, note, "TRUE"
  ]);
  writeAuditLog(params.user || "System", "upsertGolfTemplateItem", templateId + "/" + itemId, "Created: " + label);
  return contentResponse({ status: "success", message: "Đã thêm hạng mục", itemId: itemId });
}

// POST action=updateGolfTemplateSectionTitle — đổi tiêu đề cho toàn bộ hạng mục
// thuộc cùng một phần trong một mẫu.
function handleUpdateGolfTemplateSectionTitle(params) {
  const templateId = String(params.templateId || "").trim();
  const section = String(params.section || "").trim();
  const sectionTitle = String(params.sectionTitle || "").trim();
  if (!templateId) return contentResponse({ status: "error", message: "Thiếu mã mẫu (templateId)" });
  if (!section) return contentResponse({ status: "error", message: "Thiếu mã phần" });
  if (!sectionTitle) return contentResponse({ status: "error", message: "Tiêu đề phần không được để trống" });

  const sheet = ensureGolfTemplatesSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "error", message: "Mẫu chưa có hạng mục" });

  const rowCount = lastRow - 1;
  const rows = sheet.getRange(2, 1, rowCount, 4).getValues();
  let updatedItems = 0;
  const titles = rows.map(function(row) {
    const matches = String(row[0]).trim() === templateId && String(row[2]).trim() === section;
    if (matches) updatedItems += 1;
    return [matches ? sectionTitle : String(row[3] || "")];
  });

  if (updatedItems === 0) {
    return contentResponse({ status: "error", message: "Không tìm thấy phần " + section + " trong mẫu " + templateId });
  }

  sheet.getRange(2, 4, rowCount, 1).setValues(titles);
  writeAuditLog(params.user || "System", "updateGolfTemplateSectionTitle",
    templateId + "/" + section, "Updated " + updatedItems + " items: " + sectionTitle);
  return contentResponse({
    status: "success",
    message: "Đã cập nhật tiêu đề Phần " + section,
    updatedItems: updatedItems
  });
}

// POST action=deleteGolfTemplateItem — payload {templateId, itemId, user}
function handleDeleteGolfTemplateItem(params) {
  const templateId = String(params.templateId || "").trim();
  const itemId = String(params.itemId || "").trim();
  if (!templateId || !itemId) return contentResponse({ status: "error", message: "Thiếu templateId hoặc itemId" });

  const sheet = ensureGolfTemplatesSheet_();
  const rowIndex = findGolfTemplateItemRow_(sheet, templateId, itemId);
  if (rowIndex < 2) return contentResponse({ status: "error", message: "Không tìm thấy hạng mục: " + itemId });

  sheet.deleteRow(rowIndex);
  writeAuditLog(params.user || "System", "deleteGolfTemplateItem", templateId + "/" + itemId, "Deleted");
  return contentResponse({ status: "success", message: "Đã xóa hạng mục" });
}

// GET action=getGolfStatus — tóm tắt run mới nhất của mỗi mẫu (ca_sang/ca_toi/tuan/thang)
// cho các trang khác (vd. trang nhatky) đọc nhanh tình hình vận hành hiện tại.
function handleGetGolfStatus(e) {
  const sheet = ensureGolfRunsSheet_();
  const lastRow = sheet.getLastRow();
  const latestByTemplate = {};

  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, GOLF_RUN_HEADERS.length).getValues();
    rows.forEach(function(r) {
      if (String(r[0]).trim() === "") return;
      const run = golfRunRowToObject_(r);
      const prev = latestByTemplate[run.templateId];
      if (!prev || run.date > prev.date) latestByTemplate[run.templateId] = run;
    });
  }

  const defs = readChecklistTemplateDefs_().filter(function(d) { return d.active !== false; });
  const shifts = defs.map(function(def) {
    const templateId = def.templateId;
    const templateName = def.templateName || (GOLF_TEMPLATE_NAMES[templateId] || templateId);
    const run = latestByTemplate[templateId];
    if (!run) {
      return {
        templateId: templateId, templateName: templateName,
        date: "", status: "", operator: "", handoverNote: "", submittedAt: "", issueCount: 0
      };
    }
    let issueCount = 0;
    try {
      const items = JSON.parse(run.items || "{}");
      Object.keys(items).forEach(function(k) {
        if (items[k] && items[k].status === "ng") issueCount++;
      });
    } catch (_) {}
    return {
      templateId: templateId, templateName: templateName,
      date: run.date, status: run.status, operator: run.operator,
      handoverNote: run.handoverNote, submittedAt: run.submittedAt, issueCount: issueCount
    };
  });

  return contentResponse({ status: "success", shifts: shifts });
}

// ---------- RUNS ----------

function golfRunRowToObject_(r) {
  return {
    runId:        String(r[0]),
    date:         formatPlanDate_(r[1]),
    templateId:   String(r[2]),
    status:       String(r[3]),
    operator:     String(r[4] || ""),
    startedAt:    r[5]  ? String(r[5])  : "",
    submittedAt:  r[6]  ? String(r[6])  : "",
    handoverNote: String(r[7] || ""),
    handoverTo:   String(r[8] || ""),
    confirmedBy:  String(r[9] || ""),
    confirmedAt:  r[10] ? String(r[10]) : "",
    updatedBy:    String(r[12] || ""),
    items:        String(r[13] || "")
  };
}

// GET action=getGolfRuns — lọc theo date hoặc from/to (yyyy-MM-dd), templateId tùy chọn
function handleGetGolfRuns(e) {
  const p = (e && e.parameter) || {};
  const sheet = ensureGolfRunsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "success", runs: [] });

  const date = String(p.date || "").trim();
  const from = String(p.from || "").trim() || date;
  const to   = String(p.to   || "").trim() || date;
  const templateId = String(p.templateId || "").trim();

  const rows = sheet.getRange(2, 1, lastRow - 1, GOLF_RUN_HEADERS.length).getValues();
  const runs = rows
    .filter(function(r) {
      if (String(r[0]).trim() === "") return false;
      const d = formatPlanDate_(r[1]);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (templateId && String(r[2]).trim() !== templateId) return false;
      return true;
    })
    .map(golfRunRowToObject_);
  return contentResponse({ status: "success", runs: runs });
}

function findGolfRunRow_(sheet, runId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === runId) return i + 2;
  }
  return 0;
}

// RunID xác định: 1 mẫu / 1 ngày chỉ có 1 lượt → autosave nhiều máy không tạo trùng
function golfRunId_(templateId, date) {
  return "GOLF-" + templateId + "-" + String(date).replace(/-/g, "");
}

// POST action=saveGolfRun — payload {date, templateId, operator, items(JSON string|object), updatedBy}
function handleSaveGolfRun(params) {
  const payload = params.payload || {};
  const date = formatPlanDate_(payload.date);
  const templateId = String(payload.templateId || "").trim();
  if (!date) return contentResponse({ status: "error", message: "Thiếu ngày thực hiện" });
  if (!templateId) return contentResponse({ status: "error", message: "Thiếu mã mẫu checklist" });

  const itemsJson = typeof payload.items === "string"
    ? payload.items
    : JSON.stringify(payload.items || {});

  const sheet = ensureGolfRunsSheet_();
  const runId = String(payload.runId || "").trim() || golfRunId_(templateId, date);
  const rowIndex = findGolfRunRow_(sheet, runId);
  const now = new Date();

  if (rowIndex > 0) {
    const status = String(sheet.getRange(rowIndex, 4).getValue());
    if (status === "submitted" || status === "confirmed") {
      return contentResponse({ status: "error", message: "Lượt đã bàn giao — không sửa được nữa (trạng thái: " + status + ")" });
    }
    // Giữ nguyên Status/StartedAt, chỉ cập nhật nội dung
    sheet.getRange(rowIndex, 5).setValue(String(payload.operator || sheet.getRange(rowIndex, 5).getValue()));
    sheet.getRange(rowIndex, 12, 1, 3).setValues([[now, String(payload.updatedBy || ""), itemsJson]]);
  } else {
    sheet.appendRow([
      runId, date, templateId, "draft",
      String(payload.operator || ""), now, "",
      "", "", "", "", now, String(payload.updatedBy || ""), itemsJson
    ]);
  }
  return contentResponse({ status: "success", runId: runId });
}

// POST action=submitGolfRun — payload {runId | (date+templateId), handoverNote, handoverTo, operator, updatedBy}
function handleSubmitGolfRun(params) {
  const payload = params.payload || {};
  const sheet = ensureGolfRunsSheet_();
  const runId = String(payload.runId || "").trim()
    || golfRunId_(String(payload.templateId || ""), formatPlanDate_(payload.date));
  const rowIndex = findGolfRunRow_(sheet, runId);
  if (rowIndex < 2) return contentResponse({ status: "error", message: "Không tìm thấy lượt checklist: " + runId });
  const status = String(sheet.getRange(rowIndex, 4).getValue()).trim();
  if (status !== "draft" && status !== "in_progress") {
    return contentResponse({ status: "error", message: "Chỉ ca đang thực hiện mới được bàn giao (trạng thái: " + status + ")" });
  }

  const now = new Date();
  if (payload.items !== undefined) {
    const itemsJson = typeof payload.items === "string" ? payload.items : JSON.stringify(payload.items || {});
    sheet.getRange(rowIndex, 14).setValue(itemsJson);
  }
  if (payload.operator) sheet.getRange(rowIndex, 5).setValue(String(payload.operator));
  sheet.getRange(rowIndex, 4).setValue("submitted");
  sheet.getRange(rowIndex, 7, 1, 3).setValues([[now, String(payload.handoverNote || ""), String(payload.handoverTo || "")]]);
  sheet.getRange(rowIndex, 12, 1, 2).setValues([[now, String(payload.updatedBy || payload.operator || "")]]);

  writeAuditLog(payload.operator || "sangolf", "submitGolfRun", runId, "Chốt checklist sân golf");
  try {
    sendAlert("⛳ [Sân Golf] " + (payload.operator || "KTV") + " đã chốt " + runId
      + (payload.handoverNote ? "\nBàn giao: " + payload.handoverNote : ""));
      
    // KIỂM TRA NGƯỠNG
    if (payload.items !== undefined) {
      checkGolfRunThresholds_(payload.templateId, typeof payload.items === "string" ? payload.items : JSON.stringify(payload.items || {}), runId, payload.operator || "KTV");
    }
  } catch (_) {}

  // Liên kết NhatKy: Nếu có taskId, tự động đổi trạng thái thành "Bàn giao" và ghi Comment
  if (payload.taskId) {
    try {
      const planId = String(payload.taskId).trim();
      const pSheet = ensurePlansSheet_();
      const pRow = findPlanRow_(pSheet, planId);
      if (pRow > 0) {
        // Tính tổng hợp
        const items = typeof payload.items === "string" ? JSON.parse(payload.items) : (payload.items || {});
        let total = 0, done = 0;
        for (let k in items) {
          total++;
          if (items[k] && items[k].status) done++;
        }
        const handoverMsg = payload.handoverNote ? "\n👉 Ghi chú bàn giao: " + payload.handoverNote : "";
        const chatContent = "✅ Đã chốt ca Checklist.\n📊 Kết quả: " + done + "/" + total + " mục." + handoverMsg;

        // Cập nhật Comment (SourceText) - Cột 22
        const sourceTextCell = pSheet.getRange(pRow, 22);
        const oldText = String(sourceTextCell.getValue() || "").trim();
        let chatArray = [];
        if (oldText) {
          try { chatArray = JSON.parse(oldText); } catch(e) { chatArray = []; }
          if (!Array.isArray(chatArray)) chatArray = [];
        }
        chatArray.push({
          author: "HỆ THỐNG",
          content: chatContent,
          timestamp: now.toISOString()
        });
        sourceTextCell.setValue(JSON.stringify(chatArray));

        // Cập nhật trạng thái thành "Bàn giao" (Cột 10)
        pSheet.getRange(pRow, 10).setValue("Bàn giao");
        // Cập nhật UpdatedAt (Cột 11), UpdatedBy (Cột 12)
        pSheet.getRange(pRow, 11, 1, 2).setValues([[now, String(payload.updatedBy || "HỆ THỐNG")]]);
      }
    } catch (err) {
      console.error("Error updating Nhatky from GolfChecklist: " + err);
    }
  }

  return contentResponse({ status: "success", runId: runId });
}

// POST action=confirmGolfHandover - payload {runId, confirmedBy}
function handleConfirmGolfHandover(params) {
  const payload = params.payload || {};
  const runId = String(payload.runId || "").trim();
  const confirmedBy = String(payload.confirmedBy || "").trim();
  if (!runId) return contentResponse({ status: "error", message: "Thiếu RunID" });
  if (!confirmedBy) return contentResponse({ status: "error", message: "Thiếu tên người xác nhận" });

  const sheet = ensureGolfRunsSheet_();
  const rowIndex = findGolfRunRow_(sheet, runId);
  if (rowIndex < 2) return contentResponse({ status: "error", message: "Không tìm thấy lượt checklist: " + runId });

  const status = String(sheet.getRange(rowIndex, 4).getValue());
  if (status !== "submitted") {
    return contentResponse({ status: "error", message: "Lượt này chưa chốt ca hoặc đã xác nhận rồi (trạng thái: " + status + ")" });
  }

  const now = new Date();
  sheet.getRange(rowIndex, 4).setValue("confirmed");
  sheet.getRange(rowIndex, 10, 1, 2).setValues([[confirmedBy, now]]);
  sheet.getRange(rowIndex, 12, 1, 2).setValues([[now, confirmedBy]]);

  writeAuditLog(confirmedBy, "confirmGolfHandover", runId, "Xác nhận nhận bàn giao");
  return contentResponse({ status: "success", runId: runId });
}

// POST action=acceptGolfHandoverAndStartRun
// payload {previousRunId, currentDate, currentTemplateId, receivedBy}
// Xác nhận ca trước và mở ca hiện tại trong cùng critical section.
function handleAcceptGolfHandoverAndStartRun(params) {
  const payload = params.payload || {};
  const previousRunId = String(payload.previousRunId || "").trim();
  const currentDate = formatPlanDate_(payload.currentDate);
  const currentTemplateId = String(payload.currentTemplateId || "").trim();
  const receivedBy = String(payload.receivedBy || "").trim();
  if (!previousRunId) return contentResponse({ status: "error", message: "Thiếu lượt ca trước" });
  if (!currentDate || !currentTemplateId) return contentResponse({ status: "error", message: "Thiếu thông tin ca hiện tại" });
  if (!receivedBy) return contentResponse({ status: "error", message: "Thiếu người nhận ca" });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = ensureGolfRunsSheet_();
    const previousRow = findGolfRunRow_(sheet, previousRunId);
    if (previousRow < 2) return contentResponse({ status: "error", message: "Không tìm thấy ca trước: " + previousRunId });

    const previousStatus = String(sheet.getRange(previousRow, 4).getValue()).trim();
    const currentRunId = golfRunId_(currentTemplateId, currentDate);
    const currentRow = findGolfRunRow_(sheet, currentRunId);

    // Idempotency: cùng một người gọi lại sau khi request đầu đã thành công.
    if (previousStatus === "confirmed") {
      const confirmedBy = String(sheet.getRange(previousRow, 10).getValue()).trim();
      if (confirmedBy !== receivedBy || currentRow < 2) {
        return contentResponse({ status: "error", message: "Ca trước đã được người khác nhận" });
      }
      return contentResponse({ status: "success", previousRunId: previousRunId, currentRunId: currentRunId, idempotent: true });
    }
    if (previousStatus !== "submitted") {
      return contentResponse({ status: "error", message: "Ca trước chưa sẵn sàng bàn giao (trạng thái: " + previousStatus + ")" });
    }

    let currentStatus = "";
    if (currentRow > 0) {
      currentStatus = String(sheet.getRange(currentRow, 4).getValue()).trim();
      if (currentStatus !== "draft" && currentStatus !== "in_progress") {
        return contentResponse({ status: "error", message: "Ca hiện tại đã ở trạng thái không thể nhận: " + currentStatus });
      }
    }

    const now = new Date();
    sheet.getRange(previousRow, 4).setValue("confirmed");
    sheet.getRange(previousRow, 10, 1, 2).setValues([[receivedBy, now]]);
    sheet.getRange(previousRow, 12, 1, 2).setValues([[now, receivedBy]]);

    if (currentRow > 0) {
      sheet.getRange(currentRow, 4).setValue("in_progress");
      sheet.getRange(currentRow, 5).setValue(receivedBy);
      sheet.getRange(currentRow, 12, 1, 2).setValues([[now, receivedBy]]);
    } else {
      sheet.appendRow([
        currentRunId, currentDate, currentTemplateId, "in_progress",
        receivedBy, now, "", "", "", "", "", now, receivedBy, "{}"
      ]);
    }

    writeAuditLog(receivedBy, "acceptGolfHandoverAndStartRun", previousRunId,
      "Đã nhận bàn giao và bắt đầu " + currentRunId);
    return contentResponse({ status: "success", previousRunId: previousRunId, currentRunId: currentRunId });
  } finally {
    lock.releaseLock();
  }
}
function evaluateThreshold_(value, thresholdStr) {
  if (!thresholdStr) return false;
  const v = Number(value);
  if (isNaN(v)) return false;
  
  if (thresholdStr.startsWith("min:")) {
    const min = Number(thresholdStr.substring(4));
    if (v < min) return true;
  } else if (thresholdStr.startsWith("max:")) {
    const max = Number(thresholdStr.substring(4));
    if (v > max) return true;
  } else if (thresholdStr.startsWith("range:")) {
    const parts = thresholdStr.substring(6).split("-");
    if (parts.length === 2) {
      const min = Number(parts[0]);
      const max = Number(parts[1]);
      if (v < min || v > max) return true;
    }
  }
  return false;
}

function checkGolfRunThresholds_(templateId, itemsJson, runId, operator) {
  if (!itemsJson || itemsJson === "{}") return;
  let itemsObj;
  try {
    itemsObj = JSON.parse(itemsJson);
  } catch (e) {
    return;
  }
  
  const sheet = ensureGolfTemplatesSheet_();
  if (sheet.getLastRow() < 2) return;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, GOLF_TEMPLATE_HEADERS.length).getValues();
  
  const violations = [];

  rows.forEach(function(r) {
    if (String(r[0]).trim() !== templateId) return;
    const itemId = String(r[4]);
    const inputType = String(r[7]);
    const label = String(r[6]);
    const val = itemsObj[itemId];
    if (val === undefined || val === null || val === "") return;
    
    if (inputType === "group") {
       let fields = null;
       if (String(r[8]).trim()) {
          try { fields = JSON.parse(r[8]); } catch (_) {}
       }
       if (fields && typeof val === "object") {
          fields.forEach(function(f) {
             const subVal = val[f.key];
             if (subVal === undefined || subVal === null || subVal === "") return;
             const isViolation = evaluateThreshold_(subVal, f.threshold);
             if (isViolation) violations.push("- " + label + " (" + (f.label || f.key) + "): " + subVal + " (Ngưỡng: " + f.threshold + ")");
          });
       }
    } else {
       const threshold = String(r[10] || "").trim();
       if (threshold) {
          const isViolation = evaluateThreshold_(val, threshold);
          if (isViolation) violations.push("- " + label + ": " + val + " (Ngưỡng: " + threshold + ")");
       }
    }
  });
  
  if (violations.length > 0) {
     const tName = GOLF_TEMPLATE_NAMES[templateId] || templateId;
     let msg = "🚨 [CẢNH BÁO VẬN HÀNH GOLF]\n"
       + "- Ca: " + tName + " (" + runId + ")\n"
       + "- Người nhập: " + operator + "\n"
       + "⚠️ Thông số vi phạm:\n" + violations.join("\n");
     sendAlert(msg);
  }
}


// GET action=getGolfAnalytics - payload {days} default 7
function handleGetGolfAnalytics(e) {
  const p = (e && e.parameter) || {};
  const days = Number(p.days) || 7;
  
  const sheet = ensureGolfRunsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "success", data: { compliance: {}, trend: {} } });

  const now = new Date();
  const fromDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const fromStr = formatPlanDate_(fromDate);
  
  const rows = sheet.getRange(2, 1, lastRow - 1, GOLF_RUN_HEADERS.length).getValues();
  
  let totalRuns = 0;
  let submittedRuns = 0;
  
  const trend = {
    labels: [],
    waterLevel: [], // example A02, A03, etc. We can just pick one indicator or let frontend parse it
    temp1: [],
    temp2: []
  };
  
  // Actually, to make it flexible, let's just return the raw runs for the past N days,
  // and let the frontend do the grouping. That way getGolfAnalytics is just a wrapper around getGolfRuns with dynamic date math.
  // Wait, let's just return the processed stats to save frontend logic.
  
  const runsByDate = {};
  // Initialize last N days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dStr = formatPlanDate_(d);
    runsByDate[dStr] = { date: dStr, submitted: 0, items: {} };
    trend.labels.push(dStr);
  }
  
  rows.forEach(function(r) {
    if (String(r[0]).trim() === "") return;
    const d = formatPlanDate_(r[1]);
    if (d < fromStr) return;
    
    totalRuns++;
    const status = String(r[3]).trim();
    if (status === "submitted" || status === "confirmed") {
       submittedRuns++;
       if (runsByDate[d]) {
         runsByDate[d].submitted++;
         // Parse items
         if (r[13]) {
           try {
             const itemsObj = JSON.parse(r[13]);
             runsByDate[d].items = Object.assign(runsByDate[d].items, itemsObj);
           } catch(e) {}
         }
       }
    }
  });
  
  // Extract specific trends from runsByDate
  trend.labels.forEach(function(dStr) {
    const items = runsByDate[dStr].items || {};
    // Nhiệt độ máy 1 (B01.may1 or A09.may1 depending on template)
    // We need to look for key "may1" in group items
    let t1 = null;
    let t2 = null;
    let w1 = null; // Mức nước ngầm A02
    
    // items could have group objects
    for (let k in items) {
      if (typeof items[k] === "object" && items[k] !== null) {
         if (items[k].may1 !== undefined) t1 = items[k].may1;
         if (items[k].may2 !== undefined) t2 = items[k].may2;
      }
    }
    
    // Mức nước A02 (from Ca Sáng) or A11 etc. Let's just grab A02 if exists
    if (items["A02"] !== undefined) w1 = items["A02"];
    
    trend.temp1.push(t1);
    trend.temp2.push(t2);
    trend.waterLevel.push(w1);
  });
  
  return contentResponse({
    status: "success",
    data: {
      compliance: { total: totalRuns, submitted: submittedRuns },
      trend: trend
    }
  });
}
/**
 * Lập lịch nhắc ca Golf:
 * Gọi hàm này bằng Time-driven trigger (vd: 18h30 kiểm tra ca_sang, 21h30 kiểm tra ca_toi)
 */
function checkGolfShiftSchedule_() {
  const now = new Date();
  const dateStr = formatPlanDate_(now);
  const hour = now.getHours();
  
  // Xác định ca cần nhắc dựa vào giờ
  let templateId = null;
  let shiftName = "";
  if (hour >= 13 && hour <= 19) {
    // Chiều/Tối nhắc ca Sáng
    templateId = "ca_sang";
    shiftName = "Ca Sáng";
  } else if (hour >= 20 || hour <= 5) {
    // Đêm nhắc ca Tối
    templateId = "ca_toi";
    shiftName = "Ca Tối";
  } else {
    return; // Ngoài khung giờ nhắc
  }
  
  const sheet = ensureGolfRunsSheet_();
  const lastRow = sheet.getLastRow();
  let found = false;
  
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, 4).getValues(); // RunID, Date, Template, Status
    for (let i = 0; i < rows.length; i++) {
      const rDate = formatPlanDate_(rows[i][1]);
      if (rDate === dateStr && String(rows[i][2]).trim() === templateId) {
         const status = String(rows[i][3]).trim();
         if (status === "submitted" || status === "confirmed") {
            found = true;
         }
         break;
      }
    }
  }
  
  if (!found) {
    sendAlert("⏰ [NHẮC NHỞ SÂN GOLF]\n"
       + "- Hiện đã cuối ca (" + shiftName + ")\n"
       + "- Hệ thống ghi nhận checklist sân golf vẫn chưa được CHỐT CA.\n"
       + "👉 Yêu cầu KTV khẩn trương hoàn thành và chốt ca!");
  }
}

// ==========================================
// ĐỊNH NGHĨA MẪU CHECKLIST — ĐỊA ĐIỂM / THỜI GIAN / CA TRỰC
// ==========================================
// Sheet ChecklistTemplateDefs là sổ đăng ký mẫu: mỗi dòng khai báo một mẫu
// checklist áp dụng cho ĐỊA ĐIỂM nào, khung THỜI GIAN nào và gán cho CA TRỰC nào.
// Hạng mục chi tiết của mẫu vẫn nằm ở GolfChecklistTemplates (khóa theo TemplateID),
// lượt thực hiện vẫn ở GolfChecklistRuns — nhờ đó mẫu mới tạo dùng lại nguyên
// vòng đời save/submit/confirm hiện có mà không cần sửa gì thêm.
//
// Frequency: daily | weekly | monthly
// - daily:   áp dụng mỗi ngày trong khung TimeStart–TimeEnd (TimeEnd <= TimeStart
//            nghĩa là ca qua đêm; giờ trước TimeEnd thuộc ngày nghiệp vụ hôm trước)
// - weekly:  áp dụng vào DayOfWeek (1=Thứ Hai … 7=Chủ Nhật) của ngày nghiệp vụ
// - monthly: áp dụng vào DayOfMonth (1–31) của ngày nghiệp vụ
// TimeStart/TimeEnd để trống → áp dụng cả ngày (mẫu tuần/tháng).

const CHECKLIST_TEMPLATE_DEF_HEADERS = [
  "TemplateID","TemplateName","Location","ShiftCode","Frequency",
  "TimeStart","TimeEnd","DayOfWeek","DayOfMonth","AssignedTeam",
  "Note","Active","CreatedAt","CreatedBy","UpdatedAt","UpdatedBy"
];

const CHECKLIST_TEMPLATE_DEF_FREQUENCIES = ["daily", "weekly", "monthly"];

// Seed từ 4 mẫu golf hiện hành để dữ liệu cũ tự có định nghĩa tương ứng.
const CHECKLIST_TEMPLATE_DEF_SEED = [
  { templateId: "ca_sang", templateName: "Ca Sáng (5h00 – 13h00)",
    location: "Sân Golf Kỳ Sơn", shiftCode: "ca_sang", frequency: "daily",
    timeStart: "05:00", timeEnd: "13:00", dayOfWeek: "", dayOfMonth: "",
    assignedTeam: "Tổ Cơ Điện Sân Golf", note: "" },
  { templateId: "ca_toi", templateName: "Ca Tối (13h00 – 21h00)",
    location: "Sân Golf Kỳ Sơn", shiftCode: "ca_toi", frequency: "daily",
    timeStart: "13:00", timeEnd: "21:00", dayOfWeek: "", dayOfMonth: "",
    assignedTeam: "Tổ Cơ Điện Sân Golf", note: "" },
  { templateId: "tuan", templateName: "Kiểm Tra Tuần (thứ Hai)",
    location: "Sân Golf Kỳ Sơn", shiftCode: "ca_sang", frequency: "weekly",
    timeStart: "", timeEnd: "", dayOfWeek: 1, dayOfMonth: "",
    assignedTeam: "Tổ Cơ Điện Sân Golf", note: "Thực hiện sáng thứ Hai đầu tuần" },
  { templateId: "thang", templateName: "Kiểm Tra Tháng (ngày 1)",
    location: "Sân Golf Kỳ Sơn", shiftCode: "ca_sang", frequency: "monthly",
    timeStart: "", timeEnd: "", dayOfWeek: "", dayOfMonth: 1,
    assignedTeam: "Tổ Cơ Điện Sân Golf", note: "Cần tối thiểu 2 KTV" }
];

function ensureChecklistTemplateDefsSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("ChecklistTemplateDefs");
  if (!sheet) sheet = ss.insertSheet("ChecklistTemplateDefs");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, CHECKLIST_TEMPLATE_DEF_HEADERS.length)
      .setValues([CHECKLIST_TEMPLATE_DEF_HEADERS]).setFontWeight("bold");
  }
  // TimeStart/TimeEnd lưu dạng text HH:mm, tránh Sheets tự đổi thành Date
  sheet.getRange("F:G").setNumberFormat("@");
  if (sheet.getLastRow() < 2) {
    const now = new Date();
    const rows = CHECKLIST_TEMPLATE_DEF_SEED.map(function(d) {
      return [
        d.templateId, d.templateName, d.location, d.shiftCode, d.frequency,
        d.timeStart, d.timeEnd, d.dayOfWeek, d.dayOfMonth, d.assignedTeam,
        d.note, "TRUE", now, "Seed", now, "Seed"
      ];
    });
    sheet.getRange(2, 1, rows.length, CHECKLIST_TEMPLATE_DEF_HEADERS.length).setValues(rows);
  }
  return sheet;
}

function checklistTemplateDefRowToObject_(r) {
  return {
    templateId:   String(r[0]).trim(),
    templateName: String(r[1] || ""),
    location:     String(r[2] || ""),
    shiftCode:    String(r[3] || ""),
    frequency:    String(r[4] || "daily"),
    timeStart:    String(r[5] || ""),
    timeEnd:      String(r[6] || ""),
    dayOfWeek:    r[7] === "" || r[7] === null ? "" : Number(r[7]),
    dayOfMonth:   r[8] === "" || r[8] === null ? "" : Number(r[8]),
    assignedTeam: String(r[9] || ""),
    note:         String(r[10] || ""),
    active:       String(r[11]).toUpperCase() !== "FALSE"
  };
}

function readChecklistTemplateDefs_() {
  const sheet = ensureChecklistTemplateDefsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, CHECKLIST_TEMPLATE_DEF_HEADERS.length)
    .getValues()
    .map(checklistTemplateDefRowToObject_)
    .filter(function(d) { return d.templateId !== ""; });
}

function findChecklistTemplateDefRow_(sheet, templateId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === templateId) return i + 2;
  }
  return 0;
}

// GET action=getChecklistTemplateDefs — {location?, includeInactive?}
function handleGetChecklistTemplateDefs(e) {
  const p = (e && e.parameter) || {};
  const location = String(p.location || "").trim();
  const includeInactive = String(p.includeInactive || "") === "true";
  const defs = readChecklistTemplateDefs_().filter(function(d) {
    if (!includeInactive && !d.active) return false;
    if (location && d.location !== location) return false;
    return true;
  });
  return contentResponse({ status: "success", defs: defs });
}

// ---- Phân giải lịch: mẫu nào áp dụng tại (ngày, giờ)? ----
// Các helper thuần bên dưới không phụ thuộc Sheets/GAS để test được bằng Node.

function checklistTimeToMinutes_(t) {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(t || "").trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function checklistAddDays_(dateStr, days) {
  const parts = String(dateStr).split("-");
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12);
  d.setDate(d.getDate() + days);
  const pad = function(v) { return String(v).length < 2 ? "0" + v : String(v); };
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

// 1=Thứ Hai … 7=Chủ Nhật (ISO), khớp cách ghi trong sheet
function checklistIsoDayOfWeek_(dateStr) {
  const parts = String(dateStr).split("-");
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12);
  const dow = d.getDay();
  return dow === 0 ? 7 : dow;
}

// Với danh sách định nghĩa mẫu, trả về trạng thái áp dụng tại (dateStr, timeStr):
// - businessDate: ngày nghiệp vụ (ca qua đêm → giờ trước TimeEnd thuộc hôm trước)
// - matchesDate:  mẫu có rơi vào ngày nghiệp vụ này không (thứ trong tuần/ngày trong tháng)
// - inWindow:     thời điểm hiện tại có nằm trong khung giờ thực hiện không
function resolveChecklistSchedule_(defs, dateStr, timeStr) {
  const minutes = checklistTimeToMinutes_(timeStr);
  return (defs || [])
    .filter(function(d) { return d && d.active !== false && String(d.templateId || "").trim() !== ""; })
    .map(function(d) {
      const start = checklistTimeToMinutes_(d.timeStart);
      const end = checklistTimeToMinutes_(d.timeEnd);
      const overnight = start !== null && end !== null && end <= start;

      let businessDate = String(dateStr);
      if (overnight && minutes !== null && minutes < end) {
        businessDate = checklistAddDays_(businessDate, -1);
      }

      let matchesDate = true;
      if (d.frequency === "weekly") {
        matchesDate = Number(d.dayOfWeek) === checklistIsoDayOfWeek_(businessDate);
      } else if (d.frequency === "monthly") {
        matchesDate = Number(d.dayOfMonth) === Number(businessDate.slice(8, 10));
      }

      let inWindow = matchesDate;
      if (matchesDate && start !== null && end !== null && minutes !== null) {
        inWindow = overnight
          ? (minutes >= start || minutes < end)
          : (minutes >= start && minutes < end);
      }

      return {
        templateId: d.templateId,
        templateName: d.templateName,
        location: d.location,
        shiftCode: d.shiftCode,
        frequency: d.frequency,
        businessDate: businessDate,
        matchesDate: matchesDate,
        inWindow: inWindow
      };
    });
}

// GET action=getChecklistSchedule — {date?, time?, location?}
// Không truyền date/time thì lấy theo giờ server (múi giờ script), tránh việc
// frontend tự suy luận ngày nghiệp vụ bằng đồng hồ thiết bị.
function handleGetChecklistSchedule(e) {
  const p = (e && e.parameter) || {};
  const now = new Date();
  const pad = function(v) { return String(v).length < 2 ? "0" + v : String(v); };
  const date = String(p.date || "").trim() || formatPlanDate_(now);
  const time = String(p.time || "").trim() || (pad(now.getHours()) + ":" + pad(now.getMinutes()));
  const location = String(p.location || "").trim();

  let defs = readChecklistTemplateDefs_();
  if (location) defs = defs.filter(function(d) { return d.location === location; });

  const schedule = resolveChecklistSchedule_(defs, date, time);
  return contentResponse({ status: "success", date: date, time: time, schedule: schedule });
}

// ---- Khởi tạo / cập nhật định nghĩa mẫu ----

function validateChecklistTemplateDef_(def) {
  if (!def.templateName) return "Thiếu tên mẫu checklist";
  if (!def.location) return "Thiếu địa điểm áp dụng";
  if (CHECKLIST_TEMPLATE_DEF_FREQUENCIES.indexOf(def.frequency) < 0) {
    return "Tần suất không hợp lệ (daily/weekly/monthly): " + def.frequency;
  }
  const hasStart = def.timeStart !== "";
  const hasEnd = def.timeEnd !== "";
  if (hasStart !== hasEnd) return "Khung giờ phải có đủ cả giờ bắt đầu và giờ kết thúc";
  if (hasStart && checklistTimeToMinutes_(def.timeStart) === null) return "Giờ bắt đầu không hợp lệ (HH:mm): " + def.timeStart;
  if (hasEnd && checklistTimeToMinutes_(def.timeEnd) === null) return "Giờ kết thúc không hợp lệ (HH:mm): " + def.timeEnd;
  if (def.frequency === "weekly") {
    const dow = Number(def.dayOfWeek);
    if (!(dow >= 1 && dow <= 7)) return "Mẫu tuần cần thứ trong tuần (1=Thứ Hai … 7=Chủ Nhật)";
  }
  if (def.frequency === "monthly") {
    const dom = Number(def.dayOfMonth);
    if (!(dom >= 1 && dom <= 31)) return "Mẫu tháng cần ngày trong tháng (1–31)";
  }
  return "";
}

// Nhân bản toàn bộ hạng mục của mẫu nguồn sang templateId mới trong
// GolfChecklistTemplates — dùng khi khởi tạo mẫu cho địa điểm mới từ mẫu có sẵn.
function cloneChecklistTemplateItems_(sourceTemplateId, targetTemplateId, targetTemplateName) {
  const sheet = ensureGolfTemplatesSheet_();
  if (sheet.getLastRow() < 2) return 0;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, GOLF_TEMPLATE_HEADERS.length).getValues();
  const cloned = [];
  rows.forEach(function(r) {
    if (String(r[0]).trim() !== sourceTemplateId) return;
    const copy = r.slice();
    copy[0] = targetTemplateId;
    copy[1] = targetTemplateName;
    cloned.push(copy);
  });
  if (cloned.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, cloned.length, GOLF_TEMPLATE_HEADERS.length).setValues(cloned);
  }
  return cloned.length;
}

// POST action=upsertChecklistTemplateDef — payload {templateId?, templateName, location,
//   shiftCode?, frequency?, timeStart?, timeEnd?, dayOfWeek?, dayOfMonth?, assignedTeam?,
//   note?, active?, cloneFromTemplateId?, user?}
// templateId trống → tạo mẫu mới (ID tự sinh); trùng ID có sẵn → cập nhật tại chỗ.
function handleUpsertChecklistTemplateDef(params) {
  // Client mới gửi payload phẳng; vẫn nhận { def } để tương thích bản web đã cache.
  const payload = params.payload || params.def || params;
  const def = {
    templateId:   String(payload.templateId || "").trim(),
    templateName: String(payload.templateName || "").trim(),
    location:     String(payload.location || "").trim(),
    shiftCode:    String(payload.shiftCode || "").trim(),
    frequency:    String(payload.frequency || "daily").trim(),
    timeStart:    String(payload.timeStart || "").trim(),
    timeEnd:      String(payload.timeEnd || "").trim(),
    dayOfWeek:    payload.dayOfWeek === undefined || payload.dayOfWeek === "" ? "" : Number(payload.dayOfWeek),
    dayOfMonth:   payload.dayOfMonth === undefined || payload.dayOfMonth === "" ? "" : Number(payload.dayOfMonth),
    assignedTeam: String(payload.assignedTeam || "").trim(),
    note:         String(payload.note || "")
  };
  const invalid = validateChecklistTemplateDef_(def);
  if (invalid) return contentResponse({ status: "error", message: invalid });

  const active = payload.active === false ? "FALSE" : "TRUE";
  const user = String(payload.user || params.user || "System");
  const sheet = ensureChecklistTemplateDefsSheet_();
  const now = new Date();
  const rowIndex = def.templateId ? findChecklistTemplateDefRow_(sheet, def.templateId) : 0;

  if (rowIndex > 0) {
    // Cập nhật: giữ CreatedAt/CreatedBy, chỉ ghi lại phần định nghĩa + Updated*
    sheet.getRange(rowIndex, 2, 1, 10).setValues([[
      def.templateName, def.location, def.shiftCode, def.frequency,
      def.timeStart, def.timeEnd, def.dayOfWeek, def.dayOfMonth,
      def.assignedTeam, def.note
    ]]);
    sheet.getRange(rowIndex, 12).setValue(active);
    sheet.getRange(rowIndex, 15, 1, 2).setValues([[now, user]]);
    writeAuditLog(user, "upsertChecklistTemplateDef", def.templateId, "Updated: " + def.templateName);
    return contentResponse({ status: "success", message: "Đã cập nhật định nghĩa mẫu", templateId: def.templateId });
  }

  if (!def.templateId) def.templateId = "tpl_" + Date.now();
  sheet.appendRow([
    def.templateId, def.templateName, def.location, def.shiftCode, def.frequency,
    def.timeStart, def.timeEnd, def.dayOfWeek, def.dayOfMonth, def.assignedTeam,
    def.note, active, now, user, now, user
  ]);

  let clonedCount = 0;
  const cloneFrom = String(payload.cloneFromTemplateId || "").trim();
  if (cloneFrom) {
    clonedCount = cloneChecklistTemplateItems_(cloneFrom, def.templateId, def.templateName);
  }

  writeAuditLog(user, "upsertChecklistTemplateDef", def.templateId,
    "Created: " + def.templateName + (cloneFrom ? " (nhân bản " + clonedCount + " hạng mục từ " + cloneFrom + ")" : ""));
  return contentResponse({
    status: "success",
    message: "Đã khởi tạo mẫu checklist" + (clonedCount ? " với " + clonedCount + " hạng mục nhân bản" : ""),
    templateId: def.templateId,
    clonedItems: clonedCount
  });
}

// POST action=deleteChecklistTemplateDef — payload {templateId, user?}
// Soft delete: Active=FALSE để giữ nguyên lịch sử runs/hạng mục đã có.
function handleDeleteChecklistTemplateDef(params) {
  const payload = params.payload || params;
  const templateId = String(payload.templateId || "").trim();
  if (!templateId) return contentResponse({ status: "error", message: "Thiếu templateId" });

  const sheet = ensureChecklistTemplateDefsSheet_();
  const rowIndex = findChecklistTemplateDefRow_(sheet, templateId);
  if (rowIndex < 2) return contentResponse({ status: "error", message: "Không tìm thấy định nghĩa mẫu: " + templateId });

  const now = new Date();
  const user = String(payload.user || params.user || "System");
  sheet.getRange(rowIndex, 12).setValue("FALSE");
  sheet.getRange(rowIndex, 15, 1, 2).setValues([[now, user]]);
  writeAuditLog(user, "deleteChecklistTemplateDef", templateId, "Deactivated");
  return contentResponse({ status: "success", message: "Đã ngừng áp dụng mẫu (giữ nguyên lịch sử)" });
}
