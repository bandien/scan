# Prompt sửa Nhật ký & Checklist đa nhân viên

Bạn là AI coding agent chịu trách nhiệm sửa ứng dụng **Nhật ký & Checklist Vận hành** đang chạy tại:

- Production: `https://bandien.github.io/scan/nhatky/`
- Workspace dự kiến: `C:\codex\scan\bandien-scan`

Hãy điều tra, thiết kế, triển khai và kiểm thử đầy đủ các sửa đổi bên dưới. Không được chỉ viết báo cáo hoặc mock giao diện.

## 1. Lưu ý bắt buộc trước khi sửa

Giao diện production hiện có tiêu đề **“Nhật Ký & Checklist Vận Hành”**, bốn tab **Checklist / Nhật ký / Báo cáo / Cá nhân**, phiên bản hiển thị `2.1.0`, lưu dữ liệu bằng các khóa như `app_profile`, `app_tasks`, `app_logs`.

Trong lần kiểm tra gần nhất, file `nhatky/index.html` ở workspace cục bộ không trùng với mã đang chạy trên GitHub Pages. Vì vậy:

1. Xác định chính xác repository, branch, thư mục và workflow đang phát hành URL production.
2. Không sửa nhầm giao diện legacy.
3. Ghi lại bằng chứng ánh xạ giữa mã nguồn và bản production trước khi triển khai.
4. Đọc và tuân thủ toàn bộ `AGENTS.md`; áp dụng TDD: RED → GREEN → REFACTOR → chạy toàn bộ test.
5. Không xóa hoặc ghi đè thay đổi không liên quan đang có trong worktree.

## 2. Danh sách nhân viên hiện hành

Tổ cơ điện Hòa Bình hiện chỉ còn bốn người:

1. Ngô Quyết Thắng
2. Đinh Văn Hậu
3. Hoàng Việt Hoàng
4. Nguyễn Đức Phong

**Bùi Hồng Quân và Nguyễn Đình Thủy đã nghỉ việc.** Không đưa hai người này vào danh sách lựa chọn, dữ liệu mẫu, phân ca hoặc báo cáo mới. Nếu cần bảo toàn dữ liệu lịch sử, phải đánh dấu tài khoản `inactive` thay vì xóa lịch sử đã phát sinh.

Không tự đặt mã nhân viên thật. Nếu chưa có mã chính thức trong nguồn dữ liệu, dùng ID nội bộ ổn định do hệ thống sinh và hiển thị rõ rằng mã nhân sự cần được quản trị viên cấu hình.

## 3. Kết quả kiểm thử hiện tại

Khi lần lượt đổi hồ sơ và ghi checklist/nhật ký cho nhiều người trên cùng thiết bị, phát hiện:

- Checklist và nhật ký dùng chung cho mọi hồ sơ.
- Nhật ký không lưu người tạo.
- Checklist không lưu người hoàn thành và thời điểm hoàn thành.
- Đổi hồ sơ chỉ đổi tên trên báo cáo; toàn bộ dữ liệu cũ bị quy cho người được chọn cuối cùng.
- Dữ liệu không tách theo ngày và ca trực.
- Người dùng có thể tự nhập tên, mã nhân viên và ca trực tùy ý, không có xác thực hoặc danh sách nhân sự chuẩn.
- Một đầu việc đã hoàn thành có thể bị mở lại chỉ bằng một lần chạm, không có lịch sử thay đổi.
- Tên chứa hậu tố trong ngoặc tạo avatar sai, ví dụ `Nguyễn Đình Thủy (Montana)` thành `T(`.
- Báo cáo báo tổng số nhật ký lớn hơn số mục chi tiết vì chỉ hiện năm bản ghi gần nhất nhưng không nói rõ.
- Dữ liệu chỉ nằm trong `localStorage`, không có cơ chế đồng bộ/tổng hợp giữa các thiết bị.
- Các nút xóa checklist/nhật ký không có accessible name và dễ bấm nhầm.
- Production tải Tailwind qua `cdn.tailwindcss.com` và phát cảnh báo không phù hợp cho production.

