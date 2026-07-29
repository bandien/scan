# Implementation Plan — A1: Giai đoạn/Bước + Crowd-Completion (Bước 2)

- **Ngày lập:** 2026-07-25 (cập nhật: gán người dùng danh bạ/tổ thật thay vì `prompt()`)
- **Dựa trên:** [`docs/ThietKe_TongHop_Superpowers_2026-07-24.md`](ThietKe_TongHop_Superpowers_2026-07-24.md) mục A1, đã chốt cách làm với người dùng.
- **File cần sửa:** `nhatky/index.html` (805 dòng, bản Zalo shell hiện tại của Antigravity). **Không đổi bất kỳ file `.gs` nào** — `14_NhatKyPlans.gs` đã lưu/trả `phases`/`steps` (cột 22, 29) từ trước; action `getStaff` (`07_Analytics.gs`) đã trả `shortName`/`commonName` từ phiên P4 trước — cả hai hoàn toàn tương thích, không cần sửa backend.
- **Nguồn tham khảo:** logic đã verify Chrome thật ở commit `e0dfa93` (`git show e0dfa93:nhatky/index.html`) — port lại, không viết mới từ đầu.

## Nguyên tắc thiết kế bắt buộc (người dùng đã chốt)

> **Việc nhỏ ẩn bớt thông tin, việc lớn hiện thêm thông tin.**

Áp dụng cụ thể: modal "Ghi Nhanh Việc Nhỏ" giữ nguyên tối giản như hiện tại (không đổi). Khối "Giai đoạn & Bước" **chỉ xuất hiện trong modal Chi tiết khi `plan.phases` không rỗng** — việc đơn giản (không có phases) tiếp tục hiển thị y hệt hiện tại (bubble chat đơn giản), không bị thêm rối mắt.

## Phạm vi hạ cấp có chủ đích (để plan không phình to)

- **Gán người vào bước lọc theo danh bạ/tổ thật** (không còn hạ cấp xuống `prompt()` — người dùng yêu cầu làm đầy đủ ngay). Kéo theo phải port cả hạ tầng `staffDirectory`/`loadStaff()`/`knownPeopleNames()`/`filterNamesByTag()` — xem Task 2.
- **Bỏ khái niệm `steps` phẳng cũ** (bản P1-P4 có cả `plan.steps` lẫn `plan.phases` song song để tương thích ngược). Shell mới không có `plan.steps` cũ nào cần tương thích — chỉ cần `plan.phases`, nên `allPlanSteps`/`findAnyStep` rút gọn còn 1 nguồn duy nhất.
- **Bỏ `getStoredEmployees()`** (danh sách tên đã gõ tay trước đây, lưu localStorage) khỏi `knownPeopleNames()` — danh bạ thật (`staffDirectory`) + tên đã xuất hiện trong `allPlans` là đủ nguồn, không cần thêm tầng cache phụ này.

---

## Sub-task

### Task 1 — Port các hàm thuần (không UI, không phụ thuộc danh bạ)
**File:** `nhatky/index.html`, chèn 1 khối `<script>` mới ngay trước `</script>` (dòng ~802, sau hàm `openTaskDetail`).
**Nội dung port nguyên văn từ `e0dfa93`** (đối chiếu số dòng ở bản cũ để copy chính xác):
- `normalizePerson` (dòng 4845) — 3 dòng, y nguyên.
- `formatStandardShortName` (dòng 3975) — y nguyên, dùng làm phần "không tìm thấy trong danh bạ" của `getShortName` (xem Task 2).
- `planPhases(plan)` (dòng 5552) — y nguyên.
- `allPlanSteps(plan)` — rút gọn còn: `function allPlanSteps(plan) { return planPhases(plan).flatMap(ph => ph.steps || []); }`.
- `findAnyStep`, `findStepWithPhase` (dòng 5569, 5583) — y nguyên (bỏ nhánh tra `planSteps(plan)` phẳng cũ, vì không còn nguồn đó).
- `stepDoneInfo`, `markStepDoneByPeople`, `stepPeopleProgressHtml` (dòng 5598-5642) — y nguyên.
- `rollUpPhaseStatus_` (dòng 5707) — y nguyên.

**Verify:** `node --check` trên toàn bộ nội dung `<script>` (trích bằng `sed`/`awk` như đã làm ở phiên P4) → 0 lỗi cú pháp.

