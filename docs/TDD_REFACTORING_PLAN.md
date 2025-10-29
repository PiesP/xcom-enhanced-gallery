# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-29 | **상태**: Phase 234 완료 ✅ |
**[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## 🔄 현재 진행 중인 작업

### Phase 235: Toast 알림을 GalleryApp 내부로 격리 (2025-10-29)

**목표**: 토스트 알림 기능을 유저스크립트(main.ts)에서 제거하고 GalleryApp 내부로 완전히 격리

**배경**:

- 현재 main.ts가 document.body에 Toast 컨테이너를 마운트
- 유저스크립트는 클릭 이벤트 위임만 담당하고, 나머지 모든 UI는 갤러리 앱 내부로 격리해야 함

**솔루션 선택**: 옵션 2 - 토스트를 GalleryApp 내부로 이동 (Recommended)

**장점**:

- ✅ 사용자 피드백 메커니즘 유지 (에러 알림)
- ✅ 접근성 유지 (WCAG 2.1 live region)
- ✅ 명확한 책임 분리 (main.ts는 이벤트 위임만)
- ✅ 테스트 용이성 (GalleryApp 테스트에서 Toast 검증)

**대안 검토**:

- ❌ 옵션 1 (완전 제거): 사용자 피드백 상실, 접근성 저하
- ⚠️  옵션 3 (GalleryRenderer로 이동): 렌더러 책임 과중

**구현 단계**:

#### Phase 235.1: main.ts에서 Toast 제거 ⏳

- [ ] `initializeToastContainer()` 함수 제거
- [ ] `toastContainerDispose` 변수 제거
- [ ] `initializeCriticalSystems()`에서 Toast 초기화 코드 제거
- [ ] `cleanup()`에서 Toast dispose 코드 제거
- [ ] import 정리

#### Phase 235.2: GalleryApp에 Toast 통합 ⏳

- [ ] GalleryRenderer 또는 GalleryApp 내부에 Toast 컨테이너 마운트
- [ ] 기존 `toastController` 로직 유지
- [ ] 갤러리 닫힐 때 Toast 정리
- [ ] 테스트 업데이트 (Toast가 갤러리 내부에서만 동작)

#### Phase 235.3: 빌드 및 테스트 검증 ⏳

- [ ] `npm run build` 성공 확인
- [ ] 번들 크기 변화 확인 (Toast는 여전히 포함)
- [ ] 단위 테스트 실행 (`npm test`)
- [ ] 브라우저 테스트 (`npm run test:browser`)
- [ ] E2E 스모크 테스트 (`npm run e2e:smoke`)
- [ ] 접근성 테스트 (`npm run e2e:a11y`)

#### Phase 235.4: 문서 업데이트 ⏳

- [ ] ARCHITECTURE.md 업데이트 (Toast 위치 변경)
- [ ] 완료 내용을 TDD_REFACTORING_PLAN_COMPLETED.md로 이관

---

**다음 작업 후보** (Phase 235 완료 후):

1. **Phase 228.2-228.5 재평가** (보류 중)
   - Phase 228.1, 229 효과 측정 후 재개 여부 결정

2. **성능 프로파일링**
   - bundlesize 모니터링, 번들 분석

3. **접근성 개선**
   - ARIA 속성 강화, 키보드 네비게이션 개선

---

## ✅ 최근 완료 작업 (간략)

### Phase 234: TESTING_STRATEGY.md 간소화 (2025-10-29)

- TESTING_STRATEGY.md 517줄 → 271줄 (48% 감소)
- 테이블 형태로 재구성, 핵심 정보 접근성 향상
- 상세 내용은 참조 링크로 대체 (AGENTS.md, test/README.md 등)
- 상세: [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)

### Phase 233: 문서 간소화 및 정리 (2025-10-29)

- 3개 문서 4667줄 → 444줄 (90% 감소)
- 개발자 온보딩 시간 대폭 단축, 유지보수 부담 감소
- 상세: [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)

### Phase 232: CodeQL 보안 경고 해결 (2025-10-29)

- 6개 보안 이슈 해결: URL 검증(3), Prototype Pollution(1), 빌드 안전성(2)

### Phase 229-231 (2025-10-28)

- Phase 231: Phase 199 중단 흔적 제거
- Phase 230: BaseService 초기화 실패 수정 (ThemeService export)
- Phase 229: PC-only 정책 부작용 수정 (텍스트 선택 복원)

### Phase 228.1: 이벤트 캡처 최적화 (2025-10-28)

- 미디어 컨테이너 fast-path 체크로 비미디어 클릭 10-20ms 개선

**이전 Phase**:
[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) 참고

---

## ⏸️ 보류된 작업

### Phase 228.2-228.5: 트위터 페이지 간섭 최소화

**보류 이유**: Phase 228.1 완료로 주요 간섭 해결, ROI 재평가 필요

**재평가 조건**: 사용자 피드백 수집 + Phase 228.1/229 효과 측정

---

## 🎯 다음 작업 후보

1. **Phase 228.2-228.5 재평가** (보류 해제 필요)
2. **성능 프로파일링** (bundlesize 모니터링, 번들 분석)
3. **접근성 개선** (ARIA 속성 강화, 키보드 네비게이션 개선)

---

## 📊 프로젝트 현황

| 항목          | 상태          | 비고                        |
| ------------- | ------------- | --------------------------- |
| 빌드          | ✅ 안정       | 병렬화 + 메모리 최적화 완료 |
| 테스트        | ✅ 82/82 통과 | E2E 스모크 테스트 포함      |
| 접근성        | ✅ 통과       | WCAG 2.1 Level AA 달성      |
| 타입/린트     | ✅ 0 errors   | 모두 통과                   |
| 의존성        | ✅ 0 위반     | 3계층 구조 강제             |
| 번들 크기     | ✅ 340 KB     | 목표 ≤420 KB (여유 80 KB)   |
| 보안 (CodeQL) | ✅ 0 경고     | Phase 232 완료              |

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- **유지보수**: [MAINTENANCE.md](./MAINTENANCE.md)
