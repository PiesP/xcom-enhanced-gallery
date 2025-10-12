# TDD 리팩토링 활성 계획

현재 상태: Phase 24 시리즈 완료 ✅ | Phase 25 완료 ✅

최종 업데이트: 2025-01-15

브랜치: master (Phase 24-C 머지 완료)

---

## 📊 현재 상태

프로젝트 안정 상태 - 모든 품질 지표 GREEN

- ✅ 빌드: dev 728 KB, prod 329 KB (gzip: 89.49 KB)
- ✅ 테스트: 594/594 passing (24 skipped, 1 todo) ← **Phase 24-C: +2 tests**
- ✅ 의존성: 0 violations (264 modules, 725 dependencies)
- ✅ 타입: 0 errors (TypeScript strict)
- ✅ 린트: 0 warnings, 0 errors

---

## 📚 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-22 완료 내역 (상세)
- `docs/ARCHITECTURE.md`: 프로젝트 아키텍처
- `docs/CODING_GUIDELINES.md`: 코딩 규칙 및 품질 기준

---

## 🎯 최근 완료 작업

### Phase 24-C: shared 대형 디렉터리 파일명 kebab-case ✅ (2025-01-15)

**성과**:

- 37개 파일 리네임 (services/ 29개, utils/ 8개)
- 88개 파일의 import 경로 자동 업데이트
- Phase 24 시리즈 (A/B/C) 완료로 파일명 규칙 전체 통일
- 테스트 2개 추가 (594/594 passing, +2)
- 빌드 크기: 변화 없음 (성능 영향 없음)

**주요 변경**:

- **services/ 리네임 (29개)**:
  - Core: AnimationService, BaseServiceImpl, BulkDownloadService, EventManager,
    LanguageService, MediaService, ServiceManager, ThemeService,
    ToastController, UnifiedToastManager, iconRegistry → kebab-case
  - download/, input/, media/, media-extraction/, media-mapping/ 하위 파일 전체
    → kebab-case

- **utils/ 리네임 (8개)**:
  - dom/, media/, memory/, performance/ 하위 파일 및 root 레벨 파일 → kebab-case

- **자동화 스크립트**: `scripts/fix-imports.mjs` (Node.js 기반 import 경로 일괄
  업데이트, 88개 파일)

**기술적 도전**:

- Windows 파일시스템 이슈: 2단계 리네임 (temp file 경유)
- Import 경로 자동화: PowerShell → Node.js 전환 (성능 개선)
- 동적 import 수동 수정: service-factories, service-diagnostics, media-service
- 테스트 lint 패턴: "as any" 모킹 및 global 타입은 eslint-disable로 허용

**아키텍처 개선**:

- 파일명 규칙 전체 통일: src/shared 전체 디렉터리 kebab-case 준수
- Phase 24 시리즈 완료: 소형(9개), 중형(22개), 대형(37개) 총 68개 파일 리네임
- 유지보수성: 일관된 파일명 규칙으로 코드 탐색 및 자동화 개선

**테스트 커버리지**:

- 추가된 테스트 2개: Phase 24-C naming convention 테스트 (services/, utils/)
- 실행: Phase 24-A/B/C 테스트 전체 = 6/6 passing
- 결과: 594/594 passing (100%)

**상세 내역**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 24-C 참조

---

### Phase 24-B: shared 중형 디렉터리 파일명 kebab-case ✅ (2025-01-15)

**성과**:

- 22개 파일 리네임 (components, hooks, interfaces, media, state, styles, types)
- Regex 패턴 개선: 의미론적 suffix 패턴 허용 (`.types.ts`, `.interfaces.ts`)
- 테스트 2개 추가 (594/594 passing)
- 빌드 크기: 변화 없음

**상세 내역**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 24-B 참조

---

### Phase 24-A: shared 소형 디렉터리 파일명 kebab-case ✅ (2025-01-15)

**성과**:

- 9개 파일 리네임 (container, dom, external, logging, state 소형 디렉터리)
- 테스트 2개 추가 (594/594 passing)
- Phase 24 시리즈 시작점

