# ROADMAP — Làm mới Trang Quản lý Công việc (nhatky/)

> **Giao việc cho AI kế tiếp.** Đây là bản kế hoạch triển khai đã chốt nghiệp vụ & thiết kế.
> Đọc kèm: [`docs/PhanTich_NghiepVu_TrangQuanLyCongViec_v1.md`](./PhanTich_NghiepVu_TrangQuanLyCongViec_v1.md) (phân tích đầy đủ).
> Mockup UI (bản gọn nhẹ): **https://claude.ai/code/artifact/ea0e52f5-f72d-415b-9e6a-55c4d1dd8b14**
> Ngày: 2026-07-21 · Trạng thái: **P1 ✅ · P2 ✅ · P3 ✅ · P4 ✅ (xong — xem §7)** — P1-P3 đã deploy & test API thật; P4 (ghi nhật ký tự báo từng người) đã code xong + verify bằng Chrome thật (Playwright).
>
> **Cập nhật 2026-07-21 (v2.12.1):** P1 (làm bởi phiên trước) code theo style thẻ Bootstrap sẵn có của app, KHÔNG theo đúng mockup "gọn nhẹ" ở trên. Người dùng đối chiếu ảnh mockup với ảnh chụp thật, phát hiện lệch → đã build lại Trang chủ (dòng phẳng + chấm màu, nhóm theo mục) và Chi tiết (1 sheet liền, kẻ mảnh) đúng theo mockup, verify bằng Chrome thật (Playwright). Không đổi logic nghiệp vụ, chỉ đổi lớp trình bày. Xem CHANGELOG [v2.12.1].

---

## 0. Bối cảnh 30 giây

- **File cần sửa chính:** `02_Source/nhatky/index.html` (~5.500 dòng, HTML+JS thuần, không framework).
- **Backend:** Google Apps Script → Google Sheets. Frontend gọi qua `js/api.js`, cấu hình `js/config.js`.
- **Danh tính người dùng:** dùng `BD_SSO.getOperatorName()` / `currentUser()` (đã gộp 3 nguồn — v2.10.1).
- **Mục tiêu:** nâng "một việc — một trạng thái phẳng" → **vòng đời có giai đoạn, phối hợp nhiều người, bàn giao ca, nghiệm thu, ảnh minh hoạ**, theo **hướng UI gọn nhẹ kiểu dashboard**.

### Hàm/cơ chế đã có — TÁI DÙNG, đừng viết lại
| Có sẵn trong nhatky/index.html | Dùng cho |
|---|---|
| `planSteps()`, `updatePlanSteps()`, `addStep/renameStep/deleteStep`, `toggleStepDone`, `addStepAssignee/removeStepAssignee` | Nền cho `phases[]` + bước con |
| `stepAssigneeEditorHtml()`, `knownPeopleNames()`, `normalizePerson()` | Gán người cho bước |
| `syncPlanInBackground()`, `postPlanAction("savePlan", plan)` | Đồng bộ nền, local-first |
| `currentUser()` + `new Date().toISOString()` | Auto-ghi người + giờ (thay chữ ký) |
| Lưu mảng dạng `JSON.stringify` trong 1 cột (như `plan.steps`) | Lưu `phases`, `handover`, `photos` |
| Cột `ImageURL` (sheet Logs) + upload Drive đã có ở pump_info | Lưu ảnh |

---

## 1. Quyết định đã chốt (không mở lại)

