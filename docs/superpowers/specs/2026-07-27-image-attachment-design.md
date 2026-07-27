# Design Spec: Đính kèm ảnh khi ghi nhật ký

## Yêu cầu
- Cho phép người dùng (nhân viên, kỹ thuật viên) chụp hoặc tải ảnh đính kèm khi "Ghi nhật ký công việc" / "Bàn giao".
- Hiện thumbnail xem trước ảnh.
- Gửi ảnh qua API và lưu vào Google Drive (Backend).
- Hiển thị ảnh trên giao diện Timeline / Nhật ký của công việc.

## Phương án tiếp cận
### 1. Frontend (nhatky/index.html & app.css)
- **UI Nhập liệu**: Thêm nút "📷 Thêm ảnh", input `type="file" accept="image/*" multiple`.
- **Nén ảnh ở Client**: Để tránh quá tải dung lượng và treo mạng, sử dụng `canvas` nén ảnh xuống tối đa 1024px chiều dài/rộng và giảm quality (0.8 JPEG). 
- **Upload Flow**: 
  1. Khi ấn "Lưu nhật ký", gọi `bdsApiFetch('uploadImages')` với Base64 list.
  2. Lấy danh sách URL trả về.
  3. Gắn URL vào `logData.photos`.
  4. Lưu Log như bình thường.
- **UI Hiển thị**: Trong hàm `renderTimelineHtml()`, lặp mảng `log.photos` (nếu có) và render các thẻ `<img src="...">` có thể click để xem full-screen (CSS Zoom hoặc modal).

### 2. Backend (Google Apps Script)
- Tạo API `uploadImages`:
  - Nhận array `images` (chuỗi Base64).
  - Decode Base64, dùng `DriveApp.getFolderById("ID_THƯ_MỤC")` để tạo file ảnh `MimeType.JPEG`.
  - Cấp quyền Public "Anyone can view" cho file ảnh.
  - Trả về `file.getId()` và frontend sẽ render qua `https://drive.google.com/uc?id=<ID>`.

## Rủi ro & Lưu ý
- Nếu mạng chậm, upload ảnh Base64 có thể lâu. Cần có UI loading rõ ràng (Spinner/Toast "Đang tải ảnh lên...").
- Giới hạn tải lên tối đa 3 ảnh mỗi lần ghi nhật ký để tối ưu.
