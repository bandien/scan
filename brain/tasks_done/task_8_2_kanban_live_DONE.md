# TASK DONE: Phase 8.2 — Kanban Live UI + Work Order Frontend

**Status:** COMPLETED  
**Commit:** `319b793` — `feat: implement live Kanban with Work Orders data`  
**Branch:** master  
**Completed:** 2026-05-11

## Những gì đã thực hiện

### 1. Nâng cấp Kanban (`#kanbanSection`)
- Thay toàn bộ mock data (3 cột tĩnh) bằng board 5 cột động: **New | Assigned | In Progress | Done | Closed**
- Fetch từ `gasUrl?action=getWorkOrders&token=HAPU_QR_SECRET_2026` (GET)
- Offline-first: đọc `localStorage('localWorkOrders')` trước khi fetch network
- Sau khi fetch thành công → ghi vào `localStorage.setItem('localWorkOrders', ...)`
- Mỗi card WO hiển thị: WO_ID, AssetName/AssetUID, Priority badge (rounded-pill), AssignedTo, DueDate
- Priority colors: Low=success(xanh lá), Medium=primary(xanh dương), High=warning(cam), Urgent=danger(đỏ)
- Nút "Next Status" trên mỗi card để chuyển trạng thái nhanh
- Click vào card → mở `#woDetailModal` với đầy đủ thông tin WO
- Mobile-first: `overflow-x: auto` + `scroll-snap-type: x mandatory` + `-webkit-overflow-scrolling: touch`

### 2. Form tạo Work Order mới (`#createWOModal`)
- Nút "＋ Tạo WO" ở góc trên phải của header Kanban
- Modal form: Type (dropdown 4 options), Priority (dropdown 4 levels), AssetUID (dropdown populate từ `localDevices`), Description (textarea), DueDate (date picker, default +7 ngày)
- Submit gọi `POST gasUrl` với `action: 'createWO'`
- Sau khi tạo thành công: đóng modal, toast thành công, reload Kanban sau 1.5s

### 3. WO Detail Modal (`#woDetailModal`)
- Hiển thị grid 2 cột: WO_ID, Loại, Trạng thái + Priority badge, Thiết bị, AssignedTo, DueDate, Mô tả
- Nút "Chuyển trạng thái" → gọi `advanceWOStatus()` → POST `action=updateWOStatus`
- Tự cập nhật localStorage và re-render Kanban sau khi đổi trạng thái

### 4. Thêm Bootstrap JS
- Thêm `bootstrap.bundle.min.js` (thiếu trong bản gốc) để hỗ trợ Modal và Dropdown

### 5. Cập nhật `brain/ui_architecture.md`
- Cập nhật row "Bảng Kanban" → "Bảng Kanban (Live)" với các function mới: `loadKanban()`, `renderKanban()`
- Thêm 2 row mới: **WO Detail Modal** và **Form Tạo WO**
- Cập nhật Mermaid diagram với luồng data WO mới: `loadKanban → GAS GET → localStorage`, `updateWOStatus → GAS POST`

## Files thay đổi
- `index.html` — +225 lines (HTML modals + JavaScript WO functions)
- `brain/ui_architecture.md` — cập nhật bảng mapping + Mermaid diagram
