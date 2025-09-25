# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-24 — Epic "REF-LITE-V3 (Userscript 번들 경량화)" 진행 중. 직전
Epic "VP-Focus-Indicator-001"은 Completed 로그로 이관되었습니다. 세부 히스토리는
`TDD_REFACTORING_PLAN_COMPLETED.md`를 참조하세요.

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 “활성 Epic/작업”과 해당 Acceptance에만 집중합니다.

---

## 2. 활성 Epic 현황

### Epic REF-LITE-V3 — Userscript 번들 경량화 (단일 파일 유지)

#### 문제 정의 & 현재 상태

- 2025-09-24 prod 번들(`dist/xcom-enhanced-gallery.user.js`) 용량 477,525 byte.
  - Terser minify 적용 상태에서도 CSS·벤더 코드 비중이 높아 Tampermonkey 설치
    경고(>500 KB) 임계치에 근접.
- Sourcemap 분석(`dist/xcom-enhanced-gallery.user.js.map`) 주요 기여도:

  | 모듈                             |   bytes | 비고                                                             |
  | -------------------------------- | ------: | ---------------------------------------------------------------- |
  | `fflate/esm/browser.js` (제거됨) | ~89,198 | Stage 1(StoreZipWriter) 도입으로 번들에서 제거됨, 신규 측정 예정 |
  | `MediaService.ts`                |  33,739 | 통합 서비스, 로직 축소 어려움                                    |
  | `VerticalGalleryView.tsx`        |  27,744 | UI 핵심 컴포넌트                                                 |
  | `shared/utils/events.ts`         |  27,379 | 이벤트 매니저, 추후 분리 후보                                    |
  | CSS Modules 전체                 | 106,674 | Button/Toolbar/Gallery가 대부분                                  |
  | Heroicons outline 9종            |  ~8,500 | React → compat 브릿지 오버헤드 포함                              |

#### 검토한 대안 (요약)

| 대안                                        | 장점                                                   | 단점/위험                                                       | 판단            |
| ------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- | --------------- |
| A. `fflate` 대체(직접 Store ZIP 작성)       | 90 KB 이상 절감, 번들 초기 로드 감소, 실행 중 CPU 감소 | ZIP 포맷 직접 구현 필요, 회귀 테스트 필수                       | ✅ 선택         |
| B. CSS 모듈 공통화(`composes` + primitives) | 30~40% CSS 절감 예상, 디자인 토큰 재사용 강화          | 다수 컴포넌트 수정, 스타일 회귀 가능성                          | ✅ 선택 (2단계) |
| C. Heroicons 제거 → 경량 아이콘 맵          | React 의존 제거, compat 호출 단순화, 약 10 KB 절감     | 아이콘 접근성/디자인 재검증 필요                                | ✅ 선택 (3단계) |
| D. 서비스 로직 분할(동적 import 복원)       | 추후 기능 단위로 lazy 가능                             | `inlineDynamicImports: true` 정책 상 현재는 실효 없음, 복잡도 ↑ | ❌ 보류         |

#### 선정 전략 (Multi-Stage)

Stage 1(StoreZipWriter 전환)은 2025-09-25 완료되어 Completed 로그로
이관되었습니다. 남은 단계는 다음과 같습니다.

1. **Stage 2 — CSS primitives & budget 가드**
   - `@shared/styles/primitives.module.css` 신설, Button/Toolbar/Gallery 등에서
     `composes` 사용.
   - 공통 변형(사이즈/variant)을 CSS 커스텀 프로퍼티로 전환.
   - 새로운 Vitest budget(`test/optimization/css-budget.test.ts`)으로 번들 CSS
     길이 상한(<=70 KB) 가드.
   - 목표 절감: ~35 KB.
2. **Stage 3 — Heroicons 경량화 및 compat 정리**
   - 남은 작업
     - Heroicons 어댑터 및 벤더 getter 제거, `@heroicons/react` devDependency
       삭제, 라이선스 파일 업데이트.
   - 목표 절감: ~12 KB + 렌더링 경로 단순화.
   - 참고: 로컬 SVG 맵 구축 및 LazyIcon/registry 경량화는 Completed
     로그(2025-09-25 항목)에서 추적.

#### TDD/실행 단계 메모

- **Stage 2**
  1. CSS budget 테스트(RED) → `XEG_CSS_TEXT.length` 한계 설정.
  2. Primitives 도입, Button/Toolbar/Gallery 순으로 이관.
  3. Vitest + Playwright 시각 리그레션 스냅(`test/ui/toolbar*.test.tsx`) 갱신.
  4. Budget 테스트 GREEN, 시각 스냅 재승인.
