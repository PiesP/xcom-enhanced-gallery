/**
 * @fileoverview Epic DOM-EVENT-CLARITY Phase 1
 * @description 갤러리 이벤트 전파 체계 검증 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSolidCore, getSolidWeb } from '@shared/external/vendors';
import { SolidVerticalImageItem } from '@/features/gallery/components/vertical-gallery-view/VerticalImageItem.solid';
import type { MediaInfo } from '@shared/types/media.types';

describe('Epic DOM-EVENT-CLARITY: 이벤트 전파 체계', () => {
  let container: HTMLElement;
  let disposer: (() => void) | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (disposer) {
      disposer();
      disposer = null;
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('다운로드 버튼 이벤트 격리', () => {
    it('컨텍스트 메뉴가 아이템 선택을 트리거하지 않아야 한다', () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      let itemClickCount = 0;
      let contextMenuCallCount = 0;

      const mediaItem: MediaInfo = {
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };

      const handleItemClick = () => {
        itemClickCount++;
      };

      const handleContextMenu = () => {
        contextMenuCallCount++;
      };

      disposer = render(
        () =>
          solid.createComponent(SolidVerticalImageItem, {
            media: mediaItem,
            index: 0,
            isActive: false,
            isFocused: false,
            fitMode: 'fitContainer',
            onClick: handleItemClick,
            onImageContextMenu: handleContextMenu,
          }),
        container
      );

      // 아이템 컨테이너 찾기
      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(itemContainer).not.toBeNull();

      // 컨텍스트 메뉴 이벤트 발생
      itemContainer!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));

      // 컨텍스트 메뉴만 호출되고 아이템 클릭은 호출되지 않아야 함
      expect(contextMenuCallCount).toBe(1);
      expect(itemClickCount).toBe(0);
    });

    it('아이템 컨테이너 직접 클릭은 아이템 선택을 트리거해야 한다', () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      let itemClickCount = 0;

      const mediaItem: MediaInfo = {
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };

      const handleItemClick = () => {
        itemClickCount++;
      };

      disposer = render(
        () =>
          solid.createComponent(SolidVerticalImageItem, {
            media: mediaItem,
            index: 0,
            isActive: false,
            isFocused: false,
            fitMode: 'fitContainer',
            onClick: handleItemClick,
          }),
        container
      );

      // 아이템 컨테이너 찾기
      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(itemContainer).not.toBeNull();

      // 컨테이너 클릭
      itemContainer!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // 아이템 클릭이 호출되어야 함
      expect(itemClickCount).toBe(1);
    });
  });

  describe('data-role을 통한 이벤트 타겟 식별', () => {
    it('data-xeg-component 속성이 vertical-image-item 컨테이너에 존재해야 한다', () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      const mediaItem: MediaInfo = {
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };

      disposer = render(
        () =>
          solid.createComponent(SolidVerticalImageItem, {
            media: mediaItem,
            index: 0,
            isActive: false,
            isFocused: false,
            fitMode: 'fitContainer',
          }),
        container
      );

      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(itemContainer).not.toBeNull();
      expect(itemContainer!.getAttribute('data-xeg-component')).toBe('vertical-image-item');
    });

    it('closest 메서드로 아이템 컨테이너 여부를 확인할 수 있어야 한다', () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      const mediaItem: MediaInfo = {
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };

      disposer = render(
        () =>
          solid.createComponent(SolidVerticalImageItem, {
            media: mediaItem,
            index: 0,
            isActive: false,
            isFocused: false,
            fitMode: 'fitContainer',
          }),
        container
      );

      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(itemContainer).not.toBeNull();
      expect(itemContainer!.getAttribute('data-xeg-component')).toBe('vertical-image-item');
    });

    it('closest 메서드로 아이템 컨테이너 여부를 확인할 수 있어야 한다', () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      const mediaItem: MediaInfo = {
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };

      disposer = render(
        () =>
          solid.createComponent(SolidVerticalImageItem, {
            media: mediaItem,
            index: 0,
            isActive: false,
            isFocused: false,
            fitMode: 'fitContainer',
          }),
        container
      );

      const itemContainer = container.querySelector(
        '[data-xeg-component="vertical-image-item"]'
      ) as HTMLElement;
      expect(itemContainer).not.toBeNull();

      // closest로 아이템 컨테이너를 찾을 수 있어야 함
      const closestItem = itemContainer.closest('[data-xeg-component="vertical-image-item"]');
      expect(closestItem).toBe(itemContainer);
    });
  });

  describe('이벤트 버블링 경로', () => {
    it('컨텍스트 메뉴 이벤트가 stopPropagation으로 제어되어야 한다', () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      let containerClickCount = 0;
      let contextMenuCallCount = 0;

      const mediaItem: MediaInfo = {
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };

      const handleContextMenu = () => {
        contextMenuCallCount++;
      };

      disposer = render(
        () =>
          solid.createComponent(SolidVerticalImageItem, {
            media: mediaItem,
            index: 0,
            isActive: false,
            isFocused: false,
            fitMode: 'fitContainer',
            onClick: () => {
              containerClickCount++;
            },
            onImageContextMenu: handleContextMenu,
          }),
        container
      );

      // 아이템 컨테이너 찾기
      const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');
      expect(itemContainer).not.toBeNull();

      // 컨텍스트 메뉴 이벤트 발생
      itemContainer!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));

      // 컨텍스트 메뉴만 호출되고 컨테이너 클릭은 호출되지 않아야 함
      expect(contextMenuCallCount).toBe(1);
      expect(containerClickCount).toBe(0);
    });
  });

  describe('컨텍스트 메뉴 이벤트', () => {
    it('이미지 우클릭 시 onImageContextMenu가 호출되어야 한다', () => {
      const solid = getSolidCore();
      const { render } = getSolidWeb();

      let contextMenuCallCount = 0;
      let capturedEvent: MouseEvent | null = null;
      let capturedMedia: MediaInfo | null = null;

      const mediaItem: MediaInfo = {
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };

      const handleContextMenu = (event: MouseEvent, media: MediaInfo) => {
        contextMenuCallCount++;
        capturedEvent = event;
        capturedMedia = media;
      };

      disposer = render(
        () =>
          solid.createComponent(SolidVerticalImageItem, {
            media: mediaItem,
            index: 0,
            isActive: false,
            isFocused: false,
            fitMode: 'fitContainer',
            onImageContextMenu: handleContextMenu,
          }),
        container
      );

      // 이미지 요소 찾기 (로딩 완료 대기)
      const image = container.querySelector('img');
      expect(image).not.toBeNull();

      // 컨텍스트 메뉴 이벤트 발생
      const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true });
      image!.dispatchEvent(contextMenuEvent);

      // 핸들러가 호출되었는지 확인
      expect(contextMenuCallCount).toBe(1);
      expect(capturedEvent).not.toBeNull();
      expect(capturedMedia).toEqual(mediaItem);
    });
  });
});
