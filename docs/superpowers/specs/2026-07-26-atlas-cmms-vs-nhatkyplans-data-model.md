# Đối chiếu Mô hình Dữ liệu: Atlas CMMS ↔ Google Sheet (NhatKyPlans)

Đây là kết quả nghiên cứu theo quy trình Superpowers — Bước 1 (Brainstorming). Tài liệu đối chiếu toàn bộ các trường (field) của Atlas CMMS với các cột thực tế trong sheet `NhatKyPlans` của dự án.

---

## 1. Mô hình Work Order của Atlas CMMS

Dựa trên tài liệu tại [docs.atlas-cmms.com](https://docs.atlas-cmms.com) và mã nguồn GitHub (Spring Boot Java entity), một **Work Order** trong Atlas CMMS có các nhóm trường chính sau:

### Nhóm Nhận dạng (Identification)
| Field Atlas | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| `id` | Long (auto) | ID duy nhất, sinh tự động |
| `title` | String | Tiêu đề ngắn gọn công việc |
| `description` | String/Text | Mô tả chi tiết, yêu cầu kỹ thuật |

### Nhóm Phân loại & Vòng đời (Classification & Lifecycle)
| Field Atlas | Kiểu dữ liệu | Giá trị mẫu |
|---|---|---|
| `status` | Enum | Open / In Progress / On Hold / Completed |
| `priority` | Enum | Low / Medium / High / Critical |
| `category` | String/FK | Corrective / Preventive / Inspection / Emergency |
| `type` | Enum | Reactive / Scheduled |

### Nhóm Tài nguyên & Lịch biểu (Resources & Scheduling)
| Field Atlas | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| `dueDate` | DateTime | Hạn chót hoàn thành |
| `estimatedDuration` | Number | Giờ ước tính |
| `primaryWorker` / `assignees` | FK (User) | Người chịu trách nhiệm chính |
| `createdBy` | FK (User) | Người tạo |
| `createdAt` / `updatedAt` | DateTime | Audit timestamp |

### Nhóm Liên kết (Associations)
| Field Atlas | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| `asset` | FK (Asset) | Thiết bị/máy móc cụ thể |
| `location` | FK (Location) | Khu vực vật lý |
| `images` | Array (URL) | Ảnh trước/trong/sau sửa chữa |

### Nhóm Checklist & Nhật ký
| Field Atlas | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| `checklist` | Array (Item) | Danh sách hạng mục kiểm tra |
| `timeLogs` | Array | Giờ công ghi nhận từng người |
| `costLogs` / `partsUsed` | Array | Vật tư, chi phí |

---

## 2. Cấu trúc Sheet `NhatKyPlans` thực tế (35 cột đã mở rộng)

Được trích từ hàm `ensurePlansSheet_()` trong `14_NhatKyPlans.gs` (commit `e0dfa93`):

| # | Cột Sheet | Tương đương Atlas | Ghi chú |
|---|---|---|---|
| 1 | **PlanID** | `id` | ID duy nhất (không sinh tự động) |
| 2 | **Date** | `dueDate` / `createdAt` | Ngày thực hiện / tạo |
| 3 | **Time** | *(không có)* | Giờ (Atlas dùng DateTime đầy đủ) |
| 4 | **Team** | *(không có)* | Tổ/nhóm kỹ thuật |
| 5 | **Area** | `location.name` | Khu vực vật lý (Atlas dùng FK quan hệ) |
| 6 | **Asset** | `asset.name` | Thiết bị (Atlas dùng FK quan hệ) |
| 7 | **Task** | `title` | Tên công việc |
| 8 | **Assignee** | `primaryWorker` | Người thực hiện chính |
| 9 | **Priority** | `priority` | ✅ Hoàn toàn tương đồng |
| 10 | **Status** | `status` | ✅ Hoàn toàn tương đồng (khác ngôn ngữ) |
| 11 | **UpdatedAt** | `updatedAt` | ✅ Tương đồng |
| 12 | **UpdatedBy** | *(trong audit log)* | Atlas lưu trong audit trail riêng |
| 13 | **Watcher** | *(không có chuẩn)* | Tính năng riêng của BanDien |
| 14 | **Collaborators** | `assignees` (nhiều người) | Atlas hỗ trợ multi-assign |
| 15 | **DateEnd** | `dueDate` | Hạn chót thực sự |
| 16 | **Type** | `category` | Loại công việc |
| 17 | **PlanQty** | `estimatedDuration` | Khối lượng (Atlas = giờ, BanDien = đơn vị tùy) |
| 18 | **Unit** | *(không có)* | Đơn vị đo lường — tính năng riêng M&E |
| 19 | **DoneQty** | *(timeLogs tổng hợp)* | Atlas không có trường tích lũy riêng |
| 20 | **FollowUpDate** | *(không có chuẩn)* | Ngày nhắc lại — tính năng riêng |
| 21 | **Source** | *(không có)* | Nguồn tạo (Zalo, Form...) |
| 22 | **SourceText** | `description` | Nội dung chỉ đạo gốc |
| 23 | **Steps** | `checklist` (từng item) | Atlas dùng bảng riêng; BanDien nhúng JSON |
| 24 | **Labels** | *(tags tự do)* | Atlas dùng `category`, không có multi-tag tự do |
| 25 | **AssetUID** | `asset.serialNumber` | Mã định danh thiết bị (dùng cho QR scan) |
| 26 | **CreatedAt** | `createdAt` | ✅ Tương đồng |
| 27 | **Cost** | `costLogs` (tổng hợp) | Atlas theo dõi từng khoản riêng |
| 28 | **PartsUsed** | `parts` | Atlas có bảng riêng cho vật tư |
| 29 | **Project** | *(không có chuẩn)* | Atlas dùng `location` hierarchy thay thế |
| 30 | **Phases** | *(PM schedule tasks)* | Atlas có riêng trong Preventive Maintenance |
| 31 | **Photos** | `images` | ✅ Tương đồng về concept |
| 32 | **Handover** | *(không có)* | **HOÀN TOÀN ĐẶC THÙ M&E BanDien** |
| 33 | **AssignedBy** | `createdBy` | Người giao việc |
| 34 | **DoneCriteria** | *(không có)* | Tiêu chí nghiệm thu — **đặc thù BanDien** |
| 35 | **AcknowledgedAt** | *(không có)* | Xác nhận nhận việc — **đặc thù BanDien** |

---

## 3. Bản đồ trực quan: Điểm tương đồng và khác biệt

```
Atlas CMMS WorkOrder              NhatKyPlans Google Sheet
─────────────────────             ──────────────────────────
id ─────────────────────────────► PlanID
title ──────────────────────────► Task
description ────────────────────► SourceText
status ─────────────────────────► Status
priority ───────────────────────► Priority
category / type ────────────────► Type
dueDate ────────────────────────► DateEnd (hoặc Date)
primaryWorker ──────────────────► Assignee
assignees (list) ───────────────► Collaborators
createdBy ──────────────────────► AssignedBy
createdAt ──────────────────────► CreatedAt
updatedAt ──────────────────────► UpdatedAt
asset.name ─────────────────────► Asset
asset.serialNumber ─────────────► AssetUID
location.name ──────────────────► Area
images[] ───────────────────────► Photos (JSON)
checklist items ────────────────► Steps / Phases (JSON lồng)
cost + parts ───────────────────► Cost + PartsUsed

                                  ← Team (Tổ trực) [KHÔNG CÓ]
                                  ← Time (Giờ bắt đầu) [KHÔNG CÓ]
                                  ← PlanQty + Unit + DoneQty [KHÔNG CÓ]
                                  ← FollowUpDate [KHÔNG CÓ]
                                  ← Source (Nguồn tạo) [KHÔNG CÓ]
                                  ← Watcher [KHÔNG CÓ]
                                  ← Handover (Bàn giao ca) [KHÔNG CÓ]
                                  ← DoneCriteria [KHÔNG CÓ]
                                  ← AcknowledgedAt [KHÔNG CÓ]
                                  ← Labels (multi-tag tự do) [KHÔNG CÓ]
```

---

## 4. Kết luận và Khuyến nghị

> [!IMPORTANT]
> **Schema Google Sheet `NhatKyPlans` là một SUPERSET (siêu tập) của Atlas CMMS.** Nó bao gồm đầy đủ mọi khái niệm của Atlas, cộng thêm 10 trường nghiệp vụ M&E đặc thù không có trong bất kỳ CMMS thương mại/mã nguồn mở phổ biến nào.

### Điểm tương đồng mạnh (17/35 cột — ánh xạ 1:1)
`PlanID`, `Task`, `SourceText`, `Priority`, `Status`, `Assignee`, `Collaborators`, `DateEnd`, `Type`, `AssetUID`, `Asset`, `Area`, `CreatedAt`, `UpdatedAt`, `Photos`, `Cost`, `PartsUsed`

### Các trường đặc thù M&E BanDien (10 trường — KHÔNG có trong Atlas)
1. `Team` — Tổ trực/nhóm kỹ thuật
2. `Time` — Giờ bắt đầu ca (Atlas dùng DateTime)
3. `Watcher` — Người theo dõi không thực hiện
4. `PlanQty` + `Unit` + `DoneQty` — Hệ thống đo lường khối lượng tích lũy
5. `FollowUpDate` — Ngày nhắc lại
6. `Source` — Nguồn gốc tạo công việc (Zalo, Form...)
7. `Handover` — Bàn giao ca (M&E đặc thù)
8. `DoneCriteria` — Tiêu chí nghiệm thu
9. `AcknowledgedAt` — Thời điểm xác nhận nhận việc
10. `Labels` — Tags tự do đa chọn

### Hướng đi tiếp theo (Bước 2 — Lập kế hoạch)
Bạn có 3 lựa chọn chiến lược:

| Lựa chọn | Mô tả | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **A. Self-host Atlas CMMS** | Chạy Atlas bằng Docker, xuất dữ liệu Sheet vào | CMMS đầy đủ tính năng, giao diện đẹp | Không có nghiệp vụ bàn giao ca, đo lường M&E |
| **B. Google AppSheet** | Kết nối Sheet hiện tại, sinh app tự động | Không cần code, giữ 100% schema | Tốn phí nếu >10 người, UI phụ thuộc vào AppSheet |
| **C. Viết lại Frontend mới** | Viết HTML đơn giản hơn với design system nhất quán | Toàn quyền tùy biến | Cần đầu tư công sức, cần tránh lỗi CSS Dark Mode |