- **Stage 3**
  1. Heroicons vendor 제거 스캔(RED) → direct import 감지 테스트 강화.
  2. Heroicons 어댑터/벤더 getter 제거, `@heroicons/react` devDependency 삭제.
  3. LICENSE/metadata 업데이트 및 Stage 3 관련 회귀 테스트 리프레시.
  4. 빌드/테스트 통과, 번들 사이즈 재측정 및 Completed 로그 갱신.

#### Acceptance / 품질 게이트

- dist prod 번들 용량 목표: **≤ 340 KB** (±5 KB, CSS budget 포함).
- 기능 회귀 금지: Bulk ZIP 생성, 단일 다운로드, 갤러리 UI, 설정/토스트 모두 기존
  E2E 테스트 레벨 통과.
- 필수 스크립트: `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run build:prod` + `node scripts/validate-build.js` (사이즈 보고).
- 문서/CHANGELOG: Heroicons 제거 시 라이선스 정리(`LICENSES/*.txt` 업데이트).

#### 리스크 & 대응

- ZIP 포맷 구현 오류 → 독립 테스트에서 JSZip 검증 + Windows/macOS 아카이브 수동
  확인 절차 문서화.
- CSS 리팩토링 회귀 → Playwright 스냅샷 + 수동 QA 체크리스트(PC/다크 모드).
- 아이콘 교체 시 미세 시각 차이 → figma spec 재비교, 디자인 토큰 사용 준수.

#### 예상 효과

- 번들 사이즈 약 25~30% 감소, 초기 로드/메모리 압박 완화.
- 외부 의존성(`fflate`, `@heroicons/react`) 제거로 장기적 유지보수 비용 절감.
- CSS 구조 단순화 → 이후 테마/다크모드 변형 작업 속도 향상.

### Task MEDIA-HALT-ON-GALLERY — 갤러리 진입 시 배경 미디어 정지

#### 문제 정의 & 관찰

- 갤러리 진입 시 트위터 타임라인에서 재생 중이던 비디오가 계속 재생되어 오디오가
  겹치는 문제가 보고되었음.
- `MediaService`에 `pauseAllBackgroundVideos`/`prepareForGallery` API가
  존재하지만 갤러리 오픈 경로에서 호출되지 않아 기능이 dormant 상태.
- `VideoControlService`는 갤러리 활성화 여부를 내부적으로 가드하므로 중복 호출
  시 안전하게 무시된다.

#### 해결 대안 비교

| 옵션                                                     | 설명                                                                     | 장점                                                                    | 단점/리스크                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A. `GalleryApp.openGallery`에서 `prepareForGallery` 호출 | 갤러리 앱 오픈 절차 직전에 MediaService를 lazy 로드하고 배경 비디오 정지 | 구현 범위 최소, 기존 아키텍처(Features → Shared) 내에서 자연스러운 위치 | `GalleryRenderer.render`처럼 상태 시그널을 직접 여는 예외 경로는 보호하지 못할 수 있음 |
| B. 갤러리 state change effect에서 MediaService 호출      | `galleryState`가 `isOpen=true`로 변할 때 공통 훅에서 정지 처리           | 모든 오픈 경로를 자동으로 감지                                          | State 레이어가 서비스에 의존하게 되어 계층 경계를 약화시키는 위험, 순환 의존 가능성    |
| C. 미디어 추출 이벤트(`onMediaClick`)에서 즉시 정지      | 추출 성공 여부와 무관하게 클릭 시 배경 비디오를 먼저 정지                | UI 체감 속도가 가장 빠름, 갤러리 렌더 진입 전 정지 보장                 | 추출 실패 시 복원 처리를 별도로 넣어야 하며, 다른 오픈 경로와 동기화가 어려움          |

#### 채택안

- 기본 경로는 **옵션 A**를 채택한다. `GalleryApp.openGallery`에서
  `MediaService.prepareForGallery()`를 `openGallery` 시그널 호출 전에 실행하여
  표준 진입점에서 배경 비디오가 멈추도록 한다.
- `GalleryRenderer.render`가 외부에서 직접 호출되는 경우에도 일관성 있는 동작을
  보장하기 위해 동일한 guard 호출을 추가한다. (서비스는 컨테이너 getter를 통해
  접근)
- 기존 종료 흐름(`mediaService.restoreBackgroundVideos`)은 유지되어 갤러리 종료
  시 재생 상태를 복원한다.

