# Kế hoạch triển khai màn Hiện trạng bơm

1. RED: thêm test backend yêu cầu route/handler `getPumpStatuses` và kết quả mới nhất theo từng bơm.
2. RED: thêm test client cho chuẩn hóa, đếm, đánh dấu dữ liệu cũ và sắp xếp trạng thái.
3. RED: cập nhật E2E Checklist, yêu cầu không còn “Check Bơm” và có link “Hiện trạng bơm”.
4. GREEN: tách helper đọc danh mục bơm, thêm handler tổng hợp trong `02_Router.gs`.
5. GREEN: tạo `js/pump-status.js` và `pump_status.html` với cache/offline.
6. GREEN: thay CTA trong `nhatky/index.html`, bỏ helper URL Check Bơm không còn dùng.
7. REFACTOR: kiểm tra accessibility, vùng chạm và trạng thái loading/error/stale.
8. Verify: Node tests, E2E desktop/mobile, `git diff --check` và review độc lập.
