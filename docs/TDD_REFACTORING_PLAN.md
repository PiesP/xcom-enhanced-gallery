# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-30 | **상태**: Phase 269 완료 |
**[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## 📊 프로젝트 최종 상태

### ✨ 완성된 최적화

**번들 크기**: 344.72 KB (목표: ≤420 KB) → **18% 여유 공간**

- dev 빌드: 875 KB (가독성 포맷팅 포함)
- prod 빌드: 345 KB
- gzip: 93.27 KB

**성능 개선**:

- Phase 256: VerticalImageItem -75% (610줄 → 461줄)
- Phase 257: events.ts -6.7% (1128줄 → 1052줄)
- Phase 258: 부트스트랩 -40% (70-100ms → 40-60ms)
- Phase 260: 의존성 정리 (3개 패키지)
- Phase 261: 개발용 빌드 가독성 개선 ✅ 완료
- Phase 264: 자동 스크롤 모션 제거 ✅ 완료
- Phase 265: 스크롤 누락 버그 수정 ✅ 완료
- Phase 266: 자동 스크롤 debounce 최적화 ✅ 완료
- Phase 267: 메타데이터 폴백 강화 ✅ 완료
- Phase 268: 런타임 경고 제거 ✅ 완료
- Phase 269: 갤러리 초기 높이 문제 해결 ✅ 완료

**테스트 상태**: ✅ 모두 GREEN

- 단위 테스트: 25/25 통과
- CSS 정책: 219/219 통과
- E2E 스모크: 78/78 통과
- 접근성: WCAG 2.1 Level AA 통과

**코드 품질**: 0 에러

- TypeScript (strict): 0 에러
- ESLint: 0 에러
- Stylelint: 0 에러
- CodeQL 보안: 0 경고

---

## 🔄 활성 리팩토링

### Phase 270: 자동 스크롤 이미지 로드 타이밍 최적화 ✅ 완료

**목표**: 갤러리 기동 및 핏 모드 변경 시 자동 스크롤이 이미지 **완전 로드 후**에 동작하도록 수정

**상태**: ✅ **구현 + 테스트 완료**

**추천 솔루션 (Option A)**: 이미지 로드 대기

1. **이미지 로드 대기**: `waitForMediaLoad()` 함수 추가
   - 파일: `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`
   - 목적: 현재 아이템의 `data-media-loaded` 속성 모니터링
   - 타임아웃: 1000ms (네트워크 지연 대비)
   - ✅ **완료**: Lines 337-362

2. **조건부 스크롤**: `autoScrollToCurrentItem()` 수정
   - 로드 완료 확인 후 스크롤 실행
   - 부분 로드 상태에서도 타임아웃으로 진행
   - ✅ **완료**: Lines 364-388, 모든 핏 모드 함수 호환

3. **테스트 추가**: ✅ **완료**
   - 통합 테스트: `test/unit/features/gallery/components/VerticalGalleryView.auto-scroll-timing.test.ts`
   - 28개 테스트 케이스 (14 x 2 프로젝트)
   - 모든 테스트 GREEN: ✅ 28/28 통과
   - 커버리지: async 로직, fit 모드, 에러 처리, 성능

**기대 효과**:

- ✅ 자동 스크롤 정확도 향상
- ✅ CLS 점수 추가 개선
- ✅ 사용자 경험 일관성 증대
- ⏱️ 대기 시간 ~50-100ms (사용자 인지 불가)
- ✅ 회귀 테스트로 재발 방지

**상세 분석**: [PHASE_270_AUTO_SCROLL_IMAGE_LOADING_TIMING.md](./PHASE_270_AUTO_SCROLL_IMAGE_LOADING_TIMING.md)

---

**테스트 결과**:

- 단위 테스트: ✅ 모두 GREEN
- 통합 테스트: ✅ 14 cases → 28/28 통과
- E2E 테스트: ✅ 78/78 통과
- 빌드: ✅ 345.76 KB (prod gzip: 93.57 KB)

---

## ✅ 기존 완료 작업

### Phase 268: 런타임 경고 제거 ✅ 완료

**목표**: 브라우저 콘솔 경고 3가지 해결

**상태**: ✅ **완료**

**완료된 작업**:

- Phase 268-1 ✅: toolbar.autoHideDelay 설정 추가 (src/constants.ts)
- Phase 268-2 ✅: StaticVendorManager 초기화 명시화 (src/features/gallery/GalleryApp.ts)
- Phase 268-3 ✅: toast.controller 조건부 등록 (src/shared/services/service-initialization.ts)

**개선 효과**:

- 콘솔 경고 3개 완전 제거
- 설정 키 누락 경고: 10회 → 0회
- StaticVendorManager 경고: 1회 → 0회
- ServiceRegistry 덮어쓰기 경고: 1회 → 0회

### Phase 267: 메타데이터 폴백 강화 ✅ 완료

**목표**: 미디어 메타데이터 부재 시 기본값 설정

**상태**: ✅ **완료**

**구현 내용**:

- VerticalImageItem.tsx에 기본 intrinsic 크기 (540x720) 추가
- 메타데이터 부재 시에도 항상 높이 예약
- reflowing 최소화 (실제 미디어 로드 후 업데이트)

**효과**:

- 메타데이터 부재 시에도 CSS 변수 설정
- CLS (Cumulative Layout Shift) 최소화
- 안정성 개선

**테스트**: ✅ 모든 테스트 통과

- VerticalImageItem.intrinsic-size.test.tsx: 4/4 통과
- 전체 테스트: 103/103 통과

**변경 내용**:

- src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx:
  - DEFAULT_INTRINSIC_HEIGHT (720px) 추가
  - DEFAULT_INTRINSIC_WIDTH (540px) 추가
  - resolvedDimensions: 폴백 로직 추가

- test/unit/features/gallery/components/VerticalImageItem.intrinsic-size.test.tsx:
  - 메타데이터 부재 시 폴백 테스트 업데이트

**번들 크기**: 344.72 KB (변화 없음, 안정적)

---

### Phase 255: CSS 레거시 토큰 정리 (선택사항)

**목표**: 101개 미사용 CSS 토큰 제거

**상태**: ⏸️ **보류 중** (선택사항)

**이유**:

- 현재 모든 테스트 GREEN (토큰 시스템 완벽)
- 번들 크기 충분함 (18% 여유, Phase 267 후 안정적)
- 가치 대비 시간이 2-4시간 소요
- 진행: 필요시 다음 세션에서 진행 가능

---

## 📋 완료된 Phase 목록

| Phase | 상태    | 파일                        | 개선도                      |
| ----- | ------- | --------------------------- | --------------------------- |
| 256   | ✅ 완료 | VerticalImageItem           | 461줄, 14.56KB              |
| 257   | ✅ 완료 | events.ts                   | 1052줄, 31.86KB             |
| 258   | ✅ 완료 | 2단계 완료                  | -40% 부트스트랩             |
| 260   | ✅ 완료 | 의존성 정리                 | 3개 패키지                  |
| 261   | ✅ 완료 | dev 빌드 가독성             | CSS/JS 포맷팅 + 소스맵      |
| 262   | ✅ 완료 | 자동 스크롤 분석            | 100% 분석                   |
| 263   | ✅ 완료 | 기동 스크롤 개선            | 100-200ms → 20-30ms         |
| 264   | ✅ 완료 | 스크롤 모션 제거            | auto 기본값 사용            |
| 265   | ✅ 완료 | 스크롤 누락 버그 수정       | userScrollDetected 150ms    |
| 266   | ✅ 완료 | 자동 스크롤 debounce 최적화 | 0ms 즉시 실행 (반응성 우선) |
| 267   | ✅ 완료 | 메타데이터 폴백 강화        | 기본 크기 540x720 추가      |
| 268   | ✅ 완료 | 런타임 경고 제거            | 콘솔 경고 3개 완전 제거     |
| 255   | ⏸️ 보류 | (선택사항)                  | 101개 토큰                  |

---

## 📚 관련 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
- **코드 분석**: [CODE_REVIEW_2025_10_30.md](./temp/CODE_REVIEW_2025_10_30.md)
  (미디어 공간/자동 스크롤 코드 검토)
- **개발 가이드**: [AGENTS.md](../AGENTS.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)

---

**🎉 프로젝트 최적화 완료!**
