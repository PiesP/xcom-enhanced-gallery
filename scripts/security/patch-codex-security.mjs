#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Codex Security 0.1.8 pins a vulnerable PDF.js 5 release. PDF.js 6 fixes the
// vulnerability and moves cleanup from PDFDocumentProxy to PDFDocumentLoadingTask.
const EXPECTED_CODEX_VERSION = '0.1.8';
const EXPECTED_PDFJS_VERSION = '6.2.108';
const ORIGINAL_SOURCE_SHA256 = '0bf6dd33d8006fde3deb8cebf451da8282f20250322e62d14e781b64d4fc6d28';
const PATCHED_SOURCE_SHA256 = '00c4406c8f84e4344b683b2c92c3ee9916c7b64b5cc4444aa9de2f87e4403451';

const installRoot = process.argv[2];
if (!installRoot || process.argv.length !== 3) {
  console.error('Usage: patch-codex-security.mjs <npm-install-prefix>');
  process.exit(2);
}

const codexRoot = resolve(installRoot, 'node_modules/@openai/codex-security');
const pdfjsRoot = resolve(installRoot, 'node_modules/pdfjs-dist');
const target = resolve(codexRoot, 'dist/knowledge-base.js');

const [codexPackage, pdfjsPackage, source] = await Promise.all([
  readJson(resolve(codexRoot, 'package.json')),
  readJson(resolve(pdfjsRoot, 'package.json')),
  readFile(target, 'utf8'),
]);

if (
  codexPackage.version !== EXPECTED_CODEX_VERSION ||
  pdfjsPackage.version !== EXPECTED_PDFJS_VERSION
) {
  throw new Error(
    `Unsupported Codex Security dependency pair: ${String(codexPackage.version)} / ${String(pdfjsPackage.version)}`
  );
}

const sourceDigest = sha256(source);
if (sourceDigest === PATCHED_SOURCE_SHA256) {
  process.exit(0);
}
if (sourceDigest !== ORIGINAL_SOURCE_SHA256) {
  throw new Error(`Unexpected Codex Security knowledge-base source digest: ${sourceDigest}`);
}

const originalLoad = `        const document = await getDocument({
            data: new Uint8Array(bytes),
            isEvalSupported: false,
            stopAtErrors: true,
            verbosity: VerbosityLevel.ERRORS,
        }).promise;`;
const patchedLoad = `        const loadingTask = getDocument({
            data: new Uint8Array(bytes),
            isEvalSupported: false,
            stopAtErrors: true,
            verbosity: VerbosityLevel.ERRORS,
        });
        const document = await loadingTask.promise;`;
const patched = source
  .replace(originalLoad, patchedLoad)
  .replace('            await document.destroy();', '            await loadingTask.destroy();');

const patchedDigest = sha256(patched);
if (patchedDigest !== PATCHED_SOURCE_SHA256) {
  throw new Error(
    `Codex Security compatibility patch produced an unexpected digest: ${patchedDigest}`
  );
}

await writeFile(target, patched, 'utf8');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}
