    function escapeAttr(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

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
