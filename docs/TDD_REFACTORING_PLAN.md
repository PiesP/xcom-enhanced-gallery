# TDD 리팩토링 계획 (요약본)

최종 업데이트: 2025-10-31

이 문서는 “진행 중/예정” 항목만 유지합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

## 현재 상태 요약

- 최근 완료: Phase 287-B(번들 크기 1차), Phase 286(Flow Tracer), Phase 285(고급 로깅)
- 전체 지표: 번들 344.36 KB (gzip 93.05 KB), 테스트 GREEN, 품질/보안 0 에러

---

## 예정: Phase 287-C — 문서 경량화(완료 기록 아카이브 분리)

목표

- 완료 기록 문서(`TDD_REFACTORING_PLAN_COMPLETED.md`)를 500줄 미만으로 경량화하여 유지보수 점검 경고 해소

우선 조치

- 장문/세부 내역을 `docs/archive/`로 이동(스냅샷/Phase별 상세 분리)
- 완료 문서에는 “최근 완료/핵심 성과/전체 기록 링크”만 유지(요약본)
- 문서 내 중복 섹션 제거, 링크 점검(404 방지)

수용 기준(AC)

- `npm run maintenance:check`에서 큰 문서 경고 0건
- `npm run validate` markdownlint 0 에러
- 코드/테스트/빌드에 영향 없음

작업 노트

- 기존 아카이브 파일(`docs/archive/TDD_REFACTORING_PLAN_COMPLETED_*.md`) 재활용 우선
- 필요 시 새 아카이브 파일 생성(날짜/Phase 기준 네이밍), 루트 문서에는 링크만 유지

---

## 예정: Phase 288 — 번들 크기 절감 2차(코드 중심 후보 탐색)

목표

- 코드 레벨에서 안전한 범위의 추가 절감 후보를 식별하고 실험 설계를 확정(기능 회귀 0)

탐색 후보(초안)

- 아이콘 분할 수준 점검(사용 빈도 낮은 아이콘의 lazy 영역 분리)
- i18n 동적 로딩 스텁 실험(언어 추가 대비 설계, 현 3언어는 유지)
- Terser 세부 옵션 미세 조정(순수 함수 인라인/불변 구조 보호 등) — 회귀 위험 평가 필수

수용 기준(AC)

- 사전 실험: 각 후보별 before/after 번들 크기 기록 및 회귀 테스트 GREEN
- 본 적용 시에도 `validate-build.js` GREEN, 번들 ≤ 420 KB/gzip ≤ 120 KB 유지

작업 노트

- Vendors getter/PC 전용 이벤트/디자인 토큰 규칙 준수 필수
- 실험 코드는 브랜치 분리 및 빠른 RED→GREEN 검증 루프 권장

## 참고

- 개발 가이드: ../AGENTS.md
- 코딩 규칙: ./CODING_GUIDELINES.md
- 테스트 전략: ./TESTING_STRATEGY.md

---

## 📚 관련 문서

- **완료 기록**: [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
- **개발 가이드**: [AGENTS.md](../AGENTS.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
