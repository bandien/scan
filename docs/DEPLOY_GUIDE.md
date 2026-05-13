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

### 3.1. Đẩy mã nguồn lên GitHub của bạn
Nếu bạn clone dự án về máy tính, hãy chạy các lệnh sau để đẩy lên Repo mới của bạn:

```bash
# 1. Khởi tạo Git (nếu chưa có)
git init

# 2. Add tất cả các file
git add .

# 3. Commit lần đầu
git commit -m "Initial commit - QR System"

# 4. Tạo Repo mới trên GitHub, sau đó dán link vào đây:
git remote add origin https://github.com/USER_CUA_BAN/TEN_REPO_MOI.git

# 5. Đẩy code lên
git push -u origin master
```

### 3.2. Cấu hình file `index.html`
1. Mở file `index.html`, tìm khối `CONFIG` ở đầu thẻ `<script>`:
   - Dán URL bạn vừa copy ở Bước 2 vào biến `gasUrl`.
   - Đổi `apiToken` thành một mã bí mật của riêng bạn (nhớ đổi tương ứng trong file Apps Script).
2. Lưu file và đẩy lên GitHub: `git add . && git commit -m "Update config" && git push`.

### 3.3. Kích hoạt GitHub Pages (Build and deployment)
1. Truy cập vào Repository của bạn trên GitHub.
2. Chọn tab **Settings** > **Pages** (cột bên trái).
3. Tại mục **Build and deployment** > **Source**:
   - Đảm bảo đang chọn là **Deploy from a branch**.
   - Mục **Branch**: Chọn `master` (hoặc `main`) và folder `/ (root)`.
4. Nhấn **Save**.
5. Chờ khoảng 1-2 phút, bạn sẽ thấy link app hiện ra ở đầu trang (ví dụ: `https://user.github.io/repo/`).

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
