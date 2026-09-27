# Bảng thông số hẹn giờ

Dashboard có bảng Thiết bị/khu vực, Chế độ, Giờ bật, Giờ tắt, Ngày áp dụng, Người cập nhật, Ghi chú. Nhân viên đã đăng nhập được thêm/sửa; tác giả lấy từ phiên đăng nhập. Chế độ: Tự động, Bật thủ công, Tắt thủ công. Ngày áp dụng là một ngày cụ thể; giờ tắt nhỏ hơn giờ bật là ngày kế tiếp. Đây là sổ thông số, không kết nối điều khiển thiết bị.

Lưu localStorage theo kiến trúc hiện tại, hiển thị rõ giới hạn lưu trên trình duyệt. Không có dữ liệu mẫu giả. Xử lý lỗi lưu, dữ liệu hỏng; render text an toàn. Phạm vi lần này là thêm/sửa và lưu trên trình duyệt, chưa đồng bộ hoặc xuất/nhập dữ liệu hẹn giờ.

## Dữ liệu công cộng từ Google Sheets

Theo yêu cầu tiếp theo, nhập bản chụp tab `DS hẹn giờ công cộng` (gid 745357933), vùng A6:L341, vào chính nhatky/index.html. Ngày cập nhật ghi tại nguồn là 27/09/2026. Giữ các nhóm khu vực, thứ/ngày, cột tiết giảm, hè, đông, các ô gộp và hướng dẫn vận hành. Chuẩn hóa số serial thời gian về HH:mm, giữ giây nếu có; không nhầm số lượng 225/254 thành giờ. Không biến ngày cập nhật bảng thành ngày áp dụng hoặc tự gán người cập nhật.

Bảng nguồn chỉ để tra cứu, không tự đồng bộ và không ghi đè bảng thông số người dùng đã lưu. Đặt trong vùng cuộn có nhãn, giữ tiêu đề, cho biết ô trống là nguồn chưa ghi. Không đưa các tab khác trong workbook vào file hoặc Git. Giữ số thứ tự gốc dù nguồn có trùng số.

## Danh sách văn phòng

Nhập tiếp tab 6.DS giờ đóng ngắt điện văn phòng, gid 1507714426, vùng A6:P203 và V6:W203. Giữ 197 dòng có nội dung, các trường hợp đặc biệt, ghi chú, số lượng pin; bỏ các cột checkbox kiểm tra tuần Q:U vì không phải thông số hẹn giờ. Tách thứ 2–6, thứ 7, chủ nhật và chiếu sáng/điều hòa. Không tự suy ra ô trống là tắt; giữ 24:00 và ngày trong ghi chú. Không gán ngày cập nhật chung khi nguồn không nêu. Dùng chung bộ dựng bảng có tham số cột; giữ riêng dữ liệu công cộng và dữ liệu văn phòng.
