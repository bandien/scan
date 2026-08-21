# Design Spec: Authentication, Login, Logout & Password Management (Google Sheet Default PIN)

## 1. Mục Tiêu
Bổ sung tính năng bảo mật tài khoản cho ứng dụng Nhật Ký & Checklist Vận Hành:
- Màn hình Đăng nhập (Login Screen) theo tài khoản nhân viên.
- Mật khẩu mặc định toàn bộ tài khoản ban đầu là `1234` (hoặc lấy từ cột PIN/Mật khẩu trong Google Sheet).
- Hỗ trợ nhân viên tự Đổi mật khẩu trên thiết bị.
- Tính năng Đăng xuất an toàn.

## 2. Mô Hình Dữ Liệu
Mỗi nhân viên trong `app_employees` lưu kèm trường `pin`:
```json
{
  "id": "EMP01",
  "fullName": "Ngô Quyết Thắng",
  "shortName": "Thắng",
  "role": "Ca trưởng",
  "pin": "1234",
  "status": "active"
}
```

Phiên đăng nhập lưu tại `currentUser`:
```json
{
  "employeeId": "EMP01",
  "fullName": "Ngô Quyết Thắng",
  "role": "Ca trưởng",
  "loginAt": "2026-08-21T14:00:00.000Z"
}
```
