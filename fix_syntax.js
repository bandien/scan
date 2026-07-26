const fs = require('fs');
let html = fs.readFileSync('nhatky/index.html', 'utf8');
html = html.replace(/\\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('nhatky/index.html', html);
