# Implementation Plan: Nâng Cấp Giao Diện WebApp `nhatky/index.html` Đơn Trang (SPA) & Tích Hợp Chi Tiết

- **Ngày lập:** 2026-07-24
- **Dựa trên bản phân tích thiết kế:** [docs/superpowers/specs/2026-07-24-nhatky-spa-design-analysis.md](file:///d:/Claude/1_Projects/scan/02_Source/docs/superpowers/specs/2026-07-24-nhatky-spa-design-analysis.md)
- **Phương pháp luận:** Superpowers SDLC (`writing-plans` & `test-driven-development`)

---

## 📋 Các Bước Thực Thi (Sub-Tasks Detailed)

### Task 1: Phân Tích & Nâng Cấp Backend Tự Động Sinh Task Từ Checklist (`19_GolfChecklist.gs`)
- **Mục tiêu**: Khi KTV chốt ca checklist phát hiện mục `fail` hoặc số đo vi phạm ngưỡng, backend tự động gọi `handleSavePlan` sinh Task sự cố `[SỰ CỐ CHECKLIST]` mức `Khẩn cấp`.
- **Đường dẫn file**: `d:/Claude/1_Projects/scan/02_Source/19_GolfChecklist.gs`
- **Lệnh Verification**:
  ```bash
  node -e "const fs = require('fs'); const code = fs.readFileSync('d:/Claude/1_Projects/scan/02_Source/19_GolfChecklist.gs', 'utf8'); console.log('Contains auto task creation:', code.includes('handleSavePlan'));"
  ```

### Task 2: Xây Dựng Khung SPA & Thiết Kế Zalo Mobile Chat List (`nhatky/index.html`)
- **Mục tiêu**: Thiết lập cấu trúc SPA 4 Tab, nhúng `BDSAppHeader` với Nút `+` ở góc trên bên phải Header, render danh sách Card công việc theo style Zalo Chat List.
- **Đường dẫn file**: `d:/Claude/1_Projects/scan/02_Source/nhatky/index.html`
- **Lệnh Verification**:
  ```bash
  node -e "const fs = require('fs'); const content = fs.readFileSync('d:/Claude/1_Projects/scan/02_Source/nhatky/index.html', 'utf8'); console.log('File size:', content.length, 'Header button OK:', content.includes('header-right-plus-btn'));"
  ```

### Task 3: Triển Khai Modal 1-Touch Cho Luồng Việc Nhỏ
- **Mục tiêu**: Tạo Form Ghi Nhanh Việc Nhỏ: Nhập Tên việc, Vị trí, Ảnh chụp kết quả $\rightarrow$ Bấm "Lưu & Hoàn Thành" tự động chốt sổ.
- **Đường dẫn file**: `d:/Claude/1_Projects/scan/02_Source/nhatky/index.html`

### Task 4: Triển Khai Logic Ghi Hộ Của Quản Lý & Phân Định Audit Trail
- **Mục tiêu**: Thêm công tắc bật "Tổ trưởng / Quản lý ghi hộ cho nhân viên", lưu biệt lập `Employee` (KTV) và `RecordedBy` (Tổ trưởng).
- **Đường dẫn file**: `d:/Claude/1_Projects/scan/02_Source/nhatky/index.html`

### Task 5: Triển Khai Luồng Việc Phức Tạp Nhiều Giai Đoạn (Multi-Phase)
- **Mục tiêu**: Màn hình Chi tiết hỗ trợ hiển thị danh sách `Phases` và `Steps`, áp dụng quy tắc Crowd-Completion (đủ người mới `done`).
- **Đường dẫn file**: `d:/Claude/1_Projects/scan/02_Source/nhatky/index.html`

---

## 🧪 Kế Hoạch Xác Minh (Verification Plan)

1. **Automated Check**:
   ```bash
   node -e "const fs = require('fs'); console.log('Index HTML size:', fs.readFileSync('d:/Claude/1_Projects/scan/02_Source/nhatky/index.html', 'utf8').length);"
   ```
2. **Manual UI Check**:
   Mở file `nhatky/index.html` trên trình duyệt để kiểm tra 4 Tab navigation, Nút `+` góc phải header và chức năng Ghi hộ của Quản lý.
