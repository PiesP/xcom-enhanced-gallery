/**
 * @fileoverview Anchor 기반 스크롤 위치 저장/복원 컨트롤러
 * 절대 Y 좌표 대신 트윗(또는 카드) 요소의 고유 ID + viewport 상대 오프셋을 저장하여
 * 동적 로딩/가상 스크롤 환경에서도 자연스러운 위치 복원을 제공한다.
 */
import { logger } from '@shared/logging';
const LOG = { base: '[scroll]', anchor: '[scroll/anchor]' };
import { isBrowserEnvironment, safeWindow } from '@shared/browser';
import { TIME_CONSTANTS } from '@/constants';
import { buildAnchorScrollKey, buildLegacyAnchorScrollKey } from './key-builder';
import { waitForMutationUntil, now } from './timing-utils';
import { getScrollRestorationConfig } from './scroll-restoration-config';

export interface AnchorScrollData {
  readonly tweetId: string;
  readonly offset: number; // element.getBoundingClientRect().top 값 (viewport 기준)
  readonly ts: number; // 저장 시점
}

export interface AnchorSaveOptions {
  key?: string; // 기본 'scrollAnchor'
  /** 앵커 후보를 찾을 기준 viewport Y 좌표 (기본 10px) */
  probeY?: number;
  /** 강제로 사용할 pathname (이전 경로 저장용) */
  pathname?: string;
  /** 앵커 저장 성공 시 절대 스냅샷도 함께 저장할지 (방어적 이중 저장) - 기본 false */
  dualAbsolute?: boolean;
  /** probeY 에서 앵커 실패 시 상단 구간(기본 200px)에서 article 스캔 fallback 수행 여부 (기본 true) */
  enableFallbackScan?: boolean;
  /** fallback 스캔 높이(px) - 기본 200 */
  fallbackScanHeight?: number;
}

export interface AnchorRestoreOptions extends AnchorSaveOptions {
  /** 안전장치: 최대 대기 시간 (ms) - 기본 3000 */
  timeoutMs?: number;
  /** MutationObserver polling 을 수행할지 여부 (기본 true) */
  observe?: boolean;
}

const DEFAULT_KEY = 'scrollAnchor'; // legacy base (마이그레이션 지원)
const DEFAULT_PROBE_Y = 10; // viewport 상단에서 앵커 후보 측정 Y
const DEFAULT_FALLBACK_SCAN_HEIGHT = 200; // 상단 fallback 스캔 범위
const DEFAULT_TIMEOUT_MS = 3000; // 앵커 등장 대기 최대 시간

// 앵커 검색 확장 오프셋 상수
const OFFSET_SMALL_LEFT = -50;
const OFFSET_SMALL_RIGHT = 50;
const OFFSET_MEDIUM_LEFT = -100;
const OFFSET_MEDIUM_RIGHT = 100;
const OFFSET_LARGE_LEFT = -150;
const OFFSET_LARGE_RIGHT = 150;

function getCurrentPath(): string {
  try {
    const win = safeWindow();
    const path = win?.location?.pathname || '';
    return path || '/';
  } catch {
    return '/';
  }
}

function normalizePath(path: string): string {
  if (!path) return '/';
  // 중복 슬래시 제거, 해시/쿼리는 포함하지 않음 (이미 pathname)
  return path.replace(/\/+/g, '/');
}

function buildNamespacedKey(base: string | undefined, pathname: string | undefined): string {
  const path = normalizePath(pathname || getCurrentPath());
  // 1) 새 스킴
  const newKey = buildAnchorScrollKey(path);
  const cfg = getScrollRestorationConfig();
  if (cfg.enableLegacyAnchorKey === false) {
    return `${newKey}`; // legacy 비활성: 단일 key
  }
  // 2) legacy key (저장 시 둘 다 기록 → 복원 시 우선 새 키, 없으면 legacy)
  const legacyRoot = base && base.length > 0 ? base : DEFAULT_KEY;
  const legacyKey = buildLegacyAnchorScrollKey(path, legacyRoot);
  return `${newKey}||${legacyKey}`; // 내부 분리 표현 (실 저장 시 분해)
}

