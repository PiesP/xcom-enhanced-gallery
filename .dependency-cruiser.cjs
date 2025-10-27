/**
 * @file .dependency-cruiser.cjs
 * @description 의존성 검증 및 시각화 설정
 *
 * 주요 규칙:
 * - 3계층 구조 강제 (features → shared → external)
 * - Vendor getter 강제 (직접 import 금지)
 * - 순환 참조 방지
 * - 내부 barrel import 제한
 *
 * @see docs/ARCHITECTURE.md - 아키텍처 계층 구조
 * @see docs/DEPENDENCY-GOVERNANCE.md - 의존성 거버넌스 정책
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // === 3계층 구조 강제 ===
    {
      name: 'no-external-upward-deps',
      comment:
        'External 레이어는 shared의 logging/utils/types만 허용 (features/services/components/state 금지)',
      severity: 'error',
      from: { path: '^src/shared/external' },
      to: {
        path: '^src/shared/(services|components|state|hooks|container|browser|media)',
      },
    },
    {
      name: 'no-shared-to-features-deps',
      comment: 'Shared는 Features 레이어를 참조할 수 없음 (단방향 의존)',
      severity: 'error',
      from: { path: '^src/shared' },
      to: { path: '^src/features' },
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
          '^src/shared/types/vendor\\.types\\.ts$',
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
          // 서비스/컨테이너 패턴 예외
          '^src/shared/(services|container|state)/.*\\.(ts|tsx)$',
          // 타입 정의 파일 예외
          '^src/shared/types/.*\\.ts$',
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
          // 설정 파일 및 진입점
          '(^|/)[.][^/]+\\.(js|cjs|mjs|ts|cts|mts|json)$',
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.json$',
          '(^|/)(babel|webpack)\\.config\\.(js|cjs|mjs|ts|json)$',
          '^src/main\\.ts$',
          // 인덱스 및 타입 파일
          '^src/.*/index\\.ts$',
          '^src/features/.*/types\\.ts$',
          '^src/shared/types/.*\\.ts$',
          // 스타일 파일
          '^src/.*\\.module\\.css$',
          '^src/assets/',
          // 실험적 파일
          '^src/shared/components/LazyIcon\\.tsx$',
          '^src/features/gallery/hooks/useToolbarPositionBased\\.ts$',
          '^src/shared/hooks/(useSettingsModal|useFocusScope)\\.ts$',
          '^src/shared/external/userscript/adapter\\.ts$',
          '^src/shared/state/gallery-store\\.ts$',
          '^src/shared/services/iconRegistry\\.ts$',
          '^src/shared/components/ui/Toolbar/(UnifiedToolbar|ToolbarHeadless|ConfigurableToolbar)\\.tsx$',
          '^src/shared/components/ui/Toolbar/toolbarConfig\\.ts$',
          '^src/shared/loader/progressive-loader\\.ts$',
        ],
      },
      to: {},
    },

    // === 내부 barrel import 제한 ===
    {
      name: 'no-internal-barrel-imports',
      comment: '동일 패키지 내부에서는 상대 경로로 import (barrel 재수입 금지)',
      severity: 'error',
      from: {
        path: '^src/shared/(components/ui|utils|media)/(?!index\\.).+',
      },
      to: {
        path: '^src/shared/(components/ui|utils|media)/index\\.ts$',
      },
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
            splines: 'ortho',
            rankdir: 'TB',
            nodesep: 0.8,
            ranksep: 1.5,
            concentrate: true,
            overlap: false,
            compound: true,
            bgcolor: 'white',
            fontname: 'Arial',
            fontsize: 14,
            label: 'X.com Enhanced Gallery\\nDependency Graph',
            labelloc: 't',
            labeljust: 'c',
          },
          node: {
            shape: 'box',
            style: 'rounded,filled',
            color: '#333',
            fillcolor: '#FAFAFA',
            fontname: 'Arial',
            fontsize: 11,
            fontcolor: '#333',
            penwidth: 1.5,
            margin: '0.15,0.1',
          },
          edge: {
            arrowhead: 'vee',
            arrowsize: 0.9,
            color: '#666',
            fontname: 'Arial',
            fontsize: 9,
            fontcolor: '#555',
            penwidth: 1.2,
          },
          modules: [
            {
              criteria: { source: '^src/main\\.ts$' },
              attributes: {
                fillcolor: '#E0E7FF',
                color: '#4338CA',
                fontcolor: '#4338CA',
                penwidth: 2,
              },
            },
            {
              criteria: { source: '^src/bootstrap' },
              attributes: {
                fillcolor: '#DBEAFE',
                color: '#1E40AF',
                fontcolor: '#1E40AF',
              },
            },
            {
              criteria: { source: '^src/features' },
              attributes: {
                fillcolor: '#D1FAE5',
                color: '#059669',
                fontcolor: '#059669',
              },
            },
            {
              criteria: { source: '^src/shared' },
              attributes: {
                fillcolor: '#FEF3C7',
                color: '#D97706',
                fontcolor: '#D97706',
              },
            },
            {
              criteria: { source: '^src/shared/external' },
              attributes: {
                fillcolor: '#FEE2E2',
                color: '#DC2626',
                fontcolor: '#DC2626',
              },
            },
          ],
        },
      },
    },
  },
};
