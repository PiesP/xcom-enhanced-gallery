# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-27 | **상태**: Phase 222 완료 ✅ |
**[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## 🔄 현재 진행 중인 작업

### Phase 223: Browser Module 통합 및 현대화 (진행 중 🚀)

**목표**: `src/shared/browser/` 경로 파일들의 중복 제거, 구조 최적화, 현대적
패턴 적용

**배경**:

- Phase 222 (Settings 현대화) 완료 후 browser 모듈 구조 재점검
- Browser 기능이 두 개 파일에 중복 구현 (browser-service.ts vs browser-utils.ts)
- 각 서비스의 책임이 혼재: DOM 관리, CSS 주입, 다운로드, 상태 조회
- browserAPI와 browserUtils 두 개의 공개 인터페이스로 사용자 혼동
- 불필요한 export 정리 필요 (utils/browser-utils.ts는 재내보내기만 수행)

**현황 분석**:

**Source 파일 (3개)**:

| 파일                                        | 줄수 | 역할                          | 상태       |
| ------------------------------------------- | ---- | ----------------------------- | ---------- |
| `src/shared/browser/browser-service.ts`     | 143  | CSS 관리, 다운로드, 진단      | **중복**   |
| `src/shared/browser/browser-utils.ts`       | 137  | CSS 관리, 다운로드, 상태 확인 | **중복**   |
| `src/shared/browser/utils/browser-utils.ts` | 11   | 재내보내기 only               | **불필요** |

**주요 문제**:

1. **기능 중복**:
   - `injectCSS(id, css)`: 양쪽 모두 존재 (구현 유사)
   - `removeCSS(id)`: 양쪽 모두 존재 (구현 유사하나 상세도 다름)
   - `downloadFile(url, filename)`: 양쪽 모두 (deprecated 표시 있음)
   - `isPageVisible()`, `isDOMReady()`: 양쪽 모두 (일부 차이)

2. **공개 인터페이스 혼재**:
   - `BrowserService` 클래스 + `browserAPI` object (browser-service.ts)
   - `BrowserUtils` 클래스 + `browserUtils` object (browser-utils.ts)
   - 사용자가 어느 것을 선택해야 할지 불명확

3. **export 정리 미흡**:
   - `index.ts`는 BrowserService와 browserAPI만 export
   - browser-utils.ts 파일 자체는 export되지 않음 (isolated)
   - utils/ 폴더의 재내보내기 파일은 진정한 utility가 아님

4. **아키텍처 개선 기회**:
   - browser-utils.ts의 검증 로직 추가 (empty CSS 체크 등)
   - browser-service.ts의 진단 개선 가능성
   - 단일 책임 원칙 명확화

**대상 파일 (소스 3개 + 테스트 2개)**:

**Source 파일**:

1. `src/shared/browser/browser-service.ts` (143줄) - 메인 DOM/CSS 서비스
2. `src/shared/browser/browser-utils.ts` (137줄) - 중복 구현
3. `src/shared/browser/utils/browser-utils.ts` (11줄) - 재내보내기 (불필요)

**Test 파일**:

1. `test/unit/shared/browser-utils-coverage.test.ts` - getBrowserInfo, 브라우저
   감지
2. `test/integration/infrastructure/browser-utils.test.ts` - 통합 테스트

**기술 전략**:

- **통합**: browser-utils.ts의 유효한 기능(empty CSS 체크 등)을
  browser-service.ts로 흡수
- **제거**: browser-utils.ts 파일 삭제 (browser-service.ts로 완전 대체)
- **정리**: utils/browser-utils.ts는 더 이상 불필요 (재내보내기 역할 없음)
- **단순화**: browserAPI만 public 인터페이스로 유지 (BrowserService 클래스는
  internal)
- **테스트**: 기존 테스트 유지/통합, 모든 기능 GREEN 보증
- **TDD 준수**: RED → GREEN → REFACTOR 사이클

**수용 기준** (모두 만족해야 함):

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings
- ✅ test:smoke: 9/9 PASS
- ✅ test:unit (browser): 모든 테스트 PASS
- ✅ build: dev + prod 성공, 번들 크기 동일/감소
- ✅ browserAPI: 기존 동작 유지
- ✅ CSS 주입: DOM에 정확하게 적용 확인
- ✅ 다운로드: 기본 구현 동작 확인

**진행 계획**:

1. **분석** (현재): browser-service vs browser-utils 기능 비교 ✅
   - 구현 상세도 비교
   - 공개 메서드 시그니처 정렬
   - 테스트 범위 확인

2. **통합**: 두 구현을 단일 서비스로 수렴
   - browser-utils.ts의 검증 로직 추가 (empty CSS 체크)
   - 공개 메서드 시그니처 통일
   - 진단 메서드 개선

3. **테스트**: 기존 테스트 통합 및 확장
   - browser-utils coverage test 유지
   - browser-utils integration test 유지
   - 새로운 통합 테스트 작성 (선택)

4. **정리**: 불필요한 파일 제거
   - browser-utils.ts 파일 삭제
   - utils/browser-utils.ts 제거 (재내보내기 불필요)
   - export 정리 (index.ts 유지)

5. **검증**: 품질 보증
   - npm run validate
   - npm run build
   - 번들 크기 확인

**예상 변경**:

- 신규 파일: 0개 (통합 작업)
- 수정 파일: 2개 (browser-service.ts, index.ts 또는 정리)
- 삭제 파일: 2개 (browser-utils.ts, utils/browser-utils.ts)
- 총 diff: 최소화 예상 (-50 ~ -100 줄)
- 번들 크기: 감소 또는 동일 예상

---

## ✅ 최근 완료 작업

### Phase 222: Settings 타입/서비스 현대화 및 JSDoc 강화 (완료 ✅)

**목표**: `src/features/settings/` 경로 파일들의 문서화 개선 및 구조 정리

**배경**:

- Phase 221 (Storage 통합) 완료 후 settings 모듈 정리 필요
- JSDoc 문서화 부족으로 코드 이해도 저하
- 파일별 책임 명확화 필요 (타입 vs 서비스 vs 유틸)
- 테스트 파일들의 import 경로 불일치 (Phase 221 변경사항 반영 필요)

**대상 파일 (11개)**:

**Source 파일 (6개)**:

1. `src/features/settings/types/settings.types.ts` (141줄) - 타입 정의
2. `src/features/settings/services/settings-service.ts` (525줄) - 메인 서비스
3. `src/features/settings/services/settings-migration.ts` (68줄) - 마이그레이션
   로직
4. `src/features/settings/services/settings-schema.ts` (41줄) - 스키마 해시
5. `src/features/settings/services/index.ts` (12줄) - 배럴 export
6. `src/features/settings/index.ts` (62줄) - Feature 진입점

**Test 파일 (5개)**:

1. `test/__mocks__/in-memory-storage-adapter.ts` - StorageAdapter 임포트 경로
   수정
2. `test/unit/features/settings/settings-migration.behavior.test.ts` -
   DEFAULT_SETTINGS 임포트 수정
3. `test/unit/features/settings/settings-migration.schema-hash.test.ts` -
   DEFAULT_SETTINGS 임포트 수정
4. `test/unit/features/settings/services/twitter-token-extractor.test.ts` - 경로
   수정
5. `test/unit/shared/services/storage/userscript-storage-adapter.test.ts` - 경로
   수정

**발견된 사항**:

1. **문서화 부족**: 각 파일의 책임이 명확하지 않음
   - settings-service: 5가지 핵심 기능 (저장/로드/검증/이벤트/마이그레이션)
   - settings-migration: 순수 함수, 버전 관리 기반 처리
   - settings-schema: 해시 계산 및 스키마 드리프트 감지

2. **테스트 파일 불일치** (Phase 221 후속):
   - StorageAdapter import: `features/settings/services/storage` →
     `@shared/services/storage`
   - DEFAULT_SETTINGS: `features/settings/types` → `@/constants`
   - TwitterTokenExtractor: `features/settings/services` →
     `@shared/services/token-extraction`

3. **구조 확인**:
   - settings.types.ts: 순수 타입만 (DEFAULT_SETTINGS 없음) ✅
   - constants.ts에 DEFAULT_SETTINGS 정의 ✅
   - services/index.ts: SettingsService만 export (다른 의존성은 shared에서) ✅

**기술 전략**:

- **JSDoc 강화**: 각 파일에 버전, 책임, 기능, 사용 예시 추가
- **테스트 수정**: Phase 221 변경사항 반영 (import 경로 통일)
- **최소 변경**: 기능 변경 없음, 문서화 및 import만 수정
- **TDD 준수**: 기존 모든 테스트 GREEN 유지

**수용 기준** (모두 만족해야 함):

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings
- ✅ test:smoke: 9/9 PASS
- ✅ test:unit (settings): 모든 테스트 PASS
- ✅ build: dev + prod 성공
- ✅ 번들 크기: ≤420 KB (변경 없음 예상)

**완료 사항**:

1. **JSDoc 강화** ✅
   - `settings.types.ts`: 버전 + 타입 참고사항 추가 (+7줄)
   - `settings-service.ts`: 핵심 기능 5가지 + 사용 예시 명시 (+20줄)
   - `settings-migration.ts`: 처리 흐름 + 순수 함수 설명 (+13줄)
   - `settings-schema.ts`: 해시 계산 방식 + 용도 설명 (+9줄)
   - `index.ts`: 구조 + 사용 예시 재정리 (+12줄)
   - `services/index.ts`: 책임 명확화 + 마이그레이션 히스토리 (+8줄)

2. **테스트 import 경로 수정** ✅
   - `in-memory-storage-adapter.ts`: StorageAdapter → `@shared/services/storage`
   - `settings-migration.behavior.test.ts`: DEFAULT_SETTINGS → `@/constants`
   - `settings-migration.schema-hash.test.ts`: DEFAULT_SETTINGS → `@/constants`
   - `twitter-token-extractor.test.ts`:
     `@shared/services/token-extraction/twitter-token-extractor`
   - `userscript-storage-adapter.test.ts`: `@shared/services/storage`

3. **구조 검증** ✅
   - Phase 221 변경사항 완전히 반영
   - 모든 import 경로 통일 (@shared, @features, @/constants)
   - 테스트 실행 확인: settings 테스트 14/14 PASS

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings (settings 영역)
- ✅ build: success (339.62 KB raw, 91.10 KB gzip)
- ✅ test:smoke: 9/9 PASS
- ✅ test:unit (settings): 14/14 PASS
- ✅ import 경로: @shared, @features, @/constants 통일

**기술 개선**:

- 문서화 강화: 각 파일의 책임과 사용 패턴 명확화
- 테스트 안정성: Phase 221 변경사항 완전 반영
- 구조 일관성: settings 모듈 내 책임 분리 재확인
- 유지보수성: JSDoc 추가로 코드 이해도 향상

**총 변경**: 11 파일 수정, +69 줄, -29 줄 = +40 줄 (JSDoc 강화)

**커밋**: `ddbcd89d` - refactor(settings): Phase 222 - Settings 현대화 및 JSDoc
강화

---

### Phase 221: Storage 파일 통합 및 경로 최적화 (완료 ✅)

**목표**: `src/features/settings/services/storage` 및
`src/shared/services/storage` 중복 제거, 계층 구조 최적화

**배경**:

- Phase 220 완료 후 설정 서비스 구조 점검
- Storage 어댑터 파일이 두 위치에 중복 존재 (`features/` vs `shared/`)
- 아키텍처 위반: shared가 features와 무관해야 하는데 import 경로 혼재
- 계층 구조 명확화 필요 (Features ⊥ Shared ← External)

**대상 파일 (2개 위치)**:

1. **src/features/settings/services/storage/** (제거 대상)
   - storage-adapter.interface.ts (51줄)
   - userscript-storage-adapter.ts (77줄)

2. **src/shared/services/storage/** (통합 대상)
   - storage-adapter.interface.ts (51줄)
   - userscript-storage-adapter.ts (77줄)
   - index.ts (신규 생성)

3. **Import 경로 수정 대상**:
   - `src/features/settings/services/settings-service.ts`: `./storage/` →
     `@shared/services/storage`
   - `src/shared/services/theme-service.ts`: 이미 올바른 경로 사용
   - `src/shared/services/language-service.ts`: 이미 올바른 경로 사용
   - `src/features/settings/services/index.ts`: storage export 제거

**발견된 사항**:

1. **중복 파일**: 양쪽 디렉터리에 동일한 파일 2개 존재
   - 내용이 동일하므로 shared에 통합 가능
   - features 버전은 과거 패턴 (현재 참조 안 됨)

2. **Import 혼재**:
   - theme-service.ts: `@shared/services/storage` (올바름)
   - language-service.ts: `@shared/services/storage` (올바름)
   - settings-service.ts: `./storage/` (잘못됨) → 수정 필요

3. **Export 정리**:
   - features/settings/services/index.ts에서 불필요한 storage export 존재
   - shared/services/index.ts에 storage export 추가 필요

4. **StorageAdapter 이름**:
   - 현재 명칭 충분히 명확 (Adapter 패턴 준수)
   - 인터페이스: 추상화 계층
   - 구현: UserscriptStorageAdapter (GM\_\* API)
   - 향후 LocalStorageAdapter 추가 가능성은 있으나 현재 불필요

**기술 전략**:

- **TDD 준수**: 기존 모든 테스트 GREEN 유지
- **최소 변경**: 동작 변경 없음, 경로 통합만 수행
- **아키텍처 준수**: shared가 features 독립적 유지
- **Barrel export 활용**: storage/index.ts 신규 생성

**수용 기준** (모두 만족해야 함):

- ✅ typecheck: 0 errors (`npm run typecheck`)
- ✅ lint: 0 errors/warnings (`npm run lint`)
- ✅ build: success (dev + prod)
- ✅ test:smoke: 통과
- ✅ storage export: @shared/services/storage 정상 작동
- ✅ settings-service 동작: 저장/로드 정상
- ✅ theme-service 동작: 테마 관리 정상
- ✅ language-service 동작: 다국어 관리 정상

**완료 사항**:

1. **Storage 파일 통합** ✅
   - `src/shared/services/storage/storage-adapter.interface.ts` (51줄) 유지
   - `src/shared/services/storage/userscript-storage-adapter.ts` (77줄) 유지
   - `src/shared/services/storage/index.ts` (신규 7줄 생성)

2. **Import 경로 수정** ✅
   - `settings-service.ts`: `./storage/` → `@shared/services/storage` (2
     imports)
   - `features/settings/services/index.ts`: storage export 3개 제거

3. **Export 통합** ✅
   - `shared/services/storage/index.ts` 생성: StorageAdapter,
     UserscriptStorageAdapter export
   - `shared/services/index.ts` 업데이트:
     `export { type StorageAdapter, UserscriptStorageAdapter } from './storage'`

4. **구조 정리** ✅
   - `src/features/settings/services/storage/` 디렉터리 완전 삭제
   - 중복 제거로 코드베이스 간결화 (2개 파일 제거)

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings (validate 성공)
- ✅ build:dev: success (2.78s)
- ✅ build:prod: success
- ✅ test:smoke: 9/9 PASS
- ✅ import 경로: 정상 (@shared/services/storage)
- ✅ 계층 구조: shared ⊥ features 준수

**기술 개선**:

- 아키텍처 명확화: shared가 features와 독립적
- 코드 중복 제거: 2개 동일 파일 제거로 유지보수성 개선
- Barrel export 표준화: storage/index.ts로 진입점 통일
- 의존성 일관성: 모든 서비스가 동일 경로에서 import

**총 변경**: 4 파일 수정, 1 디렉터리 삭제 (storage/ 통합)

---

### Phase 220: Gallery App & Renderer 점검 및 최적화 (완료 ✅)

### Phase 220: Gallery App & Renderer 점검 및 최적화 (완료 ✅)

**목표**: `src/features/gallery/GalleryApp.ts`, `GalleryRenderer.ts`, `types.ts`
및 하위 경로 점검·통합·최적화

**배경**:

- Phase 219 Types 정리 완료 후 갤러리 메인 컴포넌트 및 구조 점검 필요
- GalleryApp과 GalleryRenderer의 역할 명확성 재확인
- types.ts와 types/ 디렉터리의 실질적 용도 평가
- 코드 간결화 및 경로 최적화 검토

**대상 파일 (5,996줄 총합)**:

1. **GalleryApp.ts** (264줄): 갤러리 조율기
   - 책임: 초기화, 이벤트 연결, 생명주기 관리
   - 상태: ✅ 역할 명확, 구조 양호
   - 검토 항목: JSDoc 강화, 로깅 레벨 검토, 에러 처리 표준화

2. **GalleryRenderer.ts** (237줄): DOM 렌더링 및 생명주기
   - 책임: Solid.js 컴포넌트 렌더링, signal 구독, 컨테이너 관리
   - 상태: ✅ 구조 명확, 신호 기반 반응형 아키텍처
   - 검토 항목: 에러 처리 표준화, 정리(cleanup) 로직 강화

3. **components/** (822줄): 갤러리 UI 컴포넌트
   - VerticalGalleryView (535줄): 메인 갤러리 뷰
   - VerticalImageItem (443줄): 이미지 항목
   - KeyboardHelpOverlay (185줄): 키보드 도움말
   - hooks/ (42줄 useGalleryKeyboard): 키보드 이벤트
   - 상태: ✅ 역할 분명, PC-only 이벤트 준수
   - 검토 항목: JSDoc 강화, 로깅 최적화

4. **hooks/** (1,227줄): 갤러리 커스텀 훅
   - useGalleryScroll (242줄): 휠 이벤트 기반 스크롤
   - useGalleryItemScroll (436줄): 아이템 스크롤 조율
   - useGalleryFocusTracker (539줄): 포커스 추적
   - 상태: ⚠️ 복잡한 상태 관리, 주석 영어/한글 혼용
   - 검토 항목: JSDoc 강화, import 경로 정규화, 로깅 최적화

5. **services/** (228줄): 갤러리 서비스
   - theme-initialization.ts (228줄): 테마 초기화
   - 상태: ✅ 구조 명확, Phase 217 최적화 완료
   - 검토 항목: 유지

6. **styles/** (1,421줄): 갤러리 스타일
   - gallery-global.css (538줄): Phase 218 최적화 완료 ✅
   - Gallery.module.css (883줄): TEST TARGET (미사용, 유지)
   - 상태: ✅ 모든 토큰 사용, CSS Logical Properties 준수
   - 검토 항목: 유지

7. **types/** (53줄): 타입 정의 및 backward compatibility
   - types.ts (12줄): 공개 표면 최소화 (현재 export 없음)
   - types/index.ts (20줄): backward compatibility 계층
   - types/toolbar.types.ts (21줄): Phase 219 정리 완료
   - 상태: ✅ Phase 219 정리 완료, backward compatibility 유지
   - 검토 항목: 유지

**발견된 사항**:

1. **구조 명확성**: GalleryApp(조율) ↔ GalleryRenderer(렌더링) 역할 분리 명확
   ✅
2. **types 계층**: backward compatibility 계층 필요성 재확인 (외부 의존성
   가능성) ✅
3. **Gallery.module.css**: TEST TARGET 상태 유지 (스타일 테스트 대상)
4. **hooks 최적화**: 주석 통일(한글), import 경로 정규화 필요
5. **components 분산**: 논리적 응집도 양호, 불필요한 마이그레이션 없음 ✅

**기술 전략**:

- **TDD 준수**: 기존 모든 테스트 GREEN 유지
- **최소 변경**: 구조 변경 없음 (역할 분리 명확)
- **JSDoc 강화**: hooks 중점 (주석 표준화)
- **import 정규화**: 모든 import를 `@shared/@features` 별칭으로 통일
- **로깅 최적화**: debug → trace 일부 변경, 프로덕션 로그 감소

**수용 기준** (모두 만족해야 함):

- ✅ 모든 단위 테스트 GREEN (`npm test:unit` 통과)
- ✅ 브라우저 테스트 GREEN (`npm run test:browser` 통과)
- ✅ E2E 스모크 테스트 GREEN (`npm run e2e:smoke` 통과)
- ✅ 접근성 테스트 GREEN (`npm run e2e:a11y` 통과)
- ✅ 타입체크 0 errors (`npm run typecheck`)
- ✅ 린트 0 errors/warnings (`npm run lint`)
- ✅ 번들 크기 ≤420 KB (변경 없음 예상)
- ✅ import 경로 정규화 완료

**예상 작업**:

1. hooks 파일들: JSDoc 강화, import 정규화, 주석 영어/한글 통일
2. components 파일들: 필요시 JSDoc 강화
3. GalleryApp/Renderer: 에러 처리 표준화 검토
4. 테스트 검증 (모든 스위트 GREEN 확인)
5. 문서 업데이트 (COMPLETED로 이관)

**완료 사항**:

1. **useGalleryScroll.ts 최적화** ✅ (+17줄)
   - Copyright 헤더 제거, 한글 JSDoc 통일
   - 파일 레벨 JSDoc 개선: 책임(4가지 주요 기능 명시)/기능/상태 관리
   - 휠 이벤트, 방향 감지, 페이지 스크롤 차단, 활동 기록 명시

2. **useGalleryFocusTracker.ts 최적화** ✅ (+22줄)
   - 파일 레벨 JSDoc 강화: 버전/책임/기능/상태 관리
   - IntersectionObserver 기반 자동 포커스 추적 문서화
   - 이중 포커스 상태(자동 vs 수동) 관리 설명 추가
   - 스크롤 settling 기반 최적화 및 타이머 debouncing 명시

3. **useGalleryItemScroll.ts 최적화** ✅ (+24줄)
   - Copyright 헤더 제거, 한글 JSDoc 통일
   - 파일 레벨 JSDoc: 책임(currentIndex 감지 및 자동 스크롤)/기능
   - 폴링 기반 인덱스 추적, 사용자 스크롤 감지, 동작 설정 명시

4. **types.ts 문서화** ✅ (+32줄)
   - backward compatibility 계층 목적 명확화
   - JSDoc 강화: 목적/현 상태/마이그레이션 가이드
   - @see 링크 추가 (@shared/types 권장 위치 명시)
   - 향후 타입 확장 진입점으로서의 역할 명시

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings
- ✅ build: success (340.31 KB raw, 91.31 KB gzip)
- ✅ test:smoke: 9/9 PASS
- ✅ import paths: 정상 (@shared/@features 별칭)
- ✅ 번들 크기: ≤420 KB (80 KB 여유)

**기술 개선**:

- JSDoc 표준화: 모든 hooks 파일레벨 문서화 강화
- 주석 일관성: 한글 JSDoc만 사용 (영문 Copyright 제거)
- backward compatibility: types.ts 목적 명확화 및 마이그레이션 가이드
- 구조 안정성: 기존 역할 분리 유지, 최소 변경 원칙 준수

**총 변경**: +81 줄, -14 줄 = +67 줄 (JSDoc 강화)

**커밋**: `78a3972d` - feat(gallery): Phase 220 - JSDoc 강화 및 hooks 최적화

---

## ✅ 최근 완료 작업

### Phase 219: Gallery Types 통합 및 정리 (완료 ✅)

**목표**: `src/features/gallery/types` 디렉터리 점검 및 타입 체계 정리

**배경**:

- Phase 218 완료 후 types 디렉터리 현황 점검 필요
- 중복 타입 정의 발견 (ToolbarState가 여러 곳에 정의됨)
- 명확하지 않은 타입 구조로 인한 유지보수성 저하

**발견된 문제**:

1. **타입 중복 정의 (네이밍 충돌)**:
   - `@shared/types/toolbar.types.ts`의 ToolbarState: UI 상태 (isDownloading,
     isLoading, hasError, currentFitMode, needsHighContrast)
   - `@shared/state/signals/toolbar.signals.ts`의 ToolbarState: 모드 상태
     (currentMode: 'gallery'|'settings'|'download', needsHighContrast)
   - 같은 이름, 전혀 다른 구조 → 타입 혼동 위험

2. **FitMode 중복 정의**:
   - `@shared/components/ui/Toolbar/Toolbar.types.ts`: FitMode 정의
   - `@shared/types/toolbar.types.ts`: FitMode 정의 (동일)
   - DRY 원칙 위반

3. **gallery/types 활용도 낮음**:
   - `src/features/gallery/types/`의 직접 import 없음
   - backward compatibility 외 실질적 용도 없음

**완료 사항**:

1. **ToolbarState 네이밍 명확화** ✅
   - `toolbar.signals.ts`: ToolbarState → ToolbarModeStateData (의도 명확화)
   - ToolbarState 타입 alias 제공 (backward compatibility)
   - JSDoc 강화: "UI 상태" vs "모드 상태" 명시적 구분

2. **FitMode 통합** ✅
   - `Toolbar.types.ts`에서 FitMode 제거
   - `@shared/types/toolbar.types.ts` FitMode를 단일 소스 오브 트루스로 통일
   - `Toolbar.types.ts`에서 re-export (편의성 유지)

3. **gallery/types 문서화 및 간결화** ✅
   - `gallery/types/index.ts`: 목적 명확화 (backward compatibility 계층)
   - `gallery/types/toolbar.types.ts`: 중복 주석 제거, 간결화
   - `@shared/types/toolbar.types.ts`: Phase 219 JSDoc 강화 (cross-reference
     추가)

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings
- ✅ smoke tests: 9/9 PASS
- ✅ build:prod: success (340.31 KB raw, 91.31 KB gzip)

**기술 개선**:

- 타입 시스템 명확성 향상 (네이밍 충돌 해결)
- 중복 제거 (FitMode 단일 정의)
- JSDoc 강화 (목적, cross-reference, warning 표시)
- backward compatibility 명시적 유지

**총 변경**:

- 5개 파일 수정
- 코드: toolbar.signals.ts (+51/-12), Toolbar.types.ts (+5/-2)
- 문서: 3개 파일 JSDoc 강화

**커밋**:

- `e6d5c400`: feat(types): Phase 219 - ToolbarState 네이밍 충돌 해결 및 FitMode
  통합
- `a2ba3cc7`: docs(types): Phase 219 - gallery/types 문서화 및 간결화

---

### Phase 218: Gallery Styles 정리 및 최적화 (완료 ✅)

**목표**: `src/features/gallery/styles` 디렉터리 최적화 및 현대화

**완료 사항**:

- ✅ `gallery-global.css` 최적화 (557줄 → 538줄, 3.4% 감소)
  - 주석 정리 및 한글화 (명확성 향상)
  - oklch 하드코딩 제거 (토큰 사용으로 통일)
  - CSS Logical Properties 사용 (inset, logical units)
  - 중복 선언 제거 및 구조 정리
  - 불필요한 px 주석 제거 (rem/em 토큰만 사용)
  - 접근성 미디어 쿼리 통합

- ✅ `Gallery.module.css` 현황 검증
  - 테스트: test/unit/styles/gallery-hardcoding.test.ts (PASS)
  - 테스트: test/refactoring/cross-component-consistency.test.ts (GREEN)
  - 상태: 미사용 파일 (TEST TARGET)로 명시됨 - 유지
  - 목적: 향후 마이그레이션 또는 삭제 예정

**검증 결과**:

- ✅ 타입체크 0 errors
- ✅ 린트 0 errors/warnings
- ✅ 스타일 테스트 gallery-hardcoding PASS
- ✅ 스모크 테스트 9/9 PASS
- ✅ 개발/프로덕션 빌드 성공
- ✅ GalleryRenderer.ts import 정상 (gallery-global.css만 사용)

**기술 개선**:

- CSS Logical Properties: top/left/right/bottom → inset
- 토큰 일관성: 모든 색상 및 크기 CSS 변수 사용
- 주석 체계: 한글 주석만 사용 (코드 가독성 향상)
- 세션별 명확성: 각 섹션에 한 줄 설명 추가

**총 변경**: 19줄 감소 | 구조 명확화 | 유지보수성 향상

**커밋**: feat/gallery-styles-refactor - Phase 218: Gallery Styles 최적화

---

### Phase 217: Theme Initialization 최적화 (완료 ✅)

**목표**: `src/features/gallery/services/theme-initialization.ts` 최적화

**완료 사항**:

- ✅ 매직 문자열 상수화 (THEME_STORAGE_KEY, THEME_DOM_ATTRIBUTE,
  VALID_THEME_VALUES)
- ✅ 로깅 레벨 최적화 (getSavedThemeSetting warn → debug)
- ✅ JSDoc 강화 (모든 함수에 목적/입출력/예제 추가)
- ✅ 함수 순서 명확화 (의존성 흐름)
- ✅ 코드 간결화 (매직 문자열 제거)

**검증 결과**:

- ✅ 타입체크 0 errors
- ✅ 린트 0 errors/warnings
- ✅ 번들 크기 341 KB (목표 ≤420 KB)
- ✅ 기존 테스트 GREEN 유지
- ✅ 개발/프로덕션 빌드 성공

**커밋**: `5d47f97a` - Phase 217: Theme Initialization 최적화

**총 변경**: 82 삽입(+), 23 삭제(-) | 59 줄 순증가

---

**목표**: `src/features/gallery/hooks` 디렉터리 점검, 현대화, 경로 최적화

**배경**:

- Phase 215 완료 후 갤러리 hooks 전체 점검 필요
- 각 훅의 상태 점검, JSDoc 강화, import 경로 정규화
- 불필요한 코드 정리 및 로깅 최적화

**대상 파일**:

1. **useGalleryScroll.ts** (259줄): 휠 이벤트 기반 스크롤 처리
   - ✅ 상태: 양호 (JSDoc 있음, vendor getter 사용 준수)
   - 🔧 개선 항목:
     - 주석 영어/한글 혼용 정리
     - 로깅 레벨 검토 (debug → trace 일부 변경)
     - import 경로 정규화 (상대 → 별칭)

2. **useGalleryFocusTracker.ts** (516줄): 자동 포커스 추적
   - ⚠️ 상태: 복잡한 상태 관리 (focusState, focusTracking 이중 관리)
   - 🔧 개선 항목:
     - JSDoc 강화 (주요 메서드/상태 미문서화)
     - import 경로 정규화
     - 주석 영어/한글 통일
     - 내부 헬퍼 함수 정리 가능성 검토

3. **useGalleryItemScroll.ts** (438줄): 갤러리 아이템 스크롤 조율
   - ✅ 상태: 구조 명확함 (JSDoc 있음)
   - 🔧 개선 항목:
     - 폴링 방식 검토 (필요성 재확인, INDEX_WATCH_INTERVAL)
     - 에러 처리 로깅 최적화
     - import 경로 정규화

4. **index.ts** (10줄): 배럴 export
   - ✅ 상태: 정상 (유지)

**기술 전략**:

- **TDD**: 기존 테스트 GREEN 유지 (git diff 확인)
- **Import 정규화**: `@shared/@features` 별칭 사용
- **로깅 최적화**: 프로덕션 로그 감소 (debug → trace)
- **JSDoc**: useGalleryFocusTracker 중점 강화
- **주석 통일**: 한글 주석만 사용 (코드 가독성)

**수용 기준** (모두 만족해야 함):

- ✅ 모든 단위/통합 테스트 GREEN (test:unit 통과)
- ✅ 브라우저 테스트 GREEN (test:browser 통과)
- ✅ E2E 스모크 테스트 GREEN (e2e:smoke 통과)
- ✅ 타입체크 0 errors (`npm run typecheck`)
- ✅ 린트 0 errors/warnings (`npm run lint`)
- ✅ 번들 크기 ≤420 KB (변경 없음 예상)
- ✅ import 경로 정규화 완료

**예상 시간**: 2-3시간

---

## � 진행 예정 작업

### Phase 217: Theme Initialization 최적화 (예정)

**목표**: `src/features/gallery/services/theme-initialization.ts` 점검 및 최적화

**배경**:

- Phase 216 완료 후 갤러리 서비스 계층 정리 필요
- theme-initialization.ts는 매직 문자열 + 로깅 레벨 검토 가능
- 코드 간결화 및 유지보수성 개선

**대상 파일**:

1. **theme-initialization.ts** (193줄): 테마 초기화 서비스
   - ✅ 상태: 구조 명확함 (함수 분리 잘됨)
   - 🔧 개선 항목:
     - 매직 문자열 상수화 ('xeg-theme', 'data-theme')
     - logger 레벨 검토 (warn → debug 전환 검토)
     - JSDoc 최소 강화
     - 함수 순서 정리 (논리적 흐름)

**기술 전략**:

- **TDD**: 기존 테스트 GREEN 유지
- **상수화**: THEME_STORAGE_KEY, THEME_ATTR 도입
- **로깅**: warn/debug 분리 (설정 미인식 vs 접근 실패)
- **코드 순서**: 의존성 흐름 따르기

**수용 기준** (모두 만족해야 함):

- ✅ 모든 단위 테스트 GREEN (test:unit 통과)
- ✅ 브라우저 테스트 GREEN (test:browser 통과)
- ✅ E2E 스모크 테스트 GREEN (e2e:smoke 통과)
- ✅ 타입체크 0 errors
- ✅ 린트 0 errors/warnings
- ✅ 번들 크기 ≤420 KB (변경 없음 예상)

**예상 시간**: 1시간

---

## �📋 다음 작업 후보

다음 Phase 완료 후 진행 예정:

### 후보 1: GalleryApp 컴포넌트 현대화 (Phase 218)

**이유**: Gallery 메인 조율 컴포넌트 현대화 **범위**: JSDoc 강화, import 경로
정리, 이벤트 핸들러 정리 **영향도**: 높음 (모든 Gallery 기능 통합) **예상
시간**: 2-3시간

### 후보 2: Shared Services 현대화 (Phase 217)

**이유**: 비즈니스 로직 계층 정리 **범위**: 서비스 인터페이스 정렬, 에러 처리
강화 **영향도**: 높음 (전체 기능 영향) **예상 시간**: 3-4시간

### 후보 3: Settings UI 컴포넌트 현대화 (Phase 218)

**이유**: 설정 패널 컴포넌트 개선 **범위**: JSDoc 강화, import 경로 정리
**영향도**: 중간 (설정 기능) **예상 시간**: 2시간

---

## 📊 최종 상태

| 항목                        | 상태            | 비고                        |
| --------------------------- | --------------- | --------------------------- |
| 빌드                        | ✅ 안정         | 병렬화 + 메모리 최적화 완료 |
| 성능                        | ✅ 14.7% 향상   | 병렬 실행으로 7.3초 단축    |
| 테스트                      | ✅ 82/82 통과   | E2E 스모크 테스트 모두 통과 |
| 접근성 테스트               | ✅ 통과         | WCAG 2.1 Level AA 달성      |
| Phase 211 (Bootstrap)       | ✅ 완료         | 2025-10-27 master 병합      |
| Phase 212 (KeyboardOverlay) | ✅ 완료         | 2025-10-27 master 병합      |
| Phase 213 (Hooks Cleanup)   | ✅ 완료         | 494 줄 데드코드 제거        |
| Phase 214 (VerticalGallery) | ✅ 완료         | 29개 임포트 정규화 + JSDoc  |
| Phase 215 (Components Opt.) | ✅ 완료         | KeyboardHelpOverlay 재구성  |
| 타입/린트                   | ✅ 0 errors     | 모두 통과 (CSS 린트 포함)   |
| 의존성                      | ✅ 0 violations | 3계층 구조 강제             |
| 번들 크기                   | ✅ 340.05 KB    | 목표 ≤420 KB (80 KB 여유)   |
| Scripts                     | ✅ 정리 완료    | JSDoc 현대화 및 표준 준수   |
| 문서                        | ✅ 정리 완료    | 현대화 및 간결화            |
| Import 경로                 | ✅ 정규화 완료  | @shared/@features 별칭 통일 |
| Components 구조             | ✅ 최적화       | 논리적 응집도 개선          |

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
  (Phase 197-215 포함)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- **유지보수**: [MAINTENANCE.md](./MAINTENANCE.md)
