# Bảng thông số hẹn giờ

Dashboard có bảng Thiết bị/khu vực, Chế độ, Giờ bật, Giờ tắt, Ngày áp dụng, Người cập nhật, Ghi chú. Nhân viên đã đăng nhập được thêm/sửa; tác giả lấy từ phiên đăng nhập. Chế độ: Tự động, Bật thủ công, Tắt thủ công. Ngày áp dụng là một ngày cụ thể; giờ tắt nhỏ hơn giờ bật là ngày kế tiếp. Đây là sổ thông số, không kết nối điều khiển thiết bị.

Lưu localStorage theo kiến trúc hiện tại, hiển thị rõ giới hạn lưu trên trình duyệt. Không có dữ liệu mẫu giả. Xử lý lỗi lưu, dữ liệu hỏng; render text an toàn. Phạm vi lần này là thêm/sửa và lưu trên trình duyệt, chưa đồng bộ hoặc xuất/nhập dữ liệu hẹn giờ.
