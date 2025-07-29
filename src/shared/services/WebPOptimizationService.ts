/**
 * @fileoverview WebP 최적화 서비스
 * @description 브라우저 WebP 지원 여부 감지 및 최적 이미지 포맷 선택
 * @version 1.0.0 - Phase 1: WebP 최적화 시스템
 */

import { logger } from '@shared/logging';

/**
 * 지원되는 이미지 포맷
 */
export type ImageFormat = 'webp' | 'jpg' | 'png' | 'avif';

/**
 * 브라우저 지원 정보
 */
interface BrowserSupport {
  webp: boolean;
  avif: boolean;
  jpegXl: boolean;
}

/**
 * 네트워크 정보 타입 (Navigator API 기반)
 */
interface NetworkConnection {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/**
 * 이미지 최적화 옵션
 */
export interface ImageOptimizationOptions {
  /** 선호 포맷 (기본: auto-detect) */
  preferredFormat?: ImageFormat;
  /** 품질 설정 (기본: large) */
  quality?: 'orig' | 'large' | 'medium' | 'small';
  /** 네트워크 조건 고려 여부 (기본: true) */
  considerNetworkCondition?: boolean;
  /** 강제 포맷 지정 (기본: false) */
  forceFormat?: boolean;
}

/**
 * WebP 최적화 서비스
 *
 * 주요 기능:
 * - 브라우저 WebP/AVIF 지원 감지
 * - 네트워크 조건 기반 포맷 선택
 * - 트위터 URL 동적 포맷 변경
 * - 성능 최적화된 이미지 URL 생성
 */
export class WebPOptimizationService {
  private static instance: WebPOptimizationService | null = null;
  private browserSupport: BrowserSupport | null = null;
  private networkInfo: NetworkConnection | null = null;

  private constructor() {
    this.initializeNetworkInfo();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): WebPOptimizationService {
    if (!this.instance) {
      this.instance = new WebPOptimizationService();
    }
    return this.instance;
  }

  /**
   * 서비스 초기화 - 브라우저 지원 감지
   */
  public async initialize(): Promise<void> {
    try {
      this.browserSupport = await this.detectBrowserSupport();
      logger.info('WebP 최적화 서비스 초기화 완료:', this.browserSupport);
    } catch (error) {
      logger.error('WebP 최적화 서비스 초기화 실패:', error);
      // 폴백: 기본 지원 가정
      this.browserSupport = { webp: true, avif: false, jpegXl: false };
    }
  }

  /**
   * 브라우저의 이미지 포맷 지원 여부 감지
   */
  private async detectBrowserSupport(): Promise<BrowserSupport> {
    const support: BrowserSupport = {
      webp: false,
      avif: false,
      jpegXl: false,
    };

    // WebP 지원 감지
    support.webp = await this.canPlayFormat('webp');

    // AVIF 지원 감지 (최신 브라우저)
    support.avif = await this.canPlayFormat('avif');

    // JPEG XL 지원 감지 (실험적)
    support.jpegXl = await this.canPlayFormat('jxl');

    return support;
  }

  /**
   * 특정 포맷 지원 여부 검사
   */
  private canPlayFormat(format: string): Promise<boolean> {
    return new Promise(resolve => {
      const testImages = {
        webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQ==',
        jxl: 'data:image/jxl;base64,/woIELASCAgQAFwASxLFihQIECBAgQIECA==',
      };

      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);

      // 타임아웃 설정 (500ms)
      setTimeout(() => resolve(false), 500);

      img.src = testImages[format as keyof typeof testImages] || '';
    });
  }

  /**
   * 네트워크 정보 초기화
   */
  private initializeNetworkInfo(): void {
    if ('connection' in navigator) {
      this.networkInfo = (navigator as unknown as { connection: NetworkConnection }).connection;
    }
  }

