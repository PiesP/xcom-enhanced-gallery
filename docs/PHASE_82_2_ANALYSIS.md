# Phase 82.2: E2E 마이그레이션 준비 완료

**작성일**: 2025-10-16 | **상태**: 준비 완료

---

## 마이그레이션 대상: 8개 테스트

### Tests 1-2: 이벤트 구독 & 네비게이션 동기화

- Test 1: 수동 포커스 우선순위 검증
- Test 2: 네비게이션 이벤트 즉시 동기화

### Tests 3-5: 전역 동기화 & 뷰포트

- Test 3: 스크롤 트리거 (IntersectionObserver) - E2E 필수
- Test 4: 비활성화 시 null 동기화
- Test 5: Debounce 제한 - E2E 필수

### Tests 6-8: 포커스 제어

- Test 6: 포커스 중복 제거 - E2E 필수
- Test 7: 인덱스 변경 재적용
- Test 8: 스크롤 배칭 - E2E 필수

---

## 하네스 API 확장 (완료)

1. setupFocusTrackerHarness()
2. simulateViewportScrollHarness()
3. getGlobalFocusedIndexHarness()
4. getElementFocusCountHarness()
5. disposeFocusTrackerHarness()

---

## 다음 단계

- 8개 테스트 상세 구현
- IntersectionObserver 모킹
- focus() spy 로직 정교화

**완료 기준**: 8/8 테스트 GREEN ✅
