# TDD 리팩토링 활성 계획

현재 상태: Phase 23 완료 ✅ | Phase 24 계획 수립 완료 📋

최종 업데이트: 2025-10-12

브랜치: master

---

## 📊 현재 상태

프로젝트 안정 상태 - 모든 품질 지표 GREEN

- ✅ 빌드: dev 730 KB, prod 330 KB (gzip: 89.91 KB)
- ✅ 테스트: 607/607 passing (24 skipped, 1 todo) ← **Phase 23: +4 tests**
- ✅ 의존성: 0 violations (264 modules, 727 dependencies)
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

### Phase 24: src/shared 파일명 규칙 통일 (kebab-case)

**우선순위**: MEDIUM

**목표**: PascalCase와 kebab-case가 혼재된 src/shared 디렉터리 파일명을
kebab-case로 통일하여 코드베이스 일관성 확보

**현재 문제**:

- PascalCase 파일 60개+ (BrowserService.ts, DOMCache.ts, ErrorHandler.ts 등)
- kebab-case 파일과 혼재 (media-url.util.ts, events.ts 등)
- 파일명 규칙 불일치로 인한 탐색 효율성 저하
- 새 파일 생성 시 규칙 불명확

**작업 계획**:

#### Phase 24-A: 작은 디렉터리 리네임 (20개 파일)

**브랜치**: `feature/phase24a-rename-small-dirs`

1. **RED 단계**:
   - `test/architecture/file-naming-convention.test.ts` 생성
   - src/shared의 모든 .ts 파일이 kebab-case인지 검증하는 테스트 (FAIL)
   - 특정 PascalCase 파일이 존재하지 않는지 검증하는 테스트 (FAIL)

2. **GREEN 단계**:
   - **대상 디렉터리**: browser/, container/, dom/, error/, external/, loader/,
     logging/, memory/
   - 파일명 변경 (예시):
     - `BrowserService.ts` → `browser-service.ts`
     - `DOMCache.ts` → `dom-cache.ts`
     - `ErrorHandler.ts` → `error-handler.ts`
     - `MemoryTracker.ts` → `memory-tracker.ts`
   - 모든 import 경로 업데이트 (grep + 일괄 replace)
   - 배럴 export(index.ts) 업데이트
   - 타입 체크 및 빌드 검증

3. **REFACTOR 단계**:
   - 중복 파일 제거 (예: BrowserUtils 중복)
   - import 경로 최적화 (불필요한 재수출 제거)
   - 린트 규칙 업데이트 (파일명 규칙 강제화 검토)

**평가 기준**:

- ✅ 대상 디렉터리의 모든 파일명이 kebab-case
- ✅ 모든 import 경로 정상 작동
- ✅ 모든 테스트 통과 (603/603)
- ✅ 타입 체크 및 린트 통과
- ✅ 빌드 크기 변화 없음

#### Phase 24-B: 중간 디렉터리 리네임 (25개 파일)

**브랜치**: `feature/phase24b-rename-medium-dirs`

1. **대상 디렉터리**: components/, hooks/, interfaces/, media/, state/, styles/,
   types/
2. 작업 절차는 Phase 24-A와 동일

#### Phase 24-C: 큰 디렉터리 리네임 (15개 파일)

**브랜치**: `feature/phase24c-rename-large-dirs`

1. **대상 디렉터리**: services/, utils/
2. 작업 절차는 Phase 24-A와 동일

**전체 평가 기준**:

- ✅ src/shared의 모든 .ts 파일이 kebab-case 준수
- ✅ 60개+ 파일 리네임 완료
- ✅ 100-150개 파일의 import 경로 업데이트 완료
- ✅ 모든 테스트 통과 (603/603)
- ✅ 의존성 그래프 검증 통과
- ✅ 파일명 규칙 문서 업데이트

**예상 효과**:

- 코드베이스 파일명 일관성 100% 달성
- 파일 탐색 효율성 향상 (일관된 명명 규칙)
- 새 파일 생성 시 명확한 규칙 제공
- IDE 자동완성 정확도 향상

**예상 영향 범위**:

- 변경 파일: 60+ 파일 리네임
- import 업데이트: 100-150개 파일 예상
- 테스트 검증: 전체 603개 테스트
- 예상 소요 시간: Phase당 2-3시간, 총 6-9시간

**Breaking Change**: Yes (내부 리팩토링, 외부 API는 변경 없음)

**선행 작업**:

- Phase 24-A 시작 전: 사용되지 않는 중복 파일 제거 완료
- 주요 의존성 매핑 문서화 완료

**후속 작업**:

- 새 파일 생성 시 kebab-case 규칙 강제화 (ESLint rule 검토)
- `docs/CODING_GUIDELINES.md`의 파일명 규칙 섹션 업데이트
- 프로젝트 README에 파일명 규칙 명시

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
