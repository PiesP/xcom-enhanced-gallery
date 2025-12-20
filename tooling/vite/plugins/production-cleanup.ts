import type { Plugin } from 'vite';

function escapeRegExp(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Removes empty `__esmMin(() => {})` init wrappers and their calls.
 *
 * Note: This duplicates the runtime repo helper to avoid parent-relative imports
 * in build-time code.
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

export function productionCleanupPlugin(): Plugin {
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

  return {
    name: 'production-cleanup',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;

        const split = splitLeadingUserscriptHeader(chunk.code);
        const header = split.header;
        let code = split.body;

        code = code.replace(
          /const\s+\w+\s*=\s*(?:\/\*#__PURE__\*\/\s*)?Object\.freeze\(\s*(?:\/\*#__PURE__\*\/\s*)?Object\.defineProperty\(\s*\{\s*__proto__\s*:\s*null\s*\}\s*,\s*Symbol\.toStringTag\s*,\s*\{\s*value\s*:\s*['"]Module['"]\s*\}\s*\)\s*\)\s*;?\n?/g,
          ''
        );
        code = code.replace(/\/\*#__PURE__\*\/\s*/g, '');
        code = code.replace(/Object\.freeze\(\s*\{\s*__proto__\s*:\s*null\s*\}\s*\)/g, '({})');
        code = removeLogCalls(code, ['debug', 'info', 'warn']);
        code = code.replace(/,\s*reset\(\)\s*\{\s*instance\s*=\s*null;\s*\}/g, '');
        code = code.replace(/static\s+resetForTests\(\)\s*\{[^}]*\}/g, '');
        code = code.replace(/exports\.[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^;]+;/g, '');
        code = code.replace(
          /Object\.defineProperty\(exports,['"]__esModule['"],\{value:true\}\);?/g,
          ''
        );
        code = code.replace(/\s*\/\*\*\s*@internal[^*]*\*\/\s*/g, '\n');
        code = code.replace(/\s*\/\*\*\s*\n\s*\*[^@]*@internal\s*\n\s*\*\/\s*/g, '\n');
        code = stripEmptyEsmMinInitWrappers(code);

        // Whitespace-only compaction (no identifier mangling).
        // Keep the header intact by running this only on the body.
        code = code.replace(/^[ \t]+/gm, '');
        code = code.replace(/[ \t]+$/gm, '');
        code = code.replace(/\n{2,}/g, '\n');

        chunk.code = header ? `${header}\n${code}` : code;
      }
    },
  };
}
