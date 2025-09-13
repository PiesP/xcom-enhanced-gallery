import { describe, it, expect } from 'vitest';

// Guard: 레거시 Tabler 아이콘 경로에 대한 "사용처"가 없어야 한다.
// 물리 파일은 단계적 제거 대상일 수 있으나, import/참조가 0이어야 한다.
describe('deps: legacy icon path usage removal', () => {
  it('should not import from src/shared/components/ui/Icon/icons anywhere', async () => {
    const files = Object.entries(
      // @ts-expect-error vite import glob is available in test bundler
      import.meta.glob('/src/**/*.{ts,tsx,js,jsx}', {
        // deprecation: use query/import instead of as: 'raw'
        query: '?raw',
        import: 'default',
        eager: true,
      })
    ) as Array<[string, string]>;

    // 사용처만 검사: 물리 파일 존재는 허용(단계적 제거 과정 지원)
    const offenders = files.filter(([, content]) => {
      const text = typeof content === 'string' ? content : String(content);
      return (
        text.includes('shared/components/ui/Icon/icons/') ||
        text.includes('shared\\components\\ui\\Icon\\icons\\')
      );
    });

    expect(offenders).toHaveLength(0);
  });
});
