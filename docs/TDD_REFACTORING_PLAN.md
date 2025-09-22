# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-22 — EPIC-C(Userscript 하드닝 v3) P0/P1 완료 및 모니터링 전환
완료. “EPIC-SM — Settings Modal Implementation Audit”의 스코프(메뉴 연동/접근성
스모크)가 모두 GREEN으로 확인되어 Completed 로그로 이관했습니다.

새 사이클 제안(승격): EPIC-USH-v4 — Userscript 하드닝 v4 (빌드
일관성/헤더/테스트 강化) 본 문서의 활성 Epic에 P0/P1 작업을 적재하고, 코드
변경은 RED→GREEN 절차로 진행합니다.

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 “활성 Epic/작업”과 해당 Acceptance에만 집중합니다.

---

## 2. 활성 Epic 현황

### EPIC-USH-v4 — Userscript 하드닝 v4

목표

- “단일 파일 보장”과 “소스맵/헤더 정책”을 명확히 하여 릴리즈 환경에서
  노이즈(404, 자산 누락)를 제거하고, SPA 라우팅/입력 이벤트/접근성의 기본 가드를
  테스트로 강화합니다.

스코프(현 단계)

- P0-1: 단일 파일 보장 — assets 인라인화 정책 상향
  - 변경: build.assetsInlineLimit → Infinity (또는 동등한 “모든 자산 인라인”
    설정)
  - 검증: dist 내 assets/ 폴더 없이도 UI/아이콘/폰트/이미지 참조가 정상 동작
  - 테스트: CSS url() 참조가 data URI로 변환되었는지 정적 검사 + 런타임 스모크

- P0-2: 소스맵 정책 일원화 — prod의 sourceMappingURL 주석 제거
  - 변경: prod 빌드 산출물(.user.js) 말미 sourceMappingURL 주석 미부착
  - 대안 경로: prod에서 .map을 릴리즈 아티팩트에 포함한다면 주석 유지(정책 중
    택1)
  - 검증: scripts/validate-build.js가 정책을 감지해 PASS/FAIL 결정

- P0-3: Userscript 헤더 메타 보강
  - 추가: @homepageURL, @source, @icon, @antifeature none
  - 옵션: @match twitter.com/_, https://_.twitter.com/\* (지원 범위 확장 필요
    시)
  - 검증: validator에서 헤더 필수/선택 메타 충족, 퍼미션/커넥트 정합성 PASS

- P1-1: SPA 라우팅/마운트 안정화 테스트
  - idempotent 마운팅 가드, 라우트 전환 시 단일 마운트 유지, detach 누락 방지
  - MutationObserver/History 훅 병행 시 스로틀/클린업 검증

- P1-2: PC 전용 이벤트 가드/접근성 스모크 강화
  - Touch/Pointer 사용 시 RED 테스트 추가(컴포넌트/유틸/리스너 등록 모두 검사)
  - 키보드 내비(Arrow/Home/End/Escape/Space)와 스크롤 충돌 방지 스모크

- P1-3: @connect 도메인 정합성 감사
  - 실행 시점 네트워크 로그로 실제 접근 도메인 수집 후 @connect 동기화
  - 예: x.com, api.twitter.com, pbs.twimg.com, video.twimg.com, (필요 시)
    ton.twitter.com

Acceptance(에픽)

- prod .user.js에서 404 sourceMappingURL 네트워크 오류가 관측되지 않는다(또는
  .map이 실제 포함되어 정상 동작).
- dist에 assets/ 폴더가 없어도 스타일/이미지/폰트가 정상 표시된다.
- 헤더 메타가 최신 정책을 충족하며 validator PASS.
- SPA 네비/이벤트/접근성 스모크가 GREEN이며, 누수/중복 마운트 0.

---

## 3. 다음 사이클 준비 메모(Placeholder)

- 신규 Epic 제안 시 백로그에 초안 등록(Problem/Outcome/Metrics) 후 합의되면 본
  문서로 승격합니다.

---

## 5. TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

Gate 체크리스트(요지):

- 타입/린트/테스트/빌드 검증은 `AGENTS.md`와 `CODING_GUIDELINES.md`의 품질
  게이트를 따릅니다.
- USH-v4 추가 검증:
  - prod 소스맵 주석 정책 준수(dev만 주석 또는 prod .map 포함 시 일치)
  - 단일 파일 보장(외부 자산 참조 없음), dist/assets 미존재

---

## 6. 참고 문서

| 문서                   | 위치                                     |
| ---------------------- | ---------------------------------------- |
| 완료 로그              | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그                 | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계                   | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙              | `docs/CODING_GUIDELINES.md`              |
| 계획 아카이브(축약 전) | `docs/archive/`                          |

필요 시 새 Epic 제안은 백로그에 초안(Problem/Outcome/Metrics) 형태로 먼저 추가
후 합의되면 본 문서 Epic 템플릿 섹션에 승격합니다.

---

## 7. 품질 게이트 및 검증 방법

모든 Epic/Task는 다음 게이트를 통과해야 합니다.

- 타입: `npm run typecheck` — strict 오류 0
- 린트/포맷: `npm run lint` / `npm run format` — 수정 사항 없거나 자동 수정 적용
- 테스트: `npm test` — 신규/갱신 테스트 GREEN, 리팩터링 임시 RED만 허용 주석
  필수
- 빌드: `npm run build:dev`/`prod` — 산출물 검증 스크립트 통과

추가로, 접근성 전용 스모크:

- Tab/Shift+Tab 네비게이션 스모크, Escape 복귀 스모크, aria-live 공지 스냅샷

메모리 전용 스모크:

- 타이머/리스너 카운트 0, revoke 큐 0, 대량 로딩 후 회복 확인(모킹)
