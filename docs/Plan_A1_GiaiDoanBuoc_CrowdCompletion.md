# Implementation Plan — A1: Giai đoạn/Bước + Crowd-Completion (Bước 2)

- **Ngày lập:** 2026-07-25
- **Dựa trên:** [`docs/ThietKe_TongHop_Superpowers_2026-07-24.md`](ThietKe_TongHop_Superpowers_2026-07-24.md) mục A1, đã chốt cách làm với người dùng.
- **File cần sửa:** chỉ `nhatky/index.html` (805 dòng, bản Zalo shell hiện tại của Antigravity). **Không đổi bất kỳ file `.gs` nào** — `14_NhatKyPlans.gs` đã lưu/trả `phases`/`steps` (cột 22, 29) từ trước, hoàn toàn tương thích.
- **Nguồn tham khảo:** logic đã verify Chrome thật ở commit `e0dfa93` (`git show e0dfa93:nhatky/index.html`) — port lại, không viết mới từ đầu.

## Nguyên tắc thiết kế bắt buộc (người dùng đã chốt)

> **Việc nhỏ ẩn bớt thông tin, việc lớn hiện thêm thông tin.**

Áp dụng cụ thể: modal "Ghi Nhanh Việc Nhỏ" giữ nguyên tối giản như hiện tại (không đổi). Khối "Giai đoạn & Bước" **chỉ xuất hiện trong modal Chi tiết khi `plan.phases` không rỗng** — việc đơn giản (không có phases) tiếp tục hiển thị y hệt hiện tại (bubble chat đơn giản), không bị thêm rối mắt.

## Phạm vi hạ cấp có chủ đích (để plan không phình to)

- **Gán người vào bước dùng `prompt()` đơn giản**, chưa lọc theo danh bạ/tổ (`filterNamesByTag`/`knownPeopleNames` của bản cũ cần hạ tầng `staffDirectory` mà shell mới chưa có) — nâng cấp thuộc phạm vi mục A2, không chặn A1.
- **`getShortName` dùng thẳng `formatStandardShortName`** (hàm thuần, không phụ thuộc `staffDirectory`) thay vì tra cứu "tên thường gọi" từ danh bạ — cũng thuộc phạm vi A2 sau này.
- **Bỏ khái niệm `steps` phẳng cũ** (bản P1-P4 có cả `plan.steps` lẫn `plan.phases` song song để tương thích ngược). Shell mới không có `plan.steps` cũ nào cần tương thích — chỉ cần `plan.phases`, nên `allPlanSteps`/`findAnyStep` rút gọn còn 1 nguồn duy nhất.

---

## Sub-task

### Task 1 — Port các hàm thuần (không UI)
**File:** `nhatky/index.html`, chèn 1 khối `<script>` mới ngay trước `</script>` (dòng ~802, sau hàm `openTaskDetail`).
**Nội dung port nguyên văn từ `e0dfa93`** (đối chiếu số dòng ở bản cũ để copy chính xác):
- `normalizePerson` (dòng 4845) — 3 dòng, y nguyên.
- `formatStandardShortName` (dòng 3975) — y nguyên; dùng làm `getShortName` (bỏ phần tra `staffDirectory`, theo mục "Phạm vi hạ cấp" ở trên):
  ```js
  function getShortName(fullName) { return formatStandardShortName(fullName); }
  ```
- `planPhases(plan)` (dòng 5552) — y nguyên.
- `allPlanSteps(plan)` — rút gọn còn: `function allPlanSteps(plan) { return planPhases(plan).flatMap(ph => ph.steps || []); }`.
- `findAnyStep`, `findStepWithPhase` (dòng 5569, 5583) — y nguyên (bỏ nhánh tra `planSteps(plan)` phẳng cũ, vì không còn nguồn đó).
- `stepDoneInfo`, `markStepDoneByPeople`, `stepPeopleProgressHtml` (dòng 5598-5642) — y nguyên.
- `rollUpPhaseStatus_` (dòng 5707) — y nguyên.

**Verify:** `node --check` trên toàn bộ nội dung `<script>` (trích bằng `sed`/`awk` như đã làm ở phiên P4) → 0 lỗi cú pháp.

### Task 2 — CRUD giai đoạn & bước
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

