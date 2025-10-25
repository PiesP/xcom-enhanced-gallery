# test/archive/unit/core# test/archive/unit/core

완료된 또는 폐기된 `test/unit/core` 관련 테스트들의 보관소입니다.완료된 또는
폐기된 `test/unit/core` 관련 테스트 파일들의 보관소입니다.

## 📋 파일 목록## 📋 파일 목록 및 상태

| 파일명 | 크기 | 상태 | 비고 |### 아카이브된 파일

|--------|------|------|------|

| `result-error-model.red.test.ts` | 16줄 | RED | Error Model v2 미구현 ||
파일명 | 크기 | 상태 | 사유 | 원본 경로 |

| `service-manager.test.integration.ts` | 324줄 | 폐기 | Mock만 포함, 실제 구현
검증 없음 ||--------|------|------|------|----------|

| `browser-compatibility.deprecated.test.ts` | 321줄 | 폐기 | Userscript와 무관
|| `result-error-model.red.test.ts` | 16줄 | RED (실패) | Error Model v2 미구현
기능 | `test/unit/core/result/` |

| `service-manager.test.integration.ts` | 324줄 | 아카이브 | 실제 구현 검증
없음, 테스트용 Mock만 포함 | `test/unit/core/` |

## 📝 파일 설명| `browser-compatibility.deprecated.test.ts` | 321줄 | 폐기 | 유저스크립트와 무관한 브라우저 확장 테스트 | `test/unit/core/` |

### result-error-model.red.test.ts## 🎯 각 파일 설명

RED 테스트. BulkDownloadService의 EMPTY_INPUT 에러 코드 검증 (미구현).###
result-error-model.red.test.ts

### service-manager.test.integration.ts- **목적**: BulkDownloadService의 EMPTY_INPUT 에러 코드 검증

- **상태**: RED 테스트 (실패 상태)

ServiceManager 의존성/생명주기 테스트.- **사유**: ErrorCode 필드가 아직 구현되지
않음

- **검토 필요**: ErrorCode 구현 완료 후 활성 테스트로 복구 가능

**문제점:**

- 실제 구현(`src/shared/services/service-manager.ts`) 미검증###
  service-manager.test.integration.ts

- `TestServiceManager` Mock만 사용- **목적**: ServiceManager의 의존성 관리 및
  생명주기 테스트

- 프로젝트 구조 불일치- **문제점**:
  - 실제 `src/shared/services/service-manager.ts` 구현을 테스트하지 않음

### browser-compatibility.deprecated.test.ts - 테스트 전용 `TestServiceManager` Mock 클래스만 사용

- 프로젝트의 실제 서비스 관리 구조와 불일치

브라우저 환경 호환성 테스트.- **검토**: 실제 ServiceManager와 연계하는 통합
테스트로 재작성 필요

**폐기 사유:**### browser-compatibility.deprecated.test.ts

- 프로젝트는 Userscript (Browser Extension 아님)- **목적**: 브라우저 환경 호환성
  테스트 (Chrome/Firefox extension 기반)

- 실제 코드 없음- **폐기 사유**:
  - 프로젝트는 **Userscript** 기반 (Browser Extension 아님)

## 🔄 변경사항 (Phase 179, 2025-10-25) - 실제 코드베이스에 대응하는 구현 없음

- 테스트 대상 로직이 프로젝트에 존재하지 않음

`test/unit/core` 디렉토리 전체 정리:- **삭제 권장**: 재사용 가능성 매우 낮음

- ✅ `service-keys-validation.test.ts` →
  `test/unit/lint/service-keys.naming.scan.test.ts`## 🔄 파일 이동 이력

- ✅ `STABLE_SELECTORS.test.ts` → `test/guards/stable-selectors.scan.test.ts`

- 📦 나머지 3개 파일 → 아카이브### Phase 179 (2025-10-25)

- 🗑️ `test/unit/core` 원본 디렉토리 삭제- `test/unit/core` 디렉토리 전체
  리팩토링

- 파일별 적절한 위치로 재분류:

--- - ✅ `service-keys-validation.test.ts` →
`test/unit/lint/service-keys.naming.scan.test.ts`

- ✅ `STABLE_SELECTORS.test.ts` → `test/guards/stable-selectors.scan.test.ts`

참고: `docs/TESTING_STRATEGY.md` · `docs/TDD_REFACTORING_PLAN.md` - 📦 나머지
파일 → 이 아카이브로 이동

## 💡 참고사항

- 아카이브 파일은 **CI 테스트에서 제외**됩니다
- 참고/학습용으로만 보관됩니다
- 필요시 재활성화 가능하나 현재는 우선순위 낮음

## 다음 단계

1. **result-error-model.red.test.ts**: ErrorCode 구현 후 활성 테스트로 복구
2. **service-manager.test.integration.ts**: 실제 구현과의 통합 테스트로 재작성
   또는 유지보수
3. **browser-compatibility.deprecated.test.ts**: 재사용 가능성 낮으면 완전 삭제
   검토

---

관련 문서: `docs/TESTING_STRATEGY.md` · `docs/TDD_REFACTORING_PLAN.md` ·
`test/README.md`
