# Kế Hoạch Triển Khai: Tích Hợp Hash Route `#checklist/golf` Cho Sân Golf

Hợp nhất luồng quản lý & thực hiện Checklist Sân Golf từ đường dẫn cũ `sangolf/index.html` về đường dẫn chuẩn của Nhật Ký `nhatky/index.html#checklist/golf`.

---

## Các File Cần Thay Đổi

### 1. `js/checklist-shifts.js`
- **Nhiệm vụ**: Cập nhật hàm `golfUrl(shift)` tạo ra URL định dạng `#checklist/golf` thay vì trỏ trực tiếp sang `../sangolf/index.html`.
- **Mã đại diện**:
  ```javascript
  golfUrl: function (shift) {
    return '../nhatky/index.html#checklist/golf?autoTemplate=' + encodeURIComponent(shift.templateId) + '&date=' + encodeURIComponent(shift.date);
  }
  ```

### 2. `nhatky/index.html`
- **Nhiệm vụ**:
  - Cập nhật `handleRoute()` để hỗ trợ nhận diện hash prefix `#checklist/golf`.
  - Khi hash bắt đầu với `#checklist/golf`, kích hoạt tab `subtabChecklist` và tự động hiển thị màn hình / mở form làm checklist hoặc nhúng mượt giao diện Golf.
  - Xử lý quay lại `#checklist` khi bấm nút Back.

### 3. `sangolf/index.html`
- **Nhiệm vụ**:
  - Tự động điều hướng sang `../nhatky/index.html#checklist/golf...` nếu truy cập trực tiếp link cũ, đảm bảo backward compatibility.
  - Cập nhật `backHome()` để ưu tiên quay về `../nhatky/index.html#checklist/golf` hoặc `../nhatky/index.html#checklist`.

### 4. `tests/checklist-shifts.test.js` & `tests/nhatky.spec.js`
- **Nhiệm vụ**:
  - Cập nhật unit test `tests/checklist-shifts.test.js` khớp định dạng `golfUrl`.
  - Thêm E2E test Playwright cho hash route `#checklist/golf` trong `tests/nhatky.spec.js`.

---

## Các Bước Thực Thi (TDD & Verification)

### Task 1: Cập nhật helper `golfUrl` & Unit Test
1. **RED**: Cập nhật test assertion trong `tests/checklist-shifts.test.js` mong muốn `../nhatky/index.html#checklist/golf?autoTemplate=...`.
2. **GREEN**: Sửa `golfUrl` trong `js/checklist-shifts.js`.
3. **VERIFY**: Chạy `node --test tests/checklist-shifts.test.js`.

### Task 2: Cập nhật Router trong `nhatky/index.html`
1. **RED**: Thêm E2E test trong `tests/nhatky.spec.js` kiểm tra khi vào `nhatky/index.html#checklist/golf?autoTemplate=ca_toi&date=2026-08-11`.
2. **GREEN**: Thêm logic xử lý hash `#checklist/golf` trong `handleRoute()`.
3. **VERIFY**: Chạy `npx playwright test tests/nhatky.spec.js`.

### Task 3: Chuyển hướng Backward Compatibility tại `sangolf/index.html`
1. Cập nhật script đầu trang `sangolf/index.html` để tự đổi URL sang `nhatky/index.html#checklist/golf...` nếu cần.
2. Kiểm tra lại luồng hoạt động trên cả 2 đường dẫn.

---

## Kế Hoạch Kiểm Thử (Verification Plan)

### Automated Tests:
- `node --test tests/checklist-shifts.test.js`
- `npx playwright test tests/nhatky.spec.js`

### Manual Verification:
- Truy cập `https://bandien.github.io/scan/nhatky/index.html#checklist` -> Bấm shortcut Golf -> URL thành `#checklist/golf?autoTemplate=...`.
- Mở link trực tiếp `https://bandien.github.io/scan/nhatky/index.html#checklist/golf?autoTemplate=ca_toi&date=2026-08-11` -> Mở mượt đúng tab Checklist & Shortcut ca tối.
