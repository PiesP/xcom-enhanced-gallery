/**
 * @fileoverview Twitter Bearer 토큰 동적 추출 서비스
 * @description 실행 시점에 Twitter 페이지에서 Bearer 토큰을 동적으로 추출
 */

import { logger } from '@shared/logging/logger';
import { globalTimerManager } from '@shared/utils/timer-management';

/**
 * 토큰 추출 결과
 */
export interface TokenExtractionResult {
  success: boolean;
  token?: string;
  error?: string;
  source: 'network' | 'script' | 'config' | 'fallback';
  timestamp: number;
}

/**
 * 토큰 유효성 검증 결과
 */
export interface TokenValidationResult {
  valid: boolean;
  reason?: string;
  remainingTime?: number;
}

/**
 * Twitter Bearer 토큰 동적 추출 서비스
 *
 * 기능:
 * - 네트워크 요청에서 Bearer 토큰 감지
 * - 스크립트 태그에서 토큰 추출
 * - 토큰 유효성 검증
 * - 자동 갱신 메커니즘
 * - Fallback 토큰 관리
 */
export class TwitterTokenExtractor {
  private currentToken: string | null = null;
  private extractionAttempts = 0;
  private readonly maxExtractionAttempts = 10;
  private initialized = false;
  private extractionTimer: number | null = null;

