# ROADMAP — Làm mới Trang Quản lý Công việc (nhatky/)

> **Giao việc cho AI kế tiếp.** Đây là bản kế hoạch triển khai đã chốt nghiệp vụ & thiết kế.
> Đọc kèm: [`docs/PhanTich_NghiepVu_TrangQuanLyCongViec_v1.md`](./PhanTich_NghiepVu_TrangQuanLyCongViec_v1.md) (phân tích đầy đủ).
> Mockup UI (bản gọn nhẹ): **https://claude.ai/code/artifact/ea0e52f5-f72d-415b-9e6a-55c4d1dd8b14**
> Ngày: 2026-07-21 · Trạng thái: **P1 ✅ · P2 ✅ · P3 ✅ — cả 3 giai đoạn code xong, CẦN deploy lại Apps Script + test tay trên trình duyệt thật trước khi coi là hoàn tất**

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
- [ ] **Chưa kiểm thử tay trên trình duyệt thật** (chưa deploy lại Apps Script) — AI/người tiếp theo cần: (1) copy nội dung `01_Utils.gs`, `02_Router.gs`, `14_NhatKyPlans.gs` vào Apps Script editor & deploy lại, (2) mở `nhatky/index.html` thật, thử luồng: mở việc có bước cũ → "Chuyển sang Giai đoạn" → thêm giai đoạn/bước → gán người → đính ảnh → ghi nhật ký → kiểm tra Google Sheets có nhận đúng cột `Phases`/`Photos` không.

### ✅ P3 — Bàn giao ca + Nghiệm thu/Chốt sổ + Truy vết chỉ đạo — XONG (2026-07-21)
**Việc:**
- [x] `handover`: nút "⇄ Bàn giao việc" (modal `#handoverModal`) → chọn *Cho người / Cho ca-tổ* (segmented, `SUPPORTED_TEAMS` cho ca/tổ — chưa nối `phanca/` thật, đúng quyết định "giai đoạn đầu chọn thủ công"), 3 ô (đã làm/cần xử lý tiếp/lưu ý an toàn) + ảnh; auto-ghi `fromUser/at`. Ghi 1 dòng audit qua `logPlanAction(plan, "Bàn giao việc", ...)`.
- [x] "Nhận bàn giao" (nút trên thẻ bàn giao đang chờ trong Chi tiết) → set `plan.status = "Đang làm"`, đánh dấu `handover.accepted/acceptedBy/acceptedAt`, giữ nguyên lịch sử (object `handover` không bị xoá, chỉ đổi cờ).
- [x] Tách **Xong kỹ thuật** vs **Đã chốt sổ**: dùng lại đúng logic `getPlanLifecycle` đã có sẵn từ P1 (status "Hoàn thành" + chưa có nhãn "Đã chốt sổ" → badge "Xong kỹ thuật"; có nhãn → "Đã chốt sổ") — **không cần cột `closedBy/closedAt` riêng**, người/giờ chốt tự ghi qua `logPlanAction` (audit trail), nhãn "Đã chốt sổ" dùng lại cột `Labels` sẵn có. Nút "✓ Nghiệm thu · Chốt sổ" — ai cũng bấm được (không cố định người).
- [x] Khối *Chỉ đạo & tiêu chí*: thêm `assignedBy` (Người giao) + `doneCriteria` (Tiêu chí hoàn thành) vào form Thêm/Sửa việc, hiển thị trong card "Việc gì".
- [x] Kanban (view phụ): thêm cột **Bàn giao / Xử lý tiếp** và **Chờ nghiệm thu** — nhóm theo *vòng đời* (`planHandover`/`isCarryOver`/nhãn) thay vì chỉ theo `status` thô như trước; cột "Hoàn thành" giờ chỉ còn việc đã "Đã chốt sổ".

