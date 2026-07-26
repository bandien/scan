const fs = require('fs');
const html = fs.readFileSync('nhatky/index.html', 'utf8');
const matches = html.match(/id=["'][^"']*modal[^"']*["']/gi) || [];
console.log(matches);
