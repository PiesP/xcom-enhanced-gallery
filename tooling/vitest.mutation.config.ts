// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { mergeConfig } from 'vitest/config';
import { createVitestConfig } from '../vitest.config.ts';

// The root unit/coverage commands continue to own these repository policy suites.
export default mergeConfig(createVitestConfig(), {
  test: { exclude: ['test/unit/config/**', 'test/unit/tooling/**'] },
});