function extractTweetId(el: Element | null): string | null {
  if (!el) return null;

  // Strategy 1: time 요소 → parent a[href*="/status/"] 구조 우선
  try {
    const timeEl = el.querySelector('time');
    const anchor = (timeEl?.parentElement as HTMLAnchorElement) || null;
    const href = anchor?.href || '';
    const m = /\/status\/(\d+)/.exec(href);
    if (m?.[1]) {
      logger.debug(`${LOG.anchor} 트윗 ID 추출 성공 (strategy 1):`, m[1]);
      return m[1];
    }
  } catch {
    /* ignore */
  }

  // Strategy 2: a[href*="/status/"] 직접 검색
  try {
    const a = el.querySelector('a[href*="/status/" i]');
    const href = (a as HTMLAnchorElement)?.href || '';
    const m = /\/status\/(\d+)/.exec(href);
    if (m?.[1]) {
      logger.debug(`${LOG.anchor} 트윗 ID 추출 성공 (strategy 2):`, m[1]);
      return m[1];
    }
  } catch {
    /* ignore */
  }

  // Strategy 3: 모든 링크 스캔
  try {
    const links = el.querySelectorAll('a[href]');
    for (const link of Array.from(links)) {
      const href = (link as HTMLAnchorElement).href || '';
      const m = /\/status\/(\d+)/.exec(href);
      if (m?.[1]) {
        logger.debug(`${LOG.anchor} 트윗 ID 추출 성공 (strategy 3):`, m[1]);
        return m[1];
      }
    }
  } catch {
    /* ignore */
  }

  // Strategy 4: data 속성 확인
  try {
    const dataAttrs = ['data-tweet-id', 'data-status-id', 'data-id'];
    for (const attr of dataAttrs) {
      const value = el.getAttribute?.(attr);
      if (value && /^\d+$/.test(value)) {
        logger.debug(`${LOG.anchor} 트윗 ID 추출 성공 (strategy 4):`, value);
        return value;
      }
    }
  } catch {
    /* ignore */
  }

  logger.info(`${LOG.anchor} 트윗 ID 추출 실패: 모든 전략 실패`, {
    hasTimeEl: !!el.querySelector('time'),
    hasStatusLink: !!el.querySelector('a[href*="/status/"]'),
    linkCount: el.querySelectorAll('a[href]').length,
  });

  return null;
}

function findAnchorArticleFromPoint(x: number, y: number): HTMLElement | null {
  try {
    // Strategy 1: elementFromPoint로 직접 검색
    const target = document.elementFromPoint(x, y);
    if (target) {
      const article = target.closest?.('article[data-testid="tweet"]') as HTMLElement | null;
      if (article) {
        logger.debug(`${LOG.anchor} 앵커 article 발견 (strategy 1):`, { x, y });
        return article;
      }
    }

    // Strategy 2: 좌우로 확장 검색
    const searchOffsets = [
      OFFSET_SMALL_LEFT,
      OFFSET_SMALL_RIGHT,
      OFFSET_MEDIUM_LEFT,
      OFFSET_MEDIUM_RIGHT,
      OFFSET_LARGE_LEFT,
      OFFSET_LARGE_RIGHT,
    ];
    for (const offset of searchOffsets) {
      const targetAlt = document.elementFromPoint(x + offset, y);
      if (targetAlt) {
        const article = targetAlt.closest?.('article[data-testid="tweet"]') as HTMLElement | null;
        if (article) {
          logger.debug(`${LOG.anchor} 앵커 article 발견 (strategy 2):`, { x: x + offset, y });
          return article;
        }
      }
    }

    logger.info(`${LOG.anchor} elementFromPoint로 앵커 article 찾기 실패:`, { x, y });
    return null;
  } catch (error) {
    logger.info(`${LOG.anchor} findAnchorArticleFromPoint 예외:`, error);
    return null;
  }
}

