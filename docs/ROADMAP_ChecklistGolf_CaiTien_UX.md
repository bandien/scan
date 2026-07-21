# ROADMAP — Cải tiến UX Checklist Cơ Điện Sân Golf

> **Mục tiêu:** làm `sangolf/index.html` **đơn giản – hiệu quả – dễ dùng** hơn cho KTV hiện trường.
> **Trạng thái nền:** P1–P3 đã chạy production (xem [PLAN_ChecklistGolf_SoHoa.md](PLAN_ChecklistGolf_SoHoa.md)). Roadmap này là lớp cải tiến UX **trên nền đã có**, KHÔNG làm lại.
> **Ngày lập:** 2026-07-21 · **Người giao:** Kỹ sư trưởng HaiMan · **Người nhận:** AI kế tiếp
> **Nhánh đề xuất:** `feat/golf-checklist-ux`

---

## 0. Ngữ cảnh cho AI nhận việc (đọc trước khi code)

**File chính cần sửa:** [`sangolf/index.html`](../sangolf/index.html) — trang tĩnh mobile-first, ~800 dòng, Bootstrap 5 + `css/shared.css`. Toàn bộ logic nằm trong `<script>` inline.

**Backend (Google Apps Script, chỉ đọc để hiểu, phần lớn KHÔNG cần sửa):**
[`19_GolfChecklist.gs`](../19_GolfChecklist.gs) — 6 action:
`getGolfTemplates` · `getGolfRuns{from,to}` · `saveGolfRun` · `submitGolfRun` · `confirmGolfHandover` · `seedGolfTemplates`.

**Mô hình dữ liệu (quan trọng):**
- Mẫu = nhiều dòng, mỗi dòng 1 hạng mục: `{templateId, section, sectionTitle, itemId, order, label, inputType, fields, unit, threshold, note}`.
- `inputType`: `check | number | time | timerange | text | group`. `group` có `fields=[{key,label,type,unit,threshold}]`.
- `threshold`: `min:x` | `max:x` | `range:a-b` → vi phạm thì UI tô đỏ (hàm `violates()` dòng ~399).
- 1 mẫu / 1 ngày = 1 lượt (`runId = GOLF-<templateId>-<YYYYMMDD>`). Autosave ghi đè cùng runId.
- Giá trị lưu trong `currentRun.items[itemId]` = `{status, value, note}`. Với `group`/`timerange`, `value` là object con.

**Nguyên tắc bắt buộc giữ nguyên:**
- **Local-first:** mọi thao tác ghi `localStorage` ngay (`saveLocalDraft`), đồng bộ ngầm sau 1.8s (`flushSave`). Không được để thao tác nào mất khi mất mạng.
- **Mẫu do sheet điều khiển:** không hardcode hạng mục trong HTML.
- Không phá luồng trạng thái `draft → submitted → confirmed` và khoá sửa khi `isLocked()`.
- Tên người thực hiện lấy từ SSO (`getOperator()`), không bắt gõ tay.

**Cách chạy/kiểm thử:** mở `sangolf/index.html` trên mobile hoặc DevTools chế độ mobile. Cần đăng nhập tài khoản nhatky (SSO) để có tên KTV. Test cả trạng thái offline (DevTools → Network → Offline) để đảm bảo autosave local vẫn chạy.

---

## 1. Vấn đề đã phát hiện (xếp theo tác động)

| # | Vấn đề | Vị trí | Mức |
|---|---|---|---|
| 1 | "Đạt nhanh" chỉ đánh mục `check`, KHÔNG giúp ~12 ô số/ca (7 bể + 5 hồ) — nút thắt thời gian thật | `markAllOk()` ~L680 | Cao |
| 2 | Không có "lấy số ca/ngày trước" — mức nước, giờ bơm thường gần giống hôm trước, phải gõ lại từ đầu | — | Cao |
| 3 | Chốt ca không cảnh báo khi làm dở (cho chốt cả khi 0/18 mục) | `openSubmitModal()` ~L738 | TB |
| 4 | Hai chỗ ghi bàn giao trùng: mục text C02/B03 trong thân + ô `handoverNoteInput` ở modal → dễ lệch | ~L746-747 | TB |
| 5 | Checklist 18–22 mục cuộn liên tục, không mục lục/nhảy tới mục chưa xong, section không gập | `renderRun()` ~L562 | TB |
| 6 | Không đính kèm ảnh khi phát hiện sự cố (cột đèn hỏng, bơm rò...) | — | TB |
| 7 | Tiến độ "đếm done" ảo: group chỉ cần 1 sub-field đã tính xong | `itemIsDone()` ~L457 | Thấp |
| 8 | Ngưỡng mức nước chưa có → bể/hồ không tô đỏ dù cạn | dữ liệu sheet | Thấp (việc dữ liệu) |

---

## 2. Việc theo đợt

### Đợt 1 — Giảm thời gian nhập (ưu tiên cao nhất, thuần frontend, không đụng backend)

