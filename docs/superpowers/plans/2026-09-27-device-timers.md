# Kế hoạch

1. tests/device-timers.spec.js: kiểm thử thêm/sửa qua đêm, tải lại, tác giả, chuỗi HTML và lỗi bộ nhớ; chạy Playwright để xác nhận RED.
2. nhatky/index.html: thêm bảng và form có nhãn; hàm đọc/ghi localStorage, kiểm tra dữ liệu và tác giả đăng nhập; tích hợp renderDashboard.
3. Chạy `npx playwright test tests/device-timers.spec.js tests/nhatky-employee-transfer.spec.js --reporter=line` trên desktop/mobile; kiểm tra diff.

4. tests/public-device-timers.spec.js: kiểm thử nội dung nguồn, ô gộp, giây, 00:00, số lượng, dữ liệu cuối bảng và không ghi vào localStorage; xác nhận RED.
5. Nhúng JSON chỉ tab hẹn giờ A6:L341 vào nhatky/index.html; dựng bảng bằng textContent, giữ rowspan/colspan, nguồn và hướng dẫn.
6. Chạy test mới cùng tests/device-timers.spec.js trên desktop/mobile; so sánh mọi giá trị nhập với dữ liệu nguồn và kiểm tra ảnh giao diện.

7. tests/office-device-timers.spec.js: RED xác nhận chưa có bảng; nhập bản nguồn văn phòng vào HTML và dùng chung renderer. Kiểm tra giờ riêng chiếu sáng/điều hòa, chủ nhật, ô gộp, 24:00, ghi chú, từng ô dữ liệu và khả năng hiển thị mobile.
8. Chạy ba bộ tests/office-device-timers.spec.js, tests/public-device-timers.spec.js, tests/device-timers.spec.js trên desktop/mobile; xem ảnh và git diff --check.
