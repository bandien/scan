# Thiết kế khôi phục vòng đời Checklist khi mở trực tiếp

## Vấn đề

Từ `nhatky/index.html`, tab Checklist hiển thị các lối tắt sang `sangolf/index.html`.
Trang sân golf hiện chỉ render sau khi tải mẫu từ Apps Script. Với `file://`, mạng lỗi,
hoặc lần mở đầu chưa có cache, `templates` rỗng và `autoTemplate` mở một run không có
hạng mục. Người dùng thấy thao tác không phản hồi.

## Thiết kế

- Đóng gói một bản mẫu dự phòng ở frontend cho bốn loại checklist.
- Ưu tiên cache và dữ liệu backend; dữ liệu backend hợp lệ luôn thay thế bản dự phòng.
- Luồng `autoTemplate` phải dựng được run ngay cả khi API mẫu hoặc API run thất bại.
- Draft vẫn được lưu local-first. Chốt ca/bàn giao vẫn dùng API để không tạo trạng thái
  giả; khi mất mạng phải giữ draft và báo lỗi rõ ràng.
- Không thay đổi module Công việc, Kế hoạch hoặc checklist do Antigravity phát triển
  ngoài đường dẫn tích hợp Nhật ký → Checklist sân golf.

## Tiêu chí chấp nhận

1. Mở Nhật ký bằng `file://`, bấm Checklist và Golf Sáng sẽ mở run Ca Sáng có hạng mục.
2. Có thể nhập dữ liệu, lưu draft, mở lại và thấy dữ liệu còn nguyên.
3. Khi API sẵn sàng: chốt ca chuyển `submitted`; người ca sau xác nhận chuyển `confirmed`.
4. Khi API lỗi: không mất draft và không hiển thị trạng thái chốt thành công giả.

