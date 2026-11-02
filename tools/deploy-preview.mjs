// Produce a reviewed source manifest for the Vercel/GitHub connectors.
// This script never reads .env files or publishes by itself.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const roots = ['app', 'components', 'lib', 'schema', 'design', 'public', 'tests', 'docs', 'prototype', 'assets'];
const files = [];
async function walk(relative) {
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'reference') continue;
    const file = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) await walk(file);
    else {
      const binary = /\.(png|jpg|webp|woff2|ico)$/.test(file);
      files.push({ file, data: await readFile(path.join(root, file), binary ? 'base64' : 'utf8'), encoding: binary ? 'base64' : 'utf-8' });
    }
  }
}
for (const dir of roots) await walk(dir);
for (const file of ['package.json', 'package-lock.json', 'tsconfig.json', 'next-env.d.ts', 'next.config.ts', 'postcss.config.mjs', 'eslint.config.mjs', 'vercel.json', '.vercelignore', '.gitignore', '.env.example', 'AGENTS.md', 'README.md']) files.push({ file, data: await readFile(path.join(root, file), 'utf8'), encoding: 'utf-8' });
for (const file of ['verify-site.mjs', 'deploy-preview.mjs', 'build-prototype-data.py', 'capture-reference.mjs']) files.push({ file: `tools/${file}`, data: await readFile(path.join(root, 'tools', file), 'utf8'), encoding: 'utf-8' });
const output = process.argv[2] || '/tmp/quantum-lynx-source-manifest.json';
await writeFile(output, JSON.stringify(files));
console.log(JSON.stringify({ output, files: files.length }));
