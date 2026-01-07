/**
 * @fileoverview Production bundle cleanup plugin for Vite.
 *
 * Removes development artifacts from the final userscript bundle:
 * - Module tags and pure annotations
 * - Logger calls (debug, info, warn, trace)
 * - Singleton reset methods and test helpers
 * - Internal JSDoc comments
 * - Comments and unnecessary whitespace
 *
 * Uses JS-aware parsing to safely identify and remove patterns without
 * corrupting code within strings or template literals.
 */

import { Script } from 'node:vm';
import type { Plugin } from 'vite';

const DEBUG_VALIDATE_STEPS = process.env.XEG_DEBUG_VALIDATE_PROD_CLEANUP === '1';

/**
 * Validates that code remains parsable as a JavaScript script.
 * Only runs when XEG_DEBUG_VALIDATE_PROD_CLEANUP environment variable is set.
 *
 * @param step - Name of the transformation step for error context
 * @param code - JavaScript code to validate
 * @throws Error if code is unparsable (when DEBUG_VALIDATE_STEPS is true)
 * @internal
 */
function assertParsableJs(step: string, code: string): void {
  if (!DEBUG_VALIDATE_STEPS) return;
  try {
    // Parse as a script (not a function body) to catch real-world syntax errors.
    // The userscript bundle is an IIFE, so this should always be valid script code.
    const parsed = new Script(code, { filename: `production-cleanup:${step}` });
    void parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[production-cleanup] Bundle became unparsable after step "${step}": ${message}`
    );
  }
}

/**
 * Validates that the final bundle is parsable as JavaScript.
 * Always runs (not conditional on DEBUG_VALIDATE_STEPS).
 *
 * @param code - Final JavaScript code to validate
 * @throws Error if code is unparsable
 * @internal
 */
function assertParsableJsFinal(code: string): void {
  try {
    const parsed = new Script(code, { filename: 'production-cleanup:final' });
    void parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[production-cleanup] Final bundle is unparsable: ${message}`);
  }
}

/**
 * Escapes special characters in a string for use in RegExp patterns.
 *
 * @param source - String to escape
 * @returns Escaped string safe for RegExp literal
 * @internal
 */
function escapeRegExp(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type JsStripMode = 'code' | 'single' | 'double' | 'template' | 'regex';

const REGEX_KEYWORDS = new Set([
  'return',
  'throw',
  'case',
  'delete',
  'void',
  'typeof',
  'yield',
  'await',
  'in',
  'instanceof',
  'else',
  'do',
]);

/**
 * Checks if a character can start a JavaScript identifier.
 *
 * @param char - Single character to test
 * @returns True if character matches [A-Za-z_$]
 * @internal
 */
function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_$]/.test(char);
}

/**
 * Checks if a character can be part of a JavaScript identifier (after first char).
 *
 * @param char - Single character to test
 * @returns True if character matches [A-Za-z0-9_$]
 * @internal
 */
function isIdentifierPart(char: string): boolean {
  return /[A-Za-z0-9_$]/.test(char);
}

/**
 * Checks if a character is whitespace (space, newline, carriage return, or tab).
 *
 * @param char - Single character to test
 * @returns True if character is whitespace
 * @internal
 */
function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\n' || char === '\r' || char === '\t';
}

/**
 * Finds the next non-whitespace character from a given index in code.
 *
 * @param code - Source code to search
 * @param startIndex - Index to start searching from
 * @returns First non-whitespace character or null if not found
 * @internal
 */
function findNextNonWhitespace(code: string, startIndex: number): string | null {
  for (let i = startIndex; i < code.length; i++) {
    const char = code[i] as string;
    if (!isWhitespace(char)) {
      return char;
    }
  }
  return null;
}

/**
 * Removes JavaScript comments while preserving code semantics.
 *
 * Handles single-line comments, multi-line comments, and preserves:
 * - String literals (single and double quoted)
 * - Template literals with expression interpolation
 * - Regular expression patterns
 *
 * Uses JS-aware parsing to avoid corrupting patterns inside strings.
 *
 * @param code - JavaScript source code
 * @returns Code with comments removed
 * @internal
 */
