# Kế hoạch triển khai Checklist ca — Giai đoạn 1

## Task 1: Khóa hợp đồng backend bằng test

- Tạo `tests/golf-lifecycle-backend.test.js`.
- RED: nguồn Apps Script phải parse được; có `handleConfirmGolfHandover` và
  `handleAcceptGolfHandoverAndStartRun`.
- RED: không được lưu/chốt lại run đã `submitted` hoặc `confirmed`.
- Verification: `node --test tests/golf-lifecycle-backend.test.js`.

## Task 2: Sửa máy trạng thái backend

- Sửa `19_GolfChecklist.gs`.
- Khôi phục khai báo hàm xác nhận đang mất.
- Khóa `saveGolfRun` và `submitGolfRun` theo trạng thái nguồn.
- Thêm `handleAcceptGolfHandoverAndStartRun`: dưới script lock, xác nhận run trước và
  tạo/mở run hiện tại trong cùng critical section; hỗ trợ gọi lặp an toàn.
- Thêm dispatch tại `02_Router.gs`.
- Verification: test Task 1 GREEN và kiểm tra cú pháp.

## Task 3: Bắt buộc luồng nhận ca ở frontend

- Sửa `sangolf/index.html`.
- Banner ca trước phải hiển thị nội dung, người chốt, mục lỗi và thời điểm.
- Nút nhận ca gọi API nguyên tử mới và mở checklist hiện tại sau khi thành công.
- URL `autoTemplate` không được bỏ qua bàn giao đang chờ; khi không tải được backend
  vẫn cho làm local với trạng thái đồng bộ rõ ràng.
- Viết/mở rộng `tests/checklist-file-lifecycle.spec.js` theo RED-GREEN.

## Task 4: Verification và phát hành

- Chạy backend test, E2E desktop/mobile và `git diff --check`.
- Chỉ force-add hai file `.gs` thuộc backend vì repository đang ignore toàn bộ Apps
  Script export.
- Commit/push riêng thay đổi vòng đời, không đưa các stub không liên quan vào commit.