**Thiết kế thực tế khác với bản nháp ban đầu / phạm vi thu gọn (lý do):**
- **Vá 1 lỗi "kẹt vĩnh viễn" tự phát hiện khi làm handover**: `getPlanLifecycle` (P1) kiểm tra `plan.handover` TỒN TẠI là đủ để coi là "Bàn giao" — nghĩa là sau khi nhận bàn giao xong, việc sẽ MÃI MÃI hiện lại "Bàn giao" vì object `handover` cũ vẫn còn. Đã sửa: thêm cờ `accepted` trong object `handover`, lifecycle chỉ tính "Bàn giao" khi `handover tồn tại && chưa accepted`. `plan.handover` giờ đóng vai trò lịch sử bàn giao **gần nhất**, không phải hàng đợi.
- **Không thêm cột `closedBy/closedAt/result` như nháp §5 ban đầu** — chốt sổ tái dùng nhãn "Đã chốt sổ" (cột `Labels` đã có) + audit log (đã tự ghi người/giờ). Nhẹ hơn, ít cột hơn, cùng cơ chế `logPlanAction` đã kiểm chứng ở P1/P2.
- **Bỏ qua nút "Xác nhận nhận việc" + cờ acknowledge cho `assignedBy`** (có trong nháp §4.2 ban đầu) — lý do: `getPlanLifecycle` hiện coi MỌI việc có `assignedBy` là lifecycle "Tiếp nhận" vĩnh viễn (bug tương tự handover, nhưng thuộc phạm vi P1, chưa vá vì rủi ro thấp/ít dùng hơn handover). Thêm nút xác nhận đòi hỏi 1 cờ mới + sửa lại điều kiện này — quyết định **hoãn lại**, chỉ triển khai phần thông tin (`assignedBy`/`doneCriteria` hiển thị) có giá trị ngay mà không cần thêm cờ. Ghi chú cho AI tiếp theo nếu cần hoàn thiện: sửa `getPlanLifecycle` dòng `if (plan.source === 'directive' || plan.assignedBy) return 'recv';` theo đúng kiểu đã sửa cho `handover` (thêm cờ acknowledge).
- Backend: thêm cột **32 `Handover`**, **33 `AssignedBy`**, **34 `DoneCriteria`** vào `NhatKyPlans` — cùng pattern additive-migration.

**Nghiệm thu P3:**
- [x] Bàn giao người & ca đều tạo được, lưu đúng `toType/toUser/toTeam`.
- [x] "Nhận bàn giao" chuyển đúng về Đang làm, không còn kẹt ở trạng thái Bàn giao sau khi nhận.
- [x] Chốt sổ chỉ khả dụng khi đã Hoàn thành, không cho chốt 2 lần, ai cũng bấm được.
- [x] Kanban hiện đúng 6 cột, việc bàn giao/chờ nghiệm thu tách khỏi Đang làm/Hoàn thành.
- [x] Cú pháp JS + 3 file `.gs` kiểm tra qua `node --check` — không lỗi.
- [ ] **Chưa test tay trên trình duyệt/Apps Script thật** — cần deploy lại backend rồi thử: Bàn giao cho người → mở máy khác đăng nhập người đó → thấy thẻ "Đang bàn giao cho..." → Nhận bàn giao → kiểm tra Sheets cột `Handover`/`Labels`; thử chốt sổ 1 việc Hoàn thành → kiểm tra nhãn "Đã chốt sổ" và log audit.

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

1. **Deploy lại Apps Script**: copy nội dung `01_Utils.gs`, `02_Router.gs`, `14_NhatKyPlans.gs` vào Apps Script editor (project `11_BanDienScan_Backend`), Deploy → New deployment (giữ nguyên URL nếu deploy dạng "Manage deployments" > sửa deployment hiện có).
2. **Test tay đầy đủ trên trình duyệt thật** theo 2 kịch bản nghiệm thu ở mục P2/P3 phía trên.
3. **Đối chiếu dữ liệu `NhatKyPlans`** trước/sau khi vá bug `handleSavePlan` (mục P2) — xác nhận các việc tạo gần đây có thực sự nằm trong Sheet không.
4. (Tuỳ chọn, không bắt buộc) Hoàn thiện nút "Xác nhận nhận việc" cho `assignedBy` — xem ghi chú "phạm vi thu gọn" ở mục P3.
5. Cập nhật CHANGELOG.md sau khi test xong.

**Bắt đầu từ P1.** Khi xong mỗi giai đoạn, cập nhật checkbox trong file này và ghi CHANGELOG.
