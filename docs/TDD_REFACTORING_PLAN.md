# TDD 리팩토링 활성 계획

현재 상태: Phase 21 완료 (21.1-21.6)

최종 업데이트: 2025-10-12

브랜치: master

---

## 📊 현재 상태

Phase 21 완료 - 프로젝트 안정 상태

프로젝트 상태:

- ✅ 빌드: dev 730 KB, prod 330 KB (gzip: 89.81 KB)
- ✅ 테스트: 603/603 passing (24 skipped, 1 todo)
- ✅ 의존성: 0 violations (265 modules, 729 dependencies)
- ✅ 타입: 0 errors (TypeScript strict)
- ✅ 린트: 0 warnings, 0 errors

---

## 📚 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-21.6 완료 내역
- `docs/ARCHITECTURE.md`: 프로젝트 아키텍처
- `docs/CODING_GUIDELINES.md`: 코딩 규칙 및 품질 기준

---

## 🎯 Phase 21 완료 요약

### Phase 21.1-21.6: IntersectionObserver 최적화 및 Fine-grained Signals 마이그레이션 ✅

**완료일**: 2025-10-12

**주요 성과**:

1. **Phase 21.1**: IntersectionObserver 무한 루프 방지
   - focusedIndex effect 99% 감소 (200+ → 2회)
   - untrack(), on(), debounce 적용

2. **Phase 21.2**: galleryState Fine-grained Signals 분리
   - 불필요한 재렌더링 100% 제거
   - gallerySignals 도입 + 호환 레이어

3. **Phase 21.3**: useGalleryScroll Passive Listener
   - 스크롤 성능 최적화
   - 메인 스레드 차단 방지

4. **Phase 21.4**: 불필요한 createMemo 제거
   - VerticalGalleryView.tsx의 isVisible memo 제거
   - 코드 간결성 향상

5. **Phase 21.5**: gallerySignals 마이그레이션 - Features 계층
   - GalleryRenderer.ts (2곳)
   - GalleryApp.ts (7곳)

6. **Phase 21.6**: gallerySignals 마이그레이션 - Shared 계층
   - utils.ts (1곳)
   - events.ts (2곳)

**효과**:

- Fine-grained reactivity 일관성 개선
- 전체 프로젝트에서 gallerySignals 사용 패턴 통일
- 코드 가독성 및 유지보수성 향상

---

## 📝 다음 작업 제안

현재 프로젝트는 매우 안정적인 상태입니다.

추가 최적화가 필요한 경우 다음을 고려할 수 있습니다:

### 향후 개선 사항 (OPTIONAL)

#### 1. DOMCache 연동 로직 이동 (LOW)

**현재 상태**:

- `src/bootstrap/features.ts`에서 DOMCache TTL 설정 구독 처리
- Bootstrap 레이어에서 Shared 서비스 세부사항을 다루고 있음

**개선 방안**:

- DOMCache 연동 로직을 `shared/services` 레이어로 이동
- SettingsService 또는 DOMCache 자체 초기화 시점에서 처리
- Bootstrap 레이어는 순수하게 서비스 등록만 담당

**작업 범위**:

- `src/bootstrap/features.ts`의 23-41줄 로직 추출
- `shared/dom/DOMCache.ts` 또는
  `features/settings/services/settings-factory.ts`로 이동
- 테스트 추가 및 검증

**우선순위**: LOW (기능적 문제는 없으나, 아키텍처 일관성 개선)

**관련 파일**:

- `src/bootstrap/features.ts` (TODO 주석 참고)
- `src/shared/dom/DOMCache.ts`
- `src/features/settings/services/settings-factory.ts`

---

#### 2. src/shared 파일명 규칙 통일 (MEDIUM)

**현재 상태**:

- `src/shared` 디렉터리 내 230개 파일 중 60개 이상이 PascalCase 사용
- 프로젝트 규칙(kebab-case)과 불일치
- 예시:
  - `BrowserService.ts`, `BrowserUtils.ts`
  - `DOMCache.ts`, `DOMEventManager.ts`, `SelectorRegistry.ts`
  - `ErrorHandler.ts`, `MemoryTracker.ts`
  - `ServiceInterfaces.ts`, `BaseComponentProps.ts`
  - 기타 60개 이상의 Service/Utils/Component 파일

