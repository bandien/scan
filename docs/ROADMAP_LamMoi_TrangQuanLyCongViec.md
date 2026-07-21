# ROADMAP — Làm mới Trang Quản lý Công việc (nhatky/)

> **Giao việc cho AI kế tiếp.** Đây là bản kế hoạch triển khai đã chốt nghiệp vụ & thiết kế.
> Đọc kèm: [`docs/PhanTich_NghiepVu_TrangQuanLyCongViec_v1.md`](./PhanTich_NghiepVu_TrangQuanLyCongViec_v1.md) (phân tích đầy đủ).
> Mockup UI (bản gọn nhẹ): **https://claude.ai/code/artifact/ea0e52f5-f72d-415b-9e6a-55c4d1dd8b14**
> Ngày: 2026-07-21 · Trạng thái: **Sẵn sàng code P1**

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
- [ ] Thêm `people[]` (lead/support/reviewer) + hàm tách từ `assignee` cũ; chip ★ chủ trì · ○ phối hợp.
- [ ] Thêm `lifecycle` + hàm map ngược từ `status`/nhãn/carry-over; chấm màu vòng đời (7 màu §Vòng đời).
- [ ] **Trang chủ = bảng nhóm "Hôm nay"**: Cần xử lý tiếp → Đang làm → Chờ nghiệm thu → Lịch sắp tới 7 ngày. Dòng gọn + chấm màu, chạm mở chi tiết.
- [ ] Ô tìm nhanh + chọn ngày; nút ＋ Việc mới.
- [ ] **Avatar tài khoản góc phải app-bar** (chữ cái tên) → sheet: tên + ca trực, phóng chữ A/A+/A++ (dùng `js/fontscale.js` sẵn có), đăng xuất. Chốt đúng danh tính người ghi (khắc phục lỗi "3 nguồn tên").

**Nghiệm thu P1:**
- Mở app thấy việc nhóm theo đúng 4 mục; dữ liệu cũ hiện đủ, không lỗi.
- Việc có nhiều người hiện đúng ★ chủ trì / ○ phối hợp.
- Đổi trạng thái → chấm màu + nhóm cập nhật đúng.

### 🟡 P2 — Giai đoạn 2 tầng (bước CRUD + gán người theo tag) + Ảnh
**Việc:**
- [ ] `phases[]` bọc `steps[]`; đọc steps cũ → 1 GĐ mặc định. Tiến độ "GĐ x/y".
- [ ] Màn chi tiết mục phẳng: GĐ đang chạy mở bước con — checkbox, tên, `＋ Thêm bước`, `⋮` sửa/xoá (tái dùng addStep/renameStep/deleteStep).
- [ ] Gán người cho bước từ **danh bạ lọc theo cùng tag** với việc/khu vực (mở rộng `stepAssigneeEditorHtml` + `knownPeopleNames` có tham số tag).
- [ ] `photos[]`: nút 📷 ở chỉ đạo/kế hoạch/phát sinh/nhật ký/bàn giao → upload Drive → lưu `ImageURL`; hiện thumbnail.

**Nghiệm thu P2:**
- Thêm/sửa/xoá bước hoạt động, đồng bộ Sheets.
- Picker gán người chỉ hiện người cùng tag.
- Đính được ảnh, xem lại được thumbnail; ảnh lưu Drive + link trong sheet.

### 🟠 P3 — Bàn giao ca + Nghiệm thu/Chốt sổ + Truy vết chỉ đạo
**Việc:**
- [ ] `handover`: nút "Bàn giao việc" → sheet chọn *Cho người / Cho ca-tổ*, 3 ô (đã làm/cần xử lý tiếp/lưu ý an toàn) + ảnh; auto-ghi `fromUser/at`. Ghi 1 dòng nhật ký loại `handover`.
- [ ] "Nhận bàn giao" → về `doing` dưới tên người/ca mới, giữ lịch sử.
- [ ] Tách **Xong kỹ thuật** (`done`) vs **Đã chốt sổ** (`closed`); nút "✓ Nghiệm thu · Chốt sổ" — ai cũng bấm được, ghi `closedBy/closedAt/result` (map cột L/Q/W).
- [ ] Khối *Chỉ đạo & tiêu chí*: `assignedBy`, `directive`, `doneCriteria` + nút "Xác nhận nhận việc".
- [ ] Kanban (view phụ): thêm cột *Bàn giao/Xử lý tiếp* + *Chờ nghiệm thu*.

**Nghiệm thu P3:**
- Bàn giao người & ca đều chạy; ca sau nhận lại đúng; timeline có bản ghi bàn giao.
- Chốt sổ khoá việc, ghi đủ người/giờ/kết quả.

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

**Bắt đầu từ P1.** Khi xong mỗi giai đoạn, cập nhật checkbox trong file này và ghi CHANGELOG.
