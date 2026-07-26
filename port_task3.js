    async function updatePlanPhases(planId, mutateFn) {
      const plan = allPlans.find(p => p.id === planId);
      if (!plan) return;
      const phases = planPhases(plan);
      mutateFn(phases);
      plan.phases = JSON.stringify(phases);
      const steps = allPlanSteps(plan);
      if (steps.length > 0) plan.status = steps.every(s => s.done) ? "Hoàn thành" : "Đang làm";
      
      const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
      const userName = user ? (user.name || user.username || 'Unknown') : 'Unknown';
      
      await window.bdsApiPost('savePlan', {
        id: plan.id, phases: plan.phases, status: plan.status,
        date: plan.date, task: plan.task, updatedBy: userName
      });
      openTaskDetail(planId); // render lại modal đang mở
    }

    window.addPhase = function (planId) {
      const name = prompt("Tên giai đoạn mới (vd Khảo sát, Vật tư, Thi công, Nghiệm thu):");
      if (!name || !name.trim()) return;
      updatePlanPhases(planId, phases => {
        phases.push({
          id: "PHASE-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          name: name.trim(), order: phases.length + 1, status: "todo", steps: []
        });
      });
    };

    window.renamePhase = function (planId, phaseId) {
      const plan = allPlans.find(item => item.id === planId);
      const phase = plan && planPhases(plan).find(p => p.id === phaseId);
      if (!phase) return;
      const name = prompt("Tên giai đoạn:", phase.name || "");
      if (name === null || !name.trim()) return;
      updatePlanPhases(planId, phases => {
        const ph = phases.find(p => p.id === phaseId);
        if (ph) ph.name = name.trim();
      });
    };

    window.deletePhase = function (planId, phaseId) {
      if (!confirm("Xoá giai đoạn này? Các bước trong giai đoạn sẽ bị xoá theo.")) return;
      updatePlanPhases(planId, phases => {
        const index = phases.findIndex(p => p.id === phaseId);
        if (index >= 0) phases.splice(index, 1);
      });
    };

    window.addPhaseStep = function (planId, phaseId) {
      const title = prompt("Tên bước mới:");
      if (!title || !title.trim()) return;
      updatePlanPhases(planId, phases => {
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) return;
        if (!phase.steps) phase.steps = [];
        phase.steps.push({
          id: "STEP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          title: title.trim(), assignees: [], done: false, doneAt: "", doneBy: "", photos: []
        });
        rollUpPhaseStatus_(phase);
      });
    };

    window.renamePhaseStep = function (planId, phaseId, stepId) {
      const plan = allPlans.find(item => item.id === planId);
      const phase = plan && planPhases(plan).find(p => p.id === phaseId);
      const step = phase && (phase.steps || []).find(s => s.id === stepId);
      if (!step) return;
      const title = prompt("Tên bước:", step.title || "");
      if (title === null || !title.trim()) return;
      updatePlanPhases(planId, phases => {
        const ph = phases.find(p => p.id === phaseId);
        const s = ph && (ph.steps || []).find(x => x.id === stepId);
        if (s) s.title = title.trim();
      });
    };

    window.deletePhaseStep = function (planId, phaseId, stepId) {
      if (!confirm("Xoá bước này?")) return;
      updatePlanPhases(planId, phases => {
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) return;
        const index = (phase.steps || []).findIndex(s => s.id === stepId);
        if (index >= 0) phase.steps.splice(index, 1);
        rollUpPhaseStatus_(phase);
      });
    };

    window.togglePhaseStepDone = function (planId, phaseId, stepId) {
      updatePlanPhases(planId, phases => {
        const phase = phases.find(p => p.id === phaseId);
        const step = phase && (phase.steps || []).find(s => s.id === stepId);
        if (!step) return;
        
        const user = (typeof BD_SSO !== 'undefined') ? BD_SSO.getUser() : null;
        const userName = user ? (user.name || user.username || 'Unknown') : 'Unknown';
        
        step.done = !step.done;
        step.doneAt = step.done ? new Date().toISOString() : "";
        step.doneBy = step.done ? userName : "";
        // Tick tay là ghi đè cả bước → đồng bộ doneByPeople để hiển thị không lệch
        step.doneByPeople = step.done ? (step.assignees || []).slice() : [];
        rollUpPhaseStatus_(phase);
      });
    };
