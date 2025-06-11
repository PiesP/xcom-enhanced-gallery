/**
 * Script to replace console.log statements with debugTweetExtraction calls
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'src',
  'shared',
  'utils',
  'media',
  'enhanced-tweet-extractor.ts'
);

try {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace console.log patterns with debugTweetExtraction
  content = content.replace(
    /console\.log\('🔍 \[XEG-DEBUG\] ([^']+)', ([^)]+)\);/g,
    "debugTweetExtraction('$1', $2);"
  );

  content = content.replace(
    /console\.log\('🔍 \[XEG-DEBUG\] ([^']+)'\);/g,
    "debugTweetExtraction('$1');"
  );

  content = content.replace(
    /console\.log\(`🔍 \[XEG-DEBUG\] ([^`]+)`\);/g,
    "debugTweetExtraction('$1');"
  );

  content = content.replace(
    /console\.log\(`🔍 \[XEG-DEBUG\] ([^`]+)`, ([^)]+)\);/g,
    'debugTweetExtraction(`$1`, $2);'
  );

  // Replace console.warn patterns
  content = content.replace(
    /console\.warn\('⚠️ \[XEG-DEBUG\] ([^']+)'\);/g,
    "debugTweetExtraction('⚠️ $1');"
  );

  content = content.replace(
    /console\.warn\(`⚠️ \[XEG-DEBUG\] ([^`]+)`\);/g,
    "debugTweetExtraction('⚠️ $1');"
  );

  // Replace console.error patterns
  content = content.replace(
    /console\.error\('❌ \[XEG-DEBUG\] ([^']+)', ([^)]+)\);/g,
    "logger.error('$1', $2);"
  );

  // Replace success patterns
  content = content.replace(
    /console\.log\('✅ \[XEG-DEBUG\] ([^']+)', ([^)]+)\);/g,
    "debugTweetExtraction('✅ $1', $2);"
  );

  content = content.replace(
    /console\.log\(`✅ \[XEG-DEBUG\] ([^`]+)`, ([^)]+)\);/g,
    "debugTweetExtraction('✅ $1', $2);"
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Console statements replaced successfully');
} catch (error) {
  console.error('❌ Error replacing console statements:', error);
}
