# 인용 리트윗 DOM 구조 상세 분석

**작성일**: 2025-11-04
**대상**: 개발자, 테스터
**참고**: X.com 2025년 최신 마크업 기준

---

## 🏗️ DOM 계층 구조

### 기본 DOM 구조 (HTML)

```html
<!-- 외부 컨테이너 (인용 리트윗 스레드) -->
<div role="main" aria-label="Home timeline">
  <div>
    <!-- 인용 리트윗 (유저 A의 코멘트) -->
    <article data-testid="tweet" role="article" tabindex="0">
      <!-- 헤더: 인용 리트윗 작성자 정보 -->
      <div>
        <a href="/userA">
          <img alt="userA's avatar" src="...userA-avatar.jpg"/>
        </a>
        <div>
          <a href="/userA">
            <span>User A Name</span>
            <span>@userA</span>
          </a>
        </div>
      </div>

      <!-- 본문: 인용 리트윗 텍스트 (코멘트) -->
      <div>
        <div>
          <span>This is my comment on this tweet</span>
        </div>
      </div>

      <!-- 인용 블록: 원본 트윗 포함 -->
      <div>
        <!-- ✅ 핵심: 내부 article 요소 -->
        <article data-testid="tweet" role="article">
          <!-- 원본 트윗 헤더 -->
          <div>
            <a href="/userB">
              <img alt="userB's avatar" src="...userB-avatar.jpg"/>
            </a>
            <div>
              <a href="/userB">
                <span>User B Name</span>
                <span>@userB</span>
              </a>
            </div>
          </div>

          <!-- 원본 트윗 본문 -->
          <div>
            <span>Original tweet text with media</span>
          </div>

          <!-- ✅ 미디어 컨테이너: 내부 article 내부 -->
          <div>
            <!-- 이미지 1 -->
            <div data-testid="tweetPhoto" role="link" tabindex="-1">
              <img
                alt="Image posted in tweet"
                src="https://pbs.twimg.com/media/xyz123w.jpg"
              />
            </div>

            <!-- 이미지 2 -->
            <div data-testid="tweetPhoto" role="link" tabindex="-1">
              <img
                alt="Image posted in tweet"
                src="https://pbs.twimg.com/media/xyz124w.jpg"
              />
            </div>
          </div>

          <!-- 액션 버튼 (좋아요, 리트윗 등) -->
          <div role="group">
            <button data-testid="reply">...</button>
            <button data-testid="retweet">...</button>
            <button data-testid="like">...</button>
            <button data-testid="share">...</button>
          </div>
        </article>
      </div>

      <!-- 외부 트윗 액션 버튼 -->
      <div role="group">
        <button data-testid="reply">...</button>
        <button data-testid="retweet">...</button>
        <button data-testid="like">...</button>
        <button data-testid="share">...</button>
      </div>
    </article>
  </div>
</div>
```

---

## 🎯 선택자 매칭 분석

### 선택자: `article[data-testid="tweet"]`

```
DOM 트리 검색:
  ↓
article[data-testid="tweet"]  ← article #1 (인용 리트윗)
  ├─ 내용...
  └─ article[data-testid="tweet"]  ← article #2 (원본 트윗) ★ NESTED
      ├─ 내용...
      └─ img (미디어) ★ 여기에 있음
```

### 문제: `closest()` 사용 시

```javascript
// 상황: 이미지 클릭
const img = document.querySelector('img[src*="pbs.twimg"]');

// closest()는 상향식 탐색 (자신 포함, 조상만)
const closestArticle = img.closest('article[data-testid="tweet"]');
// → article #2 (원본 트윗) ✅ 올바름
// 하지만 복잡한 경우...

// 만약 article #1이 깨진 DOM이면?
// → article #1 매칭될 수 있음 ❌
```

### 해결책: 다중 조건 검증

```javascript
// ✅ 개선된 접근
function getCorrectArticle(clickedElement) {
  let current = clickedElement;
  let foundArticles = [];

  // 모든 조상 article 수집
  while (current) {
    if (current.matches('article[data-testid="tweet"]')) {
      foundArticles.push(current);
    }
    current = current.parentElement;
  }

  // 가장 가까운 (마지막) article 선택
  // (인용 리트윗인 경우 원본, 일반 트윗인 경우 그 트윗)
  return foundArticles[foundArticles.length - 1];
}
```