### Task 2 — Danh bạ thật (`staffDirectory`) + `getShortName` đầy đủ
**File:** `nhatky/index.html`, cùng khối script. Đây là hạ tầng bắt buộc để Task 4 (gán người) lọc được theo tổ.
- Khai báo 2 biến toàn cục: `let staffList = []; let staffDirectory = [];`
- Port `loadStaff()` (dòng 4018-4071 bản cũ) **gần như nguyên văn**, chỉ bỏ 5 dòng cuối refresh-UI (`renderHeader`/`renderContactsScreen`/`refreshTaskAssigneeEditor`/`renderPlanPersonSelect` — không tồn tại trong shell mới) và thay bằng: nếu đang mở modal Chi tiết (`detailModalInstance._isShown` hoặc biến `currentOpenPlanId` tự thêm), gọi lại `openTaskDetail(currentOpenPlanId)` để render lại chip/select với dữ liệu mới. Vẫn giữ nguyên: đọc cache `localStorage` trước, tự nạp `../danhba_chuan_hoa.json` nếu cache rỗng, rồi gọi `bdsApiFetch('getStaff', {...})` cập nhật lại — 3 tầng y hệt bản cũ.
- Dùng key localStorage đơn giản trực tiếp (`"bandien_nhatky_staff_v2"`, `"bandien_nhatky_staff_directory_v1"`) thay vì object `STORAGE_KEYS` (shell mới không có object này) — copy đúng 2 chuỗi để dữ liệu cache cũ (nếu máy KTV từng dùng bản P1-P4) vẫn đọc được, không mất cache.
- Port `getShortName(fullName)` **đầy đủ** (dòng 3988-4014, có tra `staffDirectory` trước, fallback `formatStandardShortName`) — không dùng bản rút gọn nữa.
- Port `knownPeopleNames()` (dòng 4074-4082) nhưng đổi nguồn `plans`→`allPlans`, bỏ dòng `getStoredEmployees()`, và đổi `planSteps(plan)` (bước phẳng cũ) → `allPlanSteps(plan)` (đã có ở Task 1):
  ```js
  function knownPeopleNames() {
    const names = new Set(staffList);
    allPlans.flatMap(p => String(p.assignee || "").split(",")).forEach(n => names.add(n.trim()));
    allPlans.flatMap(p => allPlanSteps(p)).forEach(step => (step.assignees || []).forEach(n => names.add(String(n || "").trim())));
    return [...names].filter(Boolean).sort();
  }
  ```
- Port `filterNamesByTag(names, tagVal)` (dòng 5770-5785) y nguyên — lọc theo `dept`/`labels` khớp `plan.team`, không khớp ai thì trả về nguyên danh sách (tránh bí lối).
- Gọi `loadStaff()` 1 lần trong `DOMContentLoaded` (sau dòng gọi `loadPlans()` hiện có, dòng ~508) — chạy nền, không chặn UI.

**Verify:** mở app trên trình duyệt thật (cần mạng, gọi `getStaff` thật) → `console.log(staffDirectory.length)` > 0; hoặc mock response `getStaff` trong Playwright trả 2-3 người có `dept` khác nhau.

### Task 3 — CRUD giai đoạn & bước
**File:** `nhatky/index.html`, cùng khối script.
Port `addPhase`, `renamePhase`, `deletePhase`, `addPhaseStep`, `renamePhaseStep`, `deletePhaseStep`, `togglePhaseStepDone` (dòng 5676-5765 bản cũ) **nhưng viết lại `updatePlanPhases`** cho khớp kiến trúc network-first của shell mới (không còn `localStorage`-first + `syncPlanInBackground` như bản cũ):
```js
async function updatePlanPhases(planId, mutateFn) {
  const plan = allPlans.find(p => p.id === planId);
  if (!plan) return;
  const phases = planPhases(plan);
  mutateFn(phases);
  plan.phases = JSON.stringify(phases);
  const steps = allPlanSteps(plan);
  if (steps.length > 0) plan.status = steps.every(s => s.done) ? "Hoàn thành" : "Đang làm";
  await window.bdsApiPost('savePlan', {
    id: plan.id, phases: plan.phases, status: plan.status,
    date: plan.date, task: plan.task, updatedBy: BD_SSO.getUser()?.name || currentUserName
  });
  openTaskDetail(planId); // render lại modal đang mở
}
```
**Verify:** thủ công trên trình duyệt — thêm giai đoạn, đổi tên, xoá; thêm/xoá bước — không lỗi console.

