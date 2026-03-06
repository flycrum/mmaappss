/**
 * postInstall: ensure root .agents/plugins exists and .agents/plugins/mmaappss
 * is a symlink to packages/mmaappss/.agents/plugins/mmaappss.
 * Run from repo root (e.g. pnpm install).
 * We symlink so plugins live in one place (packages/mmaappss) but are consumed at root without duplication.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pluginsDir = path.join(root, '.agents', 'plugins');
const mmaappssLink = path.join(pluginsDir, 'mmaappss');
const mmaappssTarget = path.join(root, 'packages', 'mmaappss', '.agents', 'plugins', 'mmaappss');

if (!fs.existsSync(mmaappssTarget)) {
  process.exit(0);
}

if (!fs.existsSync(path.join(root, '.agents'))) {
  fs.mkdirSync(path.join(root, '.agents'), { recursive: true });
}
if (!fs.existsSync(pluginsDir)) {
  fs.mkdirSync(pluginsDir, { recursive: true });
}

const relativeTarget = path.relative(pluginsDir, mmaappssTarget);
if (fs.existsSync(mmaappssLink)) {
  const stat = fs.lstatSync(mmaappssLink);
  if (stat.isSymbolicLink()) {
    const current = fs.readlinkSync(mmaappssLink);
    if (current === relativeTarget) {
      process.exit(0);
    }
    fs.unlinkSync(mmaappssLink);
  }
}

if (!fs.existsSync(mmaappssLink)) {
  fs.symlinkSync(relativeTarget, mmaappssLink);
}
