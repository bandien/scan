# Implementation Plan: Dynamic Staff Onboarding

## 1. Overview
Triển khai tính năng tự đăng ký và quản lý nhân sự mở trên ứng dụng Nhật Ký & Checklist Vận Hành (`nhatky/index.html`).

## 2. Các Bước Thực Hiện (TDD Workflow)

### Bước 1: Chuẩn bị Test Suite (RED)
- Bổ sung test case vào `tests/nhatky-multi-user.spec.js` kiểm tra quy trình tự tạo tài khoản của nhân viên thử việc ("Lê Văn An" - Thử việc), vào ca trực, tạo checklist, ghi log và kiểm tra tính cô lập dữ liệu.
- Chạy test và ghi nhận trạng thái RED (fail).

### Bước 2: Nâng cấp Data Layer & Repository (GREEN - Part 1)
- Trong `AppRepository`:
  - `loadState()`: Đọc `app_employees` từ `localStorage`.
  - `addEmployee(fullName, role, customCode)`: Sinh ID tự động, lưu vào `app_employees`.
  - `deactivateEmployee(empId)`: Hỗ trợ ngưng kích hoạt.

### Bước 3: Nâng cấp Giao Diện & Modal (GREEN - Part 2)
- Thêm Modal `#modal-add-employee` (Form nhập Họ tên, Vai trò, Mã NV).
- Thêm nút `+ Thêm nhân viên / Thử việc` tại `#modal-shift-select` và `#tab-personal`.
- Cập nhật render động danh sách nhân sự trong Tab Cá nhân và Dropdown chọn ca trực.

### Bước 4: Verification & Deployment
- Chạy `npx playwright test tests/nhatky-multi-user.spec.js`.
- Đảm bảo 100% test cases PASSED.
- Commit & Push lên GitHub Pages (`bandien/scan`).
