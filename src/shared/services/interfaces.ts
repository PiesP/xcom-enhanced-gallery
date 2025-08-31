/**
 * 서비스 의존성 주입을 위한 인터페이스 정의
 *
 * 이 파일은 서비스 간 결합도를 낮추고 테스트 가능성을 높이기 위해
 * 의존성 주입 패턴에 사용되는 인터페이스들을 정의합니다.
 */

/**
 * 로거 인터페이스
 */
export interface ILogger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: Error): void;
  debug(message: string, data?: unknown): void;
}

/**
 * 설정 관리 인터페이스
 */
export interface IConfigService {
  get<T>(key: string, defaultValue?: T): T;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
}

/**
 * 이벤트 관리 인터페이스
 */
export interface IEventManager {
  on<T>(event: string, handler: (data: T) => void): () => void;
  emit<T>(event: string, data: T): void;
  off(event: string, handler?: Function): void;
  once<T>(event: string, handler: (data: T) => void): () => void;
}

/**
 * 테마 서비스 인터페이스
 */
export interface IThemeService {
  getCurrentTheme(): string;
  setTheme(theme: string): void;
  onThemeChange(callback: (theme: string) => void): () => void;
}

/**
 * 언어 서비스 인터페이스
 */
export interface ILanguageService {
  getCurrentLanguage(): string;
  setLanguage(language: string): void;
  translate(path: string): string;
  onLanguageChange(callback: (language: string) => void): () => void;
}

/**
 * 상태 관리 인터페이스
 */
export interface IStateManager {
  getState<T>(key: string): T | undefined;
  setState<T>(key: string, value: T): void;
  subscribe<T>(key: string, callback: (value: T) => void): () => void;
}

/**
 * 토스트 컨트롤러 인터페이스
 */
export interface IToastController {
  show(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
  hide(id?: string): void;
  clear(): void;
}

/**
 * 애니메이션 서비스 인터페이스
 */
export interface IAnimationService {
  fadeIn(element: HTMLElement, duration?: number): Promise<void>;
  fadeOut(element: HTMLElement, duration?: number): Promise<void>;
  slideUp(element: HTMLElement, duration?: number): Promise<void>;
  slideDown(element: HTMLElement, duration?: number): Promise<void>;
}

/**
 * 재시도 관리자 인터페이스
 */
export interface IRetryManager {
  execute<T>(
    operation: () => Promise<T>,
    options?: {
      maxRetries?: number;
      delay?: number;
      backoff?: 'linear' | 'exponential';
    }
  ): Promise<T>;
}

/**
 * 서비스 팩토리 인터페이스
 */
export interface IServiceFactory<T> {
  create(): T;
  destroy(instance: T): void;
}

/**
 * 서비스 컨테이너 인터페이스
 */
export interface IServiceContainer {
  register<T>(key: string, factory: IServiceFactory<T>): void;
  resolve<T>(key: string): T;
  has(key: string): boolean;
}

/**
 * 기본 서비스 인터페이스
 */
export interface IBaseService {
  readonly name: string;
  readonly version: string;
  initialize(): Promise<void>;
  destroy(): Promise<void>;
}

/**
 * 의존성 주입이 가능한 서비스
 */
export interface IInjectableService extends IBaseService {
  readonly dependencies: string[];
}

/**
 * 생명주기를 가진 서비스
 */
export interface ILifecycleService extends IBaseService {
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  getStatus(): 'stopped' | 'starting' | 'running' | 'stopping';
}
