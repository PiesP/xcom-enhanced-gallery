/**
 * @fileoverview 통합 생명주기 조정자
 * @version 1.0.0
 *
 * 모든 서비스의 생명주기를 통합 관리하여 초기화/정리 순서를 보장합니다.
 */

import { Singleton } from '@core/patterns/Singleton';
import { logger } from '@infrastructure/logging/logger';
import { appConfig } from '@core/config/AppConfig';
import { resourceManager } from '@infrastructure/managers';
import { memoryTracker } from '@infrastructure/memory/MemoryTracker';

/**
 * 생명주기 상태
 */
export type LifecycleState =
  | 'uninitialized'
  | 'initializing'
  | 'initialized'
  | 'destroying'
  | 'destroyed';

/**
 * 관리 대상 서비스 인터페이스
 */
export interface ManagedService {
  name: string;
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  getStatus(): Record<string, unknown>;
}

/**
 * 초기화 결과
 */
export interface InitializationResult {
  success: boolean;
  initialized: string[];
  failed: string[];
  errors: Array<{ service: string; error: Error }>;
}

/**
 * 통합 생명주기 조정자
 *
 * 모든 서비스의 초기화와 정리를 순서대로 관리합니다.
 */
export class LifecycleCoordinator extends Singleton<LifecycleCoordinator> {
  private state: LifecycleState = 'uninitialized';
  private readonly services: ManagedService[] = [];
  private initializationOrder: string[] = [];
  private cleanupOrder: string[] = [];

  protected constructor() {
    super();
    this.setupDefaultServices();
    this.setupCleanupHandlers();
  }

  /**
   * 기본 서비스들 설정
   */
  private setupDefaultServices(): void {
    // 기본 서비스 순서: 설정 → 리소스 → 메모리 → 이벤트 → 갤러리
    this.initializationOrder = [
      'AppConfig',
      'ResourceManager',
      'MemoryTracker',
      'EventCoordinator',
      'MediaExtractor',
      'GalleryRenderer',
    ];

    // 정리는 역순
    this.cleanupOrder = [...this.initializationOrder].reverse();
  }

  /**
   * 정리 핸들러 설정
   */
  private setupCleanupHandlers(): void {
    // 페이지 언로드 시 자동 정리
    window.addEventListener('beforeunload', () => {
      if (this.state === 'initialized') {
        // 동기적으로 빠른 정리만 수행
        this.emergencyCleanup();
      }
    });

    // 에러 발생 시 자동 정리
    window.addEventListener('error', event => {
      logger.error('[LifecycleCoordinator] Global error detected:', event.error);
      if (this.state === 'initialized') {
        this.cleanup().catch(error => {
          logger.error('[LifecycleCoordinator] Cleanup after error failed:', error);
        });
      }
    });
  }

  /**
   * 서비스 등록
   */
  public registerService(service: ManagedService): void {
    if (this.state !== 'uninitialized') {
      logger.warn(
        `[LifecycleCoordinator] Cannot register service ${service.name} after initialization`
      );
      return;
    }

    this.services.push(service);
    logger.debug(`[LifecycleCoordinator] Registered service: ${service.name}`);
  }

  /**
   * 애플리케이션 초기화
   */
  public async initialize(): Promise<InitializationResult> {
    if (this.state !== 'uninitialized') {
      logger.warn('[LifecycleCoordinator] Already initialized or in progress');
      return {
        success: false,
        initialized: [],
        failed: [],
        errors: [{ service: 'LifecycleCoordinator', error: new Error('Already initialized') }],
      };
    }

    this.state = 'initializing';
    logger.info('[LifecycleCoordinator] Starting application initialization');

    const initialized: string[] = [];
    const failed: string[] = [];
    const errors: Array<{ service: string; error: Error }> = [];

    try {
      // 1. 설정 시스템 초기화
      logger.debug('[LifecycleCoordinator] Initializing AppConfig');
      if (!appConfig.validateConfig()) {
        logger.warn('[LifecycleCoordinator] Invalid configuration detected, resetting to defaults');
        appConfig.resetToDefaults();
      }
      initialized.push('AppConfig');

      // 2. 리소스 관리자 초기화 (이미 싱글톤으로 초기화됨)
      logger.debug('[LifecycleCoordinator] ResourceManager ready');
      initialized.push('ResourceManager');

      // 3. 메모리 추적기 초기화
      logger.debug('[LifecycleCoordinator] Initializing MemoryTracker');
      memoryTracker.logMemoryInfo();
      initialized.push('MemoryTracker');

      // 4. 등록된 서비스들 초기화 (순서대로)
      for (const serviceName of this.initializationOrder) {
        const service = this.services.find(s => s.name === serviceName);
        if (!service) {
          logger.debug(`[LifecycleCoordinator] Service ${serviceName} not registered, skipping`);
          continue;
        }

        try {
          logger.debug(`[LifecycleCoordinator] Initializing ${service.name}`);
          await service.initialize();
          initialized.push(service.name);
          logger.info(`✅ [LifecycleCoordinator] ${service.name} initialized successfully`);
        } catch (error) {
          const serviceError = error instanceof Error ? error : new Error(String(error));
          logger.error(
            `❌ [LifecycleCoordinator] ${service.name} initialization failed:`,
            serviceError
          );
          failed.push(service.name);
          errors.push({ service: service.name, error: serviceError });
        }
      }

      const success = failed.length === 0;
      this.state = success ? 'initialized' : 'uninitialized';

      logger.info(`[LifecycleCoordinator] Initialization ${success ? 'completed' : 'failed'}:`, {
        initialized: initialized.length,
        failed: failed.length,
        total: this.services.length + 3, // +3 for core services
      });

      return { success, initialized, failed, errors };
    } catch (error) {
      this.state = 'uninitialized';
      const initError = error instanceof Error ? error : new Error(String(error));
      logger.error('[LifecycleCoordinator] Critical initialization error:', initError);

      return {
        success: false,
        initialized,
        failed: ['LifecycleCoordinator'],
        errors: [{ service: 'LifecycleCoordinator', error: initError }],
      };
    }
  }

