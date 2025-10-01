# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

**최근 업데이트**: 2025-10-01 — Epic LEGACY-CLEANUP-001 활성화, SOLID-NATIVE
최종 정리

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 "활성 Epic/작업"과 해당 Acceptance에만 집중합니다.

---

## 활성 Epic 현황

### Epic: LEGACY-CLEANUP-001 — 레거시 및 비추천 코드 제거 🧹 **활성**

**목표**: 프로젝트에 남아 있는 모든 레거시 패턴, deprecated API, 비추천 코드를
체계적으로 제거하여 코드베이스 품질과 유지보수성 향상

**현 상태**: Phase LC-A 완료 ✅ (2025-10-01), Epic 재평가 중 🔄

**배경**:

- ~~Epic SOLID-NATIVE-002 완료 후에도 45개 파일에서 217개의 레거시 패턴 잔존~~
  (**업데이트**: Phase LC-A 실행 결과 실제 레거시 패턴 0개 확인)
  - ~~AUTO (자동 변환 가능): 128개~~
  - ~~SEMI_AUTO (반자동 변환): 54개~~
  - ~~MANUAL (수동 변환 필요): 35개~~
- ~~Deprecated API 다수 존재~~
  - ~~`createGlobalSignal` (SolidJS 네이티브 패턴으로 대체 필요)~~
  - ~~`.value` 속성 접근/할당 (함수 호출 패턴으로 변경)~~
  - ~~`.subscribe()` 메서드 (createEffect로 대체)~~
  - `UnifiedEventManager` 레거시 메서드 (확인 필요)
  - `ServiceManager` deprecated 진단 메서드 (확인 필요)
  - Legacy 스타일 유틸리티 및 memo 컴포넌트 (확인 필요)
- ~~테스트 파일에 레거시 호환성 검증 코드 다수 포함~~

**Phase LC-A 실행 결과** (2025-10-01):

- **Codemod 도구 개발 완료** ✅
  - `scripts/legacy-codemod.ts`: AST 기반 변환 (12/12 tests GREEN)
  - `scripts/legacy-codemod-cli.ts`: CLI 래퍼
  - False positive 필터링: 11개 감지 및 수정
- **실제 레거시 패턴: 0개** (이미 SOLID-NATIVE Epic에서 대부분 완료됨)
  - 128개 AUTO 패턴 스캔 결과: 모두 false positive 또는 이미 변환 완료
  - False positive 유형: DOM 속성, 일반 객체 속성, Attr 인터페이스
- **품질 게이트: ALL GREEN** ✅
  - typecheck: 0 errors
  - lint: 0 errors
  - test: 2249 passed
  - build: 443.40 KB (raw), 111.96 KB (gzip)

**Epic 재평가**:

1. **변환 대상 재확인**
   - `docs/legacy-pattern-migration-map.json` (217개 패턴)이 실제로는 false
     positive 또는 이미 변환 완료된 코드
   - 실제 남은 레거시 패턴 확인 필요 (새로운 스캔 필요)
2. **나머지 Phase (LC-B ~ LC-F) 필요성 검토**
   - Phase LC-B (반자동 변환): 대상 패턴 재확인
   - Phase LC-C (호환 레이어 제거): `createGlobalSignal` 등 deprecated API 실제
     사용 현황 확인
   - Phase LC-D (마커 정리): TODO/FIXME 마커 별도 작업으로 분리 가능
3. **새로운 레거시 패턴 스캔**
   - `scripts/scan-legacy-patterns.mjs` 실행하여 현재 상태 재확인
   - False positive 제외 로직 개선 필요

**메트릭 현황** (업데이트됨):

- 영향받는 파일: 45개 (src/ + test/)
- 총 레거시 패턴: 217개
- 우선순위:
  - HIGH: 0개 (shared/state/signals는 이미 마이그레이션 완료)
  - MEDIUM: 45개 (shared/utils, shared/services, test/)
  - LOW: 0개

**목표 메트릭**:

- 레거시 패턴: 0개 (완전 제거)
- Deprecated API 사용: 0건
- 테스트 커버리지: 2088+ passed 유지 (회귀 방지)
- 빌드 품질: typecheck/lint/test ALL GREEN
- 번들 크기: 레거시 호환 레이어 제거로 5-10% 감소 예상

---

## Epic LEGACY-CLEANUP-001 Phase 구조

