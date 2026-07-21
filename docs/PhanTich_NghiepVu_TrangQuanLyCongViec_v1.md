# Phân tích nghiệp vụ — Làm mới Trang Quản lý Công việc

> Phạm vi: trang `nhatky/` (Kế hoạch + Nhật ký công việc) trên BanDienScan
> Mục tiêu: chuẩn hoá vòng đời công việc để nhân viên **đọc/lập kế hoạch → nhận chỉ đạo → thực hiện theo giai đoạn, phối hợp nhiều người → ghi nhật ký → bàn giao/xử lý tiếp → kết thúc hoàn thành**.
> Ngày lập: 2026-07-21 · Người lập: (BA/Kỹ sư trưởng) · Bản: v1 (nháp để chốt)

---

## 1. Bối cảnh & vấn đề

Trang `nhatky/` hiện đã có nền tảng tốt: kế hoạch (plan), bước thực hiện (steps), nhật ký (log), Kanban/List, lọc nhanh, offline queue, đồng bộ Google Sheets. Tuy nhiên mô hình dữ liệu **thiên về "một việc — một trạng thái phẳng"**, chưa mô tả đúng cách công việc M&E thực sự vận hành ngoài hiện trường:

| Nhu cầu nghiệp vụ | Hiện trạng trong code | Khoảng trống |
|---|---|---|
| Nhân viên đọc/lập kế hoạch | `plan` có đầy đủ trường; form tạo/sửa việc | ✅ Có, nhưng chưa tách "kế hoạch tự đề xuất" vs "việc được giao" |
| Nhận chỉ đạo thực hiện | `planTask` = "Ghi đúng chỉ đạo…"; nguồn email 24 cột | ⚠️ Không có **người giao** & **thời điểm giao**, không phân biệt lệnh vs tự phát |
| Ghi nhật ký | Màn Ghi nhật ký theo plan/step, có tiến độ, khối lượng | ✅ Tốt |
| Theo giai đoạn | `steps[]` = checklist phẳng (title, assignees, done) | ⚠️ Chưa có **giai đoạn** (nhóm bước có thứ tự, có cổng chuyển) |
| Phối hợp nhiều người | `assignee` (gộp chuỗi) + `step.assignees[]` | ⚠️ Không phân **chủ trì / phối hợp / giám sát** |
| Bàn giao ca | — không có | 🔴 Thiếu hoàn toàn |
| Cần xử lý tiếp | `isCarryOver` (quá hạn) + `followUpDate` | ⚠️ Suy ra gián tiếp, không phải trạng thái tường minh |
| Kết thúc hoàn thành | status `Hoàn thành` + nhãn "Đã chốt sổ" | ⚠️ Không phân biệt "xong kỹ thuật" vs "đã nghiệm thu/chốt sổ" |

**Kết luận:** cần nâng từ *trạng thái phẳng* lên *vòng đời công việc có giai đoạn, có vai trò phối hợp, có bàn giao*.

---

## 2. Tác nhân (Actors)

| Tác nhân | Vai trò trong quy trình |
|---|---|
| **Người giao việc** (Ban lãnh đạo / Kỹ sư trưởng / hệ thống email) | Ra chỉ đạo, đặt deadline, chỉ định chủ trì |
| **Người chủ trì** (lead) | Chịu trách nhiệm chính 1 việc/giai đoạn, lập kế hoạch chi tiết, chốt hoàn thành |
| **Người phối hợp** (support) | Cùng thực hiện bước/giai đoạn, ghi nhật ký phần việc của mình |
| **Người giám sát / nghiệm thu** | Kiểm tra kết quả, xác nhận đóng việc / chốt sổ |
| **Ca trực nhận bàn giao** | Tiếp nhận việc dở dang từ ca trước |

> Ghi chú hệ thống: 3 nguồn danh tính người dùng đã được gộp qua `BD_SSO.getOperatorName()` (xem báo cáo rà soát v2.10.1). Vai trò nên gắn theo tài khoản này để báo cáo theo người khớp nhau.

---

## 3. Vòng đời công việc (State machine đề xuất)

