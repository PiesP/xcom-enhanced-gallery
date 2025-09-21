# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-21 — 활성 Epic 1건(A11y 완료) — Phase 1(보안/네트워크) 완료 ·
Phase 2(선택자 폴백) 진행 중

---

## 1. 불변 운영 원칙

| 영역        | 규칙 요약                                                                   |
| ----------- | --------------------------------------------------------------------------- |
| TypeScript  | strict 100%, 공개 API 명시적 반환 타입                                      |
| 외부 의존성 | preact / signals / fflate / GM\_\* 모두 전용 getter 경유 (직접 import 금지) |
| 입력 이벤트 | PC 전용(click, keydown, keyup, wheel, contextmenu) — 터치/포인터 금지       |
| 스타일      | 색/치수/모션/층(z-index) 모두 토큰 기반 (raw hex/px/ms 직접값 금지)         |
| Result 모델 | 'success' · 'partial' · 'error' · 'cancelled' 고정                          |

테스트 스위트는 위 규칙 위반 시 RED 가드를 유지합니다.

---

## 2. 활성 Epic 현황

다음 Epic 1건이 활성화되었습니다. 직전 사이클의 A11y Epic은 완료되어 Completed
로그로 이관되었습니다. 추가 후보는 `docs/TDD_REFACTORING_BACKLOG.md`를 참고해
선정합니다.

- Epic: 유저스크립트 하드닝 v1 — 보안/선택자/성능(스크롤)

---

## 3. Epic: 유저스크립트 하드닝 v1 — 보안/선택자/성능

배경: dist 산출물(`dist/xcom-enhanced-gallery*.user.js(.map)`)과 소스 트리 점검
결과, 다음 리스크가 우선 개선 대상임을 확인했습니다.

- 보안: TwitterTokenExtractor 사용 시 사용자 토큰 취급의 민감도, GM\_\* 네트워크
  호출의 도메인 범위
- 호환성: X.com DOM 변화에 따른 SelectorRegistry 의존성 민감도
- 성능: wheel 이벤트 처리 빈도 과다 가능성(useGalleryScroll), 대량 로드시 메모리
  압력(ObjectURL) — 완료됨(완료 로그 이관)
- UX(경량): 대량 다운로드 시 진행 가시성 부족(토스트 기반 경량 진행 표시)

목표(Outcome/Success Criteria):

- 토큰 취급
  - 사용자 동의(Consent) 없이는 토큰 추출/사용 경로 차단(기본값 Off)
  - 토큰은 세션 메모리 내 일시 사용만 허용(영구 저장/로그 노출 금지)
  - 테스트: 토큰 영속화/로그 유출 정적 가드 + 단위 테스트 RED→GREEN
- 네트워크/GM\_ 사용
  - Userscript 어댑터에서 허용 도메인(allowlist) 외 호출 기본 차단, 로깅/토스트
    알림
  - 테스트: 허용/차단 케이스 단위 테스트, 설정 토글 e2e 경량 테스트
- 선택자 회복력
  - SelectorRegistry를 데이터 속성/역할 기반 보조 셀렉터로 보강, 1차 실패 시
    폴백
  - 테스트: 의도적으로 DOM 구조가 일부 변한 가짜 DOM에서 추출 성공률 90%+
- 성능(스크롤)
  - useGalleryScroll에 스로틀(또는 rAF 스케줄링) 적용으로 동일 입력 대비 핸들러
    호출 50% 이상 감소
  - 테스트: 가상 휠 이벤트 폭주 시 호출 수/프레임 기준 감소 검증(가짜 타이머)
- UX(경량)
  - UnifiedToastManager 기반 진행률 토스트(선택적 표시)로 대량 다운로드 가시성
    개선
  - 테스트: 진행 이벤트 → 토스트 업데이트/완료/에러 흐름 스냅샷

범위(Scope)와 변경 지점:

- 보안
  - `src/features/settings/services/TwitterTokenExtractor.ts`: 동의 게이트 추가,
    영속 저장 금지, 민감 정보 로그 마스킹
  - `src/shared/external/userscript/adapter.ts`: GM\_\* 호출
    allowlist/deny-by-default, 진단 로그 수준 정리
- 호환성
  - `src/shared/dom/SelectorRegistry.ts`: 다중 전략(데이터 속성/role 기반) 보조
    셀렉터 추가, 폴백 순서/진단 로그 강화
- 성능
  - `src/features/gallery/hooks/useGalleryScroll.ts`: 스로틀/AnimationFrame
    스케줄러 적용, defaultPrevented 기준 최소화
- UX(경량)
  - `src/shared/services/BulkDownloadService.ts` + `UnifiedToastManager`:
    진행률/잔여/실패 재시도 토스트(옵션)

비범위(Out of Scope):

- 모바일/터치 입력 대응(프로젝트 원칙상 비대상)
- 외부 Sanitizer 라이브러리 도입(현재 코드베이스는
  innerHTML/dangerouslySetInnerHTML 사용 없음 — 정적 가드 테스트로 충분)

