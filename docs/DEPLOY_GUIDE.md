# 🚀 Hướng dẫn triển khai (Deployment Guide)

Chào mừng bạn đến với hệ thống UID QR Maintenance. Dưới đây là 3 bước để bạn sở hữu hệ thống của riêng mình.

## Bước 1: Chuẩn bị Database (Google Sheets)
1. Tạo một Google Sheet mới.
2. Tạo các Tab và cột đúng theo hướng dẫn tại [SHEET_STRUCTURE.md](./SHEET_STRUCTURE.md).
3. (Tùy chọn) Nhập dữ liệu mẫu vào các cột để kiểm tra.

## Bước 2: Thiết lập Backend (Google Apps Script)
1. Trong Google Sheet của bạn, chọn **Extensions > Apps Script**.
2. Copy toàn bộ nội dung file [Backend.gs](../Backend.gs) và dán vào trình soạn thảo Apps Script.
3. Nhấn nút **Deploy > New Deployment**.
   - **Select type**: Web App
   - **Execute as**: Me (Tài khoản của bạn)
   - **Who has access**: Anyone (Bất kỳ ai)
4. Nhấn **Deploy** và copy đoạn **Web App URL** nhận được.

## Bước 3: Thiết lập Frontend (GitHub Pages)
1. Fork hoặc Download mã nguồn này về GitHub của bạn.
2. Mở file `index.html`, tìm khối `CONFIG` ở đầu thẻ `<script>`:
   - Dán URL bạn vừa copy ở Bước 2 vào biến `gasUrl`.
   - Đổi `apiToken` thành một mã bí mật của riêng bạn (nhớ đổi tương ứng trong file Apps Script).
3. Vào **Settings > Pages** của Repository trên GitHub, chọn branch `main` và nhấn **Save**.
4. Chờ 1 phút, ứng dụng của bạn sẽ online tại địa chỉ `https://<your-username>.github.io/<repo-name>/`.

## Cách cập nhật khi có phiên bản mới
Khi dự án gốc có các tính năng mới (ví dụ: Mini Log, Chụp ảnh), bạn hãy làm theo các bước sau:

1. **Đồng bộ GitHub**: 
   - Trên GitHub, vào Repo của bạn và nhấn **Sync Fork > Update Branch**.
2. **Cập nhật Apps Script**:
   - Mở file `Backend.gs` mới và dán đè vào Apps Script của bạn.
   - **Quan trọng**: Nhấn **Deploy > New Deployment** để tạo phiên bản mới nhất.
3. **Kiểm tra Cấu hình**:
   - Nếu bạn có thay đổi `gasUrl` hoặc `apiToken` trước đó, hãy đảm bảo các thông số này trong file `index.html` mới vẫn chính xác với hệ thống của bạn.
4. **Cập nhật Cấu trúc Sheet (Nếu có)**:
   - Kiểm tra file [SHEET_STRUCTURE.md](./SHEET_STRUCTURE.md) xem có cột nào mới được thêm vào không.
   - Nếu có cột mới, bạn phải **thêm thủ công** cột đó vào đúng vị trí trong Google Sheet của mình để tránh lỗi lệch dữ liệu.

---
*Lưu ý: Để tính năng chụp ảnh hoạt động, hãy đảm bảo bạn đã cấp quyền cho Script truy cập vào Google Drive của mình khi Deploy.*
