# Phân tích nghiệp vụ vòng đời Checklist ca vận hành

Ngày: 2026-07-29  
Phạm vi: Checklist vận hành theo ca, trước mắt áp dụng cho Sân Golf.

## 1. Mục tiêu nghiệp vụ

Checklist không chỉ là một biểu mẫu cần điền. Đây là hồ sơ nối tiếp trách nhiệm giữa
hai ca. Một ca hợp lệ phải tạo được chuỗi bằng chứng:

1. Nhân viên đọc kết quả và nội dung bàn giao của ca trước.
2. Nhân viên xác nhận đã nhận hiện trạng và trách nhiệm.
3. Nhân viên bắt đầu ca của mình.
4. Nhân viên thực hiện từng hạng mục và ghi nhật ký/sự cố.
5. Nhân viên lập nội dung bàn giao cho ca kế tiếp.
6. Nhân viên chốt phần việc của mình; ca chỉ hoàn tất toàn vòng khi người kế tiếp xác nhận.

Nguyên tắc trách nhiệm: không được có khoảng trống giữa “ca trước kết thúc thao tác” và
“ca sau nhận trách nhiệm”.

## 2. Vai trò

### Nhân viên ca trước

- Thực hiện checklist và ghi nhận số đo, đạt/không đạt, ghi chú, sự cố.
- Nêu rõ việc còn tồn, thiết bị đang chạy, cảnh báo và yêu cầu ca sau.
- Chốt bàn giao; sau khi chốt không được âm thầm sửa nội dung.

### Nhân viên ca sau

- Xem đầy đủ bản tóm tắt ca trước trước khi nhận ca.
- Xác nhận nhận bàn giao hoặc từ chối/yêu cầu làm rõ.
- Sau khi nhận, chịu trách nhiệm cho ca mới và thực hiện checklist của ca đó.

### Tổ trưởng/Quản lý

- Theo dõi ca chưa chốt, bàn giao chưa nhận, mục không đạt và ca trễ.
- Can thiệp nhận ca thay trong trường hợp ngoại lệ, nhưng phải có lý do và audit log.
- Mở lại hồ sơ đã chốt chỉ qua thao tác có quyền và bắt buộc ghi lý do.

## 3. Đơn vị dữ liệu

Một `ShiftRun` đại diện cho một loại ca tại một ngày nghiệp vụ:

- `runId`, `templateId`, `businessDate`, `shiftCode`
- `status`, `version`
- `operatorId`, `operatorName`, `startedAt`
- `previousRunId`, `receivedBy`, `receivedAt`, `receiveDecision`, `receiveNote`
- `items`, `completionCount`, `violationCount`
- `journal`, `incidents`
- `handoverNote`, `handoverTo`, `submittedAt`
- `confirmedBy`, `confirmedAt`
- `createdAt`, `updatedAt`, `updatedBy`

Danh tính phải lấy từ phiên đăng nhập; tên nhập tay chỉ là phương án tương thích cũ,
không đủ làm bằng chứng trách nhiệm.

## 4. Máy trạng thái đề xuất

| Trạng thái | Ý nghĩa | Ai được chuyển | Trạng thái kế |
|---|---|---|---|
| `not_started` | Chưa có lượt ca | Nhân viên đúng ca | `receiving` hoặc `in_progress` |
| `receiving` | Đang xem bàn giao ca trước | Nhân viên ca sau | `in_progress` hoặc `handover_disputed` |
| `handover_disputed` | Từ chối/yêu cầu làm rõ bàn giao | Ca sau/Quản lý | `receiving` |
| `in_progress` | Đã nhận ca, đang thực hiện | Người nhận ca | `ready_to_handover` |
| `ready_to_handover` | Đã đủ điều kiện chốt | Người thực hiện | `submitted` |
| `submitted` | Đã bàn giao, chờ ca sau nhận | Ca sau | `confirmed` hoặc `handover_disputed` |
| `confirmed` | Ca sau đã nhận; hồ sơ ca trước đóng hoàn toàn | Hệ thống | Kết thúc |
| `reopened` | Quản lý mở lại có lý do | Quản lý | `in_progress` |

Để tương thích dữ liệu cũ, `draft` được ánh xạ thành `in_progress`. Trạng thái
`submitted` hiện tại có nghĩa “người ca trước đã chốt thao tác”, chưa phải hoàn tất
trách nhiệm liên ca. `confirmed` mới là đóng vòng đời.

## 5. Luồng chuẩn

### Bước A — Vào ca và xem ca trước

Hệ thống xác định ca hiện tại theo lịch phân ca và thời gian, không chỉ theo đồng hồ
thiết bị. Màn hình đầu tiên hiển thị:

