# 🚀 X.com Enhanced Gallery

> **Twitter(X)에서 이미지와 동영상을 고화질로 다운로드하고 편리하게 탐색하는
> 브라우저 확장**

[![설치하기](https://img.shields.io/badge/설치하기-클릭-brightgreen?style=for-the-badge)](https://github.com/PiesP/xcom-enhanced-gallery/raw/master/dist/xcom-enhanced-gallery.user.js)
[![Userscript](https://img.shields.io/badge/Userscript-Ready-orange)](https://github.com/OpenUserJS/OpenUserJS.org/wiki/Userscript-Beginners-HOWTO)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Chrome/Edge](https://img.shields.io/badge/Chrome%2FEdge-지원-4285F4)](https://www.google.com/chrome/)
[![Firefox](https://img.shields.io/badge/Firefox-지원-FF7139)](https://www.mozilla.org/firefox/)
[![Safari](https://img.shields.io/badge/Safari-지원-00D4FF)](https://www.apple.com/safari/)

X.com(트위터)에서 트윗의 모든 이미지와 동영상을 **고화질 원본**으로
다운로드하고, **세로 스크롤 갤러리**로 편리하게 탐색할 수 있는 **PC 환경 전용**
유저스크립트입니다.

## ✨ 주요 기능

### 🖼️ 향상된 갤러리 뷰어

- **세로 스크롤 갤러리**: 트윗의 모든 미디어를 한 번에 탐색
- **고화질 이미지**: 원본 해상도로 선명하게 표시
- **실시간 동영상 재생**: 썸네일에서 실제 MP4 동영상 추출 및 재생
- **반응형 디자인**: PC 환경에 최적화된 마우스/키보드 중심 인터페이스

### 💾 스마트 다운로드

- **고화질 원본**: Twitter 서버에서 최고 품질 이미지/동영상 다운로드
- **일괄 다운로드**: 트윗의 모든 미디어를 ZIP 파일로 한 번에 다운로드
- **스마트 파일명**: `작성자_날짜_내용` 형태로 자동 파일명 생성

### 🎨 자동 테마 시스템

- **이미지 기반 테마**: 현재 보는 이미지의 색상에 맞춰 자동 테마 변경
- **시간 기반 테마**: 낮/밤에 따른 자동 다크/라이트 모드
- **접근성 지원**: 고대비 모드 및 시각 장애인 지원

## 📥 설치 방법

### 1️⃣ 유저스크립트 매니저 설치

| 브라우저        | 추천 확장 프로그램                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **Chrome/Edge** | [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| **Firefox**     | [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/)                                  |
| **Safari**      | [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)                                      |

### 2️⃣ 스크립트 설치

<div align="center">

### 🔗 **[여기를 클릭하여 설치하기](https://github.com/PiesP/xcom-enhanced-gallery/raw/master/dist/xcom-enhanced-gallery.user.js)**

_클릭하면 유저스크립트 매니저에서 자동으로 설치 화면이 나타납니다_

</div>

### 3️⃣ 설치 확인

1. X.com에 접속
2. 아무 트윗의 이미지를 클릭
3. 향상된 갤러리가 자동으로 실행되는지 확인

## 🎮 사용법

### 기본 사용법

1. **갤러리 열기**: 트윗의 이미지나 동영상 썸네일 클릭
2. **이미지 탐색**:
   - 🖱️ **마우스 휠**: 위/아래 스크롤로 이미지 탐색
   - 🖱️ **네비게이션 버튼**: 화면 좌우 버튼 클릭
3. **동영상 재생**: 동영상에서 `Space` 키 또는 재생 버튼 클릭

### 다운로드 방법

| 버튼                 | 기능                  | 설명                                            |
| -------------------- | --------------------- | ----------------------------------------------- |
| 📥 **단일 다운로드** | 현재 이미지만         | 지금 보고 있는 이미지/동영상만 다운로드         |
| 📦 **전체 다운로드** | 모든 미디어를 ZIP으로 | 트윗의 모든 이미지/동영상을 압축파일로 다운로드 |

### 키보드 단축키

| 키           | 기능                  |
| ------------ | --------------------- |
| `←` `→`      | 이전/다음 이미지      |
| `Home` `End` | 첫 번째/마지막 이미지 |
| `Space`      | 동영상 재생/정지      |
| `Escape`     | 갤러리 닫기           |
| `F`          | 전체화면 토글         |

## 🔧 문제 해결

### 자주 묻는 질문 (FAQ)

<details>
<summary><strong>Q: 갤러리가 열리지 않아요</strong></summary>

**해결 방법**:

1. 유저스크립트 매니저가 활성화되어 있는지 확인
2. 스크립트가 x.com 도메인에서 실행되도록 설정되어 있는지 확인
3. 브라우저를 새로고침 후 다시 시도

</details>

<details>
<summary><strong>Q: 다운로드가 작동하지 않아요</strong></summary>

**해결 방법**:

1. 브라우저의 팝업 차단 해제
2. 다운로드 폴더에 쓰기 권한이 있는지 확인
3. 브라우저의 파일 다운로드 설정 확인

</details>

<details>
<summary><strong>Q: 이미지 화질이 낮아요</strong></summary>

**해결 방법**:

1. 스크립트가 최신 버전인지 확인
2. 네트워크 연결 상태 확인
3. 트위터 서버의 원본 이미지 가용성 확인

</details>

### 기술적 지원

문제가 지속되면 다음 정보와 함께
[이슈를 등록](https://github.com/PiesP/xcom-enhanced-gallery/issues)해 주세요:

- 브라우저 종류 및 버전
- 유저스크립트 매니저 종류 및 버전
- 발생한 오류 메시지
- 재현 단계

## 📄 라이센스

이 프로젝트는 [MIT 라이센스](LICENSE) 하에 배포됩니다.

### 사용된 오픈소스 라이브러리

- **Preact** (MIT) - 고성능 React 호환 라이브러리
- **@preact/signals** (MIT) - 반응형 상태 관리
- **fflate** (MIT) - 고성능 압축 라이브러리

모든 라이센스 정보는 [`LICENSES/`](LICENSES/) 디렉토리에서 확인할 수 있습니다.

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면:

1. 이 저장소를 포크하세요
2. 새로운 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

개발 환경 설정 및 상세한 기여 가이드는 [`docs/`](docs/) 디렉토리의 문서를
참고하세요.

---

<div align="center">

**🌟 이 프로젝트가 유용하다면 Star를 눌러주세요! 🌟**

Made with ❤️ by X.com Enhanced Gallery Team

</div>
