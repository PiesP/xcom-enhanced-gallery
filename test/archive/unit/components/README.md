# test/archive/unit/components

완료되었거나 활성 아닌 컴포넌트 테스트 모음

## 개요

이 폴더는 다음과 같은 테스트를 보관합니다:

- **RED 단계 테스트**: 구현 미완료 TDD RED 테스트
- **아카이브된 Phase 테스트**: Phase 완료 후 비활성화된 테스트
- **대체된 테스트**: E2E 마이그레이션 완료된 구식 테스트

## 파일 목록

### RED 테스트 (구현 대기)

#### toolbar-circular-navigation.test.tsx

**Phase**: 66

**상태**: RED (구현 미완료)

**목적**: Toolbar 순환 네비게이션 수정 검증

**내용**:

- Phase 62에서 순환 네비게이션 구현
- 하지만 Toolbar.tsx의 `navState()`에서 여전히 경계 조건 체크
- 버튼이 비활성화되는 문제 해결 필요

**테스트**:

- `totalCount > 1`일 때 `prevDisabled`/`nextDisabled`는 항상 false여야 함
- 첫 항목에서 이전 버튼 활성화
- 마지막 항목에서 다음 버튼 활성화
- `totalCount = 1`일 때만 비활성화

**이유 아카이브 이동**:

- Phase 176+ 정책에 따라 활성 RED 테스트는 아카이브로 이동
- 구현 시 test/unit/components로 이동

---

#### toolbar-focused-index-display.test.tsx

**Phase**: 64

**상태**: RED (구현 미완료)

**목적**: Toolbar focusedIndex 우선 표시 검증

**내용**:

- Toolbar의 currentIndex 표시를 focusedIndex 우선으로 변경
- `focusedIndex`가 null일 때 `currentIndex`로 폴백
- 스크롤 기반 포커스와 버튼 네비게이션 동기화

**테스트**:

- `focusedIndex`가 null일 때 `currentIndex` 표시
- `focusedIndex`가 있을 때 `focusedIndex` 표시
- 두 값이 다를 때 `focusedIndex` 우선

**이유 아카이브 이동**:

- Phase 176+ 정책에 따라 활성 RED 테스트는 아카이브로 이동
- 구현 시 test/unit/components로 이동

---

## 정책

### 1. RED 테스트 관리

- **위치**: test/archive/unit/components
- **활성 상태**: 비활성 (CI/테스트 실행 대상 제외)
- **복원 조건**: 구현 완료 시 test/unit/components로 이동
- **문서화**: 각 파일에 Phase 번호 및 복원 조건 명시

### 2. 이동 기준

파일이 아카이브로 이동하는 경우:

1. **RED 테스트**: 구현 대기 중인 미완료 테스트
2. **구식 패턴**: 리팩토링 완료 후 비활성화
3. **E2E 마이그레이션**: Playwright로 완전히 대체됨
4. **Phase 완료**: Phase N.M 테스트가 3단계 이상 완료됨

### 3. 유지보수

- 월별 정기 검토 (maintenance:check)
- 복원 가능성 평가
- 필요시 docs/archive로 영구 이동

## 참고

- Phase 정의: `TDD_REFACTORING_PLAN.md`
- 테스트 전략: `TESTING_STRATEGY.md`
- 현재 활성 테스트: `../components/README.md`
