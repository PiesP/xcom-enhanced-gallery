# 🗂️ TDD 리팩토링 백로그

> 활성화되지 않은 향후 후보 아이디어 저장소 (선정 전까지 여기서만 유지)
>
> 사용 방법:
>
> - 새 사이클 시작 시 이 목록에서 1~3개를 선택하여 `TDD_REFACTORING_PLAN.md`의
>   "활성 스코프"로 승격
> - 선택 기준: 가치(Impact) / 구현 난이도(Effort) / 가드 필요성(Risk of
>   Regression)
> - 승격 후 RED 테스트부터 작성, 완료되면 COMPLETED 로그로 이관
>
> 코멘트 규칙: `상태 | 식별자 | 요약 | 기대 효과 | 난이도(T/S/M/H) | 비고`
>
> 상태 태그: `IDEA`(순수 아이디어), `READY`(바로 착수 가능), `HOLD`(외부 의존),
> `REVIEW`(설계 검토 필요)

---

## Candidate List

<!-- MEM_PROFILE 승격 및 완료 (2025-09-12): 경량 메모리 프로파일러 유틸 추가, 문서/테스트 포함 -->

IDEA | MEDIA-CYCLE-PRUNE-01 | shared/media 인근 순환(2건:
index↔pipeline↔media-url.util) 제거 | 의존성 위생 및 테스트 용이성 향상,
리팩터링 안전망 강화 | M | 수용 기준: dependency-cruiser circular 경고 0(해당
영역), 기존 테스트 GREEN, 동작 변화 없음. 접근: util 경계 분리 또는 의존 방향
정리.

READY | SRC-PATH-RENAME-01 | 소스 경로 리네임/정리(legacy/test-only/옵션 리네임)
| 유지보수성 향상 및 오탐 방지(런타임 금지 경로 명확화) | S/M | 세부 계획:
`docs/SOURCE_PATH_RENAME_PLAN.md` 참조. 수용 기준: 전역 수용 기준 준수 및 계획서
내 각 항목의 가드 충족.

---

## Parking Lot (미보류)

(현재 없음)

---

## Template

```
IDEA | IDENTIFIER | 간단 요약 | 기대 효과 | 난이도(S/M/H) | 비고
```

필요 시 항목을 재정렬(우선순위 높을수록 위) 하며, 제거는 commit 메시지에 사유
명시.
