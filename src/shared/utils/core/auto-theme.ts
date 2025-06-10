/**
 * Auto Theme Controller for X.com Enhanced Gallery
 * @version 1.0.0
 *
 * @description
 * 자동 색조 선택 및 적응형 테마 시스템을 제어하는 TypeScript 모듈입니다.
 * 시간대, 시스템 설정, 콘텐츠 분석을 통해 최적의 테마를 자동으로 적용합니다.
 *
 * @features
 * - 시간대 기반 자동 테마 전환
 * - 이미지 색상 분석 및 적응
 * - 시스템 설정 감지 및 적용
 * - 부드러운 테마 전환 애니메이션
 * - 성능 최적화된 색상 계산
 */

export interface ThemeConfig {
  /** 자동 테마 활성화 여부 */
  enabled: boolean;
  /** 시간대 기반 테마 전환 활성화 */
  timeBasedTheme: boolean;
  /** 콘텐츠 기반 색상 적응 활성화 */
  contentBasedTheme: boolean;
  /** 테마 전환 애니메이션 지속 시간 (ms) */
  transitionDuration: number;
  /** 디버그 모드 활성화 */
  debug: boolean;
}

export interface ColorProfile {
  /** 주요 색상 */
  primary: string;
  /** 배경 색상 */
  background: string;
  /** 텍스트 색상 */
  text: string;
  /** 강조 색상 */
  accent: string;
  /** 색온도 (K) */
  temperature: number;
}

export interface ImageColorAnalysis {
  /** 주요 색상들 */
  dominantColors: string[];
  /** 평균 밝기 (0-1) */
  brightness: number;
  /** 색상 채도 (0-1) */
  saturation: number;
  /** 색온도 분류 */
  temperatureCategory: 'warm' | 'cool' | 'neutral';
  /** 생동감 수준 (0-1) */
  vibrancy: number;
}

/**
 * 자동 테마 컨트롤러 클래스
 */
