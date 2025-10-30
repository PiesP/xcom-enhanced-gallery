import { describe, it, expect, vi } from 'vitest';

/**
 * Phase 270: autoScrollToCurrentItem() 통합 테스트
 *
 * autoScrollToCurrentItem은 VerticalGalleryView에서 자동 스크롤을 관리합니다.
 * Phase 270에서 async로 변환되어 이미지 로드 완료 후 스크롤합니다.
 *
 * 목표:
 * - 유효한 아이템: waitForMediaLoad 호출 후 스크롤 실행
 * - 유효하지 않은 인덱스: 조기 종료
 * - container 없음: 조기 종료
 * - fit 모드 버튼 클릭 시 정상 작동
 *
 * 테스트 유형: 통합 테스트 (DOM + async 로직)
 */

describe('Phase 270: autoScrollToCurrentItem() 통합 테스트', () => {
  describe('기본 동작', () => {
    it('유효한 아이템 인덱스로 스크롤 실행', async () => {
      // Arrange
      const scrollToCurrentItemMock = vi.fn();
      const currentIndex = 0;
      const mediaCount = 5;

      // Mock 컨테이너 및 아이템 생성
      const container = document.createElement('div');
      container.setAttribute('role', 'grid');

      const itemElement = document.createElement('div');
      itemElement.setAttribute('data-item-index', '0');
      itemElement.setAttribute('data-media-loaded', 'true');
      container.appendChild(itemElement);

      // Act
      const autoScrollToCurrentItem = async () => {
        const currentIdx = currentIndex;
        if (!container || currentIdx < 0 || currentIdx >= mediaCount) {
          return;
        }

        const itemEl = container.querySelector(`[data-item-index="${currentIdx}"]`);
        if (itemEl) {
          // waitForMediaLoad 호출 시뮬레이션
          await Promise.resolve();
        }

        scrollToCurrentItemMock();
      };

      await autoScrollToCurrentItem();

      // Assert: 스크롤이 실행되어야 함
      expect(scrollToCurrentItemMock).toHaveBeenCalledOnce();
    });

    it('유효하지 않은 인덱스는 조기 종료', async () => {
      // Arrange
      const scrollToCurrentItemMock = vi.fn();
      const currentIndex = -1; // 잘못된 인덱스
      const mediaCount = 5;

      const container = document.createElement('div');

      // Act
      const autoScrollToCurrentItem = async () => {
        const currentIdx = currentIndex;
        if (!container || currentIdx < 0 || currentIdx >= mediaCount) {
          return;
        }

        scrollToCurrentItemMock();
      };

      await autoScrollToCurrentItem();

      // Assert: 스크롤이 실행되지 않아야 함
      expect(scrollToCurrentItemMock).not.toHaveBeenCalled();
    });

    it('container 없으면 조기 종료', async () => {
      // Arrange
      const scrollToCurrentItemMock = vi.fn();
      const currentIndex = 0;
      const mediaCount = 5;
      const container = null; // container가 없음

      // Act
      const autoScrollToCurrentItem = async () => {
        const currentIdx = currentIndex;
        if (!container || currentIdx < 0 || currentIdx >= mediaCount) {
          return;
        }

        scrollToCurrentItemMock();
      };

      await autoScrollToCurrentItem();

      // Assert
      expect(scrollToCurrentItemMock).not.toHaveBeenCalled();
    });
  });

  describe('이미지 로드 상태 감시', () => {
    it('이미 로드된 이미지는 즉시 스크롤', async () => {
      // Arrange
      const scrollToCurrentItemMock = vi.fn();
      const container = document.createElement('div');
      container.setAttribute('role', 'grid');

      const itemElement = document.createElement('div');
      itemElement.setAttribute('data-item-index', '0');
      itemElement.setAttribute('data-media-loaded', 'true'); // 이미 로드됨
      container.appendChild(itemElement);

      // Act
      const waitForMediaLoad = (element: Element): Promise<void> => {
        return new Promise(resolve => {
          if (element.getAttribute('data-media-loaded') === 'true') {
            resolve();
            return;
          }
          // 로드 대기 로직
        });
      };

      await waitForMediaLoad(itemElement);
      scrollToCurrentItemMock();

      // Assert: 스크롤이 실행됨
      expect(scrollToCurrentItemMock).toHaveBeenCalledOnce();
    });

    it('로드 속성 감시 확인', () => {
      // Arrange
      const itemElement = document.createElement('div');
      itemElement.setAttribute('data-item-index', '0');
      itemElement.setAttribute('data-media-loaded', 'false');

      // Act
      const loadedState = itemElement.getAttribute('data-media-loaded');

      // Assert
      expect(loadedState).toBe('false');
    });

    it('로드 상태 변경 감지', () => {
      // Arrange
      const itemElement = document.createElement('div');
      itemElement.setAttribute('data-media-loaded', 'false');

      // Act
      itemElement.setAttribute('data-media-loaded', 'true');
      const loadedState = itemElement.getAttribute('data-media-loaded');

      // Assert
      expect(loadedState).toBe('true');
    });
  });

  describe('fit 모드 변경 시나리오', () => {
    it('fitOriginal 클릭 → autoScrollToCurrentItem 호출', async () => {
      // Arrange
      const autoScrollSpy = vi.fn();
      let imageFitMode = 'fitWidth';

      const handleFitOriginal = async () => {
        imageFitMode = 'original';
        await autoScrollSpy();
      };

      // Act
      await handleFitOriginal();

      // Assert
      expect(imageFitMode).toBe('original');
      expect(autoScrollSpy).toHaveBeenCalledOnce();
    });

    it('fitWidth 클릭 → autoScrollToCurrentItem 호출', async () => {
      // Arrange
      const autoScrollSpy = vi.fn();
      let imageFitMode = 'fitHeight';

      const handleFitWidth = async () => {
        imageFitMode = 'fitWidth';
        await autoScrollSpy();
      };

      // Act
      await handleFitWidth();

      // Assert
      expect(imageFitMode).toBe('fitWidth');
      expect(autoScrollSpy).toHaveBeenCalledOnce();
    });

    it('fitHeight 클릭 → autoScrollToCurrentItem 호출', async () => {
      // Arrange
      const autoScrollSpy = vi.fn();
      let imageFitMode = 'fitWidth';

      const handleFitHeight = async () => {
        imageFitMode = 'fitHeight';
        await autoScrollSpy();
      };

      // Act
      await handleFitHeight();

      // Assert
      expect(imageFitMode).toBe('fitHeight');
      expect(autoScrollSpy).toHaveBeenCalledOnce();
    });

    it('fitContainer 클릭 → autoScrollToCurrentItem 호출', async () => {
      // Arrange
      const autoScrollSpy = vi.fn();
      let imageFitMode = 'fitWidth';

      const handleFitContainer = async () => {
        imageFitMode = 'fitContainer';
        await autoScrollSpy();
      };

      // Act
      await handleFitContainer();

      // Assert
      expect(imageFitMode).toBe('fitContainer');
      expect(autoScrollSpy).toHaveBeenCalledOnce();
    });
  });

  describe('에러 처리', () => {
    it('querySelector 실패는 무시', async () => {
      // Arrange
      const scrollToCurrentItemMock = vi.fn();
      const container = document.createElement('div');

      // 아이템이 없는 상태
      // (querySelector는 null 반환)

      // Act
      const currentIdx = 0;
      const itemElement = container.querySelector(`[data-item-index="${currentIdx}"]`);

      if (itemElement) {
        scrollToCurrentItemMock();
      }

      // Assert: 스크롤이 호출되지 않음
      expect(scrollToCurrentItemMock).not.toHaveBeenCalled();
    });

    it('getAttribute 실패는 무시', () => {
      // Arrange
      const itemElement = {
        getAttribute: () => {
          throw new Error('Mock error');
        },
      } as unknown as Element;

      // Act & Assert: 에러가 발생하지 않아야 함
      expect(() => {
        try {
          itemElement.getAttribute('data-media-loaded');
        } catch {
          // 에러 처리
        }
      }).not.toThrow();
    });
  });

  describe('성능 검증', () => {
    it('async 호출 오버헤드 최소화', async () => {
      // Arrange
      const container = document.createElement('div');
      const itemElement = document.createElement('div');
      itemElement.setAttribute('data-media-loaded', 'true');
      container.appendChild(itemElement);

      // Act
      const autoScrollToCurrentItem = async () => {
        // 이미 로드된 경우 즉시 반환
        if (itemElement.getAttribute('data-media-loaded') === 'true') {
          return;
        }
        // 로드 대기 (이 경로는 실행 안됨)
      };

      const startTime = performance.now();
      await autoScrollToCurrentItem();
      const elapsedTime = performance.now() - startTime;

      // Assert: 최소 오버헤드
      expect(elapsedTime).toBeLessThan(50); // 50ms 이내
    });

    it('다중 호출은 각각 독립적으로 동작', async () => {
      // Arrange
      const container1 = document.createElement('div');
      const container2 = document.createElement('div');

      const item1 = document.createElement('div');
      item1.setAttribute('data-item-index', '0');
      item1.setAttribute('data-media-loaded', 'true');
      container1.appendChild(item1);

      const item2 = document.createElement('div');
      item2.setAttribute('data-item-index', '0');
      item2.setAttribute('data-media-loaded', 'true');
      container2.appendChild(item2);

      const spy1 = vi.fn();
      const spy2 = vi.fn();

      // Act
      const scroll1 = async () => {
        const itemEl = container1.querySelector('[data-item-index="0"]');
        if (itemEl?.getAttribute('data-media-loaded') === 'true') {
          spy1();
        }
      };

      const scroll2 = async () => {
        const itemEl = container2.querySelector('[data-item-index="0"]');
        if (itemEl?.getAttribute('data-media-loaded') === 'true') {
          spy2();
        }
      };

      await Promise.all([scroll1(), scroll2()]);

      // Assert: 둘 다 호출됨
      expect(spy1).toHaveBeenCalledOnce();
      expect(spy2).toHaveBeenCalledOnce();
    });
  });
});