function stripJsComments(code: string): string {
  let result = '';
  let i = 0;
  let mode: JsStripMode = 'code';
  let regexCharClass = false;
  let canStartRegex = true;
  let templateDepth = 0;

  while (i < code.length) {
    const char = code[i] as string;
    const next = code[i + 1] as string | undefined;

    if (mode === 'single' || mode === 'double') {
      result += char;
      if (char === '\\') {
        if (next) {
          result += next;
          i += 2;
          continue;
        }
      } else if (char === (mode === 'single' ? "'" : '"')) {
        mode = 'code';
        canStartRegex = false;
      }
      i += 1;
      continue;
    }

    if (mode === 'template') {
      if (char === '\\') {
        result += char;
        if (next) {
          result += next;
          i += 2;
          continue;
        }
      }

      if (char === '`') {
        result += char;
        mode = 'code';
        canStartRegex = false;
        i += 1;
        continue;
      }

      if (char === '$' && next === '{') {
        result += '${';
        i += 2;
        mode = 'code';
        templateDepth += 1;
        canStartRegex = true;
        continue;
      }

      result += char;
      i += 1;
      continue;
    }

    if (mode === 'regex') {
      result += char;
      if (char === '\\') {
        if (next) {
          result += next;
          i += 2;
          continue;
        }
      } else if (char === '[') {
        regexCharClass = true;
      } else if (char === ']' && regexCharClass) {
        regexCharClass = false;
      } else if (char === '/' && !regexCharClass) {
        i += 1;
        while (i < code.length && /[a-z]/i.test(code[i] as string)) {
          result += code[i] as string;
          i += 1;
        }
        mode = 'code';
        canStartRegex = false;
        continue;
      }
      i += 1;
      continue;
    }

    if (char === "'" || char === '"') {
      mode = char === "'" ? 'single' : 'double';
      result += char;
      i += 1;
      continue;
    }

    if (char === '`') {
      mode = 'template';
      result += char;
      i += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      i += 2;
      while (i < code.length && (code[i] as string) !== '\n') {
        i += 1;
      }
      if (i < code.length) {
        result += '\n';
        i += 1;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      i += 2;
      let hadNewline = false;
      while (i < code.length && !((code[i] as string) === '*' && code[i + 1] === '/')) {
        if ((code[i] as string) === '\n') {
          hadNewline = true;
        }
        i += 1;
      }
      if (i < code.length) {
        i += 2;
      }
      if (hadNewline) {
        result += '\n';
      } else {
        const prev = result[result.length - 1];
        const nextNonWs = findNextNonWhitespace(code, i);
        if (prev && nextNonWs && !isWhitespace(prev) && !isWhitespace(nextNonWs)) {
          result += ' ';
        }
      }
      continue;
    }

    if (char === '/' && canStartRegex) {
      mode = 'regex';
      regexCharClass = false;
      result += char;
      i += 1;
      continue;
    }

    if (templateDepth > 0) {
      if (char === '{') {
        templateDepth += 1;
      } else if (char === '}') {
        templateDepth -= 1;
        result += char;
        i += 1;
        if (templateDepth === 0) {
          mode = 'template';
        }
        continue;
      }
    }

    if (isIdentifierStart(char)) {
      const start = i;
      i += 1;
      while (i < code.length && isIdentifierPart(code[i] as string)) {
        i += 1;
      }
      const word = code.slice(start, i);
      result += word;
      canStartRegex = REGEX_KEYWORDS.has(word);
      continue;
    }

    if (/[0-9]/.test(char)) {
      const start = i;
      i += 1;
      while (i < code.length && /[0-9a-zA-Z_.]/.test(code[i] as string)) {
        i += 1;
      }
      result += code.slice(start, i);
      canStartRegex = false;
      continue;
    }

    if ((char === '+' && next === '+') || (char === '-' && next === '-')) {
      result += char + next;
      i += 2;
      canStartRegex = false;
      continue;
    }

    result += char;

    if (!isWhitespace(char)) {
      if (char === ')' || char === ']' || char === '}' || char === '.') {
        canStartRegex = false;
      } else {
        canStartRegex = true;
      }
    }

    i += 1;
  }

  return result;
}

/**
 * Removes empty ESM init wrapper calls and their declarations.
 *
 * Targets patterns like:
 * ```
 * const init_xxx = __esmMin(() => {})
 * init_xxx()
 * ```
 *
 * Note: This function duplicates runtime repo helper to avoid parent-relative
 * imports in build-time code.
 *
 * @param code - JavaScript source code
 * @returns Code with empty ESM init wrappers removed
 * @internal
 */
function stripEmptyEsmMinInitWrappers(code: string): string {
  const removedNames = new Set<string>();

  const declRe =
    /\b(?:var|let|const)\s+(init_[a-zA-Z0-9_$]+)\s*=\s*__esmMin\(\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)\s*\)\s*\)\s*;?/g;

  let result = code.replace(declRe, (_match, name: string) => {
    removedNames.add(name);
    return '';
  });

  if (removedNames.size === 0) {
    return result;
  }

  for (const name of removedNames) {
    const callRe = new RegExp(`\\b${escapeRegExp(name)}\\(\\)\\s*;?\\s*\\n?`, 'g');
    result = result.replace(callRe, '');
  }

  return result;
}