---

## 🔍 인용 리트윗 감지 알고리즘

### 알고리즘 흐름

```
입력: clickedElement (클릭된 DOM 요소)

1️⃣ 가장 가까운 article 찾기
   closestArticle = clickedElement.closest('article[data-testid="tweet"]')

2️⃣ 내부에 중첩된 article 확인
   nestedArticle = closestArticle.querySelector('article[data-testid="tweet"]')

3️⃣ 클릭된 요소의 위치 판단
   if (nestedArticle.contains(clickedElement)) {
     → clickedLocation = 'quoted'   (원본 트윗 내부)
   } else {
     → clickedLocation = 'original' (인용 작성자 부분)
   }

4️⃣ 결론
   if (nestedArticle exists) {
     → isQuoteTweet = true
     → targetArticle = 해당 위치의 article
   } else {
     → isQuoteTweet = false
     → targetArticle = closestArticle
   }

출력: { isQuoteTweet, clickedLocation, targetArticle }
```

### 실행 예제

#### 예제 1: 원본 트윗 내 이미지 클릭

```html
<article #1 data-testid="tweet">  <!-- 인용 리트윗 -->
  <div>유저 A 코멘트</div>
  <article #2 data-testid="tweet">  <!-- 원본 트윗 -->
    <div>원본 텍스트</div>
    <img id="target" src="..."/>  <!-- 👈 클릭 -->
  </article>
</article>
```

```javascript
const target = document.getElementById('target');

// Step 1
const closestArticle = target.closest('article[data-testid="tweet"]');
// → #2 (원본 트윗)

// Step 2
const nestedArticle = closestArticle.querySelector('article[data-testid="tweet"]');
// → null (자신 내부에 article 없음)

// Step 3 (미적용)

// Step 4
// isQuoteTweet = false
// targetArticle = #2
// ❌ 잘못됨! (#1과 #2의 관계 미파악)
```

✅ **개선된 버전**:

```javascript
// 모든 조상 article 수집
const target = document.getElementById('target');
let current = target;
const articles = [];

while (current) {
  if (current.matches('article[data-testid="tweet"]')) {
    articles.push(current);  // [#2, #1] (가장 가까운 것부터)
  }
  current = current.parentElement;
}

// articles[0] = #2 (원본 트윗)
// articles[1] = #1 (인용 리트윗)
//
// isQuoteTweet = articles.length > 1 → true
// clickedLocation = articles[0] === articles[0] ? 'quoted' : 'original'
// targetArticle = articles[0] (원본 트윗, 미디어 있음)
```

#### 예제 2: 인용 리트윗 본문 클릭

```html
<article #1 data-testid="tweet">  <!-- 인용 리트윗 -->
  <div id="target">유저 A 코멘트</div>  <!-- 👈 클릭 -->
  <article #2 data-testid="tweet">  <!-- 원본 트윗 -->
    ...
  </article>
</article>
```

```javascript
const target = document.getElementById('target');

// 조상 article 수집
const articles = [];
let current = target;
while (current) {
  if (current.matches('article[data-testid="tweet"]')) {
    articles.push(current);  // [#1]
  }
  current = current.parentElement;
}

// isQuoteTweet = articles.length > 1 → false
// clickedLocation = 'original'
// targetArticle = #1 (인용 리트윗)
//
// 문제: #1에 미디어가 없으면?
// → 미디어 없음 응답 또는 폴백 필요
```

---

## 📍 미디어 요소 위치

### 일반 트윗에서 미디어

```
article[data-testid="tweet"]
└─ div (본문)
   └─ div (미디어 컨테이너)
      ├─ [data-testid="tweetPhoto"]
      │  └─ img (또는 picture > img)
      └─ [data-testid="videoPlayer"]
         └─ video
```

### 인용 리트윗에서 미디어 위치 (중요! ⚠️)

```
article[data-testid="tweet"] (인용 리트윗)
├─ div (인용 작성자)
├─ div (인용 텍스트)
│  └─ 미디어: ❌ 없음 (일반적으로)
└─ article[data-testid="tweet"] (원본 트윗)
   ├─ div (원본 작성자)
   ├─ div (원본 텍스트)
   └─ div (미디어 컨테이너) ✅ 여기!
      ├─ [data-testid="tweetPhoto"]
      └─ [data-testid="videoPlayer"]
```

