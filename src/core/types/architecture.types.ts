/**
 * @fileoverview Architecture Core Types
 * @version 1.0.0
 *
 * Clean Architecture 패턴의 핵심 아키텍처 타입들을 정의합니다.
 * 모든 레이어에서 사용되는 기본 아키텍처 인터페이스들을 포함합니다.
 */

// ================================
// Domain Entity Interfaces
// ================================

/**
 * 도메인 엔티티의 기본 인터페이스
 * 모든 비즈니스 엔티티는 이 인터페이스를 구현해야 합니다.
 */
export interface DomainEntity {
  /** 엔티티의 고유 식별자 */
  readonly id: string;

  /** 엔티티 생성 시간 */
  readonly createdAt: Date;

  /** 엔티티 수정 시간 */
  readonly updatedAt: Date;

  /** 엔티티 검증 */
  isValid(): boolean;

  /** 엔티티를 JSON으로 직렬화 */
  toJSON(): Record<string, unknown>;
}

/**
 * 값 객체의 기본 인터페이스
 * 변경 불가능한 값들을 표현하는 데 사용됩니다.
 */
export interface ValueObject<T> {
  /** 값 객체의 실제 값 */
  readonly value: T;

  /** 다른 값 객체와의 동등성 비교 */
  equals(other: ValueObject<T>): boolean;

  /** 값 객체 검증 */
  isValid(): boolean;

  /** 문자열 표현 */
  toString(): string;
}

// ================================
// Repository Pattern Interfaces
// ================================

/**
 * 리포지토리 패턴의 기본 인터페이스
 * 데이터 접근 로직을 캡슐화합니다.
 */
export interface Repository<TEntity extends DomainEntity, TId = string> {
  /** 엔티티 조회 */
  findById(id: TId): Promise<TEntity | null>;

  /** 모든 엔티티 조회 */
  findAll(): Promise<TEntity[]>;

  /** 조건부 엔티티 조회 */
  findBy(criteria: Partial<TEntity>): Promise<TEntity[]>;

  /** 엔티티 저장 */
  save(entity: TEntity): Promise<TEntity>;

  /** 엔티티 삭제 */
  delete(id: TId): Promise<void>;

  /** 엔티티 존재 여부 확인 */
  exists(id: TId): Promise<boolean>;
}

// ================================
// Use Case Interfaces
// ================================

/**
 * 유스케이스의 기본 인터페이스
 * 비즈니스 로직의 단일 작업을 표현합니다.
 */
export interface UseCase<TRequest = void, TResponse = void> {
  /** 유스케이스 실행 */
  execute(request: TRequest): Promise<TResponse>;
}

/**
 * 유스케이스 실행 결과
 */
export interface UseCaseResult<TData = unknown, TError = Error> {
  /** 성공 여부 */
  readonly success: boolean;

  /** 결과 데이터 (성공 시) */
  readonly data?: TData;

  /** 에러 정보 (실패 시) */
  readonly error?: TError;

  /** 추가 메타데이터 */
  readonly metadata?: Record<string, unknown>;
}

// ================================
// Service Pattern Interfaces
// ================================

/**
 * 도메인 서비스의 기본 인터페이스
 * 여러 엔티티에 걸친 비즈니스 로직을 담당합니다.
 */
export interface DomainService {
  /** 서비스 이름 */
  readonly name: string;

  /** 서비스 초기화 */
  initialize?(): Promise<void>;

  /** 서비스 정리 */
  cleanup?(): Promise<void>;

  /** 서비스 상태 확인 */
  isHealthy?(): boolean;
}

/**
 * 애플리케이션 서비스의 기본 인터페이스
 * 외부와의 인터페이스를 담당합니다.
 */
export interface ApplicationService extends DomainService {
  /** 서비스 버전 */
  readonly version: string;

  /** 서비스 의존성 */
  readonly dependencies?: string[];
}

// ================================
// Event Pattern Interfaces
// ================================

/**
 * 도메인 이벤트의 기본 인터페이스
 * 비즈니스 로직에서 발생하는 중요한 사건들을 표현합니다.
 */
export interface DomainEvent<TPayload = unknown> {
  /** 이벤트 고유 식별자 */
  readonly id: string;

  /** 이벤트 타입 */
  readonly type: string;

  /** 이벤트 발생 시간 */
  readonly occurredAt: Date;

  /** 이벤트 페이로드 */
  readonly payload: TPayload;

  /** 이벤트 소스 */
  readonly source: string;

  /** 이벤트 버전 */
  readonly version: number;
}

/**
 * 도메인 이벤트 핸들러 인터페이스
 */
export interface DomainEventHandler<TEvent extends DomainEvent> {
  /** 처리할 수 있는 이벤트 타입 */
  readonly eventType: string;

  /** 이벤트 처리 */
  handle(event: TEvent): Promise<void>;

  /** 핸들러 이름 */
  readonly name: string;
}

/**
 * 이벤트 버스 인터페이스
 */
export interface EventBus {
  /** 이벤트 발행 */
  publish<TEvent extends DomainEvent>(event: TEvent): Promise<void>;

  /** 이벤트 구독 */
  subscribe<TEvent extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<TEvent>
  ): void;

  /** 구독 해제 */
  unsubscribe(eventType: string, handlerName: string): void;
}

// ================================
// Factory Pattern Interfaces
// ================================

/**
 * 팩토리 패턴의 기본 인터페이스
 */
export interface Factory<TProduct, TConfig = unknown> {
  /** 제품 생성 */
  create(config?: TConfig): TProduct;

  /** 제품 타입 확인 */
  canCreate(config?: TConfig): boolean;
}

/**
 * 추상 팩토리 인터페이스
 */
export interface AbstractFactory {
  /** 팩토리 이름 */
  readonly name: string;

  /** 지원하는 타입 목록 */
  readonly supportedTypes: string[];
}

// ================================
// Configuration Interfaces
// ================================

/**
 * 설정 객체의 기본 인터페이스
 */
export interface Configuration {
  /** 설정 검증 */
  validate(): boolean;

  /** 기본값으로 설정 */
  setDefaults(): void;

  /** 설정을 JSON으로 직렬화 */
  toJSON(): Record<string, unknown>;
}

/**
 * 환경별 설정 인터페이스
 */
export interface EnvironmentConfiguration extends Configuration {
  /** 환경 타입 */
  readonly environment: 'development' | 'production' | 'test';

  /** 디버그 모드 여부 */
  readonly debug: boolean;
}

// ================================
// Utility Types
// ================================

/**
 * 읽기 전용 딥 타입
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 부분적 딥 타입
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 타입 가드 함수 타입
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * 결과 타입 (성공/실패를 명시적으로 표현)
 */
export type Result<TSuccess, TFailure = Error> =
  | { success: true; data: TSuccess }
  | { success: false; error: TFailure };
