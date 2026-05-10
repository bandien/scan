# TASK: Phase 8.2 — Kanban Live UI + Work Order Frontend
**Agent:** Codex  
**Priority:** HIGH  
**Status:** PENDING  
**Depends on:** task_8_1_wo_backend (phải hoàn thành trước)

## Mô tả
Nâng cấp giao diện Kanban trong `index.html` từ Mock Data sang dữ liệu thật từ Sheet `WorkOrders`, và thêm form tạo Work Order mới.

## Bối cảnh
- File chính: `index.html`
- Sơ đồ UI: `brain/ui_architecture.md` — Tham khảo `[index.html#kanbanSection]`
- GAS URL đã cấu hình trong biến `gasUrl` (line ~280)
- API Token: `HAPU_QR_SECRET_2026`
- Sau khi Task 8.1 hoàn thành, backend sẽ hỗ trợ: `action=getWorkOrders` (GET) và `action=createWO` / `action=updateWOStatus` (POST)

## Yêu cầu chi tiết

### 1. Nâng cấp Kanban (`#kanbanSection`):
- Thay mock data bằng fetch từ `gasUrl?action=getWorkOrders&token=...`
- Hiển thị 5 cột: New | Assigned | In Progress | Done | Closed
- Mỗi card WO hiển thị: WO_ID, Tên thiết bị, Priority (màu badge), DueDate, AssignedTo
- Màu priority: Low=xanh lá, Medium=xanh dương, High=cam, Urgent=đỏ
- Click vào card → mở modal chi tiết WO
- Nút đổi trạng thái (Next Status) trên mỗi card

### 2. Form tạo Work Order mới:
- Nút "＋ Tạo WO" ở góc trên Kanban
- Modal form: Type (dropdown), Priority (dropdown), AssetUID (dropdown từ localDevices), Description (textarea), DueDate (date picker)
- Submit gọi POST `action=createWO`

### 3. Lưu WO vào localStorage:
- Sau khi fetch WO thành công, lưu vào `localStorage.setItem('localWorkOrders', ...)`
- Kanban đọc từ localStorage (offline-first, giống cách fetchData hoạt động)

### 4. Cập nhật `brain/ui_architecture.md`:
- Thêm row mới vào bảng Mapping cho WO Modal và Create WO form
- Cập nhật row `Bảng Kanban` với function mới

### 5. Quy tắc:
- Giữ nguyên TOÀN BỘ code hiện tại. Chỉ BỔ SUNG.
- Style theo Bootstrap 5 (đã có sẵn trong project). Dùng badges rounded-pill cho priority.
- Mobile-first: các cột Kanban phải cuộn ngang (horizontal scroll) trên điện thoại.
- Commit message: `feat: implement live Kanban with Work Orders data`

## Kết quả mong đợi
- Kanban section hiển thị dữ liệu WO thật
- Form tạo WO mới hoạt động
- `ui_architecture.md` được cập nhật đồng bộ
- Commit và push lên branch `master`
