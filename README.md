# 🚀 X.com Enhanced Gallery

> **X.com에서 미디어를 원본 화질로 다운로드하고 편리하게 탐색하는 PC 전용
> 유저스크립트**

[![설치하기](https://img.shields.io/badge/설치하기-클릭-brightgreen?style=for-the-badge)](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js)
[![버전](https://img.shields.io/badge/버전-v0.2.4-blue)](https://github.com/PiesP/xcom-enhanced-gallery/releases)
[![라이센스](https://img.shields.io/badge/라이센스-MIT-green.svg)](LICENSE)
[![Chrome/Edge](https://img.shields.io/badge/Chrome%2FEdge-✓-4285F4)](https://www.google.com/chrome/)
[![Firefox](https://img.shields.io/badge/Firefox-✓-FF7139)](https://www.mozilla.org/firefox/)
[![Safari](https://img.shields.io/badge/Safari-✓-00D4FF)](https://www.apple.com/safari/)

**X.com Enhanced Gallery**는 현대적인 웹 기술로 구축된 경량 유저스크립트입니다:

- **UI 프레임워크**: Preact (3KB) - React 호환, 경량화
- **번들 크기**: 250KB 미만으로 최적화
- **브라우저 호환**: Chrome 88+, Firefox 78+, Safari 14+, Edge 88+
- **PC 전용 설계**: 마우스/키보드 최적화, 터치 이벤트 미지원

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

- **3계층 구조**: Features → Shared → External 단방향 의존을 유지하며 진입점은
  `src/main.ts`입니다.
- **벤더 getter 패턴**: `@shared/external/vendors`와
  `@shared/external/userscript/adapter`가 외부 의존성을 TDZ-safe하게 주입합니다.
  자세한 계약은 [`docs/vendors-safe-api.md`](docs/vendors-safe-api.md)를
  참고하세요.
- **스타일 & 접근성**: CSS Modules + 디자인 토큰, PC 전용 입력 규약을
  적용합니다. 세부 규칙은
  [`docs/CODING_GUIDELINES.md`](docs/CODING_GUIDELINES.md)에 정리되어 있습니다.
- **아이콘 시스템**: Heroicons(React) 컴포넌트를 getter에서 Preact VNode로
  변환해 안전하게 사용합니다.
- **압축 & 다운로드**: `fflate` 기반 ZIP 생성과 Userscript API 어댑터가 원본
  화질 다운로드를 지원합니다.

추가 운영/아키텍처 문서는 [`CONTRIBUTING.md`](CONTRIBUTING.md),
[`AGENTS.md`](AGENTS.md), [`docs/README.md`](docs/README.md)에서 확인할 수
있습니다.

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

| 라이브러리           | 라이센스 | 용도             |
| -------------------- | -------- | ---------------- |
| **Preact**           | MIT      | UI 프레임워크    |
| **@preact/signals**  | MIT      | 반응형 상태 관리 |
| **fflate**           | MIT      | 고성능 압축      |
| **@heroicons/react** | MIT      | 아이콘 컴포넌트  |

모든 라이센스 전문은 [`LICENSES/`](LICENSES/) 디렉토리에서 확인할 수 있습니다.

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면:

1. **Fork**: 이 저장소를 포크하세요
2. **Branch**: 새로운 기능 브랜치를 생성하세요
   (`git checkout -b feature/amazing-feature`)
3. **Commit**: 변경사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. **Push**: 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. **Pull Request**: Pull Request를 생성하세요

### 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery

# 의존성 설치
npm ci

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 품질 게이트 (typecheck + lint + format)
npm run validate

# 테스트
npm test
```

더 자세한 개발 가이드는 [`docs/`](docs/) 디렉토리의 문서를 참고하세요.

주요 문서 바로가기

- 아키텍처와 책임 분리 설계서: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 코딩 가이드라인: [docs/CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md)
- 의존성 그래프(인터랙티브): 문서 진입점: [docs/README.md](docs/README.md)
  아키텍처 설계: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 코딩 가이드:
  [docs/CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md) 의존성
  그래프(인터랙티브): [docs/dependency-graph.html](docs/dependency-graph.html)
  - 그래프 생성/검증 방법은 [AGENTS.md](AGENTS.md) 참고

의존성 그래프 생성/뷰어

- 생성/검증: `npm run deps:all` (docs/dependency-graph.{json,dot,svg} 생성 + 룰
  검증)
- 뷰어 실행: `npm run deps:view` → 브라우저에서
  `http://localhost:8080/dependency-graph.html`

## 📞 지원 및 피드백

- **🐛 버그 신고**:
  [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)
- **💡 기능 제안**:
  [GitHub Discussions](https://github.com/PiesP/xcom-enhanced-gallery/discussions)
- **📚 문서**: [docs/](docs/) 디렉토리
- **📝 변경사항**: [RELEASE_NOTES.md](release/RELEASE_NOTES.md)

---

### 🌟 이 프로젝트가 유용하다면 Star를 눌러주세요

Made with ❤️ and GitHub Copilot by [PiesP](https://github.com/PiesP)
