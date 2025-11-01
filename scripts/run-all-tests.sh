#!/usr/bin/env bash
# Deprecated in favor of scripts/run-all-tests.js
echo "This script is deprecated. Use: npm run test:full (node ./scripts/run-all-tests.js)"
node "$(dirname "$0")/run-all-tests.js" "$@"
