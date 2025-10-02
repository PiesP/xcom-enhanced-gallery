# 🗂️ TDD 리팩토링 백로그

> 활성화되지 않은 향후 후보 아이디어 저장소 (선정 전까지 여기서만 유지)
>
> **최근 업데이트**: 2025-01-13 — A11Y_LAYER_TOKENS Epic 완료 및 제거
>
> 사용 방법:
>
> - 새 사이클 시작 시 이 목록에서 1~3개를 선택하여 `TDD_REFACTORING_PLAN.md`의
>   "활성 스코프"로 승격
> - 선택 기준: 가치(Impact) / 구현 난이도(Effort) / 가드 필요성(Risk of
>   Regression)
> - 승격 후 RED 테스트부터 작성, 완료되면 COMPLETED 로그로 이관
>
> 코멘트 규칙: `상태 | 식별자 | 요약 | 기대 효과 | 난이도(S/M/H) | 비고`
>
> 상태 태그: `IDEA`(순수 아이디어), `READY`(바로 착수 가능), `HOLD`(외부 의존),
> `REVIEW`(설계 검토 필요)

---

## 우선순위별 후보 목록

### HIGH Priority

(현재 없음)

### MEDIUM Priority

READY | CONNECT_SYNC_AUTOMATION | 실행 시 접근 호스트 수집→@connect 동기화
스크립트 | 퍼미션 미스 방지/릴리즈 안정성 | M | READY | SPA_IDEMPOTENT_MOUNT |
라우트/DOM 교체 시 단일 마운트/클린업 가드 테스트 | 중복 마운트/누수 방지 | M |
READY | REF-LITE-V4 | 서비스 워ーム업 다이어트 및 벤더 export 정리 (Stages B~C)
| Solid 전환 병행 시 런타임 회귀 방지 | M | Solid Stage C 이후 재승격 후보 READY
| BUILD-ALT-001 | esbuild 기반 userscript 빌드 전환 파일럿 | Solid 빌드 호환성
확보 및 빌드 시간 단축 | M | Solid Stage A에서 충돌 발생 시 즉시 재승격

### LOW Priority

READY | RED-TEST-006 | Test Infrastructure Improvements | 테스트 구조/통합/도구
개선 | S | 5개 테스트 파일 skip 중

---

## 상세 계획 (승격 전 참고용)

### Epic RED-TEST-006: Test Infrastructure Improvements

**RED-TEST-006**: Test Infrastructure Improvements (S, 1-2 days)

- 테스트 구조 정리, Legacy 계약 검증
- 5개 테스트 파일 영향

---

## Parking Lot (보류 중)

(현재 없음)

---

## 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 활성 계획   | `docs/TDD_REFACTORING_PLAN.md`           |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |

---

## Template

```text
READY | IDENTIFIER | 간단 요약 | 기대 효과 | 난이도(S/M/H) | 비고
```

새 항목 추가 시 우선순위에 맞게 HIGH/MEDIUM/LOW 섹션에 배치하며, 제거는 commit
메시지에 사유 명시.
