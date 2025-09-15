# TDD 리팩토링 활성 계획

아래 항목들은 저장소 현황 점검 결과(2025-09-15) 도출된 고가치 리팩토링
과제입니다. 모든 항목은 TDD(RED→GREEN)로 진행하고, 완료 즉시
`docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

공통 제약/정책

- 벤더는 getter만 사용: `@shared/external/vendors` (TDZ-safe 정적 API)
- PC 전용 입력만 사용(터치/포인터 금지), CSS Modules + 디자인 토큰만 사용
- 외부 API/브라우저/Userscript 접근은 adapter/getter 경유, import 부수효과 금지
- 최소 diff 원칙과 3계층 경계(Features → Shared → External) 준수

---

우선순위/순서(권장)

- 현재 활성 계획 없음

메모

- 계획 문서는 활성 과제만 유지합니다. 신규 과제 식별 시 RED부터 추가합니다.

```
메모

- “한 줄 구조 리팩토링 후, 최소 diff로 구현” 원칙을 적용합니다.
- 벤더/유저스크립트 getter 사용(직접 import 금지), PC 전용 입력, 디자인 토큰
  정책을 엄격히 준수합니다.
```
