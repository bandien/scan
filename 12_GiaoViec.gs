// ==========================================
// 12_GiaoViec.gs — TÍCH HỢP CLAUDE TỰ ĐỘNG
// ==========================================
// File này chứa logic nghiệp vụ phục vụ việc tiếp nhận
// và ghi phiếu giao việc tự động từ email (Claude Artifact).

var PHIEU_SHEET_ID = "1enSPxSlNt7ATsUSQn5r6vB7X6eJoKvk8PRZZP_NIgxo";

/**
 * Lấy STT mới bằng cách tìm STT lớn nhất hiện có trong sheet và + 1
 * @returns {number} STT mới
 */
function laySttMoi() {
  var ss = SpreadsheetApp.openById(PHIEU_SHEET_ID);
  var sheet = ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var maxStt = 0;
  for (var i = 1; i < data.length; i++) {
    var stt = parseInt(data[i][0]);
    if (!isNaN(stt) && stt > maxStt) {
      maxStt = stt;
    }
  }
  return maxStt + 1;
}

/**
 * Thêm một hàng phiếu giao việc mới vào Google Sheets
 * @param {Object} d Dữ liệu phiếu đã trích xuất từ email
 * @returns {Object} { stt: number } STT của phiếu vừa tạo
 */
function themPhieuMoi(d) {
  var ss = SpreadsheetApp.openById(PHIEU_SHEET_ID);
  var sheet = ss.getSheets()[0];
  var stt = laySttMoi();
  var hom_nay = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
  
  var row = [
    stt,                          // A: STT
    d.ma || "",                   // B: Mã
    d.loai || "Hệ thống điện",     // C: Loại hệ thống
    d.ten || "",                  // D: Tên phản ánh / đầu việc
    d.thu_phi || "Không",          // E: Thu phí
    "",                           // F: Số tiền (để trống)
    d.trang_thai || "Chưa thực hiện", // G: Trạng thái
    d.loai_kh || "Nội bộ",         // H: Loại khách hàng
    d.nguon || "Email Chủ tịch",   // I: Nguồn
    d.vi_tri || "",               // J: Vị trí
    d.ngay || hom_nay,            // K: Ngày phản ánh
    "",                           // L: Hoàn thành (để trống)
    d.han || "",                  // M: Chưa hoàn thành / Deadline
    d.ngay || hom_nay,            // N: Bắt đầu dự kiến
    "",                           // O: Kết thúc dự kiến (để trống)
    "",                           // P: Bắt đầu thực tế (để trống)
    "",                           // Q: Kết thúc thực tế (để trống)
    "",                           // R: Quá hạn xử lý (để trống)
    d.don_vi || "Ban điện",       // S: Đơn vị thực hiện
    d.to_doi || "",               // T: Tổ đội / Người thực hiện
    d.noi_dung || "",             // U: Nội dung công việc
    "",                           // V: Điểm đầu việc (để trống)
    "",                           // W: Kết quả xử lý (để trống)
    d.ghi_chu || ""               // X: Ghi chú
  ];
  
  sheet.appendRow(row);
  return { stt: stt };
}
