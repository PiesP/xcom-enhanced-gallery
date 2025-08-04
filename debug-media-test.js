// 디버그용 스크립트
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div id="react-root">
    <div data-testid="primaryColumn">
      <article data-testid="tweet">
        <div data-testid="tweetPhoto">
          <img src="https://pbs.twimg.com/media/test.jpg" alt="Test">
        </div>
      </article>
    </div>
  </div>
</body>
</html>
`);

// eslint-disable-next-line no-undef
global.document = dom.window.document;
// eslint-disable-next-line no-undef
global.window = dom.window;

const selector =
  '[data-testid="tweetPhoto"], [data-testid="videoPlayer"], img[src*="pbs.twimg.com"]';
// eslint-disable-next-line no-undef
console.log('Selector:', selector);

// eslint-disable-next-line no-undef
const elements = document.querySelectorAll(selector);
// eslint-disable-next-line no-undef
console.log('Found elements:', elements.length);

Array.from(elements).forEach((el, i) => {
  // eslint-disable-next-line no-undef
  console.log(`Element ${i}:`, el.tagName, el.getAttribute('data-testid'), el.src);
});

const images = Array.from(elements).filter(el => el.tagName.toLowerCase() === 'img');
// eslint-disable-next-line no-undef
console.log('Images found:', images.length);
