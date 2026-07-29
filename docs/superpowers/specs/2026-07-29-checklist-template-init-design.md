# Phân tích nghiệp vụ tạo checklist & chức năng khởi tạo mẫu theo địa điểm / thời gian / ca trực

Ngày: 2026-07-29
Phạm vi: Hệ thống checklist vận hành (hiện chạy cho Sân Golf Kỳ Sơn, mở rộng cho mọi địa điểm của Ban Điện).
Tài liệu liên quan: `2026-07-29-checklist-shift-lifecycle-business-design.md` (vòng đời ca), `2026-07-28-checklist-handover-design.md` (bàn giao).

## 1. Phân tích nghiệp vụ tạo checklist hiện tại

### 1.1. Luồng hiện có

Checklist hiện được "tạo" theo 3 tầng, nhưng chỉ 1 tầng có chức năng thật:

1. **Định nghĩa mẫu (template)** — KHÔNG có chức năng. 4 mẫu (`ca_sang`, `ca_toi`,
   `tuan`, `thang`) được cứng hóa trong code (`GOLF_TEMPLATE_SEED`,
   `GOLF_TEMPLATE_NAMES` trong `19_GolfChecklist.gs`) rồi seed vào sheet
   `GolfChecklistTemplates`. Muốn thêm một mẫu mới cho địa điểm khác phải sửa code
   và deploy lại.
2. **Hạng mục của mẫu (template item)** — có chức năng: `upsertGolfTemplateItem` /
   `deleteGolfTemplateItem` cho Quản lý thêm/sửa/xóa từng dòng kiểm tra.
3. **Lượt thực hiện (run)** — có chức năng đầy đủ: `saveGolfRun` (autosave draft),
   `submitGolfRun` (chốt ca + bàn giao), `confirmGolfHandover` /
   `acceptGolfHandoverAndStartRun` (ca sau nhận bàn giao, mở ca mới).

### 1.2. Ba thuộc tính nghiệp vụ đang bị ngầm định trong code

