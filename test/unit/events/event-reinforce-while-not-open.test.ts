/**
 * Phase 11 GREEN: 갤러리 미오픈 상태(initialized=true, isOpen=false)에서
 * MutationObserver 트리거 시 이벤트 우선순위 재강화가 수행되어 unified-gallery
 * 리스너가 재등록되는지 검증.
 * 구현 변경: reinforce 조건을 initialized -> isOpen 으로 전환하여 달성.
 */
// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
import { createGalleryTestHarness } from '../../utils/galleryTestHarness';
import { removeEventListenersByContext, getEventListenerStatus } from '@/shared/utils/events';
import { EventManager } from '@/shared/services/EventManager';

describe('Phase 11 GREEN: 갤러리 미오픈 상태에서도 MutationObserver 재우선순위 강화 수행', () => {
  it('initialize 후 isOpen=false 상태에서 갤러리 관련 노드 추가 시 리스너가 복구되어야 한다', async () => {
    const { eventManager } = await createGalleryTestHarness();

    // 초기 상태: 이벤트 시스템은 initialize 되어 있고 갤러리는 아직 열리지 않음 (isOpen=false)
    const initialStatus = eventManager.getGalleryStatus();
    expect(initialStatus.initialized).toBe(true);

    const beforeListenerStatus = getEventListenerStatus();
    const beforeByContext = beforeListenerStatus.byContext || {};
    const beforeUnified = beforeByContext['unified-gallery'] || 0;
    const beforeTotal = beforeListenerStatus.total || 0;
    expect(beforeUnified).toBeGreaterThan(0); // unified-gallery 컨텍스트 리스너 존재
    expect(beforeTotal).toBeGreaterThanOrEqual(beforeUnified);

    // 1) 우선 기존 unified-gallery 컨텍스트 리스너 제거 (우선순위 손실 상황 시뮬레이션)
    removeEventListenersByContext('unified-gallery');
    const afterRemovalStatus = getEventListenerStatus();
    const afterByContext = afterRemovalStatus.byContext || {};
    const afterUnified = afterByContext['unified-gallery'] || 0;
    const afterTotal = afterRemovalStatus.total || 0;
    expect(afterUnified).toBe(0); // 제거 확인 (다른 컨텍스트 무시)
    // total 은 unified-gallery 제거만큼 감소했거나 그 이상(다른 정리 동반)이어야 함
    expect(afterTotal).toBeLessThanOrEqual(beforeTotal - beforeUnified);

    // reinforceEventPriority 간접 스파이: private 이므로 프로토타입 패치
    // @ts-ignore
    // proto reference (TS 무시)
    // @ts-ignore
    const proto = EventManager.prototype;
    const originalReinforce = proto['reinforceEventPriority'];
    const reinforceSpy = vi.fn((...args) => {
      return originalReinforce.apply(EventManager.getInstance(), args);
    });
    proto['reinforceEventPriority'] = reinforceSpy;

    // 2) MutationObserver 가 감지할 트위터 갤러리 유사 요소 추가
    const el = globalThis.document.createElement('div');
    el.setAttribute('data-testid', 'photoViewer');
    globalThis.document.body.appendChild(el);

    // 3) MutationObserver 디바운스 + reinforce 수행 대기 (현재 구현에서는 reinforce 스킵되어 복구 안 됨)
    await new Promise(r => globalThis.setTimeout(r, 200));

    const finalListenerStatus = getEventListenerStatus();
    const finalByContext = finalListenerStatus.byContext || {};
    const finalUnified = finalByContext['unified-gallery'] || 0;
    const finalTotal = finalListenerStatus.total || 0;

    // 검증:
    // 1) reinforceSpy 가 1회 이상 호출
    // 2) unified-gallery 리스너 재등록(finalUnified > 0)
    expect(reinforceSpy.mock.calls.length, 'reinforce 가 호출되어야 GREEN').toBeGreaterThan(0);
    expect(finalUnified, 'unified-gallery 리스너가 재등록되어야 GREEN').toBeGreaterThanOrEqual(
      beforeUnified
    );
    // total 은 초기 total 과 동일하거나 (다른 컨텍스트 재등록 포함) 약간 차이날 수 있으나 최소 unified-gallery 복구분은 확보
    expect(finalTotal).toBeGreaterThanOrEqual(finalUnified);

    // 프로토타입 복구 (다른 테스트 영향 방지)
    proto['reinforceEventPriority'] = originalReinforce;
  });
});