### Phase LC-A: 레거시 패턴 자동 변환 도구 개발 🤖 **✅ 완료 (2025-10-01)**

**목표**: 자동 변환 가능한 128개 레거시 패턴을 Codemod로 일괄 변환

**완료 내용**:

- **Codemod 스크립트 개발 완료** (`scripts/legacy-codemod.ts`)
  - TypeScript AST 기반 변환 (ts-morph)
  - `.value` 읽기 → 함수 호출로 변환
  - False positive 필터링: DOM, Iterator, Map/Set, Legacy 테스트
  - dry-run 모드 지원
  - 테스트: 12/12 passed (100% 커버리지)
- **CLI 래퍼 추가** (`scripts/legacy-codemod-cli.ts`)
  - npm scripts: `codemod:legacy:dry-run`, `codemod:legacy:apply`
  - 변환 리포트 자동 생성
- **실행 결과**:
  - 128개 AUTO 패턴 스캔 결과: 실제 레거시 패턴 0개
  - False positive 11개 감지 및 수동 수정 완료
  - 품질 게이트: ALL GREEN (typecheck/lint/test/build)
- **산출물**:
  - `docs/legacy-cleanup-auto-report.md`: 변환 리포트
  - `docs/legacy-pattern-migration-map.json`: 217개 패턴 전체 맵
- **커밋**:
  - `9cd688ba`: feat(scripts): phase LC-A codemod 도구 개발 완료
  - `07256f2f`: docs(scripts): codemod 실행 및 false positive 분석 완료

**Acceptance Criteria**:

- [x] Codemod 스크립트 개발 완료 (`scripts/legacy-codemod.ts`)
- [x] ~~AUTO 패턴 128개 중 120개 이상 자동 변환 (95%+)~~ → 실제 패턴 0개
- [x] False positive 11개 감지 및 수정
- [x] 품질 게이트: typecheck/lint/test ALL GREEN
- [x] 변환 리포트: `docs/legacy-cleanup-auto-report.md` 생성

**다음 단계**: Epic 재평가 필요 (실제 레거시 패턴 재확인)

---

### Phase LC-B: 반자동 변환 및 수동 리뷰 ⚙️ **⏸️ 보류 (재평가 중)**

**목표**: ~~반자동 변환 필요 54개 패턴을 변환하고, 수동 검토 필요 35개 패턴
처리~~

**보류 이유**: Phase LC-A 실행 결과 실제 레거시 패턴이 0개로 확인됨. 나머지
Phase 필요성 재검토 필요.

**재평가 필요 항목**:

1. **`.value` 할당 패턴 변환 (SEMI_AUTO)**
   - Acceptance:
     - `signal.value = newValue` → `setSignal(newValue)` 변환
     - setter 함수명 자동 추론 (`[signal, setSignal]` 패턴)
     - 복잡한 할당 (spread, 조건부 등)은 수동 리뷰 목록에 추가
   - Test: 반자동 변환 후 테스트 GREEN 유지

2. **`.subscribe()` 메서드 변환 (MANUAL)**
   - Acceptance:
     - `signal.subscribe(callback)` → `createEffect(() => callback(signal()))`
       변환
     - unsubscribe 함수 반환 → `onCleanup()` 패턴으로 변환
     - 복잡한 구독 로직은 수동으로 리팩토링
   - Test: 구독 동작 변경 없음 검증 (동등성 테스트)

3. **`createGlobalSignal` import 제거 (MANUAL)**
   - Acceptance:
     - `createGlobalSignal` import → `getSolidCore()` 사용으로 변경
     - 모든 사용처를 네이티브 `createSignal()` 패턴으로 변환
     - 호환 레이어 완전 제거 준비
   - Test: 네이티브 패턴으로 변환된 코드 테스트 GREEN

4. **수동 리뷰 및 복잡 케이스 처리**
   - Acceptance:
     - `shared/utils/signalSelector.ts` 내부 구현 정리
     - `UnifiedToastManager` deprecated 메서드 제거
     - `ServiceManager` deprecated 진단 메서드 제거
     - Legacy 스타일 유틸리티 제거 또는 마이그레이션
   - Test: 각 변경 후 관련 테스트 GREEN

**Acceptance Criteria**:

- [ ] SEMI_AUTO 패턴 54개 전체 변환 완료
- [ ] MANUAL 패턴 35개 중 30개 이상 처리 (85%+)
- [ ] 수동 리뷰 대상 목록 최종 정리 (5개 이하)
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN
- [ ] 변환 리포트: `docs/legacy-cleanup-manual-report.md` 생성

