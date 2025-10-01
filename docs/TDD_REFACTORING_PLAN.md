# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

**최근 업데이트**: 2025-10-01 — Epic SOLID-NATIVE-002 계획 수립

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 "활성 Epic/작업"과 해당 Acceptance에만 집중합니다.

---

## 활성 Epic 현황

### Epic: SOLID-NATIVE-002 — Preact Signals 레거시 완전 제거 🚀 **진행 예정**

**목표**: 레거시 Preact Signals 호환 레이어를 제거하고 SolidJS 네이티브 패턴으로
완전 전환하여 코드베이스 단순화 및 번들 크기 최적화

**현 상태**: 계획 수립 완료 (2025-10-01)

**배경**:

- Epic SOLID-NATIVE-001에서 SolidJS 네이티브 패턴 기반 구축 완료
- 현재 `createGlobalSignal` (Preact Signals 스타일 호환 레이어) 50+ 사용처 잔존
- `.value` / `.subscribe()` 패턴과 SolidJS 네이티브 패턴 혼재로 인한 복잡도 증가
- 레거시 호환 레이어 유지로 인한 번들 크기 및 유지보수 부담

**메트릭 현황**:

- 번들 크기: 774.46 KB raw (dev), 94.67 KB CSS
- 테스트: 2088 passed | 50 skipped | 1 todo
- 레거시 패턴 사용처: 50+ (`.value`, `.subscribe()`)
- 영향 범위: `createGlobalSignal`, `signalSelector`, 테스트 모킹

**목표 메트릭**:

- 번들 크기: 10-15% 감소 목표 (레거시 호환 레이어 제거)
- 코드 복잡도: 이중 API 패턴 제거로 단순화
- 테스트 신뢰도: 레거시 모킹 제거로 테스트 명확성 향상

---

## Epic SOLID-NATIVE-002 Phase 구조

### Phase A: 레거시 사용처 분석 및 마이그레이션 맵 생성 📊

**목표**: 전체 레거시 패턴 사용처를 스캔하고 자동/수동 변환 전략 수립

**작업 항목**:

1. **레거시 패턴 스캔 스크립트 개발**
   - Acceptance:
     - `.value` 접근 패턴 탐지 (50+ 예상)
     - `.subscribe()` 호출 패턴 탐지
     - `createGlobalSignal` 사용처 위치 및 컨텍스트 수집
     - 마이그레이션 맵 JSON 생성
   - Test: 스캔 스크립트가 테스트 케이스에서 모든 패턴 탐지

2. **변환 복잡도 분류**
   - Acceptance:
     - 자동 변환 가능: 단순 `.value` 읽기 → 함수 호출
     - 반자동: `.value` 쓰기 → setter 함수 호출
     - 수동: `.subscribe()` → `createEffect()` 변환
     - 구조 변경 필요: 중첩된 레거시 패턴
   - Test: 분류 규칙이 샘플 코드에 정확히 적용됨

3. **마이그레이션 우선순위 결정**
   - Acceptance:
     - 고영향/저복잡도: `shared/state/signals/*.ts` (우선)
     - 중영향/중복잡도: `shared/utils/signalSelector.ts`
     - 저영향/고복잡도: 테스트 모킹 코드 (후순위)
   - Test: 우선순위 매트릭스가 리스크와 효과 균형

**Acceptance Criteria**:

- [ ] 레거시 패턴 스캔 스크립트 작성 및 실행
- [ ] 마이그레이션 맵 JSON 파일 생성 (50+ 항목)
- [ ] 자동/반자동/수동 변환 항목 분류 완료
- [ ] Phase B/C/D 작업 범위 및 순서 확정
- [ ] 품질 게이트: typecheck GREEN, 스캔 스크립트 테스트 통과

---

### Phase B: 자동 변환 도구 개발 및 적용 🛠️

**목표**: 단순 패턴의 자동 변환으로 70% 이상 사용처 전환

**작업 항목**:

1. **Codemod 스크립트 개발**
   - Acceptance:
     - `.value` 읽기 → 함수 호출 자동 변환
     - `.value` 쓰기 → setter 함수 호출 자동 변환
     - import 문 자동 업데이트 (필요 시)
     - 변환 전/후 diff 리포트 생성
   - Test: 샘플 코드 변환 결과가 수동 변환과 동일

