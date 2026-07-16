# Kế hoạch số hóa Checklist Cơ Điện Sân Golf vào BanDienScan

> Nguồn: `ChecklistCoDienSanGolf.xlsx` (OneDrive · 03_TL/00_Golf/09_VANHANH/01_CoDien)
> Đích: Webapp BanDienScan (GAS backend + Google Sheets + trang HTML tĩnh)
> Ngày lập: 2026-07-16 · Trạng thái: **P1–P3 ĐÃ TRIỂN KHAI (2026-07-16)** — xem `19_GolfChecklist.gs` + `sangolf/index.html`

---

## 1. Hiện trạng file Excel (đã phân tích)

File có 4 sheet, thực chất là **4 mẫu checklist**:

| Mẫu | Phạm vi | Số hạng mục | Ghi chú |
|---|---|---|---|
| **Ca Sáng** | 5h00–13h00, mục A/B/C | 18 mục + bàn giao | Nằm ở nửa trên sheet "Ca Sáng" |
| **Ca Tối** | 13h00–21h00, mục A/B | 16 mục + bàn giao | Nằm ở **nửa dưới cùng sheet "Ca Sáng"** |
| **Kiểm Tra Tuần** | Thứ Hai hàng tuần, mục A/B/C | 14 mục | Có cột "Người KT" riêng |
| **Kiểm Tra Tháng** | Ngày 1 hàng tháng, ≥2 KTV, mục A/B/C/D | 22 mục | Có phần tổng kết kWh/m³ |

⚠️ Sheet "Ca Chiều - Tối" (17h30–21h00) **trùng lặp một phần** với Ca Tối trong sheet 1 nhưng khác khung giờ và khác vài hạng mục (có thêm "Xác nhận lịch tưới Rainbird"). **Cần xác nhận mẫu nào là bản hiện hành** trước khi seed dữ liệu.

⚠️ Mâu thuẫn nhỏ trong bản gốc (cần chốt khi duyệt): header Ca Sáng ghi "5h00–8h00" nhưng mục C ghi đóng ca "12h30–13h00"; mục A ghi "4h45–6h00".

### Các kiểu dữ liệu nhập trong checklist (quan trọng nhất khi số hóa)

1. **Check đơn giản** — Đạt / Không đạt / Bỏ qua + ghi chú (VD: "Đèn sân golf 18 hố đã TẮT")
2. **Số đo** — "Cách tràn ___ cm" (7 bể + 5 hồ), nhiệt độ ℃ (2 máy gia nhiệt), Volt L1/L2/L3, % Iđm, Ω, MΩ, pH, kWh, m³
3. **Giờ bật / giờ tắt** — 3 suối trang trí, 3 bơm 160kW (mỗi bơm 1 cặp giờ)
4. **Hạng mục nhiều trường con** — mục 10 (5 hồ), mục 11 (3 bơm × giờ bật/tắt): phải tách thành sub-field
5. **Văn bản tự do** — nhật ký sự cố, nội dung bàn giao, số hiệu cột đèn hỏng
6. **Xác nhận 2 người** — người giao ca / người nhận ca (ca), KTV / tổ trưởng (tuần), tổ trưởng / QL sân golf (tháng)

---

## 2. Thiết kế đề xuất

### 2.1 Dữ liệu — 2 sheet mới trên Google Sheets (theo pattern NhatKyPlans/PumpChecks hiện có)

**Sheet `GolfChecklistTemplates`** — định nghĩa mẫu, 1 dòng = 1 hạng mục (hoặc 1 sub-field):

```
TemplateID | Section | ItemID | Order | Label | InputType | Unit | Threshold | Note | Active
ca_sang    | A       | A02    | 2     | Bể ngầm CLH ≥50% | number | cm | max:80 | Ghi cách tràn | TRUE
ca_sang    | A       | A11a   | 11.1  | Bơm ngoài sân 160kW | timerange | | | Giờ bật/tắt | TRUE
```

InputType: `check` · `number` · `time` · `timerange` · `text`. Sửa mẫu = sửa sheet, **không cần deploy lại code**.

**Sheet `GolfChecklistRuns`** — 1 dòng = 1 lượt thực hiện (1 ca / 1 tuần / 1 tháng):

```
RunID | Date | TemplateID | Status(draft/submitted/handed_over) | StartedAt | SubmittedAt |
Operator | HandoverNote | HandoverTo | ConfirmedBy | ConfirmedAt | ItemsJSON
```

`ItemsJSON`: `[{itemId, status, value, note, checkedBy, checkedAt}]` — cùng pattern cột `Steps` của NhatKyPlans. Giai đoạn sau (Phase 4) mới tách số đo ra sheet trend riêng nếu cần biểu đồ.

### 2.2 Backend — file mới `19_GolfChecklist.gs`

