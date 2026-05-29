# Nhật ký thay đổi (Changelog) - BanDienScan

Tất cả các thay đổi và cải tiến của hệ thống Quản lý & Bảo trì Ban điện thông minh (CMMS Mini WebApp) được ghi nhận tại đây theo từng phiên bản.

---

## [v2.3.0] - 2026-05-29
### Thêm mới (Added)
- **Mô hình Phân cấp & Nhiều tổ quản lý cho Nhân sự (Hierarchical & Multi-team Filtering):**
  - Hỗ trợ cấu hình cột `Teams` (Cột D) trong sheet `Users` của Google Sheets dưới dạng danh sách phân tách bằng dấu phẩy (ví dụ: `Cơ Điện, Vận hành`).
  - Hệ thống tự động nạp danh sách `teams` của người dùng khi đăng nhập thành công.
  - Cải tiến bộ lọc danh sách thiết bị trên màn hình **Thiết bị của tôi** (`renderDeviceList`): Đối sánh động cột `Tổ quản lý` (`d.manager`) của thiết bị với bất kỳ tổ nào trong danh sách tổ của người dùng hiện tại thay vì lọc cứng.
  - Đồng bộ hóa logic bộ lọc phân cấp đa tổ này vào tính năng xuất tệp CSV cho Fluke LinkWare Live và máy in Brother PT-E560BT.

---

## [v2.2.3] - 2026-05-29
### Cải tiến (Improved)
- **Dropdown chọn thông minh kết hợp Thêm mới cho các trường nhập liệu:**
  - Chuyển đổi các trường nhập tự do **Vị trí lắp đặt**, **Tổ quản lý**, và **Ca trực** trong biểu mẫu Thêm mới & Chỉnh sửa thiết bị thành dạng danh sách lựa chọn (**Dropdown**).
  - Danh sách dropdown tự động thu thập các giá trị đã tồn tại trong database thiết bị và sắp xếp theo bảng chữ cái.
  - Hỗ trợ option đặc biệt `-- Thêm mới --` (`__NEW__`), khi người dùng lựa chọn sẽ hiển thị thêm ô nhập văn bản tự do ngay bên dưới để ghi nhận giá trị mới chưa từng có trong danh sách.

---

## [v2.2.2] - 2026-05-29
### Thêm mới (Added)
- **Phân quyền Chỉnh sửa Thiết bị (CRUD Security):**
  - Phân quyền hiển thị tính năng chỉnh sửa thông tin thiết bị: Nút "Chỉnh sửa" chỉ hiển thị với tài khoản **Admin** và **Manager**. Người dùng có vai trò **Operator** (nhân viên vận hành) thông thường không được phép chỉnh sửa thiết bị.
- **Dịch chuyển Thiết bị theo Mã địa điểm:**
  - Bổ sung tùy chọn dịch chuyển thiết bị "Lắp theo mã địa điểm" vào biểu mẫu lịch sử di chuyển (bên cạnh Nhập kho, Xuất kho) để cập nhật vị trí lắp đặt hiện tại trực tiếp từ danh sách địa điểm.

---

## [v2.2.1] - 2026-05-29
### Thêm mới (Added)
- **Nâng cấp quét mã vạch (Barcode Scanner Upgrade):**
  - Khắc phục lỗi camera không quét được barcode: Hỗ trợ đầy đủ các định dạng mã vạch tiêu chuẩn (`code_128`, `code_39`, `ean_13`, `ean_8`, `upc_a`, `upc_e`) song song với QR Code thông qua thư viện `html5-qrcode` nâng cấp và API native `BarcodeDetector` trên thiết bị di động.
- **Thêm thuộc tính Ngày sản xuất & Ngày lắp đặt:**
  - Bổ sung 2 cột thông tin tiếng Anh cho thiết bị: `Manufacture Date` (Ngày sản xuất) và `Installation Date` (Ngày lắp đặt) vào Google Sheet **Devices**.
  - Hiển thị đầy đủ thông tin Ngày sản xuất & Ngày lắp đặt trên giao diện thông tin chi tiết thiết bị (Asset Profile).
  - Tích hợp endpoint quản trị `setupHeaders` trên Apps Script Backend để tự động đồng bộ hóa và khởi tạo các cột tiêu đề mới trên Google Sheets.

