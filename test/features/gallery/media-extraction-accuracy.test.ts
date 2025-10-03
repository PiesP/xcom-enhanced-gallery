/**
 * @fileoverview Epic MEDIA-EXTRACTION-FIX Phase 1 - RED 테스트
 * @description 멘션된 트윗 미디어 추출 정확성 검증
 * @priority ⭐⭐⭐⭐⭐ (최우선 - 버그 수정)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';
import { DomStructureTweetStrategy } from '@shared/services/media-extraction/strategies/DomStructureTweetStrategy';

describe('Epic MEDIA-EXTRACTION-FIX - Phase 1: RED', () => {
  let service: MediaExtractionService;
  let strategy: DomStructureTweetStrategy;

  beforeEach(() => {
    service = new MediaExtractionService();
    strategy = new DomStructureTweetStrategy();
    document.body.innerHTML = '';
  });

  describe('기본 시나리오: 단일 트윗', () => {
    it('1. 단일 트윗의 미디어를 정확히 추출해야 한다', async () => {
      // Given: 단일 트윗 구조
      const tweetHtml = `
        <article data-testid="tweet">
          <div>
            <a href="/user123/status/1234567890">트윗 링크</a>
            <a href="/user123">@user123</a>
          </div>
          <div role="group">
            <img src="https://pbs.twimg.com/media/test123.jpg" alt="미디어" />
          </div>
        </article>
      `;
      document.body.innerHTML = tweetHtml;
      const mediaElement = document.querySelector('img') as HTMLElement;

      // When: 미디어 추출 시도
      const result = await service.extractFromClickedElement(mediaElement);

      // Then: 정확한 트윗 정보 추출
      expect(result.success).toBe(true);
      expect(result.tweetInfo?.tweetId).toBe('1234567890');
      expect(result.tweetInfo?.username).toBe('user123');
      expect(result.mediaItems.length).toBeGreaterThan(0);
    });

    it('2. 중첩된 DOM에서도 closest()로 정확한 트윗 컨테이너를 찾아야 한다', async () => {
      // Given: 깊이 중첩된 미디어 요소
      const tweetHtml = `
        <article data-testid="tweet">
          <div>
            <a href="/user123/status/1234567890">트윗 링크</a>
            <a href="/user123">@user123</a>
          </div>
          <div>
            <div>
              <div role="group">
                <div>
                  <img src="https://pbs.twimg.com/media/test123.jpg" alt="미디어" />
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
      document.body.innerHTML = tweetHtml;
      const mediaElement = document.querySelector('img') as HTMLElement;

      // When: DomStructureTweetStrategy로 추출
      const tweetInfo = await strategy.extract(mediaElement);

      // Then: 정확한 트윗 ID 추출
      expect(tweetInfo).not.toBeNull();
      expect(tweetInfo?.tweetId).toBe('1234567890');
    });
  });

  describe('버그 시나리오: 멘션된 트윗 (핵심)', () => {
    it('3. 멘션된 트윗의 미디어를 클릭했을 때 해당 트윗 정보를 추출해야 한다', async () => {
      // Given: 부모 트윗 + 멘션된 트윗 구조
      const complexHtml = `
        <article data-testid="tweet">
          <div>
            <a href="/parent_user/status/111111">부모 트윗 링크</a>
            <a href="/parent_user">@parent_user</a>
            <div>부모 트윗 텍스트</div>
          </div>
          
          <!-- 멘션된 트윗 (인용 트윗) -->
          <article data-testid="tweet">
            <div>
              <a href="/mentioned_user/status/222222">멘션된 트윗 링크</a>
              <a href="/mentioned_user">@mentioned_user</a>
            </div>
            <div role="group">
              <img src="https://pbs.twimg.com/media/mentioned_media.jpg" alt="멘션된 미디어" />
            </div>
          </article>
        </article>
      `;
      document.body.innerHTML = complexHtml;
      const mentionedMedia = document.querySelector('img') as HTMLElement;

      // When: 멘션된 트윗의 미디어 클릭 시
      const result = await service.extractFromClickedElement(mentionedMedia);

      // Then: 멘션된 트윗 정보 추출 (부모 트윗 X)
      expect(result.success).toBe(true);
      expect(result.tweetInfo?.tweetId).toBe('222222'); // ❌ 현재 버그: 111111 반환됨
      expect(result.tweetInfo?.username).toBe('mentioned_user'); // ❌ 현재 버그: parent_user 반환됨
    });

    it('4. closest()가 가장 가까운 article을 찾아야 한다 (부모가 아닌)', async () => {
      // Given: 중첩된 article 구조
      const nestedArticles = `
        <article data-testid="tweet">
          <a href="/outer/status/111111">Outer Tweet</a>
          <article data-testid="tweet">
            <a href="/inner/status/222222">Inner Tweet</a>
            <img src="test.jpg" data-target="inner" />
          </article>
        </article>
      `;
      document.body.innerHTML = nestedArticles;
      const innerMedia = document.querySelector('[data-target="inner"]') as HTMLElement;

      // When: DomStructureTweetStrategy 실행
      const tweetInfo = await strategy.extract(innerMedia);

      // Then: 내부 article의 트윗 ID 추출
      expect(tweetInfo?.tweetId).toBe('222222'); // ❌ 현재 버그: closest가 외부 article 선택 가능
    });

    it('5. 미디어와 트윗 컨테이너 간 소유권 검증이 필요하다', async () => {
      // Given: 복잡한 중첩 구조 (멘션 + 댓글)
      const complexStructure = `
        <article data-testid="tweet">
          <a href="/main/status/111111">Main Tweet</a>
          
          <div class="quoted-tweet">
            <article data-testid="tweet">
              <a href="/quoted/status/222222">Quoted Tweet</a>
              <img src="quoted.jpg" data-owner="quoted" />
            </article>
          </div>
        </article>
      `;
      document.body.innerHTML = complexStructure;
      const quotedMedia = document.querySelector('[data-owner="quoted"]') as HTMLElement;

      // When: 소유권 검증 없이 closest() 사용
      const tweetInfo = await strategy.extract(quotedMedia);

      // Then: 소유권 검증 실패로 정확한 추출 불가
      // ❌ 현재: 부모 article(111111)을 잘못 선택할 수 있음
      // ✅ 목표: 미디어를 직접 소유한 article(222222) 선택
      expect(tweetInfo?.tweetId).toBe('222222');
    });
  });

  describe('중첩 시나리오: 다중 레벨', () => {
    it('6. 3단계 중첩된 트윗에서 정확한 미디어 소유자를 찾아야 한다', async () => {
      // Given: 3단계 중첩 (원본 > 리트윗 > 인용)
      const tripleNested = `
        <article data-testid="tweet">
          <a href="/level1/status/111111">Level 1</a>
          <div>Level 1 Text</div>
          
          <div class="retweet">
            <article data-testid="tweet">
              <a href="/level2/status/222222">Level 2</a>
              
              <div class="quoted">
                <article data-testid="tweet">
                  <a href="/level3/status/333333">Level 3</a>
                  <img src="deep.jpg" data-level="3" />
                </article>
              </div>
            </article>
          </div>
        </article>
      `;
      document.body.innerHTML = tripleNested;
      const deepMedia = document.querySelector('[data-level="3"]') as HTMLElement;

      // When: 깊은 레벨의 미디어 추출
      const result = await service.extractFromClickedElement(deepMedia);

      // Then: 최하위 레벨 트윗 정보 추출
      expect(result.tweetInfo?.tweetId).toBe('333333');
    });

    it('7. 동일 레벨에 여러 article이 있을 때 정확한 것을 선택해야 한다', async () => {
      // Given: 형제 관계의 article들
      const siblings = `
        <div class="timeline">
          <article data-testid="tweet">
            <a href="/tweet1/status/111111">Tweet 1</a>
            <img src="media1.jpg" data-id="1" />
          </article>
          <article data-testid="tweet">
            <a href="/tweet2/status/222222">Tweet 2</a>
            <img src="media2.jpg" data-id="2" />
          </article>
        </div>
      `;
      document.body.innerHTML = siblings;
      const media2 = document.querySelector('[data-id="2"]') as HTMLElement;

      // When: 두 번째 트윗의 미디어 클릭
      const result = await service.extractFromClickedElement(media2);

      // Then: 두 번째 트윗 정보만 추출
      expect(result.tweetInfo?.tweetId).toBe('222222');
    });
  });

  describe('소유권 검증 (MediaOwnershipValidator)', () => {
    it('8. 미디어 요소와 트윗 컨테이너 사이에 중간 article이 없어야 한다', async () => {
      // Given: 중간에 다른 트윗이 있는 구조
      const intermediateStructure = `
        <article data-testid="tweet" data-id="outer">
          <a href="/outer/status/111111">Outer</a>
          
          <article data-testid="tweet" data-id="inner">
            <a href="/inner/status/222222">Inner</a>
            <img src="media.jpg" />
          </article>
        </article>
      `;
      document.body.innerHTML = intermediateStructure;
      const media = document.querySelector('img') as HTMLElement;

      // When: 소유권 검증 로직 적용
      const tweetInfo = await strategy.extract(media);

      // Then: 중간 article 없이 직접 소유한 inner 선택
      expect(tweetInfo?.tweetId).toBe('222222');

      // ✅ 소유권 검증 조건:
      // - media.closest('article') === inner article
      // - inner article과 media 사이에 다른 article 없음
    });

    it('9. 소유권 검증이 실패하면 낮은 confidence를 반환해야 한다', async () => {
      // Given: 애매한 소유권 구조
      const ambiguousStructure = `
        <article data-testid="tweet">
          <a href="/ambiguous/status/111111">Ambiguous</a>
          <div class="media-container">
            <!-- article 태그 없이 미디어만 존재 -->
            <img src="orphan.jpg" />
          </div>
        </article>
      `;
      document.body.innerHTML = ambiguousStructure;
      const orphanMedia = document.querySelector('img') as HTMLElement;

      // When: 소유권이 명확하지 않은 미디어 추출
      const tweetInfo = await strategy.extract(orphanMedia);

      // Then: 낮은 confidence 또는 null 반환
      if (tweetInfo) {
        expect(tweetInfo.confidence).toBeLessThan(0.7);
      }
    });

    it('10. 소유권 거리(distance)를 기반으로 confidence를 계산해야 한다', async () => {
      // Given: 거리가 다른 두 구조
      const closeStructure = `
        <article data-testid="tweet">
          <a href="/close/status/111111">Close</a>
          <img src="close.jpg" data-case="close" />
        </article>
      `;
      const farStructure = `
        <article data-testid="tweet">
          <a href="/far/status/222222">Far</a>
          <div><div><div><div><div>
            <img src="far.jpg" data-case="far" />
          </div></div></div></div></div>
        </article>
      `;

      // When: 가까운 구조의 confidence
      document.body.innerHTML = closeStructure;
      const closeMedia = document.querySelector('[data-case="close"]') as HTMLElement;
      const closeInfo = await strategy.extract(closeMedia);

      // When: 먼 구조의 confidence
      document.body.innerHTML = farStructure;
      const farMedia = document.querySelector('[data-case="far"]') as HTMLElement;
      const farInfo = await strategy.extract(farMedia);

      // Then: 가까울수록 높은 confidence
      expect(closeInfo?.confidence).toBeGreaterThan(farInfo?.confidence || 0);
    });
  });

  describe('성능 및 최적화', () => {
    it('11. 소유권 검증이 5ms 이내에 완료되어야 한다', async () => {
      // Given: 복잡한 DOM 구조
      const complexDom = `
        <article data-testid="tweet">
          <a href="/perf/status/123456">Performance Test</a>
          ${Array.from({ length: 100 })
            .map(
              (_, i) => `
            <div class="level-${i}">
              ${i === 99 ? '<img src="deep.jpg" />' : ''}
            </div>
          `
            )
            .join('')}
        </article>
      `;
      document.body.innerHTML = complexDom;
      const deepMedia = document.querySelector('img') as HTMLElement;

      // When: 소유권 검증 시간 측정
      const startTime = Date.now();
      await strategy.extract(deepMedia);
      const duration = Date.now() - startTime;

      // Then: 5ms 이내 완료
      expect(duration).toBeLessThan(5);
    });

    it('12. 전체 추출 프로세스가 평균 50ms 이내에 완료되어야 한다', async () => {
      // Given: 실제 트윗 구조 시뮬레이션
      const realWorldStructure = `
        <article data-testid="tweet">
          <div><a href="/user/status/123456">Tweet Link</a></div>
          <div><a href="/user">@user</a></div>
          <div>Tweet text content...</div>
          <div role="group">
            <img src="https://pbs.twimg.com/media/test1.jpg" />
            <img src="https://pbs.twimg.com/media/test2.jpg" />
          </div>
        </article>
      `;
      document.body.innerHTML = realWorldStructure;
      const firstMedia = document.querySelector('img') as HTMLElement;

      // When: 전체 추출 프로세스 실행
      const startTime = Date.now();
      await service.extractFromClickedElement(firstMedia);
      const duration = Date.now() - startTime;

      // Then: 50ms 이내 완료
      expect(duration).toBeLessThan(50);
    });
  });
});
