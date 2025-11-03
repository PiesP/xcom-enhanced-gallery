# Changelog

All notable changes to X.com Enhanced Gallery will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### 비디오 원본 추출 품질 개선 (Phase 330)

- **자동 비디오 최적화**: Twitter 비디오 미디어 추출 시 최고 품질 MP4 (`tag=12`)
  자동 요청
  - `canExtractOriginalVideo()`: 비디오 최적화 가능 여부 사전 검증
  - `extractOriginalVideoUrl()`: video.twimg.com 비디오 URL 최적화 로직
    - tag 파라미터 없으면 `?tag=12` 추가
    - tag=13이면 tag=12로 변경
    - 이미 tag=12면 그대로 반환
- **상세 로깅**: 비디오 URL 최적화 상태 추적
  - Twitter 미디어인 경우만 상세 로깅 (노이즈 최소화)
  - 변환 전/후 URL 비교 로깅
- **폴백 메커니즘**: URL 파싱 실패 시 문자열 기반 처리로 안정성 보장
- **적용 범위**:
  - `createMediaInfoFromVideo()`: 미디어 정보 생성 시 URL 최적화
  - `FallbackStrategy.extractFromVideos()`: 백업 추출 전략에 적용
  - `DOMDirectExtractor`: DOM 직접 추출에 적용
- **성능**: 런타임 오버헤드 없음 (URL 변환만 수행, ~마이크로초 단위)
- **호환성**:
  - ✅ `video.twimg.com/vi/...` 형식 완벽 지원
  - ⏸️ `pbs.twimg.com` GIF (향후 이미지 로직 통일)
  - ❌ `amplifeed.twimg.com` (API 제한, 미지원)

#### 미디어 추출 원본 이미지 품질 개선 (Phase 329)

- **자동 원본 추출**: Twitter 이미지 미디어 추출 시 고화질 원본(`name=orig`)
  자동 요청
  - `canExtractOriginalImage()`: 원본 추출 가능 여부 사전 검증
  - `extractOriginalImageUrl()` 강화: 로깅, 에러 처리, 폴백 전략 추가
- **상세 로깅**: 원본 추출 성공/실패 추적
  - Twitter 미디어인 경우만 상세 로깅 (노이즈 최소화)
  - 각 단계별 상태 확인 가능
- **폴백 메커니즘**: URL 파싱 실패 시 문자열 기반 처리로 안정성 보장
- **적용 범위**: FallbackStrategy, DOMDirectExtractor 모두에 적용

#### 개발 전용 고급 로깅 시스템 (Phase 285)

- **메모리 프로파일링**: `measureMemory()` 함수 추가 - `performance.memory`
  스냅샷
- **로그 그룹화**: `logGroup()` 함수 추가 -
  `console.group`/`console.groupCollapsed` 래퍼
- **테이블 출력**: `logTable()` 함수 추가 - `console.table` 래퍼
- **런타임 로그 레벨 변경**: `setLogLevel()`, `getLogLevel()` 함수 추가
- **브라우저 개발 도구 노출**: `window.__XEG_SET_LOG_LEVEL`,
  `window.__XEG_GET_LOG_LEVEL`, `window.__XEG_MEASURE_MEMORY`
- **프로덕션 제로 오버헤드**: `__DEV__` 플래그 기반 조건부 컴파일,
  Tree-shaking으로 프로덕션 빌드에서 완전 제거

#### 개발 전용 Flow Tracer — 동작 추적 로깅 (Phase 286)

- **Flow Tracer 유틸 추가**: `startFlowTrace(options?)`, `stopFlowTrace()`,
  `tracePoint(label, data?)`, `traceAsync(label, fn)`, `traceStatus()`
- **브라우저 개발 도구 노출**: `window.__XEG_TRACE_START/STOP/POINT/STATUS`
- **부트스트랩 계측**: `src/main.ts` 전역에 주요 타임라인 포인트 삽입
- **이벤트 추적(PC 전용)**: `click`, `contextmenu`, `mousedown`, `mouseup`,
  `keydown`, `keyup`, `wheel`(스로틀)
