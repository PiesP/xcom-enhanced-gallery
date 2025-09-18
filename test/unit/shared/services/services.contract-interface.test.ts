/**
 * Service Contract Interface Test (Graduated GREEN)
 * 원래 RED 테스트였던 services.contract-interface.red.test.ts 내용을 인라인화.
 * 목표: CoreService / ServiceManager 가 서비스 등록/조회/예외 처리를 안정적으로 제공하는지 검증.
 */

import { describe, it, expect } from 'vitest';
// CoreService/serviceManager helpers are exported directly from ServiceManager.ts via barrel
import { CoreService } from '@shared/services/ServiceManager';

describe('Service Contract Interface (GREEN)', () => {
  it('서비스를 등록하고 동일 키로 재등록 시 마지막 등록이 우선한다', () => {
    const sm = CoreService.getInstance();
    sm.register('svc-a', () => ({ value: 1 }));
    sm.register('svc-a', () => ({ value: 2 }));
    const resolved = sm.get('svc-a');
    expect(resolved.value).toBe(2);
  });

  it('존재하지 않는 서비스 조회 시 tryGet은 null, get은 에러를 던진다', () => {
    const sm = CoreService.getInstance();
    const missing = sm.tryGet('does-not-exist');
    expect(missing).toBeNull();
    expect(() => sm.get('does-not-exist')).toThrowError();
  });

  it('지연(factory) 등록 서비스는 최초 get 시 팩토리가 실행된다', () => {
    const sm = CoreService.getInstance();
    let called = 0;
    sm.register('lazy-svc', () => {
      called += 1;
      return { ready: true } as const;
    });
    expect(called).toBe(0);
    const resolved = sm.get('lazy-svc');
    expect(resolved.ready).toBe(true);
    expect(called).toBe(1);
    // subsequent gets reuse
    sm.get('lazy-svc');
    expect(called).toBe(1);
  });
});
