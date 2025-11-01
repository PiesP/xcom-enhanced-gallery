# GitHub Copilot 개발 지침 — 초간단 버전

> 이 문서는 프로젝트 내 AI/코드 어시스턴트를 위한 “최소 운영 규칙”을 간결히
> 정리합니다. 세부 규칙/템플릿은 docs/ 폴더 문서를 참조하세요.

## 핵심 3원칙(필수)

- Vendor getter만 사용: `const { createSignal } = getSolid()` /
  `const us = getUserscript()`
- PC 전용 이벤트만: click, keydown/keyup, wheel, contextmenu, mouse\*
- 디자인 토큰만: 색상/크기 하드코딩 금지. `--xeg-*`, `--space-*` 등 토큰
  사용(색상은 oklch, 크기는 rem/em)

## 요청 시 최소 컨텍스트 패키지

- 영향 파일 3–7개
- 핵심 타입/시그니처(입출력/에러 2–4줄)
- 제약 요약: vendor getter, PC-only, 디자인 토큰
- 수용 기준 2–4줄: 어떤 테스트가 생기고 무엇이 GREEN이어야 하는가

## 꼭 보는 문서(링크)

- 전체 안내: `docs/DOCUMENTATION.md`
- 코딩/스타일/토큰/이벤트: `docs/CODING_GUIDELINES.md`
- 아키텍처/의존성 경계: `docs/ARCHITECTURE.md`
- 테스트 전략/TDD: `docs/TESTING_STRATEGY.md`
- 유지보수/체크리스트: `docs/MAINTENANCE.md`

## 자주 쓰는 스크립트(로컬)

```bash
npm run validate          # typecheck + lint + format
npm test                  # 단위/통합 테스트
npm run test:cleanup      # ✅ Vitest 워커 정리(항상 실행)
npm run build             # dev + prod 빌드 및 산출물 검증
npm run maintenance:check # 임시/백업/큰 문서 등 점검
```

### 스크립트 통일 정책 (Node.js 전용)

- 모든 프로젝트 스크립트는 JS/Node로 통일합니다(셸 스크립트 금지).
- OS 의존 작업은 사전 점검 후 미충족 시 "건너뜀"으로 처리하고 성공 코드(0)로
  종료합니다.
- 테스트 전체 실행은 `scripts/run-all-tests.js`로 제공되며 `npm run test:full`이
  이를 호출합니다.
- CI는 GitHub Actions 네이티브 기능을 우선 사용하고, 로컬 전용
  스크립트(`scripts/*.js`)는 개발 편의 기능만 제공합니다.

## 입력 이벤트 정책(PC 전용)

- 허용: click, keydown/keyup(ArrowLeft/Right, Home/End, Escape, Space), wheel,
  contextmenu, mouseenter/leave/move/down/up
- 금지: 모든 TouchEvent(onTouchStart/Move/End/Cancel), PointerEvent
  전반(pointerdown/up/move/enter/leave/cancel), 제스처 이벤트
- 팁: 네비게이션 키 처리 시 의도된 동작에 한해 `preventDefault()` 적용

## 디자인 토큰 규칙(필수)

- 크기: rem(절대)/em(상대)만 사용, px 금지
- 색상: oklch 사용, rgba/hex(흑백 기본 제외) 금지
- 토큰 계층: Primitive → Semantic(`--xeg-*`) → Component(컴포넌트 접두사 권장)

## Vendor/Userscript 접근

- Solid/Vendors:
  `import { getSolid, getSolidStore } from '@shared/external/vendors'`
- Userscript:
  `import { getUserscript } from '@shared/external/userscript/adapter'`
- 다운로드/ZIP: `getUserscript().download(...)` /
  `@shared/external/zip/zip-creator`

## 테스트 전략·TDD(요약)

- Vitest + JSDOM 중심, 브라우저/Playwright는 반응성·레이아웃·E2E 스모크에 한정
- 외부 의존은 모두 getter 경유로 주입/모킹 가능하게 작성
- 절차: RED(실패 테스트) → GREEN(최소 구현) → REFACTOR(정리/커버리지 유지)

### Vitest 워커 정리 규칙(필수)

