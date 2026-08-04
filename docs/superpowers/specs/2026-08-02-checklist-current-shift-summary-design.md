# Thiết kế Checklist: bàn giao ca trước, làm ngay ca hiện tại

## Vấn đề

Màn Checklist hiện hiển thị hai thẻ “Ca liền trước” và “Ca liền sau”. Nhân viên phải tự suy luận thẻ nào là ca đang trực, chưa thấy kết quả bàn giao trước khi bắt đầu, và phải thêm một bước chọn mới vào được checklist cần làm.

## Quyết định

Tab Checklist được tổ chức theo đúng thứ tự thao tác ngoài hiện trường:

1. **Ca hiện tại** là khối chính, luôn ở đầu màn hình và có hai hành động một chạm: “Làm checklist Golf” và “Check Bơm”.
2. **Bàn giao ca trước** là khối tóm tắt ngay bên dưới, gồm trạng thái đã/chưa chốt, số mục không đạt, người chốt, giờ chốt và ghi chú bàn giao nếu có.
3. “Quản lý mẫu” là thao tác quản trị phụ, giảm độ nổi bật và không chen giữa luồng làm việc của nhân viên.
4. Nếu backend chậm hoặc offline, màn hình vẫn hiện ngay nút mở ca hiện tại; module Golf tiếp tục áp dụng quy tắc xác nhận bàn giao trước khi bắt đầu, không bypass vòng đời ca.

## Quy tắc ca

- 05:00–12:59: hiện tại là Ca Sáng hôm nay; trước là Ca Tối hôm qua.
- 13:00–23:59: hiện tại là Ca Tối hôm nay; trước là Ca Sáng hôm nay.
- 00:00–04:59: hiện tại vẫn là Ca Tối của ngày nghiệp vụ hôm trước; trước là Ca Sáng của ngày đó.

## Dữ liệu tóm tắt

Frontend gọi `getGolfRuns` cho ngày nghiệp vụ của ca trước. Run được khớp bằng `templateId` và `date`. Các giá trị item có `status === "ng"` được tính là mục cần chú ý.

Nếu không tìm thấy run:

- Đang tải: “Đang lấy bàn giao ca trước…”
- Tải xong nhưng không có: “Chưa có bàn giao từ ca trước”
- Offline/lỗi: “Chưa tải được bàn giao — vẫn có thể mở checklist hiện tại; hệ thống kiểm tra bàn giao ở bước tiếp theo”

## Tiêu chí chấp nhận

1. Vào tab Checklist thấy “Ca hiện tại” trước “Bàn giao ca trước”.
2. Không còn thẻ “Ca liền sau”.
3. Hai nút Golf/Bơm của ca hiện tại mang đúng `templateId` và ngày nghiệp vụ.
4. Tóm tắt ca trước hiển thị đúng số mục không đạt và ghi chú bàn giao.
5. Không có dữ liệu hoặc mất mạng không chặn thao tác làm checklist hiện tại.
6. Giao diện vừa màn hình mobile 390 px, nút chính có vùng chạm tối thiểu 44 px.