Trạng thái hiện tại: `Chưa làm → Đang làm → Hoàn thành / Đã hủy` + nhãn `Cần hỗ trợ`.
Đề xuất mở rộng thành vòng đời tường minh (giữ tương thích ngược — map được từ status cũ):

```
                 ┌──────────────┐
   (được giao)   │  1. TIẾP NHẬN │  ← từ email/chỉ đạo, hoặc tự lập kế hoạch
                 └──────┬───────┘
                        │ nhận chỉ đạo / phân công chủ trì
                        ▼
                 ┌──────────────┐
                 │ 2. ĐÃ LÊN KH  │  ← có người chủ trì + giai đoạn + deadline
                 └──────┬───────┘
                        │ bắt đầu thực tế
                        ▼
        ┌───────────────────────────────┐
        │        3. ĐANG THỰC HIỆN        │  ← chạy theo GIAI ĐOẠN
        │  [GĐ1] → [GĐ2] → [GĐ3] …        │
        └───┬───────────┬──────────┬─────┘
            │           │          │
   cần hỗ trợ│   hết ca/dở dang│   xong kỹ thuật
            ▼           ▼          ▼
     ┌───────────┐ ┌──────────┐ ┌──────────────┐
     │4a.CẦN HỖ  │ │4b.BÀN GIAO│ │5. CHỜ NGHIỆM  │
     │   TRỢ     │ │ /XỬ LÝ TIẾP│ │   THU         │
     └─────┬─────┘ └────┬──────┘ └──────┬───────┘
           │            │ ca sau tiếp nhận│ nghiệm thu đạt
           └─────►(về 3)◄┘                ▼
                                   ┌──────────────┐
                                   │ 6. HOÀN THÀNH │ → (Đã chốt sổ)
                                   └──────────────┘
                                          │ hủy bất kỳ lúc nào
                                          ▼   ┌──────────┐
                                              │  ĐÃ HỦY   │
                                              └──────────┘
```

**Ánh xạ tương thích với dữ liệu cũ (không mất dữ liệu):**

| Vòng đời mới | Từ dữ liệu cũ |
|---|---|
| Tiếp nhận / Đã lên KH | `status = "Chưa làm"` |
| Đang thực hiện | `status = "Đang làm"` |
| Cần hỗ trợ | nhãn `Cần hỗ trợ` hoặc `priority = Khẩn cấp` |
| Bàn giao / Xử lý tiếp | `isCarryOver` (quá hạn, chưa xong) hoặc có `followUpDate` |
| Hoàn thành | `status = "Hoàn thành"` |
| Đã chốt sổ | nhãn `Đã chốt sổ` |
| Đã hủy | `status = "Đã hủy"` |

---

## 4. Sáu luồng nghiệp vụ (đối chiếu yêu cầu)

### 4.1 Đọc / lập kế hoạch
- **Đọc:** danh sách theo ngày/tuần, lọc nhanh (Tất cả · Chưa xong · Cần hỗ trợ · Việc của tôi), Kanban theo trạng thái. → *đã có.*
- **Lập:** form tạo việc (`date, time, team, assignee, area, asset, task, planQty, unit, type, priority, status, labels`). → *đã có.*
- **Bổ sung đề xuất:** phân biệt **nguồn** việc (Tự lập KH / Được giao qua email / Được chỉ đạo trực tiếp) — thêm trường `source` + `assignedBy` để truy vết "ai giao".

### 4.2 Nhận chỉ đạo thực hiện
- Hiện `planTask` yêu cầu "Ghi đúng chỉ đạo: việc gì cần làm, tiêu chí xong". Nguồn email đổ vào sheet 24 cột (`Nguồn`, `Đơn vị thực hiện`, `Tổ đội/Người thực hiện`, `Nội dung công việc`).
- **Bổ sung đề xuất:**
  - Trường **`assignedBy`** (người giao) + **`assignedAt`** (thời điểm nhận chỉ đạo) + **`directive`** (nguyên văn chỉ đạo, tách khỏi mô tả kỹ thuật).
  - **Tiêu chí hoàn thành** (`doneCriteria`) tách riêng để người chủ trì và người nghiệm thu cùng nhìn 1 chuẩn.
  - Nút **"Xác nhận đã nhận việc"** (acknowledge) → chuyển `Tiếp nhận → Đã lên KH`, ghi mốc thời gian.

