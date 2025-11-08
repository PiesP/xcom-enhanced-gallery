# test/unit/features/settings — 설정 기능 테스트 가이드

> **업데이트**: 2025-10-25 (Phase 183) | **상태**: ✅ 모두 활성

이 디렉토리는 설정(Settings) 기능의 **3개 활성 테스트** 파일을 포함합니다.

## 📋 테스트 파일 목록

### 1. `settings-migration.schema-hash.test.ts` (71줄)

**목적**: 설정 마이그레이션 시 스키마 해시 검증

**테스트 유형**: 통합 테스트 (Integration)

**주요 검증**:

- 저장된 설정의 `__schemaHash` 변경 감지 및 마이그레이션
- 첫 실행 시 기본값 초기화 및 현재 해시 작성
- 반복 초기화 시 멱등성(idempotent) 보장

**실행 방법**:

```bash
npm run test:unit -- -t "SETTINGS-MIG-HASH-01"
npm run test:watch -- -t "migrates and saves"
```

**주요 강조사항**:

- `stripVolatile()` 헬퍼로 시간 변동값 제거
- `InMemoryStorageAdapter` 모킹으로 격리된 환경 제공
- 타입 검증으로 `DEFAULT_SETTINGS` 모양 확인

---

### 2. `settings-migration.behavior.test.ts` (47줄)

**목적**: 설정 마이그레이션 동작 검증

**테스트 유형**: 단위 테스트 (Unit)

**주요 검증**:

- 누락된 필드 기본값 채우기 (사용자 설정값 보존)
- 알 수 없는 필드 제거 (프루닝)
- 반복 마이그레이션 시 동일 결과 보장

**실행 방법**:

```bash
npm run test:unit -- -t "SettingsMigration"
npm run test:watch -- -t "누락된 필드"
```

**주요 강조사항**:

- 순수 함수 테스트 (외부 의존 없음)
- 한국어 테스트 설명으로 명확성 높음
- `stripVolatile()` 헬퍼로 변동값 제거

---

### 3. `services/twitter-token-extractor.test.ts` (115줄)

**목적**: Twitter 토큰 추출 서비스 검증

**테스트 유형**: 통합 테스트 (Integration)

**주요 검증**:

- 초기화/정리 리소스 관리
- 토큰 추출 우선순위 (script tag > cookie > fallback)
- 토큰 형식 검증
- 오류 처리 및 폴백 로직

**테스트 그룹**:

1. **initialization**: 인스턴스 생명주기 (3개 테스트)
2. **token extraction priority**: 소스 우선순위 검증 (2개 테스트)
3. **fallback and error handling**: 에러 처리 (1개 테스트)
4. **token validation**: 형식 검증 (2개 테스트)

**실행 방법**:

```bash
npm run test:unit -- -t "TwitterTokenExtractor"
npm run test:watch -- -t "initialization"
npm run test:unit -- -t "token extraction priority"
```

**주요 강조사항**:

- `vi.resetModules()` 적용으로 모듈 격리
- DOM 조작(innerHTML, cookie, storage) 완전 정리
- 동적 import로 테스트별 독립성 보장

---

## 🎯 실행 전략

### 단계별 실행

```bash
# 1. 빠른 검증 (해시 + 마이그레이션 동작)
npm run test:unit -- test/unit/features/settings/settings-migration.*.test.ts

# 2. 토큰 추출 서비스 검증
npm run test:unit -- test/unit/features/settings/services/twitter-token-extractor.test.ts

# 3. 전체 settings 테스트
npm run test:unit -- test/unit/features/settings

# 4. 워치 모드 (개발 중)
npm run test:watch -- -t "Settings"
```

### 프로젝트 통합

설정 테스트는 다음 projects에 포함됩니다:

- ✅ **unit**: 전체 테스트 포함
- ✅ **fast**: settings 테스트 제외 (성능상)
- ✅ **smoke**: 포함되지 않음 (구성 테스트만)

---

## ⚠️ 주의사항

### 1. 모듈 격리 (twitter-token-extractor.test.ts)

`vi.resetModules()`를 사용하므로, 각 테스트가 독립적 모듈 로드를 수행합니다.
따라서 **shared state** 오염이 없으며, 테스트 순서와 무관하게 안정적입니다.

### 2. 스토리지 모킹

- `InMemoryStorageAdapter`: localStorage/sessionStorage를 메모리에서 시뮬레이션
- 테스트 간 자동 정리로 격리 보장
- 실제 localStorage 동작과 동일한 인터페이스

### 3. DOM 정리

`beforeEach()` 단계에서 완전 정리:

```typescript
document.body.innerHTML = '';
document.cookie = '';
localStorage.clear();
sessionStorage.clear();
```

---

## 📊 커버리지 & 성능

| 파일                                       | 행수 | 실행 시간 | 테스트 수 |
| ------------------------------------------ | ---- | --------- | --------- |
| `settings-migration.schema-hash.test.ts`   | 71   | ~100ms    | 3         |
| `settings-migration.behavior.test.ts`      | 47   | ~50ms     | 3         |
| `services/twitter-token-extractor.test.ts` | 115  | ~200ms    | 8         |
| **합계**                                   | 233  | ~350ms    | **14**    |

---

## 🔧 주요 개선사항 (Phase 183)

- ✅ `Phase 124` 참고 주석 제거 → 가독성 개선
- ✅ 테스트 설명 명확화 (describe 블록 단순화)
- ✅ 문서 작성으로 **온보딩 용이**

---

## 📚 관련 문서

- `docs/CODING_GUIDELINES.md` - 코딩 규칙
- `docs/TESTING_STRATEGY.md` - 테스트 전략 (통합/단위 구분)
- `docs/TDD_REFACTORING_PLAN.md` - Phase 183 기록
