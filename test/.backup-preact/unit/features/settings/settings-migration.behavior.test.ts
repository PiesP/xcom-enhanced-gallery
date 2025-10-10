import { describe, it, expect, vi } from 'vitest';
import { migrateSettings } from '@/features/settings/services/SettingsMigration';
import { DEFAULT_SETTINGS } from '@/features/settings/types/settings.types';

function stripVolatile(s: any) {
  const { lastModified, ...rest } = s;
  return rest;
}

describe('SettingsMigration', () => {
  it('누락된 필드를 기본값으로 채우고 사용자 값은 보존한다', () => {
    const input: any = {
      version: '0.1.0',
      gallery: { enableKeyboardNav: false },
    };

    const out = migrateSettings(input as any);
    expect(out.version).toBe(DEFAULT_SETTINGS.version);
    expect(out.gallery.enableKeyboardNav).toBe(false);
    // 채워진 기본값 샘플 검증
    expect(out.download).toBeDefined();
    expect(out.tokens).toBeDefined();
  });

  it('알 수 없는 최상위/중첩 필드는 결과에 포함되지 않는다(프루닝)', () => {
    const input: any = {
      version: '0.1.0',
      gallery: { foo: 'bar' },
      unknownTop: 123,
    };

    const out = migrateSettings(input as any);
    // 타입 강화: 결과 객체는 DEFAULT_SETTINGS의 shape을 따른다
    expect(Object.keys(out).sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort());
    expect('unknownTop' in out).toBe(false);
    // gallery 하위도 정의된 키만 유지
    expect('foo' in (out.gallery as any)).toBe(false);
  });

  it('idempotent: 같은 입력에 대해 여러 번 실행해도 동일한 결과', () => {
    const input: any = { version: '0.1.0', download: { preferredFormat: 'zip' } };
    const a = stripVolatile(migrateSettings(input));
    const b = stripVolatile(migrateSettings(a as any));
    expect(b).toEqual(a);
  });
});
