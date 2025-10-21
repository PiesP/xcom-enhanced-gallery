/**
 * @fileoverview DomStructureTweetStrategy 테스트
 * @description DOM 구조 기반 트윗 정보 추출 전략 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomStructureTweetStrategy } from '../../../../../../src/shared/services/media-extraction/strategies/dom-structure-tweet-strategy';
import type { TweetInfo } from '../../../../../../src/shared/types/media.types';

// Mock logger
vi.mock('../../../../../../src/shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock username extraction service
vi.mock('../../../../../../src/shared/services/media/username-extraction-service', () => ({
  parseUsernameFast: vi.fn(),
}));

// Import after mocking
import { parseUsernameFast as mockParseUsernameFast } from '../../../../../../src/shared/services/media/username-extraction-service';

describe('DomStructureTweetStrategy', () => {
  let strategy: DomStructureTweetStrategy;
  const mockedParseUsernameFast = vi.mocked(mockParseUsernameFast);

  beforeEach(() => {
    strategy = new DomStructureTweetStrategy();
    mockedParseUsernameFast.mockReturnValue(null);
    vi.clearAllMocks();
  });

  describe('기본 속성', () => {
    it('name은 "dom-structure"이다', () => {
      expect(strategy.name).toBe('dom-structure');
    });

    it('priority는 3이다', () => {
      expect(strategy.priority).toBe(3);
    });
  });

  describe('extract()', () => {
    it('트윗 컨테이너와 링크를 찾아 트윗 정보를 추출한다', async () => {
      const container = document.createElement('article');
      container.setAttribute('data-testid', 'tweet');

      // 사용자명 링크
      const userLink = document.createElement('a');
      userLink.href = '/testuser';
      container.appendChild(userLink);

      // 트윗 상태 링크
      const statusLink = document.createElement('a');
      statusLink.href = '/testuser/status/1234567890';
      container.appendChild(statusLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result).toMatchObject({
        tweetId: '1234567890',
        username: 'testuser',
        tweetUrl: 'https://twitter.com/testuser/status/1234567890',
        extractionMethod: 'dom-structure',
        confidence: 0.7,
      });
      expect(result?.metadata?.containerTag).toBe('article');
    });

    it('[data-testid="tweet"] 컨테이너를 찾는다', async () => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'tweet');

      const userLink = document.createElement('a');
      userLink.href = '/user123';
      container.appendChild(userLink);

      const statusLink = document.createElement('a');
      statusLink.href = '/user123/status/9876543210';
      container.appendChild(statusLink);

      const element = document.createElement('span');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result).not.toBeNull();
      expect(result?.tweetId).toBe('9876543210');
      expect(result?.username).toBe('user123');
      expect(result?.metadata?.containerTag).toBe('div');
    });

    it('article 컨테이너를 찾는다', async () => {
      const container = document.createElement('article');

      const userLink = document.createElement('a');
      userLink.href = '/articleuser';
      container.appendChild(userLink);

      const statusLink = document.createElement('a');
      statusLink.href = '/articleuser/status/1111111111';
      container.appendChild(statusLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result).not.toBeNull();
      expect(result?.tweetId).toBe('1111111111');
      expect(result?.username).toBe('articleuser');
    });

    it('컨테이너가 없으면 null을 반환한다', async () => {
      const element = document.createElement('div');

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('트윗 ID가 없으면 null을 반환한다', async () => {
      const container = document.createElement('article');
      container.setAttribute('data-testid', 'tweet');

      const userLink = document.createElement('a');
      userLink.href = '/testuser';
      container.appendChild(userLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('사용자명이 없으면 parseUsernameFast()로 대체 시도한다', async () => {
      mockedParseUsernameFast.mockReturnValue('fallback_user');

      const container = document.createElement('article');
      const statusLink = document.createElement('a');
      statusLink.href = '/someone/status/1234567890';
      container.appendChild(statusLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(mockedParseUsernameFast).toHaveBeenCalledTimes(1);
      expect(result).not.toBeNull();
      expect(result?.username).toBe('fallback_user');
    });

    it('사용자명이 "fallback"이면 null을 반환한다', async () => {
      const container = document.createElement('article');
      const statusLink = document.createElement('a');
      statusLink.href = '/someone/status/1234567890';
      container.appendChild(statusLink);

      const element = document.createElement('div');
      container.appendChild(element);

      // parseUsernameFast가 null 반환 → 'fallback' 사용 → null 반환
      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('에러 발생 시 null을 반환한다', async () => {
      const element = document.createElement('div');
      // closest를 에러를 던지도록 모킹
      vi.spyOn(element, 'closest').mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });
  });

  describe('findTweetIdInContainer()', () => {
    it('여러 링크 중에서 트윗 ID를 찾는다', async () => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'tweet');

      const link1 = document.createElement('a');
      link1.href = '/user';
      container.appendChild(link1);

      const link2 = document.createElement('a');
      link2.href = '/user/status/1234567890';
      container.appendChild(link2);

      const link3 = document.createElement('a');
      link3.href = '/user/status/9999999999';
      container.appendChild(link3);

      const userLink = document.createElement('a');
      userLink.href = '/user';
      container.appendChild(userLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      // 첫 번째 매칭되는 트윗 ID 사용
      expect(result?.tweetId).toBe('1234567890');
    });

    it('href 속성이 없으면 건너뛴다', async () => {
      const container = document.createElement('article');

      const linkWithoutHref = document.createElement('a');
      container.appendChild(linkWithoutHref);

      const validLink = document.createElement('a');
      validLink.href = '/user/status/5555555555';
      container.appendChild(validLink);

      const userLink = document.createElement('a');
      userLink.href = '/user';
      container.appendChild(userLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('5555555555');
    });

    it('/status/ 패턴이 없으면 트윗 ID를 찾지 못한다', async () => {
      const container = document.createElement('article');

      const link = document.createElement('a');
      link.href = '/user/media';
      container.appendChild(link);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });
  });

  describe('findUsernameInContainer()', () => {
    it('사용자명 링크를 찾는다', async () => {
      const container = document.createElement('article');

      const userLink = document.createElement('a');
      userLink.href = '/username123';
      container.appendChild(userLink);

      const statusLink = document.createElement('a');
      statusLink.href = '/username123/status/1111111111';
      container.appendChild(statusLink);

      const tweetIdLink = document.createElement('a');
      tweetIdLink.href = '/any/status/1234567890';
      container.appendChild(tweetIdLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result?.username).toBe('username123');
    });

    it('간단한 경로 패턴에서 사용자명을 추출한다', async () => {
      const container = document.createElement('article');

      const userLink = document.createElement('a');
      userLink.href = '/testuser';
      container.appendChild(userLink);

      const statusLink = document.createElement('a');
      statusLink.href = '/any/status/456789';
      container.appendChild(statusLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result?.username).toBe('testuser');
    });

    it('/status/ 링크는 제외한다', async () => {
      const container = document.createElement('article');

      // 이 링크는 제외되어야 함
      const statusLink = document.createElement('a');
      statusLink.href = '/user/status/3333333333';
      container.appendChild(statusLink);

      // 이 링크가 사용자명으로 사용됨
      const userLink = document.createElement('a');
      userLink.href = '/realuser';
      container.appendChild(userLink);

      // 트윗 ID 링크도 필요
      const tweetIdLink = document.createElement('a');
      tweetIdLink.href = '/any/status/7777777777';
      container.appendChild(tweetIdLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result?.username).toBe('realuser');
    });

    it('href가 /로 시작하지 않으면 건너뛴다', async () => {
      const container = document.createElement('article');

      // 외부 링크는 건너뜀
      const externalLink = document.createElement('a');
      externalLink.href = 'https://example.com/user';
      container.appendChild(externalLink);

      // 상대 경로 링크가 사용됨
      const validLink = document.createElement('a');
      validLink.href = '/validuser';
      container.appendChild(validLink);

      // 트윗 ID 링크
      const tweetIdLink = document.createElement('a');
      tweetIdLink.href = '/any/status/4444444444';
      container.appendChild(tweetIdLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result?.username).toBe('validuser');
    });

    it('경로에 슬래시가 여러 개 있으면 건너뛴다', async () => {
      const container = document.createElement('article');

      // 다중 경로는 건너뜀
      const multiPathLink = document.createElement('a');
      multiPathLink.href = '/user/followers';
      container.appendChild(multiPathLink);

      // 단일 경로 링크가 사용됨
      const simpleLink = document.createElement('a');
      simpleLink.href = '/simpleuser';
      container.appendChild(simpleLink);

      // 트윗 ID 링크
      const tweetIdLink = document.createElement('a');
      tweetIdLink.href = '/any/status/5555555555';
      container.appendChild(tweetIdLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result?.username).toBe('simpleuser');
    });

    it('href 속성이 없으면 건너뛴다', async () => {
      const container = document.createElement('article');

      // href 없는 링크
      const noHrefLink = document.createElement('a');
      container.appendChild(noHrefLink);

      // 유효한 링크
      const validLink = document.createElement('a');
      validLink.href = '/gooduser';
      container.appendChild(validLink);

      // 트윗 ID 링크
      const tweetIdLink = document.createElement('a');
      tweetIdLink.href = '/any/status/6666666666';
      container.appendChild(tweetIdLink);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await strategy.extract(element);

      expect(result?.username).toBe('gooduser');
    });
  });

  describe('통합 시나리오', () => {
    it('복잡한 트윗 DOM 구조에서 정보를 추출한다', async () => {
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');

      // 헤더
      const header = document.createElement('div');
      const userLink = document.createElement('a');
      userLink.href = '/complex_user';
      userLink.textContent = '@complex_user';
      header.appendChild(userLink);
      article.appendChild(header);

      // 본문
      const body = document.createElement('div');
      body.textContent = 'Tweet content here';
      article.appendChild(body);

      // 푸터
      const footer = document.createElement('div');
      const statusLink = document.createElement('a');
      statusLink.href = '/complex_user/status/7777777777';
      footer.appendChild(statusLink);
      article.appendChild(footer);

      const clickedElement = document.createElement('img');
      body.appendChild(clickedElement);

      const result = await strategy.extract(clickedElement);

      expect(result).toMatchObject({
        tweetId: '7777777777',
        username: 'complex_user',
        tweetUrl: 'https://twitter.com/complex_user/status/7777777777',
        extractionMethod: 'dom-structure',
        confidence: 0.7,
      });
    });

    it('중첩된 요소에서도 가장 가까운 트윗 컨테이너를 찾는다', async () => {
      const outerArticle = document.createElement('article');
      const innerDiv = document.createElement('div');
      innerDiv.setAttribute('data-testid', 'tweet');

      const userLink = document.createElement('a');
      userLink.href = '/nested_user';
      innerDiv.appendChild(userLink);

      const statusLink = document.createElement('a');
      statusLink.href = '/nested_user/status/8888888888';
      innerDiv.appendChild(statusLink);

      outerArticle.appendChild(innerDiv);

      const deepElement = document.createElement('span');
      innerDiv.appendChild(deepElement);

      const result = await strategy.extract(deepElement);

      // 가장 가까운 [data-testid="tweet"]를 찾아야 함
      expect(result?.tweetId).toBe('8888888888');
      expect(result?.metadata?.containerTag).toBe('div');
    });
  });
});
