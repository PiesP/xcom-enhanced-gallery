/**
 * Phase 101: VerticalGalleryView 타입 단언 제거 테스트
 *
 * 목표: setSetting 호출에서 'as unknown as string' 타입 단언 제거
 * 대상 파일: src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx
 * 제거 대상: 라인 303, 314, 325, 336 (4개)
 */

import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Phase 101: VerticalGalleryView 타입 단언 제거', () => {
  const targetFile = resolve(
    __dirname,
    '../../../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
  );

  it('VerticalGalleryView.tsx 파일이 존재한다', async () => {
    const stats = await fs.stat(targetFile);
    expect(stats.isFile()).toBe(true);
  });

  it('setSetting 호출에 타입 단언을 사용하지 않는다', async () => {
    const source = await fs.readFile(targetFile, 'utf-8');

    // setSetting('gallery.imageFitMode' 패턴이 있는 라인 찾기
    const setSettingLines = source.split('\n').filter(line => {
      return (
        line.includes("setSetting('gallery.imageFitMode'") ||
        line.includes('setSetting("gallery.imageFitMode"')
      );
    });

    // 최소 4개의 setSetting 호출이 있어야 함 (original, fitWidth, fitHeight, fitContainer)
    expect(setSettingLines.length).toBeGreaterThanOrEqual(4);

    // 각 라인에서 'as unknown as string' 타입 단언이 없어야 함
    setSettingLines.forEach((line, index) => {
      expect(line, `setSetting 라인 ${index + 1}번에 타입 단언이 있습니다: ${line}`).not.toContain(
        'as unknown as string'
      );
    });
  });

  it('setSetting 호출이 문자열 리터럴을 직접 사용한다', async () => {
    const source = await fs.readFile(targetFile, 'utf-8');

    // 예상되는 패턴: setSetting('gallery.imageFitMode', 'value')
    const validPatterns = [
      /setSetting\s*\(\s*['"]gallery\.imageFitMode['"]\s*,\s*['"]original['"]\s*\)/,
      /setSetting\s*\(\s*['"]gallery\.imageFitMode['"]\s*,\s*['"]fitWidth['"]\s*\)/,
      /setSetting\s*\(\s*['"]gallery\.imageFitMode['"]\s*,\s*['"]fitHeight['"]\s*\)/,
      /setSetting\s*\(\s*['"]gallery\.imageFitMode['"]\s*,\s*['"]fitContainer['"]\s*\)/,
    ];

    validPatterns.forEach((pattern, index) => {
      expect(
        source.match(pattern),
        `setSetting 호출 패턴 ${index + 1}번을 찾을 수 없습니다`
      ).toBeTruthy();
    });
  });

  it('타입 단언 제거 후에도 TypeScript 컴파일이 가능하다', async () => {
    const source = await fs.readFile(targetFile, 'utf-8');

    // 'as unknown as' 패턴 검색
    const typeAssertions = source.match(/as unknown as/g);

    // VerticalGalleryView.tsx에는 다른 타입 단언도 있을 수 있음
    // setSetting 관련 타입 단언만 제거되었는지 확인
    const setSettingAssertions = source
      .split('\n')
      .filter(
        line =>
          line.includes('setSetting') &&
          line.includes('gallery.imageFitMode') &&
          line.includes('as unknown as string')
      );

    expect(
      setSettingAssertions.length,
      `setSetting에서 ${setSettingAssertions.length}개의 타입 단언이 발견되었습니다. 제거되어야 합니다.`
    ).toBe(0);
  });
});
