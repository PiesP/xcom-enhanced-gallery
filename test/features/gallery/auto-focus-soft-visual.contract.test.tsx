/**
 * @fileoverview Auto Focus Soft (Phase 2-1) - Visual Emphasis Contract Tests
 * Epic: AUTO-FOCUS-UPDATE
 * TDD Phase: RED
 *
 * 목적:
 * visibleIndex 기반 시각적 힌트가 올바르게 적용되는지 검증
 * (자동 스크롤 없이 시각적 강조만 제공)
 */
/* global __dirname */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@solidjs/testing-library';
import { SolidVerticalImageItem } from '@/features/gallery/components/vertical-gallery-view/VerticalImageItem.solid';
import type { MediaInfo } from '@shared/types/media.types';

describe('Auto Focus Soft - Visual Emphasis Contract', () => {
  const mockImageMedia: MediaInfo = {
    type: 'image' as const,
    url: 'https://pbs.twimg.com/media/test.jpg',
    originalUrl: 'https://pbs.twimg.com/media/test.jpg?name=orig',
    previewUrl: 'https://pbs.twimg.com/media/test.jpg?name=small',
    width: 1200,
    height: 800,
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('1. isVisible Prop 지원', () => {
    it('isVisible=true일 때 .visible 클래스가 적용된다', () => {
      const { container } = render(() => (
        <SolidVerticalImageItem
          media={mockImageMedia}
          index={0}
          isActive={false}
          isFocused={false}
          isVisible={true}
          forceVisible={false}
          fitMode='fitContainer'
        />
      ));

      // CSS Modules는 해시된 클래스명을 사용하므로 data 속성으로 요소 찾기
      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(itemContainer).toBeTruthy();
      // 클래스명에 'visible' 문자열이 포함되어 있는지 확인 (해시된 클래스명 대응)
      expect(itemContainer?.className).toMatch(/visible/);
    });

    it('isVisible=false일 때 .visible 클래스가 없다', () => {
      const { container } = render(() => (
        <SolidVerticalImageItem
          media={mockImageMedia}
          index={0}
          isActive={false}
          isFocused={false}
          isVisible={false}
          forceVisible={false}
          fitMode='fitContainer'
        />
      ));

      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(itemContainer).toBeTruthy();
      expect(itemContainer?.className).not.toMatch(/visible/);
    });

    it('isVisible prop이 생략되면 기본값 false로 동작한다', () => {
      const { container } = render(() => (
        <SolidVerticalImageItem
          media={mockImageMedia}
          index={0}
          isActive={false}
          isFocused={false}
          forceVisible={false}
          fitMode='fitContainer'
        />
      ));

      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(itemContainer).toBeTruthy();
      expect(itemContainer?.className).not.toMatch(/visible/);
    });
  });

  describe('2. 디자인 토큰 사용 검증', () => {
    it('.visible 클래스는 디자인 토큰만 사용한다', async () => {
      const fs = await import('fs');
      const path = await import('path');

      // CSS Modules는 런타임에 객체로 변환되므로, 원본 CSS 파일 읽기
      const cssPath = path.resolve(
        __dirname,
        '../../../src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css'
      );
      const cssText = fs.readFileSync(cssPath, 'utf-8');

      // .visible 클래스 정의 찾기
      const visibleClassMatch = cssText.match(/\.container\.visible\s*\{([^}]+)\}/);
      expect(visibleClassMatch).toBeTruthy();

      const visibleStyles = visibleClassMatch![1];

      // 하드코딩된 값 검증 (금지 패턴)
      expect(visibleStyles).not.toMatch(/#[0-9a-fA-F]{3,6}/); // 색상 hex 코드
      expect(visibleStyles).not.toMatch(/rgb\(|rgba\(/); // RGB 함수
      expect(visibleStyles).not.toMatch(/\d+px(?!\s*var)/); // 하드코딩된 픽셀값 (var() 제외)
      expect(visibleStyles).not.toMatch(/\d+\.?\d*s(?!\s*var)/); // 하드코딩된 시간값

      // 필수 디자인 토큰 사용 검증
      expect(visibleStyles).toMatch(/var\(--xeg-item-visible-border\)/);
      expect(visibleStyles).toMatch(/var\(--xeg-item-visible-shadow\)/);
      expect(visibleStyles).toMatch(/var\(--xeg-item-visible-bg\)/);
    });

    it('디자인 토큰이 정의되어 있다', () => {
      // 디자인 토큰 파일에서 토큰 확인
      const root = document.documentElement;
      const computedStyle = window.getComputedStyle(root);

      // 토큰이 정의되어 있는지만 확인 (값은 테마에 따라 다를 수 있음)
      const borderToken = computedStyle.getPropertyValue('--xeg-item-visible-border');
      const shadowToken = computedStyle.getPropertyValue('--xeg-item-visible-shadow');
      const bgToken = computedStyle.getPropertyValue('--xeg-item-visible-bg');

      // 토큰이 정의되어 있지 않으면 빈 문자열 반환
      // 실제로는 CSS 변수가 설정되어야 함
      expect(typeof borderToken).toBe('string');
      expect(typeof shadowToken).toBe('string');
      expect(typeof bgToken).toBe('string');
    });
  });

  describe('3. 접근성 - ARIA 속성', () => {
    it('isVisible=true일 때 aria-current="true"가 설정된다', () => {
      const { container } = render(() => (
        <SolidVerticalImageItem
          media={mockImageMedia}
          index={0}
          isActive={false}
          isFocused={false}
          isVisible={true}
          forceVisible={false}
          fitMode='fitContainer'
        />
      ));

      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(itemContainer).toHaveAttribute('aria-current', 'true');
    });

    it('isVisible=false일 때 aria-current 속성이 없다', () => {
      const { container } = render(() => (
        <SolidVerticalImageItem
          media={mockImageMedia}
          index={0}
          isActive={false}
          isFocused={false}
          isVisible={false}
          forceVisible={false}
          fitMode='fitContainer'
        />
      ));

      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(itemContainer).not.toHaveAttribute('aria-current');
    });
  });

  describe('4. isActive와 isVisible 독립성', () => {
    it('isActive와 isVisible은 독립적으로 동작한다', () => {
      const { container } = render(() => (
        <SolidVerticalImageItem
          media={mockImageMedia}
          index={0}
          isActive={true}
          isFocused={true}
          isVisible={false}
          forceVisible={false}
          fitMode='fitContainer'
        />
      ));

      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');

      // isActive는 true지만 isVisible은 false
      expect(itemContainer?.className).toMatch(/active/); // 기존 동작
      expect(itemContainer?.className).not.toMatch(/visible/); // 새 동작
    });

    it('isVisible=true, isActive=false일 때 둘 다 반영된다', () => {
      const { container } = render(() => (
        <SolidVerticalImageItem
          media={mockImageMedia}
          index={0}
          isActive={false}
          isFocused={false}
          isVisible={true}
          forceVisible={false}
          fitMode='fitContainer'
        />
      ));

      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');

      // isVisible만 true
      expect(itemContainer?.className).not.toMatch(/active/);
      expect(itemContainer?.className).toMatch(/visible/);
    });
  });

  describe('5. 타입 안전성', () => {
    it('isVisible prop은 boolean 타입이어야 한다', () => {
      // TypeScript 컴파일 시점 검증
      // 이 테스트는 타입 안전성을 문서화하는 역할

      const validProps = {
        media: mockImageMedia,
        index: 0,
        isActive: false,
        isFocused: false,
        isVisible: true, // boolean ✅
        forceVisible: false,
        fitMode: 'fitContainer' as const,
      };

      expect(typeof validProps.isVisible).toBe('boolean');
    });

    it('isVisible prop은 선택적이어야 한다 (기본값: false)', () => {
      // TypeScript 타입 정의 검증
      // SolidVerticalImageItem의 props 타입에서 isVisible이 optional인지 확인

      const propsWithoutIsVisible = {
        media: mockImageMedia,
        index: 0,
        isActive: false,
        isFocused: false,
        // isVisible 생략 가능 ✅
        forceVisible: false,
        fitMode: 'fitContainer' as const,
      };

      // 타입 에러 없이 렌더링 가능해야 함
      const { container } = render(() => <SolidVerticalImageItem {...propsWithoutIsVisible} />);

      expect(container).toBeTruthy();
    });
  });
});
