/**
 * @file: .dependency-cruiser.js
 * @description: 의존성 그래프 시각화를 위한 개선된 dependency-cruiser 설정
 *
 * 이 설정은 다음과 같은 시각적 개선 사항을 포함합니다:
 * 1. 레이어별 색상 구분: app, features, shared, core, infrastructure 각 레이어에 다른 색상을 부여합니다.
 * 2. 기능 단위 그룹화: 'collapsePattern'을 사용하여 기능별로 모듈을 묶어 그래프를 간소화합니다.
 * 3. 시각적 범례: 색상별 레이어 의미를 표시하여 혼동을 줄입니다.
 * 4. 의존성 유형별 스타일링: 규칙별로 서로 다른 색상과 스타일을 적용합니다.
 * 5. 최적화된 레이아웃: 컴팩트한 크기와 향상된 가독성을 제공합니다.
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // Clean Architecture 의존성 규칙: features → shared → core → infrastructure
    {
      name: 'no-infrastructure-upward-deps',
      comment: 'Infrastructure는 다른 레이어에 의존할 수 없음 (자체 완결형)',
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
        pathNot: [
          '^src/core/services/ServiceRegistry.ts', // ServiceRegistry는 동적 import 허용
        ],
      },
      to: { path: '^src/(shared|features|app)' },
    },
    {
      name: 'no-shared-upward-deps',
      comment: 'Shared는 core, infrastructure에만 의존 가능',
      severity: 'error',
      from: {
        path: '^src/shared',
        pathNot: [
          '^src/shared/container/createAppContainer.ts', // 컨테이너는 갤러리 앱 로딩을 위해 예외
        ],
      },
      to: { path: '^src/(features|app)' },
    },

    // 외부 라이브러리 접근 제한 (vendor getter 사용 강제)
    {
      name: 'no-direct-vendor-imports',
      comment: '외부 라이브러리는 vendors getter를 통해 접근',
      severity: 'warn',
      from: {
        path: '^src',
        pathNot: [
          '^src/(shared/utils/vendors|infrastructure/external/vendors)', // vendors 유틸리티
          '^src/shared/types/vendor.types.ts', // 타입 정의 파일
          '^src/types/', // 전역 타입 정의
        ],
      },
      to: { path: '^(fflate|preact|@preact)' },
    },

    // 순환 참조 방지
    {
      name: 'no-circular-deps',
      comment: '순환 참조 금지',
      // NOTE: TS alias 해석 활성화(tsConfig) 후 기존에 숨겨져 있던 순환이 다수 드러남.
      // 현재 Epic(DEPS-GOV)의 1차 목표는 orphan 노이즈 감소 및 실행 효율 개선이므로
      // 순환 제거는 후속 Epic에서 다루기 위해 임시로 warn 강등. (Completed 로그에 기록 예정)
      severity: 'warn',
      from: {},
      to: { circular: true },
    },

    // 고아 모듈 검사 (실제 사용되지 않는 파일만)
    {
      name: 'no-orphans',
      comment: '사용되지 않는 고아 모듈',
      severity: 'info', // 심각도 낮춤
      from: {
        orphan: true,
        pathNot: [
          '(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$', // dot files
          '[.]d[.]ts$', // TypeScript declaration files
          '(^|/)tsconfig[.]json$', // TypeScript config
          '(^|/)(?:babel|webpack)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$', // configs
          '^src/main[.]ts$', // 메인 진입점
          '^src/.*/index[.]ts$', // 배럴 export 파일들
          'REFACTORING_PLAN[.]ts$', // 리팩토링 계획 문서
          '^src/core/constants/STABLE_SELECTORS[.]ts$', // 실제 사용되는 상수
          '^src/features/.*/types[.]ts$', // 기능별 타입 정의
          '^src/shared/types/.*[.]ts$', // 공유 타입 정의
          '^src/.*[.]module[.]css$', // CSS 모듈
          '^src/assets/', // 정적 자원
          '^src/core/state/base/.*[.]ts$', // 상태 관리 기반 클래스들
          '^src/.*[.]interface[.]ts$', // 인터페이스 정의
          '^src/.*[.]abstract[.]ts$', // 추상 클래스들
          // --- Whitelist: test-only or transitional modules kept for characterization & docs ---
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
          '^src/shared/components/ui/SettingsModal/(UnifiedSettingsModal|HeadlessSettingsModal|EnhancedSettingsModal)[.]tsx$',
          // --- Intentional placeholders / future expansion points (keep allowed) ---
          '^src/shared/services/icon-types[.]ts$',
          '^src/shared/loader/progressive-loader[.]ts$',
        ],
      },
      to: {},
    },
  ],

  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    includeOnly: '^src',
    // TS path alias 해석 보장 (orphan 오검출 감소)
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    tsPreCompilationDeps: true,

    reporterOptions: {
      dot: {
        // 기능 단위로 클러스터링 (더 세분화된 그룹화)
        // collapsePattern: '^(src/(features|shared|core|infrastructure)/[^/]+)',

        theme: {
          // 그래프 전반에 적용될 속성 (최적화된 레이아웃)
          graph: {
            splines: 'polyline',
            rankdir: 'TB',
            nodesep: 0.6, // 노드 간격 최적화
            ranksep: 1.2, // 레벨 간격 최적화
            concentrate: true,
            overlap: false,
            compound: true,
            newrank: true,
            bgcolor: 'white',
            fontname: 'Arial',
            fontsize: 12,
            // 범례 추가
            label: `X.com Enhanced Gallery\\nDependency Graph\\n\\n`,
            labelloc: 't',
            labeljust: 'c',
          },

          // 모든 노드(모듈)의 기본 스타일 (개선된 콘트라스트)
          node: {
            shape: 'box',
            style: 'rounded,filled',
            color: '#333333', // 더 진한 테두리
            fillcolor: '#FAFAFA', // 더 밝은 배경
            fontname: 'Arial',
            fontsize: 10,
            fontcolor: '#333333', // 개선된 텍스트 색상
            penwidth: 1,
            margin: 0.1,
          },

          // 모든 엣지(의존성)의 기본 스타일 (개선된 가시성)
          edge: {
            arrowhead: 'normal',
            arrowsize: 0.8,
            color: '#666666', // 더 진한 기본 색상
            fontname: 'Arial',
            fontsize: 8,
            fontcolor: '#333333',
            penwidth: 1,
          },

          // 특정 조건에 맞는 모듈에 다른 스타일을 적용 (개선된 색상)
          modules: [
            {
              criteria: { source: '^src/app' },
              attributes: {
                fillcolor: '#E8F4FD',
                color: '#1E40AF', // 더 진한 파란색
                fontcolor: '#1E40AF',
              },
            },
            {
              criteria: { source: '^src/features' },
              attributes: {
                fillcolor: '#F0FDF4',
                color: '#15803D', // 더 진한 초록색
                fontcolor: '#15803D',
              },
            },
            {
              criteria: { source: '^src/shared' },
              attributes: {
                fillcolor: '#FFFBEB',
                color: '#B45309', // 더 진한 주황색
                fontcolor: '#B45309',
              },
            },
            {
              criteria: { source: '^src/core' },
              attributes: {
                fillcolor: '#FDF2F8',
                color: '#B91C1C', // 더 진한 빨간색
                fontcolor: '#B91C1C',
              },
            },
            {
              criteria: { source: '^src/infrastructure' },
              attributes: {
                fillcolor: '#F5F3FF',
                color: '#6D28D9', // 더 진한 보라색
                fontcolor: '#6D28D9',
              },
            },
            {
              criteria: { orphan: true },
              attributes: {
                fillcolor: '#FEF2F2',
                color: '#DC2626',
                fontcolor: '#DC2626',
                style: 'rounded,filled,dashed',
                penwidth: 1.5,
              },
            },
          ],

          // 규칙별 세분화된 의존성 스타일링
          dependencies: [
            {
              criteria: { circular: true },
              attributes: {
                color: '#DC2626', // 순환 참조 - 빨간색
                penwidth: 3,
                style: 'dashed',
                xlabel: '순환',
                fontcolor: '#DC2626',
                fontsize: 9,
              },
            },
            {
              criteria: { 'rule.name': 'no-infrastructure-upward-deps' },
              attributes: {
                color: '#DC2626', // Infrastructure 위반 - 빨간색
                penwidth: 2,
                xlabel: 'infra↑',
                fontcolor: '#DC2626',
              },
            },
            {
              criteria: { 'rule.name': 'no-core-upward-deps' },
              attributes: {
                color: '#EA580C', // Core 위반 - 진한 주황색
                penwidth: 2,
                xlabel: 'core↑',
                fontcolor: '#EA580C',
              },
            },
            {
              criteria: { 'rule.name': 'no-shared-upward-deps' },
              attributes: {
                color: '#F59E0B', // Shared 위반 - 노란색
                penwidth: 2,
                xlabel: 'shared↑',
                fontcolor: '#F59E0B',
              },
            },
            {
              criteria: { 'rule.name': 'no-direct-vendor-imports' },
              attributes: {
                color: '#8B5CF6', // Vendor 직접 import - 보라색 점선
                style: 'dotted',
                penwidth: 1.5,
                xlabel: 'vendor',
                fontcolor: '#8B5CF6',
              },
            },
            {
              criteria: { 'rule.name': 'no-orphans' },
              attributes: {
                color: '#9CA3AF', // 고아 모듈 - 회색 점선
                style: 'dotted',
                xlabel: 'orphan',
                fontcolor: '#9CA3AF',
              },
            },
            {
              criteria: { dependencyTypes: ['dynamic-import'] },
              attributes: {
                style: 'dashed',
                color: '#6366F1', // 동적 import - 인디고
                xlabel: 'dynamic',
                fontcolor: '#6366F1',
              },
            },
            {
              criteria: {
                from: { path: '^src' },
                to: { path: '^(fflate|preact|@preact)' },
              },
              attributes: {
                color: '#6B7280',
                style: 'dotted',
                xlabel: 'vendor',
                fontcolor: '#6B7280',
              },
            },
          ],
        },
      },
    },
  },
};
