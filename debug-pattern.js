// Quick debug script for pattern matching
console.log('=== Pattern Matching Debug ===');

const urls = [
  'https://x.com/user1/status/123',
  'https://twitter.com/user2/status/456',
  'https://facebook.com/posts/789',
  'https://pbs.twimg.com/media/ABC.jpg',
];

console.log('\nOriginal URLs:');
urls.forEach((url, index) => {
  console.log(`${index}: ${url}`);
});

console.log('\nTesting "twitter" pattern:');
const regex = new RegExp('twitter', 'i');
urls.forEach((url, index) => {
  const matches = regex.test(url);
  console.log(`${index}: ${url} -> ${matches}`);
});

console.log('\nFiltered results:');
const filtered = urls.filter(url => regex.test(url));
console.log('Count:', filtered.length);
console.log('URLs:', filtered);