**상세 내역**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 24-A 참조

---

### Phase 25: 휠 스크롤 속도 제어 제거 (브라우저 기본 동작 위임) ✅ (2025-10-12)

**성과**:

- wheelScrollMultiplier 설정 및 UI 완전 제거
- 브라우저/OS 네이티브 스크롤 속도 설정 준수
- 테스트 2개 제거, 1개 수정 (607/607 passing, -2 tests)
- 빌드 크기: dev 728 KB (-2 KB), prod 329 KB (-1 KB), gzip 89.49 KB (-0.42 KB)

**주요 변경**:

- 제거: `GallerySettings.wheelScrollMultiplier` (types/settings.types.ts)
- 제거: `DEFAULT_SETTINGS.gallery.wheelScrollMultiplier` (constants.ts)
- 제거: SettingsModal의 wheelScrollMultiplier 슬라이더 UI
- 제거: LanguageService의 wheelScrollSpeed 문자열 (한국어/영어/일본어)
- 수정: VerticalGalleryView 스크롤 계산에서 multiplier 제거
  (`delta * multiplier` → `delta`)
- 제거: test/unit/features/settings/gallery-wheel-scroll-setting.test.ts
- 제거: test/unit/features/settings/settings-wheel-scroll-ui.test.tsx
- 수정: VerticalGalleryView.wheel-scroll.test.tsx (기댓값 144 → 120)

**아키텍처 개선**:

- 사용자 경험: 브라우저/OS 네이티브 스크롤 속도 설정 준수 (일관성 향상)
- 설정 단순화: wheelScrollMultiplier 제거로 설정 항목 감소
- 유지보수성: 스크롤 관련 코드 단순화 (multiplier 계산 제거)

**성능 영향**:

- 빌드 크기 감소: dev -2 KB, prod -1 KB, gzip -0.42 KB
- 런타임 오버헤드 제거: multiplier 계산 및 설정 로드 제거
- 코드 복잡도 감소: SettingsModal UI 및 관련 로직 제거

**테스트 커버리지**:

- 제거된 테스트 2개: wheelScrollMultiplier 관련 설정/UI 테스트
- 수정된 테스트 1개: wheel scroll 통합 테스트 (기댓값 업데이트)
- 실행: unit + fast 프로젝트 = 607/607 passing
- 결과: 100% passing (wheelScrollMultiplier 관련 테스트 제거로 -2)

**상세 내역**: 이 문서 Phase 25 참조

---

### Phase 23: DOMCache 연동 로직 아키텍처 개선 ✅ (2025-10-12)

**성과**:

- bootstrap/features.ts: 67줄 → 48줄 (19줄 감소, 28% 축소)
- DOMCache TTL 설정 구독 로직 18줄 제거 (Bootstrap → Shared 이동)
- 아키텍처 경계 명확화: Bootstrap은 등록만, Shared는 자체 초기화
- 새 테스트 4개 추가 (607/607 passing, +4)
- 빌드 크기 변화 없음 (성능 영향 없음)

**주요 변경**:

- 추가: `DOMCache.initializeDOMCache()` 메서드 구현 (SettingsService 주입)
- 기능: DOMCache가 자체적으로 performance.cacheTTL 설정 변경 구독
- 제거: Bootstrap 레이어의 DOMCache TTL 설정 구독 로직 (18줄)
- 제거: NestedSettingKey import (불필요)
- 개선: DOMCache 초기화 로직 한 곳으로 집중 (응집도 향상)

**아키텍처 개선**:

- Bootstrap 레이어: Features 등록만 담당 (순수성 유지)
- Shared 레이어: 자율적 설정 구독 관리 (자율성 향상)
- 계층 경계: Features → Shared 의존성만 유지 (경계 준수)

**테스트 커버리지**:

- 새 테스트 4개: DOMCache 자체 구독, 초기화 시그니처, 자동 TTL 업데이트,
  Bootstrap 경계 검증
- 실행: unit + fast 프로젝트 = 8회 실행 (각 4개 테스트)
- 결과: 8/8 passing (100%)

