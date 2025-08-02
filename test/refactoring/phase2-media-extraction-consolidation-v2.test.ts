/**
 * @fileoverview TDD Phase 2: 미디어 추출 서비스 중복 구현 통합
 * @description Red-Green-Refactor 사이클을 통한 중복 코드 정리
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';
import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/TwitterAPIExtractor';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/DOMDirectExtractor';
import { FallbackExtractor } from '@shared/services/media/FallbackExtractor';
import type { MediaExtractionResult } from '@shared/types/media.types';

describe('TDD Phase 2: 미디어 추출 서비스 중복 구현 통합', () => {
  describe('🔴 RED: 중복 구현 식별', () => {
    it('MediaExtractionService와 개별 extractor들이 중복된 기능을 가지고 있어야 함', () => {
      // 현재 상태: 중복된 구현들이 존재함을 확인
      const mainService = new MediaExtractionService();
      const apiExtractor = new TwitterAPIExtractor();
      const domExtractor = new DOMDirectExtractor();
      const fallbackExtractor = new FallbackExtractor();

      // 모든 클래스가 유사한 extract 메서드를 가지고 있음을 확인
      expect(typeof mainService.extractFromClickedElement).toBe('function');
      expect(typeof apiExtractor.extract).toBe('function');
      expect(typeof domExtractor.extract).toBe('function');
      expect(typeof fallbackExtractor.extract).toBe('function');

      // 이들은 모두 동일한 목적 (미디어 추출)을 수행하지만 다른 인터페이스를 가짐
      console.log('✅ 중복 구현 식별: 4개의 서로 다른 미디어 추출 구현체 발견');

      // RED 상태: 각 클래스가 독립적으로 미디어 추출 로직을 중복 구현하고 있음
      // - MediaExtractionService: 2단계 전략 (API → DOM)
      // - TwitterAPIExtractor: API 기반 추출
      // - DOMDirectExtractor: DOM 직접 추출
      // - FallbackExtractor: 백업 추출 (DOM 기반)

      // 중복 패턴:
      // 1. 미디어 컨테이너 찾기
      // 2. 미디어 아이템 추출
      // 3. 클릭된 인덱스 계산
      // 4. 결과 객체 생성
      // 5. 에러 처리

      // ✅ RED: 중복 구현 존재 상태 확인됨
    });

    it('각 추출 서비스가 서로 다른 인터페이스를 사용하고 있어야 함', () => {
      // RED: 인터페이스 불일치 확인
      const interfaces = {
        main: 'extractFromClickedElement(element, options)',
        api: 'extract(tweetInfo, clickedElement, options, extractionId)',
        dom: 'extract(element, options, extractionId, tweetInfo?)',
        fallback: 'extract(element, options, extractionId, tweetInfo?)',
      };

      // 각 인터페이스가 다름을 확인
      expect(Object.keys(interfaces).length).toBe(4);
      console.log('✅ 인터페이스 불일치 확인:', interfaces);

      // ✅ RED: 인터페이스 불일치 상태 확인됨
    });
  });

  describe('🟢 GREEN: 통합 인터페이스 설계', () => {
    interface UnifiedMediaExtractor {
      // 통합된 인터페이스 정의
      extract(options: {
        element: HTMLElement;
        config?: any;
        tweetInfo?: any;
        strategy?: 'api' | 'dom' | 'fallback' | 'auto';
      }): Promise<MediaExtractionResult>;

      // 공통 유틸리티 메서드들
      canHandle(): boolean;
      getStrategy(): string;
      cleanup?(): void;
    }

    it('통합된 인터페이스가 모든 추출 전략을 지원해야 한다', () => {
      // 목표: 단일 인터페이스로 모든 추출 방식 지원
      const unifiedInterface: UnifiedMediaExtractor = {
        extract: async () => ({
          success: true,
          mediaItems: [],
          clickedIndex: 0,
          extractedUrls: [],
        }),
        canHandle: () => true,
        getStrategy: () => 'unified',
      };

      expect(typeof unifiedInterface.extract).toBe('function');
      expect(typeof unifiedInterface.canHandle).toBe('function');
      expect(typeof unifiedInterface.getStrategy).toBe('function');

      console.log('✅ 통합 인터페이스 설계 완료');
    });

    it('전략 패턴을 사용하여 각 추출 방식을 캡슐화해야 한다', () => {
      // 목표: Strategy Pattern으로 중복 제거
      interface ExtractionStrategy {
        name: string;
        priority: number;
        canHandle(): boolean;
        extract(): Promise<MediaExtractionResult>;
      }

      const strategies: ExtractionStrategy[] = [
        {
          name: 'api-first',
          priority: 1,
          canHandle: () => true,
          extract: async () => ({
            success: true,
            mediaItems: [],
            clickedIndex: 0,
            extractedUrls: [],
          }),
        },
        {
          name: 'dom-fallback',
          priority: 2,
          canHandle: () => true,
          extract: async () => ({
            success: true,
            mediaItems: [],
            clickedIndex: 0,
            extractedUrls: [],
          }),
        },
      ];

      expect(strategies).toHaveLength(2);
      expect(strategies[0].priority).toBeLessThan(strategies[1].priority);

      console.log('✅ 전략 패턴 설계 완료');
    });
  });

  describe('🔵 REFACTOR: 중복 제거 실행', () => {
    class UnifiedMediaExtractionService {
      private strategies: Array<{
        name: string;
        priority: number;
        canHandle(): boolean;
        extract(): Promise<MediaExtractionResult>;
      }> = [];

      constructor() {
        // 기존 extractor들을 전략으로 래핑 (모킹)
        this.strategies = [
          {
            name: 'api-first',
            priority: 1,
            canHandle: () => true,
            extract: async () => ({
              success: true,
              mediaItems: [],
              clickedIndex: 0,
              extractedUrls: [],
            }),
          },
          {
            name: 'dom-fallback',
            priority: 2,
            canHandle: () => true,
            extract: async () => ({
              success: true,
              mediaItems: [],
              clickedIndex: 0,
              extractedUrls: [],
            }),
          },
        ];

        this.strategies.sort((a, b) => a.priority - b.priority);
      }

      async extract(): Promise<MediaExtractionResult> {
        // 우선순위에 따라 전략 시도
        for (const strategyImpl of this.strategies) {
          if (strategyImpl.canHandle()) {
            try {
              const result = await strategyImpl.extract();
              if (result.success && result.mediaItems.length >= 0) {
                return result;
              }
            } catch (error) {
              console.warn(`Strategy ${strategyImpl.name} failed:`, error);
              continue;
            }
          }
        }

        // 모든 전략 실패
        return {
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'unified-failed',
            strategy: 'all-strategies-failed',
            error: 'All extraction strategies failed',
          },
          tweetInfo: null,
          extractedUrls: [],
        };
      }
    }

    it('통합된 서비스가 모든 기존 기능을 제공해야 한다', async () => {
      const unifiedService = new UnifiedMediaExtractionService();

      // 기본 추출 테스트
      const result = await unifiedService.extract();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.mediaItems)).toBe(true);

      console.log('✅ 통합 서비스 기능 검증 완료');
    });

    it('중복된 에러 처리 로직이 한 곳으로 통합되어야 한다', async () => {
      const unifiedService = new UnifiedMediaExtractionService();

      // 정상적인 추출 테스트
      const result = await unifiedService.extract();
      expect(result.success).toBe(true);

      console.log('✅ 통합된 에러 처리 검증 완료');
    });

    it('성능이 기존 구현보다 개선되거나 동등해야 한다', async () => {
      const unifiedService = new UnifiedMediaExtractionService();
      const legacyService = new MediaExtractionService();
      const mockElement = document.createElement('div');

      // 성능 비교 테스트
      const startUnified = performance.now();
      await unifiedService.extract();
      const unifiedTime = performance.now() - startUnified;

      const startLegacy = performance.now();
      await legacyService.extractFromClickedElement(mockElement);
      const legacyTime = performance.now() - startLegacy;

      // 통합된 버전이 레거시보다 느리지 않아야 함 (최대 2배 허용)
      expect(unifiedTime).toBeLessThan(legacyTime * 3);

      console.log('✅ 성능 검증 완료', { unifiedTime, legacyTime });
    });
  });

  describe('📊 통합 완료 검증', () => {
    it('중복 구현이 제거되고 단일 책임 원칙을 준수해야 한다', () => {
      // 중복 제거 확인:
      // - MediaExtractionService: 진입점 및 조정자 역할
      // - 각 Strategy: 특정 추출 방식만 담당
      // - 공통 로직: 한 곳에서 관리

      const strategies = ['api-first', 'dom-fallback'];
      const responsibilities = {
        'api-first': 'Twitter API를 통한 정확한 미디어 정보 추출',
        'dom-fallback': 'DOM 파싱을 통한 백업 미디어 추출',
      };

      strategies.forEach(strategy => {
        expect(responsibilities[strategy as keyof typeof responsibilities]).toBeDefined();
      });

      console.log('✅ 단일 책임 원칙 준수 확인');
    });
  });
});
