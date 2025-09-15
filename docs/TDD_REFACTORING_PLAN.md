# TDD 리팩토링 활성 계획

아래 항목들은 저장소 현황 점검 결과(2025-09-15) 도출된 고가치 리팩토링
과제입니다. 모든 항목은 TDD(RED→GREEN)로 진행하고, 완료 즉시
`docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

공통 제약/정책

- 벤더는 getter만 사용: `@shared/external/vendors` (TDZ-safe 정적 API)
- PC 전용 입력만 사용(터치/포인터 금지), CSS Modules + 디자인 토큰만 사용
- 외부 API/브라우저/Userscript 접근은 adapter/getter 경유, import 부수효과 금지
- 최소 diff 원칙과 3계층 경계(Features → Shared → External) 준수

수용 기준(모든 과제 공통)

- 신규/수정 테스트 RED→GREEN, `npm run test:fast`/`test:unit` GREEN
- 타입/린트/의존성 검증 PASS(`npm run validate`, `npm run deps:check`)
- dev/prod 빌드 및 postbuild validator PASS

---

## 4) EVENT-LIFECYCLE-ABORT-01 — 이벤트 리스너 수명주기 강화(AbortSignal 지원)

문제/배경

- 일부 유틸/훅에 직접 `addEventListener` 사용이 남아 있으며, AbortSignal 기반
  정리가 일관되지 않습니다.

대안 비교

- A) 문서화만: 일관성 보장 어려움
- B) EventManager 또는 AbortSignal 기반 정리 헬퍼로 표준화

결정(최적안): B 채택 — 이벤트 등록 시 AbortSignal 지원을 우선 도입, 필요 시
EventManager 경유

TDD 단계

1. EVENT-LIFECYCLE-ABORT-01 변경 범위(예상)

- `src/shared/media/FilenameService.ts`
- 테스트: `media.filename.windows-sanitize.test.ts`

수용 기준

- 신규 테스트 GREEN, 기존 파일명 정책 테스트 모두 GREEN, 빌드/포스트빌드 PASS

리스크/롤백

- 일부 기존 파일명 스냅샷 차이 가능 → 정책에 따른 기대값으로 테스트 업데이트

---

우선순위/순서(권장)

1. DOWNLOAD-PROGRESS-TYPE-UNIFY-01
2. USERSCRIPT-ADAPTER-DOWNLOAD-OK-GUARD-01
3. FETCH-CANCELLATION-TIMEOUT-01
4. FILENAME-WIN-SANITIZE-01
5. EVENT-LIFECYCLE-ABORT-01

메모

- “한 줄 구조 리팩토링 후, 최소 diff로 구현” 원칙을 적용합니다.
- 벤더/유저스크립트 getter 사용(직접 import 금지), PC 전용 입력, 디자인 토큰
  정책을 엄격히 준수합니다.
