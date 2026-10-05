# Ca của tôi: đồng bộ lịch phân ca

## Phạm vi đã chốt
Sau đăng nhập mở dashboard mang tên “Ca của tôi”. Bước này chỉ lấy lịch phân ca của tài khoản, lịch bảy ngày và trạng thái đồng bộ. Chưa bổ sung học việc, hướng dẫn từng bước hoặc sinh công việc định kỳ.

## Nguồn và đối chiếu
Trang nguồn: https://amd500.tail030e1.ts.net/shifts. CMMS đọc `/api/shifts/gsheet?weekOffset=0`, nhưng API yêu cầu phiên đăng nhập và không cung cấp CORS cho GitHub Pages. Google Sheet chung là `1d_dbPMeToPfP86rRJVoB_BF15J4xh912jVfcjcagxXs`, tab `36044768`. Đã đối chiếu tuần 41 (05–11/10/2026) cho Ngô Quyết Thắng, Đinh Văn Hậu, Hoàng Việt Hoàng, Nguyễn Đức Phong với bảng CMMS trong phiên Chrome được cấp quyền.

Đọc HTML public của Sheet bằng fetch không gửi cookie. Nguồn trả CORS cho `https://bandien.github.io`. Không dùng gviz toàn bảng vì suy đoán kiểu dữ liệu làm mất ký hiệu x trong cột có nhiều số tổng hợp. Giữ thứ tự ô Ca 3, Ca 1, Ca 2 như bảng CMMS. Giữ nguyên ký hiệu tx, không tự diễn giải ý nghĩa nghiệp vụ.

## Hành vi
- Ghép đúng họ tên đầy đủ (Unicode và khoảng trắng), ưu tiên tổ cơ điện sân golf. Không ghép tên gần giống, không chọn tùy tiện khi trùng tên, không thay đổi tài khoản/nhân sự.
- Tự đọc sau đăng nhập, khi mở lại trang, định kỳ năm phút và khi quay lại tab. Nút đồng bộ hỗ trợ lấy lại ngay. Cache nguồn hợp lệ để xem khi lỗi mạng, với cảnh báo và thời điểm lấy rõ ràng.
- Hiện đủ ca, HC, nghỉ, phép, ký hiệu khác; ô trống là chưa phân công, không coi là nghỉ.
- Ca 3 qua nửa đêm thuộc ngày bắt đầu ca, dùng múi giờ Việt Nam. Khi còn trong ca đêm hôm trước, chỉ rõ ngày trực.
- Lịch cập nhật lựa chọn ca nội bộ của đúng tài khoản theo lịch. Bản lưu được đánh dấu trên cả thẻ và tên ca; khi chưa có nguồn, không giữ ca cũ hoặc suy ca theo đồng hồ làm ca được phân công.
- Không sửa ma trận lịch tự xếp trước đây và không ghi lịch ngược lên CMMS/Sheet.
- Dashboard đặt thông tin cá nhân/ca và lịch tuần trước các mục tra cứu hiện có.

## Kiểm chứng
TDD cho ghép tên, nguồn lỗi, nghỉ/chưa phân công, lịch nhiều ca, qua nửa đêm, chuyển tài khoản, thay đổi lịch và mất mạng. Playwright trên Chromium/mobile; đối chiếu lại với nguồn live và xác nhận Pages triển khai.

Kết quả trước triển khai: 9 kiểm thử Node và 34 kiểm thử Playwright đạt; `git diff --check` sạch. Bộ đọc HTML thật giữ đúng tuần 36–41, ngày 05–11/10 và đủ 21 ô lịch của cả bốn nhân viên khi đối chiếu CMMS. Dòng tên tổ có cột tổng hợp bằng 0 ngoài vùng lịch; chỉ xét vùng lịch để nhận diện tổ. Đã kiểm tra ảnh desktop/mobile.
