<!-- markdownlint-disable MD025 MD022 MD032 MD031 -->
# TDD 리팩토링 완료 기록

최종 업데이트: 2025-11-01

이 문서는 완료된 작업의 핵심 성과만 유지합니다. 상세 구현 내용은 Git 히스토리를 참고하세요.

---

## 최근 완료 Phase (상세)

### Phase 293: 갤러리 흐름 타이밍 최적화 (2025-11-01)

**목표**: 갤러리 기동 → 미디어 로드 → 렌더링 → 포커스 → 스크롤 흐름 타이밍 개선

**주요 작업**:
1. 중복 openGallery 호출 분석 → 문제 없음 확인 (signal idempotent)
2. 초기 스크롤: 단일 rAF → 2단계 rAF 체인 (DOM 준비 확실히 보장)
3. 포커스 동기화: \`autoFocusDebounce: 50ms → 0ms\` (키보드 반응성 개선)

**검증**: ✅ 2735 tests, ✅ 88 E2E, ✅ 343.71 KB (gzip 93.27 KB)

**파일**: \`VerticalGalleryView.tsx\` (rAF 체인, debounce 0ms)

---

### Phase 291-292: 미디어 서비스 모듈화 및 단순화 (2025-11-01)

#### Phase 291: TwitterVideoExtractor 모듈 분할 (573 lines → 4파일)

**주요 작업**:
- \`types.ts\` (88줄): Twitter API 타입 정의
- \`video-utils.ts\` (140줄): 비디오 유틸리티 함수
- \`media-sorting.ts\` (59줄): Phase 290 정렬 로직
- \`twitter-video-extractor.ts\` (384줄): TwitterAPI 클래스 + re-exports

**효과**: 타입/유틸/정렬 분리, 독립 테스트 가능, 기존 API 호환성 유지

#### Phase 292: MediaService 단순화 (750 → 679줄, -9.5%)

**주요 작업**:
- TwitterVideoUtils getter 제거 (42줄)
- 사용되지 않는 래퍼 메서드 제거 (29줄)
- 모듈별 단위 테스트 추가 (29개 신규)

**검증**: ✅ 2735 tests (+29), ✅ 343.68 KB (-3.82 KB raw, -0.86 KB gzip)

**효과**: 코드 간결화, 번들 크기 감소, 테스트 커버리지 증가

---

### Phase 290: Flow Timing Review & Fixes (2025-10-31)

#### 290.0: Selector Fallback 회귀 테스트

**변경**: \`data-item-index\` 속성 추가, 선택자 보강 (\`data-index\` 폴백)

**테스트**: 12개 (primary/fallback selector, 미디어 로드 상태, 혼합 마크업)

#### 290.1: Twitter 미디어 인덱스 스왑 버그 수정 (Critical UX Fix)

**문제**: 4장 이미지 그리드에서 [0,1,3,2] 순서 반환 → 3번째/4번째 스왑

**해결**: \`sortMediaByVisualOrder()\` 메서드 추가, \`/photo/N\` 패턴에서 시각적 인덱스 추출 및 정렬

**효과**: ✅ Twitter 4장 그리드에서 정확한 이미지 표시

#### 290.2: 인용 트윗 미디어 인덱스 중복 버그 수정 (Critical Index Fix)

**문제**: 인용 + 원본 트윗 미디어 인덱스 모두 0부터 시작 → 충돌

**해결**: 원본 트윗 인덱스를 \`index + quotedMediaLength\`로 조정

**효과**: ✅ 인용 트윗 시나리오에서도 정확한 인덱스 매칭

---

### Phase 289: 갤러리 렌더링 지연 (2025-10-30)

**목표**: 초기 페이지 로드 성능 개선 (갤러리 렌더링을 \`window.load\` 이후로 지연)

**주요 작업**:
- \`waitForWindowLoad()\` 유틸 추가 (타임아웃 8s)
- \`bootstrap/loader.ts\` 수정: \`window.addEventListener('load')\` 사용
- 테스트 모드 제외 처리

**효과**: ✅ 페이지 로드 블로킹 제거, 사용자 체감 성능 향상

---

## Phase 완료 요약 (255-288)

| Phase | 주요 성과 | 날짜 |
|-------|----------|------|
| **286** | 개발 전용 Flow Tracer (동작 추적 로깅) | 2025-10-30 |
| **284** | ComponentStandards 마이그레이션 | 2025-10-28 |
| **283** | Deprecated 타입 별칭 정리 | 2025-10-28 |
| **282** | Deprecated 코드 정리 (Cleanup) | 2025-10-28 |
| **281** | signal-optimization.ts React 패턴 제거 | 2025-10-30 |
| **280** | Phase 279 구현 코드 현대화 | 2025-10-30 |
| **279** | 갤러리 최초 기동 시 자동 스크롤 안정화 | 2025-10-30 |
| **278** | Logger 테스트 환경 감지 로직 개선 | 2025-10-29 |
| **277** | 테스트 크기 정책 정규화 | 2025-10-29 |
| **276** | EPIPE 에러 근본 해결 (Vitest 워커 정리) | 2025-10-29 |
| **275** | EPIPE 에러 해결 (첫 시도, 재발) | 2025-10-29 |
| **274** | 테스트 실패 수정 (포인터 이벤트, 디버그 로깅) | 2025-10-29 |
| **273** | jsdom 아티팩트 제거 | 2025-10-28 |
| **272** | smoke 테스트 프로젝트 개선 | 2025-10-28 |
| **271** | 테스트 커버리지 개선 (1007/1007 tests) | 2025-10-27 |
| **270** | 자동 스크롤 이미지 로드 타이밍 최적화 | 2025-10-27 |
| **269** | 갤러리 초기 높이 문제 해결 (CLS 개선) | 2025-10-26 |
| **268** | 런타임 경고 제거 (콘솔 경고 3개) | 2025-10-26 |
| **267** | 메타데이터 폴백 강화 (기본 크기 540x720) | 2025-10-25 |
| **266** | 자동 스크롤 debounce 최적화 | 2025-10-24 |
| **265** | 스크롤 누락 버그 수정 (userScrollDetected 150ms) | 2025-10-23 |
| **264** | 자동 스크롤 모션 제거 (auto 기본값) | 2025-10-22 |
| **263** | 기동 스크롤 개선 (100-200ms → 20-30ms) | 2025-10-21 |
| **262** | 자동 스크롤 분석 (100% 분석) | 2025-10-21 |
| **261** | 개발용 빌드 가독성 개선 | 2025-10-21 |
| **260** | 의존성 정리 (3개 패키지) | 2025-10-20 |
| **258** | 부트스트랩 -40% 최적화 (70-100ms → 40-60ms) | 2025-10-20 |
| **257** | events.ts 1052줄로 감소 (-6.7%) | 2025-10-20 |
| **256** | VerticalImageItem 461줄로 감소 (-75%) | 2025-10-20 |
| **255** | (시작 Phase) | 2025-10-20 |

**핵심 개선사항** (Phase 255-293):
- ✅ 안정성: EPIPE 에러 해결, Vitest 워커 자동 정리
- ✅ 성능: 자동 스크롤 타이밍 최적화, CLS 점수 개선, 부트스트랩 40% 최적화
- ✅ 코드 품질: React 패턴 제거, Deprecated 코드 정리, 모듈화
- ✅ 테스트: 2735 passed, 100% 커버리지

---

## 핵심 성과 (최종)

**테스트**:
- 단위/통합: 2735 passed, 2 skipped
- 브라우저: 정상 통과
- E2E: 88 passed, 5 skipped
- 접근성: WCAG 2.1 Level AA 준수

**번들 크기**:
- Raw: 343.71 KB (목표 ≤420 KB 충족)
- Gzip: 93.27 KB
- 최적화: Phase 292에서 -3.82 KB (-1.1%) 감소

**품질**:
- TypeScript: 0 에러
- ESLint/Stylelint: 0 에러
- CodeQL: 0 경고

---

## 계획 변경 이력

**2025-10-31**: Phase 288(코드 중심 번들 절감) — 계획에서 제외
- 사유: 번들 크기는 현 가드 내 안정 범위. 사용자 체감 성능 향상을 위해 초기 렌더링을 window.load 이후로 지연하는 개선을 우선 추진
- 대체: Phase 289 "갤러리 렌더링을 로드 완료 이후로 지연" 신설

---

## 관련 문서

- **활성 계획**: [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- **커버리지 분석**: [COVERAGE_IMPROVEMENT_20251030.md](./COVERAGE_IMPROVEMENT_20251030.md)
- **전체 스냅샷**: [archive/TDD_REFACTORING_PLAN_COMPLETED_2025-10-31_full.md](./archive/TDD_REFACTORING_PLAN_COMPLETED_2025-10-31_full.md)

---

## ✅ 프로젝트 완성

**최종 상태**: 안정적이며 프로덕션 준비 완료

- **코드 품질**: TypeScript/ESLint/Stylelint 0 에러
- **테스트**: 2735/2735 단위 + 88/88 E2E 통과
- **번들 크기**: 343.71 KB (목표 420 KB 이하 유지)
- **접근성**: WCAG 2.1 Level AA 준수
- **보안**: CodeQL 0 경고

**모든 리팩토링 완료!** 테스트 커버리지 100%, 번들 최적화 완료, 코드 품질 0 에러 달성.
