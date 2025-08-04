/**
 * 실제 샘플 페이지를 이용한 미디어 추출 테스트
 *
 * 저장된 HTML 파일에서 실제 미디어 추출이 어떻게 동작하는지 확인
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// 모든 의존성 mock 처리
vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
  },
}));

vi.mock('@shared/utils/media/MediaClickDetector', () => ({
  MediaClickDetector: {
    isProcessableMedia: vi.fn(() => true),
    getInstance: vi.fn(() => ({})),
  },
}));

vi.mock('@shared/dom', () => ({
  cachedQuerySelector: vi.fn(),
}));

vi.mock('@/constants', () => ({
  SELECTORS: {},
}));

describe('실제 샘플 페이지 미디어 추출 테스트', () => {
  let mockContainer: Element;

  beforeEach(() => {
    mockContainer = {
      querySelectorAll: vi.fn(() => []),
    } as any;

    const mockDocument = {
      querySelector: vi.fn(() => mockContainer),
      querySelectorAll: vi.fn(() => []),
    };

    vi.stubGlobal('document', mockDocument);
  });

  it('북마크 페이지 HTML 파일 읽기 테스트', () => {
    const samplePagePath = path.join(process.cwd(), 'sample_pages', 'bookmark_page.html');

    // 파일이 존재하는지 확인
    expect(fs.existsSync(samplePagePath)).toBe(true);

    // HTML 내용 읽기
    const htmlContent = fs.readFileSync(samplePagePath, 'utf-8');

    expect(htmlContent).toBeDefined();
    expect(htmlContent.length).toBeGreaterThan(0);
    expect(htmlContent).toContain('<html');
    expect(htmlContent).toContain('X'); // Twitter 페이지 title
  });

  it('샘플 페이지에서 로컬 파일 참조 패턴 확인', () => {
    const samplePagePath = path.join(process.cwd(), 'sample_pages', 'bookmark_page.html');
    const htmlContent = fs.readFileSync(samplePagePath, 'utf-8');

    // 로컬 파일 참조 패턴들 확인
    const localFilePatterns = [
      './bookmark_page_files/',
      '_bigger.jpg',
      '_bigger.png',
      '_normal.jpg',
    ];

    localFilePatterns.forEach(pattern => {
      expect(htmlContent).toContain(pattern);
    });

    // Twitter 미디어 도메인은 없어야 함 (저장된 페이지에서는)
    expect(htmlContent).not.toContain('pbs.twimg.com');
    expect(htmlContent).not.toContain('abs.twimg.com');
  });

  it('샘플 페이지 미디어 추출 시뮬레이션', async () => {
    const { OptimizedMediaExtractor } = await import(
      '../../src/shared/services/OptimizedMediaExtractor'
    );
    const extractor = new OptimizedMediaExtractor();

    // 샘플 페이지에서 발견되는 이미지 URL 패턴들을 mock
    const mockImages = [
      { src: './bookmark_page_files/_BcIWigi_bigger.jpg' },
      { src: './bookmark_page_files/3Pndc5OT_bigger.png' },
      { src: './bookmark_page_files/Go7UkW9bAAAZdgl' },
      { src: './bookmark_page_files/Gs6GV2uaEAAv5eg' },
      { src: 'https://pbs.twimg.com/media/actual_twitter_media.jpg' }, // 이것만 추출되어야 함
    ];

    mockContainer.querySelectorAll = vi.fn(() => mockImages);

    const results = await extractor.extractImagesFromDOM();

    // Twitter 미디어만 추출되고 로컬 파일은 제외되어야 함
    expect(results.length).toBe(1);
    expect(results[0]).toBe('https://pbs.twimg.com/media/actual_twitter_media.jpg');

    // 로컬 파일들은 모두 필터링되어야 함
    results.forEach(url => {
      expect(url).not.toMatch(/^\.\/.*_files\//);
      expect(url).not.toMatch(/^\.\.?\//);
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  it('빈 미디어 결과 시나리오 테스트', async () => {
    const { OptimizedMediaExtractor } = await import(
      '../../src/shared/services/OptimizedMediaExtractor'
    );
    const extractor = new OptimizedMediaExtractor();

    // 모든 이미지가 로컬 파일인 경우 (실제 샘플 페이지 상황)
    const mockImages = [
      { src: './bookmark_page_files/_BcIWigi_bigger.jpg' },
      { src: './bookmark_page_files/3Pndc5OT_bigger.png' },
      { src: './bookmark_page_files/Go7UkW9bAAAZdgl' },
    ];

    mockContainer.querySelectorAll = vi.fn(() => mockImages);

    const results = await extractor.extractImagesFromDOM();

    // 모든 로컬 파일이 필터링되어 빈 배열 반환
    expect(results).toEqual([]);
    expect(results.length).toBe(0);
  });
});