### Task 4 — Gán người vào bước, lọc theo danh bạ/tổ (đầy đủ)
**File:** `nhatky/index.html`.
Port nguyên văn `addPhaseStepAssignee`/`removePhaseStepAssignee` (dòng 5787-5807) **và** `phaseStepAssigneeEditorHtml` (dòng 5809-5827, chip + `<select>` lọc theo `filterNamesByTag(knownPeopleNames()..., plan.team)`, có tuỳ chọn "➕ Nhập tên khác..." khi cần thêm người ngoài danh bạ) — dùng thẳng, không hạ cấp:
```js
function phaseStepAssigneeEditorHtml(plan, phaseId, step) {
  const names = step.assignees || [];
  const chips = names.map(name => `
    <span class="step-chip" title="${escapeAttr(name)}">${escapeHtml(getShortName(name))}<button type="button" onclick="event.stopPropagation(); removePhaseStepAssignee('${escapeAttr(plan.id)}','${escapeAttr(phaseId)}','${escapeAttr(step.id)}','${escapeAttr(name)}')">&times;</button></span>
  `).join("");
  const taken = new Set(names.map(normalizePerson));
  const options = filterNamesByTag(knownPeopleNames().filter(n => !taken.has(normalizePerson(n))), plan.team);
  return `<div class="step-assignees">${chips}
    <select class="step-add-select" title="${plan.team ? 'Lọc theo tổ: ' + escapeAttr(plan.team) : 'Gán người'}"
            onclick="event.stopPropagation()" onchange="addPhaseStepAssignee('${escapeAttr(plan.id)}','${escapeAttr(phaseId)}','${escapeAttr(step.id)}', this.value); this.value='';">
      <option value="">+ Gán người</option>
      ${options.map(n => `<option value="${escapeAttr(n)}">${escapeHtml(getShortName(n))}</option>`).join("")}
      <option value="__other__">➕ Nhập tên khác...</option>
    </select></div>`;
}
window.addPhaseStepAssignee = function (planId, phaseId, stepId, rawName) {
  let name = rawName === "__other__" ? (prompt("Tên người thực hiện:") || "") : rawName;
  if (!name || !name.trim()) return;
  updatePlanPhases(planId, phases => {
    const phase = phases.find(p => p.id === phaseId);
    const step = phase && (phase.steps || []).find(s => s.id === stepId);
    if (!step) return;
    if (!step.assignees) step.assignees = [];
    if (!step.assignees.some(n => normalizePerson(n) === normalizePerson(name))) step.assignees.push(name.trim());
  });
};
window.removePhaseStepAssignee = function (planId, phaseId, stepId, name) {
  updatePlanPhases(planId, phases => {
    const phase = phases.find(p => p.id === phaseId);
    const step = phase && (phase.steps || []).find(s => s.id === stepId);
    if (step) step.assignees = (step.assignees || []).filter(n => normalizePerson(n) !== normalizePerson(name));
  });
};
```
**Verify:** việc có `team="Điện"` + danh bạ có người `dept="Điện"` và người `dept="Cơ khí"` → dropdown gán người **chỉ hiện người Điện** (+ tuỳ chọn "Nhập tên khác"); việc không khớp ai theo tổ → dropdown hiện toàn bộ danh bạ (không bí lối).

### Task 5 — "＋ Nâng cấp thành nhiều giai đoạn" (chỉ hiện khi việc chưa có phases)
**File:** `nhatky/index.html`, trong `openTaskDetail(id)`.
Thêm 1 dòng nút ở cuối `chat-modal-body` khi `planPhases(plan).length === 0`:
```html
<div class="text-center py-2">
  <button class="btn btn-sm btn-outline-primary rounded-pill" onclick="upgradeToPhases('${plan.id}')">
    ⚙️ Việc này phức tạp? Chia giai đoạn/bước
  </button>
</div>
```
```js
window.upgradeToPhases = function (planId) {
  updatePlanPhases(planId, phases => {
    phases.push({ id: "PHASE-" + Date.now().toString(36), name: "Thực hiện", order: 1, status: "todo", steps: [] });
  });
};
```
**Verify:** bấm trên 1 việc mới (chưa có phases) → modal hiện lại có khối "Giai đoạn 1: Thực hiện" rỗng + nút "+ Thêm bước"; nút "Nâng cấp" tự ẩn đi sau đó (đúng nguyên tắc ẩn/hiện).

