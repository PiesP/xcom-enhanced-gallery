/**
 * @fileoverview Phase 33 Step 2B - 핵심 UI 컴포넌트 번들 크기 가드
 *
 * RED 단계: 주요 컴포넌트 3종(`Toolbar`, `VerticalImageItem`, `SettingsModal`)
 * 의 소스 크기/라인 수를 목표 범위로 축소하기 위한 번들 크기 가드 테스트
 */

import { describe, it, expect } from 'vitest';
import { statSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const resolveSrc = (relativePath: string): string =>
  resolve(__dirname, '../../../src', relativePath);

const toKB = (bytes: number): number => bytes / 1024;

const logMetrics = (label: string, value: number, unit: string, target: number): void => {
  console.log(`[metrics] ${label}: ${value.toFixed(2)} ${unit} (target: ${target} ${unit})`);
};

describe('[Phase 33-2B] Component Bundle Size Guard', () => {
  it('Toolbar.tsx 크기가 13 KB 이하여야 함', () => {
    const toolbarPath = resolveSrc('shared/components/ui/Toolbar/Toolbar.tsx');
    const { size } = statSync(toolbarPath);
    const sizeKB = toKB(size);

    logMetrics('Toolbar.tsx size', sizeKB, 'KB', 13);
    expect(sizeKB).toBeLessThanOrEqual(13);
  });

  it('Toolbar.tsx 라인 수가 430줄 이하여야 함', () => {
    const toolbarContent = readFileSync(
      resolveSrc('shared/components/ui/Toolbar/Toolbar.tsx'),
      'utf-8'
    );
    const toolbarLines = toolbarContent.split('\n').length;

    logMetrics('Toolbar.tsx lines', toolbarLines, 'lines', 430);
    expect(toolbarLines).toBeLessThanOrEqual(430);
  });

  it('VerticalImageItem.tsx 크기가 12 KB 이하여야 함', () => {
    const verticalItemPath = resolveSrc(
      'features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'
    );
    const sizeKB = toKB(statSync(verticalItemPath).size);

    logMetrics('VerticalImageItem.tsx size', sizeKB, 'KB', 12);
    expect(sizeKB).toBeLessThanOrEqual(12);
  });

  it('VerticalImageItem.tsx 라인 수가 460줄 이하여야 함', () => {
    const content = readFileSync(
      resolveSrc('features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'),
      'utf-8'
    );
    const lineCount = content.split('\n').length;

    logMetrics('VerticalImageItem.tsx lines', lineCount, 'lines', 460);
    expect(lineCount).toBeLessThanOrEqual(460);
  });

  it('SettingsModal.tsx 크기가 11.5 KB 이하여야 함', () => {
    const modalPath = resolveSrc('shared/components/ui/SettingsModal/SettingsModal.tsx');
    const sizeKB = toKB(statSync(modalPath).size);

    logMetrics('SettingsModal.tsx size', sizeKB, 'KB', 11.5);
    expect(sizeKB).toBeLessThanOrEqual(11.5);
  });

  it('SettingsModal.tsx 라인 수가 400줄 이하여야 함', () => {
    const content = readFileSync(
      resolveSrc('shared/components/ui/SettingsModal/SettingsModal.tsx'),
      'utf-8'
    );
    const lineCount = content.split('\n').length;

    logMetrics('SettingsModal.tsx lines', lineCount, 'lines', 400);
    expect(lineCount).toBeLessThanOrEqual(400);
  });
});
