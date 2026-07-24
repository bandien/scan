# Design Spec: Hệ Thống Hợp Nhất Quản Lý Công Việc & Checklist Vận Hành

- **Ngày lập:** 2026-07-24
- **Tác giả:** AI Assistant & Engineering Team
- **Dự án:** BanDienScan (`02_Source/`)
- **Trạng thái:** DRAFT — Chờ phê duyệt (Superpowers Brainstorming Step 6)

---

## 1. Mục tiêu & Phạm vi

Xây dựng hệ thống giao diện và backend hợp nhất quản lý công việc Ban Điện:
1. **Hợp nhất luồng Checklist & Công việc**: Khi đi checklist phát hiện sự cố/vượt ngưỡng, tự động khởi tạo Task công việc.
2. **Giao diện nhập liệu hợp nhất (Unified Entry Form)**:
   - Sử dụng **1 màn hình duy nhất** cho mọi loại việc.
   - Việc nhỏ: Giao diện mặc định tối giản (chỉ tên việc, ảnh).
   - Việc phức tạp: Bấm "Hiện thêm" để mở cấu hình nhiều giai đoạn/bước, gán KTV.
3. **Quy tắc Ghi Hộ của Quản Lý (Manager Proxy Logging)**: Cho phép Tổ trưởng/Quản lý ghi báo cáo/nhật ký thay cho KTV nhưng luôn lưu rõ danh tính 2 bên.

---

## 2. Quy Tắc Ghi Hộ Của Quản Lý (Manager Proxy Logging Rules)

```mermaid
flowchart LR
    Manager[Tổ trưởng / Quản lý] -->|Bấm Ghi Hộ| Form[Form Báo Cáo / Ghi Nhật Ký]
    Form -->|Chọn KTV thực hiện| Worker[Nhân viên A, B]
    Form -->|Hệ thống tự ghi| Audit[Audit Trail: Employee=Nhân viên A | RecordedBy=Tổ trưởng]
    Audit --> DB[(Sheets: WorkLogs / NhatKyPlans)]
```

### 2.1 Ma Trận Phân Quyền Ghi Hộ:
- **Tài khoản KTV (Role `User`)**: Chỉ được ghi báo cáo cho chính mình (`Employee == RecordedBy`).
- **Tài khoản Quản lý (Role `Manager` / `Admin` / Tổ trưởng)**:
  - Có thêm ô chọn **"Ghi hộ cho nhân viên"** (Dropdown chọn KTV thuộc tổ mình quản lý hoặc tích chọn danh sách nhóm).
  - Có 2 chế độ ghi hộ:
    1. **Ghi hộ từng người (Single Proxy)**: Chọn 1 KTV (vd: "Thắng NQ"), hệ thống ghi nhận nhật ký thuộc về Thắng NQ.
    2. **Ghi hộ cả nhóm (Batch Proxy)**: Bảng gồm danh sách tất cả KTV trong bước/giai đoạn $\rightarrow$ Đánh giá kết quả (`Hoàn thành tốt`, `Đạt`, `Chưa đạt`, `Vắng`) và nhập khối lượng riêng từng người trong 1 lần bấm.

### 2.2 Quy Tắc Lưu Vết Dữ Liệu (`Audit Trail`):
Tránh mạo danh và tranh chấp bằng cách phân định 2 trường riêng biệt trên backend (`WorkLogs` & `NhatKyPlans`):
- `Employee` (Người thực hiện công việc): Tên KTV thực tế làm việc (vd: `Thắng NQ`).
- `RecordedBy` (Người nhập dữ liệu): Tên người đang đăng nhập bấm nút Lưu (vd: `Tổ trưởng Hậu DV`).
- **Hiển thị UI**: Nhật ký sẽ ghi rõ: *"Thắng NQ (Ghi bởi Tổ trưởng Hậu DV lúc 14:30)"*.

---

## 3. Quy Trình Nhập Liệu Hợp Nhất (Unified Task Entry)

Thay vì phân chia 2 luồng riêng biệt, hệ thống sử dụng **1 màn hình nhập công việc duy nhất** có khả năng mở rộng linh hoạt:

