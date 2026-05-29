# Roadmap: 11_BanDienScan (Electrical Department Maintenance)

> Module quét QR báo cáo bảo trì ban điện độc lập. CMMS Mini WebApp cho Ban Điện — Hapulico.

**Status**: Active — Phase 9 & 10 Complete, Phase 11+ Pending
**Last Updated**: 2026-05-29

---

## ✅ Trạng thái Hiện tại
- [x] Module khởi tạo từ repository gốc `vanhanh-ai/qr`.
- [x] Google Sheet riêng cho Ban Điện (`Sheet ID: 1K_5jb0-TrshgCyNs_l5jjTpVjwdmHI-l9gpSHWXTdSg`).
- [x] GAS Backend deployed (`Backend.gs`, 460 lines).
- [x] Frontend production-ready (`index.html`, 61KB, Bootstrap 5 + Chart.js + html5-qrcode).
- [x] RBAC Login (Username + Password + Role).
- [x] Local-First Architecture (localStorage, tốc độ 0.01s).

---

## 🗺️ Các Giai Đoạn Phát Triển

### ✅ Phase 1–4: Nền tảng Core (DONE)
- [x] Frontend tĩnh tối ưu Mobile (HTML/CSS/JS).
- [x] Quét mã QR bằng camera (html5-qrcode) + nhập tay UID.
- [x] GAS Backend nhận HTTP POST, ghi Google Sheets, trả JSON (CORS OK).
- [x] Bảo mật API bằng token (`HAPU_QR_SECRET_2026`).
- [x] UI refinement: Toast thông báo, âm thanh, rung haptic, skeleton loader.
- [x] Đa ngôn ngữ (VI/EN) lưu vào localStorage.

### ✅ Phase 5: Dashboard + Asset Profile (DONE)
- [x] Phân cấp thiết bị: Khu vực > Loại > Thiết bị.
- [x] Tìm kiếm thông minh theo khu vực / trạng thái.
- [x] Dashboard Chart.js: biểu đồ tròn trạng thái thiết bị.
- [x] Asset Profile chi tiết: thông tin kỹ thuật + lịch sử bảo trì.

### ✅ Phase 6: PM Calendar + Checklist Templates (DONE — UI tĩnh)
- [x] Giao diện lịch bảo trì (PM Calendar view).
- [x] Thư viện mẫu Checklist theo loại thiết bị (Điều hòa, Thang máy, Hệ thống điện).
- [x] Chu kỳ bảo trì cấu hình được (7/30/90 ngày).

### ✅ Phase 7: Kanban Work Orders (DONE)
- [x] Giao diện Kanban Board (Todo → In Progress → Done).
- [x] Giao việc theo Tổ / Cá nhân.
- [x] Mobile-first: cuộn ngang các cột.

### ✅ Phase 8 (Partial): Work Orders API + CMMS Core (DONE in code)
- [x] `WorkOrders` Sheet & API: `createWO`, `updateWOStatus`, `getWorkOrders` (Backend.gs).
- [x] `getInventory` action trong GAS.
- [x] `AuditLog` Sheet: ghi mọi thay đổi (User, Timestamp, Action).
- [x] Kanban Live Data: kéo từ localStorage (offline-first).
- [ ] Cảnh báo tồn kho khi `Stock < MinStock`.
- [ ] KPI Dashboard thật: MTTR, MTBF, % PM đúng hạn.
- [ ] Export Excel / báo cáo tự động.

### ✅ Phase 9: RBAC + Smart Preload + Local-First (DONE)
- [x] Màn hình Login (Username + Password). Phân quyền theo Tổ/Đội.
- [x] Smart Data Fetching: tải dữ liệu theo quyền hạn sau login.
- [x] Local-First Architecture: toàn bộ dữ liệu lưu localStorage.
- [x] Background Syncing: checklist lưu cục bộ, đồng bộ ngầm lên Sheets.
- [x] Đổi mật khẩu.

### 🔜 Pending: Live Data cho Calendar & Dashboard
- [ ] Calendar section kéo dữ liệu `nextMaintenance` từ `localDevicesMap` (thay hardcode).
- [ ] Dashboard chart tính từ `localDevicesMap` (thay `data: [12, 5, 2]`).

### ✅ Phase 10: Admin Portal & CRUD (DONE)
- [x] Đăng nhập phân quyền bảo mật cấp Quản lý (Admin/Manager được phép chỉnh sửa).
- [x] Device CRUD (Giao diện Thêm mới, Chỉnh sửa thông tin thiết bị trực tiếp trên WebApp).
- [x] Tích hợp in nhãn chuyên dụng cho Fluke LinkWare Live và máy in Brother PT-E560BT.
- [x] Chuẩn hóa trường nhập liệu: Chuyển đổi Vị trí, Tổ quản lý, Ca trực thành Dropdown linh hoạt + Thêm mới.
- [x] Mô hình phân cấp quản lý & Nhiều tổ trực thuộc (Hierarchical Multi-team Filtering).
- [ ] Cây phân cấp vị trí thiết bị chi tiết: Khu vực → Tòa nhà → Tầng → Phòng → Thiết bị.
- [ ] Tự động sinh mã QR (QR Generator).
- [ ] Quản lý Work Orders nâng cao (giao WO, mức độ ưu tiên, hạn xử lý).

### ⏳ Phase 11: Metering & Năng lượng (NOT STARTED)
- [ ] Sheet `MeterPoints`: điện/nước, vị trí, hệ số, ngưỡng.
- [ ] Ghi chỉ số định kỳ qua WebApp.
- [ ] Tính sản lượng tự động, cảnh báo vượt ngưỡng.
- [ ] Biểu đồ xu hướng tiêu thụ theo tháng.

---

## 🎯 Tầm nhìn & Nguyên tắc
- **Mã QR tinh gọn**: Chỉ chứa UID (ví dụ: `TB001`). Không chứa URL — tránh in lại nhãn khi đổi domain.
- **Hệ thống Hybrid**: Frontend trên GitHub Pages + Backend GAS + Google Sheets.
- **Local-First**: Mọi dữ liệu cache trong localStorage để tốc độ 0.01s.
- **API Security**: Token-based (`HAPU_QR_SECRET_2026`) trên mọi endpoint.

---

**Lead:** Antigravity  
**Infrastructure:** GitHub Pages + Google Apps Script + Google Sheets  
**GAS URL:** `https://script.google.com/macros/s/AKfycbzW4TxDarLBOpZvO8hnE0R65IsCd95a5l-XPASjUmZNuefH5MiWMs8lCpLpggzFwyXK/exec`
