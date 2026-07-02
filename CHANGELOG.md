---
title: Nhật ký thay đổi (Changelog) - BanDienScan
aliases:
  - changelog
  - nhật ký thay đổi (changelog) - bandienscan
tags:
  - khac
  - scan-cmms
  - dang-thuc-hien
date: 2026-06-08
updated: 2026-06-08
---
# Nhật ký thay đổi (Changelog) - BanDienScan

Tất cả các thay đổi và cải tiến của hệ thống Quản lý & Bảo trì Ban điện thông minh (CMMS Mini WebApp) được ghi nhận tại đây theo từng phiên bản.

## [v2.8.0] - 2026-07-03
### Thêm mới (Added)
- **Module Giám sát Server Uptime (`status.html`):**
  - Công cụ giám sát thời gian phản hồi (latency) và trạng thái kết nối mạng của các server nội bộ và internet (Ví dụ: `chieusang.montanagc.com.vn:8383`).
  - Tích hợp bộ tính năng quản lý Thêm mới, Chỉnh sửa thông tin (Edit) và Xóa bỏ (Delete) các máy chủ cần giám sát ngay từ giao diện người dùng. Lưu cấu hình cục bộ (`localStorage`).
  - Ghi nhật ký lịch sử Uptime (Log History) tối đa 100 dòng kiểm tra gần nhất.
- **Liên kết điều hướng hai chiều:**
  - Tích hợp liên kết **Giám sát Server Uptime** vào Menu chính của trang chủ `index.html`.
  - Bổ sung nút bấm **Trang chủ** trên thanh tiêu đề của `status.html` để quay lại dễ dàng.
- **Trang phụ trợ chốt chỉ số 1-Touch công cộng (`meter.html`):**
  - WebApp di động độc lập giúp nhân viên vận hành chốt nhanh số điện, nước qua 4G ngoài hiện trường mà không bị chặn mạng/VPN.
  - Hỗ trợ nhập thời gian thao tác tùy chỉnh phục vụ kịch bản chốt chỉ số bù.
- **Trang in tem mã QR hàng loạt (`print_meters.html`):**
  - Tạo trang xuất bản và in nhãn dán QR hàng loạt cho 22 đồng hồ điện & nước.

### Cập nhật (Updated)
- **Kiến trúc & Sơ đồ Hệ thống (`architecture.html` & `ui_architecture.md`):**
  - Cập nhật sơ đồ Mermaid biểu diễn luồng dữ liệu (Data Flow) và bảng từ điển Mapping ánh xạ mã nguồn cho các trang vệ tinh phụ trợ mới.

---

## [v2.6.0] - 2026-05-30
### Thêm mới (Added)
- **Module Quản lý Địa điểm lắp đặt (Location CRUD Management):**
  - Bổ sung nút bánh răng cài đặt ⚙️ bên cạnh dropdown chọn địa điểm lắp đặt tại modal Lắp đặt thiết bị (`#installLocationModal`), giúp quản trị viên thêm mới, sửa đổi hoặc xóa các địa điểm lắp đặt.
  - Tích hợp thêm tùy chọn "Quản lý Địa điểm" vào Menu chính cho tài khoản vai trò Admin/Manager.
  - Tích hợp CRUD với cơ sở dữ liệu: Tạo địa điểm tự động sinh UID tiền tố `LOC-YYYYMM-NNN`, lưu trực tiếp vào danh sách thiết bị đặc biệt của hệ thống.
  - Tự động đồng bộ thông tin: Đổi tên địa điểm sẽ đồng bộ đổi tên Vị trí (Location - Cột C) của toàn bộ thiết bị liên đới trên Google Sheets. Xóa địa điểm sẽ tự động trả các thiết bị liên quan về vị trí mặc định (`Chưa phân công`).

---

## [v2.5.0] - 2026-05-29
### Thêm mới (Added)
- **Module Quản lý Ca trực (Shift CRUD Management):**
  - Bổ sung nút cài đặt hình bánh răng ⚙️ bên cạnh dropdown chọn Ca trực (trong modal Thêm, Sửa thiết bị và biểu mẫu Tạo hàng loạt) giúp mở nhanh bảng Quản lý Ca trực.
  - Tích hợp thêm tùy chọn "Quản lý Ca trực" vào Menu chính dành cho tài khoản Admin và Manager.
  - Hỗ trợ đầy đủ các thao tác Thêm mới, Chỉnh sửa thông tin ca (tên ca, giờ làm việc/mô tả, trạng thái) và Xóa ca trực.
  - Tự động hóa quá trình di chuyển (migration): Khi chạy `setupHeaders` lần đầu, backend tự động phát hiện và trích xuất các ca trực cũ từ cột Ca trực (cột H) trong sheet Devices để đưa vào sheet Shifts mới.
  - Tự động đồng bộ: Đổi tên ca trực sẽ tự động cập nhật lại thông tin ca trực cho toàn bộ các thiết bị liên quan trên Google Sheets. Xóa ca trực sẽ tự động đưa các thiết bị liên kết thuộc ca đó về trạng thái "Chưa phân công".

