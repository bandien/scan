# Kế Hoạch Thi Công: Cập Nhật Hash Route #checklist & Luồng Thực Hiện Checklist

Ngày: 2026-08-11  
Spec liên quan: `docs/superpowers/specs/2026-08-11-checklist-workflow-update-design.md`

---

## Các Nhiệm Vụ Chi Tiết

### Task 1: Viết test TDD cho Hash Route `#checklist` trong `tests/nhatky.spec.js`
- **Mục tiêu**: Đảm bảo có test FAILED trước khi sửa mã nguồn (RED phase).
- **File sửa**: [nhatky.spec.js](file:///d:/Claude/1_Projects/scan/02_Source/tests/nhatky.spec.js)
- **Nội dung**:
  - Viết test case: Khi mở trang `/nhatky/index.html#checklist`, subtab `#subtabChecklist` phải có class `is-active`, và khối `.nk-checklist-shortcuts` phải xuất hiện.
  - Viết test case: Khi nhấp vào nút subtab `✅ Checklist`, `window.location.hash` phải cập nhật thành `#checklist`.
- **Verification Command**: `npx playwright test tests/nhatky.spec.js`

### Task 2: Cập nhật Hash Routing trong `nhatky/index.html` (GREEN phase)
- **Mục tiêu**: Xử lý hash route `#checklist` và đồng bộ giao diện subtabs.
- **File sửa**: [index.html](file:///d:/Claude/1_Projects/scan/02_Source/nhatky/index.html)
- **Nội dung**:
  - Sửa `handleRoute()`: Thêm kiểm tra `hash === '#checklist'` hoặc `hash === '#plan'`. Gán `filterTab` tương ứng, cập nhật class `is-active` cho các nút subtab, sau đó gọi `showScreen('main')` và `renderMainBoard()`.
  - Sửa `subtabBar` listener: Đồng bộ `window.location.hash` khi chọn subtab (`#checklist`, `#plan`, hoặc xóa hash).
- **Verification Command**: `npx playwright test tests/nhatky.spec.js`

### Task 3: Chạy Toàn Bộ Test Suite Kiểm Thử Điểm Cuối (Verification)
- **Mục tiêu**: Đảm bảo không vỡ bất kỳ tính năng hiện tại nào.
- **Verification Command**: `npx playwright test`