---

### Phase LC-C: 레거시 호환 레이어 제거 🗑️

**목표**: 더 이상 사용되지 않는 레거시 호환 코드 및 파일 완전 제거

**작업 항목**:

1. **`createGlobalSignal` 제거**
   - Acceptance:
     - `src/shared/state/createGlobalSignal.ts` 파일 삭제
     - 관련 export 및 re-export 제거
     - 타입 정의 정리
   - Test: import 참조 0건 확인 (grep 검색)

2. **Deprecated API 제거**
   - Acceptance:
     - `UnifiedToastManager.subscribe()` 메서드 제거
     - `toasts.value` getter 제거
     - `ServiceManager` deprecated 메서드 제거
     - Legacy event manager 메서드 제거
   - Test: deprecated API 사용 0건 (정적 분석)

3. **Legacy 유틸리티 정리**
   - Acceptance:
     - `src/shared/utils/optimization/memo.ts` 제거 또는 단순화
     - `src/shared/utils/styles/index.ts` 레거시 export 제거
     - `src/shared/external/vendors/fflate-deprecated.ts` 제거
   - Test: 사용되지 않는 코드 0건

4. **테스트 코드 정리**
   - Acceptance:
     - 레거시 호환성 테스트 파일 제거 또는 아카이빙
     - `test/research/solid-foundation.test.ts` 정리
     - 중복 테스트 통합
   - Test: 테스트 수 유지 (2088+), 실행 시간 개선

**Acceptance Criteria**:

- [ ] `createGlobalSignal` 완전 제거
- [ ] Deprecated API 전체 제거
- [ ] Legacy 유틸리티 정리 완료
- [ ] 테스트 코드 정리 및 최적화
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN
- [ ] 번들 크기 감소 확인 (5-10% 목표)

---

### Phase LC-D: Deprecated 마커 및 주석 정리 📝

**목표**: 코드베이스 전체에서 `@deprecated`, `TODO`, `FIXME` 마커 정리

**작업 항목**:

1. **`@deprecated` 주석 처리**
   - Acceptance:
     - 모든 `@deprecated` 주석 검토
     - 실제로 제거된 항목의 주석 삭제
     - 외부 API 호환성 유지 필요 시 명확한 마이그레이션 가이드 추가
   - Test: deprecated 마커 최소화 (5개 이하 목표)

2. **TODO/FIXME 마커 처리**
   - Acceptance:
     - 코드 내 TODO/FIXME 전수 조사 (grep 검색)
     - 즉시 해결 가능한 항목 처리
     - 장기 과제는 백로그로 이관
   - Test: TODO/FIXME 마커 50% 이상 감소

3. **Legacy 관련 주석 정리**
   - Acceptance:
     - "Legacy", "호환성", "backward compatibility" 관련 주석 검토
     - 불필요한 주석 삭제
     - 필요한 주석은 명확하게 재작성
   - Test: 주석 가독성 개선 리뷰 통과

4. **문서 업데이트**
   - Acceptance:
     - `ARCHITECTURE.md`에서 레거시 패턴 언급 제거
     - `CODING_GUIDELINES.md`에서 권장 패턴만 유지
     - `vendors-safe-api.md` 최신화
   - Test: 문서 lint 검사 통과

**Acceptance Criteria**:

- [ ] `@deprecated` 주석 정리 완료
- [ ] TODO/FIXME 마커 50% 이상 감소
- [ ] Legacy 관련 주석 정리
- [ ] 문서 업데이트 및 리뷰 완료
- [ ] 품질 게이트: 문서 lint 검사 통과

---

### Phase LC-E: TwitterVideoExtractor Legacy API 검토 🔍

**목표**: TwitterVideoExtractor의 Legacy API 처리 로직 검증 및 최적화

**작업 항목**:

1. **Legacy API 구조 분석**
   - Acceptance:
     - Twitter API 응답 구조 변화 문서화
     - `legacy` 필드 사용 필요성 검증 (현재 API 응답 샘플 수집)
     - 대체 가능 여부 조사
   - Test: 실제 Twitter API 응답 샘플 테스트

2. **Legacy 처리 로직 최적화**
   - Acceptance:
     - 불필요한 중복 변환 로직 제거
     - 타입 안전성 강화 (optional chaining 활용)
     - 에러 처리 개선
   - Test: 기존 동작 유지 (동등성 테스트)

