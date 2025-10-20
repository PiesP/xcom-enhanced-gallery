# TDD 리팩토링 활성 계획

최종 업데이트: 2025-10-20

요약

- 디자인 토큰 통일 이후 남은 유지 과제 3건(P0/P1/P2)만 본 문서에 유지합니다.
- 완료된 Phase/세부 기록은 모두 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로
  이관했습니다.

## 활성 과제(우선순위 순)

1. PostCSS 상대 색상 경고 제거 (P0)

- 배경: OKLCH + relative color syntax로 인해 prod/dev 빌드 로그에 경고
  출력(비치명).
- 실행: postcss 플러그인/옵션 최신화로 파서 경고 제거 → 필요 시 prod만 파생
  토큰을 수치형 OKLCH로 프리컴파일, dev에서는 상대 색상 유지.
- 수용 기준: prod 빌드 시 PostCSS 경고 0.

1. 레거시 토큰 alias 단계적 제거 (P1)

- 실행: 소스 전수 검색/치환으로 canonical semantic tokens 사용으로 이관, 테스트
  GREEN 유지.
- 수용 기준: `src/features/**` 내 alias 참조 0. 브리지 파일은 하위 호환을 위해
  유지.

1. 번들 여유 확보 ≥ 3 KB (P2)

- 실행: dead exports/미사용 코드 제거, logger 레벨 추가 정리, terser 옵션
  재점검.
- 수용 기준: userscript raw ≤ 332.0 KB 또는 여유 ≥ 3.0 KB.

## 현재 상태

- Build: prod 332.29 KB / 335 KB, gzip 89.03 KB (검증 스크립트 PASS)
- Tests: unit + browser + E2E + a11y 전체 GREEN
- 정적 분석: Typecheck / ESLint / Stylelint / CodeQL 모두 PASS

## 다음 단계

- 브랜치: `feature/docs-token-uniformity-followups`에서 P0 → P1 → P2 순으로 처리
- 완료 시: 본 문서에서 해당 항목 제거, 세부 내역은 COMPLETED 문서로 이관
- 보고: `AGENTS.md`의 작업 종료 프로토콜에 따라 build/maintenance 요약 보고

## 참고 문서

- 완료 기록: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- 개발 워크플로: `AGENTS.md`
- 아키텍처: `docs/ARCHITECTURE.md`
- 코딩 규칙/디자인 토큰: `docs/CODING_GUIDELINES.md` \*\*\* End Patch
