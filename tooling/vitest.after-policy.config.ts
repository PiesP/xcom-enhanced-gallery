// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { createVitestConfig } from '../vitest.config.ts';

// verify:full already ran the boundary suite through quality.
export default createVitestConfig(true);
