# Thiết kế khôi phục cụm Tài khoản frontend Nhật ký

## Phạm vi

Khôi phục năm luồng frontend:

1. Đăng nhập full-screen bằng Username + PIN.
2. Quên PIN theo hướng an toàn: tra cứu danh bạ và hướng dẫn liên hệ quản lý, không hiển thị/đặt lại PIN.
3. Người dùng tự đổi PIN bằng phiên `authToken`.
4. Admin/Manager quản lý tài khoản qua các action `listUsers`, `saveUser`, `deleteUser`.
5. Đăng xuất qua `BD_SSO.logout()` và xóa phiên Nhật ký.

Không sửa logic hoặc UI của Công việc, Kế hoạch, Checklist.

## Nguồn dữ liệu và API

- Đăng nhập: `nhatkyLogin`.
- Đổi PIN: `nhatkyChangePin`.
- Quản lý người dùng: `listUsers`, `saveUser`, `deleteUser`.
- Quên PIN: dùng `staffDirectory`/`getStaff`; chỉ hiển thị người quản lý hoặc số điện thoại hỗ trợ có trong danh bạ.
- Phiên frontend lưu tại `currentUser` với `username`, `name`, `fullName`, `role`, `teams`, `authToken`, `loginAt`.

## Quyết định thiết kế

- Dùng screen đăng nhập cố định trong SPA thay cho overlay tạo động.
- Gọi API qua `bdsApiPost`; không thêm endpoint backend.
- Không cho frontend đọc hoặc khôi phục PIN cũ.
- Manager chỉ thấy và thao tác phạm vi do backend trả về. Frontend không tự suy diễn quyền thay backend.
- Form quản lý dùng một modal danh sách và một form thêm/sửa. Đổi PIN của người khác chỉ thực hiện khi quản lý nhập PIN mới trong form.
- Logout gọi `BD_SSO.logout()` trước, sau đó xóa cache riêng `nk_*` và trở về màn đăng nhập.
- Các modal đóng bằng nút, click backdrop và phím Escape; có trạng thái loading/error rõ ràng.

## Trạng thái UI

- Login: idle → submitting → success/error.
- Forgot PIN: idle → searching → match/no-match.
- Change PIN: idle → submitting → success/error.
- Account management: loading → list/error; save/delete xong tải lại danh sách.

## Bảo mật

- Không render trường PIN hiện tại.
- Không lưu PIN vừa nhập vào localStorage.
- Mọi action nhạy cảm gửi `actorUsername` và `authToken`.
- Không cho xóa chính tài khoản đang đăng nhập ở UI; backend tiếp tục là lớp bảo vệ cuối.
- Thông báo quên PIN không tiết lộ PIN hoặc cho reset không xác thực.

## Kiểm thử chấp nhận

- Chưa đăng nhập chỉ thấy `#screenLogin`; đăng nhập đúng lưu đủ phiên và mở app.
- Đăng nhập sai hiện lỗi inline.
- Quên PIN tìm được cán bộ và thông tin liên hệ hỗ trợ, không lộ PIN.
- Đổi PIN validate xác nhận/mức dài và gửi đúng payload.
- User thường không thấy quản lý tài khoản; Manager/Admin thấy.
- Danh sách, lọc, thêm, sửa, xóa tài khoản gọi đúng action/payload.
- Logout gọi SSO, xóa phiên và quay về login.
- Toàn bộ test Nhật ký hiện hữu vẫn pass.