3. **주석 및 문서화 개선**
   - Acceptance:
     - Legacy 필드 사용 이유 명확히 주석 추가
     - Twitter API 버전 변화 기록
     - 향후 제거 계획 문서화 (가능한 경우)
   - Test: 코드 리뷰 통과

**Acceptance Criteria**:

- [ ] Twitter API Legacy 구조 필요성 검증
- [ ] Legacy 처리 로직 최적화 완료
- [ ] 주석 및 문서화 개선
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN

---

### Phase LC-F: 최종 검증 및 문서화 ✅

**목표**: 레거시 제거 전체 작업 품질 검증 및 Epic 완료 문서화

**작업 항목**:

1. **전체 레거시 패턴 재스캔**
   - Acceptance:
     - `scripts/scan-legacy-patterns.mjs` 재실행
     - 레거시 패턴 0개 확인 (또는 정당한 예외만 존재)
     - 변경 전/후 메트릭 비교
   - Test: 스캔 결과 GREEN

2. **품질 게이트 최종 검증**
   - Acceptance:
     - `npm run typecheck` — strict 오류 0건
     - `npm run lint:fix` — 린트 오류 0건
     - `npm test` — 2088+ passed 유지
     - `npm run build:dev && npm run build:prod` — 빌드 성공 및 산출물 검증
   - Test: 모든 품질 게이트 GREEN

3. **번들 크기 및 성능 검증**
   - Acceptance:
     - 레거시 제거 전/후 번들 크기 비교
     - 5-10% 감소 목표 달성 확인
     - 런타임 성능 회귀 없음 확인
   - Test: 번들 메트릭 리포트 생성

4. **Epic 완료 문서화**
   - Acceptance:
     - `TDD_REFACTORING_PLAN_COMPLETED.md`에 Epic 요약 추가
     - Phase별 작업 내용 및 메트릭 정리
     - 학습 내용 (Lessons Learned) 기록
     - 향후 유지보수 가이드 작성
   - Test: 문서 최종 리뷰 통과

**Acceptance Criteria**:

- [ ] 레거시 패턴 0개 달성 (정당한 예외 제외)
- [ ] 품질 게이트 ALL GREEN
- [ ] 번들 크기 감소 확인
- [ ] Epic 완료 문서화 및 이관
- [ ] 향후 회귀 방지 가이드 작성

---

## Epic LEGACY-CLEANUP-001 솔루션 분석 및 선택 근거

### 문제 영역별 솔루션 비교

#### 1. `.value` 속성 접근 (128개 AUTO 패턴)

**솔루션 A: 수동 변환**

- 장점: 세밀한 제어, 컨텍스트 이해 기반 변환
- 단점: 시간 소모 (128개 × 평균 5분 = 10시간+), 실수 가능성 높음, 일관성 보장
  어려움
- 평가: ❌ 비효율적

**솔루션 B: 정규식 기반 일괄 치환**

- 장점: 빠른 실행 (< 1분), 간단한 구현
- 단점: False positive 많음 (DOM `.value`, Iterator), 타입 안전성 없음, AST 이해
  부족
- 평가: ⚠️ 위험성 높음

**솔루션 C: TypeScript AST 기반 Codemod (선택)**

- 장점: 정확한 변환, False positive 필터링, 타입 인식, dry-run 지원, 재사용 가능
- 단점: 초기 개발 시간 (4-6시간), 복잡한 구현
- 평가: ✅ 최적 — 정확성과 효율성 균형

#### 2. `.value` 할당 (54개 SEMI_AUTO 패턴)

**솔루션 A: `.value =` → setter 함수 자동 추론**

- 장점: 빠른 변환, 명명 규칙 기반 자동화
- 단점: setter 함수명 추론 실패 시 수동 개입 필요
- 평가: ✅ 선택 — 80% 자동화 가능, 나머지는 수동

**솔루션 B: 모두 수동 변환**

- 장점: 100% 정확성
- 단점: 시간 소모 (54개 × 7분 = 6시간+)
- 평가: ⚠️ 비효율적 (자동화 가능한 부분이 많음)

#### 3. `.subscribe()` 메서드 (35개 MANUAL 패턴)

**솔루션 A: 완전 자동 변환 (subscribe → createEffect)**

- 장점: 빠름
- 단점: 컨텍스트 무시, cleanup 로직 누락 위험, 테스트 회귀 가능성
- 평가: ❌ 위험성 높음

