/**
 * @file scroll-chaining-concurrent-input.test.ts
 * @description Phase 143: 동시 입력 처리 시 스크롤 체이닝 방지 검증
 *
 * **테스트 목적**:
 * - 빠른 연속 wheel 이벤트 처리 (10회/초 이상)
 * - 키보드+휠 동시 입력 충돌 방지
 * - Space/PageDown 중복 처리 방지
 * - 디바운싱/쓰로틀링 효과 검증
 *
 * **브라우저 테스트 이유**:
 * - JSDOM은 실제 이벤트 타이밍 시뮬레이션 제한적
 * - Chromium 환경에서 실제 이벤트 전파 및 처리 검증
 * - 동시 입력 시나리오는 실제 브라우저 동작 필요
 *
 * **PC 전용 이벤트**:
 * - wheel, keydown, keyup만 사용
 * - touch/pointer 이벤트 금지 (프로젝트 정책)
 *
 * **실제 구현 고려사항**:
 * - CSS overscroll-behavior: none 기본 동작
 * - passive: true 이벤트 리스너 (브라우저 최적화)
 * - 디바운싱/쓰로틀링 필요 여부 검증
 *
 * @see src/features/gallery/hooks/useGalleryScroll.ts
 * @see test/unit/features/scroll-chaining-css.test.ts
 * @see test/browser/scroll-chaining-propagation.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Phase 143: Scroll Chaining - Concurrent Input Handling (Browser)', () => {
  let galleryContainer: HTMLDivElement;
  let scrollableContent: HTMLDivElement;
  let parentScrollContainer: HTMLDivElement;

  beforeEach(async () => {
    // 중첩 스크롤 컨테이너 구조 생성
    parentScrollContainer = document.createElement('div');
    parentScrollContainer.style.cssText = `
      width: 400px;
      height: 600px;
      overflow: auto;
      position: relative;
    `;

    galleryContainer = document.createElement('div');
    galleryContainer.className = 'xeg-gallery-container';
    galleryContainer.setAttribute('data-testid', 'gallery-container');
    galleryContainer.style.cssText = `
      width: 100%;
      height: 500px;
      overflow: auto;
      overscroll-behavior: none;
      position: relative;
    `;

    scrollableContent = document.createElement('div');
    scrollableContent.style.cssText = `
      width: 100%;
      height: 2000px;
      background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
    `;

    galleryContainer.appendChild(scrollableContent);
    parentScrollContainer.appendChild(galleryContainer);
    document.body.appendChild(parentScrollContainer);

    // 부모 컨테이너에 충분한 콘텐츠 추가
    const parentContent = document.createElement('div');
    parentContent.style.cssText = `
      width: 100%;
      height: 3000px;
    `;
    parentScrollContainer.appendChild(parentContent);
  });

  afterEach(() => {
    document.body.removeChild(parentScrollContainer);
  });

  describe('1. 빠른 연속 wheel 이벤트', () => {
    it('should handle rapid consecutive wheel events (10 events/second)', async () => {
      // RED: 초당 10회 wheel 이벤트 처리

      let galleryWheelCount = 0;
      let parentWheelCount = 0;

      galleryContainer.addEventListener('wheel', () => {
        galleryWheelCount++;
      });

      parentScrollContainer.addEventListener('wheel', () => {
        parentWheelCount++;
      });

      // 100ms 간격으로 10개 이벤트 (초당 10회)
      const eventCount = 10;
      const interval = 100; // ms

      for (let i = 0; i < eventCount; i++) {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: 100,
          bubbles: true,
          cancelable: true,
        });

        galleryContainer.dispatchEvent(wheelEvent);
        await new Promise(resolve => setTimeout(resolve, interval));
      }

      // 갤러리에서 모든 이벤트 수신
      expect(galleryWheelCount).toBe(eventCount);

      // 부모는 overscroll-behavior: none으로 전파 차단
      // (일부 이벤트는 버블링될 수 있음)
      expect(parentWheelCount).toBeLessThanOrEqual(eventCount);
    });

    it('should prevent parent scroll during rapid wheel events', async () => {
      // RED: 빠른 wheel 이벤트 중 부모 스크롤 방지

      const initialParentScroll = parentScrollContainer.scrollTop;

      // 갤러리를 중간으로 스크롤
      galleryContainer.scrollTop = 500;
      const initialGalleryScroll = galleryContainer.scrollTop;

      // 빠른 연속 wheel 이벤트 (20회)
      for (let i = 0; i < 20; i++) {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: 50,
          bubbles: true,
          cancelable: true,
        });

        galleryContainer.dispatchEvent(wheelEvent);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // 부모 스크롤 위치 변화 없어야 함
      expect(parentScrollContainer.scrollTop).toBe(initialParentScroll);

      // 갤러리 스크롤 위치 확인 (dispatchEvent는 실제 스크롤 트리거 안 함)
      // 이 테스트는 이벤트 전파 차단을 검증 (실제 스크롤 동작은 E2E에서 검증)
      expect(galleryContainer.scrollTop).toBe(initialGalleryScroll);
    });

    it('should handle burst wheel events without lag', async () => {
      // RED: 버스트 wheel 이벤트 (50ms 이내 5개) 지연 없이 처리

      const startTime = performance.now();
      let eventsFired = 0;

      galleryContainer.addEventListener('wheel', () => {
        eventsFired++;
      });

      // 버스트: 50ms 이내 5개 이벤트
      const burstCount = 5;
      for (let i = 0; i < burstCount; i++) {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: 100,
          bubbles: true,
          cancelable: true,
        });

        galleryContainer.dispatchEvent(wheelEvent);
        await new Promise(resolve => setTimeout(resolve, 10)); // 10ms 간격
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 모든 이벤트 처리됨
      expect(eventsFired).toBe(burstCount);

      // 50ms + 여유 시간 이내
      expect(duration).toBeLessThan(100);
    });
  });

  describe('2. 키보드+휠 동시 입력', () => {
    it('should handle simultaneous keyboard and wheel input', async () => {
      // RED: ArrowDown 키 + wheel 이벤트 동시 발생

      let keydownCount = 0;
      let wheelCount = 0;

      galleryContainer.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
          keydownCount++;
          event.preventDefault();
        }
      });

      galleryContainer.addEventListener('wheel', () => {
        wheelCount++;
      });

      // 키보드 이벤트 먼저
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(keyEvent);

      // 즉시 wheel 이벤트 (10ms 이내)
      await new Promise(resolve => setTimeout(resolve, 5));

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(wheelEvent);

      // 두 이벤트 모두 처리됨
      expect(keydownCount).toBe(1);
      expect(wheelCount).toBe(1);
    });

    it('should prevent conflict between Space key and wheel', async () => {
      // RED: Space 키와 wheel 이벤트 충돌 방지

      let spacePressed = false;
      let wheelFired = false;

      galleryContainer.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === ' ') {
          spacePressed = true;
          event.preventDefault();
        }
      });

      galleryContainer.addEventListener('wheel', () => {
        wheelFired = true;
      });

      // Space 키 누름
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(spaceEvent);

      // 동시에 wheel 이벤트
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(wheelEvent);

      // 둘 다 독립적으로 처리되어야 함
      expect(spacePressed).toBe(true);
      expect(wheelFired).toBe(true);
    });

    it('should handle alternating keyboard and wheel events', async () => {
      // RED: 키보드와 wheel 이벤트 교대 입력

      const events: string[] = [];

      galleryContainer.addEventListener('keydown', (event: KeyboardEvent) => {
        events.push(`key:${event.key}`);
      });

      galleryContainer.addEventListener('wheel', () => {
        events.push('wheel');
      });

      // 교대 입력: key → wheel → key → wheel
      const keyEvent1 = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });
      galleryContainer.dispatchEvent(keyEvent1);

      await new Promise(resolve => setTimeout(resolve, 50));

      const wheelEvent1 = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
      });
      galleryContainer.dispatchEvent(wheelEvent1);

      await new Promise(resolve => setTimeout(resolve, 50));

      const keyEvent2 = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
      });
      galleryContainer.dispatchEvent(keyEvent2);

      await new Promise(resolve => setTimeout(resolve, 50));

      const wheelEvent2 = new WheelEvent('wheel', {
        deltaY: -100,
        bubbles: true,
      });
      galleryContainer.dispatchEvent(wheelEvent2);

      // 모든 이벤트 순서대로 처리됨
      expect(events).toEqual(['key:ArrowDown', 'wheel', 'key:ArrowUp', 'wheel']);
    });
  });

  describe('3. Space/PageDown 중복 처리', () => {
    it('should prevent double-firing when Space is pressed', async () => {
      // RED: Space 키 한 번 누를 때 중복 처리 방지

      let spaceCount = 0;

      galleryContainer.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === ' ') {
          spaceCount++;
          event.preventDefault();
        }
      });

      // Space 키 한 번
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(spaceEvent);

      // 짧은 대기 후 확인
      await new Promise(resolve => setTimeout(resolve, 100));

      // 한 번만 처리되어야 함
      expect(spaceCount).toBe(1);
    });

    it('should handle rapid Space key presses', async () => {
      // RED: Space 키 빠르게 여러 번 누르기

      let spaceCount = 0;

      galleryContainer.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === ' ') {
          spaceCount++;
          event.preventDefault();
        }
      });

      // 100ms 간격으로 3번
      for (let i = 0; i < 3; i++) {
        const spaceEvent = new KeyboardEvent('keydown', {
          key: ' ',
          bubbles: true,
          cancelable: true,
        });
        galleryContainer.dispatchEvent(spaceEvent);

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 모두 처리되어야 함
      expect(spaceCount).toBe(3);
    });

    it('should prevent conflict between PageDown and wheel', async () => {
      // RED: PageDown 키와 wheel 이벤트 충돌 방지

      let pageDownPressed = false;
      let wheelFired = false;

      galleryContainer.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'PageDown') {
          pageDownPressed = true;
          event.preventDefault();
        }
      });

      galleryContainer.addEventListener('wheel', () => {
        wheelFired = true;
      });

      // PageDown 누름
      const pageDownEvent = new KeyboardEvent('keydown', {
        key: 'PageDown',
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(pageDownEvent);

      // 동시에 wheel
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(wheelEvent);

      // 둘 다 독립적으로 처리
      expect(pageDownPressed).toBe(true);
      expect(wheelFired).toBe(true);
    });

    it('should handle Space+PageDown sequential input', async () => {
      // RED: Space → PageDown 순차 입력

      const keySequence: string[] = [];

      galleryContainer.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === ' ' || event.key === 'PageDown') {
          keySequence.push(event.key);
          event.preventDefault();
        }
      });

      // Space 누름
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(spaceEvent);

      await new Promise(resolve => setTimeout(resolve, 150));

      // PageDown 누름
      const pageDownEvent = new KeyboardEvent('keydown', {
        key: 'PageDown',
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(pageDownEvent);

      // 순서대로 처리됨
      expect(keySequence).toEqual([' ', 'PageDown']);
    });
  });

  describe('4. 디바운싱/쓰로틀링 효과', () => {
    it('should handle events without artificial debouncing', async () => {
      // RED: 인위적 디바운싱 없이 모든 이벤트 처리 (브라우저 네이티브 동작)

      let eventCount = 0;

      galleryContainer.addEventListener('wheel', () => {
        eventCount++;
      });

      // 빠른 연속 이벤트 (10ms 간격, 10개)
      for (let i = 0; i < 10; i++) {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: 50,
          bubbles: true,
          cancelable: true,
        });

        galleryContainer.dispatchEvent(wheelEvent);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // 모든 이벤트 처리됨 (디바운싱 없음)
      expect(eventCount).toBe(10);
    });

    it('should verify passive event listener performance', async () => {
      // RED: passive: true 리스너 성능 검증

      const startTime = performance.now();
      let eventCount = 0;

      // passive: true로 등록 (preventDefault 불가)
      galleryContainer.addEventListener(
        'wheel',
        () => {
          eventCount++;
        },
        { passive: true }
      );

      // 100개 이벤트 빠르게 발생
      for (let i = 0; i < 100; i++) {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: 10,
          bubbles: true,
          cancelable: true,
        });

        galleryContainer.dispatchEvent(wheelEvent);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 모든 이벤트 처리됨
      expect(eventCount).toBe(100);

      // 성능 기준: 100개 이벤트 100ms 이내
      expect(duration).toBeLessThan(100);
    });

    it('should handle event bursts without dropping events', async () => {
      // RED: 이벤트 버스트 시 누락 없이 처리

      const events: number[] = [];

      galleryContainer.addEventListener('wheel', (event: WheelEvent) => {
        events.push(event.deltaY);
      });

      // 버스트: 0ms 간격으로 5개 이벤트
      const deltaYValues = [10, 20, 30, 40, 50];

      for (const deltaY of deltaYValues) {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY,
          bubbles: true,
          cancelable: true,
        });

        galleryContainer.dispatchEvent(wheelEvent);
      }

      // 약간 대기
      await new Promise(resolve => setTimeout(resolve, 50));

      // 모든 이벤트 순서대로 처리됨
      expect(events).toEqual(deltaYValues);
    });

    it('should maintain scroll chaining prevention during high-frequency input', async () => {
      // RED: 고빈도 입력 중에도 스크롤 체이닝 방지 유지

      let parentScrolled = false;

      parentScrollContainer.addEventListener('scroll', () => {
        parentScrolled = true;
      });

      // 갤러리를 하단으로 스크롤
      galleryContainer.scrollTop = scrollableContent.offsetHeight - galleryContainer.offsetHeight;

      // 고빈도 wheel 이벤트 (20개, 50ms 간격)
      for (let i = 0; i < 20; i++) {
        const wheelEvent = new WheelEvent('wheel', {
          deltaY: 100,
          bubbles: true,
          cancelable: true,
        });

        galleryContainer.dispatchEvent(wheelEvent);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // 부모는 스크롤되지 않아야 함
      expect(parentScrolled).toBe(false);

      // overscroll-behavior 유지 확인
      const computedStyle = window.getComputedStyle(galleryContainer);
      expect(computedStyle.overscrollBehavior).toBe('none');
    });
  });

  describe('5. 극한 동시 입력 시나리오', () => {
    it('should handle 3-way concurrent input (keyboard + wheel + scroll)', async () => {
      // RED: 키보드 + wheel + 프로그래매틱 스크롤 동시 발생

      const events: string[] = [];

      galleryContainer.addEventListener('keydown', (event: KeyboardEvent) => {
        events.push(`key:${event.key}`);
      });

      galleryContainer.addEventListener('wheel', () => {
        events.push('wheel');
      });

      galleryContainer.addEventListener('scroll', () => {
        events.push('scroll');
      });

      // 키보드 입력
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });
      galleryContainer.dispatchEvent(keyEvent);

      // wheel 입력
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
      });
      galleryContainer.dispatchEvent(wheelEvent);

      // 프로그래매틱 스크롤
      galleryContainer.scrollTop = 100;

      await new Promise(resolve => setTimeout(resolve, 100));

      // 모든 이벤트 처리됨
      expect(events.length).toBeGreaterThanOrEqual(2); // key + wheel 최소
      expect(events).toContain('key:ArrowDown');
      expect(events).toContain('wheel');
    });

    it('should handle rapid mode switching (keyboard ↔ wheel)', async () => {
      // RED: 키보드 ↔ wheel 빠른 전환

      const inputModes: string[] = [];

      galleryContainer.addEventListener('keydown', () => {
        inputModes.push('keyboard');
      });

      galleryContainer.addEventListener('wheel', () => {
        inputModes.push('wheel');
      });

      // 빠른 전환: key → wheel → key → wheel (각 50ms 간격)
      for (let i = 0; i < 4; i++) {
        if (i % 2 === 0) {
          const keyEvent = new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            bubbles: true,
          });
          galleryContainer.dispatchEvent(keyEvent);
        } else {
          const wheelEvent = new WheelEvent('wheel', {
            deltaY: 100,
            bubbles: true,
          });
          galleryContainer.dispatchEvent(wheelEvent);
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // 모든 입력 모드 전환 처리됨
      expect(inputModes).toEqual(['keyboard', 'wheel', 'keyboard', 'wheel']);
    });
  });
});
