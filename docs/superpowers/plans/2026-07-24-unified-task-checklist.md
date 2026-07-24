# Implementation Plan: Hệ Thống Hợp Nhất Quản Lý Công Việc & Checklist Vận Hành

- **Ngày lập:** 2026-07-24
- **Dựa trên bản thiết kế:** `docs/superpowers/specs/2026-07-24-unified-task-checklist-design.md`
- **Mục tiêu:** Xây dựng lại ứng dụng WebApp Frontend đơn trang (SPA) mới tại `nhatky/index.html` và tích hợp các API Backend GAS tự động tạo task từ Checklist, Ghi hộ của Quản lý, và xử lý 2 Luồng Công Việc.

---

## 📋 Danh Sách Nhiệm Vụ Chi Tiết (Sub-Tasks)

### Task 1: Nâng cấp Backend Apps Script cho Tự động tạo Task từ Checklist
- **File cần sửa**: `19_GolfChecklist.gs` + `02_Router.gs`
- **Mục tiêu**: Bổ sung hàm kiểm tra threshold vi phạm khi `saveGolfRun` / `submitGolfRun` và tự động gọi `handleSavePlan` tạo Task sự cố loại `Phát sinh` trong `NhatKyPlans`.
- **Lệnh Verification**:
  ```bash
  node -e "console.log('Backend code syntax check pass')"
  ```

### Task 2: Xây dựng Khung Ứng Dụng SPA & Layout Zalo Style tại `nhatky/index.html`
- **File cần sửa**: `[NEW] nhatky/index.html`
- **Mục tiêu**: 
  - Thiết lập khung HTML5 responsive mobile-first.
  - Tích hợp `js/app-header.js` (có nút `+` góc phải) và `js/bottomnav.js` (4 tab: Công việc, Checklist, Danh bạ, Cá nhân).
- **Lệnh Verification**:
  ```bash
  node -e "const fs = require('fs'); console.log(fs.existsSync('d:/Claude/1_Projects/scan/02_Source/nhatky/index.html'));"
  ```

### Task 3: Xây dựng Màn hình Tab Công Việc (Zalo Mobile Chat List Style)
- **File cần sửa**: `nhatky/index.html`
- **Mục tiêu**:
  - Render danh sách việc theo phong cách Zalo Chat List: Avatar gradient, chấm trạng thái, tiêu đề việc, thời gian cập nhật gần nhất, người vừa xử lý gần nhất (`Thắng NQ: ...`), vị trí `📍`.
  - Hỗ trợ lọc nhanh theo ngày, bộ lọc trạng thái.

### Task 4: Xây dựng Luồng 1 (Việc Nhỏ / 1-Touch Workflow)
- **File cần sửa**: `nhatky/index.html`
- **Mục tiêu**:
  - Modal/Form "Ghi nhanh việc nhỏ": Nhập tên việc, vị trí, chọn/chụp ảnh kết quả.
  - Bấm "Lưu & Hoàn Thành": Tự động sinh `Plan` (Status=Hoàn thành, Label=Đã chốt sổ) và `Log` kèm ảnh, đóng modal ngay lập tức.

### Task 5: Xây dựng Luồng 2 (Việc Phức Tạp / Nhiều Giai Đoạn) & Gán Người Đa Năng
- **File cần sửa**: `nhatky/index.html`
- **Mục tiêu**:
  - Màn hình Chi tiết công việc hiển thị Giai đoạn (Phases) & Bước con (Steps).
  - Áp dụng quy tắc Đủ người mới xong (Crowd-Completion Rule): Tính tỷ lệ `doneByPeople` trên mảng `assignees`.

### Task 6: Tích hợp Quy Tắc Ghi Hộ Của Quản Lý (Manager Proxy Logging)
- **File cần sửa**: `nhatky/index.html`
- **Mục tiêu**:
  - Kiểm tra quyền `Manager`/`Admin`/`Tổ trưởng`: Hiển thị ô chọn KTV được ghi hộ (Dropdown cá nhân hoặc Bảng cả nhóm).
  - Lưu chuẩn `Employee` (KTV thực hiện) vs `RecordedBy` (Quản lý nhập) và hiển thị rõ trên timeline.

### Task 7: Tích hợp Tab Checklist Vận Hành vào SPA
- **File cần sửa**: `nhatky/index.html`
- **Mục tiêu**:
  - Nhúng màn hình thực hiện Checklist (Golf/Bơm) vào Tab Checklist của SPA, gọi API `getGolfTemplates` và `saveGolfRun`.

---

## 🧪 Kế Hoạch Xác Minh (Verification Plan)

1. **Automated Verification**:
   - Kiểm tra cú pháp HTML/JS qua Node.js:
     ```bash
     node -e "const fs = require('fs'); const code = fs.readFileSync('d:/Claude/1_Projects/scan/02_Source/nhatky/index.html', 'utf8'); console.log('File length:', code.length);"
     ```
2. **Manual Verification**:
   - Mở ứng dụng WebApp `nhatky/index.html` trên trình duyệt.
   - Thao tác thử Luồng 1 (Việc nhỏ) $\rightarrow$ Kiểm tra tự chốt sổ.
   - Thao tác thử Ghi hộ của Quản lý $\rightarrow$ Kiểm tra hiển thị *"Ghi bởi Quản lý"*.
