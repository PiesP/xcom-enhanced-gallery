# 아카이브: 부트스트랩 테스트 (Archive/Unit/Bootstrap)

> Phase 188에서 이동된 메인 초기화 테스트
> 최종 업데이트: 2025-10-25

## 📋 테스트 목록

### 메인 초기화 (Bootstrap)

- `main-initialization.test.ts`: main.ts 초기화 오류 수정 검증
- `main-start-idempotency.test.ts`: 메인 start 함수 멱등성 검증

**상태**: 구조 검증 테스트 (Phase 초기에 수행된 작업)
**용도**: 초기화 경로 보호 (변경 빈도 낮음)
**활성화**: 필요시 `vitest.config.ts`에서 활성화

## 🔄 마이그레이션 경로

**원본 위치**:

- `test/unit/main/*` → `test/archive/unit/bootstrap/`

**이유**:

1. 메인 초기화는 주요 변경 대상이 아님
2. 한번 수정된 후 거의 변경되지 않음
3. 새로운 기능 추가 시 오버헤드 감소

## ✅ 다음 단계

1. **재활성화 필요 시**:

```bash
vitest test/archive/unit/bootstrap  # 명시적 실행
```

1. **정책 업데이트**:

- CoreService 리팩토링 시 함께 업데이트 필요
- 문서: `docs/TDD_REFACTORING_PLAN.md`

---

**참고**: Phase 188에서 이동되었으며, 변경이 필요할 때까지 보관됩니다.