function fallbackScanWithinTop(height: number): HTMLElement | null {
  try {
    logger.info(`${LOG.anchor} fallback 스캔 시작:`, { height });

    // Strategy 1: 표준 querySelector
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    if (!articles || articles.length === 0) {
      logger.info(`${LOG.anchor} fallback 스캔: article 요소 없음`);
      return null;
    }

    logger.info(`${LOG.anchor} fallback 스캔: ${articles.length}개 article 발견`);

    let chosen: HTMLElement | null = null;
    let minTop = Number.POSITIVE_INFINITY;
    let candidateCount = 0;

    for (const a of articles) {
      const el = a as HTMLElement;
      const rect = el.getBoundingClientRect();

      // 화면에 보이는 요소이고 지정된 높이 내에 있는 경우
      if (rect.top >= 0 && rect.top <= height && rect.height > 0) {
        candidateCount++;
        if (rect.top < minTop) {
          minTop = rect.top;
          chosen = el;
        }
      }
    }

    logger.info(`${LOG.anchor} fallback 스캔 결과:`, {
      totalArticles: articles.length,
      candidateCount,
      chosen: chosen ? 'found' : 'none',
      minTop: chosen ? minTop : 'N/A',
    });

    return chosen;
  } catch (error) {
    logger.info(`${LOG.anchor} fallback 스캔 예외:`, error);
    return null;
  }
}