- Người thực hiện, thời điểm chốt và thời điểm cập nhật cuối của ca trước.
- Tổng số mục, số mục không đạt/vượt ngưỡng/chưa hoàn thành.
- Sự cố, việc còn dang dở, thiết bị đang chạy và người được bàn giao.
- Các thay đổi sau lần xem gần nhất, nếu có.

Không được che nội dung ca trước sau một nút nhỏ hoặc để người dùng bắt đầu checklist
mới mà chưa đưa ra quyết định nhận bàn giao.

### Bước B — Xác nhận nhận ca

Nhân viên chọn một trong hai quyết định:

- `Xác nhận nhận ca`: ghi người nhận, thời gian server, liên kết `previousRunId`, đồng
  thời đóng ca trước thành `confirmed` và mở ca hiện tại thành `in_progress`.
- `Yêu cầu làm rõ`: bắt buộc nhập lý do, giữ ca trước ở trạng thái tranh chấp và cảnh báo
  ca trước/quản lý. Người dùng có thể ghi nhận kiểm tra an toàn khẩn cấp nhưng không được
  làm mất dấu tranh chấp.

Hai cập nhật “đóng ca trước” và “mở ca mới” phải là một giao dịch logic duy nhất để
không tạo khoảng trống hoặc nhận trùng.

### Bước C — Thực hiện checklist

- Mỗi hạng mục ghi giá trị, trạng thái, ghi chú, thời gian và người cập nhật.
- Autosave local-first và đồng bộ theo phiên bản.
- Mục không đạt hoặc vượt ngưỡng bắt buộc có ghi chú xử lý; mức nghiêm trọng có thể tạo
  sự cố/công việc nhưng không được âm thầm bỏ qua.
- Hệ thống hiển thị tiến độ, trạng thái đồng bộ và dữ liệu nào còn nằm trong hàng đợi.
- Khi đổi thiết bị hoặc có hai người cùng thao tác, dùng `version` để phát hiện xung đột,
  không dùng cơ chế “ghi sau thắng”.

### Bước D — Ghi nhật ký trong ca

Nhật ký là dòng thời gian, không chỉ là một ô văn bản cuối biểu mẫu:

- Thời gian, tác giả, loại sự kiện.
- Nội dung quan sát/hành động.
- Liên kết hạng mục checklist hoặc sự cố, ảnh/tài liệu nếu có.
- Trạng thái đã xử lý/chưa xử lý và yêu cầu ca sau.

Nhật ký đã đồng bộ không được sửa mất dấu; chỉnh sửa tạo phiên bản/audit entry.

### Bước E — Bàn giao và chốt thao tác ca

Trước khi chốt, hệ thống trình bản rà soát:

- Mục đã làm/tổng số, mục bắt buộc còn thiếu.
- Mục không đạt, vượt ngưỡng, sự cố chưa xử lý.
- Nhật ký và việc phải chuyển tiếp.
- Người/ca dự kiến nhận.

Quy tắc:

- Không cho chốt nếu thiếu mục bắt buộc, trừ quyền quản lý và lý do override.
- Mục không đạt bắt buộc có hướng xử lý hoặc nội dung bàn giao.
- Bấm `Bàn giao & kết thúc phần việc` chuyển sang `submitted`, khóa chỉnh sửa thường,
  ghi thời gian server và gửi cảnh báo cho ca sau.
- Ca trước chỉ đạt `confirmed` sau khi ca sau nhận. Nếu quá hạn chưa nhận, hệ thống cảnh
  báo quản lý; không tự xác nhận.

## 6. Ngoại lệ bắt buộc

### Không có dữ liệu ca trước

Cho phép `Bắt đầu ca không có bàn giao`, nhưng bắt buộc chọn lý do: ca đầu tiên, nghỉ vận
hành, mất dữ liệu hoặc quản lý cho phép. Sự kiện phải vào audit log.

### Ca trước chưa chốt

Ca sau thấy trạng thái “ca trước chưa bàn giao”. Có thể yêu cầu ca trước chốt hoặc dùng
quy trình tiếp quản khẩn cấp có quản lý xác nhận.

### Người nhận khác `handoverTo`

Cho phép nếu thuộc đúng nhóm/quyền; ghi rõ người dự kiến và người thực nhận.

### Offline

- Cho phép xem bản ca trước đã cache và thực hiện checklist local.
- Quyết định nhận ca, chốt ca và xác nhận bàn giao được xếp hàng với idempotency key.
- UI phải ghi rõ `Chờ đồng bộ`; không hiển thị `Đã xác nhận/Đã chốt trên hệ thống` trước
  khi server chấp nhận.
