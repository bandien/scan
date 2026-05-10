# QR-UID CMMS Evolution Roadmap (V2)
Mục tiêu: Nâng cấp hệ thống QR-UID hiện tại thành một nền tảng CMMS Mini chuyên nghiệp.

## Giai đoạn 5: Phân cấp Tài sản & Dashboard Chuyên sâu (Current)
Mục tiêu: Quản lý dữ liệu khoa học hơn và trực quan hóa kết quả.
- [ ] **Asset Hierarchy**: Chuyển đổi danh sách thiết bị sang cấu trúc phân cấp (Khu vực > Loại thiết bị > Thiết bị).
- [ ] **Advanced Search & Filter**: Tìm kiếm thông minh theo khu vực hoặc trạng thái bảo trì.
- [ ] **Analytics Dashboard**: Tích hợp Chart.js để hiển thị biểu đồ tròn (Trạng thái thiết bị) và biểu đồ cột (Số lượt bảo trì theo tháng).
- [ ] **Detailed Asset Profile**: Bổ sung thông tin kỹ thuật chuyên sâu và lịch sử bảo trì chi tiết cho từng thiết bị.

## Giai đoạn 6: Bảo trì Phòng ngừa (PM) & Lập lịch
Mục tiêu: Chuyển từ bảo trì khắc phục sang bảo trì chủ động.
- [ ] **PM Scheduling**: Thiết lập chu kỳ bảo trì (7 ngày, 30 ngày, 90 ngày) cho từng loại thiết bị.
- [ ] **Maintenance Calendar**: Giao diện lịch (Calendar View) để xem các công việc sắp tới.
- [ ] **Checklist Templates**: Thư viện mẫu kiểm tra riêng biệt cho từng loại máy (Điều hòa, Thang máy, Hệ thống điện).

## Giai đoạn 7: Quản lý Vật tư & Phân quyền
Mục tiêu: Kiểm soát chi phí và vai trò người dùng.
- [ ] **Basic Inventory**: Thêm Sheet "Phụ tùng" để theo dõi tồn kho vật tư thay thế cơ bản.
- [ ] **Spare Parts Linkage**: Liên kết vật tư đã dùng vào nhật ký bảo trì để tính toán chi phí.
- [ ] **Role-based UI**: Phân biệt giao diện cho Quản lý (Xem báo cáo) và Kỹ thuật viên (Thực hiện công việc).

## Giai đoạn 8: Báo cáo & Audit Log
Mục tiêu: Chuyên nghiệp hóa đầu ra và bảo mật dữ liệu.
- [ ] **Automated Reports**: Xuất báo cáo bảo trì định kỳ sang file PDF hoặc Excel.
- [ ] **Audit Log**: Ghi lại lịch sử chỉnh sửa hệ thống (Ai đã thay đổi thông tin thiết bị).
- [ ] **Performance KPIs**: Tính toán tự động chỉ số MTTR (Thời gian sửa chữa trung bình) và MTBF (Thời gian giữa các lần hỏng).

---
**Lead Architect:** Antigravity
**Infrastructure:** GitHub Pages + Google Apps Script + Google Sheets