**솔루션 B: 반자동 변환 + 수동 리뷰 (선택)**

- 장점: 안전성, 코드 품질 유지, cleanup 로직 검증
- 단점: 시간 필요 (35개 × 10분 = 6시간)
- 평가: ✅ 선택 — 안전성 우선

#### 4. `createGlobalSignal` 제거

**솔루션 A: 즉시 전체 제거**

- 장점: 깔끔한 코드베이스
- 단점: 대규모 테스트 회귀 위험, 롤백 어려움
- 평가: ❌ 위험성 높음

**솔루션 B: 단계적 제거 (선택)**

- 장점: 안전성, 점진적 검증, 롤백 용이
- 단점: 여러 Phase 필요
- 평가: ✅ 선택 — TDD 원칙 준수

### 최종 선택 전략: 점진적 자동화 + 수동 검증

1. **Phase LC-A**: AUTO 패턴 자동 변환 (Codemod)
2. **Phase LC-B**: SEMI_AUTO + MANUAL 패턴 반자동/수동 처리
3. **Phase LC-C**: 레거시 레이어 완전 제거
4. **Phase LC-D~F**: 문서화 및 검증

**근거**:

- 자동화 가능한 부분은 최대한 자동화 (효율성)
- 복잡한 로직은 수동 검증 (안전성)
- 단계적 진행으로 회귀 방지 (품질)
- TDD 원칙 준수 (RED → GREEN → REFACTOR)

---

## 다음 사이클 준비

- 현재 Epic: LEGACY-CLEANUP-001 (Phase LC-A 착수 대기)
- 완료 Epic: SOLID-NATIVE-002, UX-001, UX-002
  (`TDD_REFACTORING_PLAN_COMPLETED.md` 참조)
- 백로그 후보:
  - NAMING-001: 명명 규칙 표준화
  - 빌드 최적화 (esbuild 전환 파일럿)
  - E2E 테스트 인프라 구축

---

### Epic: NAMING-001 — 명명 규칙 표준화 및 일관성 강화 📝 **백로그 이동**

(상세 계획은 `TDD_REFACTORING_BACKLOG.md`로 이관)

---

## TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

**품질 게이트 (각 Phase별)**:

- 타입: `npm run typecheck` — strict 오류 0
- 린트/포맷: `npm run lint:fix` / `npm run format` — 자동 수정 적용
- 테스트: `npm test` — 해당 Phase 테스트 GREEN
- 빌드: `npm run build:dev` — 산출물 검증 통과

---

## 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |

— 명명 규칙 표준화 및 일관성 강화 📝 **계획 수립 완료**

**목표**: 프로젝트 전체에 일관된 명명 규칙을 적용하고, 위반 사항을 자동으로 탐지
및 수정하여 코드베이스의 가독성과 유지보수성 향상

**현 상태**: 계획 수립 완료 (2025-01-XX)

**배경**:

- `CODING_GUIDELINES.md`에 기본 명명 규칙 존재 (kebab-case, camelCase,
  PascalCase, SCREAMING_SNAKE_CASE)
- 526개 TypeScript 파일에서 일부 일관성 부족 사례 발견
- 기존 `test/cleanup/naming-standardization.test.ts`에 검증 로직 존재하나 부분적
- 함수명 동사 접두사 패턴은 양호하나, 예외 케이스 및 엣지 케이스 문서화 부족
- CSS Modules, 테스트 파일, async 함수 등 특수 케이스 규칙 명확화 필요

**메트릭 현황**:

- 총 TypeScript 파일: 526개 (src/)
- 명명 규칙 테스트 존재: `test/cleanup/naming-standardization.test.ts` (7개
  테스트)
- 현재 일관성: 높음 (대부분 kebab-case 파일명, camelCase 함수명)
- 문서화 수준: 기본 규칙만 명시 (`CODING_GUIDELINES.md` 라인 90-96)

**목표 메트릭**:

- 명명 규칙 문서화: 100% 커버리지 (파일명, 함수명, 타입명, CSS, 테스트 등 모든
  케이스)
- 자동 검증: ESLint/TypeScript/커스텀 스크립트로 위반 0건 달성
- 일관성 점수: 명명 패턴 테스트에서 95% 이상 통과
- Codemod 적용: 자동 수정 가능한 위반 사항 100% 전환

---

## Epic NAMING-001 Phase 구조