- **프로덕션 제로 오버헤드**: `__DEV__` + Tree-shaking으로 프로덕션 완전 제거

### Fixed

- **미디어 원본 추출**: 사전 검증으로 불필요한 처리 방지
- **URL 파싱 실패**: 폴백 전략으로 안정성 개선
- **타입 안전성**: Optional chaining으로 린트 경고 제거

### Performance

- 개발 빌드: 934 KB (디버깅 도구 포함)
- 프로덕션 빌드: 376 KB (gzip: 93 KB, 변화 없음)
- Tree-shaking 검증: 프로덕션에서 개발 전용 코드 0바이트 오버헤드
- 원본 추출 오버헤드: 미미 (URL만 변경, 네트워크 동일)

## [0.4.2] - 2025-11-02

### ✨ 100% 테스트 통과 달성 - 안정성 및 품질 개선

이 릴리즈는 모든 테스트를 통과시켜 프로젝트 안정화를 완료합니다. Phase 306-307
작업을 통해 **6개의 RED 테스트를 모두 해결**하고 **100% 테스트 통과율**을
달성했습니다.

### Added

#### 미디어 파일명 서비스 강화 (Phase 307)

- **FilenameService 테스트 커버리지**: 유효한 미디어 파일명 형식 검증
  - 형식: `{username}_{tweetId}_{YYYYMMDD}_{index}.{ext}`
  - 예제: `alice_1234567890_20251102_1.jpg`

#### 갤러리 이벤트 리스너 범위 지정 (Phase 307, Phase 305)

- **초기화 함수 개선**: `initializeGalleryEvents(handlers, galleryRoot?)`
  - 명시적 `galleryRoot` 파라미터 지원 (선택적)
  - Gallery-scoped 이벤트 리스너 등록
  - AbortController 기반 정리 함수 반환

#### Twitter 스크롤 복원 정확도 개선 (Phase 307, Phase 304)

- **threshold 경계값 처리**: `difference >= threshold` 정확한 비교
  - 스크롤 변화가 threshold 값과 동일할 때도 복원
  - 스크롤 지터 방지 및 안정성 개선

### Fixed

- **media-url.filename-policy**: FilenameService 의존성 주입 문제 해결
- **events-phase305**: Gallery root에 제한된 이벤트 리스너 등록 구현
- **twitter-scroll-preservation**: 스크롤 복원 threshold 경계값 오류 수정

### Changed

- **src/shared/utils/events.ts**: `initializeGalleryEvents()` 함수 시그니처
  - 이전: `initializeGalleryEvents(handlers, options?)`
  - 현재: `initializeGalleryEvents(handlers, optionsOrRoot?)`
  - 하위 호환성 유지됨 (기존 옵션 객체 호출 가능)

- **src/shared/utils/twitter/scroll-preservation.ts**: threshold 비교 연산자
  - 이전: `if (difference > threshold)`
  - 현재: `if (difference >= threshold)`

### Quality

- **테스트 통과율**: 2809/2809 (100%) ✅
- **타입스크립트**: 0 에러
- **린트**: 0 경고
- **빌드 크기**: dev 934 KB, prod 376 KB (변화 없음)
- **코드 품질**: TypeScript strict mode, ESLint, Stylelint 0 issues

### Performance

- 개발 빌드: 934 KB (sourcemap 1.65 MB)
- 프로덕션 빌드: 376 KB (gzip ~89 KB, 변화 없음)

## [0.4.1] - 2025-10-27

### 🚀 빌드 성능 및 안정성 개선

이 릴리즈는 로컬 개발 환경의 메모리 안정성과 빌드 성능을 크게 개선합니다.

### Added

#### 병렬 빌드 검증 (Phase 203.1)

- npm-run-all 도입으로 멀티코어 CPU 활용
- 병렬화 스크립트 추가:
  - `validate:quality`: typecheck + lint + lint:css 병렬 실행
  - `validate:deps`: deps:check → deps:graph 순차 실행
  - `validate:tests`: test:browser + e2e:smoke 병렬 실행
  - `validate:build:local`: 통합 병렬 검증 (6GB 메모리)

