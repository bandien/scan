# Thiết Kế: Bổ Sung Thông Tin Tổ & Label Vào Trang Cá Nhân Và Danh Bạ (nhatky/#profile, #contacts)

**Ngày**: 2026-08-11  
**Mục tiêu**: Hiển thị thông tin tài khoản liên quan **Tổ nào** tại màn hình Cá nhân (`nhatky/#profile`) và hiển thị **Label liên quan** cho từng nhân sự / bộ lọc theo Label tại màn hình Danh bạ (`nhatky/#contacts`).

---

## 1. Yêu Cầu Cụ Thể

1. **Trang Cá nhân (`nhatky/#profile`)**:
   - Hiển thị đầy đủ thông tin tài khoản đang đăng nhập, bao gồm:
     - **Tổ quản lý / Tổ công tác**: Lấy từ `user.teams`, `user.team`, `user.teamGroup` hoặc tra cứu thông tin tài khoản trong `staffDirectory`. Trường hợp `teams === '*'` hiển thị "Tất cả các tổ (*)", trường hợp có danh sách tổ hiển thị dạng badge nổi bật.
     - **Phòng ban / Bộ phận**: Lấy từ `user.dept` / `person.dept`.
     - **Label / Thẻ liên quan**: Lấy từ `user.labels` / `person.labels` (ví dụ: Sân Golf, Trạm bơm, Vận hành...).
     - **Tên đăng nhập & Vai trò & SĐT**: `@username`, `role` (Admin/Manager/User), `phone`.

2. **Trang Danh bạ (`nhatky/#contacts`)**:
   - Hiển thị badge **Label (Thẻ phân loại)** trên mỗi thẻ nhân sự (`.nk-contact-card`).
   - Cập nhật ô tìm kiếm (`contactSearch`) để có thể tìm theo **Label** (ví dụ gõ "Sân Golf", "Nước", "Tổ điện"...).
   - Thêm thanh lọc nhanh theo **Label Chips** (tương tự subtab filter) bên dưới thanh tìm kiếm danh bạ để người dùng bấm chọn lọc theo từng Label nhanh chóng.

---

## 2. Giải Pháp Kỹ Thuật

### A. Trang Cá Nhân (`renderProfileScreen`)
- Đọc `user` từ `BD_SSO.getUser()`.
- Tìm thông tin bổ trợ `person` từ `staffDirectory.find(p => p.username === user.username || p.fullName === user.name)`.
- Kết hợp dữ liệu từ `user` và `person`:
  - `teamsStr`: `user.teams || user.team || user.teamGroup || person?.teams || person?.team || ''`
  - `deptStr`: `user.dept || person?.dept || ''`
  - `labelsStr`: `user.labels || person?.labels || ''`
  - `phoneStr`: `user.phone || person?.phone || ''`
- Tạo card thông tin tài khoản `.nk-profile__info-card` nằm trong mục **TÀI KHOẢN**:
  - Dòng hiển thị Tổ: `<div class="nk-profile__info-item"><strong>Tổ quản lý:</strong> ...</div>`
  - Dòng hiển thị Label liên quan (nếu có): `<div class="nk-profile__info-item"><strong>Label liên quan:</strong> ...</div>`
  - Dòng hiển thị Phòng ban, SĐT.

### B. Trang Danh Bạ (`renderContactsScreen`)
- Thu thập danh sách tất cả các Label duy nhất từ `staffDirectory`.
- Render thanh chọn Label Chips (`.nk-contact-labels-bar`) bên dưới ô tìm kiếm.
- Cập nhật logic filter trong `renderContactsScreen()`:
  - Kiểm tra `contactSearchQuery` trên `name`, `dept`, `phone`, `labels`, `teams`.
  - Kiểm tra `selectedContactLabel` nếu người dùng chọn chip lọc Label.
- Trên mỗi `.nk-contact-card`:
  - Render danh sách thẻ `<span class="nk-contact-badge">🏷️ LabelName</span>` bên dưới tên hoặc phần thông tin phụ.

---

## 3. Kế Hoạch Kiểm Thử (TDD & E2E)
- Viết test Playwright trong `tests/nhatky-account.spec.js` hoặc `tests/nhatky.spec.js`:
  1. Test hiển thị thông tin Tổ và Label tài khoản trong `#profile`.
  2. Test hiển thị Label trên thẻ danh bạ và lọc danh bạ theo Label/tìm kiếm trong `#contacts`.
