const { execSync } = require('child_process');
execSync('node extract_task2.js', { stdio: 'inherit' });

const fs = require('fs');
let html = fs.readFileSync('nhatky/index.html', 'utf8');
const script = fs.readFileSync('port_task2.js', 'utf8');
html = html.replace('</script>\n</body>', '\n// --- PORTED FROM TASK 2 ---\n' + script + '\n</script>\n</body>');
html = html.replace('await loadPlans();', 'await loadPlans();\n  loadStaff();');
fs.writeFileSync('nhatky/index.html', html);
