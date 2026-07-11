# TASK: Phase 8.1 — Work Orders Backend API (GAS)
**Agent:** Claude Code  
**Priority:** HIGH  
**Status:** DONE (Archived from tasks_queue — already implemented in Backend.gs)

## Mô tả
Nâng cấp file `GAS_Backend.js` để hỗ trợ hệ thống Work Orders chuẩn CMMS.

## Bối cảnh
- Repo: `c:\Users\trucd\OneDrive - hapucomplex\Antigravity\12-UIDQRCodeWebApp`
- Backend hiện tại: `GAS_Backend.js` (Google Apps Script)
- Sheet ID: `1aK1KMrG5Bn4hYy-QSS5SAST_Xl4Ta_hCbVmqyHXJjUo`
- API Token: `HAPU_QR_SECRET_2026`
- Hiện đã có: `doGet` (action=login, uid lookup), `doPost` (submit checklist log)

## Yêu cầu chi tiết

### 1. Giả định Google Sheet `WorkOrders` đã tồn tại với cấu trúc cột:
| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| WO_ID | Type | Priority | Status | AssetUID | AssignedTo | DueDate | Description | PartsUsed | CreatedAt |

- **Type**: PM / CM / Inspection
- **Priority**: Low / Medium / High / Urgent
- **Status**: New / Assigned / InProgress / Done / Closed

### 2. Thêm các action vào `doGet`:

```javascript
// action=getWorkOrders — Lấy danh sách WO (filter theo assignedTo nếu role = Technician)
// action=getInventory — Lấy danh sách vật tư từ Sheet "Inventory"
```

### 3. Thêm các action vào `doPost`:

```javascript
// action=createWO — Tạo Work Order mới (auto-generate WO_ID format: WO-YYYYMM-NNNNN)
// action=updateWOStatus — Cập nhật trạng thái WO (kèm ghi Audit Log)
```

### 4. Sheet `AuditLog` (giả định đã tồn tại):
| A | B | C | D | E |
|---|---|---|---|---|
| Timestamp | User | Action | Target | Details |

### 5. Quy tắc:
- Giữ nguyên TOÀN BỘ logic hiện tại (login, uid lookup, submit log). Chỉ BỔ SUNG thêm.
- Tất cả code viết trong 1 file `GAS_Backend.js`
- Comment bằng tiếng Anh
- Kiểm tra token ở mọi endpoint
- Commit message: `feat: add Work Orders and Inventory API to GAS backend`

## Kết quả mong đợi
- File `GAS_Backend.js` được cập nhật với các action mới
- Commit và push lên branch `master`

---
**Archived:** 2026-05-14 — All requirements confirmed implemented in Backend.gs