### Task 3 — Gán người vào bước (v1, dùng `prompt`)
**File:** `nhatky/index.html`.
Port `addPhaseStepAssignee`/`removePhaseStepAssignee` (dòng 5787-5807) nhưng thay input bằng `prompt()` thẳng thay vì `<select>` lọc theo tag:
```js
window.addPhaseStepAssignee = function (planId, phaseId, stepId) {
  const name = prompt("Tên người thực hiện:");
  if (!name || !name.trim()) return;
  updatePlanPhases(planId, phases => {
    const phase = phases.find(p => p.id === phaseId);
    const step = phase && (phase.steps || []).find(s => s.id === stepId);
    if (!step) return;
    if (!step.assignees) step.assignees = [];
    if (!step.assignees.some(n => normalizePerson(n) === normalizePerson(name))) step.assignees.push(name.trim());
  });
};
```
**Verify:** thêm 2 tên vào 1 bước → `step.assignees.length === 2`.

### Task 4 — "＋ Nâng cấp thành nhiều giai đoạn" (chỉ hiện khi việc chưa có phases)
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

### Task 5 — Render khối "Giai đoạn & Bước" (chỉ khi việc có phases)
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
Viết `phaseBlockHtml(plan, phase)` + `phaseStepRowHtml(plan, phase, step)` (port rút gọn từ dòng 5829 bản cũ, bỏ phần `phaseStepAssigneeEditorHtml` select-dropdown, thay bằng nút "+ Gán người" gọi thẳng `addPhaseStepAssignee` — khớp Task 3) + `stepPeopleProgressHtml(step)` (đã port ở Task 1).
**CSS cần thêm** (copy nguyên từ `e0dfa93`, các class: `.step-row`, `.step-check`, `.step-chip`, `.step-assignees`, `.step-add-select`, `.step-done-note`, `.step-progress-people` — tra bằng `grep -n "\.step-row\|\.step-check\|\.step-chip" old_p4.html` để lấy đúng block CSS) — chèn vào `<style>` hiện có.
**Verify (Playwright, giống cách đã verify P4):**
1. Mock `getPlans` trả về 1 plan **không có `phases`** → mở Chi tiết → **không thấy** khối "Giai đoạn & bước", chỉ thấy nút "Nâng cấp" (Task 4).
2. Mock `getPlans` trả về 1 plan **có `phases`** (1 giai đoạn, 1 bước, 2 `assignees`) → mở Chi tiết → **thấy** khối Giai đoạn & Bước hiện đầy đủ, không lỗi console.

### Task 6 — Tự báo hoàn thành theo người (Crowd-Completion)
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

### Task 7 — Card danh sách hiện tiến độ giai đoạn
**File:** `nhatky/index.html`, sửa `renderZaloListView()` (dòng ~615-651 hiện tại): nếu `planPhases(item).length > 0`, badge đổi thành `"GĐ " + doneSteps + "/" + totalSteps` thay vì badge trạng thái thường.
**Verify:** plan có 2/3 bước xong → card hiện "GĐ 2/3".

### Task 8 — Xác minh tổng thể & CHANGELOG
1. `node --check` toàn bộ script (như Task 1).
2. Playwright end-to-end (route-block `script.google.com`, mock `getPlans`) chạy lại đúng kịch bản đã verify ở P4 cũ (seed bước 2 người → tự báo từng người → rollup đúng) nhưng trên UI Zalo mới — xác nhận **không lỗi console/page**.
3. Thêm mục CHANGELOG.md bản mới mô tả: khôi phục Giai đoạn/Bước + Crowd-Completion trên nền Zalo shell, có ẩn/hiện theo độ phức tạp việc, kèm ghi chú phạm vi hạ cấp (gán người dùng `prompt`, chưa lọc danh bạ — để A2 làm tiếp).

---

## Ngoài phạm vi plan này (đã ghi trong ThietKe_TongHop, không lặp lại ở đây)
- A2 (gate quyền Ghi hộ + danh bạ thật), A3 (Bàn giao/Nghiệm thu), A4 (nhúng checklist thật), A5 (Danh bạ/Mở rộng/Cá nhân), Phần B (Golf Phase 5) — chưa xếp thứ tự, chờ chọn tiếp.
- Bug `templateId`/`date` chưa khai báo trong `19_GolfChecklist.gs` — không đụng tới trong plan này.
