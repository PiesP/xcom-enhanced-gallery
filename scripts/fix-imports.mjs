import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const mappings = {
  AnimationService: 'animation-service',
  BaseServiceImpl: 'base-service-impl',
  BulkDownloadService: 'bulk-download-service',
  EventManager: 'event-manager',
  LanguageService: 'language-service',
  MediaService: 'media-service',
  ServiceManager: 'service-manager',
  ThemeService: 'theme-service',
  ToastController: 'toast-controller',
  UnifiedToastManager: 'unified-toast-manager',
  DownloadOrchestrator: 'download-orchestrator',
  KeyboardNavigator: 'keyboard-navigator',
  FallbackExtractor: 'fallback-extractor',
  TwitterVideoExtractor: 'twitter-video-extractor',
  UsernameExtractionService: 'username-extraction-service',
  VideoControlService: 'video-control-service',
  MediaExtractionService: 'media-extraction-service',
  DOMDirectExtractor: 'dom-direct-extractor',
  TweetInfoExtractor: 'tweet-info-extractor',
  TwitterAPIExtractor: 'twitter-api-extractor',
  ClickedElementTweetStrategy: 'clicked-element-tweet-strategy',
  DataAttributeTweetStrategy: 'data-attribute-tweet-strategy',
  DomStructureTweetStrategy: 'dom-structure-tweet-strategy',
  ParentTraversalTweetStrategy: 'parent-traversal-tweet-strategy',
  UrlBasedTweetStrategy: 'url-based-tweet-strategy',
  FallbackStrategy: 'fallback-strategy',
  MediaMappingService: 'media-mapping-service',
  MediaTabUrlDirectStrategy: 'media-tab-url-direct-strategy',
  BatchDOMUpdateManager: 'batch-dom-update-manager',
  DOMBatcher: 'dom-batcher',
  focusTrap: 'focus-trap',
  MediaClickDetector: 'media-click-detector',
  ResourceManager: 'resource-manager',
  idleScheduler: 'idle-scheduler',
  signalOptimization: 'signal-optimization',
  signalSelector: 'signal-selector',
};

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

const files = [...getAllFiles('src'), ...getAllFiles('test')];
let count = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  let modified = false;

  for (const [old, newName] of Object.entries(mappings)) {
    // Match import/export statements
    const regex = new RegExp(`(from\\s+['"]([^'"]*/)?)${old}(['"])`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${newName}$3`);
      modified = true;
    }
  }

  if (modified) {
    writeFileSync(file, content, 'utf8');
    count++;
    console.log(`✓ ${file.replace(process.cwd(), '')}`);
  }
}

console.log(`\nTotal files updated: ${count}`);
