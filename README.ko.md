# X.com Enhanced Gallery

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md)

X.com 게시물의 이미지와 동영상을 키보드로 편리하게 탐색할 수 있는 전용
갤러리에서 보고 확인된 품질로 저장합니다. 사용자 스크립트, 압축을 푼
Chrome 확장 프로그램, 임시 Firefox 확장 프로그램으로 사용할 수 있습니다.

## 기능

- 이미지, 동영상, GIF 및 지원되는 카드 미디어를 위한 세로 갤러리
- 확인된 CDN 원본 크기 사진과 지원 미디어의 개별·일괄 ZIP 다운로드
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

사용자 스크립트 관리자는 스크립트 헤더의 메타데이터 URL로 업데이트를 확인할
수 있습니다. 업데이트가 제시되면 관리자 화면에서 내용을 확인하고 승인하세요.

설치된 스크립트의 `@downloadURL`이 특정 버전으로 고정되어 있으면 새 버전을
찾아도 이전 스크립트를 다시 받을 수 있습니다. 수정된 버전이 공개된 뒤에는
관리자에서 기존 스크립트를 [최신 사용자 스크립트](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js)로
한 번 업데이트하거나, 확인된 관리자 절차에 따라 다운로드 URL을 바꾸세요.
**업데이트 확인**만으로는 고정된 URL이 바뀌지 않습니다. 업데이트 후 설치된
헤더와 저장된 설정을 확인하세요.

### Chrome, Edge 또는 Brave 확장 프로그램

릴리스 압축 파일은 압축을 풀어 사용하는 개발자용 빌드입니다. 브라우저
스토어에서 설치되지 않으며 자동으로 업데이트되지 않습니다.

1. [최신 릴리스](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest)에서
   `xcom-enhanced-gallery-chrome.zip`을 다운로드합니다.
2. 압축 파일을 영구적으로 유지할 디렉터리에 풉니다.
3. `chrome://extensions`를 열고 **개발자 모드**를 켭니다.
4. **압축해제된 확장 프로그램을 로드합니다**를 선택하고 압축을 푼 디렉터리를
   지정합니다.

새 버전을 설치할 때는 같은 디렉터리의 파일을 교체하고
`chrome://extensions`에서 확장 프로그램을 다시 로드하세요. 업데이트 후
저장된 설정을 확인하세요.

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

동영상 클릭은 저장된 클릭 모드를 따릅니다. 갤러리는 저장된 음량을 사용해
별도의 동영상 플레이어를 처음부터 엽니다. X의 재생 위치를 이어받지 않으며,
갤러리를 닫아도 X의 플레이어를 다시 시작하지 않습니다. 추출에 실패하면
안내에 따라 X의 기본 플레이어로 돌아갈 수 있습니다.
[동영상 클릭 정책](./docs/video-click-policy.md)을 참고하세요.

게시물 미디어를 추출할 수 없으면 게시물 링크로 소유자가 확인된 타일에서
보이고 접근 가능한 미디어만 복구할 수 있습니다. 이 경우 알림이 표시되며,
일괄 ZIP 다운로드에는 갤러리에 표시된 항목만 포함됩니다. 타일 하나만으로
게시물의 전체 첨부파일을 확인할 수는 없습니다.

일반 CDN 사진의 저장 소스는 화면 표시 소스와 따로 확인합니다. CDN의 원본
크기는 업로더 파일과 바이트가 같다는 뜻이 아닙니다. 원본 크기 소스를 확인할
수 없으면 더 작은 사진을 몰래 저장하지 않고 실패를 알립니다. DOM에서 복구한
동영상은 관찰된 소스의 화질에 제한되며, 갤러리에서 재생되는 화질과 저장할
소스의 화질은 다를 수 있습니다. HLS만 있는 항목은 이 흐름에서 지원되는 MP4가
필요합니다. [미디어 소스 정책](./docs/media-sources.md)을 참고하세요.

동영상은 현재 항목이거나 갤러리 화면 가까이에 있을 때 소스를 연결합니다.
지원되는 다른 MP4로 재생을 복구하더라도 저장 소스는 바뀌지 않습니다.

다운로드 데이터는 페이지 안의 용량 한도를 공유합니다. 한도에 도달하면 진행
중인 다운로드가 끝날 때까지 기다리세요. 진행 중인 다운로드가 없는데도
계속 한도에 걸리면 페이지를 새로고침하고 한 번에 더 적은 파일을 받아 보세요. 사용자
스크립트로 저장한 데이터의 용량은 페이지를 새로고침하거나 닫을 때까지 유지될
수 있습니다. 갤러리를 다시 열어도 이 용량은 반환되지 않으며, 공유 한도는 파일
하나마다 쓸 수 있는 용량이 아닙니다. 메모리 한도로 일부 파일만 담긴 ZIP의
알림은 포함된 파일과 제외된 파일의 수를 모두 알려줍니다. 다른 부분 ZIP의
알림은 가져오지 못한 항목 수만 알려줍니다. 범위는
[다운로드 소유권 규칙](./docs/download-memory.md)을 참고하세요.

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
