# Bàn giao cho Antigravity IDE — Khởi tạo mẫu checklist

Ngày: 2026-07-29 · Repo: `bandien/scan` · Nhánh: `claude/checklist-template-analysis-v76flv` · Commit: `c98f464`

Tài liệu này gồm 2 phần: (A) tóm tắt hiện trạng để đọc nhanh, (B) prompt dán thẳng vào Antigravity.

---

## A. Hiện trạng

### Đã xong (commit `c98f464`, 19/19 test Node pass)

Tầng **định nghĩa mẫu checklist** tách khỏi tầng lượt thực hiện:

| File | Thay đổi |
|---|---|
| `19_GolfChecklist.gs` | +341 dòng: sheet `ChecklistTemplateDefs`, 4 handler, hàm phân giải lịch thuần `resolveChecklistSchedule_` |
| `02_Router.gs` | +5 dòng: 2 route GET, 2 route POST |
| `tests/checklist-template-defs.test.js` | 8 test mới |
| `docs/superpowers/specs/2026-07-29-checklist-template-init-design.md` | Phân tích nghiệp vụ + thiết kế |
| `CHANGELOG.md` | Mục `[v2.17.0]` |

4 API mới: `getChecklistTemplateDefs`, `getChecklistSchedule`, `upsertChecklistTemplateDef`
(hỗ trợ `cloneFromTemplateId` nhân bản hạng mục), `deleteChecklistTemplateDef` (soft delete).

Mỗi mẫu khai báo đủ 3 thuộc tính: **Địa điểm** (`Location`), **Thời gian** (`Frequency`
daily/weekly/monthly + `TimeStart`–`TimeEnd` hỗ trợ ca qua đêm + `DayOfWeek`/`DayOfMonth`),
**Ca trực** (`ShiftCode`, `AssignedTeam`). Vì lượt chạy khóa theo `TemplateID`, mẫu mới tự
động dùng lại nguyên vòng đời autosave → chốt ca → bàn giao → xác nhận đã có.

### Chưa xong — việc của Antigravity

1. **Deploy 2 file backend lên Apps Script** — chặn mọi việc sau. Việc này phải làm ở
   máy người dùng (đã `clasp login` thành công, token nằm ở `~/.clasprc.json`), môi
   trường cloud của Claude không có credential.
2. **Frontend KTV**: `sangolf/index.html` vẫn cứng 4 mẫu (`TEMPLATE_ORDER` dòng 251,
   `isDue()` dòng 279, `pendingHandoverFor()` dòng 366) → mẫu mới tạo chưa hiện lên.
3. **Form quản trị mẫu** cho Quản lý — hiện chỉ gọi được API bằng curl/Postman.
4. **Dọn backend còn suy luận cứng**: `handleGetGolfStatus`, `checkGolfShiftSchedule_`,
   liên kết `ShiftCode` với bảng phân ca `16_ShiftRoster.gs`.

Kế hoạch TDD chi tiết từng giai đoạn: `docs/superpowers/plans/2026-07-29-checklist-template-init-frontend.md`

### Điểm cần người dùng quyết trước khi deploy

Repo đang có **hai scriptId khác nhau**, push sai project là ghi lên hệ thống đang vận hành:

- `.clasp.json` → `1AwJ7bMFVlA8VcWKfggZJsK80LgqPM-sn7A9A1jxXpS7Jyrjn97H6smcH`
- shortcut `QR_Web_App_Backend_Temp - Project Editor` → `1Xe--8LuGRdqKPvjI6uOdAIv7nGATnP3efFQUMBpRbZCuUQTV9Plw8BAx`

### Bẫy cần biết

- `clasp push` **ghi đè toàn bộ** project theo thư mục local. Repo chỉ có 2/26 file
  backend (24 file kia chỉ tồn tại trên GAS). **Bắt buộc** `clasp pull` baseline về
  trước, rồi build staging bằng `tools/Build-GasDeployPackage.ps1 -BaselineDirectory`
  để chỉ overlay 2 file trong `releaseOverlay`.
- 3 test `tests/gas-deploy-package.test.js` fail trong môi trường cloud vì thiếu
  PowerShell và thiếu 24 file GAS — không phải lỗi code. Sau khi pull baseline về máy
  thì phải pass.
- Repo có test chống mojibake tiếng Việt (`tests/sangolf-encoding.test.js`) — mọi file
  chạm tới phải giữ UTF-8.

---

## B. Prompt dán vào Antigravity

Copy toàn bộ khối dưới đây:

