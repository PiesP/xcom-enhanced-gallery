/**
 * DI 패턴 적용을 위한 기본 서비스 구현체들
 *
 * 기존 서비스들에 의존성 주입 패턴을 빠르게 적용하기 위한 헬퍼 클래스들
 */

import type {
  ILogger,
  IEventManager,
  IConfigService,
  IStateManager,
  IAnimationService,
  IRetryManager,
  IBaseService,
} from './interfaces';

/**
 * 의존성 주입이 적용된 기본 서비스
 */
export abstract class BaseServiceWithDI implements IBaseService {
  abstract readonly name: string;
  abstract readonly version: string;

  constructor(
    protected readonly loggerService: ILogger,
    protected readonly eventManager?: IEventManager,
    protected readonly configService?: IConfigService
  ) {}

  abstract initialize(): Promise<void>;
  abstract destroy(): Promise<void>;
}

/**
 * 애니메이션 서비스 DI 구현체
 */
export class AnimationServiceDI extends BaseServiceWithDI implements IAnimationService {
  readonly name = 'AnimationService';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {
    this.loggerService.info('AnimationService initialized with DI');
  }

  async destroy(): Promise<void> {
    this.loggerService.info('AnimationService destroyed');
  }

  async fadeIn(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise(resolve => {
      element.style.opacity = '0';
      element.style.transition = `opacity ${duration}ms`;
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        setTimeout(resolve, duration);
      });
    });
  }

  async fadeOut(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms`;
      element.style.opacity = '0';
      setTimeout(resolve, duration);
    });
  }

  async slideUp(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise(resolve => {
      element.style.transition = `height ${duration}ms`;
      element.style.height = '0px';
      setTimeout(resolve, duration);
    });
  }

  async slideDown(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise(resolve => {
      element.style.transition = `height ${duration}ms`;
      element.style.height = 'auto';
      setTimeout(resolve, duration);
    });
  }
}

/**
 * 재시도 관리자 DI 구현체
 */
export class RetryManagerDI extends BaseServiceWithDI implements IRetryManager {
  readonly name = 'RetryManager';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {
    this.loggerService.info('RetryManager initialized with DI');
  }

  async destroy(): Promise<void> {
    this.loggerService.info('RetryManager destroyed');
  }

  async execute<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      delay?: number;
      backoff?: 'linear' | 'exponential';
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, delay = 1000, backoff = 'exponential' } = options;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        attempt++;

        if (attempt > maxRetries) {
          this.loggerService.error(`Operation failed after ${maxRetries} retries`, error as Error);
          throw error;
        }

        const waitTime = backoff === 'exponential' ? delay * Math.pow(2, attempt - 1) : delay;
        this.loggerService.warn(`Retry attempt ${attempt} after ${waitTime}ms`);

        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new Error('Unexpected retry loop exit');
  }
}

/**
 * 상태 관리자 DI 구현체
 */
export class StateManagerDI extends BaseServiceWithDI implements IStateManager {
  readonly name = 'StateManager';
  readonly version = '1.0.0';

  private readonly state = new Map<string, unknown>();
  private readonly subscribers = new Map<string, Set<(value: unknown) => void>>();

  async initialize(): Promise<void> {
    this.loggerService.info('StateManager initialized with DI');
  }

  async destroy(): Promise<void> {
    this.state.clear();
    this.subscribers.clear();
    this.loggerService.info('StateManager destroyed');
  }

  getState<T>(key: string): T | undefined {
    return this.state.get(key) as T | undefined;
  }

  setState<T>(key: string, value: T): void {
    this.state.set(key, value);

    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach(callback => callback(value));
    }
  }

  subscribe<T>(key: string, callback: (value: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    const keySubscribers = this.subscribers.get(key)!;
    keySubscribers.add(callback as (value: unknown) => void);

    return () => {
      keySubscribers.delete(callback as (value: unknown) => void);
      if (keySubscribers.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }
}
