# Kế hoạch sửa lỗi lưu mẫu bị abort

1. RED: thêm test backend cho payload `{ def }`.
2. RED: thêm E2E sửa mẫu, yêu cầu payload phẳng và timeout riêng cho thao tác.
3. GREEN: chuẩn hóa payload frontend, timeout 60 giây, không retry POST.
4. GREEN: mở rộng handler backend nhận payload cũ.
5. REFACTOR: đổi thông báo timeout thành nội dung dễ hiểu.
6. Verify: Node test, Playwright desktop/mobile, `git diff --check` và kiểm tra trình duyệt.