  /**
   * 애플리케이션 정리
   */
  public async cleanup(): Promise<void> {
    if (this.state === 'destroying' || this.state === 'destroyed') {
      logger.warn('[LifecycleCoordinator] Cleanup already in progress or completed');
      return;
    }

    if (this.state !== 'initialized') {
      logger.warn('[LifecycleCoordinator] Cannot cleanup: not initialized');
      return;
    }

    this.state = 'destroying';
    logger.info('[LifecycleCoordinator] Starting application cleanup');

    try {
      // 등록된 서비스들 정리 (역순)
      for (const serviceName of this.cleanupOrder) {
        const service = this.services.find(s => s.name === serviceName);
        if (!service) continue;

        try {
          logger.debug(`[LifecycleCoordinator] Cleaning up ${service.name}`);
          await service.cleanup();
          logger.info(`✅ [LifecycleCoordinator] ${service.name} cleaned up successfully`);
        } catch (error) {
          logger.error(`❌ [LifecycleCoordinator] ${service.name} cleanup failed:`, error);
        }
      }

      // 핵심 시스템 정리
      logger.debug('[LifecycleCoordinator] Cleaning up core systems');

      // 리소스 관리자 정리
      resourceManager.cleanup();

      // 메모리 정리
      memoryTracker.checkAndCleanup(true);

      this.state = 'destroyed';
      logger.info('✅ [LifecycleCoordinator] Application cleanup completed');
    } catch (error) {
      logger.error('❌ [LifecycleCoordinator] Critical cleanup error:', error);
      this.state = 'destroyed'; // 상태만 변경
    }
  }

  /**
   * 비상 정리 (동기적, 빠른 정리만)
   */
  private emergencyCleanup(): void {
    try {
      logger.warn('[LifecycleCoordinator] Emergency cleanup triggered');

      // 동기적으로 처리 가능한 정리만 수행
      resourceManager.cleanup();

      logger.info('[LifecycleCoordinator] Emergency cleanup completed');
    } catch (error) {
      logger.error('[LifecycleCoordinator] Emergency cleanup failed:', error);
    }
  }

  /**
   * 애플리케이션 재시작
   */
  public async restart(): Promise<InitializationResult> {
    logger.info('[LifecycleCoordinator] Restarting application');

    if (this.state === 'initialized') {
      await this.cleanup();
    }

    // 잠시 대기 후 다시 초기화
    await new Promise(resolve => setTimeout(resolve, 100));

    return this.initialize();
  }

  /**
   * 상태 정보 조회
   */
  public getStatus(): {
    state: LifecycleState;
    services: Array<{ name: string; status: Record<string, unknown> }>;
    config: Record<string, unknown>;
    resources: Record<string, unknown>;
    memory: Record<string, unknown>;
  } {
    return {
      state: this.state,
      services: this.services.map(service => ({
        name: service.name,
        status: service.getStatus(),
      })),
      config: appConfig.getDebugInfo(),
      resources: resourceManager.getDebugInfo(),
      memory: {
        usage: memoryTracker.getMemoryUsageMB(),
        status: memoryTracker.getMemoryStatus(),
      },
    };
  }

  /**
   * 현재 상태 조회
   */
  public getCurrentState(): LifecycleState {
    return this.state;
  }

  /**
   * 초기화 완료 여부
   */
  public isInitialized(): boolean {
    return this.state === 'initialized';
  }
}

// 싱글톤 인스턴스 export
// @ts-expect-error Protected constructor compatibility
export const lifecycleCoordinator = LifecycleCoordinator.getInstance();
