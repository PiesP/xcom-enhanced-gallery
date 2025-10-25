# test/archive/unit/features/gallery

Gallery 기능 관련 완료된 Phase 또는 RED 테스트 아카이브

## 목적

`test/unit/features/gallery`에서 정리되어 이동한 완료된 Phase 테스트 및 RED
테스트(미구현 상태)를 보관합니다.

## 포함된 파일 (8개)

### RED 테스트 (구현 미완료)

1. **focus-tracker-infinite-loop.red.test.ts** (201줄)
   - **Phase**: 21.1
   - **내용**: IntersectionObserver 무한 루프 방지 테스트
   - **상태**: RED - 미구현

### Phase 별 완료 테스트

1. **vertical-gallery-fit-mode-types.test.ts** (76줄)
   - **Phase**: 101
   - **내용**: VerticalGalleryView 타입 단언 제거 테스트

2. **vertical-gallery-memo.test.tsx** (53줄)
   - **Phase**: 14.1.4
   - **내용**: VerticalGalleryView 가벼운 작업 테스트

3. **vertical-gallery-view-effects.test.tsx** (92줄)
   - **Phase**: 20.1
   - **내용**: isVisible을 파생 신호로 변환

4. **vertical-gallery-animation-effect.test.tsx** (111줄)
   - **Phase**: 20.2
   - **내용**: 애니메이션 Effect 의존성 명시 테스트

5. **vertical-gallery-no-auto-scroll.test.tsx** (91줄)
   - **Phase**: 18
   - **내용**: 수동 스크롤 방해 제거 테스트

6. **vertical-image-item-reactivity.test.tsx** (44줄)
   - **Phase**: 4 Follow-up
   - **내용**: forceVisible prop 변경에 즉시 반응하는지 검증

7. **silent-catch-removal.test.ts** (180줄)
   - **Phase**: A5.4 Step 2
   - **내용**: Silent error handler 제거 및 proper logging 검증

## 상태

- ✅ 완료: 7개 (Phase 별 테스트)
- ⚠️ RED (미구현): 1개
- 📦 총 크기: ~848줄

## 마이그레이션 정보

**이동 시간**: 2025-10-25 (Phase 182)

이 파일들은 `test/unit/features/gallery`에서 정리 과정을 거쳐 이동되었습니다:

- **test/archive/unit/features/gallery/README.md** ← 신규
- 모든 Phase 파일 및 RED 테스트를 일괄 아카이브

## 참고

- 활성 테스트는 `test/unit/features/gallery/` 참고
- 정책 검증 테스트는 `test/unit/policies/` 참고
- 전체 아카이브 지침: `test/archive/README.md`
