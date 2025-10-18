# 🚀 X.com Enhanced Gallery - Release Notes

**Current Version:** v0.4.0
**Last Updated:** 2025-10-18

## 📋 Overview

X.com Enhanced Gallery는 X.com(구 Twitter)의 미디어 보기 경험을 향상시키는 Userscript입니다.

## ✨ Core Features

### 🖼️ Media Viewing

- 향상된 미디어 갤러리 뷰어
- 수직/수평 레이아웃 지원
- 고품질 이미지 및 비디오 재생

### ⬇️ Download Capabilities

- 단일 미디어 다운로드
- 일괄 다운로드 (ZIP 압축)
- 고품질 미디어 원본 다운로드

### ⌨️ Keyboard Navigation

- 화살표 키를 이용한 미디어 탐색
- Home/End 키로 첫/마지막 미디어 이동
- ESC 키로 갤러리 닫기
- Space 키로 재생/일시정지 (비디오)
- 키보드 단축키 도움말 (?)

### 🎨 User Experience

- 반응형 UI 디자인
- 다크/라이트 테마 지원
- 접근성 기능 내장 (ARIA 레이블, 포커스 관리)
- 부드러운 애니메이션

## 🔧 Technical Stack

- **Framework:** Solid.js 1.9.9
- **Build Tool:** Vite 7
- **Language:** TypeScript (strict mode)
- **Testing:** Vitest 3 + Playwright
- **Bundle Size:** ~270KB (production)

## 📥 Installation

1. 브라우저에 Userscript 매니저 설치
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox)

2. [최신 릴리즈 페이지](https://github.com/PiesP/xcom-enhanced-gallery/releases)에서 `.user.js` 파일 다운로드

3. X.com 방문하여 미디어가 포함된 게시물에서 갤러리 기능 확인

## 📖 Usage

- 트윗의 미디어를 클릭하면 Enhanced Gallery가 자동으로 활성화됩니다
- 툴바를 사용하여 다운로드, 레이아웃 변경 등의 작업 수행
- 키보드 단축키로 빠른 탐색 가능

## ⚙️ Requirements

- 최신 브라우저 (Chrome, Firefox, Edge, Safari 등)
- Userscript 매니저 확장 프로그램
- JavaScript 활성화

## 🔒 Privacy & Security

- 모든 처리는 클라이언트 측에서 수행
- 외부 서버로 데이터 전송 없음
- 오픈 소스 라이선스 (MIT)

## 📚 Documentation

- [개발자 가이드](../AGENTS.md)
- [코딩 가이드라인](../docs/CODING_GUIDELINES.md)
- [아키텍처 문서](../docs/ARCHITECTURE.md)
- [테스트 전략](../docs/TESTING_STRATEGY.md)

## 🤝 Contributing

기여를 환영합니다! [CONTRIBUTING.md](../.github/CONTRIBUTING.md)를 참고해주세요.

## 📄 License

MIT License - 자세한 내용은 [LICENSE](../LICENSE) 참조

---

**Note:** 이 파일은 프로젝트의 일반적인 릴리즈 정보를 담고 있습니다.
특정 버전의 상세 변경사항은 [GitHub Releases](https://github.com/PiesP/xcom-enhanced-gallery/releases)를 확인하세요.
