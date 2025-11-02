#!/usr/bin/env node

/**
 * @fileoverview Phase 326.5-2: Detailed Bundle Composition Analysis
 * @description Analyze bundle by features and identify optimization opportunities
 *
 * Usage: node scripts/analyze-bundle-detailed.js
 * Output: Terminal report + docs/phase-326-5-2-detailed-analysis.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.resolve(projectRoot, 'src');

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
 * Scan source files by directory
 */
function scanSourceFiles() {
  const stats = {
    features: {},
    shared: { files: 0, lines: 0, size: 0 },
    bootstrap: { files: 0, lines: 0, size: 0 },
    styles: { files: 0, lines: 0, size: 0 },
    total: { files: 0, lines: 0, size: 0 },
  };

  // Feature modules
  const featureDir = path.resolve(srcDir, 'features');
  if (fs.existsSync(featureDir)) {
    const features = fs
      .readdirSync(featureDir)
      .filter(f => fs.statSync(path.join(featureDir, f)).isDirectory());

    features.forEach(feature => {
      const featurePath = path.join(featureDir, feature);
      stats.features[feature] = scanDirectory(featurePath);
    });
  }

  // Shared modules
  const sharedDir = path.resolve(srcDir, 'shared');
  if (fs.existsSync(sharedDir)) {
    stats.shared = scanDirectory(sharedDir);
  }

  // Bootstrap
  const bootstrapDir = path.resolve(srcDir, 'bootstrap');
  if (fs.existsSync(bootstrapDir)) {
    stats.bootstrap = scanDirectory(bootstrapDir);
  }

  // Styles
  const stylesDir = path.resolve(srcDir, 'styles');
  if (fs.existsSync(stylesDir)) {
    stats.styles = scanDirectory(stylesDir);
  }

  // Calculate totals
  stats.total.files = stats.bootstrap.files + stats.styles.files + stats.shared.files;
  stats.total.lines = stats.bootstrap.lines + stats.styles.lines + stats.shared.lines;
  stats.total.size = stats.bootstrap.size + stats.styles.size + stats.shared.size;

  Object.values(stats.features).forEach(f => {
    stats.total.files += f.files;
    stats.total.lines += f.lines;
    stats.total.size += f.size;
  });

  return stats;
}

/**
 * Scan directory for TypeScript/CSS files
 */
function scanDirectory(dirPath) {
  let stats = { files: 0, lines: 0, size: 0, modules: {} };

  try {
    const walk = dir => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (file.match(/\.(ts|tsx|css)$/)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n').length;
          const size = content.length;

          stats.files++;
          stats.lines += lines;
          stats.size += size;

          const relPath = path.relative(dirPath, fullPath);
          stats.modules[relPath] = { lines, size };
        }
      });
    };

    walk(dirPath);
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error.message);
  }

  return stats;
}

/**
 * Analyze optional features
 */
function analyzeOptionalFeatures() {
  const optionalFeatures = {
    mediaExtraction: {
      files: [
        'src/features/media-extraction/index.ts',
        'src/features/media-extraction/media-extraction-service.ts',
        'src/shared/external/twitter-token-extractor.ts',
        'src/shared/external/twitter-video-extractor.ts',
      ],
      description: 'Media extraction and optimization',
      estimatedSize: 50,
      removable: true,
    },
    advancedFilters: {
      files: [
        'src/features/advanced-filters/index.ts',
        'src/features/advanced-filters/filter-panel.tsx',
        'src/features/advanced-filters/filter-state.ts',
      ],
      description: 'Advanced filtering UI and logic',
      estimatedSize: 40,
      removable: true,
    },
    accessibility: {
      files: [
        'src/features/accessibility/index.ts',
        'src/features/accessibility/keyboard-help-overlay.tsx',
        'src/features/accessibility/a11y-validation.ts',
      ],
      description: 'WCAG compliance and keyboard support',
      estimatedSize: 35,
      removable: false, // Partial - keyboard nav is core
    },
  };

  const analysis = {};
  for (const [name, feature] of Object.entries(optionalFeatures)) {
    let totalSize = 0;
    let fileCount = 0;
    const foundFiles = [];

    feature.files.forEach(filePath => {
      const fullPath = path.resolve(projectRoot, filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        totalSize += content.length;
        fileCount++;
        foundFiles.push({
          path: filePath,
          size: content.length,
          lines: content.split('\n').length,
        });
      }
    });

    analysis[name] = {
      ...feature,
      actualFiles: foundFiles,
      actualSize: totalSize,
      fileCount,
      estimatedSize: feature.estimatedSize,
    };
  }

  return analysis;
}

