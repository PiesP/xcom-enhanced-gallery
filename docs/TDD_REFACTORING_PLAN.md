# TDD 리팩토링 계획

최종 업데이트: 2025-11-01

---

## 🎉 현재 상태

**모든 계획된 Phase 완료** (Phase 291-302) + 보안 경고(198) 대응 완료

**프로젝트 메트릭**:

- 번들 크기: **344.92 KB** (gzip **93.61 KB**)
- 테스트: 단위 2763/2765 (99.9%), E2E 88/96, 접근성 AA
- 품질: TypeScript/ESLint/Stylelint 0 에러, CodeQL 0 경고

**최근 완료**:

- ✅ Phase 302: X.com DOM/API 회복력 강화 (2025-11-01)
- ✅ Phase 301: BFCache 호환성 강화 (2025-11-01)
- ✅ Phase 299: 빌드 스크립트 구조 개선 (2025-11-01)
- ✅ Phase 296: 빌드 검증 스크립트 현대화 (2025-11-01)
- ✅ Phase 295: TwitterScrollPreservation 실제 통합 (2025-11-01)
- ✅ Phase 291-294: 미디어 서비스 모듈화 (2025-10-31 ~ 2025-11-01)
- ✅ Phase 303: CodeQL 보안 경고(198) 대응 — URL 검증/Prototype Pollution/Style
  Injector (2025-11-01)

_상세 내용은
[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) 참고_

---

## 🔮 향후 고려사항

### Phase 304: 트위터 네이티브 동작 영향 최소화 (신규)

**문제 정의**

- 전역 `document` 캡처 리스너(`keydown`, `click`, `wheel`)가 트위터의 기본
  동작과 경쟁하며, 페이지 상태 변화 시 스크롤/키보드 복원을 방해할 가능성이 있음
- `blockTouchAndPointerEvents()`가 `document.on*` 프로퍼티를 직접 덮어써 외부
  스크립트 및 트위터 자체 제스처 처리에 영향을 줄 수 있음
- `TwitterScrollPreservation.restore()`가 폴백으로 `document.body`를 사용해
  타임라인 외 영역까지 스크롤을 복원할 수 있음

**대안 비교**

1. _소극적 완화_: 현 구조 유지 + 로깅 강화 (장점: 구현 간단, 리스크 낮음 / 단점:
   근본 원인 미해결, 회귀 가능성 높음)
2. _부분 격리_: 리스너를 타임라인 컨테이너로 한정, 포인터 차단을 갤러리 루트
   범위로 축소 (장점: 영향 범위 감소, 구현 중간 난이도 / 단점: 컨테이너 탐색
   실패 시 다시 전역으로 확산)
3. **_완전 격리 (선택)_**: 갤러리 오픈 시에만 컨테이너 범위 리스너를
   `AbortController`로 장착하고, 트위터 컨테이너 약한 참조를 보존해 복원이
   안전하게 스킵되도록 개선 (장점: 트위터 네이티브 동작과 경합 최소화, 테스트
   가능 / 단점: 초기 구현 복잡, 테스트 보강 필요)

➡️ **선택**: 3번 완전 격리. 전역 영향 최소화가 목표이므로 TDD 기준으로 범위 기반
리스너 전환 + 스크롤 복원 가드를 도입한다.

**TDD 계획**

1. 실패 테스트 추가
   - `test/unit/shared/utils/events-pointer-policy.test.ts`: 포인터 정책이
     갤러리 외부 요소에 영향을 주지 않는지 검증
   - `test/unit/shared/utils/twitter-scroll-preservation.test.ts`: 저장 시
     컨테이너 약한 참조/경로 비교가 없는 경우 실패하도록 RED 작성
   - `test/unit/features/gallery/gallery-events.test.ts`(신규): 갤러리 미오픈
     상태에서 문서 리스너 미등록, 오픈 시 한정 등록을 검증
2. 최소 구현 (GREEN)
   - `initializeGalleryEvents()`를 컨텍스트 컨트롤러 기반 구조로 리팩터링
     (`AbortController`, 타깃 컨테이너 스코프)
   - `blockTouchAndPointerEvents()` 제거 후 갤러리 루트 내 포인터 차단 로직으로
     이동
   - `TwitterScrollPreservation`에 `WeakRef<HTMLElement>` 저장 +
     `location.pathname`·`visibilityState` 가드
