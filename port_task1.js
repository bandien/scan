    function normalizePerson(value) {
      return String(value || "").trim().toLowerCase();
    }

    function formatStandardShortName(rawName) {
      if (!rawName) return "";
      const raw = String(rawName).trim();
      if (!raw) return "";

      const parts = raw.split(/\s+/);
      if (parts.length <= 2) return raw; // Ví dụ "Thắng NQ", "Hậu DV" -> đã ngắn gọn chuẩn

      const mainName = parts[parts.length - 1]; // "Thắng", "Hậu"
      const initials = parts.slice(0, parts.length - 1).map(p => p.charAt(0).toUpperCase()).join("");
      return `${mainName} ${initials}`; // "Thắng NQ", "Hậu DV"
    }

    function planPhases(plan) {
      if (!plan || !plan.phases) return [];
      try {
        const parsed = JSON.parse(plan.phases);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }

    // Gộp bước phẳng cũ + bước trong giai đoạn mới — dùng cho những chỗ chỉ cần
    // tính tổng tiến độ chung (vd cập nhật trạng thái việc khi ghi nhật ký).
    function allPlanSteps(plan) {

function allPlanSteps(plan) { return planPhases(plan).flatMap(ph => ph.steps || []); }

    function findAnyStep(plan, stepId) {
      if (!plan || !stepId) return null;
      const legacy = planSteps(plan).find(s => s.id === stepId);
      if (legacy) return legacy;
      for (const ph of planPhases(plan)) {
        const found = (ph.steps || []).find(s => s.id === stepId);
        if (found) return found;
      }
      return null;
    }

    // Như findAnyStep, nhưng kèm tên giai đoạn (null nếu là bước phẳng cũ, chưa
    // thuộc giai đoạn nào) — dùng để chú thích "nhật ký này thuộc bước/giai đoạn
    // nào" trên timeline (planTimelineHtml), vì log chỉ lưu stepId, không lưu tên.
    function findStepWithPhase(plan, stepId) {

    function stepDoneInfo(step) {
      const assignees = (step && step.assignees) || [];
      const doneNames = (step && step.doneByPeople) || [];
      const doneSet = new Set(doneNames.map(normalizePerson));
      const total = assignees.length;
      const doneCount = total ? assignees.filter(a => doneSet.has(normalizePerson(a))).length : (step && step.done ? 1 : 0);
      return { assignees, doneNames, total, doneCount, allDone: Boolean(step && step.done) };
    }

    // Ghi nhận (những) người đã Hoàn thành phần mình trên bước; đặt step.done theo
    // nguyên tắc "đủ người mới xong". `people` rỗng → dùng fallbackBy (người ghi).
    function markStepDoneByPeople(step, people, fallbackBy) {
      if (!step) return;
      const wasDone = step.done === true; // bước đã Xong (kể cả từ mô hình cũ) thì giữ Xong
      if (!Array.isArray(step.doneByPeople)) step.doneByPeople = [];
      const names = (people && people.length ? people : [fallbackBy]).filter(Boolean);
      names.forEach(nm => {
        if (!step.doneByPeople.some(n => normalizePerson(n) === normalizePerson(nm))) step.doneByPeople.push(nm);
      });
      const assignees = step.assignees || [];
      const doneSet = new Set(step.doneByPeople.map(normalizePerson));
      const allDone = assignees.length === 0 ? true : assignees.every(a => doneSet.has(normalizePerson(a)));
      // Chỉ tiến lên "Xong", không tự lùi: ghi thêm không bao giờ bỏ trạng thái đã Xong
      // (muốn bỏ Xong phải bấm tick thủ công ở toggleStepDone/togglePhaseStepDone).
      step.done = wasDone || allDone;
      step.doneAt = new Date().toISOString();
      step.doneBy = names[names.length - 1] || fallbackBy || "";
    }

    // Dòng tiến độ hiển thị dưới 1 bước: đã xong → ai xong; chưa xong nhiều người →
    // "x/y người đã xong" + tên. Dùng chung cho bước phẳng (stepRowHtml) và bước
    // trong giai đoạn (phaseStepRowHtml). Bước cũ (done qua mô hình cũ, không có
    // doneByPeople) vẫn hiển thị "đã xong" bình thường vì đọc step.done trực tiếp.
    function stepPeopleProgressHtml(step) {
      const info = stepDoneInfo(step);
      if (step.done) {
        const by = step.doneBy ? escapeHtml(getShortName(step.doneBy)) + " đã xong" : "Đã xong";
        return `<div class="step-done-note"><i class="bi bi-check2-circle me-1"></i>${by}${step.doneAt ? " · " + friendlyDate(step.doneAt.slice(0, 10)) : ""}</div>`;
      }
      if (info.total > 1 && info.doneCount > 0) {
        const doneList = (info.doneNames || []).map(n => escapeHtml(getShortName(n))).join(", ");
        return `<div class="step-progress-people"><i class="bi bi-people me-1"></i>${info.doneCount}/${info.total} người đã xong${doneList ? " · " + doneList : ""}</div>`;
      }
      return "";
    }

    function rollUpPhaseStatus_(phase) {
      if (!phase) return;
      const steps = phase.steps || [];
      phase.status = steps.length === 0 ? "todo" : steps.every(s => s.done) ? "done" : steps.some(s => s.done) ? "doing" : "todo";
    }

    window.addPhaseStep = function (planId, phaseId) {
      const title = prompt("Tên bước mới:");