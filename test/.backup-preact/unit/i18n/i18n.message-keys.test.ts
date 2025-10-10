import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LanguageService } from '../../../src/shared/services/LanguageService';

// 사용자-facing 한국어 literal (Phase 4 이전 코드에 존재) – 모두 키로 대체되어야 함
const PROHIBITED_LITERALS = [
  '다운로드 실패',
  '모든 항목을 다운로드하지 못했습니다.',
  '일부 실패',
  '재시도',
  '재시도 성공',
  '실패했던 항목을 모두 받았습니다.',
  '다운로드 취소됨',
  '요청한 다운로드가 취소되었습니다.',
];

// Phase 4에서 도입된 메시지 키 목록
const REQUIRED_MESSAGE_KEYS = [
  'messages.download.single.error.title',
  'messages.download.single.error.body',
  'messages.download.allFailed.title',
  'messages.download.allFailed.body',
  'messages.download.partial.title',
  'messages.download.partial.body', // {count}
  'messages.download.retry.action',
  'messages.download.retry.success.title',
  'messages.download.retry.success.body',
  'messages.download.cancelled.title',
  'messages.download.cancelled.body',
];

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) collectSourceFiles(full, acc);
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe('i18n.message-keys (Phase 4 완료 GREEN)', () => {
  it('한국어 사용자 노출 literal이 소스 코드(언어 리소스 제외)에 남아 있지 않다', () => {
    const testDir = dirname(fileURLToPath(import.meta.url));
    const srcRoot = join(testDir, '..', '..', '..', 'src');
    const languageFile = join(srcRoot, 'shared', 'services', 'LanguageService.ts');
    const files = collectSourceFiles(srcRoot).filter(f => f !== languageFile);

    const offenders: Array<{ file: string; literal: string }> = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const lit of PROHIBITED_LITERALS) {
        if (content.includes(lit)) {
          offenders.push({ file, literal: lit });
        }
      }
    }

    expect(
      offenders,
      `남은 literal: ${offenders.map(o => `${o.literal} @ ${o.file}`).join('\n')}`
    ).toHaveLength(0);
  });

  it('필수 메시지 키가 모두 정의되어 있다', () => {
    const service = new LanguageService();
    const missing: string[] = [];
    for (const key of REQUIRED_MESSAGE_KEYS) {
      const value = service.getString(key);
      if (value === key) missing.push(key);
    }
    expect(missing, `누락된 메시지 키: ${missing.join(', ')}`).toHaveLength(0);
  });
});
