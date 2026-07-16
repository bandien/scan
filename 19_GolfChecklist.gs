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
//
// Mẫu lưu ở sheet GolfChecklistTemplates — sửa hạng mục chỉ cần sửa sheet,
// không cần deploy lại. Seed trong code chỉ dùng lần đầu hoặc khi force.

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
    if (status === "confirmed") {
      return contentResponse({ status: "error", message: "Lượt này đã được xác nhận bàn giao — không sửa được nữa" });
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
  } catch (_) {}
  return contentResponse({ status: "success", runId: runId });
}

// POST action=confirmGolfHandover — payload {runId, confirmedBy}
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
