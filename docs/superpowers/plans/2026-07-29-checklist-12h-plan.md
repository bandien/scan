# Kế Hoạch Triển Khai: Checklist Nộp Muộn 12h & Auto-Open

## Tóm tắt công việc
Sửa đổi giao diện Checklist (`sangolf/index.html`) để hỗ trợ logic nộp muộn tối đa 12h dựa trên thời gian kết thúc ca. Tối ưu hoá đường dẫn từ Nhật ký để tự động mở đúng ca phù hợp.

---

## 📝 Task 1: Thêm logic tính toán thời gian ca & 12h
- **Mục tiêu**: Viết hàm xử lý để lấy giờ kết thúc ca và kiểm tra trạng thái "quá hạn".
- **File**: `js/app.js` (hoặc script inline trong `sangolf/index.html` tuỳ kiến trúc). 
- **Cách thực hiện**:
  - Khai báo hàm `parseShiftTime(templateName)`: bóc tách giờ từ chuỗi `(5h00 - 13h00)`.
  - Khai báo hàm `checkChecklistEligibility(templateName, dateString)`: tính ra `endTime`, cộng thêm 12h, nếu `now > endTime + 12h` thì trả về `{ isLate: true }`.
- **Verification**: Gắn `console.log` để test với `Ca Sáng` và `Ca Tối` xem kết quả parse đúng không.

---

## 📝 Task 2: Chặn submit & Vô hiệu hoá UI khi quá hạn 12h
- **Mục tiêu**: Khi mở một ca đã hết hạn, không cho phép điền và ẩn nút chốt.
- **File**: `sangolf/index.html`.
- **Cách thực hiện**:
  - Trong hàm `renderRun()`, gọi `checkChecklistEligibility()`.
  - Nếu `isLate` là true và trạng thái ca không phải là `submitted`, thì:
    - Hiển thị thông báo đỏ: `⚠️ Đã quá thời hạn điền ca này (tối đa 12h sau khi kết thúc)`.
    - Không render `.btn-submit-glow`.
    - Lặp qua tất cả thẻ input và gắn thuộc tính `disabled = true`.
- **Verification**: Test mở "Ca Sáng" của hôm qua để xem form có bị khoá cứng và ẩn nút không.

---

## 📝 Task 3: Tối ưu hoá thao tác chọn Ca
- **Mục tiêu**: Bấm "⛳ Golf (Sáng)" từ ứng dụng Nhật Ký mở thẳng ra Checklist Ca Sáng của ngày hợp lệ.
- **File**: `nhatky/index.html` và `sangolf/index.html`.
- **Cách thực hiện**:
  - Sửa HTML ở `nhatky/index.html` để nút "⛳ Golf (Sáng)" trỏ về URL: `../sangolf/index.html?auto=ca_sang`. (Bỏ đi bước tạo Plan).
  - Ở `sangolf/index.html`, tại sự kiện `DOMContentLoaded`, check `URLSearchParams` lấy tham số `auto`.
  - Dùng logic ở Task 1 để tính xem ca này thuộc về Hôm nay hay Hôm qua (ví dụ lúc 01:00 đêm bấm Ca Tối thì phải lùi ngày về Hôm qua vì Hôm nay chưa tới Ca Tối).
  - Tự động đổi `datePicker.value` và gọi hàm `openRun('ca_sang')`.
- **Verification**: Truy cập `sangolf/index.html?auto=ca_sang`, kiểm tra xem nó có tự load và hiển thị modal ca sáng không.

---

## 📝 Task 4: Cập nhật E2E Tests (Playwright)
- **Mục tiêu**: Đảm bảo logic 12h không làm gãy các bài test cũ.
- **File**: `tests/golf-checklist.spec.js`.
- **Cách thực hiện**:
  - Vì E2E chạy trong khoảng thời gian có thể bất kỳ, ta cần mock thời gian hệ thống trong `page.evaluate` hoặc đảm bảo dữ liệu test tạo ra ca có `endTime` xa trong tương lai để luôn được phép điền.
- **Verification**: `npx playwright test tests/golf-checklist.spec.js` PASS 100%.
