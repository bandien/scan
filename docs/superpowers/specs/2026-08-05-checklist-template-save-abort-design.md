# Thiết kế sửa lỗi lưu định nghĩa mẫu bị abort

## Nguyên nhân

Màn quản lý mẫu gửi `{ def: {...} }`, trong khi handler GAS đọc payload phẳng. Đồng thời thao tác dùng timeout POST mặc định 15 giây, ngắn hơn thời gian cold start có thể gặp trên mạng di động, nên giao diện báo `Fetch is aborted` dù người dùng chỉ đang sửa mẫu.

## Thay đổi

- Frontend gửi định nghĩa mẫu ở payload phẳng đúng hợp đồng backend.
- Riêng thao tác lưu mẫu dùng timeout 60 giây và không tự retry POST để tránh nhân bản hạng mục hai lần.
- Backend vẫn chấp nhận cả payload phẳng và `{ def }` để tương thích với client đã cache.
- Khi timeout, thông báo hướng dẫn thử lại rõ ràng thay cho lỗi kỹ thuật `Fetch is aborted`.

## Tiêu chí chấp nhận

1. Sửa mẫu gửi đủ `templateId`, tên, địa điểm, ca và khung giờ.
2. Backend nhận được cả payload mới và payload lồng cũ.
3. Request lưu không bị hủy ở mốc timeout mặc định 15 giây.
4. Nút lưu khóa trong lúc xử lý và modal đóng khi thành công.
5. Kiểm thử chạy trên mobile và desktop.
