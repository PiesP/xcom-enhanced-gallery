# 🎨 TDD 리팩토링 계획 — Userscript 소스 현대화(간결 버전)

> 테스트 우선(TDD)으로 Userscript 소스를 간결·일관·현대적으로 리팩토링하고,
> 타입/의존성/성능 기준을 일관화합니다.

참고: 완료된 작업은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 정리합니다(본
문서에는 “다음 단계”만 유지).

## 1) 현재 상태 스냅샷 (2025-09-11)

- 디자인 토큰/라디우스/애니메이션/컴포넌트 표준화 및 부트스트랩/의존성 격리는
  완료되어 완료 로그로 이관되었습니다(Phase A/B).
- 본 문서는 Userscript 소스 구조 중 “미디어 추출 견고성, 다운로드 UX,
  성능·접근성 스모크”에 집중합니다.
- 기준 원칙: TypeScript strict 100%, 외부 의존성은 getter 함수로만 접근, PC 전용
  이벤트, 디자인 토큰 100% 사용.

## 2) 의사결정(Decision Log, 요약)

- D1. 번들: 릴리즈는 단일 Userscript 아티팩트, 개발은 코드 스플릿 허용.
  - Pros: 사용자 스크립트 매니저 호환성↑, 배포 단순 / Cons: 사이즈 예산 관리
    필요
- D2. 의존성 격리: preact/fflate/GM\_\* 등 외부는 getter 주입, 직접 import 금지.
  - Pros: 모킹 용이, 환경 격리 / Cons: 어댑터 유지 비용
- D3. 상태/이벤트: UI는 preact+signals, 서비스는 경량 EventEmitter.
  - Pros: 경량·테스트 용이 / Cons: 고급 오퍼레이터 미제공(요구 없음)
- D4. 에러/로그: Result 패턴 + Scoped Logger 표준.
- D5. 입력: PC 전용(Mouse/Keyboard/Wheel)만 허용.
- D6. 스타일: CSS Modules + Semantic Tokens(컴포넌트 alias 점진 제거).
- D7. 인터랙션: IconButton 표준(사이즈/ARIA/상태) 강제.

## 3) 설계 대안 평가와 선택(Pros/Cons)

- 모듈 구조
  - 대안1: 단일 서비스 모놀리식
    - Pros: 진입장벽 낮음 / Cons: 결합도↑, 테스트 격리 어려움
  - 대안2: 기능별 서비스 모듈(Media, Download, Filename, Extraction)
    - Pros: 경계 명확, 테스트/교체 용이 / Cons: 초기 설계 비용
  - 선택: 대안2. 서비스 경계 유지(현 구조 유지·보강)

- 에러 처리 모델
  - 대안1: throw/try-catch 중심
    - Pros: 단순 / Cons: 흐름 불명확, 테스트 어려움
  - 대안2: Result<T,E> 패턴 + 로거
    - Pros: 타입 안전, 실패 경로 명시 / Cons: 래핑 비용
  - 선택: 대안2. Result 패턴 유지

- 다운로드 경로
  - 대안1: GM_download 우선 + fetch 폴백
    - Pros: Userscript 성능/권한 활용 / Cons: 환경별 권한 차이 고려 필요
  - 대안2: fetch/xhr만 사용
    - Pros: 단일 경로 단순 / Cons: 크로스도메인·파일 저장 제약
  - 선택: 대안1. GM_download 우선(현 정책 유지)

- 번들링 전략
  - 대안1: 릴리즈 단일 번들, 개발 코드 스플릿 허용
  - 대안2: 모든 환경 단일 번들
  - 선택: 대안1. 개발 DX/빌드 시간 고려해 코드 스플릿 허용

- 상태 관리
  - 대안1: signals 최소 사용 + 서비스 로컬 상태
  - 대안2: 전역 스토어화
  - 선택: 대안1. 간결성/테스트 용이성 우선

- 스타일 토큰
  - 대안1: Semantic 토큰 직접 사용(+과도기 alias)
  - 대안2: 컴포넌트 전용 토큰 확장
  - 선택: 대안1. semantic 우선, alias 점진 제거(가이드라인 준수)

## 4) 다음 단계 백로그(테스트 우선)

- 현재 남은 백로그 없음(Phase E 항목까지 완료되어 본 문서에서 제거됨)

## 5) 완료 기준(Definition of Done)

- 각 Phase의 Red 테스트 GREEN 전환 및 회귀 테스트 유지
- 외부 의존성 접근이 전부 getter로 수렴(정적 분석/ESLint로 검증)
- PC 전용 이벤트 정책 위반 0건(테스트/린트로 검증)
- 하드코딩 색/지속시간/px radius 사용 0건(토큰 테스트로 검증)
- 문서 업데이트(본 계획서/완료 로그)

## 6) 품질 게이트

- Build PASS, Lint PASS(Strict + getter 강제 룰), Test PASS(단위/통합/스모크)
- 번들 사이즈 예산(릴리즈): gzip 경고 ≥ 300KB, 실패 > 450KB
- 접근성: 포커스/대비 스모크 PASS

## 7) 진행 현황

- Phase A/B 완료 섹션은 완료 로그로 이관 완료(본 문서에서는 제거)
- 본 문서는 “Userscript 소스 현대화”의 남은 과업만 추적합니다

요약: Tampermonkey 호환 단일 번들, 의존성 getter, TS strict, PC 전용 이벤트,
디자인 토큰 표준을 기반으로 Userscript 소스를 TDD로 단계적 모던화합니다.