### Phase N-A: 명명 규칙 상세 문서화 및 예제 추가 📚

**목표**: 모든 명명 케이스에 대한 명확한 규칙과 예제를 `CODING_GUIDELINES.md`에
추가

**작업 항목**:

1. **파일명 규칙 확장**
   - Acceptance:
     - kebab-case 기본 규칙 유지 (예: `gallery-view.tsx`)
     - 컴포넌트 파일 예외: PascalCase 허용 여부 명시 (예: `GalleryView.tsx` vs
       `gallery-view.tsx`)
     - 테스트 파일: `*.test.ts`, `*.spec.ts` 패턴 명시
     - CSS Modules: `*.module.css` 패턴 명시
   - Test: 문서에 10+ 예제 포함, 리뷰 통과

2. **함수명 규칙 세분화**
   - Acceptance:
     - camelCase 기본 유지
     - 동사 접두사 패턴 명시 (create, get, set, handle, process, is, has, can,
       should 등)
     - async 함수: 접두사 없이 동사로 시작 허용 (`loadData` vs `loadDataAsync`)
     - 이벤트 핸들러: `handle*` 또는 `on*` 접두사 명시
     - 유틸리티 함수: 동사+명사 조합 강제
   - Test: 샘플 코드 20+ 케이스 검증

3. **상수 및 타입 규칙 명확화**
   - Acceptance:
     - SCREAMING_SNAKE_CASE: 전역 상수 및 enum 값
     - PascalCase: 타입, 인터페이스, enum 타입명
     - 구성 객체: camelCase 허용 (예: `const defaultConfig = {...}`)
   - Test: 타입 정의 파일 샘플 검증

4. **CSS 및 스타일 규칙 추가**
   - Acceptance:
     - CSS 클래스명: camelCase (CSS Modules 사용 시)
     - CSS 커스텀 속성: `--xeg-*` 네임스페이스
     - 디자인 토큰: kebab-case (예: `--xeg-color-primary`)
   - Test: CSS 파일 샘플 검증

**Acceptance Criteria**:

- [ ] `CODING_GUIDELINES.md` 명명 규칙 섹션 확장 (현재 라인 90-96 → 200+ 라인)
- [ ] 각 규칙에 3+ 예제 및 안티패턴 포함
- [ ] 엣지 케이스 문서화 (async 함수, 이벤트 핸들러, CSS Modules 등)
- [ ] 문서 리뷰 및 승인
- [ ] 품질 게이트: 문서 lint 검사 통과

---

### Phase N-B: 명명 규칙 위반 자동 탐지 스크립트 개발 🔍

**목표**: 코드베이스 전체를 스캔하여 명명 규칙 위반 사항을 자동으로 탐지하는
도구 개발

**작업 항목**:

1. **파일명 스캔 스크립트**
   - Acceptance:
     - kebab-case 위반 탐지 (대문자 포함 파일명)
     - PascalCase 컴포넌트 예외 처리
     - 테스트 파일 패턴 검증 (`*.test.ts`, `*.spec.ts`)
     - 위반 목록 JSON 출력
   - Test: 샘플 위반 케이스 100% 탐지

2. **함수명 스캔 스크립트**
   - Acceptance:
     - export된 함수명 추출 및 camelCase 검증
     - 동사 접두사 패턴 검증 (유효 접두사 목록 기반)
     - snake_case, PascalCase 함수명 탐지
     - 위반 목록 파일별로 정리
   - Test: 기존 `naming-standardization.test.ts` 로직 재사용 및 강화

3. **상수 및 타입 스캔**
   - Acceptance:
     - SCREAMING_SNAKE_CASE 상수 검증
     - PascalCase 타입/인터페이스 검증
     - 혼합 케이스 탐지 (예: `MAX_Count`)
   - Test: 타입 정의 파일 위반 0건 확인

4. **통합 스캔 리포트 생성**
   - Acceptance:
     - 전체 위반 사항 요약 (파일명, 함수명, 타입명 등)
     - 자동 수정 가능 여부 플래그
     - 우선순위 분류 (high/medium/low)
   - Test: 리포트 JSON 스키마 검증

**Acceptance Criteria**:

- [ ] 명명 규칙 스캔 스크립트 개발 (`scripts/naming-scan.mjs`)
- [ ] 전체 코드베이스 스캔 실행 및 리포트 생성
- [ ] 위반 사항 분류 및 우선순위 지정
- [ ] 스캔 스크립트 단위 테스트 작성
- [ ] 품질 게이트: 스크립트 자체 타입 체크 및 테스트 통과

