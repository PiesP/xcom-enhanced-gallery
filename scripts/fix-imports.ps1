$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx"
$pattern = @{
    'AnimationService' = 'animation-service'
    'BaseServiceImpl' = 'base-service-impl'
    'BulkDownloadService' = 'bulk-download-service'
    'EventManager' = 'event-manager'
    'LanguageService' = 'language-service'
    'MediaService' = 'media-service'
    'ServiceManager' = 'service-manager'
    'ThemeService' = 'theme-service'
    'ToastController' = 'toast-controller'
    'UnifiedToastManager' = 'unified-toast-manager'
    'DownloadOrchestrator' = 'download-orchestrator'
    'KeyboardNavigator' = 'keyboard-navigator'
    'FallbackExtractor' = 'fallback-extractor'
    'TwitterVideoExtractor' = 'twitter-video-extractor'
    'UsernameExtractionService' = 'username-extraction-service'
    'VideoControlService' = 'video-control-service'
    'MediaExtractionService' = 'media-extraction-service'
    'DOMDirectExtractor' = 'dom-direct-extractor'
    'TweetInfoExtractor' = 'tweet-info-extractor'
    'TwitterAPIExtractor' = 'twitter-api-extractor'
    'ClickedElementTweetStrategy' = 'clicked-element-tweet-strategy'
    'DataAttributeTweetStrategy' = 'data-attribute-tweet-strategy'
    'DomStructureTweetStrategy' = 'dom-structure-tweet-strategy'
    'ParentTraversalTweetStrategy' = 'parent-traversal-tweet-strategy'
    'UrlBasedTweetStrategy' = 'url-based-tweet-strategy'
    'FallbackStrategy' = 'fallback-strategy'
    'MediaMappingService' = 'media-mapping-service'
    'MediaTabUrlDirectStrategy' = 'media-tab-url-direct-strategy'
    'BatchDOMUpdateManager' = 'batch-dom-update-manager'
    'DOMBatcher' = 'dom-batcher'
    'focusTrap' = 'focus-trap'
    'MediaClickDetector' = 'media-click-detector'
    'ResourceManager' = 'resource-manager'
    'idleScheduler' = 'idle-scheduler'
    'signalOptimization' = 'signal-optimization'
    'signalSelector' = 'signal-selector'
}

$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $modified = $false
    
    foreach ($old in $pattern.Keys) {
        $new = $pattern[$old]
        if ($content -match "from ['""][^'""]*/$old['""]) {
            $content = $content -replace "(['""][^'""]*/)$old(['""]\s*;)", "`${1}$new`$2"
            $modified = $true
        }
    }
    
    if ($modified) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
        $count++
        Write-Host "✓ $($file.Name)"
    }
}

Write-Host "`nUpdated: $count files"