3. 리팩토링 & 회귀 테스트
   - `useGalleryScroll`에서 MutationObserver 기반 전역 휠 차단 제거, 갤러리 루트
     `wheel` 핸들러로 축소
   - 로깅 수준/메시지 정리 (debug → trace)

**수용 기준**

- 갤러리 닫힌 상태에서 `document`/`window` 전역 리스너가 등록되지 않는다
  (테스트로 보장)
- 포인터 차단이 갤러리 루트에 한정되며, 외부 클릭/드래그 이벤트가 트위터 기본
  동작과 충돌하지 않는다
- 트위터 타임라인에서 갤러리 오픈 → 다른 페이지 이동 → 뒤로 가기 시 스크롤
  위치가 깨지지 않는다 (Playwright 스모크 포함 수동 검증)

### Phase 296.1: 빌드 검증 로직 모듈화 (선택적)

**현재**: validate-build.ts (467줄, 6개 검증기 통합)

**계획**: 모듈 분리 + Result 패턴 + 단위 테스트

**평가**: 현재 구조로 충분. 복잡도 증가 대비 이점 낮음 → **우선순위: 낮음**

---

### Phase 297: Vite Config 모듈화 (보류)

**현재**: vite.config.ts (477줄, 기능적으로 완성)

**평가**: 모듈화 시 파일 분산 + import 체인 복잡도 증가 → **보류**

---

### Phase 287: 개발 전용 로깅 정책 문서화 (보류)

**현재**: dev 빌드에 Flow Tracer 포함, prod 빌드 자동 제거

**평가**: 빌드 스크립트에서 자동 처리되어 문서화 필요성 낮음 → **보류**

---

### Phase 300: 실제 X.com 사이트 테스트 자동화 (검토 완료)

**분석일**: 2025-11-01

**목표**: 빌드된 UserScript를 실제 X.com에서 자동 테스트

**현재 상태**:

- 단위 테스트: 2763/2765 (99.9%)
- E2E 스모크: 82 passed (Harness 패턴, `about:blank`)
- **한계**: 실제 X.com DOM 구조에서 미검증

**검토 결과**: ⏸️ **구현 보류** (선택적)

**이유**:

1. 현재 테스트 커버리지가 이미 충분 (99.9% + 82 E2E)
2. 실제 사이트 관련 버그 보고 없음
3. 로그인 관리 + GM\_\* API 모킹 복잡도 높음

**대안 전략** (권장):

- ✅ 수동 스모크 테스트 프로토콜 문서화
- ✅ 사용자 피드백 기반 개선 (GitHub Issues)
- ✅ 샘플 HTML 기반 테스트 강화 (`sample-based-media-extraction.spec.ts`)

**구현 옵션** (필요 시):

1. **Playwright Context에 UserScript 주입** (권장, 중간 복잡도)
   - `page.addInitScript`로 빌드된 스크립트 주입
   - GM\_\* API 모킹 (`playwright/fixtures/userscript-api.ts`)
   - X.com 로그인 세션 저장/재사용 (`storageState`)
2. Browser Extension 변환 (높은 복잡도, 비권장)
3. Selective Real-Site Testing (로컬 전용, CI skip)

_상세 분석:
[REAL_SITE_TESTING_ANALYSIS.md](./temp/REAL_SITE_TESTING_ANALYSIS.md)_

**재검토 트리거**:

- X.com DOM 구조 변경으로 버그 빈발 시
- 미디어 추출 실패 사례 반복 발생 시
- UserScript 사용자 이슈 급증 시

---

---

## 📚 관련 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
- **개발 가이드**: [../AGENTS.md](../AGENTS.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)

---

## 📝 새 리팩토링 추가 시

1. 문제 정의 및 현재 상태 분석
2. 솔루션 옵션 비교 (장단점)
3. Phase 번호 할당 및 계획 작성
4. TDD 사이클 (RED → GREEN → REFACTOR)
5. 완료 후 이 문서에서 제거 → COMPLETED.md로 이관
