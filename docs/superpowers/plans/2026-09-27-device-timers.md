# Kế hoạch

1. tests/device-timers.spec.js: kiểm thử thêm/sửa qua đêm, tải lại, tác giả, chuỗi HTML và lỗi bộ nhớ; chạy Playwright để xác nhận RED.
2. nhatky/index.html: thêm bảng và form có nhãn; hàm đọc/ghi localStorage, kiểm tra dữ liệu và tác giả đăng nhập; tích hợp renderDashboard.
3. Chạy `npx playwright test tests/device-timers.spec.js tests/nhatky-employee-transfer.spec.js --reporter=line` trên desktop/mobile; kiểm tra diff.
