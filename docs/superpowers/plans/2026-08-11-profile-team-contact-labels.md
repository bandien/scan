# Kế Hoạch Thực Thi: Bổ Sung Thông Tin Tổ & Label Vào Trang Cá Nhân Và Danh Bạ

**Thiết kế**: `docs/superpowers/specs/2026-08-11-profile-team-contact-labels-design.md`

## Kế hoạch các bước thực hiện (TDD)

### Task 1: Viết automated tests (RED) cho Profile Team & Contact Labels
- Path: `tests/nhatky-account.spec.js` và `tests/nhatky.spec.js`
- Test 1: Kiểm tra `#profile` render thông tin Tổ (`teams`/`team`), Phòng ban (`dept`), Label (`labels`) và Username (`@username`).
- Test 2: Kiểm tra `#contacts` render badge Label (`.nk-contact-badge`) trên thẻ nhân sự và thanh chip lọc Label (`.nk-contact-chip`).

### Task 2: Cập nhật CSS styling (`css/app.css`)
- Path: `css/app.css`
- Bổ sung styles cho `.nk-profile__info-card`, `.nk-profile__info-row`, `.nk-profile__badge`, `.nk-contact-labels-bar`, `.nk-contact-chip`, `.nk-contact-badge`.

### Task 3: Cập nhật logic Javascript (`nhatky/index.html`)
- Path: `nhatky/index.html`
- Cập nhật `renderProfileScreen()` hiển thị thẻ thông tin tài khoản với Tổ & Label.
- Cập nhật `renderContactsScreen()` hiển thị Label badge & chip lọc Label.

### Task 4: Chạy kiểm thử (GREEN) & Verification
- Run `npx playwright test` và xác minh toàn bộ test PASSED.
