// 간단한 URL 검증 테스트
const testUrl = 'https://pbs.twimg.com/media/F1a2b3c4d5e.jpg?format=jpg&name=large';

console.log('Testing URL:', testUrl);

try {
  const urlObj = new URL(testUrl);
  console.log('URL parsed successfully');
  console.log('Hostname:', urlObj.hostname);
  console.log('Pathname:', urlObj.pathname);
  console.log('Has /media/:', urlObj.pathname.includes('/media/'));
  console.log('Has profile_images:', urlObj.pathname.includes('/profile_images/'));

  // Simulate validation logic
  const isValid =
    urlObj.hostname === 'pbs.twimg.com' &&
    urlObj.pathname.includes('/media/') &&
    !urlObj.pathname.includes('/profile_images/');

  console.log('Should be valid:', isValid);
} catch (error) {
  console.error('URL parsing failed:', error);
}
