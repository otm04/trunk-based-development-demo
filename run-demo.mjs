import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Creates a fresh, isolated repository each time. Never changes an existing repo.
const root = resolve(process.argv[2] || 'demo-runs');
mkdirSync(root, { recursive: true });
const repo = mkdtempSync(join(root, 'trunk-demo-'));
const log = [];
function say(s) { console.log(s); log.push(s); }
function git(...args) {
  const out = execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (out.trim()) say(out.trim());
}
function put(file, text) { writeFileSync(join(repo, file), text); }
function tests(label, expected = 0) {
  say('\n=== ' + label + ' ===');
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec'], { cwd: repo, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } });
  say((r.stdout || '') + (r.stderr || ''));
  if (r.status !== expected) throw new Error(`Expected exit ${expected}, got ${r.status}`);
  return r.stdout + r.stderr;
}
git('init', '-b', 'main');
git('config', 'user.name', 'Local Demo');
git('config', 'user.email', 'demo@example.invalid');
git('config', 'commit.gpgsign', 'false');
put('package.json', JSON.stringify({ name: 'trunk-ci-demo', private: true, type: 'module', scripts: { test: 'node --test' } }, null, 2) + '\n');
put('shipping.js', 'export function shippingCost(subtotal) {\n  return subtotal >= 50 ? 0 : 5;\n}\n');
const testHeader = "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { shippingCost } from './shipping.js';\n";
put('shipping.test.js', testHeader + "test('shipping boundary', () => {\n  assert.equal(shippingCost(49), 5);\n  assert.equal(shippingCost(50), 0);\n});\n");
mkdirSync(join(repo, '.github', 'workflows'), { recursive: true });
put('.github/workflows/ci.yml', `name: CI\non:\n  push:\n  pull_request:\npermissions:\n  contents: read\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v6\n      - uses: actions/setup-node@v7\n        with:\n          node-version: '24'\n      - run: node --test\n`);
git('add', '.'); git('commit', '-m', 'Base: shipping API and boundary tests');
const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
git('tag', 'demo-base');

git('switch', '-c', 'api-change');
put('shipping.js', 'export function shippingCost({ subtotal }) {\n  return subtotal >= 50 ? 0 : 5;\n}\n');
put('shipping.test.js', testHeader + "test('shipping boundary', () => {\n  assert.equal(shippingCost({ subtotal: 49 }), 5);\n  assert.equal(shippingCost({ subtotal: 50 }), 0);\n});\n");
tests('Branch A: API change passes');
git('add', '.'); git('commit', '-m', 'Change shipping API to an options object');

git('switch', '-c', 'checkout', base);
put('checkout.js', "import { shippingCost } from './shipping.js';\nexport function checkout(subtotal) {\n  return subtotal + shippingCost(subtotal);\n}\n");
put('checkout.test.js', "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { checkout } from './checkout.js';\ntest('checkout includes current shipping policy', () => {\n  assert.equal(checkout(80), 80);\n  assert.equal(checkout(40), 45);\n});\n");
tests('Branch B: checkout passes against old base');
git('add', '.'); git('commit', '-m', 'Add checkout using the original API');

git('switch', 'main');
git('merge', '--no-ff', 'api-change', '-m', 'Integrate API change');
git('switch', 'checkout');
git('merge', '--no-ff', 'main', '-m', 'Refresh checkout against current main');
git('tag', 'demo-broken');
const failure = tests('Git merged cleanly, but integration fails: 85 !== 80', 1);

// Fix the production caller; keep both assertions unchanged.
put('checkout.js', readFileSync(join(repo, 'checkout.js'), 'utf8').replace('shippingCost(subtotal)', 'shippingCost({ subtotal })'));
tests('Fix caller: same tests now pass');
git('add', '.'); git('commit', '-m', 'Use the current shipping API in checkout');
git('tag', 'demo-fixed');
git('switch', 'main');
git('merge', '--no-ff', 'checkout', '-m', 'Integrate the small checkout change');
tests('Main: integrated tests pass');
git('branch', '-d', 'api-change', 'checkout');
say('\n=== History ===');
git('log', '--oneline', '--graph', '--all');
writeFileSync(join(repo, 'FAILURE.txt'), failure);
writeFileSync(join(repo, 'TRANSCRIPT.txt'), log.join('\n'));
say('\nDemo repository: ' + repo);
say('Prepared failure preserved as demo-broken; fixed caller as demo-fixed.');
say('These are intentionally constructed teaching examples, not a personal setup incident.');