### 4.3 Ghi nhật ký
- Đã có màn Ghi nhật ký gắn `planId`/`stepId`, tiến độ (Hoàn thành/Đang làm/Cần hỗ trợ), giờ bắt đầu, kết quả theo người, khối lượng + lũy kế. → *tốt, giữ nguyên.*
- **Bổ sung đề xuất:** cho ghi nhật ký **theo giai đoạn** (không chỉ theo bước lẻ), và nhật ký loại **"bàn giao"** (xem 4.6).

### 4.4 Theo giai đoạn (nâng cấp `steps`)  — ✅ đã chốt
- Hiện `steps[]` là checklist phẳng: `{id, title, assignees[], done, doneAt, doneBy}`. Nhiều người/nhiều giai đoạn đang bị gộp chung một tầng.
- **Một mẫu chung cho mọi việc** (chốt): cùng cấu trúc `phases[]`, chỉ khác cách khởi tạo:
  - **Việc lớn** → gợi ý sẵn danh mục cố định **Khảo sát → Vật tư → Thi công → Nghiệm thu** (chủ trì có thể thêm/bớt).
  - **Việc nhỏ** → chủ trì tự đặt tên giai đoạn (hoặc để 1 giai đoạn mặc định "Thực hiện").
  → Cùng 1 data model, khác template khởi tạo — không tách 2 loại việc.
- **Mô hình 2 tầng:**
  ```jsonc
  phases: [
    { id, name:"Khảo sát", order:1, status:"done",
      steps:[ {id,title,assignees[],done,doneAt,doneBy}, … ] },
    { id, name:"Thi công", order:2, status:"doing", steps:[ … ] },
    { id, name:"Nghiệm thu", order:3, status:"todo", steps:[…] }
  ]
  ```
  - Tiến độ hiển thị `GĐ 2/3 · bước 4/6`.
  - **Cổng chuyển — gọn nhẹ (chốt):** KHÔNG khoá cứng. Cho phép làm giai đoạn sau nhưng nếu giai đoạn trước chưa xong thì **hiện cảnh báo mềm** ("GĐ Khảo sát chưa xong — vẫn tiếp tục?"). Không có trường `gate` phức tạp → nhẹ, không cản việc gấp.
  - Tương thích ngược: nếu chỉ có `steps` cũ → tự bọc vào 1 giai đoạn mặc định "Thực hiện".

### 4.5 Phối hợp nhiều người
- Hiện gộp chuỗi `assignee` + `step.assignees[]`, không phân vai.
- **Đề xuất phân vai rõ:**
  ```jsonc
  people: [
    { name:"Huy PBĐ", role:"lead" },      // chủ trì — chịu trách nhiệm chốt
    { name:"Báu",     role:"support" },   // phối hợp
    { name:"…",       role:"reviewer" }   // giám sát/nghiệm thu
  ]
  ```
  - Đúng với test case email thực tế: *"Đ/c Huy PBĐ thực hiện… (Đ/c Báu phối hợp)"* → tự tách `lead=Huy PBĐ`, `support=Báu`.
  - Chip người hiển thị huy hiệu vai trò (★ chủ trì · ○ phối hợp · ✔ nghiệm thu).
  - Mỗi người ghi nhật ký & khối lượng riêng phần mình (đã có nền qua kết quả theo người).
  - **Nghiệm thu không cố định người (chốt):** `reviewer` là vai trò tuỳ chọn, không bắt buộc gán trước. Bất kỳ ai (chủ trì hoặc người khác) đều có thể bấm nghiệm thu/chốt sổ; phần mềm tự ghi lại `closedBy` + `closedAt` làm bằng chứng (xem 4.6c).

### 4.6 Bàn giao / Cần xử lý tiếp / Kết thúc hoàn thành
Đây là khoảng trống lớn nhất — cần bổ sung 3 cơ chế:

