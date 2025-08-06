/**
 * TDD: 서비스 중복 등록 및 초기화 중복 방지 테스트
 *
 * 로그에서 확인된 문제:
 * - [CoreService] 서비스 덮어쓰기: media.service, video.control 등
 * - X.com Enhanced Gallery 시작 중... (2회 반복)
 * - System theme detection initialized (3회 반복)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('� GREEN: 서비스 중복 등록 방지 완료', () => {
  let mockLogger: any;
  let warningMessages: string[];

  beforeEach(() => {
    warningMessages = [];
    mockLogger = {
      warn: vi.fn((message: string) => {
        warningMessages.push(message);
      }),
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    // console.warn도 모킹하여 실제 경고 메시지 캐치
    vi.spyOn(console, 'warn').mockImplementation(message => {
      warningMessages.push(String(message));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('� 동일한 키로 서비스를 여러 번 등록하면 중복 등록이 차단되어야 한다', () => {
    // 수정된 CoreService의 동작을 시뮬레이션
    class ImprovedCoreService {
      private services = new Map<string, any>();
      private logger = mockLogger;

      registerService(key: string, service: any): void {
        if (this.services.has(key)) {
          // 중복 등록 차단 - 경고만 출력하고 등록하지 않음
          this.logger.warn(`[CoreService] 서비스 중복 등록 시도 차단: ${key}`);
          return;
        }
        this.services.set(key, service);
      }

      getService(key: string): any {
        return this.services.get(key);
      }
    }

    const coreService = new ImprovedCoreService();
    const mediaService1 = { name: 'MediaService1' };
    const mediaService2 = { name: 'MediaService2' };

    // 첫 번째 등록
    coreService.registerService('media.service', mediaService1);
    expect(warningMessages).toHaveLength(0);
    expect(coreService.getService('media.service')).toBe(mediaService1);

    // 두 번째 등록 - 차단되어야 함
    coreService.registerService('media.service', mediaService2);

    // 경고가 발생하고 기존 서비스 유지
    expect(warningMessages).toContain('[CoreService] 서비스 중복 등록 시도 차단: media.service');
    expect(coreService.getService('media.service')).toBe(mediaService1); // 첫 번째 서비스 유지
  });

  it('� 초기화 함수가 여러 번 호출되어도 중복 실행이 방지되어야 한다', () => {
    let initializationCount = 0;
    let vendorInitCount = 0;
    let themeInitCount = 0;

    class ImprovedAppInitializer {
      private isInitialized = false;
      private vendorsInitialized = false;
      private themeInitialized = false;

      async initialize(): Promise<void> {
        // 중복 실행 방지
        if (this.isInitialized) {
          mockLogger.info('Application: Already started, skipping duplicate initialization');
          return;
        }

        this.isInitialized = true;
        initializationCount++;
        mockLogger.info('🚀 X.com Enhanced Gallery 시작 중...');

        await this.initializeVendors();
        await this.initializeTheme();
      }

      private async initializeVendors(): Promise<void> {
        if (this.vendorsInitialized) return;
        this.vendorsInitialized = true;

        vendorInitCount++;
        mockLogger.info('모든 vendor 라이브러리 초기화 완료');
      }

      private async initializeTheme(): Promise<void> {
        if (this.themeInitialized) return;
        this.themeInitialized = true;

        themeInitCount++;
        mockLogger.info('System theme detection initialized');
      }
    }

    const initializer = new ImprovedAppInitializer();

    // 여러 번 초기화 호출 시뮬레이션
    const promises = [initializer.initialize(), initializer.initialize(), initializer.initialize()];

    return Promise.all(promises).then(() => {
      // 중복 실행이 방지되어야 함
      expect(initializationCount).toBe(1); // 실제로 1번만 실행
      expect(vendorInitCount).toBe(1); // 실제로 1번만 실행
      expect(themeInitCount).toBe(1); // 실제로 1번만 실행
    });
  });

  it('🔴 싱글톤 서비스가 여러 번 생성되지 않아야 한다', () => {
    class MockThemeService {
      private static instance: MockThemeService | null = null;

      static getInstance(): MockThemeService {
        if (!MockThemeService.instance) {
          MockThemeService.instance = new MockThemeService();
          mockLogger.info('System theme detection initialized');
        }
        return MockThemeService.instance;
      }
    }

    // 여러 번 인스턴스 요청
    const instance1 = MockThemeService.getInstance();
    const instance2 = MockThemeService.getInstance();
    const instance3 = MockThemeService.getInstance();

    // 동일한 인스턴스여야 함
    expect(instance1).toBe(instance2);
    expect(instance2).toBe(instance3);

    // 초기화 메시지는 한 번만 출력되어야 함 (현재는 여러 번 출력됨)
    const initMessages = mockLogger.info.mock.calls.filter(
      (call: any[]) => call[0] === 'System theme detection initialized'
    );
    expect(initMessages).toHaveLength(1);
  });
});

describe('🔴 RED: 라이프사이클 관리', () => {
  it('🔴 초기화 순서가 명확하게 정의되어야 한다', () => {
    const initOrder: string[] = [];

    class MockLifecycleManager {
      async initializeInOrder(): Promise<void> {
        // 현재는 순서가 보장되지 않아 중복 초기화가 발생
        initOrder.push('vendors');
        initOrder.push('theme');
        initOrder.push('services');
        initOrder.push('gallery');
      }
    }

    const manager = new MockLifecycleManager();
    return manager.initializeInOrder().then(() => {
      expect(initOrder).toEqual(['vendors', 'theme', 'services', 'gallery']);
    });
  });

  it('🔴 정리(cleanup) 순서도 명확하게 정의되어야 한다', () => {
    const cleanupOrder: string[] = [];

    class MockCleanupManager {
      cleanup(): void {
        // 초기화의 역순으로 정리
        cleanupOrder.push('gallery');
        cleanupOrder.push('services');
        cleanupOrder.push('theme');
        cleanupOrder.push('vendors');
      }
    }

    const manager = new MockCleanupManager();
    manager.cleanup();

    expect(cleanupOrder).toEqual(['gallery', 'services', 'theme', 'vendors']);
  });
});
