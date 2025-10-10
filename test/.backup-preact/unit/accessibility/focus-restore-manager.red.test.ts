/**
 * Phase 5 (Accessibility) – RED test
 * 목표: 포커스 스코프 진입/해제 시 원래 포커스가 안전하게 복원되는 유틸리티/서비스 구현 강제
 * 기대 API (아직 미구현):
 *   beginFocusScope(): () => void  // 해제(복원) 함수 반환
 *   safelyRestoreFocus(): void     // (선택) 직접 복원 호출용 – 존재하면 사용, 없으면 해제 함수 사용
 * 구현 시 요구사항:
 *   - 제거된 노드 복원 시도 시 예외 없어야 함
 *   - 원래 포커스 요소가 사라졌으면 body 혹은 document.documentElement로 graceful fallback
 *   - 중첩 스코프 허용 (스택) – 본 RED에서는 단일 스코프만 검증 (추가 테스트로 확장 예정)
 */

import { describe, it, expect, beforeEach } from 'vitest';

// 아직 존재하지 않는 예상 모듈/함수 (TDD RED)
// 구현 시 실제 경로: src/shared/utils/accessibility/focus-restore-manager.ts (예정)
// eslint-disable-next-line import/no-unresolved
import { beginFocusScope } from '../../../src/shared/utils/accessibility/focus-restore-manager';

function createButton(id: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = id;
  btn.textContent = id;
  document.body.appendChild(btn);
  return btn;
}

describe('[RED][a11y] FocusRestoreManager – 기본 포커스 복원', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('스코프 해제 시 원래 포커스가 복원된다', () => {
    const origin = createButton('origin');
    origin.focus();
    expect(document.activeElement).toBe(origin);

    const restore = beginFocusScope();

    const inner = createButton('inner');
    inner.focus();
    expect(document.activeElement).toBe(inner);

    // 복원
    restore();
    expect(document.activeElement).toBe(origin);
  });

  it('원래 포커스 요소 제거 후 복원 시 안전하게 body로 포커스 이동 (fallback)', () => {
    const origin = createButton('origin');
    origin.focus();
    const restore = beginFocusScope();

    const inner = createButton('inner');
    inner.focus();
    origin.remove();

    // 제거된 요소로 복원 시도 – 예외 없이 fallback
    restore();
    // jsdom 환경에서는 body 또는 html 중 하나가 activeElement가 될 수 있음
    expect([document.body, document.documentElement]).toContain(document.activeElement);
  });
});
