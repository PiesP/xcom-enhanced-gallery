import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { inspectStaticTemplate } from '../../../scripts/check/firefox-static-template.ts';
import { validateFinalFirefoxZip } from '../../../scripts/release/firefox-final-zip.ts';
import {
  assessLinterResult,
  FINAL_FIREFOX_ZIP,
  LINTER_VERSION,
  verifyFinalFirefoxHandoff,
} from '../../../scripts/release/firefox-validation-report.ts';

const source = `(function(){
function template(html, isImportNode, isSVG, isMathML) {
  const create = () => {
    const t = isMathML ? document.createElementNS('ns', 'template') : document.createElement('template');
    t.innerHTML = html;
    return t.content.firstChild;
  };
  return create;
}
const a = template('<p>');
const b = template(\`<span>\`);
})();`;
const sha = 'a'.repeat(40);
const version = '2.3.10';
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function linter(line: number, column: number) {
  return {
    summary: { errors: 0, warnings: 1, notices: 0 },
    metadata: { version },
    errors: [],
    notices: [],
    warnings: [
      {
        code: 'UNSAFE_VAR_ASSIGNMENT',
        message: 'Unsafe assignment to innerHTML',
        file: 'content.js',
        line,
        column,
      },
    ],
  };
}

describe('final Firefox ZIP static HTML disposition', () => {
  it('accepts direct static factory calls after benign relocation and factory rename', () => {
    expect(inspectStaticTemplate(source).calls).toBe(2);
    expect(
      inspectStaticTemplate(
        `\n\n${source.replaceAll('template(html', 'markup(html').replaceAll('= template(', '= markup(')}`
      ).calls
    ).toBe(2);
  });

  it.each([
    ['dynamic input', source.replace("template('<p>')", 'template(userHtml)')],
    [
      'implicit sloppy-mode parameter alias',
      source.replace('  const create =', '  arguments[0] = userHtml; const create ='),
    ],
    ['alias', source.replace('const a =', 'const alias = template; const a =')],
    ['escape', source.replace('const a =', 'consume(template); const a =')],
    [
      'escape outside an unrelated shadow block',
      source.replace(
        'const a =',
        'function f(){ {const template = 1;} consume(template); } const a ='
      ),
    ],
    [
      'escape after an unrelated loop binding',
      source.replace(
        'const a =',
        'function f(){for(const template of [1]){} consume(template);} const a ='
      ),
    ],
    ['extra sink', source.replace('const a =', "other.outerHTML = '<p>'; const a =")],
    ['computed sink', source.replace('const a =', "other['innerHTML'] = '<p>'; const a =")],
    [
      'rebound HTML parameter',
      source.replace('t.innerHTML = html;', 'html = userHtml; t.innerHTML = html;'),
    ],
    [
      'shadowed HTML parameter',
      source.replace('t.innerHTML = html;', 'const html = externalInput; t.innerHTML = html;'),
    ],
    ['creator HTML parameter', source.replace('const create = () =>', 'const create = (html) =>')],
    [
      'creator returned without a direct const binding',
      source
        .replace('const create = () => {', 'return (() => {')
        .replace('  return create;', '  });'),
    ],
    [
      'factory escape after an unrelated shadow',
      source.replace(
        'const a =',
        'function f(){const template = 1;} const alias = template; const a ='
      ),
    ],
    [
      'destructured HTML binding',
      source.replace('t.innerHTML = html;', 'const { html } = externalInput; t.innerHTML = html;'),
    ],
    [
      'compound HTML write',
      source.replace('t.innerHTML = html;', 'html ||= externalInput; t.innerHTML = html;'),
    ],
    [
      'misbound template receiver',
      source
        .replace('const t = isMathML', 'const other = externalInput; { const t = isMathML')
        .replace('t.innerHTML = html;', '} const t = other; t.innerHTML = html;'),
    ],
    [
      'extra HTML call',
      source.replace('const a =', "other.insertAdjacentHTML('beforeend', '<p>'); const a ="),
    ],
  ])('rejects %s', (_case, changed) => {
    expect(() => inspectStaticTemplate(changed)).toThrow();
  });

  it('rejects shadowed HTML and receiver bindings for the expected structural reason', () => {
    expect(() =>
      inspectStaticTemplate(
        source.replace('t.innerHTML = html;', 'const html = externalInput; t.innerHTML = html;')
      )
    ).toThrow('parameter or receiver binding was shadowed');
    expect(() =>
      inspectStaticTemplate(
        source
          .replace('const t = isMathML', 'const other = externalInput; { const t = isMathML')
          .replace('t.innerHTML = html;', '} const t = other; t.innerHTML = html;')
      )
    ).toThrow('receiver is not a template element');
  });

  it('rejects a new linter error or warning and accepts only the reviewed sink', () => {
    const sink = inspectStaticTemplate(source);
    const accepted = linter(sink.line, sink.column);
    expect(() => assessLinterResult(accepted, version, sink)).not.toThrow();
    expect(() =>
      assessLinterResult(
        {
          ...accepted,
          errors: [{ code: 'NEW_ERROR' }],
          summary: { errors: 1, warnings: 1, notices: 0 },
        },
        version,
        sink
      )
    ).toThrow('errors');
    expect(() =>
      assessLinterResult(
        {
          ...accepted,
          warnings: [...accepted.warnings, { code: 'NEW_WARNING' }],
          summary: { errors: 0, warnings: 2, notices: 0 },
        },
        version,
        sink
      )
    ).toThrow('warning');
    expect(() => assessLinterResult(linter(sink.line + 1, sink.column), version, sink)).toThrow(
      'warning'
    );
  });

  it('refuses changed ZIP bytes or an unrelated passing report at publication handoff', () => {
    const root = mkdtempSync(join(tmpdir(), 'xeg-firefox-handoff-'));
    roots.push(root);
    const zip = join(root, FINAL_FIREFOX_ZIP);
    const evidence = join(root, 'release-bundle/validation');
    mkdirSync(join(root, 'release-bundle/release'), { recursive: true });
    mkdirSync(evidence, { recursive: true });
    writeFileSync(zip, 'original ZIP bytes');
    const sink = inspectStaticTemplate(source);
    const result = linter(sink.line, sink.column);
    const report = {
      schemaVersion: 1,
      accepted: true,
      sourceSha: sha,
      extensionVersion: version,
      zip: {
        path: FINAL_FIREFOX_ZIP,
        sha256: createHash('sha256').update('original ZIP bytes').digest('hex'),
      },
      linter: {
        version: LINTER_VERSION,
        command: ['addons-linter', '--output', 'json', FINAL_FIREFOX_ZIP],
        result,
      },
      disposition: {
        code: 'UNSAFE_VAR_ASSIGNMENT',
        file: 'content.js',
        sink: 'Solid template factory: template.innerHTML = html',
        dataFlow:
          'Every direct factory HTML input is a static string or interpolation-free template literal; aliases and escapes are rejected.',
        line: sink.line,
        column: sink.column,
        directCalls: 2,
      },
    };
    writeFileSync(join(evidence, 'addons-linter.json'), JSON.stringify(result));
    writeFileSync(join(evidence, 'firefox-final-zip.json'), JSON.stringify(report));
    expect(() => verifyFinalFirefoxHandoff(root, sha, version)).not.toThrow();
    expect(() => verifyFinalFirefoxHandoff(root, 'b'.repeat(40), version)).toThrow(
      'does not match'
    );
    writeFileSync(zip, 'changed ZIP bytes');
    expect(() => verifyFinalFirefoxHandoff(root, sha, version)).toThrow('does not match');
  });

  it('refuses a ZIP modified by the linter during validation', () => {
    const root = mkdtempSync(join(tmpdir(), 'xeg-firefox-race-'));
    roots.push(root);
    const input = join(root, 'input');
    const evidence = join(root, 'evidence');
    mkdirSync(input);
    writeFileSync(join(input, 'content.js'), source);
    writeFileSync(join(input, 'manifest.json'), JSON.stringify({ version }));
    const zip = join(root, 'addon.zip');
    execFileSync('zip', ['-q', zip, 'content.js', 'manifest.json'], { cwd: input });
    const sink = inspectStaticTemplate(source);
    const fakeLinter = join(root, 'linter.cjs');
    writeFileSync(
      fakeLinter,
      `#!/usr/bin/env node\nconst fs = require('node:fs');\nif (process.argv[2] === '--version') { console.log('${LINTER_VERSION}'); process.exit(0); }\nfs.appendFileSync(process.argv[4], 'x');\nprocess.stdout.write(${JSON.stringify(JSON.stringify(linter(sink.line, sink.column)))});\n`
    );
    chmodSync(fakeLinter, 0o755);
    expect(() => validateFinalFirefoxZip(zip, sha, version, evidence, fakeLinter)).toThrow(
      'changed during validation'
    );
    expect(existsSync(join(evidence, 'addons-linter.json'))).toBe(true);
    expect(existsSync(join(evidence, 'firefox-final-zip.json'))).toBe(false);
  });
});
