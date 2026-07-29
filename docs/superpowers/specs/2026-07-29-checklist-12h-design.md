# Thiết Kế: Tối Ưu Quá Trình Chọn Checklist & Chính Sách Nộp Muộn 12h

## 1. Yêu cầu & Bối cảnh
- **Yêu cầu 1**: Nhân viên tại thời điểm thực hiện checklist vào là có thể chọn ngay (đơn giản, ít thao tác).
- **Yêu cầu 2**: Cho phép điền muộn tối đa 12 tiếng so với thời gian kết thúc ca.

*Bối cảnh hiện tại:* 
Người dùng phải mở `Nhatky`, nhấn nút shortcut sinh ra Plan, sau đó bấm `Điền Form Checklist` để mở `sangolf/index.html`. Trong trang Checklist, người dùng phải tự chọn ngày (mặc định là hôm nay) rồi bấm chọn Ca. Quá trình này rườm rà và không kiểm soát thời hạn nộp muộn.

## 2. Phân tích & Giải pháp (Brainstorming)

### Vấn đề 1: Tối ưu & Đơn giản thao tác
- Thay vì bắt người dùng đi đường vòng qua Nhật Ký, các nút tắt ở Nhật Ký (ví dụ: `⛳ Golf (Sáng)`) nên **dẫn thẳng** tới `sangolf/index.html` với URL parameter chỉ định rõ `templateId` (vd: `?autoTemplate=ca_sang`).
- Khi mở `sangolf/index.html`, nếu URL có `autoTemplate`, hệ thống sẽ **tự động mở luôn form của ca đó** cho ngày hợp lệ gần nhất mà không cần người dùng thao tác thêm.

### Vấn đề 2: Xác định ca hợp lệ (Đúng giờ & Muộn tối đa 12h)
Để biết có được phép điền hay không, Frontend cần biết **thời gian kết thúc ca (End Time)**.
- **Phương pháp đề xuất**: Parse thời gian từ tên Template. 
  Ví dụ: `Ca Sáng (5h00 - 13h00)` -> `endTime = 13:00`.
- **Quy tắc cho phép nộp (Allow Submit)**:
  - Cho phép điền muộn tối đa 12 tiếng sau khi kết thúc: `now <= endTime + 12h`.
- **Xử lý giao diện (UI)**:
  - Khi xem một form, nếu `now > endTime + 12h`, form sẽ chuyển sang trạng thái **Read-only** (Vô hiệu hoá input, Ẩn nút "CHỐT CA"). Sẽ có thông báo cảnh báo "Đã quá hạn 12h, không thể điền".

## 3. Kiến trúc kỹ thuật

### Mảng 1: Routing & Tự động mở form (`sangolf/index.html`)
- Khi trang load, kiểm tra `URLSearchParams` để lấy `autoTemplate`.
- Cần tự động tính toán `Date` hợp lệ: Nếu giờ hiện tại là 01:00 AM, và template là `Ca Tối (13h00 - 21h00)`, thì ca này thuộc về **Ngày hôm qua**, hệ thống phải tự lùi `selectedDate` về hôm qua. Sau đó gọi `openRun(templateId)`.

### Mảng 2: Parser Thời gian (Logic kiểm tra hạn)
Hàm helper `checkShiftEligibility(templateName, selectedDate)`:
1. Parse regex: `/\((\d{1,2})h(\d{2})\s*-\s*(\d{1,2})h(\d{2})\)/`
2. Tạo Date object cho `startTime` và `endTime` của ngày `selectedDate`. (Lưu ý xử lý ca đêm lố giờ sang ngày hôm sau).
3. Kiểm tra `now > endTime + 12h`.
4. Trả về trạng thái để `renderRun` quyết định ẩn/hiện nút "Chốt Ca" và vô hiệu hoá input.

## 4. Chốt phương án
1. **Frontend Parser**: Viết hàm xử lý giới hạn 12h tại `sangolf/index.html`.
2. **Auto-open**: Trang sangolf sẽ tự tính ngày (hôm nay/hôm qua) dựa vào logic 12h và mở form ngay lập tức.
3. **UI Enforcement**: Khoá giao diện nhập liệu nếu trễ quá 12h.