**상세 내역**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 23 참조

---

### Phase 22: src/constants.ts 리팩토링 ✅ (2025-10-12)

**성과**:

- constants.ts: 476줄 → 301줄 (175줄 감소, 37% 축소)
- 유틸리티 함수 8개 → 0개 (100% 제거)
- 단일 책임 원칙 준수 (constants는 상수만)
- 모든 테스트 통과 (603/603)

**주요 변경**:

- 함수 재배치: extractMediaId, generateOriginalUrl → media-url.util.ts
- 함수 재배치: isValidViewMode → core-types.ts
- 함수 재배치: isTwitterNativeGalleryElement → events.ts (내부)
- 중복 제거: isVideoControlElement (utils.ts만 사용)

**상세 내역**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` Phase 22 참조

---

## 🚀 활성 작업

### Phase 26: 파일명 규칙 체계화 및 강제 🔄

**우선순위**: HIGH

**목표**: Phase 24 시리즈 완료 후, 파일명 규칙을 문서화하고 자동 검증 체계를
구축하여 일관성 유지

**배경**:

- Phase 24-A/B/C 완료로 68개 파일이 kebab-case로 통일됨
- 파일명 규칙이 테스트로 검증되지만 문서화되지 않음
- 개발자 온보딩 시 명확한 가이드 필요

**작업 계획**:

#### 1. 문서화 (CODING_GUIDELINES.md) ✅

- ✅ "파일 네이밍" 섹션 대폭 확장
- ✅ kebab-case 규칙 및 예시 추가
- ✅ Semantic suffix 패턴 설명 (`.types.ts`, `.test.ts` 등)
- ✅ Phase 24 테스트 참조 및 검증 범위 명시
- ✅ Regex 패턴 문서화

#### 2. 자동 검증 체계 강화

**현재 상태**:

- ✅ Phase 24-A/B/C 테스트가 이미 존재하여 파일명 검증
- ✅ CI workflow가 전체 테스트를 자동 실행
- ✅ Pre-push hook이 테스트를 실행하여 로컬에서도 차단

**추가 개선**:

- ✅ `npm run test:naming` 스크립트 추가 (Phase 24 테스트만 실행)
- 🔲 CI workflow에 파일명 검증 단계 명시적 추가 (선택사항)
- 🔲 Pre-commit hook에 빠른 파일명 검증 추가 (선택사항)

#### 3. ESLint 규칙 검토 (보류)

**결정**: ESLint 규칙 도입 보류

**이유**:

- Vitest 테스트가 더 강력하고 유연함 (regex 패턴, semantic suffix 지원)
- ESLint 플러그인(eslint-plugin-unicorn 등)은 설정 복잡도 증가
- 기존 Phase 24 테스트 인프라가 충분히 효과적
- 유지보수 부담 최소화

**평가 기준**:

- ✅ CODING_GUIDELINES.md 파일명 섹션 완성도
- ✅ Phase 24-A/B/C 테스트 실행 편의성 (`npm run test:naming`)
- ✅ 개발자가 규칙을 쉽게 이해하고 준수할 수 있는 문서화
- ✅ 빌드/테스트/린트 통과

**브랜치**: `feature/phase26-file-naming-enforcement`

**테스트**:

```powershell
# 파일명 규칙 테스트만 실행
npm run test:naming

