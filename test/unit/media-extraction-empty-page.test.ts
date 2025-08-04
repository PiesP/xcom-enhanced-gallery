/**
 * 미디어 추출 로직 - 빈 페이지 테스트
 *
 * 실제 샘플 페이지에는 CSS와 HTML 구조만 있고
 * 실제 미디어 콘텐츠가 없는 경우를 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('OptimizedMediaExtractor - Core Tests', () => {
  let mockContainer: Element;

  beforeEach(() => {
    // 간단한 mock DOM 생성
    mockContainer = {
      querySelectorAll: vi.fn(() => []),
    } as any;

    // document.querySelector mock
    const mockDocument = {
      querySelector: vi.fn(() => mockContainer),
      querySelectorAll: vi.fn(() => []),
    };

    // global document 설정
    vi.stubGlobal('document', mockDocument);
  });

  it('should import OptimizedMediaExtractor successfully', async () => {
    const { OptimizedMediaExtractor } = await import(
      '../../src/shared/services/OptimizedMediaExtractor'
    );
    expect(OptimizedMediaExtractor).toBeDefined();
  });

  it('should create OptimizedMediaExtractor instance', async () => {
    const { OptimizedMediaExtractor } = await import(
      '../../src/shared/services/OptimizedMediaExtractor'
    );
    const extractor = new OptimizedMediaExtractor();
    expect(extractor).toBeDefined();
    expect(typeof extractor.extractImagesFromDOM).toBe('function');
  });

  it('빈 페이지에서 미디어 추출 시 빈 배열 반환', async () => {
    const { OptimizedMediaExtractor } = await import(
      '../../src/shared/services/OptimizedMediaExtractor'
    );
    const extractor = new OptimizedMediaExtractor();

    const results = await extractor.extractImagesFromDOM();

    expect(results).toEqual([]);
    expect(results.length).toBe(0);
  });

  it('Twitter 미디어 URL만 추출하고 로컬 파일은 제외', async () => {
    const { OptimizedMediaExtractor } = await import(
      '../../src/shared/services/OptimizedMediaExtractor'
    );
    const extractor = new OptimizedMediaExtractor();

    // 다양한 이미지 URL을 가진 mock elements
    const mockImages = [
      { src: 'https://pbs.twimg.com/media/image.jpg' },
      { src: './bookmark_page_files/local_image.jpg' },
      { src: '../relative/photo.png' },
      { src: 'data/picture.gif' },
      { src: 'https://example.com/image.jpg' },
    ];

    // querySelectorAll이 mock 이미지들을 반환하도록 설정
    mockContainer.querySelectorAll = vi.fn(() => mockImages);

    const results = await extractor.extractImagesFromDOM();

    // Twitter 미디어만 추출되어야 함
    expect(results.length).toBe(1);
    expect(results[0]).toBe('https://pbs.twimg.com/media/image.jpg');
  });

  it('로컬 파일 경로 패턴 필터링', async () => {
    const { OptimizedMediaExtractor } = await import(
      '../../src/shared/services/OptimizedMediaExtractor'
    );
    const extractor = new OptimizedMediaExtractor();

    const mockImages = [
      { src: './bookmark_page_files/_BcIWigi_bigger.jpg' },
      { src: './bookmark_page_files/Go7UkW9bAAAZdgl' },
      { src: '../assets/image.png' },
    ];

    mockContainer.querySelectorAll = vi.fn(() => mockImages);

    const results = await extractor.extractImagesFromDOM();

    // 모든 로컬 파일 경로는 제외되어야 함
    expect(results.length).toBe(0);
  });
});
