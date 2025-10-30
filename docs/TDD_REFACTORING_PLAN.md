# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-30 | **상태**: Phase 257 완료, Phase 258 분석 완료
| **[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## 🔄 현재 진행 중인 작업

### Phase 258: 초기화 순서 최적화 (구현 시작)

**목표**: 앱 시작 시간 30-50% 개선 (~30-50ms 단축)

**상태**: ✅ 분석 완료 → 🔄 **구현 시작**

**핵심 발견**:

- 현재 부트스트랩: 7단계 순차 실행 (~70-100ms)
- **주요 병목**: Step 4 SettingsService 조기 로드 (~30-50ms)
- **최적화 기회**: 지연 로드로 변경 (Step 4에서 제거 → Step 6으로 이동)

**구현 계획**:

1. **SettingsService 지연 로드** (필수)
   - 파일: `src/bootstrap/features.ts` → SettingsService 제거
   - 파일: `src/features/gallery/GalleryApp.ts` → 필요 시 로드
   - 기대: ~25-30ms 단축 (Step 4를 5-10ms로 감소)

2. **이벤트 핸들러 순서 조정** (선택)
   - 파일: `src/main.ts` → Step 5,6 순서 변경
   - 기대: ~3-5ms 추가 절감

3. **성능 측정 및 검증**
   - 부트스트랩 시간 측정 (performance.now())
   - 테스트 GREEN 확보

**상세 분석**: `docs/temp/PHASE_258_FINAL_REPORT.md`

---

## ✅ 완료된 작업

### Phase 257: events.ts 번들 최적화 ✅ 완료

**목표**: 1128줄 / 35.18 KB → 1055줄 / 32 KB

**달성**: 1052줄 / 31.86 KB ✅ **(목표 초과 달성, 6.7% 감축)**

**최적화 내용**:

1. ✅ ID 생성 단순화 (타임스탬프/카운터 제거, 랜덤만 사용)
2. ✅ 주석 대량 제거 (Phase XXX 코멘트 제거)
3. ✅ logger.debug 호출 제거 ([PC-only policy] 관련 로그 제거)
4. ✅ 빈 줄 정리 (연속된 빈 줄 정규화)
5. ✅ 불필요한 변수 제거 (totalCount, targetType 제거)

**테스트 상태**: ✅ GREEN (1052 ≤ 1055줄, 31.86 ≤ 32 KB)

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

## 📊 현황 요약

| 항목          | 상태      | 진행             | 비고                         |
| ------------- | --------- | ---------------- | ---------------------------- |
| Phase 256     | ✅ 완료   | 461줄, 14.56KB   | VerticalImageItem 최적화     |
| Phase 257     | ✅ 완료   | 1052줄, 31.86KB  | events.ts 최적화 (76줄 감축) |
| Phase 258     | 📊 분석   | 30-50% 개선 가능 | 초기화 순서 최적화 분석 완료 |
| 빌드/테스트   | ✅ 안정   | 217/219 통과     | 모든 최적화 적용됨           |
| 번들 크기     | ✅ 341 KB | 여유 79 KB       | 목표 ≤420 KB 달성            |
| 보안 (CodeQL) | ✅ 0 경고 | Phase 232        | 완료                         |

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
