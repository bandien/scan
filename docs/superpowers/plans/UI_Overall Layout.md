mô tả chi tiết về giao diện (UI) Giao diện này mang phong cách điển hình của một ứng dụng nhắn tin (tương tự Zalo).

1. Tổng quan (Overall Layout)
Loại ứng dụng: Web App (Ứng dụng di động nhắn tin/trò chuyện).

Cấu trúc màn hình: Gồm 4 phần chính từ trên xuống dưới: Header (Thanh tìm kiếm), Sub-header (Tab phân loại tin nhắn), Body (Danh sách cuộc trò chuyện), và Bottom Navigation Bar (Thanh điều hướng dưới cùng).

Màu sắc chủ đạo: Xanh dương (tương tự #0084FF), Trắng (Background), Đen (Text chính), Xám (Text phụ/Icon không hoạt động), và Đỏ (Thông báo/Badge).

2. Header (Thanh tìm kiếm & Công cụ)
Background: Màu xanh dương đồng nhất.

Search Bar (Bên trái):

Icon kính lúp màu trắng.

Placeholder text "Search" màu trắng, font chữ thường.

Action Icons (Bên phải):

Icon quét mã QR màu trắng.

Icon dấu cộng (+) màu trắng (dành cho menu mở rộng/tạo mới).

3. Sub-header (Tab phân loại)
Background: Màu trắng.

Cấu trúc: Chứa 3 tab chính nằm sát lề trái.

Tab "Việc cần làm" (Đang chọn): Text màu đen, in đậm. Có một đường viền ngang (border-bottom) màu đen bên dưới text.

Tab "Checklist" (Không chọn): Text màu xám nhạt, in thường.

Tab "Kế hoạch" (Không chọn): Text màu xám nhạt, in thường.

Divider: Dưới cùng của khu vực này có một đường kẻ ngang (border-bottom) rất mờ, màu xám nhạt để ngăn cách với danh sách tin nhắn.

4. Body (Danh sách cuộc trò chuyện - ListView)
Cấu trúc: Là một danh sách cuộn dọc. Mỗi phần tử (List Item) trong danh sách có chiều cao bằng nhau, được ngăn cách bởi một đường kẻ xám nhạt.

Chi tiết một List Item:

Avatar (Bên trái): Khung hình vuông bo góc, thể hiện ảnh cuối cùng đính kèm của công việc. Nếu không có hình thì hiện ảnh đại diện của người giao việc.

Khung nội dung (Ở giữa):

Title (Tên công việc): Nằm ở hàng trên, text màu đen, font size lớn, in thường. Nếu tên quá dài sẽ tràn tiếp xuống hàng dưới.

Subtitle (Thông tin người thực hiện): Nằm ở hàng dưới, text màu xám nhạt, font size nhỏ hơn. Hiển thị dạng "Tên người gửi: Nội dung" hoặc "[Loại hành động]" (ví dụ: [Outgoing audio call], [File]). Nếu nội dung quá dài bị cắt bằng dấu ba chấm (...).

Khung trạng thái (Bên phải):

Thời gian: Nằm ở hàng trên cùng bên phải, căn lề phải. Text màu xám nhạt, font size nhỏ (ví dụ: "1 hour", "1 second").

Icon Trạng thái: Nằm ở hàng dưới cùng bên phải, căn lề phải. Hiện trạng thái: Mới, Chờ tiếp nhận, Đã tiếp nhận, Đang làm, Chờ duyệt, Chờ bàn giao, Cần chỉnh sửa, Tạm dừng, Đã xong. 

5. Bottom Navigation Bar (Thanh điều hướng dưới)
Background: Màu trắng, có đường viền mờ màu xám ở viền trên.

Cấu trúc: Gồm 4 tab chia đều khoảng cách. Mỗi tab bao gồm 1 Icon (trên) và Text label (dưới).

Chi tiết các Tab:

Công việc (Đang chọn): Icon khung chat màu xanh dương. Có badge màu đỏ ghi chữ "5+" đè lên góc trên bên phải icon. Text label "Công việc" màu xanh dương.

Contacts: Icon hình người (outline) màu xám. Text "Contacts" màu xám.

Discovery: Icon 4 ô vuông (outline) màu xám. Có một chấm đỏ nhỏ ở góc trên bên phải icon. Text "Discovery" màu xám.

Me: Icon hình người outline đơn giản màu xám. Text "Me" màu xám.