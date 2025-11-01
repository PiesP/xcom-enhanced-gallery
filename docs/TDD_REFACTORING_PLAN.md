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
