import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve from this script so the check also works outside the app directory.
const root = fileURLToPath(new URL('../', import.meta.url));
const src = path.join(root, 'src');
const visited = new Set();
const failures = [];

async function isFile(file) {
  return stat(file).then(info => info.isFile()).catch(() => false);
}

async function visit(file) {
  if (visited.has(file)) return;
  visited.add(file);
  if (!/\.(js|jsx|css)$/.test(file)) return;
  const text = await readFile(file, 'utf8');
  const imports = text.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']/g);
  for (const [, specifier] of imports) {
    const base = path.resolve(path.dirname(file), specifier);
    const candidates = [base, `${base}.js`, `${base}.jsx`, path.join(base, 'index.js')];
    let target;
    for (const candidate of candidates) {
      if (await isFile(candidate)) { target = candidate; break; }
    }
    if (target) await visit(target);
    else failures.push(`${path.relative(root, file)}: missing ${specifier}`);
  }
}

async function checkReachability(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) await checkReachability(file);
    else if (/\.(js|jsx|css)$/.test(file) && !visited.has(file)) {
      failures.push(`${path.relative(root, file)}: unreachable from src/main.jsx`);
    }
  }
}

await visit(path.join(src, 'main.jsx'));
await checkReachability(src);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Structure OK: ${visited.size} reachable source files and assets; all relative imports resolve.`);
}
