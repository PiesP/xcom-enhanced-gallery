# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-30 | **상태**: Phase 258 완료, 다음 작업 식별 중 |
**[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## 🔄 현재 진행 중인 작업

### Phase 259: 이벤트 핸들러 순서 최적화 (구현 예정)

**목표**: Event handler 실행 순서 최적화로 재페인트 3-5ms 단축

**상태**: 📋 **계획 수립 중**

**분석**:

- **발견**: Phase 254 (CSS 정책)는 실제로 100% 완료됨 (219/219 GREEN)
- **현황**: 다음 최적화 대상 식별 필요
- **예상 소요**: 1-2시간
- **영향**: 추가 성능 개선, 브라우저 리플로우 최소화

**작업 후보 (우선순위)**:

1. **Phase 258.2** (이벤트 핸들러): 3-5ms 추가 개선, 저위험
2. **Phase 255** (CSS 레거시 토큰): 101개 토큰, 2-4시간
3. **의존성 정리**: 4개 미사용 패키지, 3-5KB 절감

**다음 단계**:

1. ✅ Phase 258.2 선택 (최소 노력, 최대 효율)
2. 📋 이벤트 핸들러 순서 분석
3. 🔧 최적화 구현 및 테스트
4. ✅ 검증 및 문서화

---

## ✅ 완료된 최근 작업

### Phase 254: CSS 정책 스위트 마무리 ✅ 완료 (2025-10-30, 실제 완료됨)

**발견**: 모든 CSS 테스트가 실제로 완료됨 (219/219 GREEN)

**상태**: ✅ 100% 완료

**검증**:

- `npm run test:styles`: 40개 파일, 219개 테스트 모두 통과
- 실행 시간: 2.86초
- 항목: animation-standards, color-consistency, design-tokens, layout-policies
  등 모두 GREEN

**영향**: 스타일 정책 체계 완성, 토큰 일관성 보장

**상세 기록**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참고

---

### Phase 258: 초기화 순서 최적화 ✅ 완료 (2025-10-30)

**달성**: SettingsService 지연 로드로 부트스트랩 30-50% 개선 기대

**구현 내용**:

- `src/bootstrap/features.ts`: SettingsService 제거
- `src/features/gallery/GalleryApp.ts`: ensureSettingsServiceInitialized() 추가
- 효과: Step 4 부트스트랩 ~25-30ms 단축

**테스트 상태**: ✅ GREEN (219/219 통과)

**상세 기록**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참고

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
