# Implementation Plan: Fix Nhật Ký & Checklist Đa Nhân Viên

## 1. Overview
Triển khai giải pháp toàn diện cho ứng dụng Nhật Ký & Checklist Vận Hành (`nhatky/index.html`) nhằm giải quyết triệt để lỗi dùng chung dữ liệu cho mọi nhân viên, thiếu audit log, dữ liệu nhân sự chưa chuẩn và migration legacy không an toàn.

## 2. Các Bước Thực Hiện (TDD Workflow)

### Bước 1: Chuẩn bị Test Suite (RED)
- Tạo file kiểm thử `tests/nhatky-multi-user.spec.js` với 12 test cases mô tả đầy đủ các yêu cầu nghiệp vụ bắt buộc.
- Chạy test để ghi nhận trạng thái RED (fail).

### Bước 2: Tầng Dữ Liệu & Migration (GREEN - Part 1)
- Xây dựng class `AppRepository` quản lý:
  - `employees`: 4 nhân sự Active (Ngô Quyết Thắng, Đinh Văn Hậu, Hoàng Việt Hoàng, Nguyễn Đức Phong). Bùi Hồng Quân & Nguyễn Đình Thủy đánh dấu `inactive`.
  - `shifts`: Quản lý ca trực (`shiftId = shift_YYYYMMDD_TYPE_EMPID`).
  - `tasks` & `taskEvents`: Cô lập theo `shiftId`, lưu `createdBy`, `completedBy`, `completedAt` và lịch sử mở lại task (`REOPENED`).
  - `logs`: Cô lập theo `shiftId` và `employeeId`.
  - `migrateLegacyData()`: Idempotent migration sao lưu dữ liệu cũ và gán nhãn `legacy-unattributed`.

### Bước 3: Giao Diện & Tương Tác SPA (GREEN - Part 2)
- Tích hợp `AppRepository` vào `nhatky/index.html`.
- Xây dựng thanh chọn ca trực / nhân viên hoạt động ở đầu trang và trong tab Cá nhân.
- Xây dựng Modal Mở lại task với lý do bắt buộc.
- Cập nhật Tab Báo Cáo để phản ánh chính xác 100% dữ liệu theo ca được chọn.
- Bổ sung `aria-label` và các thuộc tính Accessibility cho tất cả các nút icon.

### Bước 4: Refactor & Verification (REFACTOR)
- Chạy `npx playwright test tests/nhatky-multi-user.spec.js`.
- Kiểm tra toàn bộ test cases đạt GREEN (100% Pass).
- Commit & Push lên repository `bandien/scan`.