---

## [v2.2.0] - 2026-05-29
### Thêm mới (Added)
- **Tích hợp in nhãn với Fluke LinkWare Live & Brother PT-E560BT:**
  - Bổ sung nút bấm xuất CSV trong mục **Thiết bị của tôi** trên giao diện Web App.
  - Hỗ trợ xuất dữ liệu theo đúng chuẩn **LinkWare Live (Fluke)**: File CSV cột đơn chứa UID và 1 dòng trống kết thúc để import trực tiếp vào dự án.
  - Hỗ trợ xuất dữ liệu đầy đủ thông tin thiết bị cho **máy in Brother**: File CSV đa cột gồm `UID`, `Tên`, `Vị trí`, `Thông số`, `Chu kỳ`, `Tổ quản lý`, `Ca trực` để import vào phần mềm **P-touch Editor** hoặc ứng dụng di động **Brother Pro Label Tool**.
  - Bổ sung tài liệu hướng dẫn quy trình in nhãn thực tế [walkthrough.md](./brain/fd7a048f-0667-4e49-8a7b-7dbe2b720eb1/walkthrough.md).
- Thêm chuỗi dịch thuật `i18n` tiếng Việt và tiếng Anh cho các tính năng xuất dữ liệu mới.

---

## [v2.1.0] - 2026-05-14
### Thêm mới (Added)
- **Hệ thống phân quyền người dùng (RBAC Login):** Đăng nhập bằng tên đăng nhập và mật khẩu (PIN). Phân quyền theo Tổ/Đội (Admin, Manager, Operator).
- **Kiến trúc Local-First (Offline-First):** Lưu trữ toàn bộ dữ liệu thiết bị tại `localStorage` giúp tăng tốc độ phản hồi (0.01s).
- **Smart Data Preloading:** Tự động tải dữ liệu tương ứng với quyền của tài khoản sau khi đăng nhập thành công.
- **Background Syncing:** Lưu trữ các báo cáo kiểm tra offline cục bộ khi mất mạng và tự động đồng bộ lên Google Sheets khi có kết nối internet trở lại.
- **Tính năng đổi mật khẩu:** Người dùng có thể đổi PIN trực tiếp trên giao diện.

---

## [v2.0.0] - 2026-04-30
### Thêm mới (Added)
- **Bảng Kanban Work Orders (WO):** Quản lý phiếu sửa chữa/bảo dưỡng di động theo 3 trạng thái kéo-thả (Todo → In Progress → Done).
- **PM Calendar (Lịch bảo trì):** Hiển thị danh sách thiết bị đến hạn bảo dưỡng định kỳ (trong vòng 7 ngày, quá hạn, đã lên lịch).
- **Dashboard số liệu (Chart.js):** Biểu đồ tròn trực quan hóa tỷ lệ trạng thái thiết bị trong kho (IN) và đang lắp đặt (OUT).
- **Thư viện checklist mẫu:** Cấu hình checklist kiểm tra động cho từng nhóm thiết bị (Điều hòa, Thang máy, Hệ thống điện).

---

## [v1.0.0] - 2026-04-15
### Thêm mới (Added)
- **Nền tảng cốt lõi (Core):**
  - Giao diện Web tĩnh tối ưu di động (Bootstrap 5, Glassmorphism).
  - Quét mã QR bằng Camera qua thư viện `html5-qrcode` trực tiếp trên trình duyệt di động hoặc nhập tay UID.
  - Kết nối GAS API gửi/nhận dữ liệu trực tiếp với Google Sheets (Database).
  - Bảo mật kết nối API bằng token (`HAPU_QR_SECRET_2026`).
  - Hỗ trợ đa ngôn ngữ VI/EN (lưu tùy chọn vào trình duyệt).
