/**
 * @fileoverview Phase 52 - Toolbar/Settings 디자인 토큰 정합성 테스트
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readProjectFile(relativePath: string): string {
  const absolutePath = resolve(__dirname, '..', '..', relativePath);
  return readFileSync(absolutePath, 'utf-8');
}

function getTokenValue(tokens: string, tokenName: string): string {
  const escapedName = tokenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedName}\\s*:\\s*([^;]+);`);
  const match = tokens.match(regex);
  expect(
    match,
    `토큰 ${tokenName}을(를) design-tokens.semantic.css에서 찾을 수 있어야 합니다.`
  ).not.toBeNull();
  return match![1].trim();
}

describe('Phase 52: Toolbar/Settings 디자인 정합성', () => {
  const semanticTokens = readProjectFile('src/shared/styles/design-tokens.semantic.css');
  const settingsCss = readProjectFile(
    'src/shared/components/ui/Settings/SettingsControls.module.css'
  );

  it('settings select 토큰이 툴바 팔레트를 참조해야 함', () => {
    expect(getTokenValue(semanticTokens, '--xeg-settings-select-bg')).toContain('--xeg-bg-toolbar');
    expect(getTokenValue(semanticTokens, '--xeg-settings-select-border')).toContain(
      '--xeg-color-border-primary'
    );
    expect(getTokenValue(semanticTokens, '--xeg-settings-select-border-hover')).toContain(
      '--xeg-color-border-hover'
    );
    expect(getTokenValue(semanticTokens, '--xeg-settings-select-focus-ring')).toContain(
      '--xeg-focus-ring-color'
    );
  });

  it('settings select 포커스 스타일이 공통 포커스 링을 사용해야 함', () => {
    expect(settingsCss).toMatch(/select[^}]*:focus[^}]*outline:\s*var\(--xeg-focus-ring\)/);
    expect(settingsCss).toMatch(
      /select[^}]*:focus[^}]*outline-offset:\s*var\(--xeg-focus-ring-offset\)/
    );
    expect(settingsCss).not.toMatch(/outline:\s*none/);
  });

  it('settings select hover/포커스 상태가 버튼 hover 토큰을 사용해야 함', () => {
    expect(settingsCss).toMatch(
      /select[^}]*:hover[^}]*border-color:\s*var\(--xeg-color-border-hover\)/
    );
    expect(settingsCss).toMatch(
      /select[^}]*:focus[^}]*border-color:\s*var\(--xeg-color-border-hover\)/
    );
  });
});
