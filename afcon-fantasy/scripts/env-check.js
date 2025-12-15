#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const semver = require('semver');

function readNvmrc(dir) {
  try {
    const p = path.join(dir, '.nvmrc');
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim();
  } catch (e) {}
  return null;
}

function findProjectRoot(dir) {
  const pkg = path.join(dir, 'package.json');
  if (fs.existsSync(pkg)) return dir;
  const parent = path.dirname(dir);
  if (parent === dir) return null;
  return findProjectRoot(parent);
}

const cwd = process.cwd();
const root = findProjectRoot(cwd);
if (!root) {
  console.error('\nERROR: Could not find project root (package.json).');
  console.error('Make sure you run this command from inside the project folder.\n');
  process.exit(2);
}

const pkg = require(path.join(root, 'package.json'));
if (!pkg || !pkg.name) {
  console.error('\nERROR: package.json seems invalid.');
  process.exit(3);
}

// Check node version against .nvmrc if present or engines.node in package.json
const target = readNvmrc(root) || (pkg.engines && pkg.engines.node) || null;
if (target) {
  const nodeVersion = process.version.replace(/^v/, '');
  const ok = semver.satisfies(nodeVersion, target);
  if (!ok) {
    console.error(`\nERROR: Node version mismatch. Current: ${process.version}. Expected: ${target}`);
    console.error('Use nvm (mac/linux) or nvm-windows to switch to the correct Node version.');
    process.exit(4);
  }
}

// Warn if node_modules missing or expo binary not installed locally
if (!fs.existsSync(path.join(root, 'node_modules'))) {
  console.warn('\nWARNING: node_modules not found. Run `npm ci` or `npm install` before starting.');
}

try {
  const expoBin = path.join(root, 'node_modules', '.bin', 'expo');
  if (!fs.existsSync(expoBin)) {
    console.warn('\nWARNING: Local `expo` binary not found. It is recommended to install the CLI as a devDependency or use the `start` script.');
  }
} catch (e) {}

// All good
process.exit(0);
