/**
 * @fileoverview 사용자명 추출 통합 유틸리티
 * @description Twitter/X.com에서 사용자명을 안전하게 추출하는 통합 서비스
 * @version 1.0.0
 */

import { logger } from '../../../infrastructure/logging/logger';

/**
 * 사용자명 추출 결과
 */
export interface UsernameExtractionResult {
    /** 추출된 사용자명 (null이면 추출 실패) */
    username: string | null;
    /** 추출 방법 */
    method: 'dom' | 'url' | 'meta' | 'fallback';
    /** 신뢰도 (0-1) */
    confidence: number;
}

/**
 * 사용자명 추출 서비스
 */
export class UsernameExtractionService {
    private static instance: UsernameExtractionService;

    public static getInstance(): UsernameExtractionService {
        if (!UsernameExtractionService.instance) {
            UsernameExtractionService.instance = new UsernameExtractionService();
        }
        return UsernameExtractionService.instance;
    }

    private constructor() { }

    /**
     * 페이지에서 사용자명을 추출합니다
     *
     * @param element - 검색 시작점 (기본값: document)
     * @returns 사용자명 추출 결과
     */
    public extractUsername(element?: HTMLElement | Document): UsernameExtractionResult {
        const root = element || document;

        // 1. DOM 요소에서 추출 시도
        const domResult = this.extractFromDOM(root);
        if (domResult.username) {
            return domResult;
        }

        // 2. URL에서 추출 시도
        const urlResult = this.extractFromURL();
        if (urlResult.username) {
            return urlResult;
        }

        // 3. 메타데이터에서 추출 시도
        const metaResult = this.extractFromMeta();
        if (metaResult.username) {
            return metaResult;
        }

        // 4. 실패
        return {
            username: null,
            method: 'fallback',
            confidence: 0,
        };
    }

    /**
     * DOM 요소에서 사용자명 추출
     */
    private extractFromDOM(root: HTMLElement | Document): UsernameExtractionResult {
        try {
            const selectors = [
            // 프로필 페이지 사용자명
                '[data-testid="UserName"] [dir="ltr"]',
                '[data-testid="User-Name"] span:not([aria-hidden="true"])',

            // 트윗 작성자 정보
                'article [data-testid="User-Name"] span:not([aria-hidden="true"])',
                'article [role="link"] span[dir="ltr"]',

            // 헤더 영역 사용자명
                'h2[role="heading"] span[dir="ltr"]',

            // 프로필 링크에서 추출
                'a[role="link"][href*="/"][href^="/"]',
            ];

            for (const selector of selectors) {
                const elements = root.querySelectorAll(selector);

                for (const element of elements) {
                    const username = this.extractUsernameFromElement(element as HTMLElement);
                    if (username) {
                        return {
                            username,
                            method: 'dom',
                            confidence: 0.9,
                        };
                    }
                }
            }

            return { username: null, method: 'dom', confidence: 0 };
        } catch (error) {
            logger.debug('UsernameExtractionService: DOM 추출 실패:', error);
            return { username: null, method: 'dom', confidence: 0 };
        }
    }

    /**
     * URL에서 사용자명 추출
     */
    private extractFromURL(): UsernameExtractionResult {
        try {
            const url = window.location.href;

            // Twitter/X URL 패턴 매칭
            const patterns = [
            // 일반 프로필: twitter.com/username
                /(?:twitter\.com|x\.com)\/([^/?#]+)(?:\/|$)/,
            // 트윗 URL: twitter.com/username/status/123
                /(?:twitter\.com|x\.com)\/([^/?#]+)\/status\/\d+/,
            // 미디어 URL: twitter.com/username/status/123/photo/1
                /(?:twitter\.com|x\.com)\/([^/?#]+)\/status\/\d+\/(?:photo|video)\/\d+/,
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match?.[1]) {
                    const username = match[1];

                    // 유효하지 않은 경로 제외
                    if (!this.isValidUsername(username)) {
                        continue;
                    }

                    return {
                        username,
                        method: 'url',
                        confidence: 0.8,
                    };
                }
            }

            return { username: null, method: 'url', confidence: 0 };
        } catch (error) {
            logger.debug('UsernameExtractionService: URL 추출 실패:', error);
            return { username: null, method: 'url', confidence: 0 };
        }
    }

    /**
     * 메타데이터에서 사용자명 추출
     */
    private extractFromMeta(): UsernameExtractionResult {
        try {
            const metaSelectors = [
                'meta[property="og:url"]',
                'link[rel="canonical"]',
                'meta[name="twitter:creator"]',
            ];

            for (const selector of metaSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const content = element.getAttribute('content') || element.getAttribute('href') || '';
                    const username = this.extractUsernameFromUrl(content);

                    if (username) {
                        return {
                            username,
                            method: 'meta',
                            confidence: 0.7,
                        };
                    }
                }
            }

            return { username: null, method: 'meta', confidence: 0 };
        } catch (error) {
            logger.debug('UsernameExtractionService: 메타데이터 추출 실패:', error);
            return { username: null, method: 'meta', confidence: 0 };
        }
    }

    /**
     * HTML 요소에서 사용자명 추출
     */
    private extractUsernameFromElement(element: HTMLElement): string | null {
        const text = element.textContent?.trim();
        if (!text) return null;

        // @ 제거
        const username = text.replace(/^@/, '');

        return this.isValidUsername(username) ? username : null;
    }

    /**
     * URL에서 사용자명 추출
     */
    private extractUsernameFromUrl(url: string): string | null {
        try {
            const match = url.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/);
            if (match?.[1]) {
                const username = match[1];
                return this.isValidUsername(username) ? username : null;
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * 유효한 사용자명인지 확인
     */
    private isValidUsername(username: string): boolean {
        if (!username || username.length === 0) return false;

        // Twitter/X에서 예약된 경로들 제외
        const reservedPaths = [
            'i',
            'home',
            'explore',
            'notifications',
            'messages',
            'bookmarks',
            'lists',
            'profile',
            'more',
            'compose',
            'search',
            'settings',
            'help',
            'display',
            'keyboard_shortcuts',
            'moments',
            'topics',
            'login',
            'logout',
            'signup',
            'account',
            'privacy',
            'tos',
            'about',
            'blog',
            'status',
            'apps',
            'jobs',
            'advertise',
            'media',
            'hashtag',
            'intent',
            'oauth',
            'api',
        ];

        if (reservedPaths.includes(username.toLowerCase())) {
            return false;
        }

        // 유효한 사용자명 패턴 확인 (영문, 숫자, 언더스코어)
        return /^[a-zA-Z0-9_]{1,15}$/.test(username);
    }
}

/**
 * 사용자명 추출 편의 함수
 */
export function extractUsername(element?: HTMLElement | Document): string | null {
    return UsernameExtractionService.getInstance().extractUsername(element).username;
}

/**
 * 신뢰도가 높은 사용자명 추출
 */
export function extractUsernameWithConfidence(
    element?: HTMLElement | Document,
    minConfidence = 0.5
): UsernameExtractionResult {
    const result = UsernameExtractionService.getInstance().extractUsername(element);

    if (result.confidence >= minConfidence) {
        return result;
    }

    return {
        username: null,
        method: 'fallback',
        confidence: 0,
    };
}