### Changed

#### 빌드 성능 최적화

- 빌드 검증 시간: 49.5초 → 33.1초 (33.3% 향상, 16.4초 단축)
- 메모리 설정 일관성: 모든 test 스크립트 4096MB로 통일
- 스크립트 재구성:
  - `validate:build:local`: 병렬 실행이 기본
  - `validate:build:sequential`: 순차 실행 (레거시 호환)

#### 메모리 안정성 (Phase 203)

- OOM(Out of Memory) 에러 완전 제거
- validate:build:local 경량화 (codeql, deps:graph SVG, e2e:a11y 제외)
- test:browser 메모리 제한 추가 (4096MB)

#### 코드 정리 (Phase 202)

- Deprecated API 제거:
  - `service-harness.ts` 삭제
  - `createServiceHarness()`, `ServiceHarness` 제거
  - `createTestHarness()` 통합

### Performance

- 빌드 검증 시간: 33.1초 (Phase 203 대비 27% 추가 단축)
- 메모리 사용: 안정적 (28GB 여유 중 6GB 제한)
- CPU 활용: 멀티코어 병렬 처리 (22 threads)
- 빌드 크기: 340.54 KB / 345 KB (98.7% 사용, 4.46 KB 여유)

### System Requirements

- CPU: 멀티코어 권장 (병렬 처리 최적화)
- Memory: 8GB 이상 권장 (로컬 빌드 6GB 제한)
- Node.js: 22.20.0 (Volta 관리)

---

## [0.4.0] - 2025-10-18

### 🎉 프로젝트 안정화 마일스톤

이 릴리즈는 100+ Phase의 리팩토링 완료와 유지보수 모드 진입을 표시합니다.

### Changed

#### 인프라 개선

- Node.js 버전을 20에서 22로 업그레이드
- CI 매트릭스 조정 (Node 22/24 테스트)
- 빌드 검증 임계값 조정 (경고 기준: 332 KB)

#### 코드 품질 개선

- 타입 단언 31개 → 27개로 감소 (13% 개선)
  - Phase 100-102: 즉시 제거 7개, 검토 후 제거 2개
- 문서 간소화 (TDD_REFACTORING_PLAN.md 830줄 → 146줄, 82.4% 감소)
- accessibility-utils 모듈을 3개로 분해 (Phase 104)
- 큰 파일 재평가 및 아키텍처 경계 재확인

#### 문서화

- 개발 원칙 및 코드 품질 기준 추가
- Phase 완료 문서 지속적 업데이트
- 유지보수 모드 전환 문서화

### Fixed

- TypeScript strict 모드 0 errors 유지
- ESLint 0 warnings 유지
- CodeQL 5개 쿼리 모두 통과

### Performance

- 빌드 크기: 330.42 KB / 335 KB (98.6% 사용)
- 테스트 통과율: 99.1% (단위), 96.6% (E2E)
- 커버리지: 45% 기준선 설정

---

## [0.3.1] - 2025-06-11

### Changed

- Preact에서 Solid.js 1.9.9로 완전 마이그레이션
- 3계층 아키텍처 확립 (Features → Shared → External)
- Vendor getter 패턴 도입

### Added

- PC 전용 입력 이벤트 정책 수립
- 디자인 토큰 시스템 (OKLCH 색상 공간)
- TDD 기반 리팩토리링 워크플로

---

## [0.1.0] - 2025-06-11

### Added

- X.com 미디어 갤러리 뷰어
- 일괄 다운로드 기능
- 키보드 네비게이션 지원
- Preact 기반 UI

---

[0.4.0]: https://github.com/PiesP/xcom-enhanced-gallery/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/PiesP/xcom-enhanced-gallery/compare/v0.1.0...v0.3.1
[0.1.0]: https://github.com/PiesP/xcom-enhanced-gallery/releases/tag/v0.1.0
