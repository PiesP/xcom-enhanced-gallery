# test/unit/lint - 코딩 정책 검증 테스트

> 🎯 **목적**: 프로젝트 코딩 규칙과 아키텍처 정책 자동 검증

## 개요

<<<<<<< Updated upstream
**28개 테스트 파일** | 정책 검증 전담 | CI/pre-commit 자동화
=======
**29개 테스트 파일** | 정책 검증 전담 | CI/pre-commit 자동화

**최근 통합** (Phase 186): wheel-listener-direct-use.policy 추가
>>>>>>> Stashed changes

### 검증 범위

- ✅ **Vendor getter 규칙**: Solid.js, fflate 직접 import 금지
- ✅ **Userscript 규칙**: GM\_\* API 직접 호출 금지
- ✅ **PC-only 이벤트**: Touch/Pointer 이벤트 금지
<<<<<<< Updated upstream
- ✅ **Event 정책**: wheel 리스너 직접 등록 금지
=======
- ✅ **Event 정책**: wheel 리스너 직접 등록 금지 (중앙화된 유틸만 허용)
>>>>>>> Stashed changes
- ✅ **import 순서**: 타입 → 외부 → 내부 → 스타일
- ✅ **배럴 export**: 심볼 재export만 허용
- ✅ **직접 import 금지**: 안전 getter 경유 필수
- ✅ **파일명 규칙**: kebab-case 필수

## 📂 파일 분류

### Vendor/Userscript 정책

| 파일                                             | 역할                               |
| ------------------------------------------------ | ---------------------------------- |
| **icon-libraries-no-static-imports.red.test.ts** | 외부 아이콘 라이브러리 import 금지 |
| **vendor-dependency-rules.test.ts**              | Vendor getter 사용 강제 (신규)     |
| vendor-getter.strict.scan.red.test.ts            | Vendor getter 정책 검증            |
| userscript-gm.direct-usage.scan.red.test.ts      | GM\_\* 직접 호출 금지 검증         |
| vendor-manager.runtime-imports.red.test.ts       | Vendor manager 구조 검증           |
| vendor-api.imports.scan.red.test.ts              | Vendor API import 구조             |

### Input/Event 정책

<<<<<<< Updated upstream
| 파일                                      | 역할                      |
| ----------------------------------------- | ------------------------- |
| forbidden-touch-events.test.ts            | Touch 이벤트 금지 검증    |
| wheel-listener-direct-use.policy.red.test | wheel 이벤트 직접 등록 금 |
=======
| 파일                                            | 역할                                  |
| ----------------------------------------------- | ------------------------------------- |
| forbidden-touch-events.test.ts                  | Touch 이벤트 금지 검증                |
| **wheel-listener-direct-use.policy.red.test.ts** | wheel 이벤트 직접 등록 금지 (Phase 186) |
>>>>>>> Stashed changes

### Import/Export 정책

| 파일                                        | 역할                     |
| ------------------------------------------- | ------------------------ |
| direct-imports-source-scan.test.js          | 직접 import 검사         |
| barrel-reimport.cycle.scan.red.test.ts      | 배럴 순환 참조 검사      |
| type-only-imports.policy.red.test.ts        | 타입 import 순서         |
| features-barrel.class-exports.scan.red.test | Feature 배럴 export 정책 |
| features-barrel.surface.scan.red.test.ts    | Feature 배럴 표면 검증   |
| lint-getter-policy.test.ts                  | 서비스 getter 정책       |

### 서비스/상태 경계

| 파일                                        | 역할                          |
| ------------------------------------------- | ----------------------------- |
| features-no-servicemanager.imports.red.test | Feature ServiceManager 금지   |
| utils-services-boundary.scan.red.test.ts    | Utils/Services 경계 검증      |
| runtime-appcontainer.imports.red.test.ts    | AppContainer 직접 import 금지 |

### 명명/정책 검증

| 파일                                          | 역할                               |
| --------------------------------------------- | ---------------------------------- |
| service-keys.naming.scan.test.ts              | SERVICE_KEYS 명명 규칙 검증 (신규) |
| --------------------------------------------- | -------------------------          |
| test-console-logs.test.ts                     | 프로덕션 console.log 금지          |
| animation-alias-removal.test.ts               | 불필요한 alias 제거                |
| i18n-literal.scan.red.test.ts                 | 문자열 하드코딩 금지               |
| icons-used-only.scan.red.test.ts              | 미사용 아이콘 검사                 |
| media-barrel.avoidance.guard.test.ts          | Media 배럴 회피                    |
| media-cycle.prune.red.test.ts                 | Media 순환 참조 제거               |
| selectors-single-source.scan.red.test.ts      | Selectors 단일 소스                |
| service-keys.direct-usage.scan.red.test.ts    | ServiceKey 직접 사용 금지          |
| timer-direct-usage.scan.red.test.ts           | Timer 직접 사용 금지               |
| zip-api-surface.scan.red.test.ts              | ZIP API 표면                       |
| zip-direct-usage.scan.red.test.ts             | ZIP 직접 사용 금지                 |
| toast-ui-barrel.stateful-exports.guard.test   | Toast UI 배럴 상태                 |
| toast-ui-components.no-local-state.guard.test | Toast UI 로컬 상태 금지            |

## 🔍 사용 패턴

### 로컬 실행

```bash
# 전체 lint 테스트
npm run test:unit -- test/unit/lint

# 특정 정책만 실행
npm run test:unit -- -t "vendor"
npm run test:unit -- -t "getter"
npm run test:unit -- -t "barrel"

# Watch 모드
npm run test:watch -- test/unit/lint
```

### 검증 명령어

```bash
# 전체 검증 (lint + typecheck + format)
npm run validate

# 특정 정책만 검증
npm run lint:fix
```

## 📋 신규 정책 추가 가이드

정책 테스트를 추가할 때:

1. **파일명**: `<정책명>.test.ts` 또는 `<정책명>.scan.red.test.ts`
2. **위치**: `test/unit/lint/`
3. **구조**:

```typescript
describe('정책명 검증', () => {
  it('규칙 설명', async () => {
    // 소스 파일 스캔
    // 위반 사항 검사
    // expect 검증
  });
});
```

1. **Vitest**: `fast` 또는 `unit` 프로젝트에 포함 됨

## 🧪 테스트 규칙

| 규칙        | 설명                   |
| ----------- | ---------------------- |
| RED 테스트  | 정책 위반 시 실패 보장 |
| Scan 테스트 | 파일 시스템 스캔 기반  |
| Guard       | 회귀 방지 검증         |

## 🔗 관련 문서

- **[docs/CODING_GUIDELINES.md](../../docs/CODING_GUIDELINES.md)**: 3대 핵심
  원칙
- **[docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)**: 계층 구조
- **[docs/DEPENDENCY-GOVERNANCE.md](../../docs/DEPENDENCY-GOVERNANCE.md)**:
  의존성 정책
- **[test/unit/README.md](../README.md)**: 전체 유닛 테스트 가이드

---

**마지막 업데이트**: 2025-10-25 (Phase 181 - test/unit/events 정책 통합)