## 4. Mục tiêu nghiệp vụ bắt buộc

### P0 — Đúng người, đúng ca, đúng dữ liệu

Thiết kế mô hình dữ liệu tối thiểu:

- `employees`: `id`, `fullName`, `employeeCode`, `status`, `role`.
- `shifts`: `id`, `date`, `shiftType`, `startedAt`, `endedAt`, `employeeId`, `status`.
- `tasks`: `id`, `shiftId`, `title`, `category`, `priority`, `status`, `createdBy`, `createdAt`, `updatedAt`.
- `taskEvents`: `id`, `taskId`, `action`, `actorId`, `occurredAt`, `note`.
- `logs`: `id`, `shiftId`, `employeeId`, `content`, `status`, `area`, `createdAt`, `updatedAt`.

Yêu cầu hành vi:

1. Mỗi bản ghi phải gắn với nhân viên, ngày và ca trực cụ thể.
2. Đổi nhân viên/ca không được làm dữ liệu của ca trước biến thành dữ liệu của người mới.
3. Báo cáo chỉ tổng hợp đúng ca đang chọn; báo cáo nhiều người phải hiển thị rõ người thực hiện từng mục.
4. Hoàn thành hoặc mở lại checklist phải tạo sự kiện audit gồm người thao tác và thời gian.
5. Mở lại công việc đã hoàn thành phải có bước xác nhận và lý do ngắn.
6. Không cho nhập tự do danh tính ở màn hình vận hành. Chọn từ danh sách nhân sự active hoặc đăng nhập bằng tài khoản được cấp.
7. Nhân viên inactive không được chọn cho ca mới nhưng dữ liệu lịch sử vẫn xem được.

### P0 — Migration an toàn

Dữ liệu phiên bản cũ không có thông tin người tạo. Không được tự động quy toàn bộ dữ liệu legacy cho hồ sơ đang chọn.

Hãy triển khai migration có phiên bản:

- Sao lưu dữ liệu cũ trước khi chuyển đổi.
- Đánh dấu bản ghi thiếu nguồn gốc là `legacy-unattributed` hoặc yêu cầu người quản trị phân loại.
- Migration phải idempotent, chạy lại không nhân đôi dữ liệu.
- Có đường khôi phục khi migration thất bại.
- Không xóa dữ liệu lịch sử của nhân viên đã nghỉ.

### P1 — Đồng bộ và offline

Giữ trải nghiệm offline-first nhưng bổ sung lớp repository rõ ràng để có thể đồng bộ với backend hiện có của dự án.

- Không gọi trực tiếp `localStorage` rải rác trong UI.
- Có hàng đợi thao tác offline, ID ổn định và trạng thái đồng bộ.
- Xử lý xung đột theo quy tắc được tài liệu hóa; không silently overwrite.
- Hiển thị trạng thái `Đã lưu trên máy / Đang đồng bộ / Đồng bộ lỗi`.
- Nếu backend production chưa sẵn sàng, hoàn thành interface, local adapter và test; không giả vờ rằng dữ liệu đã đồng bộ máy chủ.

### P1 — Báo cáo

- Báo cáo ca phải hiện tên/mã nhân viên, ngày, ca, tiến độ và toàn bộ nhật ký thuộc ca đó.
- Nếu chỉ xem trước 5 mục, ghi rõ `5/N mục gần nhất` và có nút xem toàn bộ.
- Các mục cần theo dõi phải có người phụ trách và trạng thái bàn giao.
- Nội dung sao chép phải khớp hoàn toàn với dữ liệu đang hiển thị.

### P2 — UX, accessibility và production hygiene

