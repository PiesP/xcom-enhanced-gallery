# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-30 | **상태**: Phase 267 완료, Phase 268 계획 중 |
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

**테스트 상태**: ✅ 모두 GREEN

- 단위 테스트: 25/25 통과 (Phase 267 테스트 포함)
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

### Phase 268: 런타임 경고 제거 (진행 중)

**목표**: 브라우저 콘솔 경고 3가지 해결

**상태**: 📋 계획 중 → 🚀 구현 예정

**세부 작업**:

- Phase 268-1 (필수): toolbar.autoHideDelay 설정 추가 (~5분)
- Phase 268-2 (권장): StaticVendorManager 초기화 명시화 (~15분)
- Phase 268-3 (권장): toast.controller 중복 등록 정리 (~10분)

**참고**: [로그 분석 문서](./temp/LOG_WARNINGS_ANALYSIS_2025_10_30.md)

---

## 🔄 옵션 작업 (선택사항)

### Phase 267: 메타데이터 폴백 강화 ✅ 완료

**목표**: 미디어 메타데이터 부재 시 기본값 설정

**상태**: ✅ **완료** (권장)

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
| 268   | 📋 예정 | 런타임 경고 제거            | 콘솔 경고 3가지 해결        |
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