TDD 작업 목록(RED → GREEN → REFACTOR):

1. 보안 — 토큰/네트워크
   - RED: 토큰 영속화 금지 정적 가드 테스트(금지 API:
     localStorage/sessionStorage/IndexedDB에 토큰 키값), 로그 마스킹 스냅샷
   - GREEN: TwitterTokenExtractor 동의 게이트/일시 메모리 보관 구현, logger
     마스킹
   - RED: Userscript 어댑터 allowlist 테스트(허용: x.com, pbs.twimg.com,
     video.twimg.com / 차단: 기타)
   - GREEN: GM\_\* 래퍼에 allowlist/차단 사유 토스트/로그 추가, 설정 기반 예외
     토글(기본 꺼짐)

2. 호환성 — SelectorRegistry 폴백

- NEXT: 데이터 속성/role 기반 보조 셀렉터/우선순위 강화, 진단 로그 정리
- REFACTOR: 셀렉터 매핑을 상수 테이블로 분리하고 테스트 픽스처 공유화

3. 성능 — 스크롤 스로틀
   - RED: 연속 wheel 이벤트 100회 시 현재 호출 수 기준 대비 50%+ 감소 기대치
     테스트(가짜 타이머)
   - GREEN: useGalleryScroll에 스로틀/또는 rAF 적용, 불필요한 preventDefault
     축소
   - REFACTOR: 스로틀 유틸 공용화(`@shared/utils/performance`)

4. UX — 진행률 토스트(옵션)

- RED: BulkDownloadService 진행 이벤트 → 토스트 업데이트 스냅샷
- GREEN: UnifiedToastManager 통합, 사용자 설정 옵션으로 On/Off
- REFACTOR: 메시지/아이콘 토큰화 및 i18n 키 정리

우선순위(남은 작업 실행 순서):

1. 선택자 폴백 강화 — SelectorRegistry 보조 셀렉터/폴백 (Phase 2 — 진행 중)
2. 성능(스크롤) — useGalleryScroll 스로틀/rAF 스케줄링 (Phase 3)
3. UX(경량) — 진행률 토스트 통합 (Phase 4)

### Phase별 실행 계획(제안)

Phase 2 — 선택자 폴백

- Deliverables
  - SelectorRegistry: 데이터 속성/role 기반 보조 셀렉터 추가 및 폴백 우선순위
    확정, 진단 로그 정리
- Tests (RED → GREEN)
  - 가짜 DOM 변형 시 1차 실패 → 보조 셀렉터로 추출 성공 가드(성공률 ≥ 90%)

- 순서(제안)
  1. 데이터 속성/role 기반 보조 셀렉터 추가 및 폴백 우선순위 확정
  2. 진단 로그 포맷/레벨 정리(최소 warn/debug 키-값 페이로드 통일)
  3. 셀렉터 매핑 테이블화 및 테스트 픽스처 공유화(리팩토링)

Phase 3 — 성능(스크롤)

- Deliverables
  - useGalleryScroll: 스로틀 또는 rAF 스케줄링 적용, 불필요한 preventDefault
    축소
- Tests (RED → GREEN)
  - 가짜 타이머 기반 wheel 100회 폭주 시 핸들러 호출 수 50%+ 감소 검증

Phase 4 — UX(경량)

- Deliverables
  - UnifiedToastManager: BulkDownload 진행률 토스트(진행/잔여/실패 재시도) 옵션
    탑재
- Tests (RED → GREEN)
  - 진행 이벤트 → 토스트 업데이트/완료/에러 흐름 스냅샷 및 설정 On/Off 가드

리스크/완화:

- 네트워크 차단에 따른 기능 회귀 가능 → 설정 플래그로 단계적 롤아웃(기본 Off),
  로그로 false-positive 모니터링
- 선택자 보강의 성능 영향 → 폴백은 1차 실패시에만 실행, 진단 레벨은 Dev에서만
  상세
- 스로틀로 인한 사용자 체감 변화 → 임계값/모드(스로틀 vs rAF) 실험 플래그 제공

품질 게이트 정합성 확인 체크(병합 전):

- TypeScript strict, 벤더/Userscript 접근은 getter/adapter 경유(직접 import
  금지)
- PC 전용 입력 이벤트 범위 유지(터치/포인터 금지)
- 테스트: Vitest + JSDOM, 벤더/GM\_\* 모킹으로 격리 검증
- 빌드: dev/prod 빌드 및 산출물 validator 통과

롤아웃 계획(제안):

- Phase 2 (선택자) → Phase 3 (스크롤) → Phase 4 (UX 토스트)
- 각 Phase 종료 시 Completed 로그로 1줄 요약 이관 — Phase 1은 완료되어 Completed
  로그에 기록됨

---

## 5. TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

Gate 체크리스트 (병합 전):

- `npm run typecheck`
- `npm run lint`
- `npm test` (selective RED 허용)
- `npm run build:prod` + 산출물 validator

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