- Sinh avatar từ họ tên sau khi loại bỏ hậu tố trong ngoặc; với tên Việt Nam phải cho kết quả ổn định.
- Thêm `aria-label` cho nút sửa/xóa/đóng và vùng thông báo phù hợp.
- Nút xóa cần xác nhận, nêu rõ đối tượng sẽ bị xóa; ưu tiên soft-delete hoặc undo.
- Không dùng Tailwind CDN ở production. Build CSS tĩnh/minified theo toolchain của repo.
- Không làm giảm khả năng sử dụng trên màn hình điện thoại và khi mất mạng.

## 5. Tiêu chí nghiệm thu bắt buộc

Viết test tự động chứng minh ít nhất các kịch bản sau:

1. Ngô Quyết Thắng hoàn thành task A và ghi log A ở Ca 1.
2. Chuyển sang Đinh Văn Hậu ở Ca 2: không thấy task A trong danh sách của ca mới trừ khi đang xem lịch sử/báo cáo chung.
3. Báo cáo Ca 1 ghi đúng Ngô Quyết Thắng; báo cáo Ca 2 ghi đúng Đinh Văn Hậu.
4. Hoàng Việt Hoàng mở lại một task đã hoàn thành: hệ thống yêu cầu xác nhận/lý do và audit lưu đúng người, đúng thời gian.
5. Nguyễn Đức Phong ghi nhật ký khi offline, tải lại trang vẫn còn dữ liệu; khi kết nối lại, hàng đợi được xử lý đúng một lần.
6. Chuyển hồ sơ không thay đổi `employeeId` của bản ghi đã tồn tại.
7. Dữ liệu legacy không có tác giả không bị gán cho người đăng nhập hiện tại.
8. Nhân viên inactive không xuất hiện trong lựa chọn ca mới nhưng lịch sử của họ vẫn truy cập được.
9. Báo cáo `N` nhật ký hiển thị đủ `N`, hoặc ghi rõ khi chỉ preview một phần.
10. Mọi nút chỉ có biểu tượng đều có accessible name.
11. Reload, đổi tab, tìm kiếm và lọc checklist không làm mất hoặc đổi dữ liệu.
12. Console production không còn cảnh báo Tailwind CDN và không có JavaScript error.

Chạy cả unit test, migration test và end-to-end test ở kích thước mobile. Không tuyên bố hoàn tất nếu chưa cung cấp lệnh chạy và output cho thấy tất cả test pass.

## 6. Deliverables

Agent phải bàn giao:

1. Root-cause analysis ngắn gọn cho từng lỗi P0.
2. Design spec trong `docs/superpowers/specs/`.
3. Implementation plan trong `docs/superpowers/plans/`.
4. Code và migration theo TDD.
5. Test unit/integration/E2E.
6. Hướng dẫn triển khai và rollback.
7. Bằng chứng production sau triển khai: URL, commit SHA, ảnh hoặc DOM assertion cho bốn luồng nhân viên active.
8. Danh sách giới hạn còn lại; không che giấu phần chưa có backend hoặc chưa đồng bộ.

## 7. Quy tắc tránh làm sai

- Không hardcode dữ liệu nghiệp vụ vào nhiều vị trí.
- Không lưu tên người thay cho ID ổn định.
- Không gán dữ liệu legacy cho người đang mở ứng dụng.
- Không xóa lịch sử của nhân viên nghỉ việc.
- Không thay đổi production trước khi test và có kế hoạch rollback.
- Không sửa nhầm bản `nhatky` legacy nếu nó không phải nguồn GitHub Pages hiện tại.
- Không coi việc đổi dòng chữ tên nhân viên trên báo cáo là đã sửa phân quyền dữ liệu.

Hãy bắt đầu bằng việc xác định nguồn deploy thật, tái hiện lỗi bằng test thất bại và trình bày root cause. Sau đó triển khai lần lượt P0 → P1 → P2, xác minh đầy đủ trước khi bàn giao.
