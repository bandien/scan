# Kế hoạch TDD: hoàn thiện khởi tạo mẫu checklist (deploy + frontend)

Thiết kế: `docs/superpowers/specs/2026-07-29-checklist-template-init-design.md`
Backend đã xong ở commit `c98f464` (nhánh `claude/checklist-template-analysis-v76flv`).
Kế hoạch này là phần "Còn lại" mục 3 của tài liệu thiết kế.

## Giai đoạn 0 — Deploy backend lên Apps Script (chặn mọi việc sau)

Không có bước này thì 4 API mới chưa tồn tại trên server, frontend không test thật được.

1. HỎI người dùng push vào scriptId nào — repo đang có hai nguồn khác nhau:
   - `.clasp.json`: `1AwJ7bMFVlA8VcWKfggZJsK80LgqPM-sn7A9A1jxXpS7Jyrjn97H6smcH`
   - shortcut `QR_Web_App_Backend_Temp - Project Editor`: `1Xe--8LuGRdqKPvjI6uOdAIv7nGATnP3efFQUMBpRbZCuUQTV9Plw8BAx`
2. `clasp pull` toàn bộ project về `.gas-baseline/` (GAS đang có 26 file, repo chỉ có 2).
3. Build staging bằng đúng script của repo, chế độ overlay:
   `pwsh tools/Build-GasDeployPackage.ps1 -OutputDirectory .gas-deploy -BaselineDirectory .gas-baseline`
   → chỉ 2 file `releaseOverlay` lấy từ repo, 24 file còn lại lấy từ baseline vừa pull.
4. `clasp push` rồi `clasp deploy` (version mới, giữ nguyên URL web app).
5. VERIFY bằng request thật, không suy đoán:
   - `<GAS_URL>?action=getChecklistTemplateDefs&token=<TOKEN>` → trả 4 mẫu seed và
     tab `ChecklistTemplateDefs` xuất hiện trong Sheet.
   - `<GAS_URL>?action=getChecklistSchedule&token=<TOKEN>&date=2026-08-03&time=02:00`
     → `ca_toi` phải có `businessDate=2026-08-02` và `inWindow=true`.

## Giai đoạn 1 — Frontend KTV đọc lịch từ backend

Mục tiêu: bỏ 4 mẫu cứng ở frontend, mẫu mới tạo trên sheet là tự hiện.

1. RED: thêm `tests/checklist-schedule-client.test.js` — hàm chọn mẫu hiển thị nhận
   `schedule` từ API và trả về danh sách thẻ đúng thứ tự + ngày nghiệp vụ; phủ ca qua
   đêm và mẫu tuần/tháng không tới hạn.
2. GREEN: tách logic sang `js/checklist-schedule.js` (module hoá như
   `js/checklist-shifts.js` — UMD, chạy được cả Node và browser).
3. REFACTOR `sangolf/index.html`:
   - `TEMPLATE_ORDER` (dòng 251) → thứ tự lấy từ `getChecklistSchedule`.
   - `isDue()` (dòng 279) → dùng `matchesDate`/`inWindow` từ server, xóa if/else
     `tuan`/`thang` cứng.
   - `pendingHandoverFor()` (dòng 366) → cặp bàn giao suy ra từ `shiftCode` + khung giờ
     trong defs, không hardcode `ca_sang`↔`ca_toi` (để thêm được ca thứ 3).
   - `TEMPLATE_ICONS` (dòng 252) → có icon mặc định cho templateId lạ.
   - `js/golf-checklist-fallback.js` giữ nguyên vai trò fallback offline.
4. RED/GREEN E2E: mở rộng `tests/golf-checklist.spec.js` — với schedule giả lập 3 ca,
   trang hiện đủ 3 thẻ và thẻ ngoài khung giờ hiển thị đúng trạng thái.

## Giai đoạn 2 — Form khởi tạo mẫu cho Quản lý

1. RED: E2E `tests/checklist-template-admin.spec.js` — Quản lý mở form, nhập tên +
   địa điểm + khung giờ + ca trực, chọn "nhân bản từ mẫu", submit → gọi
   `upsertChecklistTemplateDef` với payload đúng; thiếu địa điểm thì báo lỗi inline.
2. GREEN: thêm màn hình quản trị mẫu (ưu tiên đặt trong `sangolf/index.html` cạnh phần
   sửa hạng mục hiện có, hoặc trang riêng nếu chật). Trường: tên mẫu, địa điểm, ca trực,
   tần suất, giờ bắt đầu/kết thúc, thứ/ngày áp dụng, tổ phụ trách, ghi chú,
   `cloneFromTemplateId`, bật/tắt áp dụng.
3. Sau khi tạo mẫu: điều hướng sang phần sửa hạng mục của templateId mới để tinh chỉnh
   bằng `upsertGolfTemplateItem`/`deleteGolfTemplateItem` đã có.
4. Xóa mẫu dùng `deleteChecklistTemplateDef` (soft delete) — UI phải nói rõ "ngừng áp
   dụng, giữ lịch sử", không dùng chữ "xóa".

## Giai đoạn 3 — Dọn phần backend còn suy luận cứng

1. RED: bổ sung test trong `tests/checklist-template-defs.test.js`.
2. `handleGetGolfStatus` (19_GolfChecklist.gs) — duyệt theo `readChecklistTemplateDefs_()`
   thay vì hằng `GOLF_TEMPLATE_NAMES`, để trang `nhatky` thấy cả mẫu mới.
3. `checkGolfShiftSchedule_` — đọc khung giờ từ defs thay vì if/else giờ cứng
   (`hour >= 13 && hour <= 19`), nhắc đúng mọi mẫu kể cả ca đêm.
4. Liên kết bảng phân ca: đối chiếu `ShiftCode` với `16_ShiftRoster.gs` để biết đích
   danh ai trực ca đó trong ngày → gợi ý sẵn `operator` và `handoverTo`.

## Verification cuối (bắt buộc chạy, dán output vào báo cáo)

```
# Test Node — chỉ *.test.js. KHÔNG dùng `node --test tests/`: nó bắt cả file
# Playwright *.spec.js và fail ngay.
node --test tests/*.test.js

# E2E Playwright (desktop + mobile)
npx playwright test
```

Lưu ý: 3 test trong `tests/gas-deploy-package.test.js` cần PowerShell và đủ 26 file GAS
trong workspace — chỉ pass sau khi đã `clasp pull` baseline về máy.
