# Kế hoạch khôi phục cụm Tài khoản frontend Nhật ký

## Task 1 — Test đăng nhập full-screen

- File: `tests/nhatky-account.spec.js`
- Viết test cho screen cố định, submit trống, login lỗi và login thành công.
- RED: `npx playwright test tests/nhatky-account.spec.js --project=chromium --reporter=line`

## Task 2 — Implement đăng nhập và session

- File: `nhatky/index.html`, `css/app.css`
- Thêm `#screenLogin`, `initLoginForm`, `showLoginScreen`, chuẩn hóa response `nhatkyLogin`.
- Verify: chạy lại test Task 1.

## Task 3 — Test và implement Quên PIN

- File: `tests/nhatky-account.spec.js`, `nhatky/index.html`, `css/app.css`
- Test lookup theo username/tên/SĐT và xác nhận không render PIN.
- Dùng danh bạ hiện có, ưu tiên liên hệ Manager/Admin cùng tổ.
- Verify: chạy test file account.

## Task 4 — Test và implement Đổi PIN

- File: `tests/nhatky-account.spec.js`, `nhatky/index.html`
- Test validation và payload `nhatkyChangePin`.
- Thêm modal đổi PIN từ màn Cá nhân.
- Verify: chạy test file account.

## Task 5 — Test và implement Quản lý tài khoản

- File: `tests/nhatky-account.spec.js`, `nhatky/index.html`, `css/app.css`
- Test gate role, load/filter list, save và delete.
- Thêm modal danh sách + form chỉnh sửa; dùng API backend hiện có.
- Verify: chạy test file account.

## Task 6 — Test và implement logout SSO

- File: `tests/nhatky-account.spec.js`, `nhatky/index.html`
- Test `BD_SSO.logout()` được gọi, cache riêng bị xóa và login screen xuất hiện.
- Verify: chạy test file account.

## Task 7 — Regression và review

- Syntax: parse toàn bộ inline script bằng `vm.Script`.
- Account: `npx playwright test tests/nhatky-account.spec.js --reporter=line`.
- Full Nhật ký: `npx playwright test tests/nhatky.spec.js tests/nhatky-account.spec.js --reporter=line`.
- Kiểm tra `git diff --check` và đảm bảo không đổi logic ba module ngoài điểm gắn nút điều hướng Tài khoản.