  /**
   * 최적 이미지 포맷 결정
   */
  public getBestImageFormat(options: ImageOptimizationOptions = {}): ImageFormat {
    if (!this.browserSupport) {
      logger.warn('브라우저 지원 정보가 없습니다. 기본 JPG 사용');
      return 'jpg';
    }

    // 강제 포맷 지정된 경우
    if (options.forceFormat && options.preferredFormat) {
      return options.preferredFormat;
    }

    // 네트워크 조건 고려
    if (options.considerNetworkCondition !== false && this.isSlowNetwork()) {
      // 느린 네트워크에서는 WebP 우선 (더 작은 용량)
      if (this.browserSupport.webp) return 'webp';
      return 'jpg';
    }

    // 최신 포맷부터 우선 순위
    if (this.browserSupport.avif) return 'avif';
    if (this.browserSupport.webp) return 'webp';

    return 'jpg'; // 폴백
  }

  /**
   * 느린 네트워크 조건 감지
   */
  private isSlowNetwork(): boolean {
    if (!this.networkInfo) return false;

    const slowConnectionTypes = ['slow-2g', '2g', '3g'];
    return slowConnectionTypes.includes(this.networkInfo.effectiveType || '');
  }

  /**
   * 트위터 이미지 URL을 최적 포맷으로 변환
   */
  public optimizeTwitterImageUrl(
    originalUrl: string,
    options: ImageOptimizationOptions = {}
  ): string {
    try {
      const url = new URL(originalUrl);

      // 트위터 도메인이 아닌 경우 원본 반환
      if (!url.hostname.includes('twimg.com')) {
        return originalUrl;
      }

      const bestFormat = this.getBestImageFormat(options);
      const quality = options.quality || 'large';

      // URL 파라미터 설정
      url.searchParams.set('format', bestFormat);
      url.searchParams.set('name', quality);

      const optimizedUrl = url.toString();

      logger.debug('이미지 URL 최적화:', {
        original: originalUrl,
        optimized: optimizedUrl,
        format: bestFormat,
        quality,
      });

      return optimizedUrl;
    } catch (error) {
      logger.error('이미지 URL 최적화 실패:', error);
      return originalUrl; // 폴백
    }
  }

  /**
   * 미디어 정보에 최적화된 URL 추가
   */
  public enhanceMediaInfo(mediaInfo: Record<string, unknown>): Record<string, unknown> {
    const originalUrl = mediaInfo.url as string;
    const optimizedUrl = this.optimizeTwitterImageUrl(originalUrl);

    return {
      ...mediaInfo,
      url: optimizedUrl,
      originalFormat: this.extractFormatFromUrl(originalUrl),
      optimizedFormat: this.extractFormatFromUrl(optimizedUrl),
      compressionSaved: optimizedUrl !== originalUrl,
    };
  }

  /**
   * URL에서 이미지 포맷 추출
   */
  private extractFormatFromUrl(url: string): ImageFormat {
    try {
      const urlObj = new URL(url);
      const format = urlObj.searchParams.get('format');

      if (format && ['webp', 'jpg', 'png', 'avif'].includes(format)) {
        return format as ImageFormat;
      }

      // URL 확장자에서 추출
      const pathFormat = url.match(/\.(jpg|jpeg|png|webp|avif)$/i)?.[1];
      if (pathFormat) {
        return pathFormat.toLowerCase() === 'jpeg'
          ? 'jpg'
          : (pathFormat.toLowerCase() as ImageFormat);
      }

      return 'jpg'; // 기본값
    } catch {
      return 'jpg';
    }
  }

  /**
   * 브라우저 지원 정보 반환
   */
  public getSupportInfo(): BrowserSupport | null {
    return this.browserSupport;
  }

  /**
   * 네트워크 정보 반환
   */
  public getNetworkInfo(): NetworkConnection | null {
    return this.networkInfo;
  }

  /**
   * 서비스 정리
   */
  public dispose(): void {
    this.browserSupport = null;
    this.networkInfo = null;
    WebPOptimizationService.instance = null;
  }
}

/**
 * 전역 WebP 최적화 서비스 인스턴스
 */
export const webpOptimizationService = WebPOptimizationService.getInstance();