**(a) Bàn giao ca (handover)** — 🔴 mới · ✅ đã chốt (bàn giao cả theo người & theo ca/tổ):
```jsonc
handover: {
  at, fromUser,
  toType: "person" | "shift",   // chốt: hỗ trợ cả 2 — giao cho 1 người, hoặc giao cho ca/tổ trực
  toUser,                        // khi toType="person"
  toTeam,                        // khi toType="shift" (mã ca/tổ, sau này nối phanca/)
  progressNote:"Đã kéo cáp xong 60m, còn 40m",
  pending:"Chưa đấu nối tủ T2 — chờ cắt điện 22h",
  risk:"Khu vực ẩm, lưu ý an toàn"
}
```
- Nút **"Bàn giao việc"** ở màn chi tiết → chọn *giao cho người* hay *giao cho ca/tổ* → tạo bản ghi nhật ký loại `handover`, chuyển việc sang trạng thái *Bàn giao/Xử lý tiếp*, hiện nổi ở đầu danh sách ca sau.
- Ca sau bấm **"Nhận bàn giao"** → việc quay lại *Đang thực hiện* dưới tên người/ca mới, giữ nguyên lịch sử.
- **Phần mềm tự ghi tên + giờ** ở cả bước bàn giao và nhận (thay cho chữ ký giấy — chốt) → chính bản ghi này là bằng chứng.
- **Nối `phanca/`** (chọn ca/tổ từ bảng phân ca) để dành cho phát triển mở rộng — giai đoạn đầu cho nhập/chọn tên ca thủ công, chưa cần tích hợp cứng.

**(b) Cần xử lý tiếp** — nâng từ suy luận thành tường minh:
- Hiện suy ra qua `isCarryOver` (quá deadline mà chưa `Hoàn thành`) và `followUpDate`.
- Đề xuất: trạng thái/nhãn tường minh **"Cần xử lý tiếp"** + `nextAction` (việc cần làm tiếp) + `followUpDate`. Lọc nhanh riêng "Cần xử lý tiếp" bên cạnh "Cần hỗ trợ".

**(c) Kết thúc hoàn thành** — tách 2 mốc:
- **Xong kỹ thuật** (`Hoàn thành`): người chủ trì đánh dấu khi tất cả giai đoạn/bước done.
- **Đã nghiệm thu/chốt sổ** (`Đã chốt sổ`): **bất kỳ ai** xác nhận đạt tiêu chí (không cố định người nghiệm thu — chốt) → khóa việc, **phần mềm tự ghi** `closedBy`, `closedAt`, `result` (kết quả xử lý — đã có cột W trong sheet 24 cột). Bản ghi tự động này thay cho chữ ký.

---

## 5. Mô hình dữ liệu đề xuất (gap so với hiện tại)

Giữ nguyên các trường plan hiện có, **thêm** (đều optional để không phá dữ liệu cũ):

| Trường mới | Kiểu | Ý nghĩa | Map sheet 24 cột |
|---|---|---|---|
| `source` | enum | Tự lập / Email / Chỉ đạo trực tiếp | I. Nguồn |
| `assignedBy` | string | Người giao | X. Ghi chú (nguồn) |
| `assignedAt` | ISO | Thời điểm nhận chỉ đạo | K. Ngày phản ánh |
| `directive` | text | Nguyên văn chỉ đạo | U. Nội dung |
| `doneCriteria` | text | Tiêu chí hoàn thành | — |
| `people[]` | array | `{name, role}` chủ trì/phối hợp/nghiệm thu | S,T. Đơn vị/Người TH |
| `phases[]` | array | Giai đoạn chứa `steps[]` (chi tiết dưới) | — |
| `lifecycle` | enum | Vòng đời §3 | G. Trạng thái |
| `nextAction` | text | Việc cần xử lý tiếp | — |
| `handover` | object | Bản ghi bàn giao gần nhất | — |
| `closedBy/closedAt/result` | — | Nghiệm thu/chốt sổ | L,Q,W |
| `photos[]` | array | Ảnh minh hoạ ở mọi điểm ghi (link Drive) | F. ImageURL (sheet Logs) |

