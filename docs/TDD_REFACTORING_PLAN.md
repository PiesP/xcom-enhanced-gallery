# TDD 리팩토링 활성 계획 (2025-09-15 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 가드로 고정하며, UI/UX의 일관성과 안정성을 높인다. 모든 변경은 TDD로 수행한다.

- 아키텍처·정책 준수 근거: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`,
  `docs/DEPENDENCY-GOVERNANCE.md`
- 테스트 환경: Vitest + JSDOM, 기본 URL `https://x.com`, getter/adapter 기반
  모킹
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, 외부 의존성은 getter/adapter로만 접근, CSS Modules + 디자인 토큰만

---

## 활성 과제(신규) — 문제/옵션(장단점)/선택/DoD

아래 항목은 현재 코드베이스의 안정 상태를 유지하면서도 품질·UX·테스트 신뢰도를
한 단계 끌어올릴 수 있는 소규모·저위험 개선들입니다. 각 항목은 RED → GREEN →
리팩토링 순으로 진행합니다.

<!-- Moved to COMPLETED on 2025-09-16: TIMER-DETERMINISM-02 -->
<!-- Moved to COMPLETED on 2025-09-16: I18N-LITERAL-GUARD-01 -->

### 1) SETTINGS-MIG-HASH-01 — Settings 스키마 무결성 해시/마이그레이션 강화

- 문제: 테스트/런타임 신뢰도를 떨어뜨리는 직접 타이머 사용이 잠재적으로 유입될
  수 있음(플레이키 테스트·정리 누락 위험).
- 해결 옵션
  - A. 정적 스캔 테스트 추가:
    `setTimeout|setInterval|clearTimeout|clearInterval` 직접 사용 금지(허용:
    TimerManager 내부)
    - 장점: 즉시 RED, 프로젝트 정책과 정합
    - 단점: 합법적 예외 케이스 허용 리스트 관리 필요
  - B. ESLint 커스텀 룰 추가
    - 장점: 에디터 피드백 즉시성
    - 단점: 유지보수 비용, 기존 테스트 인프라와 중복
- 선택: A(정적 스캔 테스트) — 필요 시 ESLint는 후속
- DoD
  - 테스트: `test/unit/lint/timer-direct-usage.scan.red.test.ts` GREEN(허용:
    TimerManager, 테스트 파일)
  - 가이드: `CODING_GUIDELINES.md`에 “테스트에서는 fake timers 권장” 주석 보강

### 2) UI-ERROR-BOUNDARY-01 — 상위 Error Boundary 도입(Toast + a11y 알림)

- 문제: 드문 변경 시 레거시 키 잔존/누락 키가 런타임에 발견될 수 있음(지연
  검출).
- 해결 옵션
  - A. 스키마 해시 저장(예: `__schemaHash`): 로드 시 계산→불일치면 prune/fill
    마이그레이션 실행
    - 장점: 즉시 검출·자동 복구, 회귀 방지
    - 단점: 해시 충돌 가능성은 매우 낮으나 관리 필요
  - B. 버전 번호만 비교
    - 장점: 단순
    - 단점: 세부 drift는 놓칠 수 있음
- 선택: A(해시 + 버전 병행 가능)
- DoD
  - 테스트: `test/unit/settings/settings-migration.schema-hash.test.ts` —
    drift(여분/누락) 발생 시 자동 복구 GREEN, idempotent
  - 문서: 스키마 변경 절차에 “해시 갱신 필수” 추가

<!-- 4) FILENAME-UNICODE-NORMALIZE-01 — 이동: COMPLETED 문서로 이관됨 -->

### 3) PLAYWRIGHT-SMOKE-01 — Userscript 주입 스모크(e2e) 최소 1건

- 문제: 드문 렌더 오류 발생 시 사용자 경험이 무너질 수 있음. 상위에서
  격리/알림이 필요.
- 해결 옵션
  - A. `GalleryApp` 컨테이너 레벨 ErrorBoundary(compat 기반) +
    UnifiedToastManager로 간단 알림(개발 모드만 stack)
    - 장점: 최소 침습, 정책(L2 로그 게이트)과 일치
    - 단점: 일부 비동기 오류는 포착 제한
  - B. 서비스 레벨 try/catch 확대
    - 장점: 세밀함
    - 단점: 분산/중복 증가
- 선택: A
- DoD
  - 테스트: `test/unit/components/error-boundary.fallback.test.tsx` — 자식이
    throw 시 대체 UI/토스트 노출, prod에서 stack 미노출

- 문제: 번들/포스트빌드 가드가 광범위하나, 실제 DOM 주입 스모크가 누락되어 회귀
  탐지에 시간차 발생 가능
- 해결 옵션
  - A. Playwright 스모크 1건: 빈 X.com 문서에 userscript 번들 주입 → 콘솔 에러
    0, 루트 컨테이너 존재 확인
    - 장점: 실제 브라우저 스택 검증, 회귀 조기 탐지
    - 단점: CI 시간 소폭 증가
  - B. 유지하지 않음(현 상태 유지)
    - 장점: 빠름
    - 단점: 회귀 탐지 지연
- 선택: A(스모크 1건, 시간 제한 10s 이내)
- DoD
  - 테스트: `playwright/smoke/userscript-injection.spec.ts` — 콘솔 error 0, 핵심
    컨테이너 존재, 네트워크 외부 호출 없음

---

## 실행 순서/영향 범위(제안)

1. TIMER-DETERMINISM-02, I18N-LITERAL-GUARD-01 — 정적 스캔 테스트부터 RED →
   GREEN(소스 확산 방지 가드 선 구축)
2. SETTINGS-MIG-HASH-01, FILENAME-UNICODE-NORMALIZE-01 — 데이터/파일명 안정성
   강화(교차 플랫폼 호환)
3. UI-ERROR-BOUNDARY-01 — 상위 보호망 도입(L2 로깅 정책과 정합)
4. PLAYWRIGHT-SMOKE-01 — 최종 스모크로 회귀 감시 보강

각 단계 완료 시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

---

## 리스크/롤백

- 포커스 복원: 특정 브라우저에서의 focus 관리 차이 → feature flag로 단계적
  활성화 가능
- 스캔 테스트: 초기 위양성 발생 시 허용 리스트를 협의·보강
- 파일명 정규화: 소수 edge case에서 시각적 파일명 변화 가능 → 실제 저장 전
  미리보기/로그 확인 옵션 검토

---

## 품질 게이트(변경 후)

- Build: dev/prod Userscript 생성 + postbuild validator(GREEN 유지)
- Lint/Typecheck: `npm run typecheck` · `npm run lint:fix`(변경 범위 한정)
- Tests: fast/unit/styles/performance/refactor 스위트 GREEN, e2e 스모크 1건 통과

---

## 참고

- 모든 새 테스트는 vendor/userscript/DOM 의존을 getter/adapter로 주입 가능하게
  작성합니다.
- PC 전용 이벤트 원칙 유지. CSS는 CSS Modules + 디자인 토큰만 사용.
