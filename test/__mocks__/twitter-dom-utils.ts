/**
 * Twitter DOM 테스트 유틸리티
 * 갤러리 활성화 테스트를 위한 DOM 생성 함수들
 */

/**
 * 테스트용 트윗 DOM 요소 생성
 * 갤러리 활성화 테스트를 위한 함수
 */
export function createMockTweet(): HTMLElement {
  const tweetElement = document.createElement('article');
  tweetElement.setAttribute('data-testid', 'tweet');
  tweetElement.setAttribute('role', 'article');
  tweetElement.className =
    'css-1dbjc4n r-1loqt21 r-18u37iz r-1ny4l3l r-1j3t67a r-o7ynqc r-6416eg r-13qz1uu';

  tweetElement.innerHTML = `
    <div class="css-1dbjc4n r-1iusvr4 r-16y2uox r-1777fci r-kzbkwu">
      <div class="css-1dbjc4n r-1awozwy r-18u37iz r-1h0z5md">
        <!-- 프로필 영역 -->
        <div class="css-1dbjc4n r-1wbh5a2 r-dnmrzs">
          <a href="/testuser" role="link" tabindex="-1">
            <img src="https://pbs.twimg.com/profile_images/123/avatar.jpg"
                 class="css-9pa8cd" draggable="true" alt="Profile">
          </a>
        </div>

        <!-- 트윗 내용 -->
        <div class="css-1dbjc4n r-1iusvr4 r-16y2uox r-1777fci r-1h8ys4a">
          <div class="css-1dbjc4n r-18u37iz r-1q142lx">
            <div class="css-1dbjc4n r-1s2bzr4">
              <!-- 텍스트 내용 -->
              <div data-testid="tweetText" class="css-901oao r-18jsvk2 r-37j5jr r-a023e6 r-16dba41 r-rjixqe r-bcqeeo r-bnwqim r-qvutc0">
                <span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">Test tweet with image</span>
              </div>

              <!-- 미디어 컨테이너 -->
              <div class="css-1dbjc4n r-1p0dtai r-18u37iz r-1d2f490 r-1ny4l3l r-u8s1d r-zchlnj r-ipm5af">
                <div data-testid="tweetPhoto" class="css-1dbjc4n r-1p0dtai r-1mlwlqe r-1d2f490 r-1udh08x r-u8s1d r-417010 r-1ny4l3l">
                  <div class="css-1dbjc4n r-1niwhzg r-vvn7in" style="padding-bottom: 75%;">
                    <div class="css-1dbjc4n r-1p0dtai r-1mlwlqe r-1d2f490 r-1udh08x r-u8s1d r-417010 r-1ny4l3l">
                      <div class="css-1dbjc4n">
                        <img src="https://pbs.twimg.com/media/test123.jpg?format=jpg&name=large"
                             alt="Test image"
                             draggable="true"
                             class="css-9pa8cd">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return tweetElement;
}

/**
 * 비디오가 포함된 테스트용 트윗 DOM 요소 생성
 */
export function createMockTweetWithVideo(): HTMLElement {
  const tweetElement = document.createElement('article');
  tweetElement.setAttribute('data-testid', 'tweet');
  tweetElement.setAttribute('role', 'article');
  tweetElement.className =
    'css-1dbjc4n r-1loqt21 r-18u37iz r-1ny4l3l r-1j3t67a r-o7ynqc r-6416eg r-13qz1uu';

  tweetElement.innerHTML = `
    <div class="css-1dbjc4n r-1iusvr4 r-16y2uox r-1777fci r-kzbkwu">
      <div class="css-1dbjc4n r-1awozwy r-18u37iz r-1h0z5md">
        <!-- 비디오 컨테이너 -->
        <div class="css-1dbjc4n r-1p0dtai r-18u37iz r-1d2f490 r-1ny4l3l r-u8s1d r-zchlnj r-ipm5af">
          <div data-testid="videoPlayer" class="css-1dbjc4n">
            <video src="https://video.twimg.com/test-video.mp4"
                   poster="https://pbs.twimg.com/video_thumb/test-thumb.jpg"
                   class="css-1dbjc4n"
                   preload="metadata">
            </video>
          </div>
        </div>
      </div>
    </div>
  `;

  return tweetElement;
}

/**
 * 이미지 클릭 핸들러 설정 함수
 */
export function setupImageClickHandlers(): void {
  // Mock 함수 - 실제 구현은 필요에 따라 추가
  console.log('Image click handlers set up for testing');
}