/**
 * Identify dead code candidates
 */
function analyzeDeadCode() {
  const candidates = {
    unusedUtils: [],
    duplicatedLogic: [],
    unreachableCode: [],
  };

  // Scan for common patterns
  const utilDir = path.resolve(srcDir, 'shared', 'utils');
  if (fs.existsSync(utilDir)) {
    fs.readdirSync(utilDir).forEach(file => {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const filePath = path.join(utilDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Simple heuristic: count exported functions
        const exports = content.match(/export\s+(function|const|class)/g) || [];
        if (exports.length > 5) {
          candidates.unusedUtils.push({
            file,
            exports: exports.length,
            note: 'Multiple exports, check for unused',
          });
        }
      }
    });
  }

  return candidates;
}

/**
 * Tree-shaking potential analysis
 */
function analyzeTreeShakingPotential(optionalFeatures) {
  const potential = {
    fullRemoval: [],
    partialRemoval: [],
    optimization: [],
  };

  for (const [name, feature] of Object.entries(optionalFeatures)) {
    if (feature.removable === true) {
      potential.fullRemoval.push({
        feature: name,
        estimatedSize: feature.estimatedSize,
        condition: `feature.${name} === false`,
      });
    } else {
      potential.partialRemoval.push({
        feature: name,
        estimatedSize: feature.estimatedSize,
        note: 'Partial removable - analyze dependencies',
      });
    }
  }

  // Optimization opportunities
  potential.optimization = [
    { area: 'Shared Utils', saving: '3-5 KB', effort: 'Medium' },
    { area: 'CSS Unused Classes', saving: '2-4 KB', effort: 'Low' },
    { area: 'Dynamic Imports', saving: '1-3 KB', effort: 'Low' },
    { area: 'Export Optimization', saving: '0.5-1 KB', effort: 'Low' },
  ];

  return potential;
}

/**
 * Main analysis
 */
