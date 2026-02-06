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
type ParserMessageLog = tsdoc.ParserMessageLog;

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
      if (entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const ext = path.extname(entry.name);
      if (ALLOWED_EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  if (fs.existsSync(root)) {
    walk(root);
  }

  return files;
}

function formatLocation(filePath: string, line: number, column: number): string {
  const rel = path.relative(process.cwd(), filePath);
  return `${rel}:${line + 1}:${column + 1}`;
}

function logMessage(entry: LogEntry): void {
  const location = formatLocation(entry.filePath, entry.line, entry.column);
  process.stderr.write(`[tsdoc:error] ${location} ${entry.message}\n`);
}

function collectMessages(log: ParserMessageLog, filePath: string, results: LogEntry[]): void {
  for (const message of log.messages) {
    results.push({
      filePath,
      line: 0,
      column: 0,
      message: message.unformattedText,
    });
  }
}

function buildLineStarts(buffer: string): number[] {
  const starts = [0];
  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
}

function findLineAndColumn(lineStarts: readonly number[], index: number): [number, number] {
  let line = 0;
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
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

  const column = index - (lineStarts[line] ?? 0);
  return [line, column];
}

function validateFile(parser: tsdoc.TSDocParser, filePath: string, results: LogEntry[]): void {
  const source = fs.readFileSync(filePath, 'utf8');
  const blockRegex = /\/\*\*[\s\S]*?\*\//g;
  const lineStarts = buildLineStarts(source);
  const matches = source.matchAll(blockRegex);

  for (const match of matches) {
    const block = match[0];
    const blockIndex = match.index ?? 0;
    const parsed = parser.parseString(block);
    if (parsed.log.messages.length > 0) {
      const beforeCount = results.length;
      collectMessages(parsed.log, filePath, results);
      for (let i = beforeCount; i < results.length; i += 1) {
        const entry = results[i];
        if (!entry) continue;
        const message = parsed.log.messages[i - beforeCount];
        if (!message) continue;
        const absoluteIndex = blockIndex + message.textRange.pos;
        const [line, column] = findLineAndColumn(lineStarts, absoluteIndex);
        results[i] = { ...entry, line, column };
      }
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
    logMessage(entry);
  }

  process.stderr.write('TSDoc check failed.\n');
  process.exit(1);
}

main();
