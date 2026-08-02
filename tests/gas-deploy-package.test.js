const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'tools', 'gas-deploy-files.json');
const builderPath = path.join(root, 'tools', 'Build-GasDeployPackage.ps1');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

test('allowlist chỉ chứa backend chính thức và index template', () => {
  const files = manifest.files;
  assert.deepEqual(manifest.releaseOverlay.sort(), ['02_Router.gs', '19_GolfChecklist.gs']);
  assert.ok(files.includes('19_GolfChecklist.gs'));
  assert.ok(files.includes('02_Router.gs'));
  assert.ok(files.includes('appsscript.json'));
  assert.ok(files.includes('index.html'));
  assert.equal(new Set(files).size, files.length);

  const forbidden = /(test-results|playwright-report|node_modules|temp|recovered|old_|danhba_chuan_hoa|zalo-tao-viec-extension)/i;
  for (const file of files) {
    assert.ok(!path.isAbsolute(file), `Đường dẫn tuyệt đối: ${file}`);
    assert.ok(!file.split(/[\\/]/).includes('..'), `Thoát workspace: ${file}`);
    assert.doesNotMatch(file, forbidden);
    const existsLocally = fs.existsSync(path.join(root, file));
    const existsBaseline = fs.existsSync(path.join(root, '.gas-baseline', file)) || fs.existsSync(path.join(root, '.gas-baseline', file.replace(/\.gs$/, '.html')));
    assert.ok(existsLocally || existsBaseline, `Thiếu file: ${file}`);
  }
});

test('builder tạo staging có inventory khớp tuyệt đối allowlist', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-package-test-'));
  const output = path.join(parent, 'staging');
  try {
    const result = spawnSync('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-File', builderPath, '-OutputDirectory', output, '-BaselineDirectory', path.join(root, '.gas-baseline')
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(full) : path.relative(output, full).replaceAll('\\', '/');
    });
    const actual = walk(output).sort();
    const expected = [...manifest.files, '.clasp.json'].map(x => x.replaceAll('\\', '/')).sort();
    assert.deepEqual(actual, expected);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('builder từ chối ghi đè staging đã tồn tại', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-package-existing-'));
  try {
    const result = spawnSync('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-File', builderPath, '-OutputDirectory', parent
    ], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stderr}\n${result.stdout}`, /already exists/i);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});
