const fs = require('fs');
const content = fs.readFileSync('old_p4.html', 'utf8').split('\n');
const getLines = (start, end) => content.slice(start - 1, end).join('\n');

const known = `
    function knownPeopleNames() {
      const names = new Set(staffList);
      allPlans.flatMap(p => String(p.assignee || '').split(',')).forEach(n => names.add(n.trim()));
      allPlans.flatMap(p => allPlanSteps(p)).forEach(step => (step.assignees || []).forEach(n => names.add(String(n || '').trim())));
      return [...names].filter(Boolean).sort();
    }
`;

const loadStaffMod = `
    let staffList = [];
    let staffDirectory = [];
    
    async function loadStaff() {
      try {
        const cachedNames = localStorage.getItem('bandien_nhatky_staff_v2');
        if (cachedNames) {
          const arr = JSON.parse(cachedNames);
          if (Array.isArray(arr) && arr.length > 0) staffList = arr;
        }
        const cachedDir = localStorage.getItem('bandien_nhatky_staff_directory_v1');
        if (cachedDir) {
          const arr = JSON.parse(cachedDir);
          if (Array.isArray(arr) && arr.length > 0) staffDirectory = arr;
        }

        if (staffList.length === 0 || staffDirectory.length === 0) {
          try {
            const res = await fetch('../danhba_chuan_hoa.json');
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                staffDirectory = data;
                staffList = data.map(d => d.fullName).filter(Boolean);
              }
            }
          } catch (e) { console.warn('Lỗi đọc fallback danhba_chuan_hoa.json:', e); }
        }

        const res = await window.bdsApiFetch('getStaff', { force: true });
        if (res && res.status === 'success' && Array.isArray(res.data)) {
          staffDirectory = res.data;
          staffList = res.data.map(d => d.fullName).filter(Boolean);
          localStorage.setItem('bandien_nhatky_staff_v2', JSON.stringify(staffList));
          localStorage.setItem('bandien_nhatky_staff_directory_v1', JSON.stringify(staffDirectory));
          
          if (typeof currentOpenPlanId !== 'undefined' && currentOpenPlanId) {
            openTaskDetail(currentOpenPlanId);
          }
        }
      } catch (err) {
        console.error('Lỗi loadStaff:', err);
      }
    }
`;

const port2 = loadStaffMod + '\n' + getLines(3988, 4014) + '\n' + known + '\n' + getLines(5770, 5785);
fs.writeFileSync('port_task2.js', port2);