/**
 * Removes logger method calls from code with proper expression/statement context handling.
 *
 * Replaces logger calls with either `void 0` (for expression context) or `;`
 * (for statement context) to preserve code correctness while minimizing bundle size.
 *
 * Handles optional chaining (logger?.method) and various preceding contexts
 * (arrow function bodies, return statements, operators, etc.).
 *
 * @param code - JavaScript source code
 * @param methods - Array of logger method names to remove (e.g., ['debug', 'info'])
 * @returns Code with logger calls removed
 * @internal
 */
function removeLogCalls(code: string, methods: string[]): string {
  const methodPattern = methods.join('|');
  const regex = new RegExp(
    `logger(?:\\$\\d+)?\\?\\.(?:${methodPattern})\\(|logger(?:\\$\\d+)?\\.(?:${methodPattern})\\(`,
    'g'
  );

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    const startIndex = match.index;
    const openParenIndex = startIndex + match[0].length - 1;

    const sliceBefore = code.slice(Math.max(0, startIndex - 48), startIndex);
    const prevNonWsIndex = (() => {
      for (let j = startIndex - 1; j >= 0; j--) {
        const c = code[j];
        if (c !== ' ' && c !== '\n' && c !== '\r' && c !== '\t') {
          return j;
        }
      }
      return -1;
    })();
    const prevNonWsChar = prevNonWsIndex >= 0 ? (code[prevNonWsIndex] as string) : '';

    // Heuristic: decide whether the logger call appears in an expression position.
    // - Expression positions must stay expression-safe (use `void 0`).
    // - Statement positions can be replaced with an empty statement (`;`) to avoid
    //   bloating the bundle with `void 0;` noise.
    const isArrowExpressionBody = /=>\s*$/.test(sliceBefore);
    const isKeywordExpression = /\b(?:return|throw|yield|await)\s*$/.test(sliceBefore);
    const prevCharForcesExpression =
      prevNonWsChar !== '' &&
      [
        '=',
        '(',
        '[',
        ',',
        '?',
        '+',
        '-',
        '*',
        '/',
        '%',
        '!',
        '~',
        '&',
        '|',
        '^',
        '<',
        '>',
      ].includes(prevNonWsChar);
    const prevCharAllowsStatement =
      prevNonWsIndex === -1 || [';', '{', '}', ')', ':'].includes(prevNonWsChar);

    const shouldUseVoidExpression =
      isArrowExpressionBody ||
      isKeywordExpression ||
      prevCharForcesExpression ||
      !prevCharAllowsStatement;

    let depth = 1;
    let i = openParenIndex + 1;
    let inString = false;
    let stringChar = '';
    let inTemplate = false;
    let templateDepth = 0;

    while (i < code.length && depth > 0) {
      const char = code[i];
      const prevChar = code[i - 1];

      if (!inString && !inTemplate && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
        if (char === '`') {
          inTemplate = true;
          inString = false;
        }
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
      } else if (inTemplate) {
        if (char === '`' && prevChar !== '\\') {
          inTemplate = false;
        } else if (char === '$' && code[i + 1] === '{') {
          templateDepth++;
          i++;
        } else if (char === '}' && templateDepth > 0) {
          templateDepth--;
        }
      } else if (!inString && !inTemplate) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
      }

      i++;
    }

    if (depth === 0) {
      // Preserve code before the logger call
      result += code.slice(lastIndex, startIndex);

      if (shouldUseVoidExpression) {
        // Expression-safe replacement.
        result += 'void 0';
      } else {
        // Statement-safe replacement.
        result += ';';
      }

      // Consume trailing semicolons and whitespace.
      // - For statement replacement we always emit exactly one `;`.
      // - For expression replacement we preserve the original `;` if present.
      let endIndex = i;
      const hadSemicolon = code[endIndex] === ';';
      if (hadSemicolon) {
        if (shouldUseVoidExpression) {
          result += ';';
        }
        endIndex++;
      }
      while (
        code[endIndex] === '\n' ||
        code[endIndex] === '\r' ||
        code[endIndex] === '\t' ||
        code[endIndex] === ' '
      ) {
        result += code[endIndex];
        endIndex++;
      }

      lastIndex = endIndex;
      regex.lastIndex = endIndex;
    }
  }

  result += code.slice(lastIndex);
  return result;
}

/**
 * Splits userscript source into metadata header and executable body.
 *
 * Preserves the userscript metadata block (lines starting with //) as-is,
 * required by Tampermonkey/Greasemonkey runtime.
 *
 * @param source - Full userscript source code
 * @returns Object with header (metadata) and body (executable code)
 * @internal
 */