---

## [v2.4.2] - 2026-05-29
### Sửa lỗi (Fixed)
- **Tự động khởi tạo cấu trúc Projects & AuditLog trong Backend.gs:**
  - Khắc phục triệt để lỗi `Project sheet not found` khi khởi chạy hệ thống quản lý dự án lần đầu tiên trên Google Sheet trống.
  - Cải tiến hàm cấu hình `setupHeaders` để tự động kiểm tra và khởi tạo sheet `Projects` (với các cột `ProjectID`, `Name`, `Status`, `StartDate`, `EndDate`) cùng sheet `AuditLog` (với các cột `Timestamp`, `User`, `Action`, `Target`, `Details`) nếu chưa tồn tại.
  - Cập nhật hàm kiểm tra `testAuthorization` để bao quát kiểm tra sức khỏe cả sheet `Projects` mới.

---

## [v2.4.1] - 2026-05-29
### Thêm mới (Added)
- **Áp dụng gợi ý điền mẫu & chuẩn hóa mã theo chuẩn M&E:**
  - Bổ sung thanh Gợi ý Đặt mã & Tên (Chuẩn M&E) hiển thị động các nút mẫu nhanh (Bơm nước sạch BNS, Bơm nước thải BNT, Tủ tổng MSB, Tủ phân phối DB, ATS, v.v...) dựa theo Loại thiết bị được chọn trong Trình tạo hàng loạt.
  - Tự động điền các trường: Tiền tố (Prefix), Hậu tố (Suffix), Độ dài số đệm (Padding), Tên mẫu, Thông số mẫu, và định vị Vị trí mẫu tương ứng khi nhấp chọn mẫu.
  - Tích hợp hàm tự động định dạng mã UID sang viết hoa toàn bộ (UPPERCASE), loại bỏ dấu tiếng Việt, thay thế khoảng trắng thành dấu gạch ngang (`-`), gỡ bỏ ký tự đặc biệt không hợp lệ trong thời gian thực khi người dùng gõ mã UID (ở form đơn) hoặc tiền/hậu tố (ở form tạo hàng loạt).

---

## [v2.4.0] - 2026-05-29
### Thêm mới (Added)
- **Module Quản lý Dự án (Project Management CRUD):**
  - Tích hợp thêm nút cài đặt hình bánh răng ⚙️ bên cạnh tất cả các dropdown chọn Dự án (ở form Thêm, Sửa và Tạo thiết bị hàng loạt) để mở nhanh bảng Quản lý Dự án.
  - Hỗ trợ xem danh sách dự án dưới dạng bảng biểu trực quan, thêm mới dự án, chỉnh sửa thông tin hoặc xóa bỏ dự án.
  - Khi sửa tên một dự án, hệ thống tự động cập nhật lại tên dự án mới cho toàn bộ thiết bị đang liên kết với dự án đó trên Google Sheets.
  - Khi xóa một dự án, toàn bộ thiết bị liên kết với dự án đó sẽ tự động được gỡ liên kết dự án.
  - Tích hợp thêm nút "Quản lý Dự án" vào Menu chính dành riêng cho vai trò Admin và Manager.

---

## [v2.3.1] - 2026-05-29
### Thêm mới (Added)
- **Hỗ trợ trường thông tin Số Seri (Serial Number) cho thiết bị:**
  - Bổ sung cột `Serial Number` (Cột N) vào bảng tính **Devices** trên Google Sheets.
  - Cập nhật biểu mẫu **Thêm thiết bị** và **Sửa thiết bị** để kỹ thuật viên nhập/cập nhật Số Seri hãng sản xuất của thiết bị.
  - Hiển thị Số Seri gốc trong mục thông tin chi tiết thiết bị (Asset Profile) phục vụ cho bảo hành và thay thế thiết bị.
  - Tích hợp trường Số Seri hãng vào tệp kết xuất CSV dành cho **máy in nhãn Brother**.
  - Bổ sung cơ chế **Smart Fallback**: Khi quét nhầm mã vạch/QR Số Seri hãng thay vì nhãn UID hệ thống, ứng dụng sẽ tự động đối chiếu để tìm ra thiết bị tương ứng và hiển thị đúng thông tin mà không báo lỗi.

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