**Chi tiết `phases[]` (một mẫu chung — §4.4):**
```jsonc
phases: [
  {
    id, name, order, status,       // status: "todo"|"doing"|"done"
    steps: [
      { id, title, assignees:[…],  // gán người từ DANH BẠ, LỌC THEO CÙNG TAG với việc
        done, doneAt, doneBy,
        photos:[ {url, by, at} ] }  // ảnh của riêng bước (tuỳ chọn)
    ]
  }
]
```
- **Bước CRUD**: thêm / sửa tên / xoá bước (nối tiếp `addStep/renameStep/deleteStep` đã có).
- **Assignee lọc theo tag**: picker chỉ hiện người **cùng tag** với việc/khu vực (vd #Điện), lấy từ danh bạ — không đổ toàn bộ danh sách.

**Ảnh (`photos[]`) gắn được ở 5 điểm ghi:** chỉ đạo · kế hoạch · phát sinh · nhật ký · bàn giao. Mỗi ảnh `{url, by, at}`.

> Nguyên tắc kỹ thuật (bám code hiện tại): tiếp tục lưu mảng dưới dạng **JSON string trong 1 cột** như `steps` đang làm (`plan.steps = JSON.stringify(...)`), cập nhật local trước → `syncPlanInBackground` → Google Sheets. **Ảnh tái dùng cơ chế sẵn có**: upload Google Drive → lưu link ở cột `ImageURL` (sheet Logs), không thêm bảng mới. **Đúng quy tắc CLAUDE.md: không đổi cấu trúc 24 cột, không ghi đè dữ liệu gốc khi chưa xác nhận.**

---

## 6. Đề xuất màn hình — hướng GỌN NHẸ (chốt)

> Định hướng: theo tinh thần dashboard M&E (`00_Dashboard_M&E.md`) — **nhóm theo việc cần chú ý, dòng danh sách + chấm màu, bỏ thẻ nặng**. Xem mockup: **https://claude.ai/code/artifact/ea0e52f5-f72d-415b-9e6a-55c4d1dd8b14**

**Nguyên tắc thị giác:** thẻ nặng → dòng gọn · badge to → chấm màu nhỏ · bỏ thanh segment (chỉ chữ "GĐ 2/3") · **nhóm sẵn theo "hôm nay"** thay vì lọc nhiều chip · Kanban thành view phụ.

**Màn A — Bảng việc "Hôm nay" (màn chính):** danh sách nhóm theo ưu tiên, mỗi dòng = chấm màu trạng thái + tên + 1 dòng meta (người ★/○ + "GĐ x/y"), chạm dòng để mở:
1. **Cần xử lý tiếp** (bàn giao chờ nhận / quá hạn)
2. **Đang làm**
3. **Chờ nghiệm thu**
4. **Lịch sắp tới · 7 ngày** (PM tới hạn — như mục `## Lịch PM sắp tới` của dashboard)
- Có ô tìm nhanh + chọn ngày; nút **＋ Việc mới**.
- **Avatar tài khoản góc phải app-bar** → sheet: tên + ca trực, phóng chữ A/A+/A++, đăng xuất (chốt đúng danh tính người ghi — khắc phục lỗi "3 nguồn tên").

**Màn B — Chi tiết (mục phẳng, kẻ mảnh, không thẻ lồng thẻ):**
1. *Chỉ đạo & tiêu chí* — nguyên văn chỉ đạo + tiêu chí xong + **ảnh chỉ đạo**.
2. *Giai đoạn & bước* — GĐ 2 tầng; giai đoạn đang chạy **mở ra bước con** (checkbox, tên, **chip người gán theo tag danh bạ**, ảnh bước, `⋮` sửa/xoá, `＋ Thêm bước`).
3. *Nhật ký & phát sinh* — timeline gộp cả bản ghi **bàn giao**, mỗi dòng đính **ảnh**; nút *＋ Ghi nhật ký* / *📷 Đính ảnh*.
4. Hàng nút cuối: **⇄ Bàn giao** · **✓ Nghiệm thu · Chốt sổ**.

**Màn C — Bàn giao (form 1 tấm, gọn):** segmented **Cho người / Cho ca-tổ** · 3 ô *đã làm · cần xử lý tiếp · lưu ý an toàn* · **ảnh hiện trạng** · dòng auto-ghi tên+giờ. Kèm khối **Truy cập nhanh** (Danh bạ · Phân ca · Check bơm · Báo cáo) như dashboard.

**View phụ — Kanban:** thêm cột *Bàn giao/Xử lý tiếp* và *Chờ nghiệm thu* giữa *Đang làm* và *Hoàn thành*; không phải màn mặc định.

---

## 7. Lộ trình triển khai đề xuất (ưu tiên)

| Ưu tiên | Hạng mục | Ghi chú |
|---|---|---|
| P1 | Vai trò người (`people[]` lead/support/reviewer) + hiển thị chip | Rủi ro thấp, đắt giá nghiệp vụ; tách được từ email test case |
| P1 | Trạng thái vòng đời tường minh + map ngược dữ liệu cũ | Không mất dữ liệu; nền cho Kanban mới |
| P2 | Giai đoạn (`phases[]`) bọc `steps[]` + tiến độ 2 tầng | Bọc steps cũ vào GĐ mặc định |
| P2 | Bàn giao ca (handover) + "Nhận bàn giao" | Lấp khoảng trống lớn nhất |
| P3 | Tách "Xong kỹ thuật" vs "Đã nghiệm thu/chốt sổ" + `result` | Đồng bộ cột W/L/Q sheet 24 cột |
| P3 | Chỉ đạo/`assignedBy`/`doneCriteria` + nút "Xác nhận nhận việc" | Truy vết trách nhiệm |

**Không đề xuất:** viết lại thành SPA lớn hay đổi cấu trúc 24 cột (rủi ro cao, lợi ích thấp — thống nhất với báo cáo rà soát v2.11.0).

---

## 8. Quyết định đã chốt (2026-07-21)

| # | Vấn đề | Quyết định |
|---|---|---|
| 1 | Giai đoạn | **Một mẫu chung.** Việc lớn gợi ý danh mục cố định *Khảo sát → Vật tư → Thi công → Nghiệm thu*; việc nhỏ chủ trì tự đặt tên (hoặc 1 GĐ mặc định). Cùng data model `phases[]`. |
| 2 | Cổng chuyển giai đoạn | **Gọn nhẹ — cảnh báo mềm, không khoá cứng.** Làm GĐ sau vẫn được, chỉ nhắc nếu GĐ trước chưa xong. Không thêm trường `gate`. |
| 3 | Bàn giao | **Cả 2:** theo *người* và theo *ca/tổ* (`toType`). Nối `phanca/` để **mở rộng sau**; giai đoạn đầu chọn/nhập ca thủ công. |
| 4 | Nghiệm thu/chốt sổ | **Không cố định người.** Bất kỳ ai cũng nghiệm thu/chốt sổ được; `reviewer` chỉ là vai trò tuỳ chọn. |
| 5 | Ký xác nhận | **Không ký giấy — phần mềm tự ghi** tên + giờ (`closedBy/closedAt`, handover `fromUser/at`) làm bằng chứng. |

| 6 | Định hướng UI | **Gọn nhẹ theo dashboard M&E.** Bảng "Hôm nay" nhóm theo ưu tiên, dòng danh sách + chấm màu, bỏ thẻ nặng/segment. Kanban là view phụ. |
| 7 | Gán người cho bước | **Lọc theo cùng tag.** Picker chỉ hiện người cùng tag với việc/khu vực (vd #Điện) từ danh bạ. |
| 8 | Ảnh minh hoạ | **Đính ở 5 điểm ghi:** chỉ đạo · kế hoạch · phát sinh · nhật ký · bàn giao. Tái dùng Drive + cột `ImageURL`. |
| 9 | Màn A | Thêm nhóm **"Lịch sắp tới · 7 ngày"** (PM tới hạn) như dashboard. |

### Ảnh hưởng tới thiết kế
- Bỏ trường `gate` khỏi `phases[]` → mô hình nhẹ hơn.
- Thêm `toType` vào `handover`; `reviewer` trong `people[]` là optional.
- Thêm `photos[]` cho việc/bước/nhật ký/bàn giao; `steps[].assignees` lọc theo tag danh bạ.
- Mọi hành động chốt/bàn giao đều đính kèm người + thời gian tự động (đã có `currentUser()` + timestamp trong code).
- Trang chủ chuyển sang **bảng nhóm theo "hôm nay"** thay danh sách phẳng + lọc chip.
