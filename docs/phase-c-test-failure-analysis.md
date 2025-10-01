# Phase C-1: 실패 테스트 원인 분석 리포트

**분석 일자**: 2025-10-01 **분석 브랜치**: `epic/arch-simplify-001-phase-c`
**실패 테스트 파일**: 24개 **총 실패 테스트**: 75개

---

## 1. 실패 패턴 분류

### 1.1 환경 제약 (JSDOM 한계) - 약 40개

**증상**: `TypeError: URL is not a constructor`

**영향받는 테스트**:

- `test/features/gallery/gallery-renderer-solid-*.test.tsx` (7개 파일)
- `test/features/gallery/gallery-close-dom-cleanup.test.ts` (10개 테스트)
- `test/phase-6-final-metrics.test.ts`
- `test/accessibility/gallery-toolbar-parity.test.ts`

**원인**:

- JSDOM 환경에서 `URL` 생성자가 제대로 폴리필되지 않음
- `test/setup.ts`의 URL 폴리필이 일부 컨텍스트에서 작동하지 않음
- GalleryRenderer가 URL 객체를 사용하는 미디어 URL 파싱에서 실패

**해결 방안**:

- Option A: `test/setup.ts`의 URL 폴리필 강화 (global.URL 할당)
- Option B: 테스트 환경 감지하여 URL 사용 회피 로직 추가
- Option C: 해당 테스트를 E2E 테스트로 전환 (skip 처리)

**권장**: Option A (폴리필 강화) - 가장 빠르고 실용적

---

### 1.2 서비스 초기화 오류 - 약 10개

**증상**: `Error: 서비스를 찾을 수 없습니다: media.service`

**영향받는 테스트**:

- `test/features/gallery/gallery-close-dom-cleanup.test.ts` (8개 테스트)

**원인**:

- Epic ARCH-SIMPLIFY-001 Phase A/B의 서비스 리팩터링 후 테스트 모킹 불일치
- 서비스 접근자 패턴 변경으로 기존 모킹 전략 무효화
- `@shared/services/service-accessors.ts` 변경사항 미반영

**해결 방안**:

- Option A: 테스트별로 서비스 모킹 코드 업데이트
- Option B: 테스트 헬퍼 함수 추가 (setupServiceMocks)
- Option C: 서비스 초기화 로직을 테스트 setup에 통합

**권장**: Option B (헬퍼 함수) - 재사용성 높음

---

### 1.3 API 변경 (Epic 완료 후) - 약 15개

**증상**:

- `AssertionError: expected 263 to be less than or equal to 262` (컴포넌트 개수)
- 타입스크립트 파일 수 증가로 인한 메트릭 불일치

**영향받는 테스트**:

- `test/phase-6-final-metrics.test.ts` (컴포넌트 개수 체크)
- `test/cleanup/test-consolidation.test.ts` (Phase별 책임 체크)
- `test/components/performance-optimization.test.ts` (Signal 최적화)

**원인**:

- Phase B에서 UI 타입 분리로 파일 2개 추가 (Toolbar.types.ts,
  SettingsModal.types.ts)
- 컴포넌트 개수가 262 → 263으로 증가
- 테스트 기대값이 구버전 기준으로 고정됨

**해결 방안**:

- 기대값을 현재 상태로 업데이트 (263으로 수정)
- Phase별 책임 테스트는 새 파일 구조에 맞춰 assertion 재작성

**권장**: 기대값 업데이트 (간단하고 명확)

---

### 1.4 Stage D RED 가드 업데이트 필요 - 약 5개

**증상**: Preact 제거 후 RED 가드 테스트가 여전히 Preact 기준

**영향받는 테스트**:

- `test/refactoring/service-diagnostics-integration.test.ts` (5개)
- `test/refactoring/toast-system-integration.test.ts` (5개)

**원인**:

- Epic FRAME-ALT-001 Stage D 완료 후 RED 가드 테스트 미갱신
- Solid 전용 API로 전환되었으나 테스트는 이전 구조 검증

**해결 방안**:

- RED 가드 테스트를 Solid 기준으로 재작성
- 또는 해당 RED 가드를 GREEN으로 전환 (목적 달성)

**권장**: GREEN 전환 (Stage D 완료 사실 반영)

---

### 1.5 테스트 인코딩 문제 - 약 5개

**증상**: 한글 깨짐 (`?뚯뒪??`, `?뚰듃`, 등)

**영향받는 테스트**:

- 여러 테스트 파일의 describe/test 이름

**원인**:

- PowerShell 출력 인코딩 문제 (UTF-8 vs CP949)
- 테스트 실행 자체는 성공하지만 출력만 깨짐

**해결 방안**:

- PowerShell에서 `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` 설정
- 또는 테스트 이름을 영문으로 변경 (권장하지 않음)

**권장**: PowerShell 인코딩 설정 (임시 조치, 테스트 실패와 무관)

---

## 2. 우선순위 및 예상 소요 시간

| 분류            | 실패 개수 | 우선순위   | 예상 소요 | 방법            |
| --------------- | --------- | ---------- | --------- | --------------- |
| 환경 제약 (URL) | 40        | **HIGH**   | 1일       | URL 폴리필 강화 |
| 서비스 초기화   | 10        | **HIGH**   | 1일       | 헬퍼 함수 추가  |
| API 변경        | 15        | **MEDIUM** | 0.5일     | 기대값 업데이트 |
| Stage D RED     | 5         | **MEDIUM** | 0.5일     | GREEN 전환      |
| 인코딩          | 5         | **LOW**    | 0.1일     | PowerShell 설정 |

**총 예상 소요**: 3일

---

## 3. 실행 계획

### Step 1: URL 폴리필 강화 (1일)

- `test/setup.ts` 수정
- `global.URL` 명시적 할당
- `test/features/gallery/` 테스트 재실행 및 GREEN 확인

### Step 2: 서비스 모킹 헬퍼 (1일)

- `test/__helpers__/service-mock.ts` 생성
- `setupServiceMocks()` 함수 구현
- `gallery-close-dom-cleanup.test.ts` 업데이트

### Step 3: 메트릭 기대값 업데이트 (0.5일)

- `test/phase-6-final-metrics.test.ts` 수정 (262 → 263)
- `test/cleanup/test-consolidation.test.ts` Phase별 책임 재작성

### Step 4: Stage D RED → GREEN (0.5일)

- `test/refactoring/service-diagnostics-integration.test.ts` RED 제거
- `test/refactoring/toast-system-integration.test.ts` RED 제거

---

## 4. Acceptance Criteria

- [ ] 실패 테스트 75개 → 10개 이하로 감소
- [ ] `test/features/gallery/` 테스트 전체 GREEN
- [ ] `test/phase-6-final-metrics.test.ts` GREEN
- [ ] 서비스 초기화 오류 0건
- [ ] `npm test` 통과율 95% → 98% 이상

---

## 5. 다음 단계 (Phase C-2 ~ C-5)

- **C-2**: Stage D RED 가드 업데이트 (3일)
- **C-3**: 환경 제약 테스트 재평가 (2일)
- **C-4**: API 변경 테스트 수정 (3일)
- **C-5**: 스킵 테스트 재활성화 검토 (2일)

---

**작성자**: GitHub Copilot **검토**: 2025-10-01