#### TDD/실행 단계

1. **RED**: `test/unit/features/gallery-app-activation.test.ts`에 `openGallery`
   호출 시 `MediaService.prepareForGallery`가 실행되는지 검증하는 테스트 추가
   (컨테이너 getter mock 활용).
2. **RED**: `GalleryRenderer.render` 경로에서도 동일 호출이 보장되는지 확인하는
   단위 테스트 신규 작성.
3. **GREEN**: `GalleryApp`과 `GalleryRenderer`에 `prepareForGallery` 호출을
   추가하고, 필요 시 DOM 없는 환경에서도 안정적으로 동작하도록 가드한다.
4. **REFACTOR**: 중복 로깅/예외 처리를 정리하고, `VideoControlService`가 이미
   활성화된 경우 중복 호출을 무시한다는 테스트를 보강한다.
5. 통합 확인: 간단한 통합 테스트에서 더미 `<video>` 요소를 삽입한 뒤 갤러리를
   열어 `paused` 상태가 true로 바뀌는지 검증한다.

#### Acceptance / 품질 게이트

- `npm run typecheck`, `npm run lint`, `npm test` 전부 GREEN.
- 새 단위/통합 테스트가 `prepareForGallery` 호출 및 비디오 일시 정지를 보장한다.
- 갤러리 종료 시 배경 비디오 복원 동작이 기존과 동일하게 유지됨을 회귀 테스트로
  확인한다.
- Userscript 번들 빌드(`npm run build:prod` + `scripts/validate-build.js`)에서
  새 로직으로 인해 사이즈/헤더 문제가 발생하지 않는다.

#### 리스크 & 대응

- 컨테이너 등록 순서 문제로 `MediaService`가 아직 준비되지 않은 상태에서 호출될
  가능성 → `GalleryApp.initialize` 시점에 이미 `MediaService`가 container에
  등록되어 있음을 테스트로 보증하고, 예외 발생 시 사용자에게 토스트 경고 및 로그
  기록.
- 통합 테스트에서 실제 비디오 요소를 제어할 때 JSDOM 호환성이 떨어질 수 있음 →
  `HTMLVideoElement`를 모킹하거나 `play/pause`를 spy 처리하여 안정적인 assertion
  확보.
- 향후 갤러리 오픈 경로가 추가될 때 잊고 guard를 붙이지 않는 리스크 → 컨테이너
  레벨 테스트(5단계)로 회귀 감지.

## 3. 다음 사이클 준비 메모(Placeholder)

- 신규 Epic 제안은 백로그에 초안 등록 후 합의되면 본 문서의 활성 Epic으로
  승격합니다.

---

## 5. TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

Gate 체크리스트(요지):

- 타입/린트/테스트/빌드 검증은 `AGENTS.md`와 `CODING_GUIDELINES.md`의 품질
  게이트를 따릅니다.

---

## 6. 참고 문서

| 문서                   | 위치                                     |
| ---------------------- | ---------------------------------------- |
| 완료 로그              | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그                 | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계                   | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙              | `docs/CODING_GUIDELINES.md`              |
| 계획 아카이브(축약 전) | `docs/archive/`                          |

필요 시 새 Epic 제안은 백로그에 초안(Problem/Outcome/Metrics) 형태로 먼저 추가
후 합의되면 본 문서 Epic 템플릿 섹션에 승격합니다.

---

## 7. 품질 게이트 및 검증 방법

모든 Epic/Task는 다음 게이트를 통과해야 합니다.

- 타입: `npm run typecheck` — strict 오류 0
- 린트/포맷: `npm run lint` / `npm run format` — 수정 사항 없거나 자동 수정 적용
- 테스트: `npm test` — 신규/갱신 테스트 GREEN, 리팩터링 임시 RED만 허용 주석
  필수
- 빌드: `npm run build:dev`/`prod` — 산출물 검증 스크립트 통과

추가로, 접근성 전용 스모크:

- Tab/Shift+Tab 네비게이션 스모크, Escape 복귀 스모크, aria-live 공지 스냅샷

메모리 전용 스모크:

- 타이머/리스너 카운트 0, revoke 큐 0, 대량 로딩 후 회복 확인(모킹)

---

## Change Notes (Active Session)

- 2025-09-24: Epic `REF-LITE-V3` 착수, 번들 경량화 3단계 계획 확정.
- 2025-09-25: Stage 1(StoreZipWriter) 완료, 활성 계획은 Stage 2/3만 남김.