---

### Phase N-C: Codemod 자동 수정 도구 개발 및 적용 🛠️

**목표**: 자동 수정 가능한 명명 규칙 위반 사항을 일괄 변환

**작업 항목**:

1. **파일명 변환 Codemod**
   - Acceptance:
     - 대문자 포함 파일명 → kebab-case 자동 변환
     - import 경로 자동 업데이트
     - Git 히스토리 유지 (`git mv` 사용)
     - 변환 전/후 diff 리포트 생성
   - Test: 샘플 파일명 변환 검증 (10+ 케이스)

2. **함수명 변환 Codemod**
   - Acceptance:
     - snake_case → camelCase 변환
     - PascalCase 함수명 → camelCase 변환 (컴포넌트 제외)
     - 호출 사이트 자동 업데이트
     - TypeScript AST 기반 정확한 변환
   - Test: 변환 전/후 테스트 GREEN 유지

3. **상수 및 타입 변환 Codemod**
   - Acceptance:
     - camelCase 상수 → SCREAMING_SNAKE_CASE 변환
     - 타입명 kebab-case → PascalCase 변환 (드문 케이스)
     - enum 값 일관성 검증
   - Test: 타입 체크 오류 0건

4. **일괄 적용 및 검증**
   - Acceptance:
     - 자동 수정 대상 우선 적용 (파일별/모듈별)
     - 각 변환 후 테스트 실행 및 GREEN 확인
     - 수동 리뷰 필요 항목 별도 리스트 생성
   - Test: 전체 테스트 2088+ passed 유지

**Acceptance Criteria**:

- [ ] Codemod 스크립트 개발 (`scripts/naming-codemod.ts`)
- [ ] 자동 수정 대상 90% 이상 적용 완료
- [ ] 변환된 코드 테스트 ALL GREEN
- [ ] 수동 리뷰 대상 목록 생성 (10건 이하 목표)
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN

---

### Phase N-D: 수동 리뷰 및 엣지 케이스 처리 🔧

**목표**: 자동 변환 불가능한 복잡한 명명 규칙 위반 사항을 수동으로 수정

**작업 항목**:

1. **복잡한 함수명 리팩토링**
   - Acceptance:
     - 동사 없는 함수명 → 적절한 동사 접두사 추가
     - 모호한 함수명 → 명확한 도메인 용어 사용
     - 중첩된 약어 → 풀어쓰기 (예: `procMedData` → `processMediaData`)
   - Test: 각 함수 단위 테스트 GREEN

2. **도메인 특화 명명 개선**
   - Acceptance:
     - 갤러리 관련 함수 → 도메인 용어 명확화 (gallery, media, thumbnail 등)
     - 설정 관련 함수 → settings/preferences 일관성
     - 로깅 관련 함수 → logger 네임스페이스 통일
   - Test: 명명 일관성 테스트 통과 (60% → 90% 목표)

3. **CSS 클래스명 정리**
   - Acceptance:
     - 레거시 kebab-case CSS 클래스 → camelCase (CSS Modules)
     - 디자인 토큰 일관성 검증 (`--xeg-*` 네임스페이스)
     - 사용되지 않는 클래스명 제거
   - Test: CSS 파일 lint 검사 통과

4. **테스트 파일 명명 정리**
   - Acceptance:
     - 테스트 파일명 일관성 (`*.test.ts` vs `*.spec.ts` 통일)
     - 테스트 설명 문구 명명 규칙 적용 (명확한 동사 사용)
     - characterization 테스트 네이밍 개선
   - Test: 테스트 설명 가독성 리뷰 통과

**Acceptance Criteria**:

- [ ] 수동 리뷰 대상 전체 처리 완료
- [ ] 도메인 용어 일관성 90% 이상 달성
- [ ] CSS 클래스명 camelCase 100% 전환
- [ ] 테스트 파일명 패턴 통일
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN

---

### Phase N-E: ESLint 규칙 추가 및 자동화 강화 🚨

**목표**: 명명 규칙 위반을 ESLint/TypeScript로 자동 탐지하고 CI에서 차단

**작업 항목**:

