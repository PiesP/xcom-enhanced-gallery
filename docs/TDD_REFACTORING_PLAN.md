# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-30 | **상태**: Phase 256 완료, Phase 257 진행 중 |
**[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## ✅ 완료된 작업

### Phase 256: VerticalImageItem 번들 최적화 ✅ 완료

**달성**: 610줄 / 17.16 KB → **461줄 / 14.56 KB** (75% 감축)

**최적화 내용**:

1. ✅ 핸들러 통합 (handleImageLoad/Video\* → handleMediaLoad)
2. ✅ Dimension 파싱 간소화 (deriveDimensionsFromMetadata 37줄 → 20줄)
3. ✅ 비디오 로직 분리 (setupVideoAutoPlayPause 함수화, Effect 3개 → 1개)
4. ✅ 메모이제이션 정리 (변수명 축약, 조건식 단순화)
5. ✅ 코드 간결화 (FitMode switch → Map 기반, 불필요한 타입 캐스트 제거)

**테스트 상태**: ✅ GREEN (461 ≤ 465줄, 14.56 ≤ 14.8 KB)

---

## 🔄 현재 진행 중인 작업

### Phase 257: events.ts 번들 최적화 (진행 중)

**목표**: 1128줄 / 35.18 KB → 970줄 / 30 KB

**현재 상태**: 1128줄 / 35.18 KB (158줄, 5.18 KB 감축 필요)

**최적화 전략**:

1. 이벤트 핸들러 통합 (중복 처리 로직 제거, ~40줄/1.5KB)
2. 키보드 이벤트 로직 간소화 (반복된 키 체크 통합, ~35줄/1.2KB)
3. 타입 정의 간소화 (불필요한 인터페이스 제거, ~25줄/0.8KB)
4. 상태 관리 최적화 (WeakMap/Map 사용 정리, ~20줄/0.8KB)
5. 유틸리티 함수 통합 (getCurrentGalleryVideo/getMediaService 중복 제거,
   ~38줄/1.1KB)

**예상 시간**: 4-5시간

---

## 📊 현황 요약

| 항목          | 상태      | 진행            | 비고                         |
| ------------- | --------- | --------------- | ---------------------------- |
| Phase 256     | ✅ 완료   | 461줄, 14.56KB  | VerticalImageItem 최적화     |
| Phase 257     | 🔄 진행중 | 1128줄, 35.18KB | events.ts 최적화 (158줄/5KB) |
| 빌드/테스트   | ✅ 안정   | 83/83 통과      | E2E + 접근성 포함            |
| 번들 크기     | ✅ 340 KB | 여유 80 KB      | 목표 ≤420 KB                 |
| 보안 (CodeQL) | ✅ 0 경고 | Phase 232       | 완료                         |

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
