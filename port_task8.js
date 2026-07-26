const fs = require('fs');
let html = fs.readFileSync('nhatky/index.html', 'utf8');

const search = `      const who  = escapeHtml(assignee || updBy || 'Chưa giao');
      const meta = [
        \`<span class="who">\${who}</span>\`,
        area ? \`<span class="sep">·</span><span>\${escapeHtml(area)}</span>\` : '',
        date ? \`<span class="sep">·</span><span>\${date.slice(5)}</span>\` : ''
      ].join('');

      return \`
        <a class="nk-wrow" href="#detail/\${escapeAttr(String(id))}" id="wrow-\${escapeAttr(String(id))}">
          <div class="nk-wrow__dot" style="background:\${dotColor}"></div>
          <div class="nk-wrow__main">
            <div class="nk-wrow__title">\${task}</div>
            <div class="nk-wrow__meta">\${meta}</div>
          </div>
          <div class="nk-wrow__chev">›</div>
        </a>\`;`;

const replace = `      const who  = escapeHtml(assignee || updBy || 'Chưa giao');
      
      let badgeHtml = '';
      const phases = typeof planPhases === 'function' ? planPhases(item) : [];
      if (phases.length > 0) {
        let totalSteps = 0;
        let doneSteps = 0;
        phases.forEach(ph => {
          const stps = ph.steps || [];
          totalSteps += stps.length;
          doneSteps += stps.filter(s => s.done).length;
        });
        if (totalSteps > 0) {
          badgeHtml = \`<span style="background: var(--bg-surface-hover, #e0e0e0); color: var(--primary-color, #0b4d5e); padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px; margin-right: 5px;">GĐ \${doneSteps}/\${totalSteps}</span>\`;
        }
      }

      const meta = [
        \`<span class="who">\${who}</span>\`,
        area ? \`<span class="sep">·</span><span>\${escapeHtml(area)}</span>\` : '',
        date ? \`<span class="sep">·</span><span>\${date.slice(5)}</span>\` : ''
      ].join('');

      return \`
        <a class="nk-wrow" href="#detail/\${escapeAttr(String(id))}" id="wrow-\${escapeAttr(String(id))}">
          <div class="nk-wrow__dot" style="background:\${dotColor}"></div>
          <div class="nk-wrow__main">
            <div class="nk-wrow__title">\${badgeHtml}\${task}</div>
            <div class="nk-wrow__meta">\${meta}</div>
          </div>
          <div class="nk-wrow__chev">›</div>
        </a>\`;`;

html = html.replace(search, replace);
fs.writeFileSync('nhatky/index.html', html);