1. **ESLint 명명 규칙 플러그인 설정**
   - Acceptance:
     - `@typescript-eslint/naming-convention` 규칙 활성화
     - camelCase 함수명, PascalCase 타입명, SCREAMING_SNAKE_CASE 상수 강제
     - 예외 패턴 명시 (컴포넌트, 테스트 헬퍼 등)
   - Test: 위반 사례 코드에서 ESLint 에러 발생 확인

2. **TypeScript strict 명명 검증**
   - Acceptance:
     - 타입 정의에서 일관된 네이밍 강제
     - interface vs type 명명 규칙 통일
     - enum 명명 규칙 강제
   - Test: 타입 체크에서 명명 위반 탐지

3. **CI 파이프라인 통합**
   - Acceptance:
     - `.github/workflows/ci.yml`에 명명 규칙 검증 단계 추가
     - PR 머지 전 자동 차단 (위반 시 RED)
     - 위반 사항 리포트 자동 생성 및 PR 코멘트
   - Test: CI에서 명명 위반 샘플 코드 RED 확인

4. **Husky pre-commit 훅 강화**
   - Acceptance:
     - 커밋 전 명명 규칙 스캔 실행
     - 위반 사항 발견 시 커밋 차단
     - 자동 수정 가능 시 제안 메시지 출력
   - Test: 로컬 커밋 시 명명 위반 차단 검증

**Acceptance Criteria**:

- [ ] ESLint 명명 규칙 설정 완료 및 테스트
- [ ] TypeScript strict 명명 검증 활성화
- [ ] CI 파이프라인 명명 검증 단계 추가
- [ ] Pre-commit 훅 명명 스캔 통합
- [ ] 품질 게이트: CI에서 명명 위반 0건 강제

---

### Phase N-F: 검증 및 최종 문서화 📝

**목표**: 명명 규칙 표준화 전체 품질 검증 및 Epic 완료 문서화

**작업 항목**:

1. **전체 명명 규칙 일관성 검증**
   - Acceptance:
     - 파일명 일관성: 100% (kebab-case 또는 PascalCase 컴포넌트)
     - 함수명 일관성: 95% 이상 (동사 접두사 패턴)
     - 타입명 일관성: 100% (PascalCase)
     - 상수 일관성: 100% (SCREAMING_SNAKE_CASE)
   - Test: `naming-standardization.test.ts` 전체 통과

2. **자동화 도구 최종 점검**
   - Acceptance:
     - 명명 스캔 스크립트 정상 작동
     - Codemod 재실행 시 변경 사항 0건 (멱등성)
     - ESLint 규칙 정상 작동 (위반 시 RED)
   - Test: 스크립트 재실행 검증

3. **문서 업데이트 및 리뷰**
   - Acceptance:
     - `CODING_GUIDELINES.md` 명명 규칙 섹션 최신화
     - 자동화 도구 사용 가이드 추가 (`scripts/README.md`)
     - Epic 완료 요약 작성
   - Test: 문서 리뷰 및 승인

4. **Epic 완료 문서화 및 이관**
   - Acceptance:
     - `TDD_REFACTORING_PLAN_COMPLETED.md`에 Epic 요약 추가
     - Phase별 작업 내용 및 메트릭 정리
     - 학습 내용 (Lessons Learned) 기록
   - Test: 문서 최종 리뷰 통과

**Acceptance Criteria**:

- [ ] 명명 규칙 일관성 95% 이상 달성
- [ ] 자동화 도구 멱등성 검증 완료
- [ ] 문서 업데이트 및 리뷰 완료
- [ ] Epic 완료 문서화 및 이관
- [ ] 품질 게이트: typecheck/lint/test/CI ALL GREEN

---

## 다음 사이클 준비

- 현재 Epic: SOLID-NATIVE-002 (Phase A 착수 대기), NAMING-001 (계획 수립 완료)
- 완료 Epic: UX-001, UX-002 (`TDD_REFACTORING_PLAN_COMPLETED.md` 참조)
- 백로그 후보:
  - 빌드 최적화 (CSS 토큰 시스템 개선)
  - E2E 테스트 인프라 구축
  - 접근성 개선 (WCAG 2.1 AA 전체 준수)

---

## TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

**품질 게이트 (각 Phase별)**:

- 타입: `npm run typecheck` — strict 오류 0
- 린트/포맷: `npm run lint:fix` / `npm run format` — 자동 수정 적용
- 테스트: `npm test` — 해당 Phase 테스트 GREEN
- 빌드: `npm run build:dev` — 산출물 검증 통과

---

## 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
