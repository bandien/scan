# Thiết kế chức năng quên mã PIN

## Mục tiêu

Cho phép nhân viên đang ở màn hình đăng nhập biết cách khôi phục PIN mà không làm lộ PIN hiện tại hoặc cho phép người chưa xác thực tự đặt lại tài khoản.

## Luồng sử dụng

1. Nhân viên chọn tài khoản và bấm `Quên mã PIN?`.
2. Hộp thoại hiển thị đúng họ tên/mã nhân viên đang chọn.
3. Hệ thống giải thích PIN hiện tại không được hiển thị và yêu cầu xác minh với Quản trị viên.
4. Nhân viên có thể gọi hotline Ban Điện `0392966368` bằng liên kết `tel:`.
5. Sau khi Quản trị viên dùng chức năng Reset PIN hiện có, nhân viên đăng nhập và đổi PIN cá nhân.

## Bảo mật và khả năng truy cập

- Không hiển thị PIN hiện tại hoặc PIN mặc định trong luồng quên PIN.
- Không cho người chưa đăng nhập tự đặt lại PIN.
- Modal có ngữ nghĩa `dialog`, tiêu đề truy cập được, nút đóng có nhãn và trả focus về ô PIN.