### Task 6 — Render khối "Giai đoạn & Bước" (chỉ khi việc có phases)
**File:** `nhatky/index.html`, sửa `openTaskDetail(id)` — chèn khối này giữa bubble thông tin việc và bubble `sourceText`, CHỈ khi `planPhases(plan).length > 0`:
```js
const phases = planPhases(plan);
if (phases.length > 0) {
  html += `<div class="chat-bubble-wrap"><div class="chat-avatar"><i class="bi bi-diagram-3"></i></div>
    <div class="chat-bubble-content" style="max-width:92%">
      <div class="chat-bubble-title">Giai đoạn & bước</div>
      ${phases.map(ph => phaseBlockHtml(plan, ph)).join("")}
      <button class="btn btn-sm btn-light rounded-pill mt-1" onclick="addPhase('${plan.id}')">+ Thêm giai đoạn</button>
    </div></div>`;
}
```
Viết `phaseBlockHtml(plan, phase)` + `phaseStepRowHtml(plan, phase, step)` (port rút gọn từ dòng 5829 bản cũ, dùng `phaseStepAssigneeEditorHtml` đã port ở Task 4 + `stepPeopleProgressHtml(step)` đã port ở Task 1).
**CSS cần thêm** (đối chiếu commit lịch sử `e0dfa93`, các class: `.step-row`, `.step-check`, `.step-chip`, `.step-assignees`, `.step-add-select`, `.step-done-note`, `.step-progress-people`) — chèn vào `<style>` hiện có.
**Verify (Playwright, giống cách đã verify P4):**
1. Mock `getPlans` trả về 1 plan **không có `phases`** → mở Chi tiết → **không thấy** khối "Giai đoạn & bước", chỉ thấy nút "Nâng cấp" (Task 5).
2. Mock `getPlans` trả về 1 plan **có `phases`** (1 giai đoạn, 1 bước, 2 `assignees`) + mock `getStaff` trả 2 người đó → mở Chi tiết → **thấy** khối Giai đoạn & Bước hiện đầy đủ, dropdown gán người lọc đúng theo tổ, không lỗi console.

### Task 7 — Tự báo hoàn thành theo người (Crowd-Completion)
**File:** `nhatky/index.html`.
Trong `phaseStepRowHtml`: nếu `step.assignees.length >= 2`, hiện hàng chip tên (tái dùng style `.self-chip` cũ hoặc `.badge` Bootstrap có sẵn) — bấm chip nào thì gọi:
```js
window.reportStepDone = function (planId, phaseId, stepId, name) {
  updatePlanPhases(planId, phases => {
    const phase = phases.find(p => p.id === phaseId);
    const step = phase && (phase.steps || []).find(s => s.id === stepId);
    if (step) { markStepDoneByPeople(step, [name], name); rollUpPhaseStatus_(phase); }
  });
};
```
Bước 0/1 người: click `step-check` gọi thẳng `togglePhaseStepDone` (port từ dòng 5753, dùng `markStepDoneByPeople` thay vì set `done` mù — khớp nguyên tắc P4 cũ).
Nút toàn cục "✅ Đánh dấu hoàn thành" (đã có sẵn, dòng 727-755 bản hiện tại): sửa điều kiện — nếu `allPlanSteps(plan).length > 0`, chỉ set `status="Hoàn thành"` khi `allPlanSteps(plan).every(s => s.done)`; nếu chưa đủ, hiện toast "Còn Y bước chưa xong" thay vì set thẳng.
**Verify (Playwright):** bước 2 người (An, Bình) → An tự báo xong → `doneByPeople=["An"]`, `step.done=false` → Bình tự báo xong → `doneByPeople=["An","Bình"]`, `step.done=true`, phase rollup `status="done"`; bấm nút hoàn thành toàn việc khi còn bước chưa xong → bị chặn + toast; khi đủ bước → cho phép, `plan.status="Hoàn thành"`.

### Task 8 — Card danh sách hiện tiến độ giai đoạn
**File:** `nhatky/index.html`, sửa `renderZaloListView()` (dòng ~615-651 hiện tại): nếu `planPhases(item).length > 0`, badge đổi thành `"GĐ " + doneSteps + "/" + totalSteps` thay vì badge trạng thái thường.
**Verify:** plan có 2/3 bước xong → card hiện "GĐ 2/3".

### Task 9 — Xác minh tổng thể & CHANGELOG
1. `node --check` toàn bộ script (như Task 1).
2. Playwright end-to-end (route-block `script.google.com`, mock `getPlans` + `getStaff`) chạy lại đúng kịch bản đã verify ở P4 cũ (seed bước 2 người → gán người lọc theo tổ → tự báo từng người → rollup đúng) nhưng trên UI Zalo mới — xác nhận **không lỗi console/page**.
3. Thêm mục CHANGELOG.md bản mới mô tả: khôi phục Giai đoạn/Bước + Crowd-Completion + gán người theo danh bạ/tổ trên nền Zalo shell, có ẩn/hiện theo độ phức tạp việc.

---

## Ngoài phạm vi plan này (đã ghi trong ThietKe_TongHop, không lặp lại ở đây)
- A2 (gate quyền Ghi hộ theo Role — checkbox "ghi hộ" ở modal Ghi Nhanh Việc Nhỏ vẫn ai cũng bấm được, chưa gate), A3 (Bàn giao/Nghiệm thu), A4 (nhúng checklist thật), A5 (Danh bạ/Mở rộng/Cá nhân), Phần B (Golf Phase 5) — chưa xếp thứ tự, chờ chọn tiếp.
- Bug `templateId`/`date` chưa khai báo trong `19_GolfChecklist.gs` — không đụng tới trong plan này.