| Action | Method | Chức năng |
|---|---|---|
| `getGolfTemplates` | GET | Trả 4 mẫu (cache localStorage phía client) |
| `getGolfRuns` | GET | Lượt chạy theo ngày/khoảng ngày |
| `saveGolfRun` | POST | Tạo/ghi nháp (autosave từng mục — mất mạng không mất dữ liệu) |
| `submitGolfRun` | POST | Chốt ca + ghi nội dung bàn giao |
| `confirmGolfHandover` | POST | Người ca sau xác nhận nhận bàn giao |

Đăng ký vào `02_Router.gs` (case GET + DISPATCH) theo đúng pattern hiện tại. Đăng nhập dùng lại tài khoản nhatky (`15_NhatKyAuth.gs`) → tự động có tên người KT, không phải gõ tay.

### 2.3 Frontend — trang mới `sangolf/index.html`

Mobile-first theo khung checkbom (shell 460px, Bootstrap 5, `css/shared.css`, `bdsApiFetch`):

- **Màn hình chính**: hôm nay có những lượt nào (Ca Sáng / Ca Tối, thứ Hai hiện thêm Tuần, ngày 1 hiện thêm Tháng) + trạng thái từng lượt
- **Màn checklist**: nhóm theo section A/B/C, mỗi hạng mục là 1 card chạm lớn:
  - `check` → 3 nút Đạt/Không đạt/Bỏ qua (giống status-card checkbom)
  - `number` → ô số + bàn phím số, hiện đơn vị (cm/℃/…), **tô đỏ nếu vượt ngưỡng**
  - `timerange` → 2 ô giờ bật/tắt
  - Thanh tiến độ "12/18 mục" trên đầu
- **Autosave local-first**: mỗi thao tác lưu localStorage ngay, đồng bộ ngầm lên backend (đúng nguyên tắc ROADMAP)
- **Màn bàn giao**: nhập sự cố + đề nghị ca sau → Chốt ca; ca sau đăng nhập thấy banner "Có bàn giao chờ xác nhận"

### 2.4 Báo cáo & cảnh báo (giai đoạn sau)

- Bảng tuân thủ: % mục hoàn thành theo ngày/tuần, mục "Không đạt" nổi đỏ
- Trend mức nước bể/hồ, nhiệt độ gia nhiệt theo thời gian
- Cảnh báo Telegram (dùng `TELEGRAM_BOT_TOKEN` sẵn có ở `00_Config.gs`): quá giờ chưa chốt ca, giá trị vượt ngưỡng (VD nhiệt gia nhiệt <45℃)

---

## 3. Lộ trình thực hiện

| Phase | Nội dung | Trạng thái |
|---|---|---|
| **P0 — Chốt mẫu** | Ca Tối dùng bản 13h00–21h00 (đã xóa sheet "Ca Chiều - Tối" thừa); dùng chung Google Sheet BanDienScan; mẫu dùng cho Tổ Cơ Điện Sân Golf | ✅ Chốt 2026-07-16 |
| **P1 — Dữ liệu mẫu** | Seed 70 hạng mục vào `GolfChecklistTemplates` (tự seed lần đầu gọi API, hoặc POST `seedGolfTemplates`) | ✅ Xong |
| **P2 — Backend** | `19_GolfChecklist.gs` + 6 action đăng ký trong `02_Router.gs` | ✅ Xong |
| **P3 — Frontend** | `sangolf/index.html`: cả 4 mẫu, autosave local-first, chốt ca + bàn giao + xác nhận ca sau, cảnh báo ngưỡng | ✅ Xong (gộp luôn P4) |
| **P4 — Tuần/Tháng nâng cao** | Cột "Người KT" riêng từng mục, xác nhận 2 cấp (tổ trưởng / QL sân golf) | ⏳ Chưa làm |
| **P5 — Báo cáo + Telegram nâng cao** | Trang tổng hợp tuân thủ, trend mức nước/nhiệt độ. (Đã có: Telegram thông báo khi chốt ca) | ⏳ Chưa làm |

## 4. Còn chờ bổ sung

1. **Ngưỡng cảnh báo mức nước**: "cách tràn ≤ ? cm" tương đương ≥50% cho từng bể/hồ — khi có bảng quy đổi, điền vào cột `Threshold` của sheet `GolfChecklistTemplates` (cú pháp `min:x` / `max:x` / `range:a-b`), không cần sửa code.
2. **Phân quyền theo tổ**: hiện mọi người có link đều dùng được; nếu cần giới hạn tổ Cơ Điện Golf thì nối với Teams của tài khoản nhatky.

## 5. Hướng dẫn triển khai

1. Copy `19_GolfChecklist.gs` + `02_Router.gs` (đã sửa) vào Apps Script Editor → Deploy phiên bản mới.
2. Mở `sangolf/index.html` — lần đầu gọi `getGolfTemplates` backend tự tạo 2 sheet `GolfChecklistTemplates`, `GolfChecklistRuns` và seed 70 hạng mục.
3. Muốn nạp lại mẫu gốc sau khi sửa tay: POST `action=seedGolfTemplates` với `force=true` (mất chỉnh sửa tay).
