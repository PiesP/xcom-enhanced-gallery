# test/archive/integration - 아카이브 정책

> 이 디렉터리는 test/integration의 구식 테스트를 보관합니다. Phase 171B에서
> test/integration/archive에서 이곳으로 통합되었습니다.

## 📚 보관된 파일

### 1. **bundle-vendor-tdz.test.ts** (152줄)

- **목적**: TDD RED 단계 - Vendor TDZ 문제 재현
- **상태**: ⚠️ Phase 170B+ 이후 해결됨
- **이유**:
  - 구식 TDD RED 단계 패턴
  - 현재는 정적 import 기반 vendor 시스템으로 TDZ 문제 완전 해결
- **참고**: `docs/TDD_REFACTORING_PLAN.md` Phase 170A, 170B

### 2. **extension.integration.test.ts** (129줄)

- **목적**: 확장 프로그램 초기화 통합 테스트
- **상태**: ⚠️ 모든 테스트가 placeholder (expect(true).toBe(true))
- **이유**:
  - 실제 구현 없음
  - E2E 테스트로 충분히 커버됨
  - 유지보수 부담만 증가
- **참고**: `playwright/smoke/` E2E 테스트 확인

### 3. **master-test-suite.test.ts** (72줄)

- **목적**: Phase 4 Final Cleanup 완료 마커
- **상태**: ⚠️ 완료된 Phase 기록용
- **이유**:
  - 완료된 Phase를 기록하는 테스트
  - 실제 작업은 이미 구현됨
  - 마이그레이션 용도로만 보관
- **참고**: `docs/TDD_REFACTORING_PLAN.md` Phase 4

### 4. **vendor-tdz-resolution.test.ts** (282줄)

- **목적**: TDD GREEN 단계 - TDZ 문제 해결 검증
- **상태**: ⚠️ Phase 170B 완료 이후 통합됨
- **이유**:
  - TDD GREEN 검증 테스트
  - 현재 아키텍처에서는 불필요
  - `@shared/external/vendors` 정적 import로 안정화
- **참고**: `docs/TDD_REFACTORING_PLAN.md` Phase 170B

---

## 🔄 아카이브 정책

### 언제 파일이 아카이브로 이동하는가?

1. **완료된 Phase 마커**: TDD RED/GREEN 순환 완료 후 기록용
2. **구식 패턴**: 현대화되거나 다른 방식으로 대체됨
3. **Placeholder 테스트**: 모든 테스트가 `expect(true).toBe(true)`
4. **중복 테스트**: 다른 스위트(E2E, Browser)로 충분히 커버됨
5. **현황 불일치**: 최신 아키텍처/구현과 맞지 않음

### 아카이브 파일 사용

- **CI/로컬 테스트에서 제외**: 자동 검증에 포함되지 않음
- **참고 자료**: 과거 구현이나 패턴 참고 용도
- **마이그레이션**: 필요시 코드 패턴 학습 자료

### 복원 방법

아카이브 파일을 다시 활성화하려면:

```bash
# archive에서 상위 폴더로 복사
cp test/integration/archive/<filename> test/integration/<filename>

# 파일 업데이트 및 테스트 추가
npm run test -- test/integration/<filename>

# 통과 후 커밋
git add test/integration/<filename>
```

---

## 📊 아카이브 현황

| 파일명                        | 라인    | 목적          | 상태                    |
| ----------------------------- | ------- | ------------- | ----------------------- |
| bundle-vendor-tdz.test.ts     | 152     | TDD RED       | ✅ 해결됨 (Phase 170B+) |
| extension.integration.test.ts | 129     | 초기화 테스트 | ⚠️ Placeholder          |
| master-test-suite.test.ts     | 72      | Phase 4 마커  | ✅ 완료됨               |
| vendor-tdz-resolution.test.ts | 282     | TDD GREEN     | ✅ 해결됨 (Phase 170B)  |
| **합계**                      | **635** | -             | -                       |

---

## 📚 관련 문서

- **[docs/TDD_REFACTORING_PLAN.md](../../docs/TDD_REFACTORING_PLAN.md)**:
  Phase별 작업 진행 상황
- **[docs/TESTING_STRATEGY.md](../../docs/TESTING_STRATEGY.md)**: 전체 테스트
  전략 (아카이브 정책 포함)
- **[test/README.md](../README.md)**: 테스트 구조 가이드

---

---

## 🔗 대체 테스트 위치 및 경로 이동 (Phase 171B)

### Phase 171B 경로 재정리 (2025-10-25)

**이동된 파일** (test/integration → 더 적절한 위치):

- ✅ `color-token-consistency.test.ts`: test/integration → **test/styles/**
  - **사유**: 스타일/토큰 정책 검증은 test/styles에 18개 테스트와 함께 관리
  - **참고**: test/styles/hardcoded-color-detection.test.ts 등과 같은 범주

### 재검토된 파일 (test/integration에 유지)

- `utils.integration.test.ts`: test/integration **유지**
  - **사유**: "유틸리티 **통합** 테스트"로서 여러 서비스 협업 검증 필요
  - **참고**: 통합 테스트로 분류되는 것이 맞음

### 유지된 파일 (test/integration에 남음)

- `gallery-activation.test.ts`: 갤러리 행위 통합 테스트
- `service-lifecycle.test.ts`: 서비스 생명주기 통합 테스트
- `utils.integration.test.ts`: 유틸리티 통합 (미디어 추출 워크플로우)
- `full-workflow.test.ts`: 전체 워크플로우 통합 테스트
- `infrastructure/browser-utils.test.ts`: 브라우저 유틸리티

### 아카이브 파일 (test/archive/integration/)

- `bundle-vendor-tdz.test.ts`: TDD RED 단계, Phase 170B+ 해결
- `extension.integration.test.ts`: Placeholder 테스트
- `master-test-suite.test.ts`: Phase 4 완료 마커
- `vendor-tdz-resolution.test.ts`: TDD GREEN 검증

---

### bundle-vendor-tdz, vendor-tdz-resolution

→ `@shared/external/vendors` 테스트는 `test/unit/external/` 참고

### extension.integration

→ E2E 테스트: `playwright/smoke/`

---

## 📝 최근 업데이트

- **2025-10-25**: Phase 171B - 아카이브 통합 관리 (test/archive/integration으로
  이동)
  - `bundle-vendor-tdz.test.ts`: test/integration/archive →
    **test/archive/integration/**
  - `extension.integration.test.ts`: test/integration/archive →
    **test/archive/integration/**
  - `master-test-suite.test.ts`: test/integration/archive →
    **test/archive/integration/**
  - `vendor-tdz-resolution.test.ts`: test/integration/archive →
    **test/archive/integration/**
  - 이유: test/archive 폴더에서 모든 아카이브 파일을 일괄 관리하기 위함
