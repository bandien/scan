    function renderFlatPhases(plan) {
      const phases = planPhases(plan);
      const pid    = String(planField(plan, 'PlanID', 'id', 'planId'));

      if (phases.length === 0) {
        return `<div style="text-align:center; padding: 10px 0;">
          <button onclick="upgradeToPhases('${escapeAttr(pid)}')" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--primary-color); background: transparent; color: var(--primary-color); font-weight: 700; cursor: pointer;">
            ⚙️ Việc này phức tạp? Chia giai đoạn/bước
          </button>
        </div>`;
      }

      return phases.map((ph, idx) => {
        const steps   = ph.steps || [];
        const doneN   = steps.filter(s => s.done).length;
        const isDone  = ph.status === 'done' || (steps.length > 0 && doneN === steps.length);
        const isDoing = !isDone && doneN > 0;

        const cls  = isDone ? 'nk-pmark--done' : isDoing ? 'nk-pmark--doing' : 'nk-pmark--todo';
        const icon = isDone ? '✓' : isDoing ? '▸' : '○';
        const name = escapeHtml(ph.name || \`Giai đoạn \${idx + 1}\`);

        let stepsHtml = '';
        if (steps.length > 0) {
          stepsHtml = \`<div class="nk-steps">\` + steps.map(st => {
            const ckCls  = st.done ? 'nk-step__ck--done' : '';
            const txtCls = st.done ? 'nk-step__text--done' : '';
            
            // Task 7: Crowd-completion self-chip
            let selfChipHtml = '';
            const assignees = st.assignees || [];
            if (assignees.length >= 2) {
              const currentUser = (typeof BD_SSO !== 'undefined' ? BD_SSO.getUser()?.name : currentUserName) || '';
              const myName = normalizePerson(currentUser);
              if (myName && assignees.some(a => normalizePerson(a) === myName)) {
                const doneSet = new Set((st.doneByPeople || []).map(normalizePerson));
                const iAmDone = doneSet.has(myName);
                selfChipHtml = \`<button class="nk-self-chip \${iAmDone ? 'is-done' : ''}" onclick="event.stopPropagation(); reportStepDone('\${escapeAttr(pid)}','\${escapeAttr(ph.id)}','\${escapeAttr(st.id)}','\${escapeAttr(currentUser)}')">\${iAmDone ? '✓ Mình đã xong' : '○ Báo mình xong'}</button>\`;
              }
            }
            
            return \`
              <div class="nk-step">
                <div class="nk-step__ck \${ckCls}" style="cursor:pointer" onclick="togglePhaseStepDone('\${escapeAttr(pid)}','\${escapeAttr(ph.id)}','\${escapeAttr(st.id)}')">\${st.done ? '✓' : ''}</div>
                <div class="nk-step__text \${txtCls}">
                  <span onclick="renamePhaseStep('\${escapeAttr(pid)}','\${escapeAttr(ph.id)}','\${escapeAttr(st.id)}')">\${escapeHtml(st.title)}</span>
                  \${selfChipHtml}
                  \${stepPeopleProgressHtml(st)}
                </div>
                \${phaseStepAssigneeEditorHtml(plan, ph.id, st)}
                <button class="nk-step__del" onclick="deletePhaseStep('\${escapeAttr(pid)}','\${escapeAttr(ph.id)}','\${escapeAttr(st.id)}')">&times;</button>
              </div>\`;
          }).join('') + \`</div>\`;
        }

        return \`
          <div class="nk-pline">
            <div class="nk-pmark \${cls}">\${icon}</div>
            <div class="nk-pname" style="cursor:pointer" onclick="renamePhase('\${escapeAttr(pid)}', '\${escapeAttr(ph.id)}')">\${name}</div>
            <div class="nk-pcount">\${doneN}/\${steps.length}</div>
            <button class="nk-step__del" style="margin-left: auto;" onclick="deletePhase('\${escapeAttr(pid)}', '\${escapeAttr(ph.id)}')">&times;</button>
          </div>
          \${stepsHtml}
          <button class="nk-add-step" onclick="addPhaseStep('\${escapeAttr(pid)}', '\${escapeAttr(ph.id)}')">＋ Thêm bước</button>\`;
      }).join('') + \`<button class="nk-add-step" style="padding-left:0; margin-top: 10px;" onclick="addPhase('\${escapeAttr(pid)}')">＋ Thêm giai đoạn</button>\`;
    }

    window.upgradeToPhases = function (planId) {
      updatePlanPhases(planId, phases => {
        phases.push({ id: "PHASE-" + Date.now().toString(36), name: "Thực hiện", order: 1, status: "todo", steps: [] });
      });
    };
    
    window.reportStepDone = function (planId, phaseId, stepId, name) {
      updatePlanPhases(planId, phases => {
        const phase = phases.find(p => p.id === phaseId);
        const step = phase && (phase.steps || []).find(s => s.id === stepId);
        if (step) { markStepDoneByPeople(step, [name], name); rollUpPhaseStatus_(phase); }
      });
    };
