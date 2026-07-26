import codecs

with codecs.open('nhatky/index.html', 'r', 'utf-8') as f:
    lines = f.readlines()

# New lines to replace 661-672 (0-indexed: 660-671), keep 660 (blank line)
new_block = [
    '            return `\n',
    '              <div class="nk-step-wrap">\n',
    '                <div class="nk-step">\n',
    "                  <div class=\"nk-step__ck ${ckCls}\" style=\"cursor:pointer\" onclick=\"togglePhaseStepDone('${escapeAttr(pid)}','${escapeAttr(ph.id)}','${escapeAttr(st.id)}')\">${st.done ? '\u2713' : ''}</div>\n",
    '                  <div class="nk-step__text ${txtCls}">\n',
    "                    <span style=\"cursor:pointer\" onclick=\"renamePhaseStep('${escapeAttr(pid)}','${escapeAttr(ph.id)}','${escapeAttr(st.id)}')\">${escapeHtml(st.title)}</span>\n",
    '                  </div>\n',
    "                  <button class=\"nk-step__del\" onclick=\"deletePhaseStep('${escapeAttr(pid)}','${escapeAttr(ph.id)}','${escapeAttr(st.id)}')\">&#215;</button>\n",
    '                </div>\n',
    '                ${phaseStepAssigneeEditorHtml(plan, ph.id, st)}\n',
    '                ${selfChipHtml}\n',
    '                ${stepPeopleProgressHtml(st)}\n',
    '              </div>`;\n',
    "          }).join('') + `</div>`;\n",
]

# lines 660 = index 659 (blank line, keep)
# lines 661-672 = index 660-671, replace with new_block
new_lines = lines[:660] + new_block + lines[672:]

with codecs.open('nhatky/index.html', 'w', 'utf-8') as f:
    f.writelines(new_lines)

print(f'DONE. Old: {len(lines)} lines -> New: {len(new_lines)} lines')

# Verify
with codecs.open('nhatky/index.html', 'r', 'utf-8') as f:
    vlines = f.readlines()
print("Verification - lines around change:")
for i in range(658, 678):
    print(f"{i+1}: {vlines[i][:100].rstrip()}")