  // Fallback 토큰들 (공개적으로 알려진 토큰들)
  private readonly fallbackTokens = [
    'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'AAAAAAAAAAAAAAAAAAAAAPYXBAAAAAAACLXUNDekMxqa8h%2F40K4moUkGsoc%3DTYfbDKbT3jJPCEVnMYqilB28NHfOPqkca3qaAxGfsyKCs0wRbw',
  ];

  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    try {
      // 네트워크 요청 모니터링 시작
      this.startNetworkMonitoring();

      // 토큰 추출 시도
      const result = await this.extractToken();
      if (result.success && result.token) {
        this.currentToken = result.token;
        logger.info(`Bearer 토큰 추출 성공 (${result.source})`);
      } else {
        logger.warn('초기 토큰 추출 실패, 자동 추출 모드로 전환');
        this.startPeriodicExtraction();
      }

      this.initialized = true;
      logger.debug('TwitterTokenExtractor 초기화 완료');
    } catch (error) {
      logger.error('TwitterTokenExtractor 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 초기화 상태 확인
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 서비스 정리
   */
  async cleanup(): Promise<void> {
    if (this.extractionTimer) {
      globalTimerManager.clearInterval(this.extractionTimer);
      this.extractionTimer = null;
    }

    this.currentToken = null;
    this.initialized = false;
    logger.debug('TwitterTokenExtractor 정리 완료');
  }

  /**
   * 현재 토큰 조회
   *
   * @param forceRefresh 강제 갱신 여부
   * @returns 토큰 또는 null
   */
  async getToken(forceRefresh = false): Promise<string | null> {
    if (forceRefresh || !this.currentToken) {
      const result = await this.extractToken();
      if (result.success && result.token) {
        this.currentToken = result.token;
      }
    }

    return this.currentToken;
  }

  /**
   * 토큰 유효성 검증
   *
   * @param token 검증할 토큰 (선택사항, 기본: 현재 토큰)
   * @returns 유효성 검증 결과
   */
  async validateToken(token?: string): Promise<TokenValidationResult> {
    const targetToken = token || this.currentToken;

    if (!targetToken) {
      return {
        valid: false,
        reason: '토큰이 없습니다',
      };
    }

    // 기본적인 형식 검증
    if (!this.isValidTokenFormat(targetToken)) {
      return {
        valid: false,
        reason: '유효하지 않은 토큰 형식',
      };
    }

    // 실제 API 호출을 통한 유효성 검증
    try {
      const validationResult = await this.verifyTokenWithAPI(targetToken);
      return validationResult;
    } catch (error) {
      logger.warn('토큰 API 검증 실패, 형식 검증으로 대체:', error);
      // API 검증 실패 시 형식 검증 결과 반환
      return {
        valid: true,
        remainingTime: 3600000, // 1시간 가정 (형식이 올바르면 유효하다고 가정)
      };
    }
  }

  /**
   * 강제 토큰 갱신
   */
  async refreshToken(): Promise<TokenExtractionResult> {
    this.extractionAttempts = 0;
    return await this.extractToken();
  }

  // Private methods

  /**
   * 토큰 추출 (메인 로직)
   */
  private async extractToken(): Promise<TokenExtractionResult> {
    this.extractionAttempts++;
    // 우선순위: 페이지(script) → cookie/session → 설정(localStorage) → (보조)네트워크 힌트 → fallback

    // 1. 스크립트 태그에서 추출 시도 (페이지 최우선)
    const scriptResult = await this.extractFromScripts();
    if (scriptResult.success) {
      return scriptResult;
    }

    // 2. 쿠키/세션 스토리지에서 추출 시도
    const cookieSessionResult = await this.extractFromCookieSession();
    if (cookieSessionResult.success) {
      return cookieSessionResult;
    }

    // 3. 설정(LocalStorage: xeg-app-settings)에서 추출 시도
    const configResult = await this.extractFromConfig();
    if (configResult.success) {
      return configResult;
    }

    // 4. (선택) 네트워크 모니터 힌트 — 실제 토큰 획득은 아님
    const networkResult = await this.extractFromNetwork();
    if (networkResult.success) {
      return networkResult;
    }

    // 5. Fallback 토큰 사용
    if (this.extractionAttempts >= this.maxExtractionAttempts) {
      logger.warn('최대 추출 시도 횟수 도달, fallback 토큰 사용');
      return this.useFallbackToken();
    }

    return {
      success: false,
      error: '모든 토큰 추출 방법 실패',
      source: 'network',
      timestamp: Date.now(),
    };
  }

  /**
   * 쿠키/세션 스토리지에서 토큰 추출
   * 우선순위: cookie(auth_token) → sessionStorage(auth_token)
   */
  private async extractFromCookieSession(): Promise<TokenExtractionResult> {
    try {
      // 1) cookie: auth_token
      const cookie = typeof document !== 'undefined' ? document.cookie : '';
      if (cookie) {
        const match = cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
        const token = match?.[1];
        if (token && this.isValidTokenFormat(token)) {
          return {
            success: true,
            token,
            source: 'config',
            timestamp: Date.now(),
          };
        }
      }

      // 2) sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        const sToken = sessionStorage.getItem('auth_token');
        if (sToken && this.isValidTokenFormat(sToken)) {
          return {
            success: true,
            token: sToken,
            source: 'config',
            timestamp: Date.now(),
          };
        }
      }

      return {
        success: false,
        error: 'cookie/sessionStorage에 토큰이 없음',
        source: 'config',
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.debug('cookie/session 토큰 추출 오류:', error);
      return {
        success: false,
        error: String(error),
        source: 'config',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 네트워크 요청에서 토큰 추출
   */
  private async extractFromNetwork(): Promise<TokenExtractionResult> {
    try {
      // Performance API를 사용하여 최근 네트워크 요청 확인
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      for (const entry of entries.slice(-50)) {
        // 최근 50개 요청만 확인
        if (entry.name.includes('api.twitter.com') || entry.name.includes('x.com/i/api')) {
          // 실제 요청의 Authorization 헤더는 보안상 접근 불가
          // 대신 URL 패턴으로 토큰 추출 가능한 요청인지 확인
          if (this.isTokenRelevantRequest(entry.name)) {
            logger.debug(`토큰 관련 요청 감지: ${entry.name}`);
            // 여기서는 실제 토큰 추출이 어려우므로 다른 방법으로 전환
          }
        }
      }

      return {
        success: false,
        error: '네트워크에서 토큰 추출 실패',
        source: 'network',
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.debug('네트워크 토큰 추출 오류:', error);
      return {
        success: false,
        error: String(error),
        source: 'network',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 스크립트 태그에서 토큰 추출
   */
  private async extractFromScripts(): Promise<TokenExtractionResult> {
    try {
      const scripts = document.querySelectorAll('script');

      for (const script of scripts) {
        if (script.textContent) {
          // Twitter의 Bearer 토큰 패턴 검색
          const tokenMatches = script.textContent.match(/["']Bearer["']:\s*["']([^"']+)["']/g);

          if (tokenMatches) {
            for (const match of tokenMatches) {
              const tokenMatch = match.match(/["']([^"']+)["']\s*$/);
              if (tokenMatch?.[1]) {
                const token = tokenMatch[1];
                if (this.isValidTokenFormat(token)) {
                  logger.debug('스크립트에서 토큰 추출 성공');
                  return {
                    success: true,
                    token,
                    source: 'script',
                    timestamp: Date.now(),
                  };
                }
              }
            }
          }

          // 다른 패턴들도 시도
          const patterns = [
            /bearerToken["']?\s*[:=]\s*["']([^"']+)["']/i,
            /authorization["']?\s*[:=]\s*["']Bearer\s+([^"']+)["']/i,
            /"BEARER_TOKEN":\s*"([^"]+)"/i,
          ];

          for (const pattern of patterns) {
            const match = script.textContent.match(pattern);
            if (match?.[1] && this.isValidTokenFormat(match[1])) {
              logger.debug('스크립트에서 토큰 추출 성공 (패턴 매칭)');
              return {
                success: true,
                token: match[1],
                source: 'script',
                timestamp: Date.now(),
              };
            }
          }
        }
      }

      return {
        success: false,
        error: '스크립트에서 토큰을 찾을 수 없음',
        source: 'script',
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.debug('스크립트 토큰 추출 오류:', error);
      return {
        success: false,
        error: String(error),
        source: 'script',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 설정에서 토큰 추출
   */
  private async extractFromConfig(): Promise<TokenExtractionResult> {
    try {
      // SettingsService에서 설정된 토큰 확인
      // 현재는 순환 의존성을 피하기 위해 localStorage에서 직접 확인
      const settings = localStorage.getItem('xeg-app-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        const token = parsed?.tokens?.bearerToken;

        if (token && this.isValidTokenFormat(token)) {
          logger.debug('설정에서 토큰 추출 성공');
          return {
            success: true,
            token,
            source: 'config',
            timestamp: Date.now(),
          };
        }
      }

      return {
        success: false,
        error: '설정에 토큰이 없음',
        source: 'config',
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.debug('설정 토큰 추출 오류:', error);
      return {
        success: false,
        error: String(error),
        source: 'config',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Fallback 토큰 사용
   */
  private useFallbackToken(): TokenExtractionResult {
    for (const token of this.fallbackTokens) {
      if (this.isValidTokenFormat(token)) {
        logger.info('Fallback 토큰 사용');
        return {
          success: true,
          token,
          source: 'fallback',
          timestamp: Date.now(),
        };
      }
    }

    return {
      success: false,
      error: '모든 fallback 토큰 실패',
      source: 'fallback',
      timestamp: Date.now(),
    };
  }

  /**
   * 토큰 형식 유효성 검증
   */
  private isValidTokenFormat(token: string): boolean {
    // Twitter Bearer 토큰의 기본적인 형식 검증
    return (
      typeof token === 'string' &&
      token.length > 50 &&
      token.includes('AA') && // Twitter 토큰은 보통 AA로 시작
      token.includes('%') // URL 인코딩된 문자 포함
    );
  }

  /**
   * 토큰 관련 요청인지 확인
   */
  private isTokenRelevantRequest(url: string): boolean {
    const patterns = ['/1.1/guest/activate.json', '/graphql/', '/i/api/1.1/', '/i/api/2/'];

    return patterns.some(pattern => url.includes(pattern));
  }

  /**
   * 네트워크 모니터링 시작
   */
  private startNetworkMonitoring(): void {
    // 실제 구현에서는 Service Worker나 더 정교한 방법 필요
    // 현재는 기본적인 감지만 수행
    logger.debug('네트워크 모니터링 시작');
  }

  /**
   * 주기적 토큰 추출 시작
   */
  private startPeriodicExtraction(): void {
    this.extractionTimer = globalTimerManager.setInterval(async () => {
      if (!this.currentToken) {
        const result = await this.extractToken();
        if (result.success && result.token) {
          this.currentToken = result.token;
          logger.info(`주기적 토큰 추출 성공 (${result.source})`);

          // 토큰을 찾았으므로 주기적 추출 중단
          if (this.extractionTimer) {
            globalTimerManager.clearInterval(this.extractionTimer);
            this.extractionTimer = null;
          }
        }
      }
    }, 5000); // 5초마다 확인

    logger.debug('주기적 토큰 추출 시작');
  }

  /**
   * API를 통한 토큰 유효성 검증
   */
  private async verifyTokenWithAPI(token: string): Promise<TokenValidationResult> {
    try {
      // Twitter API의 간단한 인증 확인을 위한 guest token 요청
      const response = await fetch('https://api.twitter.com/1.1/guest/activate.json', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.guest_token) {
          return {
            valid: true,
            remainingTime: 3600000, // 1시간
          };
        }
      }

      // 응답이 성공적이지 않거나 guest_token이 없는 경우
      return {
        valid: false,
        reason: `API 응답 오류: ${response.status}`,
      };
    } catch (error) {
      // 네트워크 오류나 기타 예외
      throw new Error(
        `토큰 검증 API 호출 실패: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