- 모든 Vitest 실행 후에는 반드시 워커 정리 스크립트를 실행합니다.
- 허용 예시:
  - npm 스크립트 사용 시: `npm test && npm run test:cleanup`
  - 직접 실행 시: `npx vitest run && node ./scripts/cleanup-vitest-workers.js`
- 목적: 잔여 워커 프로세스로 인한 메모리 누수/포트 점유/다음 실행 간섭 방지
- 참고: 로컬에서는 `posttest` 훅으로 `npm test` 뒤 자동 실행되지만, `npx vitest`
  등 직접 실행 시에도 반드시 후행 호출을 포함해야 합니다.

## 문서/스크립트 라이프사이클(간단)

- 문서 초안: `docs/temp/` → 확정 시 `docs/` 루트 → 완료 시 `docs/archive/`
- 스크립트 실험: `scripts/temp/` → 재사용 가능 시 `scripts/` 루트 승격(+ npm
  스크립트)
- AI 파일 생성: 초안/실험은 temp/ 하위에만 생성. 루트 생성은 구조/설정 파일에
  한정

## 임시 파일 정책 (필수 준수)

**핵심 규칙**: 모든 임시 파일은 루트 경로가 아닌 **지정된 디렉터리**에만 생성

- **허용 위치**:
  - `docs/temp/` - 문서 작업 파일
  - `scripts/temp/` - 스크립트 실험
  - `test/archive/` - 완료된 테스트 아카이브
  - `test/temp/` (필요시) - 테스트 실험
  - `tmp/` 또는 `temp/` (프로젝트 루트 최소화)

- **금지 위치** (절대 생성 금지):
  - ❌ 프로젝트 루트에 `*.log`, `*-output.txt`, `build-*.txt` 등
  - ❌ 루트에 빌드/테스트 로그 파일
  - ❌ `.tsbuildinfo` (빌드 캐시)

- **루트 보호 정책**:
  - `.gitignore`에 루트 임시 파일 패턴 등록 (자동 추적 방지)
  - 모든 임시 작업 결과물은 commit 전에 정리
  - 불가피한 임시 파일은 즉시 정리 또는 `tmp/`로 이동

## 작업 종료 프로토콜(필수)

1. **코드 품질 검증**

```bash
npm run validate  # typecheck + lint:fix + format
npm test && npm run test:cleanup  # 전체 테스트 실행 후 워커 정리(필수)
```

1. **보안 검증 (선택사항)**

```bash
npm run codeql:check  # 로컬 보안 정적 분석 (선택, CI에서 필수 실행)
```

**참고**: CodeQL은 CI에서 자동으로 실행됩니다. 로컬 실행은 빠른 피드백용이며,
validate 스크립트는 CodeQL 없이도 통과합니다.

1. **빌드 검증**

```bash
npm run build
```

1. **유지보수 점검 및 보고**

```bash
npm run maintenance:check
```

보고 항목: ✅ 정상 / ⚠️ 조치 필요(백업·큰 문서·빌드 크기) / 💡 권장 조치

1. **커밋 준비**: 모든 검증 통과 후 커밋, 조치 필요 시 사용자 확인

## 금지/주의(요약)

- 직접 vendor import 금지(반드시 getter)
- Touch/Pointer 이벤트 금지, PC 이벤트만 사용
- 색상/크기 하드코딩 금지(px, rgba/hex)
- 다운로드를 a[href] 직접 생성으로 처리 금지(Userscript/ZIP 유틸 사용)
- 경로는 별칭 사용(`@shared`, `@features` 등), 파일명은 kebab-case

## 빠른 체크리스트(변경 제안 시)

- [ ] 최소 diff로 제안했는가
- [ ] vendor/Userscript getter 사용을 보장했는가
- [ ] PC 전용 이벤트/디자인 토큰 규칙을 지켰는가
- [ ] 테스트를 추가/수정하고 GREEN인지 확인했는가
- [ ] 종료 프로토콜(Validate/Build/Maintenance)을 수행했는가

—

세부는 `docs/`의 각 문서(특히 `CODING_GUIDELINES.md`)를 단일 기준으로 따릅니다.
모호한 부분은 간단 제안과 함께 테스트로 명확히 하세요.
