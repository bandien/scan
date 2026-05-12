# Roadmap: 11_BanDienScan (Electrical Board Maintenance)

> Module quét QR báo cáo bảo trì bản điện độc lập. Bản sao từ `vanhanh-ai/qr`.

**Status**: Active (Initialized)
**Last Updated**: 2026-05-13

## ✅ Trạng thái Hiện tại
- [x] Khởi tạo module từ repository gốc `vanhanh-ai/qr`.
- [x] Thiết lập `upstream` remote để nhận cập nhật.
- [x] Thiết lập `origin` remote hướng về `bandien/scan.git`.

## 🚀 Nhiệm vụ Tiếp theo
- [ ] Tạo Google Sheet riêng cho Bản điện.
- [ ] Cập nhật `MANUAL_SHEET_ID` trong `Backend.gs`.
- [ ] Khởi tạo Apps Script project mới (Clasp) và Deploy.

## 🎯 Tầm nhìn & Nguyên tắc
- **Mã QR tinh gọn**: Chỉ chứa dữ liệu thô là UID (ví dụ: `TB001`). **Không** chứa URL để tránh việc phải in lại nhãn mỗi khi thay đổi domain/server.
- **Hệ thống Hybrid**: 
  - Frontend (Giao diện): Đặt trên GitHub Pages (Short URL: `https://vanhanh-ai.github.io/qr/`).
  - Backend (Database tạm): Google Sheets.
- **Kết nối API**: Sử dụng Google Apps Script (GAS) làm cầu nối xử lý và ghi dữ liệu từ Frontend xuống Sheets.
- **Đa phương thức nhập**: Hỗ trợ cả hai cách ngay tại màn hình chính:
  1. Quét QR (bằng Camera thiết bị).
  2. Nhập tay (Manual Input UID).
- **Đa ngôn ngữ (i18n)**: Tích hợp chuyển đổi Tiếng Việt/Tiếng Anh mượt mà, lưu tùy chọn ngôn ngữ theo từng người dùng.

---

## 🗺️ Các Giai Đoạn Phát Triển

### Phase 1: Xây dựng Frontend (GitHub Pages)
- [ ] Khởi tạo giao diện tĩnh (HTML/CSS/JS) tối ưu cho Mobile.
- [ ] Tích hợp thư viện quét mã QR (hỗ trợ camera điện thoại).
- [ ] Xây dựng form nhập liệu thủ công cho UID.
- [ ] Triển khai đa ngôn ngữ (i18n) với Tiếng Việt và Tiếng Anh (sử dụng LocalStorage để lưu trạng thái).
- [ ] Xuất bản dự án lên GitHub Pages.

### Phase 2: Xây dựng GAS Backend & Google Sheets
- [ ] Khởi tạo và thiết kế cấu trúc bảng tính Google Sheets:
  - Bảng Lịch sử Báo cáo (UID, Ngày giờ, Vị trí, Tình trạng, Người báo).
- [ ] Viết Google Apps Script (GAS) nhận HTTP POST request từ Frontend.
- [ ] Xử lý lưu trữ dữ liệu vào bảng tính và trả về phản hồi (CORS, JSON response).
- [ ] Deploy GAS dưới dạng Web App API endpoint.
- [ ] Kết nối giao diện GitHub Pages để gọi API này.

### Phase 3: Hệ thống Đồng bộ NAS (PostgreSQL)
- [ ] Xây dựng script đồng bộ (`google-sheets-sync.ts` hoặc tương tự) chạy trên NAS.
- [ ] Lên lịch Cron job trên NAS để tự động kéo dữ liệu từ Sheets về cơ sở dữ liệu PostgreSQL cục bộ.
- [ ] Cập nhật trạng thái "đã đồng bộ" lên Sheets hoặc quản lý bằng timestamp.

### Phase 4: Test & Tối ưu
- [ ] Kiểm thử quét mã vạch trong điều kiện thiếu sáng.
- [ ] Thêm phản hồi UI (rung, âm thanh, popup) khi quét và gửi thành công.
- [ ] Xử lý lưu cache (Offline fallback) nếu thiết bị mất mạng.