```text
Bạn tiếp nhận công việc dở dang trên repo bandien/scan (Google Apps Script backend +
PWA frontend, quản lý bảo trì cơ điện của Ban Điện Hapulico, sân golf Kỳ Sơn).

BẮT BUỘC đọc trước khi làm bất cứ gì:
- AGENTS.md — phương pháp luận Superpowers: TDD nghiêm ngặt (RED trước GREEN),
  Evidence Before Claims (không tuyên bố xong khi chưa chạy test và xem output thật),
  Root Cause Analysis First (không quick-fix).
- docs/superpowers/specs/2026-07-29-checklist-template-init-design.md — phân tích
  nghiệp vụ và thiết kế của tính năng đang làm.
- docs/superpowers/plans/2026-07-29-checklist-template-init-frontend.md — kế hoạch TDD
  4 giai đoạn, làm tuần tự theo file này.
- docs/handoff/2026-07-29-antigravity-handoff.md — bàn giao, phần "Bẫy cần biết".

NGỮ CẢNH: nhánh claude/checklist-template-analysis-v76flv, commit c98f464 đã xong phần
backend — thêm sheet ChecklistTemplateDefs (sổ đăng ký mẫu checklist theo địa điểm /
thời gian / ca trực) và 4 API: getChecklistTemplateDefs, getChecklistSchedule,
upsertChecklistTemplateDef, deleteChecklistTemplateDef. 19/19 test Node pass. Code mới
nằm ở 19_GolfChecklist.gs (cuối file) và 02_Router.gs.

VIỆC ĐẦU TIÊN — deploy backend lên Apps Script (chặn mọi việc sau):
Người dùng đã chạy `clasp login` thành công, token ở ~/.clasprc.json. TRƯỚC KHI PUSH,
hỏi người dùng push vào scriptId nào — repo có hai nguồn khác nhau:
  .clasp.json         → 1AwJ7bMFVlA8VcWKfggZJsK80LgqPM-sn7A9A1jxXpS7Jyrjn97H6smcH
  shortcut .url       → 1Xe--8LuGRdqKPvjI6uOdAIv7nGATnP3efFQUMBpRbZCuUQTV9Plw8BAx
Đây là thao tác ghi lên hệ thống đang vận hành, KHÔNG tự đoán.

CẢNH BÁO QUAN TRỌNG: `clasp push` ghi đè toàn bộ project. Repo chỉ có 2/26 file backend,
24 file còn lại CHỈ tồn tại trên GAS — push thẳng từ repo sẽ xóa mất chúng. Quy trình
an toàn bắt buộc:
  1. clasp pull toàn bộ project về .gas-baseline/
  2. pwsh tools/Build-GasDeployPackage.ps1 -OutputDirectory .gas-deploy -BaselineDirectory .gas-baseline
     (script này chỉ overlay 2 file trong releaseOverlay của tools/gas-deploy-files.json,
      24 file kia lấy từ baseline vừa pull, và tự validate inventory)
  3. cd .gas-deploy && clasp push && clasp deploy
  4. Verify bằng request thật, không suy đoán:
     <GAS_URL>?action=getChecklistTemplateDefs&token=<TOKEN>
       → trả 4 mẫu seed, tab ChecklistTemplateDefs xuất hiện trong Google Sheet backend
     <GAS_URL>?action=getChecklistSchedule&token=<TOKEN>&date=2026-08-03&time=02:00
       → ca_toi phải có businessDate=2026-08-02 và inWindow=true (logic ca qua đêm)

SAU ĐÓ làm giai đoạn 1→3 trong file kế hoạch, theo đúng TDD: viết test FAIL trước, code
tối thiểu cho PASS, rồi refactor. Trọng tâm giai đoạn 1-2 là bỏ 4 mẫu cứng ở frontend
(TEMPLATE_ORDER dòng 251, isDue() dòng 279, pendingHandoverFor() dòng 366 trong
sangolf/index.html) để mẫu tạo trên sheet tự hiện lên, và làm form khởi tạo mẫu cho
Quản lý (có tùy chọn nhân bản hạng mục từ mẫu có sẵn qua cloneFromTemplateId).

RÀNG BUỘC:
- Mọi chuỗi người dùng thấy là tiếng Việt UTF-8. Repo có test chống mojibake
  (tests/sangolf-encoding.test.js) — phải giữ pass.
- Không sửa allowlist tools/gas-deploy-files.json mà không cập nhật
  tests/gas-deploy-package.test.js tương ứng.
- 3 test gas-deploy-package chỉ pass sau khi đã clasp pull baseline về đủ 26 file.
- Commit vào nhánh claude/checklist-template-analysis-v76flv với message rõ ràng.
  KHÔNG tạo pull request trừ khi người dùng yêu cầu.
- Verification cuối, phải dán output thật vào báo cáo:
    node --test tests/*.test.js    (KHÔNG dùng `node --test tests/` — nó bắt cả file
                                    Playwright *.spec.js và fail ngay)
    npx playwright test
- UI xóa mẫu phải ghi "ngừng áp dụng, giữ lịch sử" (backend là soft delete Active=FALSE),
  không dùng chữ "xóa".

Bắt đầu bằng việc đọc 4 tài liệu trên và hỏi người dùng về scriptId.
```
