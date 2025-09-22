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

READY | A11Y_LAYER_TOKENS | 레이어(z-index)/포커스 링/대비 토큰 재점검 및 회귀
테스트 | 접근성/스타일 회귀 방지 | M | READY | CONNECT_SYNC_AUTOMATION | 실행 시
접근 호스트 수집→@connect 동기화 스크립트 | 퍼미션 미스 방지/릴리즈 안정성 | M |
READY | SOURCEMAP_VALIDATOR | prod 주석 정책/릴리즈 .map 포함 여부 검사 스크립트
| 빌드 노이즈(404) 제거 | S | READY | SPA_IDEMPOTENT_MOUNT | 라우트/DOM 교체 시
단일 마운트/클린업 가드 테스트 | 중복 마운트/누수 방지 | M |

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
