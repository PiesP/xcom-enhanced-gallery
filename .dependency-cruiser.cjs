/**
 * @file .dependency-cruiser.cjs
 * @description 의존성 검증 및 시각화 설정
 * 
 * 주요 규칙:
 * - Clean Architecture 계층 분리 (features → shared → core → infrastructure)
 * - Vendor getter 강제 (직접 import 금지)
 * - 순환 참조 방지
 * - Barrel import 제한
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // === Clean Architecture 계층 규칙 ===
    {
      name: 'no-infrastructure-upward-deps',
      comment: 'Infrastructure는 자체 완결형 (다른 레이어 의존 불가)',
      severity: 'error',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/(core|shared|features|app)' },
    },
    {
      name: 'no-core-upward-deps',
      comment: 'Core는 infrastructure에만 의존 가능',
      severity: 'error',
      from: {
        path: '^src/core',
        pathNot: ['^src/core/services/ServiceRegistry.ts'],
      },
      to: { path: '^src/(shared|features|app)' },
    },
    {
      name: 'no-shared-upward-deps',
      comment: 'Shared는 core, infrastructure에만 의존 가능',
      severity: 'error',
      from: {
        path: '^src/shared',
        pathNot: ['^src/shared/container/createAppContainer.ts'],
      },
      to: { path: '^src/(features|app)' },
    },

    // === Vendor getter 강제 ===
    {
      name: 'no-direct-vendor-imports',
      comment: '외부 라이브러리는 vendors getter를 통해 접근',
      severity: 'error',
      from: {
        path: '^src',
        pathNot: [
          '^src/shared/external/vendors',
          '^src/shared/types/vendor.types.ts',
          '^src/types/',
        ],
      },
      to: { path: '^(fflate|solid-js)' },
    },

    // === 순환 참조 방지 ===
    {
      name: 'no-circular-deps',
      comment: '순환 참조 금지',
      severity: 'error',
      from: {
        pathNot: [
          // 알려진 순환 (리팩토링 예정)
          '^src/shared/services/media-service\\.ts$',
          '^src/shared/container/service-accessors\\.ts$',
          '^src/shared/services/service-factories\\.ts$',
          '^src/shared/services/theme-service\\.ts$',
          '^src/shared/services/language-service\\.ts$',
          '^src/shared/services/base-service-impl\\.ts$',
          '^src/shared/services/bulk-download-service\\.ts$',
          '^src/shared/types/app\\.types\\.ts$',
          '^src/shared/types/core/core-types\\.ts$',
        ],
      },
      to: { circular: true },
    },

    // === 고아 모듈 검사 ===
    {
      name: 'no-orphans',
      comment: '사용되지 않는 고아 모듈',
      severity: 'info',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$',
          '[.]d[.]ts$',
          '(^|/)tsconfig[.]json$',
          '(^|/)(?:babel|webpack)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$',
          '^src/main[.]ts$',
          '^src/.*/index[.]ts$',
          '^src/features/.*/types[.]ts$',
          '^src/shared/types/.*[.]ts$',
          '^src/.*[.]module[.]css$',
          '^src/assets/',
          '^src/core/state/base/.*[.]ts$',
          '^src/.*[.]interface[.]ts$',
          '^src/.*[.]abstract[.]ts$',
          // 실험적/보류 파일
          '^src/shared/components/LazyIcon[.]tsx$',
          '^src/features/gallery/hooks/useToolbarPositionBased[.]ts$',
          '^src/shared/hooks/useSettingsModal[.]ts$',
          '^src/shared/hooks/useFocusScope[.]ts$',
          '^src/shared/external/userscript/adapter[.]ts$',
          '^src/shared/state/gallery-store[.]ts$',
          '^src/shared/services/iconRegistry[.]ts$',
          '^src/shared/styles/tokens/button[.]ts$',
          '^src/shared/components/ui/Toolbar/(UnifiedToolbar|ToolbarHeadless|ConfigurableToolbar)[.]tsx$',
          '^src/shared/components/ui/Toolbar/toolbarConfig[.]ts$',
          '^src/shared/loader/progressive-loader[.]ts$',
        ],
      },
      to: {},
    },

    // === Barrel import 제한 ===
    {
      name: 'no-internal-barrel-imports-ui',
      comment: 'UI 패키지 내부에서는 상대 경로로 import',
      severity: 'error',
      from: { path: '^src/shared/components/ui/(?!index[.])' },
      to: { path: '^src/shared/components/ui/index[.]ts$' },
    },
    {
      name: 'no-internal-barrel-imports-utils',
      comment: 'utils 패키지 내부에서는 상대 경로로 import',
      severity: 'error',
      from: { path: '^src/shared/utils/(?!index[.]).+' },
      to: { path: '^src/shared/utils/index[.]ts$' },
    },
    {
      name: 'no-internal-barrel-imports-media',
      comment: 'media 패키지 내부에서는 상대 경로로 import',
      severity: 'error',
      from: { path: '^src/shared/media/(?!index[.]).+' },
      to: { path: '^src/shared/media/index[.]ts$' },
    },
  ],

  options: {
    doNotFollow: { path: 'node_modules' },
    includeOnly: '^src',
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },

    reporterOptions: {
      dot: {
        theme: {
          graph: {
            splines: 'polyline',
            rankdir: 'TB',
            nodesep: 0.6,
            ranksep: 1.2,
            concentrate: true,
            overlap: false,
            compound: true,
            bgcolor: 'white',
            fontname: 'Arial',
            fontsize: 12,
            label: 'X.com Enhanced Gallery\\nDependency Graph',
            labelloc: 't',
          },
          node: {
            shape: 'box',
            style: 'rounded,filled',
            color: '#333',
            fillcolor: '#FAFAFA',
            fontname: 'Arial',
            fontsize: 10,
            fontcolor: '#333',
            penwidth: 1,
            margin: 0.1,
          },
          edge: {
            arrowhead: 'normal',
            arrowsize: 0.8,
            color: '#666',
            fontname: 'Arial',
            fontsize: 8,
            fontcolor: '#333',
            penwidth: 1,
          },
          modules: [
            {
              criteria: { source: '^src/app' },
              attributes: { fillcolor: '#E8F4FD', color: '#1E40AF', fontcolor: '#1E40AF' },
            },
            {
              criteria: { source: '^src/features' },
              attributes: { fillcolor: '#F0FDF4', color: '#15803D', fontcolor: '#15803D' },
            },
            {
              criteria: { source: '^src/shared' },
              attributes: { fillcolor: '#FFFBEB', color: '#B45309', fontcolor: '#B45309' },
            },
            {
              criteria: { source: '^src/core' },
              attributes: { fillcolor: '#FEF2F2', color: '#B91C1C', fontcolor: '#B91C1C' },
            },
          ],
        },
      },
    },
  },
};