2. **변환 적용 및 검증**
   - Acceptance:
     - `shared/state/signals/*.ts` 우선 적용
     - 각 파일별 변환 → 테스트 실행 → 커밋
     - 변환 실패 케이스는 수동 대기 목록에 추가
   - Test: 변환된 파일의 테스트가 GREEN

3. **번들 크기 및 런타임 검증**
   - Acceptance:
     - dev 빌드 크기 측정 및 비교
     - 갤러리 기본 동작 수동 테스트 (열기/닫기/네비게이션)
     - 성능 회귀 없음 확인
   - Test: 빌드 메트릭 테스트, E2E 기본 플로우 통과

**Acceptance Criteria**:

- [ ] Codemod 스크립트 개발 및 단위 테스트
- [ ] 자동 변환 대상 70% 이상 적용 완료
- [ ] 변환된 코드 테스트 GREEN (2088+ passed)
- [ ] 번들 크기 5-10% 감소 확인
- [ ] 품질 게이트: typecheck/lint/test/build ALL GREEN

---

### Phase C: `signalSelector` 리팩토링 🔧

**목표**: 레거시 `.value` 의존성 제거 및 SolidJS Accessor 전용 API로 전환

**작업 항목**:

1. **현재 `signalSelector.ts` 분석**
   - Acceptance:
     - `useSignalSelector`, `useCombinedSelector` 사용처 파악
     - `.value` / `.subscribe()` 의존성 식별
     - SolidJS `createMemo()` 기반 재설계 방향 수립
   - Test: 분석 결과 문서화 및 리뷰

2. **SolidJS 네이티브 API로 재구현**
   - Acceptance:
     - `useSignalSelector` → `createMemo()` 기반 래퍼
     - `useCombinedSelector` → 다중 Accessor 결합 유틸
     - 레거시 호환 레이어 deprecation 경고 추가
   - Test: 기존 사용처 모두 동작 유지 (회귀 없음)

3. **사용처 마이그레이션**
   - Acceptance:
     - `shared/state/signals/*.ts` selector 호출 전환
     - features 레이어 selector 호출 전환
     - deprecation 경고 로그 확인 후 레거시 API 제거
   - Test: 전체 테스트 GREEN, 빌드 검증

**Acceptance Criteria**:

- [ ] `signalSelector.ts` SolidJS 네이티브 버전 구현
- [ ] 레거시 호환 레이어 deprecation 마킹
- [ ] 모든 사용처 마이그레이션 완료
- [ ] 레거시 API 제거 및 테스트 GREEN
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN

---

### Phase D: 테스트 모킹 인프라 정리 🧪

**목표**: Preact 관련 모킹 코드 제거 및 SolidJS 전용 테스트 유틸리티 정비

**작업 항목**:

1. **레거시 모킹 코드 식별**
   - Acceptance:
     - `test/utils/mocks/vendor-mocks*.ts`에서 Preact Signals 모킹 제거
     - `createMockPreactSignals`, `createMockPreactHooks` 등 제거 대상 확정
     - SolidJS 모킹으로 대체 가능한 항목 매핑
   - Test: 식별 목록 완성 및 영향 범위 분석

2. **SolidJS 전용 모킹 유틸리티 강화**
   - Acceptance:
     - `createMockSolidCore`, `createMockSolidStore` 등 강화
     - `createSignal`, `createMemo`, `createEffect` 모킹 완전성 확보
     - 테스트 헬퍼 함수 정리 및 문서화
   - Test: 샘플 테스트로 모킹 유틸리티 검증

3. **테스트 케이스 업데이트 및 정리**
   - Acceptance:
     - 레거시 모킹 사용 테스트 50+ 케이스 전환
     - 스킵된 테스트 50건 재활성화 또는 정리
     - 테스트 실행 시간 및 안정성 개선
   - Test: 전체 테스트 2100+ passed (증가 목표)

**Acceptance Criteria**:

- [ ] Preact 관련 모킹 코드 완전 제거
- [ ] SolidJS 전용 모킹 유틸리티 강화 완료
- [ ] 스킵된 테스트 50건 처리 (재활성화 또는 삭제)
- [ ] 테스트: 2100+ passed (증가), 0 skipped (목표)
- [ ] 품질 게이트: 테스트 커버리지 유지 또는 증가

---

### Phase E: `createGlobalSignal` 레거시 호환 레이어 제거 🗑️

**목표**: 더 이상 사용되지 않는 레거시 호환 레이어 완전 제거

