const fs = require("fs");
const path = require("path");

const file = path.resolve(__dirname, "..", "nhatky", "index.html");
const html = fs.readFileSync(file, "utf8");
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1])
  .filter(code => code.trim());

scripts.forEach(code => new Function(code));

const staticHtml = html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g, "");
const ids = [...staticHtml.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) {
  throw new Error(`Duplicate HTML ids: ${[...new Set(duplicates)].join(", ")}`);
}

const requiredIds = ["screen-people", "filterDate", "peopleBody", "btnQuickLog"];
const missing = requiredIds.filter(id => !ids.includes(id));
if (missing.length) {
  throw new Error(`Missing people-screen ids: ${missing.join(", ")}`);
}

console.log(JSON.stringify({ file, inlineScriptsChecked: scripts.length, htmlIdsChecked: ids.length }));
