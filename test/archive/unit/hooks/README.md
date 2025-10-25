# test/archive/unit/hooks - RED 테스트 및 완료 정책

> **정책**: Phase 185 (2025-10-25)
>
> 이 디렉토리는 RED 테스트(구현 대기)와 완료된 Phase 테스트를 아카이브합니다. 총
> **3개** 파일 (736줄)이 보관 중입니다.

## 📋 파일 목록

### RED 테스트 (구현 대기)

#### 1. `use-gallery-focus-tracker-global-sync.test.ts` (195줄)

**목적**: useGalleryFocusTracker의 전역 focusedIndex 동기화 검증

**상태**: 🔴 RED (구현 대기)

**테스트 케이스**:

- RED: 명시적 네비게이션 시 동기화 검증 (1개)
- GREEN: 수동 포커스는 전역 동기화 안 함 (1개)
- Regression: 컨테이너 신호 변동 대응 (1개)

**구현 요구사항**:

- `setFocusedIndex()` 전역 신호 연동
- 아이템 등록 시 debounce된 동기화
- 컨테이너 accessor null 처리

**Phase**: 64 Step 3

**참고**: 아이템 등록 및 포커스 스케줄링 로직이 구현되면 활성화 예정

---

#### 2. `use-gallery-scroll.test.ts` (309줄)

**목적**: useGalleryScroll이 scrollBy를 호출하지 않고 방향 감지만 수행하는지
검증

**상태**: 🔴 RED (구현 대기)

**테스트 케이스**:

- RED: scrollBy 호출 방지 (2개)
- GREEN: 방향 감지 기능 유지 (2개)
- GREEN: 트위터 스크롤 차단 기능 유지 (1개)
- REFACTOR: 코드 단순화 (1개)

**구현 요구사항**:

- 휠 이벤트 감지 (scrollBy 미호출)
- 스크롤 방향 감지 (up/down)
- 트위터 컨테이너 스크롤 차단

**Phase**: 61

**참고**: 갤러리 스크롤 동작 재정의 후 활성화 예정

---

#### 3. `use-gallery-toolbar-circular.test.ts` (232줄)

**목적**: 순환 네비게이션 시 이전/다음 버튼이 항상 활성화되는지 검증

**상태**: 🔴 RED (구현 대기)

**테스트 케이스**:

- RED: canGoPrevious() - 항상 활성화 (3개)
- RED: canGoNext() - 항상 활성화 (3개)
- RED: getActionProps() - 버튼 disabled 상태 (2개)

**구현 요구사항**:

- `canGoPrevious = () => totalCount > 1` (순환 네비게이션)
- `canGoNext = () => totalCount > 1` (순환 네비게이션)
- 단일 이미지(totalCount=1)일 때만 비활성화

**Phase**: 62

**참고**: 순환 네비게이션 정책 적용 후 활성화 예정

---

## 📊 통계

| 항목              | 수량             |
| ----------------- | ---------------- |
| 아카이브 파일     | 3개              |
| 아카이브 라인     | 736줄            |
| RED 테스트 케이스 | 8개              |
| 예상 Green 케이스 | 5개              |
| Phase 참고        | 3개 (61, 62, 64) |

---

## 🔄 마이그레이션 경로

### 활성화 조건

각 파일이 활성화되려면 다음 조건을 충족해야 합니다:

**Phase 64 (focusedIndex 동기화)**:

```
✅ useGalleryFocusTracker 구현 완료
✅ setFocusedIndex 전역 신호 연결
✅ 아이템 등록 및 동기화 로직 확인
→ test/unit/hooks로 이동 후 빌드/배포
```

**Phase 61 (스크롤 감지)**:

```
✅ useGalleryScroll 방향 감지 로직 확인
✅ 트위터 스크롤 차단 구현
✅ scrollBy 호출 없는 구조 확인
→ test/unit/hooks로 이동 후 빌드/배포
```

**Phase 62 (순환 네비게이션)**:

```
✅ useGalleryToolbarLogic 순환 로직 구현
✅ canGoPrevious/canGoNext getter 적용
✅ 총 개수 1개일 때 비활성화 로직 확인
→ test/unit/hooks로 이동 후 빌드/배포
```

---

## 🚀 테스트 실행

아카이브 파일은 CI에서 제외되며, 로컬에서도 기본으로 실행되지 않습니다.

```bash
# 명시적으로 아카이브 파일만 실행 (검증용)
npx vitest run test/archive/unit/hooks/*.test.ts

# 아카이브 포함 전체 실행
npm run test -- --include "test/**/*.test.ts"
```

---

## 📚 관련 문서

- **[test/unit/hooks/README.md](../hooks/README.md)**: 활성 테스트 가이드
- **[test/README.md](../README.md)**: 전체 테스트 구조
- **[TESTING_STRATEGY.md](../../../docs/TESTING_STRATEGY.md)**: 테스트 전략
  가이드
- **[TDD_REFACTORING_PLAN.md](../../../docs/TDD_REFACTORING_PLAN.md)**: Phase
  진행 상황

---

## 🔍 아카이브 정책

**유지 기준**:

- RED 테스트 (실패하는 테스트, 구현 대기)
- 완료된 Phase 테스트 (참고용 보관)
- 리팩토링 중 보류 중인 테스트

**제거 기준**:

- GREEN 테스트 (✅ 활성화 후 1년 이상 안 변경)
- 중복 테스트 (다른 위치에서 검증)
- 사용하지 않는 구 패턴 테스트

---

**마지막 업데이트**: 2025-10-25 (Phase 185)
