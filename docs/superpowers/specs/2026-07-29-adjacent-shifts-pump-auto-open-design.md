# Thiết kế hai ca liền kề và auto-open Check Bơm

## Quyết định

Tab Checklist hiển thị hai ngữ cảnh nghiệp vụ quanh thời điểm hiện tại:

- Ca liền trước.
- Ca liền sau.

Mỗi thẻ có ngày nghiệp vụ, tên ca và hai hành động Golf/Bơm.

Golf mở trực tiếp checklist ca vì một ca tương ứng một run. Bơm không thể mở một tờ
thiết bị cụ thể khi chưa có `pumpId`; nó mở màn hình chọn/quét bơm với `shift` và `date`
được điền sẵn. Sau khi nhân viên chọn máy, `pump_info` mở form check của máy đó.

## Quy tắc thời gian

- 05:00–12:59: ca hiện tại là sáng; trước là tối ngày hôm trước, sau là tối hôm nay.
- 13:00–23:59: ca hiện tại là tối; trước là sáng hôm nay, sau là sáng ngày mai.
- 00:00–04:59: vẫn thuộc ca tối của ngày nghiệp vụ hôm trước; trước là sáng hôm trước,
  sau là sáng hôm nay.

Ngày được truyền rõ trong URL, không để trang đích tự suy luận lại.

## Tiêu chí chấp nhận

1. Bấm Checklist thấy đúng hai thẻ ca liền trước/liền sau.
2. Golf nhận `autoTemplate` và `date`.
3. Bơm nhận `autoCheck=1`, `shift`, `date`, hiển thị ngữ cảnh ca và focus chọn mã bơm.
4. Không còn thông báo “Tính năng trạm bơm chưa hỗ trợ auto-open”.

