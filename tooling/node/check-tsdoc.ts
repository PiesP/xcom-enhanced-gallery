/**
 * TSDoc validation for project source files.
 *
 * Scans src files (ts/tsx) and validates TSDoc blocks using
 * the @microsoft/tsdoc parser. Reports warnings and errors, and fails
 * the process if any issues are found.
 */

import fs from 'node:fs';
import path from 'node:path';

import * as tsdoc from '@microsoft/tsdoc';

const { TSDocConfiguration, TSDocParser } = tsdoc;

const SOURCE_ROOT = path.resolve(process.cwd(), 'src');
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx']);

type LogEntry = {
  readonly filePath: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
};

function collectSourceFiles(root: string): string[] {
  const files: string[] = [];

  function walk(current: string): void {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (ALLOWED_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  if (fs.existsSync(root)) walk(root);
  return files;
}

function buildLineStarts(buffer: string): number[] {
  const starts = [0];
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function findLineAndColumn(lineStarts: readonly number[], index: number): [number, number] {
  let line = 0;
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const start = lineStarts[mid] ?? 0;
    const next = lineStarts[mid + 1];

    if (index < start) {
      high = mid - 1;
    } else if (next !== undefined && index >= next) {
      low = mid + 1;
    } else {
      line = mid;
      break;
    }
  }

  return [line, index - (lineStarts[line] ?? 0)];
}

function validateFile(parser: tsdoc.TSDocParser, filePath: string, results: LogEntry[]): void {
  const source = fs.readFileSync(filePath, 'utf8');
  const blockRegex = /\/\*\*[\s\S]*?\*\//g;
  const lineStarts = buildLineStarts(source);

  for (const match of source.matchAll(blockRegex)) {
    const block = match[0];
    const blockIndex = match.index ?? 0;
    const parsed = parser.parseString(block);

    for (const msg of parsed.log.messages) {
      const absoluteIndex = blockIndex + msg.textRange.pos;
      const [line, column] = findLineAndColumn(lineStarts, absoluteIndex);
      results.push({ filePath, line, column, message: msg.unformattedText });
    }
  }
}

function buildParser(): tsdoc.TSDocParser {
  const config = new TSDocConfiguration();
  config.validation.ignoreUndefinedTags = true;
  config.validation.reportUnsupportedTags = false;
  config.validation.reportUnsupportedHtmlElements = false;
  return new TSDocParser(config);
}

function main(): void {
  const parser = buildParser();
  const files = collectSourceFiles(SOURCE_ROOT);
  const results: LogEntry[] = [];

  for (const filePath of files) {
    validateFile(parser, filePath, results);
  }

  if (results.length === 0) {
    process.stdout.write('TSDoc check: no issues found.\n');
    return;
  }

  for (const entry of results) {
    const rel = path.relative(process.cwd(), entry.filePath);
    process.stderr.write(
      `[tsdoc:error] ${rel}:${entry.line + 1}:${entry.column + 1} ${entry.message}\n`
    );
  }

  process.stderr.write('TSDoc check failed.\n');
  process.exit(1);
}

main();
