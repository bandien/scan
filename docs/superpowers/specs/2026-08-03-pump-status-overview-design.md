# Thiết kế màn Hiện trạng bơm

## Kết luận rà soát

Checklist Golf đã có các hạng mục vận hành bơm theo ca:

- Ca sáng: A08 “Vận hành bơm tăng áp sinh hoạt CLH”, A11 “Kiểm tra + Vận hành bơm hồ”.
- Ca tối: A08 “Kiểm tra + Vận hành bơm hồ”.

Vì vậy nút “Check Bơm” độc lập trong thẻ Checklist gây trùng luồng. Tab Checklist chỉ giữ hành động “Làm Checklist Golf”. Vị trí hành động thứ hai được đổi thành “Hiện trạng bơm”, phục vụ quan sát chứ không tạo thêm checklist.

## Màn Hiện trạng bơm

Tạo `pump_status.html` với mục tiêu trả lời trong vài giây:

1. Có bao nhiêu bơm đang chạy, đang dừng và chưa có dữ liệu.
2. Bơm cụ thể nào đang chạy.
3. Lần bật/tắt gần nhất, người thao tác và thời điểm cập nhật.
4. Dữ liệu nào đã cũ và cần xác minh tại hiện trường.

Danh sách mặc định xếp bơm đang chạy trước, sau đó đang dừng và chưa có dữ liệu. Có tìm kiếm, lọc trạng thái và nút tải lại. Màn này chỉ đọc, không mở lại biểu mẫu Check Bơm để tránh tái tạo luồng trùng với Checklist Golf.

## API

Thêm GET `getPumpStatuses` đọc một lần danh mục `Pumps` và một lần `MeterReadings`, lấy sự kiện có timestamp nghiệp vụ mới nhất của từng `PUMP_<id>` (không dựa vào thứ tự dòng, vì dữ liệu có thể đồng bộ trễ).

Response:

```json
{
  "status": "success",
  "generatedAt": "ISO-8601",
  "items": [{
    "id": "1",
    "name": "...",
    "source": "...",
    "flowRate": 244,
    "state": "RUNNING",
    "lastEvent": {
      "action": "START",
      "timestamp": "ISO-8601",
      "operator": "..."
    }
  }]
}
```

Không có sự kiện hợp lệ trả `state: "UNKNOWN"` và `lastEvent: null`. Frontend đánh dấu dữ liệu cũ khi sự kiện cuối quá 12 giờ; nhãn này chỉ cảnh báo độ tin cậy, không tự đổi `RUNNING` thành `STOPPED`.

## Offline

Response thành công được cache theo địa chỉ backend trong `localStorage`. Khi API lỗi, màn hình dùng cache và ghi rõ thời điểm dữ liệu; nếu chưa có cache, hiển thị lỗi và cho phép tải lại.

## Tiêu chí chấp nhận

1. Tab Checklist không còn CTA “Check Bơm”.
2. CTA “Hiện trạng bơm” mở màn tổng quan mới.
3. API chỉ đọc bảng tính hai lần, không gọi riêng từng bơm.
4. Màn hình hiển thị đúng tổng đang chạy/dừng/chưa có dữ liệu và xếp đang chạy lên đầu.
5. Lọc, tìm kiếm và tải lại hoạt động trên mobile; không tràn ngang, mục bấm cao tối thiểu 44px.
6. Dữ liệu cũ hoặc offline được gắn nhãn rõ, không trình bày như trạng thái thời gian thực chắc chắn.
