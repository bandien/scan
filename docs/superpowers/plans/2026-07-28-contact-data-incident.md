# Kế hoạch xử lý sự cố dữ liệu danh bạ

1. Viết kiểm tra RED cho `.gitignore`, file công khai và hợp đồng `getStaff`.
2. Thêm ignore rule, xóa file khỏi tip hiện tại và deploy để URL trả 404.
3. Sửa `getStaff` yêu cầu session, suy quyền server-side, chỉ trả field allowlist.
4. Sửa frontend truyền authToken và chạy kiểm thử.
5. Ghi refs, mirror clone, xóa CSV/JSON khỏi toàn bộ lịch sử.
6. Force-push branch/tag, xóa clone tạm, xác minh GitHub và Pages không còn file.