### 선택자 전략

```javascript
// ❌ 위험: 전체 DOM 검색
const allImages = tweetArticle.querySelectorAll('img');
// → 다중 미디어 (인용 + 원본) 모두 선택

// ✅ 안전: 범위 제한
const targetArticle = /* 인용 구조 분석으로 결정 */;
const images = targetArticle.querySelectorAll('img');
// → 특정 트윗의 미디어만 선택

// ✅ 최우선: 직접 자식만
const mediaContainers = targetArticle.querySelectorAll(
  ':scope > div > [data-testid="tweetPhoto"], ' +
  ':scope > div > [data-testid="videoPlayer"]'
);
// → 최대한 정확한 범위
```

---

## 🎬 실시간 시나리오

### 시나리오 A: 사용자가 인용 리트윗 갤러리를 열음

```
[사용자 행동]
1. 트윗피드에서 인용 리트윗 발견
2. 원본 트윗의 이미지 클릭
3. 갤러리 열어야 함 → 어떤 미디어를 보여줄까?

[기대 동작]
- 원본 트윗의 미디어만 표시
- 인용 리트윗 본문의 미디어는 제외

[현재 구현 (문제)]
- closest()로 첫 article 선택
- 인용 리트윗 article 선택될 수 있음
- 원본 미디어 못 찾음 ❌

[개선된 구현]
1. QuoteTweetDetector 분석
2. targetArticle = 원본 트윗 article
3. 원본 미디어만 추출 ✅
```

### 시나리오 B: API에서 전체 미디어 조회

```
[입력]
tweetId = '12345' (인용 리트윗의 ID)

[API 응답 (현재)]
{
  screen_name: 'userA',     // 인용 작성자
  tweet_id: '12345',        // 인용 리트윗 ID
  medias: [
    { url: '...photo1' },   // 원본의 첫 이미지
    { url: '...photo2' }    // 원본의 두번째 이미지
  ]
}

[문제점]
- screen_name이 원본 작성자가 아님
- 사용자는 'userA'가 이 이미지를 촬영했다고 착각

[개선된 API 응답]
{
  // 인용 리트윗 정보
  screen_name: 'userA',
  tweet_id: '12345',

  // 원본 트윗 정보 추가
  quoted_screen_name: 'userB',
  quoted_tweet_id: '67890',

  medias: [
    {
      url: '...photo1',
      source: 'quoted',        // 원본 트윗의 미디어
      original_author: 'userB'
    },
    {
      url: '...photo2',
      source: 'quoted',
      original_author: 'userB'
    }
  ]
}

[파일명]
userB_67890_photo_1.jpg  // 원본 작성자의 ID 포함
```

---

## 🧪 테스트 케이스 체크리스트

### DOM 감지 테스트

- [ ] 일반 트윗: `isQuoteTweet = false`
- [ ] 인용 리트윗: `isQuoteTweet = true`
- [ ] 깊게 중첩된 div: 올바른 article 선택
- [ ] 인용 리트윗 본문 클릭: `clickedLocation = 'original'`
- [ ] 원본 트윗 내 미디어 클릭: `clickedLocation = 'quoted'`

### 미디어 추출 테스트

- [ ] 인용 리트윗 1개 이미지: 1개 반환
- [ ] 인용 리트윗 2개 이미지: 2개 반환 (중복 없음)
- [ ] 인용 + 원본 각각 미디어: 순서대로 반환
- [ ] 인용에만 미디어: 인용 미디어만
- [ ] 원본에만 미디어: 원본 미디어만
- [ ] 미디어 없음: 빈 배열

### API 응답 테스트

- [ ] `quoted_status_result` 필드 파싱
- [ ] 메타데이터 정확성 (작성자, 트윗 ID)
- [ ] 이미지/비디오 혼합
- [ ] 매우 긴 트윗 본문 (note_tweet)

---

## 🔗 참고 자료

| 주제 | 파일 |
|------|------|
| **아키텍처** | `docs/ARCHITECTURE.md` |
| **미디어 추출** | `src/shared/services/media-extraction/` |
| **타입 정의** | `src/shared/types/media.types.ts` |
| **트윗 정보 추출** | `src/shared/services/media-extraction/strategies/` |

---