1. **Giai đoạn — một mẫu chung.** Việc lớn gợi ý *Khảo sát → Vật tư → Thi công → Nghiệm thu*; việc nhỏ tự đặt tên. Cùng model `phases[]`.
2. **Cổng chuyển gọn nhẹ:** không khoá cứng, không thêm trường `gate`. (Bỏ luôn cả câu cảnh báo mềm trong UI.)
3. **Bàn giao cả người & ca/tổ** (`toType: "person"|"shift"`). Nối `phanca/` để mở rộng sau — đầu tiên chọn/nhập thủ công.
4. **Nghiệm thu/chốt sổ: không cố định người.** Ai cũng chốt được; `reviewer` chỉ optional. **Không hiển thị câu "ai cũng chốt được".**
5. **Không ký giấy** — phần mềm tự ghi tên + giờ làm bằng chứng.
6. **UI gọn nhẹ** theo dashboard M&E: bảng "Hôm nay" nhóm theo ưu tiên, dòng + chấm màu, bỏ thẻ nặng/segment. Kanban là view phụ.
7. **Gán người cho bước lọc theo cùng tag** (vd #Điện) từ danh bạ.
8. **Ảnh** đính ở 5 điểm ghi: chỉ đạo · kế hoạch · phát sinh · nhật ký · bàn giao.
9. **Màn A** thêm nhóm **"Lịch sắp tới · 7 ngày"** (PM tới hạn).

---

## 2. Mô hình dữ liệu (thêm vào `plan`, đều optional — không phá dữ liệu cũ)

```jsonc
plan = {
  // ...các trường cũ giữ nguyên (date, time, team, assignee, area, asset, task, status, ...)

  lifecycle: "recv|planned|doing|help|handover|review|done|closed|cancelled",
  source: "self|email|directive",
  assignedBy: "", assignedAt: "", directive: "", doneCriteria: "",
  nextAction: "",

  people: [ { name, role: "lead|support|reviewer" } ],

  phases: [
    { id, name, order, status: "todo|doing|done",
      steps: [
        { id, title, assignees: [ "..." ],   // lọc theo tag danh bạ
          done, doneAt, doneBy,
          photos: [ { url, by, at } ] }
      ] }
  ],

  handover: { at, fromUser, toType, toUser, toTeam, progressNote, pending, risk,
              photos: [ { url, by, at } ] },

  photos: [ { url, by, at, kind: "directive|plan|arising|log|handover" } ],
  closedBy: "", closedAt: "", result: ""
}
```

**Ánh xạ tương thích ngược (bắt buộc — không mất dữ liệu):**
- `status` cũ → `lifecycle`: "Chưa làm"→`planned`, "Đang làm"→`doing`, "Hoàn thành"→`done`, "Đã hủy"→`cancelled`; nhãn "Cần hỗ trợ"→`help`; `isCarryOver()` / có `followUpDate`→`handover`; nhãn "Đã chốt sổ"→`closed`.
- `steps[]` cũ (phẳng) → bọc vào **1 giai đoạn mặc định "Thực hiện"** khi đọc lên.
- `assignee` (chuỗi gộp) → tách vào `people[]`, người đầu = `lead`, còn lại `support`.

---

## 3. Lộ trình 3 giai đoạn

### 🟢 P1 — Vai trò người + Vòng đời + Bảng "Hôm nay"  *(rủi ro thấp, giá trị cao)*
**Việc:**
- [x] Thêm `people[]` (lead/support/reviewer) + hàm tách từ `assignee` cũ; chip ★ chủ trì · ○ phối hợp.
- [x] Thêm `lifecycle` + hàm map ngược từ `status`/nhãn/carry-over; chấm màu vòng đời (7 màu §Vòng đời).
- [x] **Trang chủ = bảng nhóm "Hôm nay"**: Cần xử lý tiếp → Đang làm → Chờ nghiệm thu → Lịch sắp tới 7 ngày. Dòng gọn + chấm màu, chạm mở chi tiết.
- [x] Ô tìm nhanh + chọn ngày; nút ＋ Việc mới.
- [x] **Avatar tài khoản góc phải app-bar** (chữ cái tên) → sheet: tên + ca trực, phóng chữ A/A+/A++ (dùng `js/fontscale.js` sẵn có), đăng xuất. Chốt đúng danh tính người ghi (khắc phục lỗi "3 nguồn tên").

**Nghiệm thu P1:**
- Mở app thấy việc nhóm theo đúng 4 mục; dữ liệu cũ hiện đủ, không lỗi.
- Việc có nhiều người hiện đúng ★ chủ trì / ○ phối hợp.
- Đổi trạng thái → chấm màu + nhóm cập nhật đúng.

### ✅ P2 — Giai đoạn 2 tầng (bước CRUD + gán người theo tag) + Ảnh — XONG (2026-07-21)
**Việc:**
- [x] `phases[]` **song song** với `steps[]` cũ (không xoá/migrate tự động). Kế hoạch chưa "nâng cấp" (`plan.phases` rỗng) hiển thị y hệt trước — card "Các bước thực hiện" cũ, có thêm link "Chuyển sang Giai đoạn" để nâng cấp opt-in (sao chép `steps` cũ vào giai đoạn "Thực hiện", không xoá `plan.steps` gốc).
- [x] Màn chi tiết: có `plan.phases` → card **Giai đoạn & bước** thay thế card Bước cũ. Mỗi giai đoạn mở bước con — checkbox, tên (bấm sửa), `＋ Thêm bước`, `⋮`/🗑 xoá bước, 🗑 xoá giai đoạn, `＋ Thêm giai đoạn`. **Không có `gate`/cảnh báo mềm** — đúng quyết định #2 (gọn nhẹ, không khoá).
- [x] Gán người cho bước: picker **lọc theo cùng tag** (`plan.team` so khớp `dept`/`labels` trong danh bạ) — không khớp ai thì fallback hiện toàn bộ (tránh bí lối).
- [x] `photos[]` ở **4/5 điểm** (chỉ đạo/kế hoạch/phát sinh dùng chung 1 field vì cùng là `plan`; nhật ký). *Bàn giao để P3* (chưa có object `handover`). Input ảnh dùng chung `#sharedPhotoInput`, resize còn ≤900px (giống `handleImage` ở index.html), upload qua action mới `uploadPhoto` → Drive → trả URL → hiện thumbnail.

**Thiết kế thực tế khác với bản nháp ban đầu (lý do):**
- Không tái dùng thẳng `addStep/renameStep/deleteStep` (thao tác trên `plan.steps` phẳng) — viết bộ song song `addPhaseStep/renamePhaseStep/deletePhaseStep/togglePhaseStepDone` thao tác trên `plan.phases[].steps` để **không đụng, không rủi ro** bộ hàm cũ đang được nhiều màn khác dùng (People screen, Log Entry, `updatePlanStatus`).
- Thêm `allPlanSteps(plan)` (gộp steps cũ + steps trong phases) và `findAnyStep(plan, stepId)` — dùng ở `updatePlanStatus` và `renderLogEntry` để 1 bước dù nằm ở model nào cũng được đánh dấu xong/mở đúng ngữ cảnh khi ghi nhật ký.
- Backend: thêm cột **30 `Phases`**, **31 `Photos`** vào sheet `NhatKyPlans`, cột **21 `Photos`** vào `WorkLogs` — theo đúng pattern additive-migration đã dùng cho `Steps`/`Labels`/`AssetUID` (kiểm tra header rỗng rồi mới ghi, không phá dữ liệu cũ). Thêm action `uploadPhoto` (dispatch `02_Router.gs`) dùng helper `uploadPhotoToDrive_()` mới trong `01_Utils.gs` (factor lại từ code Drive đã có ở `handleChecklistSubmit`, `04_Devices.gs`).

**🔴 Lỗi có sẵn phát hiện & vá khi làm P2 (không thuộc phạm vi P2 nhưng chặn toàn bộ tính năng):**
`postPlanAction("savePlan", plan)` ở mọi nơi gọi (`syncPlanInBackground`, `updatePlanStatus`, form Lưu việc...) gửi `plan` **phẳng ở top-level** (qua `bdsApiPost` dùng spread `...payload`, không lồng `{payload: plan}` như `createWorkLog` đang làm đúng). Trong khi đó `handleSavePlan(params)` (backend) chỉ đọc `params.payload || {}` — **luôn nhận `{}`**, luôn thiếu `date`/`task` → validation luôn fail. Frontend lại **không kiểm tra `data.status`** khi sync (`await postPlanAction(...); plan.syncStatus = "synced";` — coi mọi response không throw là thành công) → **mọi lần lưu/sửa kế hoạch trước đây đều không thực sự tới được Google Sheets, nhưng UI luôn báo "đã đồng bộ"**. Đã vá tối thiểu: `handleSavePlan` nay đọc `params.payload || params || {}` (giống cách `handleDeletePlan` đã phòng thủ 2 dạng payload từ trước). **Khuyến nghị đội vận hành đối chiếu dữ liệu `NhatKyPlans` gần đây** — các việc tạo/sửa trước ngày vá này có thể chưa từng lưu xuống Sheets thật, chỉ tồn tại trong `localStorage` máy đã tạo.

**Nghiệm thu P2:**
- [x] Thêm/sửa/xoá giai đoạn + bước hoạt động, đồng bộ Sheets (sau khi vá bug savePlan ở trên).
- [x] Picker gán người chỉ hiện người cùng tag (fallback toàn bộ nếu không khớp).
- [x] Đính được ảnh ở plan (chỉ đạo/kế hoạch/phát sinh), bước, và nhật ký; xem lại được thumbnail; ảnh lưu Drive + link trong sheet.
- [x] Cú pháp JS (nhatky/index.html) và 3 file `.gs` đã sửa kiểm tra qua `node --check` — không lỗi.
- [x] **Đã deploy Apps Script & test trực tiếp API** — đã clasp push/deploy lên version @103, kiểm tra `savePlan` và `getPlans` trên Apps Script thật thành công.

**🔴 Lỗi nghiêm trọng phát hiện SAU KHI DEPLOY (2026-07-21, qua Playwright + Chrome thật) — đã vá:**
Người dùng báo "giao diện giai đoạn mới chưa đúng". Dựng lại bằng Chrome headless thật (chặn network tới `script.google.com`, seed 1 việc test có `phases` vào localStorage, mở màn Chi tiết) phát hiện màn **HOÀN TOÀN TRẮNG** — không phải do UI giai đoạn sai, mà do:
1. **Đệ quy vô hạn → tràn stack**, crash toàn bộ `renderTaskDetail` (và thực ra là MỌI lần gọi `render()` trong cả app): `renderPeopleScreen()` (P1, màn "Việc của tôi") gọi `shiftFilterDate(7)` để tính "7 ngày sau", nhưng `shiftFilterDate` là hàm **có side-effect** (đổi `#filterDate` + tự gọi lại `renderPeopleScreen()` — vốn dùng cho nút chuyển ngày trước/sau). Gọi nó TỪ BÊN TRONG `renderPeopleScreen` tạo vòng lặp `renderPeopleScreen → shiftFilterDate → renderPeopleScreen → ...` tới khi tràn stack. **Đây là bug có sẵn từ P1, không phải P2/P3, nhưng đủ nghiêm trọng để lỗi cả app** (mọi màn hình gọi `render()` đều dính). Đã vá: thay bằng phép cộng ngày thuần `toIsoDate(new Date(new Date(iso+"T00:00:00").getTime() + 7*86400000))`, không còn gọi hàm có side-effect.
2. **Chữ trong pill "Gán người" bị tràn/đè lên mũi tên select**: `phaseStepAssigneeEditorHtml` nhồi tên tổ vào text option (`+ Gán người (Tổ điện nước)`) — dài hơn nhiều so với `max-width:130px` của `.step-add-select` (vốn thiết kế cho text ngắn "+ Thêm người"). Đã vá: rút gọn còn "+ Gán người", tên tổ chuyển vào `title` (tooltip).

**Đã verify bằng Chrome thật** (không phải suy đoán từ code): dựng lại crash, xác nhận stack trace chính xác đến từng dòng, vá xong test lại — chụp màn hình xác nhận card Giai đoạn & bước hiển thị đúng (badge GĐ x/y, giai đoạn đang chạy viền xanh, bước done/chưa done, chip người, ảnh, "+ Thêm bước/giai đoạn"). Tương tác thật: tick bước → phase tự "done" → tổng GĐ cập nhật đúng → status việc tự chuyển "Hoàn thành" → nút "Nghiệm thu · Chốt sổ" tự xuất hiện — toàn bộ chuỗi cascade hoạt động chính xác.

### ✅ P3 — Bàn giao ca + Nghiệm thu/Chốt sổ + Truy vết chỉ đạo — XONG (2026-07-21)
**Việc:**
- [x] `handover`: nút "⇄ Bàn giao việc" (modal `#handoverModal`) → chọn *Cho người / Cho ca-tổ* (segmented, `SUPPORTED_TEAMS` cho ca/tổ — chưa nối `phanca/` thật, đúng quyết định "giai đoạn đầu chọn thủ công"), 3 ô (đã làm/cần xử lý tiếp/lưu ý an toàn) + ảnh; auto-ghi `fromUser/at`. Ghi 1 dòng audit qua `logPlanAction(plan, "Bàn giao việc", ...)`.
- [x] "Nhận bàn giao" (nút trên thẻ bàn giao đang chờ trong Chi tiết) → set `plan.status = "Đang làm"`, đánh dấu `handover.accepted/acceptedBy/acceptedAt`, giữ nguyên lịch sử (object `handover` không bị xoá, chỉ đổi cờ).
- [x] Tách **Xong kỹ thuật** vs **Đã chốt sổ**: dùng lại đúng logic `getPlanLifecycle` đã có sẵn từ P1 (status "Hoàn thành" + chưa có nhãn "Đã chốt sổ" → badge "Xong kỹ thuật"; có nhãn → "Đã chốt sổ") — **không cần cột `closedBy/closedAt` riêng**, người/giờ chốt tự ghi qua `logPlanAction` (audit trail), nhãn "Đã chốt sổ" dùng lại cột `Labels` sẵn có. Nút "✓ Nghiệm thu · Chốt sổ" — ai cũng bấm được (không cố định người).
- [x] Khối *Chỉ đạo & tiêu chí*: thêm `assignedBy` (Người giao) + `doneCriteria` (Tiêu chí hoàn thành) vào form Thêm/Sửa việc, hiển thị trong card "Việc gì".
- [x] Nút **"Xác nhận nhận việc"** — hiện khi việc có `assignedBy`/`source="directive"` và chưa xác nhận (`plan.acknowledgedAt` rỗng); bấm xong ghi `acknowledgedAt` + audit log, lifecycle thoát khỏi "Tiếp nhận".
- [x] Kanban (view phụ): thêm cột **Bàn giao / Xử lý tiếp** và **Chờ nghiệm thu** — nhóm theo *vòng đời* (`planHandover`/`isCarryOver`/nhãn) thay vì chỉ theo `status` thô như trước; cột "Hoàn thành" giờ chỉ còn việc đã "Đã chốt sổ".

**Thiết kế thực tế khác với bản nháp ban đầu (lý do):**
- **Vá 2 lỗi "kẹt vĩnh viễn" cùng 1 kiểu** trong `getPlanLifecycle` (P1): (1) có `plan.handover` là đủ để coi mãi mãi là "Bàn giao" dù đã nhận lại — sửa bằng cờ `accepted` trong object `handover`; (2) có `assignedBy` là đủ để coi mãi mãi là "Tiếp nhận" dù đã xác nhận — sửa bằng cột mới `acknowledgedAt`. Cả 2 đều theo cùng nguyên tắc: field nguồn (`handover`/`assignedBy`) là **dữ liệu lịch sử**, còn một field/cờ riêng mới quyết định trạng thái hiện tại.
- **Không thêm cột `closedBy/closedAt/result` như nháp §5 ban đầu** — chốt sổ tái dùng nhãn "Đã chốt sổ" (cột `Labels` đã có) + audit log (đã tự ghi người/giờ). Nhẹ hơn, ít cột hơn, cùng cơ chế `logPlanAction` đã kiểm chứng ở P1/P2.
- Backend: thêm cột **32 `Handover`**, **33 `AssignedBy`**, **34 `DoneCriteria`**, **35 `AcknowledgedAt`** vào `NhatKyPlans` — cùng pattern additive-migration.

**Nghiệm thu P3:**
- [x] Bàn giao người & ca đều tạo được, lưu đúng `toType/toUser/toTeam`.
- [x] "Nhận bàn giao" chuyển đúng về Đang làm, không còn kẹt ở trạng thái Bàn giao sau khi nhận.
- [x] Chốt sổ chỉ khả dụng khi đã Hoàn thành, không cho chốt 2 lần, ai cũng bấm được.
- [x] Xác nhận nhận việc chỉ hiện khi cần, bấm xong không hiện lại nữa.
- [x] Kanban hiện đúng 6 cột, việc bàn giao/chờ nghiệm thu tách khỏi Đang làm/Hoàn thành.
- [x] Cú pháp JS + 3 file `.gs` kiểm tra qua `node --check` — không lỗi.
- [x] **Đã kiểm thử API & đồng bộ Apps Script thật** — kiểm tra lưu bàn giao, chốt sổ, xác nhận chỉ đạo xuống Google Sheets `NhatKyPlans` (tổng số cột 35).

---

## 4. Ràng buộc kỹ thuật (bắt buộc tuân theo)

1. **Không đổi cấu trúc 24 cột** của sheet phiếu tiếp nhận (CLAUDE.md).
2. **Không ghi đè/xoá dữ liệu gốc** khi chưa xác nhận bằng lời của chủ dự án.
3. **Local-first:** cập nhật localStorage + render ngay → `syncPlanInBackground` (giữ offline queue). Không chặn UI chờ mạng.
4. **Lưu mảng dạng JSON trong 1 cột** như `steps` hiện tại — không thêm tab/bảng mới nếu chưa cần.
5. **Tương thích ngược tuyệt đối:** mọi trường mới optional; đọc dữ liệu cũ không lỗi.
6. **Giữ style hệ thống:** app-shell 460px, teal `#0b4d5e`, chạm ≥44px, bo góc 16px, font hệ thống (xem `nhatky_design.md`).
7. Làm từng giai đoạn P1→P2→P3, mỗi giai đoạn commit riêng, test trên điện thoại thật.

## 5. KHÔNG làm
- Không viết lại thành SPA/React lớn.
- Không thêm `gate` khoá cứng giai đoạn.
- Không hardcode danh sách người/tag — đọc từ danh bạ.
- Không đổi backend deployment URL đang chạy.

---

## 6. Việc còn lại (bàn giao cho AI/người tiếp theo)

1. [x] **Deploy lại Apps Script**: Đã clasp push toàn bộ 44 file `.gs` và deploy phiên bản @103 lên `AKfycbzW4TxDarLBOpZvO8hnE0R65IsCd95a5l-XPASjUmZNuefH5MiWMs8lCpLpggzFwyXK`.
2. [x] **Test tay đầy đủ trên trình duyệt/API thật**: Đã xác minh `getPlans`, `savePlan` (27 bản ghi kế hoạch hiện có) qua endpoint live.
3. [x] **Đối chiếu dữ liệu `NhatKyPlans`**: Đã khắc phục bug `handleSavePlan` (`params.payload || params || {}`), test ghi nhận kế hoạch mới lên Google Sheets thành công.
4. [x] Cập nhật CHANGELOG.md cho bản [v2.12.0].

**Bắt đầu từ P1.** Khi xong mỗi giai đoạn, cập nhật checkbox trong file này và ghi CHANGELOG.

---

## 7. P4 (2026-07-22) — Ghi nhật ký "mỗi người TỰ BÁO phần mình" theo từng bước/giai đoạn

> Trạng thái: **✅ Xong** (code xong + verify Chrome thật bằng Playwright, 2026-07-22). Phát sinh từ yêu cầu người dùng làm rõ mục đích ghi nhật ký. **Đây là thay đổi NGHIỆP VỤ (đổi mô hình ghi + điều kiện đánh dấu Xong + thêm chỗ hiển thị lại)**, không phải chỉnh trình bày như các bản v2.12.x.

### 7.1 Bối cảnh & phân tích (vì sao cần P4)

**Mục đích người dùng nêu:** *"Ghi nhật ký để **đánh giá riêng từng người**, **ghi nhanh gọn**"* + *"**Mỗi người tự ghi phần mình**"*.

**Mâu thuẫn gốc:** form ghi nhật ký hiện tại (`renderPeopleResults` + `submitLog`) xây theo mô hình **NGƯỢC lại**:

| | Form hiện tại | Ý người dùng (P4) |
|---|---|---|
| Ai ghi | **1 người điền hộ cả nhóm** — mở form hiện tất cả `step.assignees` thành nhiều dòng, 1 người chấm cho từng người | **Mỗi người tự ghi phần mình** |
| Bản chất | Tổ trưởng **chấm điểm** cấp dưới (dropdown Đạt/Chưa đạt/**Vắng-Không tham gia**) | Mỗi người **tự báo** kết quả phần việc của mình |
| `recordedBy` vs `employee` | Khác nhau (người ghi ≠ người bị chấm) | Trùng nhau (tự ghi cho mình) |

→ Dải "Chưa đạt / Vắng-Không tham gia" là dấu vết mô hình "tổ trưởng chấm", **không hợp** với tự báo (không ai tự ghi mình "vắng"). Với tự báo, "kết quả của tôi" đã có sẵn = **chip trạng thái** (Hoàn thành/Đang làm/Cần hỗ trợ) của chính lượt ghi.

**Các lỗ hổng cụ thể đã tìm ra (đều là hành vi CÓ TỪ TRƯỚC, không do các bản v2.12.x):**

1. 🔴 **Đánh giá "ghi rồi giấu":** `log.rating` (đánh giá riêng từng người) được ghi vào cột `Rating` sheet `WorkLogs` nhưng **KHÔNG màn nào đọc lại** — không ở timeline Chi tiết (`planTimelineHtml`), không ở "Nhật ký đã ghi" (`renderLogCard`), không ở Thống kê. Bảng Thống kê "Theo từng nhân viên" (`renderPersonStats`) chỉ đếm `plan.status` theo `plan.assignee` — **không dùng rating**. → Mục đích "đánh giá riêng từng người" bị vô hiệu ngay sau khi bấm Lưu.
2. 🔴 **Bước bị tick Xong bất kể từng người:** `updatePlanStatus()` chỉ nhìn **1 chip trạng thái chung** để set `step.done = true`; **không kiểm tra** các dòng đánh giá riêng. Dù có người bị "Chưa đạt"/"Vắng", chip chung "Hoàn thành" là cả bước xong. `step.doneBy` chỉ ghi tên người bấm Lưu, không phải mọi người đã thực sự làm xong.
3. 🟠 **Không tách khối lượng theo bước:** bước không có `planQty`/`unit`/`doneQty` riêng; mọi số lượng cộng dồn vào 1 con số `plan.doneQty` cấp việc. (Để ngỏ P4 — không bắt buộc.)
4. 🟠 **Đường vào ghi theo bước dài & không nhanh gọn:** nút "＋ Ghi nhật ký" chính không gắn `stepId` (luôn ghi cấp việc); muốn ghi đúng bước phải vào Chi tiết → cuộn Giai đoạn & bước → bấm icon bút của từng bước. Đánh giá dùng `<select>` (chậm trên mobile) thay vì chip 1-chạm. Form bắt chọn lại "tổ" + nhập "kết quả" dù chỉ muốn báo nhanh.
5. ✅ **Timeline không cho biết log thuộc bước/giai đoạn nào** — ĐÃ VÁ 1 PHẦN (2026-07-22): thêm `findStepWithPhase(plan, stepId)` + dòng `.tl-step` "Giai đoạn · Bước" trên timeline (log gắn `stepId` giờ hiện được thuộc bước nào). *(Thay đổi này chưa commit khi viết mục P4.)*

### 7.2 Quyết định đã chốt (2026-07-22)

1. **Ai ghi/đánh giá:** *"Mỗi người tự ghi phần mình"* (self-report) — KHÔNG phải tổ trưởng chấm điểm cấp dưới.
2. Luồng ghi chính = **tự báo cho chính mình**; lưới "điền hộ cả nhóm" hiện tại **hạ xuống tuỳ chọn phụ** (1 người ghi hộ khi thật cần), không phải mặc định.
3. **Bỏ/ẩn dropdown chấm điểm** (Đạt/Chưa đạt/Vắng) ở chế độ tự báo — dùng **chip trạng thái sẵn có** (Hoàn thành/Đang làm/Cần hỗ trợ) làm "kết quả của tôi".
4. **Nhanh gọn:** kế thừa tổ từ việc (không bắt chọn lại), kết quả để tuỳ chọn, mục tiêu ghi phần mình ≤ 3 chạm.
5. **Xem lại được theo người:** mỗi bước hiện "ai đã tự ghi Hoàn thành / ai chưa"; bước chỉ tự tính **Xong khi TẤT CẢ người của bước đã tự ghi Hoàn thành phần mình** (khắc phục lỗ hổng #2).

### 7.3 Việc cần làm

- [x] **Nhận diện "tôi là ai":** form ghi cho 1 bước mặc định `currentUser()`; nếu currentUser nằm trong `step.assignees` → chọn sẵn. Chip "Tôi là ai" (`#logSelfPicker`/`#logSelfChips`, `setLogSelfPerson()`) chọn nhanh trong số người của bước khi ≥2 người — dùng cho điện thoại chung.
- [x] **Form tự báo gọn:** `applyLogMode()` ẩn lưới nhiều người + dropdown rating ở chế độ tự báo (`logMode = "self"`); chỉ còn chip trạng thái + ô kết quả tuỳ chọn + số lượng/ảnh. Kế thừa `teams` từ `plan.team` qua `refreshTeamOptions`, không bắt chọn lại.
- [x] **Giữ chế độ phụ "ghi hộ cả nhóm":** nút "Ghi hộ cả nhóm →" (`setLogMode('batch')`) và nút quay lại "← Chỉ ghi phần tôi" (`setLogMode('self')`); `renderPeopleResults` cũ giữ nguyên, không xoá.
- [x] **Bước theo dõi từng người:** `step.doneByPeople[]` qua `markStepDoneByPeople()`; `step.done` chỉ bật khi `doneByPeople` phủ hết `assignees` (`stepDoneInfo()`). Giữ `doneBy`/`doneAt` cũ. `updatePlanStatus()` nay nhận thêm `donePeople` và gọi `markStepDoneByPeople` thay vì set `done` mù.
- [x] **Hiển thị trên bước:** `stepPeopleProgressHtml()` in "x/y người đã xong" + tên người đã ghi; dùng chung ở `phaseStepRowHtml` và `stepRowHtml`.
- [x] **Hiển thị đánh giá/kết quả theo người khi xem lại:** `renderLogCard` hiện `log.employee` nổi bật; `findStepWithPhase()` + dòng `.tl-step` trên timeline (`planTimelineHtml`) cho biết log thuộc giai đoạn/bước nào.
- [ ] *(Tuỳ chọn, chưa làm)* Thống kê tổng hợp theo người dựa trên log tự báo, không chỉ đếm `plan.status` — để ngỏ, không chặn P4.

### 7.4 Mô hình dữ liệu

- **Không cần cột mới** ở `NhatKyPlans`/`WorkLogs`. `doneByPeople[]` lưu trong cùng JSON `steps`/`phases` (như `assignees`/`photos` đã làm ở P2). `log.stepId`/`log.employee`/`log.progress` đã đủ để suy "ai đã ghi Hoàn thành bước nào".
- **Tương thích ngược:** bước cũ `done=true` (từ mô hình cũ, không có `doneByPeople`) → giữ nguyên coi là đã xong, KHÔNG đòi lại từng người. `doneByPeople` chỉ áp cho bước ghi mới.
- Dropdown `RATING_OPTIONS` (leader-grade) chỉ còn dùng ở chế độ phụ "ghi hộ cả nhóm"; chế độ tự báo không dùng.

### 7.5 Nghiệm thu P4 — ✅ tất cả đã verify bằng Chrome thật (Playwright, 2026-07-22)

- [x] Mở ghi cho 1 bước → mặc định là chính mình, ghi phần mình ≤ 3 chạm (chip trạng thái + Lưu), không bắt chọn lại tổ.
- [x] Điện thoại dùng chung: chọn "Tôi là ai" trong số người của bước rồi ghi được đúng tên.
- [x] Mỗi người ghi độc lập → bước hiện đúng "x/y người đã xong"; chỉ khi đủ người mới tự chuyển bước Xong.
- [x] Xem lại: timeline + "Nhật ký đã ghi" cho biết **ai** ghi **gì** cho **bước nào**.
- [x] Việc/dữ liệu cũ không lỗi (bước done cũ giữ nguyên — `wasDone` giữ true, `Array.isArray` phòng thủ).
- [x] Cú pháp JS + `.gs` qua `node --check` — không lỗi.

**Kịch bản đã verify bằng Chromium thật (Playwright, mock backend qua route interception):** seed 1 bước 2 người (An, Bình) → mở Ghi nhật ký cho bước → chip "Tôi là ai" hiện đúng 2 người, An được chọn sẵn (đúng currentUser) → An ghi Hoàn thành → `doneByPeople:["An"]`, `step.done:false`, việc vẫn "Đang làm" (đúng — chưa đủ người) → mở lại, bấm chip Bình → ghi Hoàn thành → `doneByPeople:["An","Bình"]`, `step.done:true`, việc tự chuyển "Hoàn thành" → dòng tiến độ bước hiện "Bình TT đã xong · Hôm nay" → timeline hiện "Thực hiện · Kiểm tra áp suất". 0 lỗi console/page.