export class AutoThemeController {
  private static instance: AutoThemeController;
  private config: ThemeConfig;
  private currentTheme: string = 'auto';
  private timeCheckInterval: number | null = null;
  private transitionTimeout: number | null = null;

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): AutoThemeController {
    AutoThemeController.instance ??= new AutoThemeController();
    return AutoThemeController.instance;
  }

  private constructor() {
    this.config = {
      enabled: true,
      timeBasedTheme: true,
      contentBasedTheme: true,
      transitionDuration: 600,
      debug: false,
    };

    this.initialize();
  }

  /**
   * 테마 시스템 초기화
   */
  private initialize(): void {
    this.log('Initializing auto theme system...');

    // 시스템 테마 감지 리스너 등록
    this.watchSystemTheme();

    // 시간대 기반 테마 체크 시작
    if (this.config.timeBasedTheme) {
      this.startTimeBasedThemeCheck();
    }

    // 초기 테마 적용
    this.applyAutoTheme();

    this.log('Auto theme system initialized');
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<ThemeConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.timeBasedTheme) {
      this.startTimeBasedThemeCheck();
    } else {
      this.stopTimeBasedThemeCheck();
    }

    this.log('Theme config updated:', this.config);
  }

  /**
   * 시스템 테마 변경 감지
   */
  private watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleThemeChange = (e: MediaQueryListEvent): void => {
      this.log('System theme changed:', e.matches ? 'dark' : 'light');
      if (this.config.enabled) {
        this.applyAutoTheme();
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleThemeChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleThemeChange);
    }
  }

  /**
   * 시간대 기반 테마 체크 시작
   */
  private startTimeBasedThemeCheck(): void {
    this.stopTimeBasedThemeCheck();

    // 매 30분마다 체크
    this.timeCheckInterval = window.setInterval(
      () => {
        if (this.config.enabled && this.config.timeBasedTheme) {
          this.applyTimeBasedTheme();
        }
      },
      30 * 60 * 1000
    );

    // 즉시 한 번 적용
    this.applyTimeBasedTheme();
  }

  /**
   * 시간대 기반 테마 체크 중지
   */
  private stopTimeBasedThemeCheck(): void {
    if (this.timeCheckInterval) {
      clearInterval(this.timeCheckInterval);
      this.timeCheckInterval = null;
    }
  }

  /**
   * 현재 시간에 따른 테마 적용
   */
  private applyTimeBasedTheme(): void {
    const hour = new Date().getHours();
    let timeTheme: string;

    if (hour >= 6 && hour < 10) {
      timeTheme = 'morning';
    } else if (hour >= 10 && hour < 17) {
      timeTheme = 'day';
    } else if (hour >= 17 && hour < 20) {
      timeTheme = 'evening';
    } else {
      timeTheme = 'night';
    }

    this.applyThemeClass(`xeg-theme-auto-${timeTheme}`);
    this.log(`Applied time-based theme: ${timeTheme} (hour: ${hour})`);
  }

  /**
   * 자동 테마 적용
   */
  private applyAutoTheme(): void {
    if (!this.config.enabled) {
      return;
    }

    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const baseTheme = systemPrefersDark ? 'dark' : 'light';

    // 기본 테마 클래스 적용
    document.documentElement.classList.toggle('xeg-theme-dark', systemPrefersDark);
    document.documentElement.classList.toggle('xeg-theme-light', !systemPrefersDark);

    // 전환 애니메이션 활성화
    this.enableTransition();

    this.log(`Applied auto theme: ${baseTheme}`);
  }

  /**
   * 이미지 기반 색상 분석 및 테마 적응
   */
  public async analyzeImageAndAdaptTheme(imageElement: HTMLImageElement): Promise<void> {
    if (!this.config.enabled || !this.config.contentBasedTheme) {
      return;
    }

    try {
      const analysis = await this.analyzeImageColors(imageElement);
      const contentTheme = this.determineContentTheme(analysis);

      this.applyThemeClass(`xeg-content-${contentTheme}`);
      this.log('Applied content-based theme:', contentTheme, analysis);
    } catch (error) {
      this.log('Error analyzing image colors:', error);
    }
  }

  /**
   * 이미지 색상 분석
   */
  private async analyzeImageColors(imageElement: HTMLImageElement): Promise<ImageColorAnalysis> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // 이미지 로드 완료 확인
        const analyzeWhenReady = (): void => {
          try {
            // 성능을 위해 작은 크기로 샘플링
            const sampleSize = 100;
            canvas.width = sampleSize;
            canvas.height = sampleSize;

            ctx.drawImage(imageElement, 0, 0, sampleSize, sampleSize);
            const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
            const pixels = imageData.data;

            const analysis = this.performColorAnalysis(pixels);
            resolve(analysis);
          } catch (error) {
            reject(error);
          }
        };

        if (imageElement.complete) {
          analyzeWhenReady();
        } else {
          imageElement.addEventListener('load', analyzeWhenReady, {
            once: true,
          });
          imageElement.addEventListener(
            'error',
            () => {
              reject(new Error('Image load failed'));
            },
            { once: true }
          );
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 픽셀 데이터로부터 색상 분석 수행
   */
  private performColorAnalysis(pixels: Uint8ClampedArray): ImageColorAnalysis {
    const colorMap = new Map<string, number>();
    let totalBrightness = 0;
    let totalSaturation = 0;
    let warmColors = 0;
    let coolColors = 0;
    const pixelCount = pixels.length / 4;

    // 픽셀 데이터 분석
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // 투명한 픽셀 제외
      if (a < 128) {
        continue;
      }

      // 밝기 계산 (relative luminance)
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      totalBrightness += brightness;

      // HSL 변환으로 채도 계산
      const hsl = this.rgbToHsl(r, g, b);
      totalSaturation += hsl.s;

      // 색온도 분류 (간단한 휴리스틱)
      if (r > g && r > b) {
        warmColors++; // 빨간색 계열
      } else if (b > r && b > g) {
        coolColors++; // 파란색 계열
      }

      // 주요 색상 카운트 (16진수로 변환)
      const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      const quantizedColor = this.quantizeColor(hexColor);
      colorMap.set(quantizedColor, (colorMap.get(quantizedColor) ?? 0) + 1);
    }

    // 결과 계산
    const avgBrightness = totalBrightness / pixelCount;
    const avgSaturation = totalSaturation / pixelCount;

    // 주요 색상 추출 (상위 5개)
    const dominantColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);

    // 색온도 분류
    let temperatureCategory: 'warm' | 'cool' | 'neutral';
    if (warmColors > coolColors * 1.5) {
      temperatureCategory = 'warm';
    } else if (coolColors > warmColors * 1.5) {
      temperatureCategory = 'cool';
    } else {
      temperatureCategory = 'neutral';
    }

    // 생동감 계산 (채도와 색상 다양성 기반)
    const vibrancy = Math.min(avgSaturation * (colorMap.size / 20), 1);

    return {
      dominantColors,
      brightness: avgBrightness,
      saturation: avgSaturation,
      temperatureCategory,
      vibrancy,
    };
  }

  /**
   * RGB를 HSL로 변환
   */
  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    const l = (max + min) / 2;

    if (diff === 0) {
      return { h: 0, s: 0, l };
    }

    const s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    let h: number;
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;

    return { h, s, l };
  }

  /**
   * 색상 양자화 (비슷한 색상 그룹화)
   */
  private quantizeColor(hexColor: string): string {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // 32단계로 양자화
    const quantizedR = Math.round(r / 32) * 32;
    const quantizedG = Math.round(g / 32) * 32;
    const quantizedB = Math.round(b / 32) * 32;

    return `#${quantizedR.toString(16).padStart(2, '0')}${quantizedG
      .toString(16)
      .padStart(2, '0')}${quantizedB.toString(16).padStart(2, '0')}`;
  }

  /**
   * 색상 분석 결과로부터 콘텐츠 테마 결정
   */
  private determineContentTheme(analysis: ImageColorAnalysis): string {
    const { temperatureCategory, vibrancy, saturation } = analysis;

    // 생동감이 높으면 vibrant 테마
    if (vibrancy > 0.7 && saturation > 0.5) {
      return 'vibrant';
    }

    // 색온도에 따른 분류
    if (temperatureCategory === 'warm') {
      return 'warm';
    } else if (temperatureCategory === 'cool') {
      return 'cool';
    } else {
      return 'neutral';
    }
  }

  /**
   * 테마 클래스 적용
   */
  private applyThemeClass(className: string): void {
    if (this.currentTheme === className) {
      return;
    }

    this.enableTransition();

    // 기존 자동 테마 클래스 제거
    document.documentElement.classList.forEach(cls => {
      if (cls.startsWith('xeg-theme-auto-') || cls.startsWith('xeg-content-')) {
        document.documentElement.classList.remove(cls);
      }
    });

    // 새 테마 클래스 적용
    document.documentElement.classList.add(className);
    this.currentTheme = className;

    this.log(`Applied theme class: ${className}`);
  }

  /**
   * 전환 애니메이션 활성화
   */
  private enableTransition(): void {
    document.documentElement.classList.add('xeg-auto-theme-transition');

    // 전환 완료 후 클래스 제거
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }

    this.transitionTimeout = window.setTimeout(() => {
      document.documentElement.classList.remove('xeg-auto-theme-transition');
    }, this.config.transitionDuration);
  }

  /**
   * 수동 테마 설정
   */
  public setManualTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.currentTheme = theme;

    // 자동 테마 클래스 모두 제거
    document.documentElement.classList.forEach(cls => {
      if (cls.startsWith('xeg-theme-')) {
        document.documentElement.classList.remove(cls);
      }
    });

    if (theme === 'auto') {
      this.applyAutoTheme();
    } else {
      document.documentElement.classList.add(`xeg-theme-${theme}`);
    }

    this.log(`Manual theme set: ${theme}`);
  }

  /**
   * 현재 테마 정보 반환
   */
  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  /**
   * 디버그 로그 출력
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.warn('[AutoTheme]', ...args);
    }
  }

  /**
   * 정리 (메모리 누수 방지)
   */
  public destroy(): void {
    this.stopTimeBasedThemeCheck();

    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }

    document.documentElement.classList.remove('xeg-auto-theme-transition');
    this.log('Auto theme system destroyed');
  }
}

