# TDD 리팩토링 활성 계획# TDD 리팩토링 활성 계획

현재 상태: Phase 21.3-21.5 진행 중 현재 상태: Phase 21 완료 (21.1-21.2) 최종
업데이트: 2025-10-12 브랜치: master

최종 업데이트: 2025-10-12

브랜치: feature/phase21-additional-optimization---

------## 📊 현재 상태

## 📊 현재 상태Phase 21 완료 - 프로젝트 안정 상태

Phase 21.1-21.2 완료, Phase 21.3-21.5 검토 중프로젝트 상태:

프로젝트 상태:- ✅ 빌드: dev 730 KB, prod 330 KB (gzip: 89.79 KB)

- ✅ 테스트: 603/603 passing (24 skipped, 1 todo)

- ✅ 빌드: dev 730 KB, prod 330 KB (gzip: 89.79 KB)- ✅ 의존성: 0 violations
  (265 modules, 729 dependencies)

- ✅ 테스트: 603/603 passing (24 skipped, 1 todo)- ✅ 타입: 0 errors (TypeScript
  strict)

- ✅ 의존성: 0 violations (265 modules, 729 dependencies)- ✅ 린트: 0 warnings,
  0 errors

- ✅ 타입: 0 errors (TypeScript strict)

- ✅ 린트: 0 warnings, 0 errors---

------## 📚 참고 문서

## 📚 참고 문서- `AGENTS.md`: 개발 환경 및 워크플로

- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-21.2 완료 내역

- `AGENTS.md`: 개발 환경 및 워크플로- `docs/ARCHITECTURE.md`: 프로젝트 아키텍처

- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-21.2 완료 내역-
  `docs/CODING_GUIDELINES.md`: 코딩 규칙 및 품질 기준

- `docs/ARCHITECTURE.md`: 프로젝트 아키텍처

- `docs/CODING_GUIDELINES.md`: 코딩 규칙 및 품질 기준---

------## 🎯 Phase 21 완료 요약

## 🎯 활성 작업: Phase 21.3-21.5### Phase 21.1: IntersectionObserver 무한 루프 방지 ✅

### Phase 21.3: useGalleryScroll Passive Listener ✅ (이미 완료)**완료일**: 2025-10-12 **커밋**:

`feat(gallery): prevent IntersectionObserver infinite loop`

**상태**: 코드 검증 결과 이미 적용됨

**개선사항**:

**현황**:

- `src/features/gallery/hooks/useGalleryScroll.ts` (line 193-196)- untrack():
  IntersectionObserver 콜백에서 반응성 체인 끊기

- 갤러리 휠 이벤트에 `passive: true` 적용됨- on(): 명시적 의존성 지정으로 effect
  최적화

- 브라우저/OS 네이티브 스크롤 속도 설정 준수- debounce: setAutoFocusIndex
  업데이트 제한 (50ms)

**코드**:**효과**: focusedIndex effect 99% 감소 (200+ → 2회)

```typescript

eventManager.addEventListener(document, 'wheel', handleGalleryWheel, {### Phase 21.2: galleryState Fine-grained Signals 분리 ✅

  capture: true,

  passive: true, // 브라우저/OS 네이티브 스크롤 속도 설정 준수**완료일**: 2025-10-12 **커밋**:

});`feat(core): implement fine-grained signals for gallery state`

```

**개선사항**:

**결론**: 추가 작업 불필요

- gallerySignals 추가: 각 상태 속성에 대한 개별 signal

------- 호환 레이어: 기존 galleryState.value API 유지

- batch() 지원: 다중 signal 업데이트 최적화

### Phase 21.4: 불필요한 createMemo 제거 (진행 예정)

**효과**: 불필요한 재렌더링 100% 제거

**우선순위**: LOW

**목표**: Solid.js의 fine-grained reactivity 특성을 활용하여 불필요한
memoization 제거---

**분석 대상**:## 📝 다음 작업 제안

