// Bulk mechanical UTF-8 repair. Run only for explicitly named text files.
const fs = require('node:fs');

const cp1252 = new Map(Object.entries({
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84,
  0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88,
  0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c,
  0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93,
  0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
  0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f
}).map(([key, value]) => [Number(key), value]));

function byteFor(character) {
  const code = character.codePointAt(0);
  if (code <= 0xff) return code;
  return cp1252.get(code);
}

function score(value) {
  return (value.match(/Ã|Â|â|Ä|Æ|Å|ð|�/g) || []).length;
}

function decodeOnce(value) {
  const bytes = [];
  for (const character of value) {
    const byte = byteFor(character);
    if (byte === undefined) return null;
    bytes.push(byte);
  }
  const decoded = Buffer.from(bytes).toString('utf8');
  return decoded.includes('\ufffd') ? null : decoded;
}

function repairRun(value) {
  let current = value;
  for (let pass = 0; pass < 3; pass += 1) {
    const decoded = decodeOnce(current);
    if (decoded === null || score(decoded) >= score(current)) break;
    current = decoded;
  }
  return current;
}

function repairText(source) {
  let output = '';
  let run = '';
  const flush = () => {
    output += score(run) ? repairRun(run) : run;
    run = '';
  };
  for (const character of source) {
    if (byteFor(character) !== undefined) run += character;
    else {
      flush();
      output += character;
    }
  }
  flush();
  return output;
}

const files = process.argv.slice(2);
if (!files.length) {
  throw new Error('Pass one or more explicit files to repair');
}
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const after = repairText(before);
  if (after === before) throw new Error(`No repairable mojibake found: ${file}`);
  fs.writeFileSync(file, after, 'utf8');
  process.stdout.write(`Repaired UTF-8 mojibake: ${file}\n`);
}

