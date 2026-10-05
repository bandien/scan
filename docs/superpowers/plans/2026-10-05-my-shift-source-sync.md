# Kế hoạch Ca của tôi

1. Viết kiểm thử thất bại trong `tests/my-shift-source.test.js` và `tests/my-shift-dashboard.spec.js`: lịch nguồn, ghép người, ranh giới qua đêm, nghỉ/chưa phân công, nguồn lỗi và cache. Kiểm chứng: `node --test tests/my-shift-source.test.js`; `npx playwright test tests/my-shift-dashboard.spec.js --reporter=dot`.
2. Tạo `nhatky/my-shift.js`: đọc nguồn HTML với `DOMParser`, tuần theo ngày đầy đủ, tên chính xác và thời gian Việt Nam. Ví dụ nguồn tuần: `{startDate, endDate, weekLabel, members:[{name, team, days}]}`. Chạy kiểm thử ở bước 1.
3. Thêm vùng Ca của tôi đứng đầu `nhatky/index.html`, nút đồng bộ, ngày xem, lịch bảy ngày và trạng thái; nối đăng nhập/khôi phục phiên/đổi ngày/quay lại tab. Không thêm các phương án kết hợp. Kiểm chứng Playwright và screenshot desktop/mobile.
4. Đối chiếu nguồn thật, kiểm thử nhóm hẹn giờ hiện có và `git diff --check`; sửa lỗi trong phạm vi thay đổi.
5. Commit, PR, hợp nhất và theo dõi GitHub Pages; kiểm tra website công khai và nguồn live.
