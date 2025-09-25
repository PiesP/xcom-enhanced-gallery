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
