# X.com Enhanced Gallery

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md)

X.com 게시물의 이미지와 동영상을 키보드로 편리하게 탐색할 수 있는 전용
갤러리에서 보고 원본 미디어를 다운로드합니다. 사용자 스크립트, 압축을 푼
Chrome 확장 프로그램, 임시 Firefox 확장 프로그램으로 사용할 수 있습니다.

## 기능

- 이미지, 동영상, GIF 및 지원되는 카드 미디어를 위한 세로 갤러리
- 원본 화질의 개별 다운로드 및 일괄 ZIP 다운로드
- 데스크톱 브라우저에서 키보드, 포인터 및 휠 탐색
- 원본, 너비, 높이 및 컨테이너 맞춤 이미지 표시 모드
- 테마, 언어, 재생 및 갤러리 설정 저장
- 프로젝트 자체 분석, 원격 측정 또는 개발자 운영 서버 없음

## 설치

### 사용자 스크립트

[Tampermonkey](https://www.tampermonkey.net/) 또는
[Violentmonkey](https://violentmonkey.github.io/) 같은 사용자 스크립트 관리자를
설치한 뒤 [최신 사용자 스크립트](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js)를
설치합니다.

사용자 스크립트는 헤더에 포함된 메타데이터 URL을 통해 업데이트를 확인합니다.

### Chrome, Edge 또는 Brave 확장 프로그램

릴리스 압축 파일은 압축을 풀어 사용하는 개발자용 빌드입니다. 브라우저
스토어에서 설치되지 않으며 자동으로 업데이트되지 않습니다.

1. [최신 릴리스](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest)에서
   `xcom-enhanced-gallery-chrome.zip`을 다운로드합니다.
2. 압축 파일을 영구적으로 유지할 디렉터리에 풉니다.
3. `chrome://extensions`를 열고 **개발자 모드**를 켭니다.
4. **압축해제된 확장 프로그램을 로드합니다**를 선택하고 압축을 푼 디렉터리를
   지정합니다.

### Firefox 확장 프로그램

1. [최신 릴리스](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest)에서
   `xcom-enhanced-gallery-firefox.zip`을 다운로드합니다.
2. `about:debugging#/runtime/this-firefox`를 엽니다.
3. **임시 부가 기능 로드**를 선택하고 ZIP 파일을 지정합니다.

이 개발자용 설치는 Firefox를 다시 시작하면 제거됩니다. 계속 설치해 두려면
사용자 스크립트를 사용하세요.

## 사용법

1. 미디어가 포함된 X.com 게시물을 엽니다.
2. 이미지나 동영상을 선택해 향상된 갤러리를 엽니다.
3. 화살표 키, 탐색 버튼 또는 휠로 항목을 이동합니다.
4. 도구 모음에서 표시 모드를 바꾸거나 현재 항목 또는 모든 미디어를 ZIP으로
   다운로드합니다.

이 갤러리는 데스크톱 브라우저용이며 모바일이나 터치 조작 흐름을 제공하지
않습니다.

## 브라우저 지원

| 배포 방식 | 지원 범위 |
| --- | --- |
| 사용자 스크립트 | Chrome/Edge 123+, Firefox 128+, Safari 17.5+ |
| Chromium 확장 프로그램 | 최신 데스크톱 Chrome, Edge 및 Brave의 개발자 모드 |
| Firefox 확장 프로그램 | Firefox 128+ 임시 개발자 설치 |

사용자 스크립트의 최소 호환 버전은
[`tooling/vite/browser-support.ts`](./tooling/vite/browser-support.ts)의
`USERSCRIPT_BROWSER_SUPPORT`에서 정의합니다. Firefox 확장 프로그램의 최소
버전은 [`extension/manifest.firefox.json`](./extension/manifest.firefox.json)에서
정의합니다.

## 개인정보 보호 및 보안

프로젝트는 페이지 콘텐츠와 다운로드를 브라우저 안에서 처리합니다. 실행 중
요청은 갤러리 추출과 다운로드에 필요한 X/Twitter 페이지, API 및 미디어
호스트로 제한됩니다. 플랫폼 및 저장소 세부 정보는
[개인정보 보호](./PRIVACY.md), 취약점 신고 방법은
[보안 정책](./.github/SECURITY.md)을 참고하세요.

## 개발

이 프로젝트는 AI 도구의 도움을 받아 개발됩니다.

설정, 명령, 프로젝트 제약 및 풀 리퀘스트 요건은
[기여 안내](./CONTRIBUTING.md)를 참고하세요.

## 지원

- 버그, 기능 요청 및 질문: [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)
- 릴리스 기록: [변경 기록](./CHANGELOG.md)
- 취약점: [보안 정책](./.github/SECURITY.md)

## 라이선스

MIT. [LICENSE](./LICENSE), [NOTICE](./NOTICE.md) 및 함께 제공되는
[서드 파티 라이선스](./LICENSES/)를 참고하세요.
