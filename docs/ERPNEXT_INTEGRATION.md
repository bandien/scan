# 🔄 Hướng dẫn Tích hợp Đồng bộ Dữ liệu ERPNext

Tài liệu này hướng dẫn cách kết nối hệ thống quét mã QR bảo trì (GitHub Pages + Google Sheets + Apps Script) với hệ thống ERPNext (Frappe) để tự động đồng bộ dữ liệu ngầm (background sync) chỉ số đồng hồ (Meter Readings) và nhật ký bảo trì (Maintenance Logs).

---

## 1. Mô hình Kiến trúc Lai (Hybrid Architecture)

Hệ thống hoạt động theo mô hình hai lớp nhằm tối ưu chi phí và tăng tốc độ trải nghiệm thực địa:
- **Phần nổi (Frontend & Google Sheets):** Nhập liệu thực địa nhanh, quét QR không trễ, chạy offline tốt và miễn phí 100% tài khoản người dùng hiện trường (không tốn license ERPNext).
- **Phần chìm (ERPNext Backend):** Nơi quản lý tài sản (Asset Management), đo lường và kế toán bảo trì theo chuẩn nghiệp vụ doanh nghiệp.
- **Middleware (Google Apps Script):** Cầu nối trung gian giao tiếp qua REST API sử dụng Token Auth (`API_KEY:API_SECRET`) và chạy ngầm (Cron trigger) để đẩy dữ liệu.

---

## 2. Triển khai ERPNext Self-hosted (Docker)

Để chạy thử nghiệm hệ thống ERPNext cục bộ bằng Docker Desktop trên máy tính Windows:

### Bước 1: Khởi động Docker Desktop
Đảm bảo ứng dụng Docker Desktop đã được mở và dịch vụ Docker Engine đã hiển thị trạng thái màu xanh (Running).

### Bước 2: Tải cấu hình cài đặt
Di chuyển vào thư mục code và clone repository chính thức của Frappe Docker:
```bash
cd D:\Code
git clone https://github.com/frappe/frappe_docker.git
cd frappe_docker
```

### Bước 3: Khởi chạy cụm Container bằng `pwd.yml`
```bash
docker compose -f pwd.yml up -d
```
Lệnh này sẽ tải các image MariaDB, Redis, Frappe, Nginx và tự động tạo một site mặc định tên là `frontend`. Bạn có thể theo dõi tiến độ tạo site bằng lệnh:
```bash
docker logs -f frappe_docker-create-site-1
```
Khi container chạy xong và thoát, bạn có thể truy cập ERPNext qua trình duyệt tại địa chỉ:
- **URL cục bộ:** [http://localhost:8080](http://localhost:8080)
- **Tài khoản mặc định:** `Administrator` / Mật khẩu: `admin`

---

## 3. Cấu hình ngrok & Quản lý bằng PM2

Để Google Apps Script (chạy trên đám mây của Google) có thể gửi request qua Internet về máy tính cục bộ của bạn, chúng ta cần mở một đường ống kết nối (tunnel) thông qua ngrok và quản lý tự động bằng PM2.

### Bước 1: Đăng ký Domain tĩnh miễn phí trên Ngrok
Đăng nhập vào trang dashboard ngrok của bạn và lấy **Authtoken** cùng tên miền tĩnh được cấp (ví dụ: `royal-expend-ripping.ngrok-free.dev`).

### Bước 2: Cấu hình `ngrok.yml`
Mở file cấu hình ngrok trên Windows tại `C:\Users\<TÊN_USER>\AppData\Local\ngrok\ngrok.yml` và ghi đè nội dung sau:
```yaml
version: "2"
authtoken: <MÃ_AUTHTOKEN_CỦA_BẠN>
tunnels:
  erpnext:
    proto: http
    addr: 8080
    domain: royal-expend-ripping.ngrok-free.dev
```

### Bước 3: Chạy ngầm bằng PM2
Để ngrok chạy nền ổn định và tự động kết nối lại khi mất mạng hoặc khởi động lại máy, chúng ta dùng trình quản lý tiến trình PM2:
1. Cài đặt PM2 toàn cục:
   ```bash
   npm install -g pm2
   ```
2. Tạo file chạy phụ trợ `start_ngrok.js` ở thư mục dự án:
   ```javascript
   const { spawn } = require('child_process');
   const ngrok = spawn('ngrok', ['start', 'erpnext'], { stdio: 'inherit', shell: true });
   ```
3. Khởi động tiến trình qua PM2 và lưu trạng thái:
   ```bash
   pm2 start start_ngrok.js --name "erpnext-tunnel"
   pm2 save
   ```

*(Bạn có thể đưa tệp tin `pm2 resurrect` vào thư mục **Startup** của Windows để khôi phục dịch vụ tự động mỗi khi khởi động máy).*

---

## 4. Tích hợp trong Google Apps Script (1-Click Setup)

Sau khi code đã được cập nhật lên Apps Script, bạn chỉ cần cấu hình dự án bằng 1 cú click:

1. Truy cập vào giao diện quản lý mã nguồn Google Apps Script của dự án sản xuất.
2. Chọn hàm **`setupERPNextIntegration`** từ menu dropdown trên thanh công cụ.
3. Bấm nút **Run (Chạy)**.

### Tiến trình tự động thực hiện:
- **Thiết lập biến bảo mật:** Ghi các thông số `ERPNEXT_BASE_URL` (link ngrok), `ERPNEXT_API_KEY`, `ERPNEXT_API_SECRET` vào bộ nhớ an toàn Script Properties của dự án.
- **Nâng cấp Google Sheets:** Tự động tạo thêm 3 cột ở cuối các sheet `Logs` và `MeterReadings` gồm:
  - `SyncStatus`: Trạng thái đồng bộ (`Synced`, `Failed`, `Pending`).
  - `ERPNextID`: ID bản ghi tương ứng được sinh ra trên ERPNext.
  - `SyncMessage`: Chi tiết trạng thái hoặc thông báo lỗi từ API.
- **Kích hoạt Cron Job:** Tạo một Trigger thời gian để tự động gọi hàm `triggerERPNextSync` mỗi **10 phút/lần** chạy ngầm để quét và đồng bộ các dòng dữ liệu mới.
- **Bypass ngrok warning:** Code của Apps Script được đính kèm header `"ngrok-skip-browser-warning": "6024"` để bỏ qua trang chặn cảnh báo mặc định của ngrok.
