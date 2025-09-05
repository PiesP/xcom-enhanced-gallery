// Debug preact compat
import { getPreactCompat } from './src/shared/external/vendors/index.ts';

try {
  console.log('Testing getPreactCompat...');
  const compatAPI = getPreactCompat();
  console.log('compatAPI:', compatAPI);
  console.log('forwardRef type:', typeof compatAPI.forwardRef);
  console.log('memo type:', typeof compatAPI.memo);

  if (typeof compatAPI.forwardRef === 'function') {
    console.log('✅ forwardRef is available');
  } else {
    console.log('❌ forwardRef is not a function');
  }
} catch (error) {
  console.error('Error:', error.message);
}
