# Thiết kế khôi phục PWA, offline queue và trạng thái đồng bộ

## Phạm vi

Khôi phục khả năng cài đặt trang Nhật ký như PWA, mở lại giao diện khi mất mạng,
và lưu tạm các thay đổi `savePlan` để tự gửi khi có mạng. Không thay đổi logic
Công việc, Kế hoạch, Checklist.

## Quyết định

- Service worker đặt ở root để kiểm soát đúng scope GitHub Pages `/scan/`.
- Chỉ cache tài nguyên GET cùng origin; không cache API Google Apps Script.
- Queue dùng localStorage, độc lập với cache dữ liệu hiện có.
- Chỉ allowlist `savePlan`. Đăng nhập, PIN, nhân sự, logout và upload ảnh không
  được queue hoặc phát lại.
- Các lần lưu cùng một `PlanID` được gộp theo last-write-wins.
- Khi offline hoặc lỗi mạng, lời gọi lưu trả về thành công có cờ `queued` để UI
  hiện tại giữ optimistic state. Lỗi nghiệp vụ từ backend không được queue.
- Queue tự flush tuần tự khi trình duyệt online; item chỉ bị xóa sau phản hồi
  thành công.
- Badge dùng ba trạng thái: `Chờ gửi · N`, `Đang gửi · N`, `Đã đồng bộ`.

## Tương thích

Hạ tầng bọc cả `bdsApiPost('savePlan', ...)` và các lời gọi GET legacy
`bdsApiFetch('savePlan', ...)` mà không cần sửa từng module nghiệp vụ.