- Khi hai người cùng nhận offline, server chỉ chấp nhận giao dịch đầu tiên; giao dịch sau
  thành xung đột cần quản lý xử lý.

### Sai ngày qua nửa đêm

Dùng `businessDate` và cấu hình khung giờ ca từ backend. Không suy luận ngày nghiệp vụ
chỉ bằng tên mẫu hoặc giờ trên thiết bị người dùng.

## 7. Quyền và kiểm soát bảo mật

- Backend tự xác định người dùng từ phiên/token; không tin `operator` hoặc `confirmedBy`
  do frontend gửi lên.
- Chỉ người thuộc nhóm ca hoặc quản lý được nhận/chốt.
- Người đã chốt không thể tự xác nhận bàn giao cho chính mình, trừ override có lý do.
- Mọi chuyển trạng thái ghi audit log: trước/sau, người thực hiện, thời gian server,
  thiết bị/phiên, lý do.
- API kiểm tra trạng thái hiện tại và `version` trước khi cập nhật để chống gọi lặp và
  ghi đè.

## 8. Đánh giá hệ thống hiện tại

### Đã có

- Mẫu checklist, lưu draft local, autosave backend.
- Ba trạng thái `draft`, `submitted`, `confirmed`.
- Ghi người làm, thời gian bắt đầu/chốt/xác nhận, nội dung và người nhận bàn giao.
- Khóa frontend khi `submitted/confirmed`, cảnh báo mục không đạt và ngưỡng.

### Khoảng trống

1. Có thể mở và thực hiện ca mới mà chưa xem/xác nhận ca trước.
2. Xác nhận hiện chỉ đổi trạng thái ca trước, không tạo/mở ca mới trong cùng giao dịch.
3. Không có quyết định từ chối/yêu cầu làm rõ bàn giao.
4. Backend cho phép sửa lượt `submitted`; chỉ chặn `confirmed`.
5. Backend submit chưa kiểm tra trạng thái nguồn, mục bắt buộc, người thực hiện hoặc
   xung đột phiên bản.
6. Danh tính lấy từ chuỗi frontend, có thể giả mạo.
7. Nhật ký sự cố hiện là trường text, chưa phải timeline có audit.
8. Offline queue chưa định nghĩa giao dịch nhận/chốt ca có idempotency và xử lý xung đột.
9. Khung giờ/ngày nghiệp vụ đang suy luận ở frontend.
10. Nguồn `19_GolfChecklist.gs` hiện thiếu khai báo đầu hàm
    `handleConfirmGolfHandover(params)` quanh dòng 585, trong khi router vẫn tham chiếu
    hàm này. Đây là blocker compile/runtime cần xác minh với bản backend đang deploy.
11. Dữ liệu fallback frontend chỉ nên dùng để khởi động offline; không được xem là bản
    mẫu chính thức nếu chưa đối chiếu đủ với mẫu backend.

## 9. Tiêu chí chấp nhận end-to-end

1. Người dùng đăng nhập đúng ca, thấy bàn giao ca trước trước mọi thao tác checklist.
2. Xác nhận nhận ca đóng ca trước và mở ca hiện tại đúng một lần.
3. Reload/đổi thiết bị không mất tiến độ; xung đột không bị ghi đè im lặng.
4. Không thể chốt khi thiếu mục bắt buộc hoặc mục lỗi chưa có xử lý.
5. Sau chốt, người cũ không sửa được; người ca sau thấy thông báo và toàn bộ hồ sơ.
6. Người ca sau xác nhận làm ca trước thành `confirmed` và bắt đầu ca mới.
7. Offline hiển thị trạng thái chờ đồng bộ chính xác; gọi lặp không tạo nhận/chốt trùng.
8. Quản lý xem được ca trễ, bàn giao tranh chấp, override và audit log.

## 10. Phạm vi triển khai khuyến nghị

### Giai đoạn 1 — Khóa đúng vòng đời

- Sửa blocker backend xác nhận bàn giao.
- Thêm API giao dịch `acceptGolfHandoverAndStartRun`.
- Khóa sửa `submitted`; thêm kiểm tra chuyển trạng thái và idempotency.
- Bắt buộc màn hình nhận ca trước khi mở checklist hiện tại.

### Giai đoạn 2 — Chất lượng và ngoại lệ

- Mandatory items, lý do override, từ chối bàn giao, cảnh báo trễ.
- Nhật ký timeline và liên kết sự cố.
- Versioning/xử lý xung đột.

### Giai đoạn 3 — Offline và quản trị

- Queue cho nhận ca/chốt ca với idempotency key.
- Dashboard quản lý, audit đầy đủ và quy trình mở lại.

