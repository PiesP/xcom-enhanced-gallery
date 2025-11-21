/* eslint-disable no-console */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const TARGET_DIRECTORIES = ['src', 'test', 'scripts'];
const IGNORED_DIRNAME = new Set(['node_modules', 'dist', 'coverage']);
const ARCHIVE_PREFIX = 'test/archive';
const ALLOWED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
]);

export type RelativeImportViolationKind = 'import' | 'export' | 'dynamic-import' | 'require';

export interface RelativeImportViolation {
  filePath: string;
  line: number;
  column: number;
  specifier: string;
  kind: RelativeImportViolationKind;
}

const isDirectExecution = (() => {
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    return process.argv[1] ? resolve(process.argv[1]) === currentFilePath : false;
  } catch {
    return false;
  }
})();

function hasParentTraversal(specifier: string): boolean {
  return specifier.includes('../') || specifier.includes('..\\');
}

function recordViolation(
  sourceFile: ts.SourceFile,
  specifierNode: ts.StringLiteralLike,
  kind: RelativeImportViolationKind,
  violations: RelativeImportViolation[],
  filePath: string
): void {
  if (!hasParentTraversal(specifierNode.text)) {
    return;
  }

  const position = sourceFile.getLineAndCharacterOfPosition(specifierNode.getStart());
  violations.push({
    filePath,
    line: position.line + 1,
    column: position.character + 1,
    specifier: specifierNode.text,
    kind,
  });
}

export function scanContent(content: string, filePath: string): RelativeImportViolation[] {
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const violations: RelativeImportViolation[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      recordViolation(sourceFile, node.moduleSpecifier, 'import', violations, filePath);
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      recordViolation(sourceFile, node.moduleSpecifier, 'export', violations, filePath);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteralLike(node.arguments[0]!)
    ) {
      recordViolation(sourceFile, node.arguments[0]!, 'dynamic-import', violations, filePath);
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require' &&
      node.arguments.length > 0 &&
      ts.isStringLiteralLike(node.arguments[0]!)
    ) {
      recordViolation(sourceFile, node.arguments[0]!, 'require', violations, filePath);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return violations;
}

export function scanFile(filePath: string): RelativeImportViolation[] {
  const content = readFileSync(filePath, 'utf-8');
  return scanContent(content, filePath);
}

function collectFiles(rootDir: string, targetDir: string): string[] {
  const absoluteDir = resolve(rootDir, targetDir);
  if (!existsSync(absoluteDir)) {
    return [];
  }

  const stack = [absoluteDir];
  const results: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const stats = statSync(current);

    if (stats.isDirectory()) {
      const relativePath = relative(rootDir, current).replace(/\\/g, '/');
      if (relativePath.startsWith(ARCHIVE_PREFIX)) {
        continue;
      }

      const entries = readdirSync(current);
      for (const entry of entries) {
        if (IGNORED_DIRNAME.has(entry)) {
          continue;
        }
        stack.push(join(current, entry));
      }
    } else {
      if (ALLOWED_EXTENSIONS.has(extname(current))) {
        results.push(current);
      }
    }
  }

  return results;
}

export function runRelativeImportGuard(): void {
  const rootDir = process.cwd();
  let violations: RelativeImportViolation[] = [];
  let scannedFiles = 0;

  for (const directory of TARGET_DIRECTORIES) {
    const files = collectFiles(rootDir, directory);
    scannedFiles += files.length;
    for (const file of files) {
      violations = violations.concat(scanFile(file));
    }
  }

  if (violations.length > 0) {
    console.error('\n❌ Parent-relative imports detected:\n');
    for (const violation of violations) {
      const fileDisplay = relative(rootDir, violation.filePath) || violation.filePath;
      console.error(
        `  - ${fileDisplay}:${violation.line}:${violation.column} → ${violation.specifier} (${violation.kind})`
      );
    }
    console.error(`\nFound ${violations.length} violation(s) across ${scannedFiles} file(s).`);
    process.exit(1);
  }

  console.log(
    `✅ Relative import guard passed (${scannedFiles} file${scannedFiles === 1 ? '' : 's'} scanned).`
  );
}

if (isDirectExecution) {
  runRelativeImportGuard();
}