# 또는 개별 실행
npx vitest run test/phase-24a-file-naming-convention.test.ts
npx vitest run test/phase-24b-file-naming-convention.test.ts
npx vitest run test/phase-24c-file-naming-convention.test.ts
```

**다음 단계**:

1. 빌드 및 테스트 검증
2. 문서 검토 및 개선
3. Phase 26 완료 후 TDD_REFACTORING_PLAN_COMPLETED.md로 이관

---

## 📋 대기 작업

### Phase 24: src/shared 파일명 규칙 통일 (kebab-case)

**우선순위**: MEDIUM

**목표**: PascalCase와 kebab-case가 혼재된 src/shared 디렉터리 파일명을
kebab-case로 통일하여 코드베이스 일관성 확보

**진행 상태**:

- ✅ Phase 24-A: 소형 디렉터리 리네임 완료 (browser, container, dom, error,
  external, loader, logging, memory) —
  `test/phase-24a-file-naming-convention.test.ts` GREEN
- ✅ Phase 24-B: 중형 디렉터리 리네임 완료 (components, hooks, interfaces,
  media, state, styles, types) — 22개 파일 리네임,
  `test/phase-24b-file-naming-convention.test.ts` GREEN
- 🔲 Phase 24-C: 대형 디렉터리 리네임 예정 (services, utils)

#### Phase 24-C 다음 작업

1. **RED 단계**
   - `test/phase-24c-file-naming-convention.test.ts` 추가
   - services/, utils/ 디렉터리의 PascalCase .ts/.tsx 파일 존재 시 FAIL
2. **GREEN 단계**
   - 각 디렉터리 파일을 kebab-case로 리네임
   - 배럴 export 및 import 경로 업데이트 (고참조 모듈 주의)
   - 모든 Phase 24 테스트 GREEN 유지
3. **REFACTOR 단계**
   - Swizzled imports 영향 검증
   - ESLint naming rule 도입 및 `docs/CODING_GUIDELINES.md` 업데이트

#### 평가 기준

- ✅ services/, utils/ 디렉터리 파일명 kebab-case
- ✅ Phase 24-A/B/C 테스트 통과 + 전체 스위트 GREEN
- ✅ 타입/린트/빌드/의존성 검사 통과
- ✅ 파일명 규칙 문서 업데이트 및 ESLint 규칙 적용

#### 준비 사항

- 브랜치: `feature/phase24c-rename-large-dirs`
- 테스트: `npx vitest run test/phase-24*-file-naming-convention.test.ts`

#### Phase 24 시리즈 완료 후

- 모든 Phase 24 (A/B/C) 완료 시 `docs/CODING_GUIDELINES.md` 파일명 섹션 종합
  업데이트
- ESLint 규칙 적용 및 CI에 통합
- Phase 24-C 미리보기 섹션 제거

---

### Phase 24-C 미리보기

- 대상: services/, utils/
- 전략: Phase 24-B와 동일한 TDD 흐름, 고참조 모듈은 swizzled imports 영향 검증
  필요
- 완료 후 `docs/CODING_GUIDELINES.md` 파일명 섹션 업데이트 및 ESLint 규칙 적용
  검토

---

## 📝 향후 추가 개선 제안 (OPTIONAL)

현재 즉각적인 리팩토링 필요 없음. Phase 23, 24 완료 후 검토 가능.

### 추가 성능 최적화

- 추가적인 반응성 최적화 기회 탐색
- 코드 간결성 개선 기회 탐색
- 번들 크기 최적화 검토

---

## 🔄 개발 프로세스 가이드

새로운 Phase 작업 시:

1. **계획**: 이 문서에 Phase 추가
2. **브랜치**: `feature/phase<N>-<description>` 생성
3. **TDD**: RED → GREEN → REFACTOR
4. **검증**: `npm run validate && npm run build`
5. **병합**: master로 병합
6. **문서화**: 완료 내역을 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관

---

## 📋 Phase 작성 템플릿

새로운 Phase를 추가할 때 다음 템플릿을 사용하세요:

```markdown
### Phase <N>: <Title>

**우선순위**: HIGH/MEDIUM/LOW/OPTIONAL

**목표**: <목표 설명>

**작업 계획**:

1. RED 단계:
   - <실패 테스트 작성>

2. GREEN 단계:
   - <최소 구현>

3. REFACTOR 단계:
   - <리팩토링>

**평가 기준**:

- <성공 기준>
- <성능 영향>
- <테스트 통과>

**예상 효과**:

- <예상 효과>
```

---

**프로젝트 상태**: Phase 23 완료 ✅ | Phase 24 계획 수립 완료 📋 | 다음 단계:
Phase 24 시작 가능