- [ ] **1.1 Nút "Lấy số ca trước"** cho mỗi mục `number` và mỗi sub-field số trong `group`.
  - Nguồn dữ liệu: `serverRuns` đã tải kèm `previousDate` trong `loadRuns()` (dòng ~429 lấy `from: previousDate(date)`). Tìm lượt gần nhất cùng `templateId` có giá trị cho `itemId` đó.
  - Hành vi: bấm → đổ giá trị cũ vào ô như **gợi ý** (KTV vẫn sửa được), đánh dấu ô là "kế thừa" (viền nhạt) để phân biệt với số vừa đo.
  - Không tự động điền khi mở — chỉ điền khi KTV chủ động bấm, tránh ghi đè nhầm số thật.
- [ ] **1.2 Nâng "Đạt nhanh" → "Điền nhanh cả ca"**: ngoài đánh Đạt các mục `check` như hiện tại, prefill số đo từ ca/ngày trước một lần cho toàn bộ mục số còn trống. Giữ nút "Đạt nhanh" cũ hoặc gộp — chốt với người giao khi làm.
- [ ] **1.3 Nút +/- nhanh** hai bên ô số đơn vị `cm` (bước 1) để chỉnh nhẹ không cần bàn phím. Chỉ áp cho unit cm để tránh rối các unit khác.

**Tiêu chí hoàn thành Đợt 1:** một ca sáng điển hình (18 mục) điền xong trong < 1 phút khi số liệu gần giống hôm trước; mọi giá trị prefill đều sửa được và không tự ghi đè khi chưa bấm.

### Đợt 2 — Chốt ca an toàn & rõ ràng

- [ ] **2.1 Màn tóm tắt trước khi chốt:** trong modal chốt ca, liệt kê danh sách mục **Lỗi/ngoài ngưỡng** (đã có `hasViolation()`) và mục **chưa làm** (dựa `itemIsDone()`). Nếu còn mục trống → yêu cầu tick xác nhận "vẫn chốt" (chặn mềm, không chặn cứng).
- [ ] **2.2 Gộp một nguồn bàn giao duy nhất:** bỏ ô `handoverNoteInput` rời, để modal đọc/ghi thẳng vào mục text "Nội dung bàn giao" (C02 ca sáng / B03 ca tối) trong checklist — hoặc ngược lại, ẩn mục text và chỉ dùng ô modal. Chọn 1 hướng, tránh nhập hai nơi lệch nhau. Giữ tương thích payload `submitGolfRun` (`handoverNote`).

**Tiêu chí:** không thể chốt ca "nhầm" khi bỏ trống hàng loạt mà không thấy cảnh báo; nội dung bàn giao chỉ nhập ở một chỗ.

### Đợt 3 — Điều hướng & bằng chứng hiện trường

- [ ] **3.1 Thanh mục lục dính + nút "→ mục chưa xong tiếp theo"**; section gập được; badge số mục lỗi trên tiêu đề mỗi section.
- [ ] **3.2 Đính kèm ảnh** cho mục sự cố (đèn hỏng, bơm rò...): nút chụp/chọn ảnh → lưu link vào note. **Cần thống nhất chỗ lưu ảnh với backend trước khi làm** (Drive? base64 vào sheet? — hỏi người giao).
- [ ] **3.3 Sửa `itemIsDone()` cho group:** yêu cầu đủ sub-field mới tính "xong" để thanh tiến độ phản ánh đúng (5/5 hồ chứ không phải 1/5 đã báo done).

### Việc dữ liệu (song song, KHÔNG cần code — người giao/quản trị làm trên sheet)

- [ ] **9.1** Điền cột `Threshold` mức nước bể/hồ trong sheet `GolfChecklistTemplates` (cú pháp `max:x` cm cách tràn tương ứng ≥50%) để bật cảnh báo đỏ. Xem [PLAN mục 4](PLAN_ChecklistGolf_SoHoa.md).

---

## 3. Ràng buộc & lưu ý khi làm

- **Chỉ sửa frontend cho Đợt 1–2 và mục 3.1/3.3.** Đợt 3.2 (ảnh) cần bàn backend → **dừng hỏi người giao trước khi code**.
- Không cài thư viện lớn; giữ vanilla + Bootstrap sẵn có.
- Giữ `esc()` cho mọi giá trị người dùng nhập khi render HTML (tránh XSS/vỡ layout).
- Test offline sau mỗi thay đổi liên quan lưu trữ.
- Tuân thủ [CLAUDE.md gốc dự án](../../CLAUDE.md): **không xoá/ghi đè dữ liệu Google Sheets khi chưa có xác nhận bằng lời**; không tự đổi cấu trúc DB.
- Commit theo nhánh `feat/golf-checklist-ux`, mỗi đợt một (hoặc vài) commit rõ ràng; không merge vào `main` khi chưa được duyệt.

## 4. Thứ tự khuyến nghị

**Đợt 1 → Đợt 2 → 3.1 → 3.3 → 3.2.** Đợt 1 cho nhiều "dễ dùng" nhất với rủi ro thấp nhất (chỉ đụng `sangolf/index.html`, dùng dữ liệu đã có).
