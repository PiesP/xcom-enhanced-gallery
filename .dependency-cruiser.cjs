/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-core-to-upper-layers',
      comment: 'Core 레이어는 Features나 App 레이어를 import할 수 없음',
      severity: 'error',
      from: {
        path: '^src/core',
      },
      to: {
        path: '^src/(features|app)',
      },
    },
    {
      name: 'no-shared-to-features',
      comment: 'Shared 레이어는 Features 레이어를 import할 수 없음',
      severity: 'error',
      from: {
        path: '^src/shared',
      },
      to: {
        path: '^src/features',
      },
    },
    {
      name: 'no-infrastructure-to-upper-layers',
      comment: 'Infrastructure 레이어는 다른 레이어를 import할 수 없음',
      severity: 'error',
      from: {
        path: '^src/infrastructure',
      },
      to: {
        path: '^src/(core|shared|features|app)',
      },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    includeOnly: '^src',
    exclude: {
      path: 'node_modules',
    },
  },
};
