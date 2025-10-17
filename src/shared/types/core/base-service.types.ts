/**
 * @fileoverview Base Service Types
 * @description 기본 서비스 인터페이스 정의 (순환 의존성 방지)
 */

/**
 * 기본 서비스 인터페이스
 */
export interface BaseService {
  destroy?(): void;
  initialize?(): Promise<void> | void;
  isInitialized?(): boolean;
}
