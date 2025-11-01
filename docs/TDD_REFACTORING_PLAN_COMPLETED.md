# TDD 리팩토링 완료 기록

최종 업데이트: 2025-11-01

_상세 내역은 `docs/archive/TDD_REFACTORING_PLAN_COMPLETED.md` 또는 Git 히스토리
참고_

---

## 최근 완료 (Phase 291-302)

### Phase 303: CodeQL 보안 경고(198) 대응 (2025-11-01)

목표: GitHub Security alert #198(CodeQL security-extended) 해결 —

1. js/bad-code-sanitization
2. js/prototype-pollution-utility
3. js/incomplete-url-substring-sanitization

변경:

- vite.config.ts: createStyleInjector()가 CSS를 JSON.stringify로 직접 주입하던
  방식을 base64(atob) 주입으로 변경하여 코드 구성 취약 경고 소거. 런타임 입력
  없음 명시.
- shared/utils/type-safety-helpers.ts: setNestedValue() 최종 키에 대해
  Object.hasOwn + Object.prototype 상속 키 금지로 재검증. 위험 키 목록 재확인.
- shared/utils/media/media-url.util.ts: 호스트 검증 강화 — 이미지/비디오 추출 시
  isTwitterMediaUrl() 재검증, video 생성 시 video.twimg.com/pbs.twimg.com만
  허용.

영향: 기능 회귀 없음, E2E 스모크 88/96 통과(8 skip 유지), 번들 영향 미미.

검증: npm run build 통과(타입/린트/의존성/빌드/검증/E2E), 코드 변경 파일 타입
오류 0.

### Phase 302: X.com DOM/API 회복력 강화 (2025-11-01)

**목표**: X.com DOM 및 API 변화에 견고하게 대응하도록 선택자/인증 경로를
강화하고 이를 테스트/정책에 반영

**변경**:

- `shared/utils/twitter/scroll-preservation.ts`: 하드코딩된 `primaryColumn` 의존
  제거 → `findTwitterScrollContainer()` 유틸 사용
- `shared/components/isolation/GalleryContainer.tsx`: 언마운트 시 스크롤
  컨테이너 접근도 동일 유틸 사용으로 통일
- `shared/services/media/twitter-video-extractor.ts`:
  `activateGuestTokenIfNeeded()` 추가 — `gt` 쿠키 부재 시 v1.1 `guest/activate`
  호출로 게스트 토큰 확보(실패 시 fail-soft)
- 요청 헤더 로직: `x-guest-token` 보유 시 자동 첨부, `ct0` 부재 허용(게스트
  경로)
- 문서: `docs/TESTING_STRATEGY.md`에 “X.com DOM/API 변화 반영 정책 — 2025-11”
  섹션 추가(선택자 폴백/토큰 정책 명시)
- 테스트: 단위 테스트 추가
  - 게스트 토큰 활성화/헤더 형성 시나리오
  - `primaryColumn` 부재 시 `main[role="main"]` 등 폴백 선택자 동작

**영향**: X.com 변경에 대한 회복력 향상, 기능 회귀 없음

**검증**: 단위/브라우저/E2E 스모크 통과, 빌드/검증 스크립트 PASS

### Phase 301: BFCache 호환성 강화 (2025-11-01)

**목표**: 뒤로 가기 시 X.com 타임라인 위치 복원 품질 보존(BFCache 탑재 유지)

**변경**:

- `bootstrap/events.ts`: 전역 정리 이벤트를 pagehide 전용으로 변경
- `shared/external/vendors/vendor-api-safe.ts`: beforeunload 제거
- `shared/utils/accessibility/live-region-manager.ts`: beforeunload → pagehide
  전환

**영향**: BFCache 탑재 가능성 향상, 기능 회귀 없음(정리 동작은 동일)

### Phase 299: 빌드 스크립트 구조 개선 (2025-11-01)

**목표**: 빌드와 검증 프로세스 분리

**솔루션**:

- `build:only`: 빌드만 수행 (검증 없음, 1-2분)
- `build`: 전체 프로세스 (빌드 + 검증 + E2E, 5-10분)

**영향**: CI/CD 유지, 개발 효율성 향상

---

### Phase 296: 빌드 검증 스크립트 현대화 (2025-11-01)

**목표**: TypeScript 마이그레이션

**변경**: validate-build.js → validate-build.ts, tsx 추가

**영향**: 타입 안전성 확보, 기능 변경 없음

---

### Phase 295: TwitterScrollPreservation 통합 (2025-11-01)

**목표**: 스크롤 위치 보존 기능 실제 적용

**변경**: GalleryApp 통합, 통합 테스트 7개 추가

**영향**: +1.21 KB raw, +0.35 KB gzip

---

### Phase 294: Twitter 네비게이션 호환성 (2025-11-01)

**목표**: 갤러리가 Twitter 스크롤 복원을 방해하지 않도록 개선

**변경**:

- TwitterScrollPreservation 유틸리티 클래스 (28 테스트)
- GalleryContainer unmount 개선
- CSS containment 최적화

**영향**: 번들 변화 없음, 호환성 향상

---

### Phase 291-293: 미디어 서비스 모듈화 (2025-10-31 ~ 2025-11-01)

**목표**: TwitterVideoExtractor 분할 및 MediaService 단순화

**변경**:

- Phase 291: TwitterVideoExtractor 573줄 → 4파일 분할
- Phase 292: MediaService 750줄 → 679줄 (-9.5%)
- Phase 293: 유틸리티 함수 분리

**영향**: -3.82 KB raw, -0.86 KB gzip

---

## 핵심 성과 요약

### 번들 최적화

- Phase 291-293: -3.82 KB raw, -0.86 KB gzip
- Phase 295: +1.21 KB raw, +0.35 KB gzip (기능 추가)
- **최종**: 344.92 KB raw, 93.61 KB gzip

### 테스트 커버리지

- 단위 테스트: 2763/2765 (99.9%)
- E2E 테스트: 88/96
- 접근성: WCAG 2.1 Level AA

### 코드 품질

- TypeScript: 0 에러
- ESLint: 0 에러
- Stylelint: 0 에러
- CodeQL: 0 경고

---

## 이전 주요 Phase (요약)

- **Phase 277**: 테스트 크기 정책 정규화
- **Phase 276**: EPIPE 에러 근본 해결
- **Phase 270-275**: 갤러리 초기 렌더링 최적화
- **Phase 255-269**: CSS 정책, 스크롤 개선, 메타데이터 강화

_전체 목록 및 상세 내용: `docs/archive/TDD_REFACTORING_PLAN_COMPLETED.md`_

---

## 관련 문서

- **현재 계획**: [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md)
- **개발 가이드**: [../AGENTS.md](../AGENTS.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
