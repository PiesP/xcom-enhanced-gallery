/**
 * Gallery Signal Mediator
 * ------------------------------------------------------------
 * 목적:
 *  - services(core-services, service-initialization 등)이 `gallery.signals`를 직접 import 하면서 생기는
 *    순환(edge: services -> signals -> core-services ...)을 제거하기 위한 얇은 간접층.
 *  - runtime 초기화 순서를 보존: signals 모듈 로딩 이후 `registerGallerySignalAccess` 호출로 accessor 주입.
 *
 * 제약/규칙:
 *  - 이 파일은 signal 객체의 구체 타입을 재수출하지 않는다 (불필요한 타입 종속 방지).
 *  - 호출자는 nullable 반환을 고려하거나 사전에 `ensureGallerySignalsReady()`를 호출.
 */

import type { Signal } from '@preact/signals-core'; // 타입만: vendor getter 경유 대신 순수 타입 (dev dependency)

// 최소한으로 필요한 read-only view 정의 (필요 시 점진 확장)
export interface GallerySignalPublicState {
  readonly isOpen: Signal<boolean>;
  readonly currentIndex: Signal<number>;
}

type Accessor = () => GallerySignalPublicState | null;

let accessor: Accessor | null = null;

/**
 * signals 모듈이 준비된 후 1회 등록. 재등록은 무시(로그 없이)하여 idempotent.
 */
export function registerGallerySignalAccess(fn: Accessor): void {
  if (!accessor) accessor = fn;
}

/**
 * 선택적 접근자 – 아직 초기화되지 않았다면 null.
 */
export function tryGetGallerySignals(): GallerySignalPublicState | null {
  return accessor ? accessor() : null;
}

/**
 * 보장된 접근자 – 미초기화 상태면 명시적 오류를 던져 상위 초기화 순서를 교정하도록.
 */
export function getGallerySignals(): GallerySignalPublicState {
  const value = tryGetGallerySignals();
  if (!value) {
    throw new Error('[gallery-signal-mediator] Gallery signals not registered yet');
  }
  return value;
}

/**
 * 런타임에서 신호 준비가 되었는지 편의 확인.
 */
export function areGallerySignalsReady(): boolean {
  return !!tryGetGallerySignals();
}
