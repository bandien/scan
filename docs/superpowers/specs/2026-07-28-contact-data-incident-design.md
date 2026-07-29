# Thiết kế xử lý sự cố dữ liệu danh bạ

## Mục tiêu

Gỡ dữ liệu cá nhân khỏi GitHub Pages và toàn bộ lịch sử Git; ngăn tái commit;
thu nhỏ API danh bạ theo nguyên tắc tối thiểu và quyền của phiên đăng nhập.

## Phạm vi dữ liệu

Loại bỏ vĩnh viễn `danhba_chuan_hoa.csv` và
`danhba_chuan_hoa.json` khỏi mọi branch/tag. Không đưa nội dung hồ sơ vào log,
test fixture hoặc tài liệu.

## API danh bạ

- `getStaff` bắt buộc `authToken` hợp lệ.
- Danh tính, role và teams được suy ra từ session/backend, không tin tham số
  role/team do client gửi.
- User chỉ thấy lãnh đạo và người cùng team.
- Payload chỉ gồm `id`, `username`, `name`, `fullName`, `position`, `dept`,
  `phone`, `labels`; tuyệt đối không trả PIN, ngày sinh, địa chỉ, CCCD hoặc
  tài khoản ngân hàng.
- Frontend gửi authToken của phiên hiện tại.

## Khôi phục và phối hợp

Ghi SHA các refs trước rewrite vào tệp ngoài web root. Force-push bằng
`--force-with-lease` khi có thể; sau rewrite mọi clone cũ phải được xóa/reclone.

