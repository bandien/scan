# QR-UID CMMS Evolution Roadmap (V2)
Mục tiêu: Nâng cấp hệ thống QR-UID hiện tại thành một nền tảng CMMS Mini chuyên nghiệp.

## Giai đoạn 5: Phân cấp Tài sản & Dashboard Chuyên sâu (Current)
Mục tiêu: Quản lý dữ liệu khoa học hơn và trực quan hóa kết quả.
- [x] **Asset Hierarchy (Filter)**: Thêm cột `Area` (H) và `EquipmentType` (I) vào Devices sheet. Filter UI với 2 dropdown (khu vực / loại máy), click thiết bị → mở thông tin.
- [x] **Advanced Search & Filter**: `filterSection` thay thế searchSection cũ — lọc theo khu vực, loại máy, hiển thị danh sách thiết bị tương ứng.
- [x] **Analytics Dashboard**: 4 KPI cards (Tổng thiết bị, Quá hạn BT, WO đang mở, WO hoàn thành) + Doughnut chart WO by Status (dữ liệu thật) + Bar chart bảo trì 6 tháng gần nhất.
- [x] **Backend `getAnalyticsData`**: Endpoint mới tính KPI, woByStatus, logsByMonth, byArea từ Sheets thật.
- [ ] **Detailed Asset Profile**: Bổ sung thông tin kỹ thuật chuyên sâu và lịch sử bảo trì chi tiết cho từng thiết bị.
- [ ] **REVIEW & EVALUATION**: Kiểm tra và chạy thử thực tế Giai đoạn 5 để đảm bảo tính năng không có lỗi. (Assign to: Reviewer Agent)

> **Lưu ý triển khai**: Cần thêm 2 cột vào Google Sheets `Devices`: cột H = `Area`, cột I = `EquipmentType`.

## Giai đoạn 6: Bảo trì Phòng ngừa (PM) & Lập lịch
Mục tiêu: Chuyển từ bảo trì khắc phục sang bảo trì chủ động.
- [ ] **PM Scheduling**: Thiết lập chu kỳ bảo trì (7 ngày, 30 ngày, 90 ngày) cho từng loại thiết bị.
- [ ] **Maintenance Calendar**: Giao diện lịch (Calendar View) để xem các công việc sắp tới.
- [ ] **Checklist Templates**: Thư viện mẫu kiểm tra riêng biệt cho từng loại máy (Điều hòa, Thang máy, Hệ thống điện).
- [ ] **REVIEW & EVALUATION**: Kiểm tra và chạy thử thực tế Giai đoạn 6 để đảm bảo tính năng không có lỗi. (Assign to: Reviewer Agent)

## Giai đoạn 7: Quản lý Nhân sự & Kanban (New)
Mục tiêu: Quản lý nhân lực và điều hành công việc trực quan.
- [ ] **Personnel Database**: Thêm Sheet "Nhân sự" để quản lý kỹ thuật viên theo từng tổ/đội.
- [ ] **Kanban Board UI**: Xây dựng giao diện bảng Kanban (Todo, In Progress, Done) để theo dõi tiến độ công việc.
- [ ] **Task Assignment**: Cho phép giao việc trực tiếp cho từng tổ hoặc từng cá nhân.
- [ ] **Workload Analytics**: Báo cáo khối lượng công việc của từng tổ/nhân viên trên Dashboard.
- [ ] **REVIEW & EVALUATION**: Kiểm tra và chạy thử thực tế Giai đoạn 7 để đảm bảo tính năng không có lỗi. (Assign to: Reviewer Agent)

## Giai đoạn 8: Work Orders, Vật tư & Báo cáo (CMMS Core)
Mục tiêu: Xây dựng hệ thống lệnh công việc (Work Orders) chuẩn CMMS, quản lý vật tư và KPI thực tế.
- [x] **Work Orders Sheet & API**: Tạo Sheet `WorkOrders` (ID, Type[PM/CM/Inspection], Priority[Low/Med/High/Urgent], Status[New/Assigned/InProgress/Done/Closed], AssetUID, AssignedTo, DueDate, Description, PartsUsed). Backend CRUD qua GAS.
- [x] **Kanban Live Data**: Kết nối bảng Kanban với Sheet `WorkOrders` thật (thay mock data). Kéo thả card = cập nhật Status.
- [ ] **Inventory (Vật tư cơ bản)**: Tạo Sheet `Inventory` (PartCode, Name, Stock, MinStock, Unit). Cảnh báo khi Stock < MinStock.
- [ ] **KPI Dashboard thật**: Tính MTTR, MTBF, % PM đúng hạn từ dữ liệu thực trong `Logs` và `WorkOrders`.
- [ ] **Export Excel**: GAS tạo báo cáo tự động trên Google Sheet → chia sẻ link download.
- [x] **Audit Log**: Sheet `AuditLog` ghi mọi thay đổi (User, Timestamp, Action, OldValue, NewValue).
- [ ] **REVIEW & EVALUATION**: Kiểm tra và chạy thử thực tế Giai đoạn 8.

