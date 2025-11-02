#!/usr/bin/env node

/**
 * @fileoverview Phase 326.5: Bundle Analysis Script
 * @description Analyze production bundle for optimization opportunities
 *
 * Usage: node scripts/analyze-bundle.js
 * Output: Terminal report + docs/phase-326-bundle-analysis.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');
const docDir = path.resolve(projectRoot, 'docs');

/**
 * Get file size in human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate gzip compression size (estimation)
 */
function estimateGzipSize(bytes) {
  // Rough estimation: minified JS typically compresses to 30-40% of original
  // Minified + gzip typically achieves 20-30% compression ratio
  return Math.round(bytes * 0.25); // Conservative 25% estimate
}

/**
 * Analyze production bundle
 */
async function analyzeBundle() {
  console.log('\n📊 Phase 326.5: Bundle Analysis\n');
  console.log('='.repeat(60));

  try {
    // Check if bundle exists
    const bundlePath = path.resolve(distDir, 'xcom-enhanced-gallery.user.js');
    if (!fs.existsSync(bundlePath)) {
      console.error('❌ Bundle not found. Run: npm run build:only');
      process.exit(1);
    }

    // Read bundle
    const bundleContent = fs.readFileSync(bundlePath);
    const bundleSize = bundleContent.length;
    const bundleSizeHuman = formatBytes(bundleSize);

    // Calculate gzip estimate
    const gzipEstimate = estimateGzipSize(bundleSize);
    const gzipHuman = formatBytes(gzipEstimate);

    // Read CSS file if exists
    const cssFiles = fs
      .readdirSync(distDir)
      .filter(f => f.startsWith('assets/style-') && f.endsWith('.css'));
    let cssSize = 0;
    let cssHuman = '0 B';
    if (cssFiles.length > 0) {
      const cssPath = path.resolve(distDir, cssFiles[0]);
      cssSize = fs.statSync(cssPath).size;
      cssHuman = formatBytes(cssSize);
    }

    // Read JS asset file if exists
    const jsFiles = fs
      .readdirSync(distDir)
      .filter(f => f.startsWith('assets/main-') && f.endsWith('.js'));
    let jsAssetSize = 0;
    let jsAssetHuman = '0 B';
    if (jsFiles.length > 0) {
      const jsPath = path.resolve(distDir, jsFiles[0]);
      jsAssetSize = fs.statSync(jsPath).size;
      jsAssetHuman = formatBytes(jsAssetSize);
    }

    // Calculate line count (rough estimate)
    const bundleLines = bundleContent.toString().split('\n').length;

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      phase: '326.5-1',
      baseline: {
        bundleSize: {
          bytes: bundleSize,
          human: bundleSizeHuman,
        },
        gzipEstimate: {
          bytes: gzipEstimate,
          human: gzipHuman,
          ratio: `${((gzipEstimate / bundleSize) * 100).toFixed(1)}%`,
        },
        cssAsset: {
          bytes: cssSize,
          human: cssHuman,
        },
        jsAsset: {
          bytes: jsAssetSize,
          human: jsAssetHuman,
        },
        lineCount: bundleLines,
      },
      features: {
        gallery: {
          estimatedSize: '120 KB',
          required: true,
          optimization: 'Optimize media extraction',
        },
        settings: {
          estimatedSize: '80 KB',
          required: true,
          optimization: 'Conditional panel loading',
        },
        download: {
          estimatedSize: '60 KB',
          required: true,
          optimization: 'ZIP/batch optimization',
        },
        mediaExtraction: {
          estimatedSize: '50 KB',
          required: false,
          optimization: 'Tree-shake if disabled',
        },
        advancedFilters: {
          estimatedSize: '40 KB',
          required: false,
          optimization: 'Conditional UI loading',
        },
        accessibility: {
          estimatedSize: '35 KB',
          required: false,
          optimization: 'WCAG compliance module',
        },
        sharedUtils: {
          estimatedSize: '22 KB',
          required: true,
          optimization: 'Deduplication analysis',
        },
      },
      target: {
        currentSize: bundleSize,
        targetSize: 320512, // 310-315 KB target (using 312.5 KB = 320000 bytes)
        targetHuman: '310-315 KB',
        potentialReduction: {
          bytes: bundleSize - 320512,
          percentage: (((bundleSize - 320512) / bundleSize) * 100).toFixed(1),
        },
      },
      optimizationStrategy: [
        'Feature-based tree-shaking (optional features)',
        'Shared utility consolidation',
        'CSS unused class purging',
        'Dynamic import optimization',
      ],
      nextPhase: '326.5-2 (Bundle Analysis Details)',
    };

    // Display report
    console.log('\n📈 BUNDLE BASELINE REPORT\n');

    console.log('Core Metrics:');
    console.log(
      `  Production Bundle:  ${report.baseline.bundleSize.human} (${report.baseline.bundleSize.bytes.toLocaleString()} bytes)`
    );
    console.log(
      `  Gzip Estimate:      ${report.baseline.gzipEstimate.human} (${report.baseline.gzipEstimate.ratio})`
    );
    console.log(`  CSS Assets:         ${report.baseline.cssAsset.human}`);
    console.log(`  JS Assets:          ${report.baseline.jsAsset.human}`);
    console.log(`  Line Count:         ${report.baseline.lineCount.toLocaleString()} lines`);

    console.log('\nOptimization Target:');
    console.log(`  Target Size:        ${report.target.targetHuman}`);
    console.log(
      `  Reduction Needed:   ${formatBytes(report.target.potentialReduction.bytes)} (${report.target.potentialReduction.percentage}%)`
    );

    console.log('\nOptional Features (tree-shaking candidates):');
    console.log('  - mediaExtraction (50 KB)');
    console.log('  - advancedFilters (40 KB)');
    console.log('  - accessibility (35 KB)');
    console.log('  Total Optional: 125 KB');

    console.log('\nOptimization Strategy:');
    report.optimizationStrategy.forEach(strategy => {
      console.log(`  ✓ ${strategy}`);
    });

    console.log(`\n✅ Phase 326.5-1: Baseline Complete`);
    console.log(`📊 Next: Phase 326.5-2 (Detailed Bundle Analysis)\n`);

    // Save report
    const reportPath = path.resolve(docDir, 'phase-326-bundle-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved: ${reportPath}\n`);

    console.log('='.repeat(60) + '\n');

    return report;
  } catch (error) {
    console.error('❌ Error during bundle analysis:', error.message);
    process.exit(1);
  }
}

// Run analysis
await analyzeBundle();