**작업 항목**:

1. **사용처 제로 확인**
   - Acceptance:
     - `createGlobalSignal` import 0건 확인
     - `.value` / `.subscribe()` 패턴 0건 확인
     - 린트/스캔 스크립트로 자동 검증
   - Test: 사용처 스캔 결과 0건

2. **레거시 파일 및 타입 제거**
   - Acceptance:
     - `src/shared/state/createGlobalSignal.ts` 삭제
     - 관련 타입 정의 제거 (`GlobalSignal<T>`)
     - export 경로 정리 (`src/shared/state/index.ts`)
   - Test: 빌드 및 테스트 GREEN (의존성 에러 없음)

3. **문서 업데이트**
   - Acceptance:
     - `CODING_GUIDELINES.md`에서 레거시 섹션 제거
     - `ARCHITECTURE.md` 상태 관리 섹션 업데이트
     - `CHANGELOG.md` 또는 마이그레이션 가이드 추가
   - Test: 문서 리뷰 및 승인

**Acceptance Criteria**:

- [ ] `createGlobalSignal` 및 관련 코드 완전 삭제
- [ ] 사용처 스캔 결과 0건 확인
- [ ] 번들 크기 10-15% 감소 최종 확인
- [ ] 문서 업데이트 완료 및 리뷰
- [ ] 품질 게이트: typecheck/lint/test/build ALL GREEN

---

### Phase F: 검증 및 최종 문서화 📝

**목표**: 전체 변환 품질 검증 및 Epic 완료 문서화

**작업 항목**:

1. **전체 품질 게이트 검증**
   - Acceptance:
     - typecheck: 0 errors (strict 모드)
     - lint: 0 errors, 0 warnings
     - test: 2100+ passed, 0 skipped (목표)
     - build: dev/prod 모두 성공, 산출물 검증 통과
   - Test: CI 파이프라인 전체 GREEN

2. **메트릭 측정 및 비교**
   - Acceptance:
     - 번들 크기: Before/After 비교 (10-15% 감소 목표)
     - 코드 복잡도: 레거시 패턴 제거로 감소 확인
     - 테스트 신뢰도: 스킵 테스트 제로 달성
   - Test: 메트릭 리포트 생성 및 검토

3. **Epic 완료 문서화**
   - Acceptance:
     - `TDD_REFACTORING_PLAN_COMPLETED.md`에 Epic 전체 요약 추가
     - Phase별 작업 내용 및 결과 정리
     - 학습 내용 (Lessons Learned) 기록
   - Test: 문서 리뷰 및 승인

**Acceptance Criteria**:

- [ ] 전체 품질 게이트 ALL GREEN
- [ ] 메트릭 목표 달성 (번들 크기, 테스트, 복잡도)
- [ ] Epic 완료 문서화 및 이관
- [ ] 다음 Epic 후보 식별 (있는 경우)

---

## 솔루션 후보 분석 요약

### Option A: 점진적 Preact 제거 (Epic 확장) ⭐ **채택**

**장점**:

- 안전성: Phase별 검증으로 회귀 위험 최소화
- 테스트 보장: 각 단계마다 GREEN 유지
- 롤백 가능: 문제 발생 시 이전 Phase로 복귀
- 병렬 작업 가능: 팀원별 Phase 분담

**단점**:

- 시간 소요: 6개 Phase 순차 진행
- 임시 복잡도: Phase C까지 이중 패턴 혼재

**적용 계획**: 본 Epic의 Phase A-F로 구체화

---

### Option B: 빅뱅 전환 ❌ **기각**

**장점**:

- 빠른 정리: 한 번에 모든 레거시 제거

**단점**:

- 높은 리스크: 회귀 버그 가능성
- 테스트 부담: 전체 재검증 필요
- 롤백 어려움: 문제 발생 시 전체 되돌리기

**기각 사유**: 안정성 우선 원칙 위배

---

### Option C: 하이브리드 - 핵심만 전환 🤔 **보류**

**장점**:

- 균형: 빠른 효과 + 일부 안전성
- 실용성: 고영향 영역만 집중

**단점**:

- 일부 레거시 유지: 장기 기술 부채
- 경계 모호: 어디까지 전환할지 판단 필요

**평가**: Option A가 더 명확하므로 보류

---

---

### Epic: NAMING-001 — 명명 규칙 표준화 및 일관성 강화 📝 **계획 수립 완료**

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
