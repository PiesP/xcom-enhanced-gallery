# 🚀 X.com Enhanced Gallery

> **X.com에서 미디어를 원본 화질로 다운로드하고 편리하게 탐색하는 PC 전용
> 유저스크립트**

[![설치하기](https://img.shields.io/badge/설치하기-클릭-brightgreen?style=for-the-badge)](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js)
[![버전](https://img.shields.io/badge/버전-v0.4.0-blue)](https://github.com/PiesP/xcom-enhanced-gallery/releases)
[![라이센스](https://img.shields.io/badge/라이센스-MIT-green.svg)](LICENSE)
[![Chrome/Edge](https://img.shields.io/badge/Chrome%2FEdge-✓-4285F4)](https://www.google.com/chrome/)
[![Firefox](https://img.shields.io/badge/Firefox-✓-FF7139)](https://www.mozilla.org/firefox/)
[![Safari](https://img.shields.io/badge/Safari-✓-00D4FF)](https://www.apple.com/safari/)

**X.com Enhanced Gallery**는 현대적인 웹 기술로 구축된 경량 유저스크립트입니다:

- **UI 프레임워크**: Solid.js 1.9.9 - 반응형 UI, 고성능
- **번들 크기**: 730KB (dev), 328KB (prod, gzip: ~89KB)
- **브라우저 호환**: Chrome 110+, Firefox 78+, Safari 14+, Edge 110+
- **PC 전용 설계**: 마우스/키보드 최적화, 터치 이벤트 미지원
- **품질 보증**: TypeScript strict, 1115+ passing tests, 0 lint warnings
  - **단위 테스트**: Vitest + JSDOM (900+ tests)
  - **브라우저 테스트**: Vitest + Chromium (62 tests)
  - **통합 테스트**: 서비스 라이프사이클 (8 tests)
  - **E2E 테스트**: Playwright (45 tests)
  - **접근성 테스트**: axe-core WCAG 2.1 (14 tests)

**X.com Enhanced Gallery**는 X.com(구 Twitter)에서 이미지와 동영상을 **고화질
원본**으로 다운로드하고, **직관적인 세로 스크롤 갤러리**로 탐색할 수 있는 **PC
환경 전용** 유저스크립트입니다.

## ✨ 주요 기능

### 🖼️ 향상된 갤러리 뷰어

- **세로 스크롤 갤러리**: 트윗의 모든 미디어를 한 화면에서 직관적으로 탐색
- **원본 고화질**: X.com 서버에서 최고 품질의 원본 이미지/동영상 로딩
- **실시간 동영상 재생**: 썸네일에서 실제 MP4 동영상을 추출하여 바로 재생
- **PC 최적화**: 마우스 휠 스크롤, 키보드 단축키 등 데스크톱 환경에 특화

### 💾 스마트 다운로드

- **원본 화질 보장**: Twitter 압축 없는 최고 품질로 다운로드
- **일괄 다운로드**: 트윗의 모든 미디어를 ZIP 파일로 한 번에 다운로드
- **지능적 파일명**: `작성자_YYYYMMDD_트윗내용` 형태로 자동 생성
- **빠른 다운로드**: 중복 제거 및 최적화된 다운로드 프로세스

### 🎨 사용자 경험

- **격리된 UI**: X.com 원본 인터페이스에 영향 없는 독립적인 갤러리
- **자동 테마**: 시스템 다크 모드에 따른 자동 테마 전환
- **접근성 지원**: 스크린 리더 및 키보드 네비게이션 완전 지원
- **성능 최적화**: 빠른 로딩과 부드러운 애니메이션

## 📥 설치 방법

### 1️⃣ 유저스크립트 매니저 설치

먼저 브라우저에 유저스크립트 매니저를 설치해야 합니다.

| 브라우저        | 권장 확장 프로그램                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **Chrome/Edge** | [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| **Firefox**     | [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/)                                  |
| **Safari**      | [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)                                      |

### 2️⃣ 스크립트 설치

<div align="center">

### 🔗 **[여기를 클릭하여 설치하기](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js)**

_클릭하면 유저스크립트 매니저에서 자동으로 설치 화면이 나타납니다_

**📦
[최신 릴리스 보기](https://github.com/PiesP/xcom-enhanced-gallery/releases)**

</div>

### 3️⃣ 설치 확인

1. **X.com 접속**: [https://x.com](https://x.com)에 접속
2. **이미지 클릭**: 임의의 트윗에서 이미지 또는 동영상 클릭
3. **갤러리 확인**: 향상된 세로 스크롤 갤러리가 나타나는지 확인

> **💡 팁**: 설치 후 페이지를 새로고침하면 즉시 사용할 수 있습니다.

## 🎮 사용법

### 기본 사용법

1. **갤러리 열기**: 트윗의 이미지나 동영상 클릭
2. **미디어 탐색**:
   - 🖱️ **마우스 휠**: 위/아래 스크롤로 이미지 순서대로 탐색
   - 🖱️ **좌우 화살표**: 화면 양쪽 끝의 내비게이션 버튼 클릭
   - ⌨️ **키보드**: 방향키 또는 단축키 사용
3. **동영상 재생**: 동영상 위에서 스페이스바 또는 재생 버튼 클릭

### 다운로드 기능

| 다운로드 유형     | 버튼             | 설명                                            |
| ----------------- | ---------------- | ----------------------------------------------- |
| **단일 다운로드** | 📥 다운로드      | 현재 보고 있는 이미지/동영상만 원본 화질로 저장 |
| **전체 다운로드** | 📦 모두 다운로드 | 트윗의 모든 미디어를 ZIP 파일로 일괄 다운로드   |

### 키보드 단축키

| 키보드       | 기능                  | 설명                             |
| ------------ | --------------------- | -------------------------------- |
| `←` `→`      | 이전/다음 이미지      | 갤러리 내 미디어 간 이동         |
| `Home` `End` | 첫 번째/마지막 이미지 | 갤러리 처음/끝으로 바로 이동     |
| `Space`      | 동영상 재생/일시정지  | 현재 동영상의 재생 상태 토글     |
| `Escape`     | 갤러리 닫기           | 갤러리를 닫고 원래 페이지로 복귀 |
| `F`          | 전체화면 토글         | 브라우저 전체화면 모드 전환      |

### 고급 기능

- **이미지 확대/축소**: 마우스 휠로 이미지 세부 사항 확인
- **자동 스크롤**: 긴 이미지의 경우 자동으로 아래쪽까지 스크롤
- **로딩 최적화**: 현재 보는 이미지 우선 로딩으로 빠른 탐색
- **메모리 관리**: 사용하지 않는 이미지 자동 해제로 성능 최적화

## 🛠️ 기술적 특징

### 아키텍처

- **3-Layer Architecture**: Features → Shared → External 구조로 모듈화
- **타입 안전성**: TypeScript 기반 완전한 타입 안전성 보장
- **성능 최적화**: 번들 크기 최소화 및 지연 로딩 구현
- **격리된 렌더링**: X.com 원본 스타일에 영향 없는 독립적 UI

### 핵심 기술

- **UI 프레임워크**: Solid.js 1.9.9 - 반응형 UI, 고성능
- **상태 관리**: Solid.js Signals - Fine-grained 반응형 상태 관리
- **압축**: fflate - 고성능 ZIP 압축 라이브러리
- **스타일링**: CSS Modules + 디자인 토큰 시스템

### 아이콘 시스템

- **아이콘 라이브러리**: Heroicons (React) 컴포넌트를 안전하게 사용하기 위해
  "벤더 getter" 패턴을 적용했습니다.
  - 애플리케이션 코드에서는 `@shared/external/vendors`의 getter만 사용하며, 외부
    라이브러리를 직접 import하지 않습니다.
  - `@heroicons/react` 컴포넌트는 getter 내부에서 React Element → Solid VNode로
    변환되어 안전하게 렌더링됩니다.
  - UI에서는 의미적 이름의 어댑터(예: `HeroDownload` → `Download`)를 통해 일관된
    `Icon` 래퍼로 렌더링합니다.

### 브라우저 호환성

| 브라우저 | 버전 | 상태 |
| -------- | ---- | ---- |
| Chrome   | 88+  | ✅   |
| Firefox  | 78+  | ✅   |
| Safari   | 14+  | ✅   |
| Edge     | 88+  | ✅   |

## 📄 라이선스 및 오픈소스

이 프로젝트는 [MIT 라이센스](LICENSE) 하에 배포됩니다.

### 사용된 오픈소스 라이브러리

| 라이브러리           | 라이센스 | 용도            |
| -------------------- | -------- | --------------- |
| **Solid.js**         | MIT      | UI 프레임워크   |
| **fflate**           | MIT      | 고성능 압축     |
| **@heroicons/react** | MIT      | 아이콘 컴포넌트 |

모든 라이센스 전문은 [`LICENSES/`](LICENSES/) 디렉토리에서 확인할 수 있습니다.

## 🤝 개발에 참여하기

프로젝트 개선 아이디어가 있으신가요? 개발 환경 설정과 상세한 가이드는
[`AGENTS.md`](AGENTS.md)를 참고하세요.

### 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 테스트
npm test
```

더 자세한 개발 가이드는 [`docs/`](docs/) 디렉토리의 문서를 참고하세요.

#### 테스트 실행 안내

이 저장소의 테스트는 Vitest Projects로 분할되어 있어 목적별로 빠르게 실행할 수
있습니다(예: smoke/fast/unit/browser/styles/performance/phases/refactor).
구체적인 사용 방법과 스크립트는 `AGENTS.md`의 "테스트 가이드 (Vitest) > 분할
실행(Projects)" 섹션을 참고하세요.

추가로, 로컬 개발 속도를 위해 다음 기본 명령을 제공합니다:

- 빠른 기본 스위트: `npm test` → fast 프로젝트만 실행(개발 루프 최적)
- 전체 스위트: `npm run test:full`
- 워치 모드: `npm run test:watch` (fast 프로젝트)
- 커버리지(로컬): `npm run test:coverage` (unit 프로젝트)
- **브라우저 테스트**: `npm run test:browser` (Vitest + Chromium, Solid.js
  반응성)
- **접근성 테스트**: `npm run e2e:a11y` (Playwright + axe-core, WCAG 2.1)

참고: CI에서는 dot 리포터와 v8 커버리지로 속도를 최적화했고, Node 22/24
매트릭스로 호환성을 검증합니다. 로컬 기본 테스트 전에 사전 빌드는 수행하지 않아
빠르게 시작되며, 커버리지 작업은 안정성을 위해 사전(production) 빌드를
수행합니다. 빌드 전 검증(`validate:build`)은 브라우저 테스트와 접근성 테스트를
포함합니다.

## 📞 지원 및 피드백

- **🐛 버그 신고**:
  [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)
- **💡 기능 제안**:
  [GitHub Discussions](https://github.com/PiesP/xcom-enhanced-gallery/discussions)
- **📚 문서**: [문서 가이드](docs/DOCUMENTATION.md) · [개발자 가이드](AGENTS.md)
  · [전체 docs/](docs/)
- **📝 변경사항**: [RELEASE_NOTES.md](release/RELEASE_NOTES.md)

---

<div align="center">

**🌟 이 프로젝트가 유용하다면 Star를 눌러주세요! 🌟**

**Made with ❤️ and GitHub Copilot by [PiesP](https://github.com/PiesP)**

</div>