**문제점**:

- 파일명 규칙 불일치로 코드베이스 일관성 저하
- 새 개발자 온보딩 시 혼란 가능성
- 파일 탐색 및 검색 효율성 저하

**개선 방안**:

- 모든 PascalCase 파일명을 kebab-case로 일괄 변경
- 변경 대상 예시:
  - `BrowserService.ts` → `browser-service.ts`
  - `DOMCache.ts` → `dom-cache.ts`
  - `ErrorHandler.ts` → `error-handler.ts`
  - `MemoryTracker.ts` → `memory-tracker.ts`

**작업 범위 (3단계로 분할)**:

##### Phase A: 작은 디렉터리 (예상 20개 파일)

- `browser/`: BrowserService, BrowserUtils (중복 제거 포함)
- `container/`: AppContainer, ServiceHarness 등
- `dom/`: DOMCache, DOMEventManager, SelectorRegistry
- `error/`: ErrorHandler
- `external/`: vendors 관련 파일
- `loader/`, `logging/`, `memory/`

##### Phase B: 중간 디렉터리 (예상 25개 파일)

- `components/`: BaseComponentProps, StandardProps 등
- `hooks/`: use\* 훅 파일들
- `interfaces/`: ServiceInterfaces 등
- `media/`: FilenameService, MediaProcessor, UsernameSource
- `state/`: 상태 관리 파일
- `styles/`: 스타일 관련 파일
- `types/`: 타입 정의 파일

##### Phase C: 큰 디렉터리 (예상 15개 파일)

- `services/`: AnimationService, BulkDownloadService, MediaService 등
- `utils/`: 각종 유틸리티 파일

**각 Phase별 작업**:

1. 파일명 변경 (mv 명령)
2. 모든 import 경로 일괄 업데이트 (grep + replace)
3. 배럴 export(index.ts) 업데이트
4. 타입 체크 및 빌드 검증
5. 전체 테스트 스위트 실행

**예상 영향 범위**:

- 변경 파일: 60+ 파일 리네임
- import 업데이트: 100-150개 파일 예상
- 테스트 검증: 전체 603개 테스트

**우선순위**: MEDIUM (기능적 문제는 없으나, 코드베이스 일관성 확보)

**Breaking Change**: Yes (내부 리팩토링, 외부 API는 변경 없음)

**예상 소요 시간**: Phase당 2-3시간, 총 6-9시간

**관련 이슈**: 파일명 규칙 통일 (#TBD)

**선행 작업**:

- 사용되지 않는 중복 파일 제거 (BrowserUtils 등)
- 주요 의존성 매핑 문서화

**후속 작업**:

- 새 파일 생성 시 kebab-case 규칙 강제화 (ESLint rule 검토)
- 파일명 규칙 문서 업데이트

---

### 기타 제안

- **성능 최적화**: 추가적인 반응성 최적화 기회 탐색 (OPTIONAL)
- **코드 품질**: 추가적인 코드 간결성 개선 기회 탐색 (LOW)
- **기능 개발**: 새로운 기능 추가 또는 사용자 피드백 대응

즉각적인 리팩토링이 필요하지 않으며, 새로운 기능 개발이나 사용자 피드백 대응에
집중할 수 있습니다.

---

## 🔄 작업 진행 프로세스

1. **계획**: 이 문서에 Phase 추가
2. **브랜치**: `feature/phase<N>-<description>` 생성
3. **TDD**: RED → GREEN → REFACTOR
4. **검증**: `npm run validate && npm run build`
5. **병합**: master로 병합
6. **문서화**: 완료 내역을 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관

---

## 📋 Phase 템플릿

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

**다음 단계**: 새로운 Phase가 필요할 때 이 문서에 추가하고, 완료 후
`TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하세요.