/**
 * 갤러리와 연동하는 헬퍼 함수들
 */
export const autoThemeHelpers = {
  /**
   * 갤러리 오픈 시 자동 테마 적용
   */
  onGalleryOpen(firstImage?: HTMLImageElement): void {
    const controller = AutoThemeController.getInstance();

    if (firstImage) {
      controller.analyzeImageAndAdaptTheme(firstImage);
    }
  },

  /**
   * 이미지 변경 시 테마 업데이트
   */
  onImageChange(imageElement: HTMLImageElement): void {
    const controller = AutoThemeController.getInstance();
    controller.analyzeImageAndAdaptTheme(imageElement);
  },

  /**
   * 갤러리 닫기 시 테마 리셋
   */
  onGalleryClose(): void {
    // 콘텐츠 기반 테마 클래스만 제거
    document.documentElement.classList.forEach(cls => {
      if (cls.startsWith('xeg-content-')) {
        document.documentElement.classList.remove(cls);
      }
    });
  },

  /**
   * 테마 설정 업데이트
   */
  updateSettings(config: Partial<ThemeConfig>): void {
    const controller = AutoThemeController.getInstance();
    controller.updateConfig(config);
  },

  /**
   * 현재 테마 정보 반환
   */
  getCurrentTheme(): string {
    const controller = AutoThemeController.getInstance();
    return controller.getCurrentTheme();
  },
};

// 전역 객체에 등록 (디버깅 용도)
if (typeof window !== 'undefined') {
  interface WindowWithXegAutoTheme extends Window {
    xegAutoTheme?: {
      controller: AutoThemeController;
      helpers: typeof autoThemeHelpers;
    };
  }

  (window as WindowWithXegAutoTheme).xegAutoTheme = {
    controller: AutoThemeController.getInstance(),
    helpers: autoThemeHelpers,
  };
}
