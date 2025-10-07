# Preact → SolidJS 리팩토링 종합 점검 보고서

**작성일**: 2025-01-08 **대상 브랜치**: fix/vendor-getter-cache-bug **점검
범위**: 전체 코드베이스 (소스 + 테스트)

---

## 📋 Executive Summary

Preact + Signals에서 Solid.js로의 리팩토링 이후 프로젝트를 종합 점검한 결과,
**핵심 기능은 정상 동작**하나 **테스트 코드에 Preact 잔재가 일부 남아있음**을
확인했습니다.

### ✅ 주요 성과

1. **Phase 9.2 완료**: vendor getter 캐시 버그 수정 ✅
   - `getSolid()`/`getSolidWeb()`가 올바르게 캐시 저장
   - Show 컴포넌트 중복 export 제거

2. **Phase 10.2-10.3 완료**: Orphan 모듈 및 TODO 주석 제거 ✅
   - `focusScope-solid.ts` 제거
   - KeyboardHelpOverlay 관련 TODO 3개 제거

3. **Solid.js 패턴 적절히 사용** ✅
   - createEffect/onCleanup 패턴 50+ 사용처 확인
   - generation tracking으로 race condition 방지
   - focusTrap-solid.ts는 모범 패턴

4. **빌드 크기 정상** ✅
   - Dev: 1,030.72 KB
   - Prod: 331.17 KB (gzip 88.37 KB)
   - 가이드라인 기준 (WARN 120KB, FAIL 160KB) 충족

### ⚠️ 개선 필요 영역

1. **테스트 코드 Preact 잔재 (Phase 10.1)**
   - 18개 파일에서 Preact import 사용 중
   - 대부분 `h` 함수 및 `@preact/signals`

2. **Signal Subscribe Cleanup 개선 (Phase 10.4 - 신규 제안)**
   - createEffect가 cleanup 함수를 반환하지 않음
   - createRoot 기반 해결책 제안

---

## 🔍 상세 분석 결과

### 1. Vendor Getter 캐시 검증 ✅

**파일**: `src/shared/external/vendors/vendor-manager-static.ts`

**검증 항목**:

- ✅ `getSolid()` 메서드: 캐시에 저장 후 반환 (line 210-244)
- ✅ `getSolidWeb()` 메서드: 캐시에 저장 후 반환 (line 250-274)
- ✅ Show 컴포넌트 중복 제거: solid-web에서 제거, solid만 export

**결론**: Phase 9.2에서 수정 완료. 정상 동작.

---

### 2. createEffect Cleanup 패턴 검증 ✅

**검증 범위**: 50+ createEffect 사용처

**우수 패턴 예시** (focusTrap-solid.ts):

```typescript
createEffect(() => {
  const container = containerAccessor();

  // Cleanup previous instance
  if (trapInstance) {
    trapInstance.destroy();
    trapInstance = null;
  }

  // Create new instance
  if (container) {
    trapInstance = createFocusTrapUtil(container, options);
  }

  // Cleanup on disposal
  onCleanup(() => {
    if (trapInstance) {
      trapInstance.destroy();
      trapInstance = null;
    }
  });
});
```

**주요 사용처**:

- ✅ `VerticalGalleryView.tsx`: 9개 createEffect, 적절한 cleanup
- ✅ `signalOptimization.ts`: generation tracking으로 race condition 방지
- ✅ `createGalleryItemScroll.ts`: 타이머 cleanup 적절

**결론**: 대부분의 사용처에서 적절한 cleanup 패턴 적용.

---

### 3. 비동기 Effect Race Condition 검증 ✅

**파일**: `src/shared/utils/performance/signalOptimization.ts`

**패턴**:

```typescript
export function createAsyncSelector<T, R>(
  source: Accessor<T>,
  selector: (state: T) => Promise<R>,
  defaultValue: R,
  debounceMs = 300
): Accessor<AsyncSelectorResult<R>> {
  let currentGeneration = 0;
  let isDisposed = false;

  createEffect(() => {
    const generation = ++currentGeneration;
    const state = source();

    const timeoutId = globalTimerManager.setTimeout(async () => {
      if (isDisposed || generation !== currentGeneration) return; // ✅ 안전

      try {
        const value = await selector(state);
        if (!isDisposed && generation === currentGeneration) {
          // ✅ 재확인
          untrack(() => setResult({ value, loading: false, error: null }));
        }
      } catch (error) {
        // 에러 처리
      }
    }, debounceMs);

    onCleanup(() => {
      globalTimerManager.clearTimeout(timeoutId); // ✅ 타이머 정리
    });
  });

  onCleanup(() => {
    isDisposed = true; // ✅ disposal 플래그
  });

  return result;
}
```

**결론**: Generation tracking + isDisposed 플래그로 안전하게 race condition
방지.

---

### 4. 테스트 코드 Preact 잔재 ⚠️

**발견 파일**: 18개

#### 분류:

**A. 정적 분석/검증 테스트 (유지 필요)**:

- `test/unit/lint/direct-imports-source-scan.test.js` - 문자열 패턴 검사
- `test/unit/features/gallery/GalleryRenderer.solid.test.ts` - negative
  assertion

**B. 컴포넌트 렌더링 테스트 (전환 필요 - 8개)**:

1. `test/unit/ui/toolbar.icon-accessibility.test.tsx`
2. `test/shared/components/ui/Icon.test.tsx`
3. `test/shared/components/ui/Toolbar-Icons.test.tsx`
4. `test/shared/components/ui/Toast-Icons.test.tsx`
5. `test/refactoring/icon-button.size-map.red.test.tsx`
6. `test/phase-2-component-shells.test.tsx`
7. `test/integration/design-system-consistency.test.tsx`
8. `test/behavioral/settings-modal.characterization.test.ts`
9. `test/behavioral/settings-modal.characterization.test.js` (중복)

