# Roadmap: 11_BanDienScan (Electrical Department Maintenance)

> Module quét QR báo cáo bảo trì ban điện độc lập. CMMS Mini WebApp cho Ban Điện — Hapulico.

**Status**: Active — Phase 9 & 10 Complete, Phase 11+ Pending (Stable v2.7.0)
**Last Updated**: 2026-06-04

---

## 🎯 Tầm nhìn & Nguyên tắc
- **Mã QR tinh gọn**: Chỉ chứa dữ liệu thô là UID (ví dụ: `TB001`). **Không** chứa URL — tránh in lại nhãn khi đổi domain.
- **Hệ thống Hybrid**: 
  - Frontend (Giao diện): GitHub Pages & Local Hosting.
  - Backend (Database tạm): Google Sheets.
- **Kết nối API**: GAS (Google Apps Script) làm cầu nối xử lý JSON/CORS.
- **Offline & Local-First**: Mọi dữ liệu cache trong localStorage để tốc độ phản hồi tức thì (0.01s), đồng bộ ngầm khi có mạng.
- **Bảo mật**: API Token-based (`HAPU_QR_SECRET_2026`) trên mọi endpoint.

---

## ✅ Trạng thái Hiện tại
- [x] Module khởi tạo từ repository gốc `vanhanh-ai/qr`.
- [x] Google Sheet riêng cho Ban Điện (`Sheet ID: 1K_5jb0-TrshgCyNs_l5jjTpVjwdmHI-l9gpSHWXTdSg`).
- [x] GAS Backend deployed (`Backend.gs`, ~1500 lines).
- [x] Frontend production-ready (`index.html`, ~250KB, Bootstrap 5 + Chart.js + html5-qrcode).
- [x] RBAC Login (Username + Password + Role + Teams).
- [x] Local-First Architecture (localStorage, tốc độ 0.01s).

---

## 🗺️ Các Giai Đoạn Phát Triển

### ✅ Phase 1–4: Nền tảng Core (DONE)
- [x] Giao diện tĩnh tối ưu Mobile (HTML/CSS/JS) với Glassmorphism UI.
- [x] Quét mã QR bằng camera (html5-qrcode) + nhập tay UID + Haptic/Audio Feedback.
- [x] GAS Backend nhận HTTP POST, ghi Google Sheets, trả JSON (CORS OK).
- [x] Bảo mật API bằng token (`HAPU_QR_SECRET_2026`).
- [x] UI refinement: Toast thông báo, âm thanh, rung haptic, skeleton loader.
- [x] Đa ngôn ngữ (VI/EN) lưu vào localStorage.

### ✅ Phase 5: Dashboard + Asset Profile (DONE)
- [x] Phân cấp thiết bị: Khu vực > Loại > Thiết bị (sử dụng cột `Area` và `EquipmentType`).
- [x] Tìm kiếm thông minh theo khu vực / loại máy / trạng thái.
- [x] Dashboard Chart.js: biểu đồ tròn trạng thái thiết bị và cột bảo trì 6 tháng gần nhất.
- [x] Asset Profile chi tiết: thông tin kỹ thuật + lịch sử bảo trì.

### ✅ Phase 6: PM Calendar + Checklist Templates (DONE)
- [x] Giao diện lịch bảo trì (PM Calendar view) tải động từ API.
- [x] Thư viện mẫu Checklist theo loại thiết bị (Điều hòa, Thang máy, Hệ thống điện).
- [x] Chu kỳ bảo trì cấu hình được (7/30/90 ngày) & tự động nhắc lịch.
- [x] Tạo nhanh phiếu bảo trì (Preventive WO) trực tiếp từ danh sách Lịch bảo trì.

### ✅ Phase 7: Kanban Work Orders (DONE)
- [x] Giao diện Kanban Board (Todo → In Progress → Done).
- [x] Giao việc theo Tổ / Đội / Ca trực / Cá nhân.
- [x] Mobile-first: cuộn ngang các cột mượt mà.

