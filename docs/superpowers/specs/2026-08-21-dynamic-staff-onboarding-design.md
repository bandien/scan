# Design Spec: Dynamic Staff Onboarding & Self-Registration

## 1. Bối cảnh & Yêu cầu
Trước đây, danh sách nhân viên của Tổ Điện Hòa Bình bị hardcode cố định gồm 4 người (Thắng, Hậu, Hoàng, Phong).
Yêu cầu mới: Chuyển danh sách nhân viên sang **mô hình mở (Dynamic / Open)** để nhân viên mới, nhân viên thử việc, thực tập sinh hoặc kỹ thuật viên tăng cường có thể tự tạo tài khoản/hồ sơ trực tiếp trên web app và bắt đầu ghi nhật ký, quản lý checklist ngay lập tức.

## 2. Kiến Trúc Dữ Liệu
- Key lưu trữ: `app_employees` trong `localStorage`.
- Cấu trúc nhân viên:
  ```json
  {
    "id": "EMP05",
    "fullName": "Lê Văn An",
    "shortName": "An",
    "role": "Thử việc",
    "status": "active",
    "createdAt": "2026-08-21T13:50:00.000Z"
  }
  ```
- Khi khởi tạo lần đầu: Nếu `app_employees` chưa có, nạp 4 nhân sự mặc định (`EMP01` -> `EMP04`).
- Tự động sinh ID: Tìm số thứ tự lớn nhất trong danh sách `EMPxx` để sinh `EMP05`, `EMP06`... hoặc cho phép nhập mã tuỳ biến.

## 3. Quy Trình UI / UX
- **Vị trí 1 (Đầu trang):** Trong Modal Chọn ca trực (`#modal-shift-select`), có nút bấm `+ Thêm nhân viên / Thử việc mới`.
- **Vị trí 2 (Tab Cá nhân):** Trong danh mục "Danh sách nhân sự", hiển thị toàn bộ nhân sự đang active kèm vai trò và nút `+ Thêm nhân viên mới`.
- **Modal Thêm nhân viên (`#modal-add-employee`):**
  - Họ tên (Bắt buộc)
  - Vai trò (Kỹ thuật viên, Thử việc, Học việc, Thực tập sinh, Khác)
  - Mã NV (Tự động điền mã kế tiếp)
  - Nút "Tạo hồ sơ & Vào ca trực"
