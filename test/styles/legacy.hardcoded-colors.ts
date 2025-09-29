/**
 * @fileoverview 하드코딩된 색상 검증 테스트 (TDD Red Phase)
 * @description CSS 파일에서 하드코딩된 색상 값을 검출하여 토큰 사용을 강제
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';

describe('하드코딩 색상 검증 (TDD Phase)', () => {
  it('isolated-gallery.css에서 하드코딩된 배경색이 없어야 함', () => {
    const file = 'src/shared/styles/isolated-gallery.css';
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf8');

    // 하드코딩된 rgba 배경 검증
    expect(content).not.toMatch(/background:\s*rgba\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*!important/);

    // 테마 토큰 사용 확인
    expect(content).toMatch(/var\(--xeg-gallery-bg\)/);
  });

  it('VerticalGalleryView에서 테마 토큰을 사용해야 함', () => {
    const file =
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css';
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf8');

    // 테마 토큰 사용 확인
    expect(content).toMatch(/var\(--xeg-gallery-bg\)/);
    expect(content).not.toMatch(/var\(--xeg-color-overlay-strong\)/);
  });

  it('SettingsModal에서 테마별 모달 토큰을 사용해야 함', () => {
    const file = 'src/shared/components/ui/SettingsModal/SettingsModal.module.css';
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf8');

    // 새로운 모달 토큰 사용 확인
    expect(content).toMatch(/var\(--xeg-modal-bg\)/);
    expect(content).toMatch(/var\(--xeg-modal-border\)/);

    // 구 토큰 사용하지 않음 확인
    expect(content).not.toMatch(/var\(--xeg-comp-modal-bg\)/);
    expect(content).not.toMatch(/var\(--xeg-comp-modal-border\)/);
  });

  it('design-tokens.semantic.css에 테마별 토큰이 정의되어야 함', () => {
    const file = 'src/shared/styles/design-tokens.semantic.css';
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf8');

    // 갤러리 테마 토큰 정의 확인
    expect(content).toMatch(/--xeg-gallery-bg-light:/);
    expect(content).toMatch(/--xeg-gallery-bg-dark:/);
    expect(content).toMatch(/--xeg-gallery-bg:/);

    // 모달 테마 토큰 정의 확인
    expect(content).toMatch(/--xeg-modal-bg-light:/);
    expect(content).toMatch(/--xeg-modal-bg-dark:/);
    expect(content).toMatch(/--xeg-modal-bg:/);

    // 테마별 오버라이드 확인
    expect(content).toMatch(/\[data-theme='light'\]/);
    expect(content).toMatch(/\[data-theme='dark'\]/);
  });
});