### ✅ Phase 8: Work Orders API + CMMS Core (DONE)
- [x] `WorkOrders` Sheet & API: `createWO`, `updateWOStatus`, `getWorkOrders` (Backend.gs).
- [x] `getInventory` action trong GAS & Tab `Inventory` quản lý vật tư.
- [x] `AuditLog` Sheet: ghi mọi thay đổi (User, Timestamp, Action, Target, Details).
- [x] Kanban Live Data: đồng bộ trực tiếp với database qua API.

### ✅ Phase 9: RBAC + Smart Preload + Local-First (DONE)
- [x] Màn hình Login (Username + Password). Phân quyền theo Tổ/Đội.
- [x] Smart Data Fetching: tải dữ liệu thuộc quyền hạn của Tổ đó sau login.
- [x] Local-First Architecture: toàn bộ dữ liệu lưu localStorage để phản hồi tức thì (0.01s).
- [x] Background Syncing: checklist lưu cục bộ, đồng bộ ngầm lên Sheets.
- [x] Đổi mật khẩu trực tiếp từ giao diện người dùng.

### ✅ Phase 10: Admin Portal & CRUD (DONE)
- [x] Đăng nhập phân quyền bảo mật cấp Quản lý (Admin/Manager được phép chỉnh sửa).
- [x] Device CRUD (Thêm mới, Chỉnh sửa thông tin thiết bị trực tiếp trên WebApp).
- [x] Tích hợp in nhãn chuyên dụng cho Fluke LinkWare Live và máy in Brother PT-E560BT.
- [x] Chuẩn hóa trường nhập liệu: Chuyển đổi Vị trí, Tổ quản lý, Ca trực thành Dropdown linh hoạt + Thêm mới.
- [x] Mô hình phân cấp quản lý & Nhiều tổ trực thuộc (Hierarchical Multi-team Filtering).
- [x] Hỗ trợ trường Số Seri (Serial Number) của hãng sản xuất, hoạt động độc lập với UID bảo trì.

### ⏳ Phase 11: Metering & Năng lượng (NOT STARTED)
- [ ] Sheet `MeterPoints`: điện/nước, vị trí, hệ số, ngưỡng.
- [ ] Ghi chỉ số định kỳ qua WebApp, chụp ảnh đồng hồ.
- [ ] Tính sản lượng tự động, cảnh báo vượt ngưỡng.
- [ ] Biểu đồ xu hướng tiêu thụ theo tháng trên Dashboard.
- [ ] Nút phản hồi "Sai vị trí?" trên màn hình thiết bị.

### ⏳ Phase 12: Đồng bộ NAS & Data Ownership (NOT STARTED)
- [ ] Xây dựng script đồng bộ (Node.js/Python) chạy trên Synology NAS.
- [ ] Tự động kéo dữ liệu từ Google Sheets về PostgreSQL cục bộ.
- [ ] Xây dựng Webhook từ GAS để báo tin cho NAS khi có dữ liệu mới (Real-time sync).
- [ ] Triển khai lưu trữ hình ảnh bảo trì lên NAS thay vì Google Drive.

### ⏳ Phase 13: Mở rộng & Tích hợp (NOT STARTED)
- [ ] Tích hợp thông báo tự động qua Telegram/Zalo khi có Work Order khẩn cấp.
- [ ] Chế độ Offline hoàn toàn (PWA - Progressive Web App).
- [ ] Tích hợp AI chẩn đoán lỗi dựa trên hình ảnh báo cáo bảo trì.

---

**Lead Architect:** Antigravity  
**Infrastructure:** GitHub Pages + Google Apps Script + Google Sheets  
**GAS URL:** `https://script.google.com/macros/s/AKfycbzW4TxDarLBOpZvO8hnE0R65IsCd95a5l-XPASjUmZNuefH5MiWMs8lCpLpggzFwyXK/exec`