### 3.1 Chế độ Mặc Định (Việc Nhỏ / Nhanh)
- **Giao diện tối giản**: Phù hợp cho sự cố nhỏ, xử lý nhanh trong ca (< 30 phút).
- **Các trường hiển thị**: Tên việc, Vị trí/Thiết bị, Nút chụp ảnh hiện trạng/kết quả.
- **Thao tác**: Nhập thông tin $\rightarrow$ Bấm **"Lưu & Hoàn Thành"**.
  - Backend tự động sinh bản ghi `NhatKyPlans` (`Status = Hoàn thành`, `Lifecycle = closed`, `Labels = Đã chốt sổ`).
  - Sinh bản ghi `WorkLogs` đính kèm ảnh và kết quả.

### 3.2 Chế độ Mở Rộng (Việc Phức Tạp / Nhiều Giai Đoạn)
- **Kích hoạt**: Bấm nút **"Mở rộng / Hiện thêm"** ở dưới cùng form mặc định.
- **Thông tin bổ sung**: Giao diện sổ xuống các trường cấu hình chuyên sâu:
  - **Cấu trúc Giai đoạn & Bước con**: Thêm danh sách Phase, Step.
  ```jsonc
  phases: [
    {
      "id": "PHASE-1",
      "name": "Phase 1: Khảo sát & Chuẩn bị vật tư",
      "status": "done",
      "steps": [
        { "id": "S1", "title": "Khảo sát mặt bằng", "assignees": ["Thắng NQ"], "done": true, "doneByPeople": ["Thắng NQ"] }
      ]
    },
    {
      "id": "PHASE-2",
      "name": "Phase 2: Thi công lắp đặt",
      "status": "doing",
      "steps": [
        { "id": "S2", "title": "Kéo dây điện chính", "assignees": ["Thắng NQ", "Hậu DV"], "done": false, "doneByPeople": ["Thắng NQ"] }
      ]
    }
  ]
  ```
- **Quy tắc Đủ Người Mới Xong (Crowd-Completion Rule)**:
  - Khi Bước có $N$ người thực hiện (`assignees`), mỗi người sau khi làm xong sẽ tự báo (hoặc được Quản lý ghi hộ) $\rightarrow$ Tên được thêm vào `doneByPeople`.
  - Chỉ khi **tất cả người trong `assignees`** đã báo xong $\rightarrow$ Bước mới tính là `done = true`.
  - Quản lý có quyền bấm nút **"Ghi đè hoàn thành bước"** (Override Complete) nếu có người vắng mặt.

---

## 4. Tích Hợp Tự Động Từ Checklist Vận Hành

- Khi KTV thực hiện Checklist (Golf / Bơm / Meter) nhập mục **"Không Đạt"** hoặc **Giá trị số vượt ngưỡng (`Threshold`)**:
  - API `saveGolfRun` / `submitGolfRun` trong `19_GolfChecklist.gs` tự động kiểm tra và sinh 1 bản ghi `NhatKyPlans`:
    - `Task`: `[SỰ CỐ CHECKLIST] <Tên hạng mục vi phạm>`
    - `Area`: `<Tên khu vực/Bể/Hồ>`
    - `Priority`: `Khẩn cấp`
    - `Type`: `Phát sinh`
    - `Status`: `Chưa làm`
    - `AssignedBy`: `Hệ thống Checklist`
  - Đẩy ngay cảnh báo màu đỏ lên nhóm Telegram vận hành.

---

## 5. Kế Hoạch Kiểm Thử & Xác Minh (Verification Plan)

1. **Kiểm thử Ghi Hộ**:
   - Dùng tài khoản Quản lý đăng nhập $\rightarrow$ Ghi nhật ký chọn KTV A $\rightarrow$ Xác nhận trong Sheet `WorkLogs` có `Employee = KTV A` và `RecordedBy = Quản lý`.
2. **Kiểm thử Luồng Việc Nhỏ**:
   - Nhập việc phát sinh + ảnh $\rightarrow$ Kiểm tra `NhatKyPlans` có trạng thái `Hoàn thành` và `Labels = Đã chốt sổ`.
3. **Kiểm thử Luồng Nhiều Giai Đoạn**:
   - Tạo việc 2 Phase, 1 bước gán 2 KTV $\rightarrow$ KTV 1 báo xong $\rightarrow$ Kiểm tra bước chưa chuyển `done` $\rightarrow$ KTV 2 báo xong (hoặc Quản lý ghi hộ cho KTV 2) $\rightarrow$ Bước chuyển `done = true`.