function splitLeadingUserscriptHeader(source: string): { header: string; body: string } {
  // Preserve the userscript metadata header as-is.
  // Tampermonkey/Greasemonkey require the `// ==UserScript==` block to stay line-based.
  if (!source.startsWith('// ==UserScript==')) {
    return { header: '', body: source };
  }

  const lines = source.split('\n');
  const headerLines: string[] = [];
  let inBlockComment = false;
  let i = 0;

  for (; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const trimmed = line.trimStart();

    if (inBlockComment) {
      headerLines.push(line);
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
      headerLines.push(line);
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('//') || trimmed === '') {
      headerLines.push(line);
      continue;
    }

    break;
  }

  return {
    header: headerLines.join('\n'),
    body: lines.slice(i).join('\n'),
  };
}

/**
 * Creates a Vite plugin for production-mode bundle cleanup.
 *
 * Strips development artifacts from the final userscript bundle after main build:
 * - Module metadata and pure annotations
 * - Logger calls (debug, info, warn, trace)
 * - Singleton reset methods and test helpers
 * - Internal JSDoc comments
 * - All comments and unnecessary whitespace
 *
 * Preserves userscript metadata header and validates output remains parsable.
 *
 * @returns Vite plugin instance for production cleanup
 */
export function productionCleanupPlugin(): Plugin {
  return {
    name: 'production-cleanup',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle): void {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;

        const split = splitLeadingUserscriptHeader(chunk.code);
        const header = split.header;
        let code = split.body;

        assertParsableJs('start', code);

        code = code.replace(
          /const\s+\w+\s*=\s*(?:\/\*#__PURE__\*\/\s*)?Object\.freeze\(\s*(?:\/\*#__PURE__\*\/\s*)?Object\.defineProperty\(\s*\{\s*__proto__\s*:\s*null\s*\}\s*,\s*Symbol\.toStringTag\s*,\s*\{\s*value\s*:\s*['"]Module['"]\s*\}\s*\)\s*\)\s*;?\n?/g,
          ''
        );
        assertParsableJs('strip-module-tag', code);
        code = code.replace(/\/\*#__PURE__\*\/\s*/g, '');
        assertParsableJs('strip-pure-annotations', code);
        code = code.replace(/Object\.freeze\(\s*\{\s*__proto__\s*:\s*null\s*\}\s*\)/g, '({})');
        assertParsableJs('simplify-freeze-empty-object', code);
        code = removeLogCalls(code, ['debug', 'info', 'warn', 'trace']);
        assertParsableJs('remove-log-calls', code);
        code = code.replace(/,\s*reset\(\)\s*\{\s*instance\s*=\s*null;\s*\}/g, '');
        assertParsableJs('strip-singleton-reset', code);
        code = code.replace(/static\s+resetForTests\(\)\s*\{[^}]*\}/g, '');
        assertParsableJs('strip-reset-for-tests', code);
        code = code.replace(/exports\.[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^;]+;/g, '');
        assertParsableJs('strip-exports-assignments', code);
        code = code.replace(
          /Object\.defineProperty\(exports,['"]__esModule['"],\{value:true\}\);?/g,
          ''
        );
        assertParsableJs('strip-esmodule-defineproperty', code);
        code = code.replace(/\s*\/\*\*\s*@internal[^*]*\*\/\s*/g, '\n');
        assertParsableJs('strip-internal-singleline-jsdoc', code);
        code = code.replace(/\s*\/\*\*\s*\n\s*\*[^@]*@internal\s*\n\s*\*\/\s*/g, '\n');
        assertParsableJs('strip-internal-multiline-jsdoc', code);

        // JSDoc pruning via regex is intentionally avoided.
        // It can accidentally match patterns inside strings/template literals and corrupt output.
        // We instead rely on the JS-aware comment stripper below.

        code = stripEmptyEsmMinInitWrappers(code);
        assertParsableJs('strip-empty-esmmin', code);
        code = stripJsComments(code);
        assertParsableJs('strip-js-comments', code);

        // Whitespace-only compaction (no identifier mangling).
        // Keep the header intact by running this only on the body.
        code = code.replace(/^[ \t]+/gm, '');
        code = code.replace(/[ \t]+$/gm, '');
        code = code.replace(/\n{2,}/g, '\n');

        assertParsableJs('compact-whitespace', code);

        chunk.code = header ? `${header}\n${code}` : code;

        assertParsableJs('final', chunk.code);
        assertParsableJsFinal(chunk.code);
      }
    },
  };
}
