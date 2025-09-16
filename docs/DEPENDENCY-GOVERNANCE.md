# 🔒 의존성 거버넌스 (dependency-cruiser)

> 구조적 안전장치: 경고를 에러로 승격하여 CI에서 강제

이 문서는 dependency-cruiser를 이용해 프로젝트의 아키텍처 경계를 자동으로
검사/강제하는 정책을 정의합니다. 설계 원칙은 `docs/ARCHITECTURE.md`를
참고하세요. 런타임 코딩/스타일/토큰/입력 규칙은 `docs/CODING_GUIDELINES.md`를
단일 기준으로 사용합니다.

## 핵심 규칙(요약)

- no-direct-vendor-imports: 외부 라이브러리는 `@shared/external/vendors`
  getter를 통해서만 접근합니다. 직접 import는 에러입니다.
- no-circular-deps: 순환 참조는 에러입니다.
- 레이어 상향 금지: infrastructure/core/shared의 상향 의존은 에러입니다.
- no-internal-barrel-imports-\*: 동일 패키지 내부에서 상위 배럴(index.ts)
  재수입은 에러입니다. 내부 모듈은 구체 경로를 사용하세요.
- no-orphans: 고아 모듈은 정보 레벨(info)로 표기합니다. 허용목록과
  config/타입/자산은 예외 처리됩니다.

모든 규칙은 `.dependency-cruiser.cjs`에 선언되어 있으며, 경고였던 항목은 에러로
승격되었습니다.

## 실행과 CI 실패 조건

- 로컬: 다음 스크립트를 사용하세요.
  - `npm run deps:check` — 규칙 위반을 에러로 리포트하고 종료 코드 0/1 반환
  - `npm run deps:graph` — DOT/SVG 그래프 생성(그래프 렌더 실패는 빌드에 영향
    없음)
  - `npm run deps:all` — JSON/DOT/SVG 생성 후 validate 수행
- 빌드 훅: `prebuild:dev`/`prebuild:prod`에서 의존성 검사를 실행합니다. 위반 시
  빌드가 실패합니다.
- CI: Lint/Typecheck 이후 테스트/빌드 이전 단계에서 deps 검사도 함께 실행되도록
  설정되었습니다(quality 잡 또는 build 훅에서 보장).

## 리팩토링 가이드

- 위반 발생 시 가장 가까운 계층 배치/배럴 사용을 재검토하세요.
- Vendors 직접 import는 vendors getter로 교체하세요.
- 순환은 배럴 경유를 줄이고 구체 경로 import로 교체하여 제거합니다.
- 테스트에서는 getter를 모킹 가능한 API로 유지하세요.

## 산출물

- `docs/dependency-graph.json` — 정적 의존성 데이터
- `docs/dependency-graph.dot` — Graphviz DOT
- `docs/dependency-graph.svg` — 시각화(환경에 따라 placeholder일 수 있음)

---

참고: 상세 시각화 테마와 규칙은 `.dependency-cruiser.cjs`의
`reporterOptions.dot.theme`를 확인하세요.