**C. 로직 테스트 (전환 필요 - 5개)**:

1. `test/unit/performance/signal-optimization.test.tsx` - `@preact/signals` 사용
2. `test/hooks/useGalleryToolbarLogic.test.ts`
3. `test/components/configurable-toolbar.test.ts`
4. `test/components/button-primitive-enhancement.test.ts`

**작업 전략**:

- Phase 10.1에 상세 계획 수립 완료
- 예상 작업량: 6-8시간
- 변환 패턴 템플릿 작성 후 일괄 적용

---

### 5. Signal Subscribe Cleanup 이슈 🆕

**파일**:

- `src/shared/state/signals/signal-factory.ts`
- `src/shared/state/signals/signal-factory-solid.ts`

**현재 구현**:

```typescript
subscribe(callback: (value: T) => void): () => void {
  try {
    solid.createEffect(() => callback(getter()));
    // ❌ createEffect는 cleanup 함수를 반환하지 않음!
    return () => {}; // noop 반환
  } catch (error) {
    return () => {};
  }
}
```

**문제점**:

1. Subscribe 후 unsubscribe가 실제로 effect를 정리하지 못함
2. 메모리 누수 가능성 (장시간 실행 시)
3. SSR 환경에서 createEffect가 undefined 반환 가능

**제안 해결책** (Phase 10.4):

```typescript
subscribe(callback: (value: T) => void): () => void {
  let dispose: (() => void) | undefined;
  try {
    const { createRoot, createEffect } = getSolid();
    dispose = createRoot((disposeRoot) => {
      createEffect(() => callback(get()));
      return disposeRoot;
    });
  } catch { /* fallback */ }
  return dispose ?? (() => {});
}
```

**우선순위**: 중간 (현재 프로덕션 문제 보고 없음, 장시간 실행 시 잠재적 위험)

---

## 📊 메트릭 요약

| 항목                 | 값          | 상태                    |
| -------------------- | ----------- | ----------------------- |
| **빌드 크기 (Dev)**  | 1,030.72 KB | ✅ 정상                 |
| **빌드 크기 (Prod)** | 331.17 KB   | ✅ 정상                 |
| **gzip 크기**        | 88.37 KB    | ✅ 기준 충족 (< 160 KB) |
| **모듈 수**          | 250         | ✅ 정상                 |
| **의존성 수**        | 699         | ✅ 정상                 |
| **Orphan 모듈**      | 0           | ✅ 없음                 |
| **TODO 주석**        | 0           | ✅ 해결 (해당 파일)     |
| **Preact 테스트**    | 18          | ⚠️ 작업 필요            |
| **TypeScript 오류**  | 0           | ✅ 없음                 |
| **Lint 오류**        | 0           | ✅ 없음                 |

---

## 📝 권장 작업 순서

### 🔴 높은 우선순위

#### Phase 10.1: 테스트 Preact 잔재 제거

- **대상**: 18개 파일
- **예상 시간**: 6-8시간
- **수용 기준**: 실제 Preact 기능 사용 0건 (정적 분석용 제외)

### 🟡 중간 우선순위

#### Phase 10.4: Signal Subscribe Cleanup 개선 (신규)

- **대상**: signal-factory.ts, signal-factory-solid.ts
- **예상 시간**: 4-6시간
- **수용 기준**: Memory leak 테스트 GREEN, SSR 호환성 강화

### 🟢 낮은 우선순위

#### Phase 11: Deprecated 항목 정리

- **대상**: 문서화된 deprecated API들
- **예상 시간**: 3-4시간
- **수용 기준**: 실사용 없는 deprecated 항목 제거

---

## 🎯 최종 체크리스트

### ✅ 완료된 항목

- [x] Phase 9.2: vendor getter 캐시 버그 수정
- [x] Phase 10.2: Orphan 모듈 제거
- [x] Phase 10.3: TODO 주석 제거
- [x] createEffect/onCleanup 패턴 검증
- [x] 비동기 effect race condition 검증
- [x] 빌드 크기 검증
- [x] TDD_REFACTORING_PLAN.md 갱신

### ⏳ 진행 예정

- [ ] Phase 10.1: 테스트 Preact 잔재 제거
- [ ] Phase 10.4: Signal subscribe cleanup 개선
- [ ] Phase 10.2-10.3 완료 내용을 COMPLETED.md로 이관
- [ ] 문서 최종 갱신

---

## 💡 추가 권장 사항

1. **모니터링 강화**
   - Production 환경에서 메모리 사용량 모니터링
   - Signal subscribe/unsubscribe 패턴 사용 현황 파악

2. **테스트 패턴 표준화**
   - Solid.js 테스트 패턴 가이드 문서 작성
   - Phase 10.1 완료 후 변환 템플릿 공유

3. **정기 점검**
   - 분기별 dependency 업데이트
   - Solid.js 새 버전 마이그레이션 계획

---

## 📚 참고 문서

- `AGENTS.md` - 프로젝트 개발 워크플로
- `docs/ARCHITECTURE.md` - 아키텍처 개요
- `docs/CODING_GUIDELINES.md` - 코딩 규칙
- `docs/TDD_REFACTORING_PLAN.md` - 리팩토링 계획
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md` - 완료된 작업

---

**보고서 작성자**: GitHub Copilot **검증 날짜**: 2025-01-08 **빌드 검증**:
`npm run build` ✅ PASS **타입 검증**: `npm run typecheck` ✅ PASS **린트
검증**: `npm run lint` ✅ PASS