async function performDetailedAnalysis() {
  console.log('\n📊 Phase 326.5-2: Detailed Bundle Analysis\n');
  console.log('='.repeat(70));

  try {
    // 1. Source file analysis
    console.log('\n📁 Source File Analysis...\n');
    const sourceStats = scanSourceFiles();

    console.log('Feature Modules:');
    Object.entries(sourceStats.features).forEach(([name, stats]) => {
      console.log(
        `  ${name.padEnd(25)}: ${stats.files.toString().padStart(3)} files | ${formatBytes(stats.size).padStart(12)} | ${stats.lines.toString().padStart(5)} lines`
      );
    });

    console.log('\nCore Modules:');
    console.log(
      `  shared${' '.repeat(19)}: ${sourceStats.shared.files.toString().padStart(3)} files | ${formatBytes(sourceStats.shared.size).padStart(12)} | ${sourceStats.shared.lines.toString().padStart(5)} lines`
    );
    console.log(
      `  bootstrap${' '.repeat(16)}: ${sourceStats.bootstrap.files.toString().padStart(3)} files | ${formatBytes(sourceStats.bootstrap.size).padStart(12)} | ${sourceStats.bootstrap.lines.toString().padStart(5)} lines`
    );
    console.log(
      `  styles${' '.repeat(19)}: ${sourceStats.styles.files.toString().padStart(3)} files | ${formatBytes(sourceStats.styles.size).padStart(12)} | ${sourceStats.styles.lines.toString().padStart(5)} lines`
    );

    console.log(
      `\n  ${'TOTAL'.padEnd(25)}: ${sourceStats.total.files.toString().padStart(3)} files | ${formatBytes(sourceStats.total.size).padStart(12)} | ${sourceStats.total.lines.toString().padStart(5)} lines`
    );

    // 2. Optional features analysis
    console.log('\n\n🎯 Optional Features Analysis:\n');
    const optionalFeatures = analyzeOptionalFeatures();

    let optionalTotalSize = 0;
    Object.entries(optionalFeatures).forEach(([name, feature]) => {
      const size = feature.actualSize || feature.estimatedSize * 1024; // Convert KB to bytes
      optionalTotalSize += size;
      console.log(
        `  ${name.padEnd(20)}: ${formatBytes(size).padStart(12)} | ${feature.fileCount} files | ${feature.description}`
      );
    });
    console.log(`  ${'TOTAL OPTIONAL'.padEnd(20)}: ${formatBytes(optionalTotalSize).padStart(12)}`);

    // 3. Dead code analysis
    console.log('\n\n🔍 Dead Code Candidates:\n');
    const deadCode = analyzeDeadCode();
    if (deadCode.unusedUtils.length > 0) {
      console.log('Utilities with many exports (potential dead code):');
      deadCode.unusedUtils.slice(0, 5).forEach(item => {
        console.log(`  - ${item.file}: ${item.exports} exports`);
      });
    }

    // 4. Tree-shaking analysis
    console.log('\n\n🌳 Tree-shaking Potential:\n');
    const treeshaking = analyzeTreeShakingPotential(optionalFeatures);

    console.log('Full Removal Candidates:');
    treeshaking.fullRemoval.forEach(item => {
      console.log(`  - ${item.feature}: ~${item.estimatedSize} KB when disabled`);
    });

    console.log('\nOptimization Opportunities:');
    treeshaking.optimization.forEach(item => {
      console.log(
        `  - ${item.area.padEnd(25)}: ${item.saving.padStart(10)} saving (${item.effort} effort)`
      );
    });

    // 5. Summary
    console.log('\n\n📈 Summary & Recommendations:\n');

    const bundleSize = 406.94;
    const optionalKB = optionalTotalSize / 1024;
    const potentialSavings = 30 + 5 + 3; // Tier 1-3 optimizations

    console.log(`Current Bundle:          ${bundleSize.toFixed(2)} KB`);
    console.log(
      `Optional Features:       ${optionalKB.toFixed(2)} KB (${((optionalKB / bundleSize) * 100).toFixed(1)}%)`
    );
    console.log(`Tree-shaking Potential:  ~${potentialSavings} KB`);
    console.log(`Target Size:             310-315 KB`);
    console.log(`\nEstimated Achievable:    ${(bundleSize - potentialSavings).toFixed(2)} KB`);

    console.log('\nOptimization Strategy:');
    console.log('  1. Disable optional features in build config');
    console.log('  2. Consolidate shared utilities');
    console.log('  3. Purge unused CSS');
    console.log('  4. Optimize dynamic imports');
    console.log('  5. Review and eliminate dead code');

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      phase: '326.5-2',
      sourceAnalysis: sourceStats,
      optionalFeatures,
      deadCode,
      treeshaking,
      recommendations: {
        primary: 'Implement feature-based tree-shaking in build config',
        secondary: 'Consolidate utility functions in shared layer',
        tertiary: 'CSS optimization and dead code removal',
      },
    };

    // Save report
    const reportPath = path.resolve(projectRoot, 'docs', 'phase-326-5-2-detailed-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);

    console.log('\n' + '='.repeat(70) + '\n');
    console.log('✅ Phase 326.5-2: Detailed Analysis Complete');
    console.log('📋 Next: Implement optimizations in Phase 326.5-3\n');

    return report;
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    process.exit(1);
  }
}

// Run analysis
await performDetailedAnalysis();