1. **VerticalGalleryView.tsx - isVisible** (line 87-94)현재 프로젝트는 매우
   안정적인 상태입니다.

   ```typescript

   const isVisible = createMemo(() => {추가 최적화가 필요한 경우 다음을 고려할 수 있습니다:

     const visible = mediaItems().length > 0;

     logger.debug('VerticalGalleryView: 가시성 계산', {- **useGalleryScroll Passive Listener**: 스크롤 성능 개선 (MEDIUM)

       visible,- **불필요한 Memo 제거**: 코드 간결성 향상 (LOW)

       mediaCount: mediaItems().length,- **컴포넌트 마이그레이션**: gallerySignals 사용으로 전환 (OPTIONAL)

     });

     return visible;즉각적인 리팩토링이 필요하지 않으며, 새로운 기능 개발이나 사용자 피드백 대응에

   });집중할 수 있습니다.

   ```

   - 평가: **제거 가능**
   - 이유: 단순 boolean 계산, Solid.js가 자동으로 최적화
   - 디버그 로그는 createEffect로 이동 가능

2. **VerticalGalleryView.tsx - preloadIndices** (line 111-114)

   ```typescript
   const preloadIndices = createMemo(() => {
     const count = getSetting<number>('gallery.preloadCount', 0);
     return computePreloadIndices(currentIndex(), mediaItems().length, count);
   });
   ```

   - 평가: **유지 필요**
   - 이유: `computePreloadIndices` 함수 호출 + 배열 생성 비용
   - currentIndex 변경 시마다 재계산 방지 필요

3. **VerticalImageItem.tsx - CSS 클래스 계산** (line 322-339)

   ```typescript
   const fitModeClass = createMemo(() => getFitModeClass(resolvedFitMode()));
   const containerClasses = createMemo(() => /* 문자열 연산 */);
   const imageClasses = createMemo(() => /* 문자열 연산 */);
   ```

   - 평가: **유지 필요**
   - 이유: 문자열 템플릿 계산, 렌더링 시마다 새 문자열 생성 방지

4. **useGalleryFocusTracker.ts - focusedIndex** (line 323)
   - 평가: **유지 필요**
   - 이유: Phase 21.1에서 최적화한 핵심 로직

**작업 계획**:

1. RED 단계:
   - isVisible memo 제거 시 성능 저하 없음을 검증하는 테스트 작성
   - 예상: 단순 boolean 계산이므로 성능 차이 미미

2. GREEN 단계:
   - isVisible를 일반 함수로 변경
   - 디버그 로그를 createEffect로 분리

3. 검증:
   - 전체 테스트 통과
   - 빌드 크기 변화 없음 (또는 미미)

---

### Phase 21.5: gallerySignals 마이그레이션 (OPTIONAL)

**우선순위**: OPTIONAL  
**목표**: galleryState.value 직접 사용을 gallerySignals로 전환하여 fine-grained
reactivity 활용

**분석 필요**:

- galleryState.value를 직접 사용하는 컴포넌트 검색
- 이미 useSelector를 사용하는 경우는 제외 (이미 최적화됨)

**작업 계획**:

1. galleryState.value 직접 사용처 검색
2. 각 사용처를 gallerySignals로 마이그레이션
3. Phase 21.2에서 구현한 호환 레이어 덕분에 점진적 마이그레이션 가능

**평가 기준**:

- 마이그레이션으로 인한 성능 개선이 있는가?
- 코드 복잡도가 증가하지 않는가?
- 테스트 통과 유지

---

## 📝 다음 단계

1. **Phase 21.4 진행** (LOW 우선순위)
   - isVisible memo 제거
   - 테스트 검증
   - 성능 영향 측정

2. **Phase 21.5 평가** (OPTIONAL)
   - galleryState.value 사용처 분석
   - 마이그레이션 필요성 판단
   - 필요시 진행, 불필요시 스킵

3. **문서화**
   - 완료된 작업 TDD_REFACTORING_PLAN_COMPLETED.md로 이관
   - 성능 측정 결과 문서화