## Giai đoạn 9: Phân quyền (RBAC) & Tối ưu Hiệu suất (Smart Preload)
Mục tiêu: Đảm bảo khả năng mở rộng, bảo mật và tốc độ phản hồi tức thì (0.1s) trong khi vẫn duy trì kiến trúc miễn phí (GAS + Sheets).
- [x] **Login & Role-Based Access**: Màn hình đăng nhập (Username + Password). Phân loại người dùng theo Tổ/Đội.
- [x] **Smart Data Fetching**: Khi đăng nhập thành công, hệ thống tải dữ liệu thuộc quyền hạn của Tổ đó.
- [x] **Local-First Architecture**: Lưu toàn bộ dữ liệu vào `localStorage`. Tốc độ 0.01s.
- [x] **Background Syncing**: Báo cáo checklist lưu cục bộ và đồng bộ ngầm lên Google Sheets.
- [x] **Change Password**: Đổi mật khẩu từ giao diện người dùng.
- [x] **REVIEW & EVALUATION**: Đánh giá tốc độ truy vấn thực tế — hoàn thành, Local-First đạt 0.01s.

## Giai đoạn 10: Admin Portal (Giao diện Quản trị)
Mục tiêu: Xây dựng trung tâm điều hành cho Quản lý.
- [ ] **Admin Authentication**: Đăng nhập bảo mật dành riêng cho cấp quản lý.
- [ ] **Asset Hierarchy (Cây phân cấp)**: Giao diện quản lý thiết bị theo cấu trúc Khu vực → Tòa nhà → Tầng → Phòng → Thiết bị.
- [ ] **Device CRUD + QR Generator**: Thêm/Sửa/Xóa thiết bị, tạo và in mã QR UID tự động.
- [ ] **WO Manager**: Tạo/Giao Work Order cho nhân viên/tổ nhóm. Thiết lập mức ưu tiên và hạn xử lý.
- [ ] **Checklist Builder**: Giao diện tự tạo mẫu Checklist cho các loại máy khác nhau.
- [ ] **Photo Before/After**: Chụp ảnh trước/sau bảo trì, lưu Google Drive qua GAS.
- [ ] **REVIEW & EVALUATION**: Kiểm tra tính năng Admin Portal.

## Giai đoạn 11: Metering & Năng lượng (Mới — từ CMMS Prompt)
Mục tiêu: Quản lý điểm đo điện/nước và phân tích tiêu thụ năng lượng.
- [ ] **Meter Points**: Sheet `MeterPoints` (MeterID, Type[Điện/Nước], Location, Unit, Multiplier, Threshold).
- [ ] **Readings Input**: Kỹ thuật viên ghi chỉ số định kỳ qua WebApp, có thể chụp ảnh đồng hồ.
- [ ] **Auto Calculate**: Sản lượng = Chỉ số mới - Chỉ số cũ × Hệ số. Cảnh báo khi vượt ngưỡng.
- [ ] **Energy Dashboard**: Biểu đồ xu hướng tiêu thụ điện/nước theo tháng, so sánh cùng kỳ.
- [ ] **Location Feedback**: Nút "Sai vị trí?" trên màn hình thiết bị → ghi nhận đề xuất sửa vị trí.
- [ ] **REVIEW & EVALUATION**: Kiểm tra tính năng Metering.

---
**Lead Architect:** Antigravity
**Infrastructure:** GitHub Pages + Google Apps Script + Google Sheets
**Reference:** Tính năng nghiệp vụ chắt lọc từ `cmms-prompt.md` (CMMS Hapulico Enterprise Spec)