| Thuộc tính | Hiện trạng | Hệ quả |
|---|---|---|
| **Địa điểm** | Ngầm định là Sân Golf Kỳ Sơn — không có cột/trường nào ghi địa điểm | Không thể mở checklist cho CLH, nhà bảo dưỡng, tòa Hapulico… mà không đẻ thêm code |
| **Thời gian** | Khung giờ nằm rải rác: trong tên mẫu ("Ca Sáng (5h00 – 13h00)"), trong `checkGolfShiftSchedule_` (giờ nhắc), trong frontend `isDue()` (`tuan` = thứ Hai, `thang` = ngày 1) và `js/checklist-shifts.js` (ngày nghiệp vụ) | Sửa giờ ca phải sửa nhiều nơi; frontend tự suy luận ngày nghiệp vụ bằng đồng hồ thiết bị (khoảng trống #9 của tài liệu vòng đời ca) |
| **Ca trực** | `templateId` kiêm luôn vai trò mã ca; cặp bàn giao ca_sang↔ca_toi cứng trong frontend (`pendingHandoverFor`) | Không gán được một mẫu cho ca trực của bảng phân ca (`16_ShiftRoster.gs`), không thêm được ca thứ 3 (ca đêm) |

### 1.3. Kết luận phân tích

Nghiệp vụ "tạo checklist" thực chất gồm 2 việc khác nhau mà hệ thống đang gộp làm một:

- **Khởi tạo mẫu** (việc của Quản lý, tần suất thấp): khai báo *checklist gì, ở đâu,
  khi nào, ca nào làm* — hiện phải sửa code.
- **Mở lượt thực hiện** (việc của KTV, hằng ngày): đã chạy tốt qua vòng đời
  draft → submitted → confirmed.

Chức năng cần bổ sung là tầng **định nghĩa mẫu** tách riêng, để mẫu mới sinh ra bằng
dữ liệu chứ không bằng deploy.

## 2. Thiết kế chức năng khởi tạo mẫu checklist

### 2.1. Mô hình dữ liệu — sheet `ChecklistTemplateDefs`

Mỗi dòng là một định nghĩa mẫu, trả lời đủ 3 câu hỏi địa điểm / thời gian / ca trực:

| Cột | Ý nghĩa |
|---|---|
| `TemplateID` | Khóa mẫu — cũng là khóa của hạng mục (`GolfChecklistTemplates`) và lượt chạy (`GolfChecklistRuns`, `RunID = GOLF-<TemplateID>-<yyyyMMdd>`) |
| `TemplateName` | Tên hiển thị |
| `Location` | **Địa điểm** áp dụng (Sân Golf Kỳ Sơn, CLH, Nhà bảo dưỡng…) |
| `ShiftCode` | **Ca trực** được gán thực hiện (khớp mã ca của bảng phân ca) |
| `Frequency` | `daily` / `weekly` / `monthly` |
| `TimeStart`, `TimeEnd` | **Khung giờ** thực hiện (HH:mm). Trống = cả ngày. `TimeEnd <= TimeStart` = ca qua đêm |
| `DayOfWeek` | Cho `weekly`: 1=Thứ Hai … 7=Chủ Nhật |
| `DayOfMonth` | Cho `monthly`: 1–31 |
| `AssignedTeam` | Tổ phụ trách |
| `Note` | Ghi chú vận hành |
| `Active` | Soft delete — ngừng áp dụng nhưng giữ lịch sử |
| `CreatedAt/By`, `UpdatedAt/By` | Audit |

Sheet được seed từ 4 mẫu golf hiện hành nên dữ liệu cũ tự có định nghĩa tương ứng,
không cần migration.

### 2.2. Quy tắc ngày nghiệp vụ và khung giờ (tính ở server)

Hàm thuần `resolveChecklistSchedule_(defs, date, time)`:

- Ca qua đêm (`TimeEnd <= TimeStart`): thời điểm trước `TimeEnd` thuộc **ngày nghiệp
  vụ hôm trước** (2h sáng 29/07 thuộc ca đêm 28/07) — thống nhất với logic
  `js/checklist-shifts.js` nhưng nay cấu hình được và tính ở backend.
- `weekly`/`monthly` so `DayOfWeek`/`DayOfMonth` với **ngày nghiệp vụ**, không phải
  ngày lịch của thiết bị.
- Trả về mỗi mẫu: `businessDate`, `matchesDate` (có rơi vào ngày này không),
  `inWindow` (đang trong khung giờ thực hiện không).

### 2.3. API

| Action | Loại | Mô tả |
|---|---|---|
| `getChecklistTemplateDefs` | GET | Danh sách định nghĩa mẫu; lọc `location`, `includeInactive` |
| `getChecklistSchedule` | GET | Mẫu nào áp dụng tại `{date, time}` (mặc định giờ server) — nguồn chân lý cho frontend thay vì tự suy luận |
| `upsertChecklistTemplateDef` | POST | Tạo/sửa định nghĩa mẫu (Quản lý). Validate: tên + địa điểm bắt buộc, tần suất hợp lệ, khung giờ đủ cặp HH:mm, weekly cần thứ, monthly cần ngày |
| `deleteChecklistTemplateDef` | POST | Ngừng áp dụng (Active=FALSE) — không xóa cứng để giữ lịch sử runs |

### 2.4. Khởi tạo mẫu bằng nhân bản (clone)

Kịch bản chính của Quản lý: *"mở checklist Ca Đêm cho CLH giống ca tối sân golf"*.
`upsertChecklistTemplateDef` khi tạo mới nhận `cloneFromTemplateId` — copy toàn bộ
hạng mục của mẫu nguồn trong `GolfChecklistTemplates` sang `TemplateID` mới, sau đó
Quản lý tinh chỉnh từng hạng mục bằng `upsertGolfTemplateItem`/`deleteGolfTemplateItem`
có sẵn. Không truyền thì mẫu khởi tạo rỗng, thêm hạng mục dần.

Vì runs khóa theo `TemplateID`, mẫu mới **tự động dùng lại nguyên vòng đời**
autosave → chốt ca → bàn giao → xác nhận, kể cả cảnh báo ngưỡng
(`checkGolfRunThresholds_` đọc hạng mục theo templateId).

### 2.5. Luồng nghiệp vụ mới

```
Quản lý                                   KTV ca trực
   │                                          │
   ├─ upsertChecklistTemplateDef              │
   │  (địa điểm, khung giờ, ca trực,          │
   │   cloneFromTemplateId?)                  │
   ├─ chỉnh hạng mục (upsertGolfTemplateItem) │
   │                                          ├─ getChecklistSchedule → hệ thống trả
   │                                          │  mẫu đúng ca/đúng ngày nghiệp vụ
   │                                          ├─ saveGolfRun (autosave)
   │                                          ├─ submitGolfRun (chốt + bàn giao)
   │                                          └─ ca sau: acceptGolfHandoverAndStartRun
   └─ deleteChecklistTemplateDef (ngừng áp dụng, giữ lịch sử)
```

## 3. Phạm vi đã triển khai / còn lại

### Đã triển khai (đợt này)

- Sheet `ChecklistTemplateDefs` + seed 4 mẫu golf (`19_GolfChecklist.gs`).
- 4 API trên + đăng ký router (`02_Router.gs`).
- Hàm phân giải lịch thuần + test Node
  (`tests/checklist-template-defs.test.js`): khung giờ trong/ngoài, ca qua đêm,
  tuần/tháng theo ngày nghiệp vụ, soft delete, validation.

### Còn lại (đề xuất đợt sau)

1. **Frontend Quản lý**: form khởi tạo mẫu (địa điểm, khung giờ, ca trực, clone) trên
   trang `sangolf` hoặc trang quản trị riêng.
2. **Frontend KTV**: thay `TEMPLATE_ORDER`, `isDue()`, `pendingHandoverFor()` cứng
   trong `sangolf/index.html` bằng dữ liệu `getChecklistSchedule` — hết cứng cặp
   ca_sang↔ca_toi, hỗ trợ ca thứ 3.
3. **Liên kết bảng phân ca**: đối chiếu `ShiftCode` với `16_ShiftRoster.gs` để biết
   *đích danh ai* trực ca đó trong ngày → gợi ý `operator`/`handoverTo`.
4. **`getGolfStatus`**: duyệt theo defs thay vì `GOLF_TEMPLATE_NAMES` để trang nhatky
   thấy cả mẫu mới tạo.
5. **Nhắc ca**: `checkGolfShiftSchedule_` đọc khung giờ từ defs thay vì if/else giờ cứng.
