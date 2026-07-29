# Kế hoạch TDD vòng đời Checklist file://

1. Thêm E2E tái hiện tại `tests/checklist-file-lifecycle.spec.js`: chặn API, đi từ Nhật ký
   qua lối tắt, kiểm tra run có nội dung. Chạy riêng test để xác nhận RED.
2. Thêm dữ liệu dự phòng tại `js/golf-checklist-fallback.js`, nạp trong
   `sangolf/index.html`, và cập nhật `loadTemplates()` để dùng fallback trước khi gọi API.
3. Mở rộng E2E cho nhập/lưu/khôi phục draft và mock API cho chốt ca + xác nhận bàn giao.
4. Chạy `tests/checklist-file-lifecycle.spec.js`, `tests/golf-checklist.spec.js` và các
   test Nhật ký liên quan. Kiểm tra console/page errors.
5. Chỉ commit các file thuộc thay đổi này; không đưa các stub hoặc file cũ không liên quan
   vào commit.

