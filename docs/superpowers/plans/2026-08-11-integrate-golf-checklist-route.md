# Kế Hoạch Triển Khai Tích Hợp Toàn Diện Golf Checklist Vào `nhatky/#checklist/golf`

Hợp nhất hoàn toàn giao diện và đường dẫn thực hiện Checklist Sân Golf về màn hình ứng dụng Nhật Ký (`nhatky/index.html#checklist/golf`). Loại bỏ hoàn toàn đường dẫn tách biệt `sangolf/index.html` khỏi góc nhìn người dùng.

---

## Giải Pháp Kỹ Thuật

### 1. `sangolf/index.html` - Auto Redirect
- Nếu trang `sangolf/index.html` được mở trực tiếp từ trình duyệt mà không chứa `embed=1`, hệ thống sẽ lập tức đổi vị trí trình duyệt (via `location.replace`) về:
  `../nhatky/index.html#checklist/golf` + query parameters hiện tại.

### 2. `nhatky/index.html` - App Shell Screen `#screenGolfChecklist`
- Thêm phần tử màn hình nhúng `#screenGolfChecklist` chứa Appbar chuẩn (`‹ Quay lại Nhật ký`) và container/iframe tải `sangolf/index.html?embed=1&...`.
- Cập nhật `showScreen()` và `handleRoute()`:
  - Khi hash bắt đầu với `#checklist/golf`, mở màn hình `screenGolfChecklist` và đồng bộ query parameters sang `sangolf/index.html?embed=1...`.
  - Nút Quay lại (`‹`) trên Appbar chuyển vị trí về `#checklist`.

---

## Các File Cần Thay Đổi

1. **`sangolf/index.html`**:
   - Thêm đoạn script kiểm tra `embed=1` ở đầu trang và redirect về `../nhatky/index.html#checklist/golf...`.

2. **`nhatky/index.html`**:
   - Khai báo `#screenGolfChecklist` trong HTML.
   - Cập nhật `showScreen()` hỗ trợ `golfChecklist`.
   - Cập nhật `handleRoute()` kích hoạt `showScreen('golfChecklist')` khi `hash.startsWith('#checklist/golf')`.

3. **`tests/nhatky.spec.js`**:
   - Thêm kiểm thử E2E Playwright đảm bảo khi vào `nhatky/#checklist/golf?autoTemplate=...`, màn hình `#screenGolfChecklist` hiển thị đúng và iframe nạp form làm checklist.
