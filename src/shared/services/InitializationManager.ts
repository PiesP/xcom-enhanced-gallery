/**
 * @fileoverview Application Initialization Manager (Phase 4.1 GREEN)
 * @description 초기화 순서 명확화 및 에러 처리 통일
 */

import { logger } from '@shared/logging';

/**
 * 초기화 단계 정의
 */
export enum InitializationPhase {
  VENDOR = 'vendor',
  STYLES = 'styles',
  APP = 'app',
}

/**
 * 초기화 상태 인터페이스
 */
export interface InitializationStatus {
  phase: InitializationPhase;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  error?: Error;
}

/**
 * 초기화 관리자 클래스
 */
export class InitializationManager {
  private status: InitializationStatus[] = [];
  private readonly isDevelopment: boolean;

  constructor(isDevelopment = false) {
    this.isDevelopment = isDevelopment;
  }

  /**
   * 안전한 초기화 실행
   */
  async safeInit(initFn: () => Promise<void>, phase: InitializationPhase): Promise<boolean> {
    this.trackStatus(phase, 'pending');

    try {
      await initFn();
      this.trackStatus(phase, 'success');
      return true;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.trackStatus(phase, 'failed', errorObj);
      logger.warn(`${phase} initialization failed:`, errorObj);
      return false;
    }
  }

  /**
   * Fallback이 있는 초기화
   */
  async initWithFallback(
    primary: () => Promise<void>,
    fallback: () => Promise<void>,
    phase: InitializationPhase
  ): Promise<void> {
    try {
      await primary();
      this.trackStatus(phase, 'success');
    } catch {
      logger.warn(`${phase} primary initialization failed, using fallback`);
      await fallback();
      this.trackStatus(phase, 'success');
    }
  }

  /**
   * 의존성 기반 초기화 시퀀스
   */
  async initializeSequentially(): Promise<boolean> {
    const sequence = [
      {
        phase: InitializationPhase.VENDOR,
        init: this.initializeVendors.bind(this),
        dependencies: [],
      },
      {
        phase: InitializationPhase.STYLES,
        init: this.initializeStyles.bind(this),
        dependencies: [InitializationPhase.VENDOR],
      },
      {
        phase: InitializationPhase.APP,
        init: this.initializeApp.bind(this),
        dependencies: [InitializationPhase.VENDOR, InitializationPhase.STYLES],
      },
    ];

    for (const step of sequence) {
      // 의존성 검사
      const dependenciesMet = step.dependencies.every(dep => this.isPhaseSuccessful(dep));

      if (!dependenciesMet) {
        logger.error(`Dependencies not met for ${step.phase}`);
        return false;
      }

      const success = await this.safeInit(step.init, step.phase);
      if (!success) {
        logger.error(`Failed to initialize ${step.phase}`);
        return false;
      }
    }

    return true;
  }

  /**
   * 특정 Phase가 성공했는지 확인
   */
  private isPhaseSuccessful(phase: InitializationPhase): boolean {
    const phaseStatus = this.status.find(s => s.phase === phase);
    return phaseStatus?.status === 'success';
  }

  /**
   * 상태 추적
   */
  private trackStatus(
    phase: InitializationPhase,
    status: 'pending' | 'success' | 'failed',
    error?: Error
  ): void {
    const existingIndex = this.status.findIndex(s => s.phase === phase);
    const statusItem: InitializationStatus = {
      phase,
      status,
      timestamp: Date.now(),
      error,
    };

    if (existingIndex >= 0) {
      this.status[existingIndex] = statusItem;
    } else {
      this.status.push(statusItem);
    }

    if (this.isDevelopment) {
      this.logStatus();
    }
  }

  /**
   * 개발 환경에서 상태 시각화
   */
  private logStatus(): void {
    const statusSummary = this.status.map(s => `${s.phase}: ${s.status}`).join(', ');

    logger.info(`Initialization Status: ${statusSummary}`);
  }

  /**
   * 상태 리포트 생성
   */
  getStatusReport(): string {
    return this.status
      .map(s => {
        const time = new Date(s.timestamp).toLocaleTimeString();
        const error = s.error ? ` (${s.error.message})` : '';
        return `[${time}] ${s.phase}: ${s.status}${error}`;
      })
      .join('\n');
  }

  // ===========================================
  // 실제 초기화 메서드들 (구현 예시)
  // ===========================================

  /**
   * Vendor 초기화
   */
  private async initializeVendors(): Promise<void> {
    const { StaticVendorManager } = await import('@shared/external/vendors/vendor-manager-static');
    const vendorManager = StaticVendorManager.getInstance();
    await vendorManager.initialize();
  }

  /**
   * 스타일 초기화
   */
  private async initializeStyles(): Promise<void> {
    const { initializeNamespacedStyles } = await import('@shared/styles/namespaced-styles');
    initializeNamespacedStyles();
  }

  /**
   * 앱 초기화
   */
  private async initializeApp(): Promise<void> {
    // 서비스 초기화
    const { registerCoreServices } = await import('@shared/services/service-initialization');
    await registerCoreServices();

    // 기본 설정
    logger.info('App initialization completed');
  }
}
