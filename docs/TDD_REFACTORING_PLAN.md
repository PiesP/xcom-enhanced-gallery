# 🎨 TDD 리팩토링 계획 — Userscript 소스 현대화(간결 버전)

> 테스트 우선(TDD)으로 Userscript 소스를 간결·일관·현대적으로 리팩토링하고,
> 타입/의존성/성능 기준을 일관화합니다.

참고: 완료된 작업은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 정리합니다(본
문서에서는 완료 항목을 제외하고 “다음 단계”만 유지).

## 1) 현재 상태 스냅샷 (2025-09-10)

- 디자인 토큰/라디우스/애니메이션/컴포넌트 표준화 관련 1차 현대화는 완료되어
  완료 로그로 이관되었습니다.
- 본 문서는 Userscript 소스 구조/부트스트랩/서비스 경계/미디어·다운로드 안정화에
  집중합니다.
- 기준 원칙: TypeScript strict 100%, 외부 의존성은 getter 함수로만 접근, PC 전용
  이벤트, 디자인 토큰 100% 사용.

## 2) 의사결정(Decision Log, 요약)

- D1. 번들: 릴리즈는 단일 Userscript 아티팩트, 개발은 코드 스플릿 허용.
  - Pros: 사용자 스크립트 매니저 호환성↑, 배포 단순. Cons: 사이즈 예산 관리
    필요.
- D2. 의존성 격리: preact/fflate/GM\_\* 등 외부는 getter 주입, 직접 import 금지.
  - Pros: 모킹 용이, 환경 격리. Cons: 어댑터 유지 필요.
- D3. 상태/이벤트: UI는 preact+signals, 서비스는 경량 EventEmitter.
  - Pros: 경량/테스트 용이. Cons: 고급 오퍼레이터 미제공(요구 없음).
- D4. 에러/로그: Result 패턴 + Scoped Logger 표준.
- D5. 입력: PC 전용(Mouse/Keyboard/Wheel)만 허용.
- D6. 스타일: CSS Modules + Semantic Tokens(컴포넌트 alias 점진 제거).
- D7. 인터랙션: IconButton 표준(사이즈/ARIA/상태) 강제.

## 3) 적용 가능한 솔루션과 선택(간결)

- 번들: 단일 번들(릴리즈) 선택. 개발 시 코드 스플릿 허용.
- 다운로드: GM_download 우선, fetch/xhr는 폴백.
- 스타일링: CSS Modules + Semantic Tokens 선택.

## 4) 다음 단계 백로그(테스트 우선)

Phase A — Userscript 부트스트랩/수명주기 정리 (완료)

- 완료 내용:
  - `main.start` 아이드포턴트 보장 및 글로벌 핸들러 중복 등록 방지 테스트 GREEN
  - `cleanup`이 글로벌 핸들러 제거 및 재시작 시 재등록 동작 테스트 GREEN
  - PC 전용 정책 테스트 추가: click/keydown만 사용, touch/pointer 미사용,
    ESC/ENTER 동작 검증 GREEN
  - 관련 테스트: `test/unit/main/main-start-idempotency.test.ts`,
    `test/unit/events/gallery-pc-only-events.test.ts`

Phase B — 서비스 경계/의존성 getter 강화 (완료 → 완료 로그로 이동)

- 달성: ESLint flat config에 제한 import 규칙 고정, 벤더 경로 예외 정의.
- 가드 테스트: lint-getter-policy(정적 구성 검사),
  direct-imports-source-scan(벤더 경로 제외) 추가.
- 결과: 규칙/소스 스캐너 이중 가드 GREEN.

Phase C — 미디어 추출/정규화 견고성 향상

- 목표: URL 유효성, video thumb → orig 규칙, 재시도/타임아웃 처리 일관화.
- 테스트(Red):
  - 잘못된/경계 URL 입력 시 빈 배열 또는 명확한 실패(Result) 반환.
  - name=orig 강제 규칙 검증(png/webp/jpg).
  - 재시도 3회/타임아웃 10s 정책 검증.

Phase D — 다운로드 UX 안정화(부분 성공/취소)

- 목표: 부분 성공 요약/중복 파일명 규칙/취소(AbortSignal) 경로 재검증.
- 테스트(Red):
  - 동일 파일명 충돌 시 -1, -2 접미사 부여.
  - 일부 실패 시 `failures: {url,error}[]`에 수집되고 전체는 계속 진행.
  - 취소 시 잔여 작업이 중단되고 정리 핸들러가 호출됨.

Phase E — 성능/접근성 스모크

- 목표: 가상 스크롤/프리로드 카운트/캐시 TTL 동작, 포커스 링/대비 유지.
- 테스트(Red):
  - 설정값 변경 시 동작 반영(virtualScrolling/preloadCount/cacheTTL).
  - focus-visible, reduce-motion 대응 스모크.

## 5) 완료 기준(Definition of Done)

- 각 Phase의 Red 테스트 GREEN 전환 및 회귀 테스트 유지.
- 외부 의존성 접근이 전부 getter로 수렴(정적 분석/ESLint로 검증).
- PC 전용 이벤트 정책 위반 0건(테스트/린트로 검증).
- 하드코딩 색/지속시간/px radius 사용 0건(토큰 테스트로 검증).
- 문서 업데이트(본 계획서/완료 로그).

## 6) 품질 게이트

- Build PASS, Lint PASS(Strict + getter 강제 룰), Test PASS(단위/통합/스모크).
- 번들 사이즈 예산(릴리즈): gzip 경고≥300KB, 실패>450KB.
- 접근성: 포커스/대비 스모크 PASS.

## 7) 진행 현황

- 완료된 선행 작업 섹션은 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관했습니다.
- 본 문서는 “Userscript 소스 현대화”의 남은 과업만 추적합니다.

요약: Tampermonkey 호환 단일 번들, 의존성 getter, TS strict, PC 전용 이벤트,
디자인 토큰 표준을 기반으로 Userscript 소스를 TDD로 단계적 모던화합니다.
표면/토큰 정합)