export const AnchorScrollPositionController = {
  /** 앵커 기반 위치 저장 */
  save(options: AnchorSaveOptions = {}): boolean {
    if (!isBrowserEnvironment()) {
      logger.info(`${LOG.anchor} 저장 실패: 비브라우저 환경`);
      return false;
    }
    try {
      const win = safeWindow();
      if (!win) {
        logger.info(`${LOG.anchor} 저장 실패: window 객체 없음`);
        return false;
      }
      const composite = buildNamespacedKey(options.key, options.pathname);
      const parts = composite.split('||');
      const newKey = parts[0] || '';
      const legacyKey = parts[1] || '';

      logger.info(`${LOG.anchor} 저장 시작:`, { newKey, legacyKey });

      const probeY = typeof options.probeY === 'number' ? options.probeY : DEFAULT_PROBE_Y;
      const probeX = Math.floor(win.innerWidth / 2);

      logger.info(`${LOG.anchor} 앵커 요소 검색:`, { probeX, probeY });

      let article = findAnchorArticleFromPoint(probeX, probeY);
      if (!article && options.enableFallbackScan !== false) {
        logger.info(`${LOG.anchor} 첫 번째 검색 실패, fallback 스캔 시도`);
        // fallback 스캔: 상단 height 내 article 중 가장 top 이 작은 것 선택
        const scanH =
          typeof options.fallbackScanHeight === 'number'
            ? options.fallbackScanHeight
            : DEFAULT_FALLBACK_SCAN_HEIGHT;
        article = fallbackScanWithinTop(scanH);

        if (article) {
          logger.info(`${LOG.anchor} fallback 스캔으로 앵커 발견`);
        } else {
          logger.info(`${LOG.anchor} fallback 스캔에서도 앵커 찾기 실패`);
        }
      }

      if (!article) {
        logger.info(`${LOG.anchor} 저장 실패: 앵커 article 요소 없음`);
        return false;
      }

      const tweetId = extractTweetId(article);
      if (!tweetId) {
        logger.info(`${LOG.anchor} 저장 실패: 트윗 ID 추출 실패`, {
          article: article.outerHTML?.substring(0, DEFAULT_FALLBACK_SCAN_HEIGHT),
        });
        return false;
      }
      const offset = article.getBoundingClientRect().top;
      const data: AnchorScrollData = { tweetId, offset, ts: Date.now() };

      logger.info(`${LOG.anchor} 앵커 데이터 생성:`, data);

      sessionStorage.setItem(newKey, JSON.stringify(data));
      const cfg = getScrollRestorationConfig();
      if (cfg.enableLegacyAnchorKey !== false && legacyKey) {
        try {
          sessionStorage.setItem(legacyKey, JSON.stringify(data));
        } catch {
          /* ignore */
        }
      }
      // 방어적 이중 저장 (absolute) 옵션 처리
      if (options.dualAbsolute) {
        try {
          // absolute 컨트롤러 지연 import (순환 회피용 dynamic): require 패턴 회피 위해 조건부 inline
          const absKey = newKey.replace('scroll:anchor:', 'scroll:timeline:');
          // 위치 y 추출 후 sessionStorage 직접 기록 (ScrollPositionController.save는 현재 window.scrollY 사용 → anchor offset 과 다름)
          const y = (win.scrollY || win.pageYOffset || 0) + offset;
          const absData = { y, ts: Date.now() };
          sessionStorage.setItem(absKey, JSON.stringify(absData));
        } catch {
          /* ignore absolute dual failure */
        }
      }
      logger.debug(`${LOG.anchor} saved`, data);
      return true;
    } catch (e) {
      logger.debug(`${LOG.anchor} save failed`, e);
      return false;
    }
  },
  /** 앵커 기반 위치 복원 (동기: true 반환은 "복원 시도 시작" 의미) */
  restore(options: AnchorRestoreOptions = {}): boolean {
    if (!isBrowserEnvironment()) return false;
    try {
      const win = safeWindow();
      if (!win) return false;
      try {
        if (win.history?.scrollRestoration) {
          win.history.scrollRestoration = 'manual';
        }
      } catch {
        /* ignore */
      }
      const composite = buildNamespacedKey(options.key, options.pathname);
      const parts = composite.split('||');
      const newKey = parts[0] || '';
      const legacyKey = parts[1] || '';
      const cfg = getScrollRestorationConfig();
      const rawPrimary = newKey ? sessionStorage.getItem(newKey) : null;
      // legacy fallback는 설정이 활성화된 경우에만 시도
      const rawLegacy =
        !rawPrimary && cfg.enableLegacyAnchorKey !== false && legacyKey
          ? sessionStorage.getItem(legacyKey)
          : null;
      const usedKey = rawPrimary ? newKey : rawLegacy ? legacyKey : null;
      if (!usedKey) {
        logger.info(`${LOG.anchor} 저장된 앵커 데이터 없음:`, { newKey, legacyKey });
        return false;
      }
      const parsed = JSON.parse(rawPrimary || rawLegacy!) as AnchorScrollData;
      if (!parsed?.tweetId) {
        logger.info(`${LOG.anchor} 유효하지 않은 앵커 데이터:`, parsed);
        return false;
      }

      logger.info(`${LOG.anchor} 앵커 복원 시도:`, {
        tweetId: parsed.tweetId,
        offset: parsed.offset,
        usedKey,
      });

      // TTL 검사 (기본 5분)
      const age = Date.now() - parsed.ts;
      if (age > TIME_CONSTANTS.FIVE_MINUTES) {
        try {
          sessionStorage.removeItem(usedKey);
        } catch {
          /* ignore */
        }
        logger.debug(`${LOG.anchor} expired anchor discarded`, { key: usedKey, age });
        return false;
      }

      const timeoutMs =
        typeof options.timeoutMs === 'number' ? options.timeoutMs : DEFAULT_TIMEOUT_MS;
      const observe = options.observe !== false;

      const attempt = (): boolean => {
        try {
          logger.info(`${LOG.anchor} 복원 시도: 트윗 ID ${parsed.tweetId} 검색`);

          // Strategy 1: 직접 링크 검색
          let link = document.querySelector(`a[href*="/status/${parsed.tweetId}"]`);
          let article = link?.closest?.('article[data-testid="tweet"]') as HTMLElement | null;

          if (!article) {
            // Strategy 2: 대소문자 무시 검색
            logger.info(`${LOG.anchor} Strategy 1 실패, Strategy 2 시도`);
            link = document.querySelector(`a[href*="/status/${parsed.tweetId}" i]`);
            article = link?.closest?.('article[data-testid="tweet"]') as HTMLElement | null;
          }

          if (!article) {
            // Strategy 3: 모든 트윗 스캔
            logger.info(`${LOG.anchor} Strategy 2 실패, Strategy 3 시도`);
            const allArticles = document.querySelectorAll('article[data-testid="tweet"]');
            for (const art of Array.from(allArticles)) {
              const candidateId = extractTweetId(art);
              if (candidateId === parsed.tweetId) {
                article = art as HTMLElement;
                logger.info(`${LOG.anchor} Strategy 3 성공: 전체 스캔으로 발견`);
                break;
              }
            }
          }

          if (!article) {
            logger.info(`${LOG.anchor} 앵커 요소 찾을 수 없음:`, {
              tweetId: parsed.tweetId,
              totalArticles: document.querySelectorAll('article[data-testid="tweet"]').length,
            });
            return false;
          }

          const rect = article.getBoundingClientRect(); // viewport top -> article top 거리 = rect.top
          const targetY = (win.scrollY || win.pageYOffset || 0) + rect.top - parsed.offset;
          const finalY = targetY < 0 ? 0 : targetY;

          logger.info(`${LOG.anchor} 앵커 스크롤 실행:`, {
            currentY: win.scrollY || win.pageYOffset || 0,
            rectTop: rect.top,
            targetY,
            finalY,
          });

          // X.com의 smooth scrolling CSS 강제 차단
          const docEl = win.document?.documentElement as HTMLElement | undefined;
          const originalBehavior = docEl ? docEl.style.scrollBehavior : '';
          if (docEl) {
            docEl.style.scrollBehavior = 'auto !important';
          }

          win.scrollTo({ top: finalY, behavior: 'auto' });

          // 원래 스타일 복원
          if (docEl) {
            docEl.style.scrollBehavior = originalBehavior;
          }

          sessionStorage.removeItem(usedKey);
          logger.info(`${LOG.anchor} 앵커 스크롤 완료`);
          return true;
        } catch (error) {
          logger.info(`${LOG.anchor} attempt 함수 예외:`, error);
          return false;
        }
      };

      if (attempt()) {
        logger.info(`${LOG.anchor} 첫 번째 시도 성공`);
        return true;
      }

      logger.info(`${LOG.anchor} 첫 번째 시도 실패, observe=${observe}`);
      if (!observe) {
        logger.info(`${LOG.anchor} observe 비활성화로 인한 즉시 실패 반환`);
        return false; // 더 이상 기다리지 않음
      }

      // observe 모드: 비동기 복원 시도하지만 현재는 실패 상태
      const timeline = document.querySelector('[data-testid="primaryColumn"]') || document.body;
      const started = now();

      const handle = waitForMutationUntil(
        timeline,
        () => {
          if (attempt()) {
            return true;
          }
          return false;
        },
        timeoutMs
      );

      logger.debug(`${LOG.anchor} observe started`, {
        key: usedKey,
        timeoutMs,
        started,
        legacyEnabled: cfg.enableLegacyAnchorKey !== false,
        handleActive: !!handle?.active(),
      });

      // observe 모드에서는 즉시 결과를 반환할 수 없으므로
      // 첫 번째 시도가 실패했다면 false를 반환
      logger.info(`${LOG.anchor} observe 시도 중이지만 즉시 결과는 실패`);
      return false;
    } catch (e) {
      logger.debug(`${LOG.anchor} restore failed`, e);
      return false;
    }
  },
  clear(options: AnchorSaveOptions = {}): boolean {
    if (!isBrowserEnvironment()) return false;
    try {
      const composite = buildNamespacedKey(options.key, options.pathname);
      const parts = composite.split('||');
      const newKey = parts[0];
      const legacyKey = parts[1];
      if (newKey) sessionStorage.removeItem(newKey);
      const cfg = getScrollRestorationConfig();
      if (legacyKey && cfg.enableLegacyAnchorKey !== false) {
        try {
          sessionStorage.removeItem(legacyKey);
        } catch {
          /* ignore */
        }
      }
      return true;
    } catch {
      return false;
    }
  },
};

export default AnchorScrollPositionController;
