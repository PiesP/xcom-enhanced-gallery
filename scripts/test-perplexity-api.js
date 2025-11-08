#!/usr/bin/env node

/**
 * Perplexity API Validation Script
 * Purpose: Quickly diagnose API key validity and model availability
 * Usage: node scripts/test-perplexity-api.js
 */

import * as https from 'https';

const API_KEY = process.env.PERPLEXITY_API_KEY;

/**
 * Async sleep function
 */
async function sleep(ms) {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, ms);
  });
}

const MODELS = {
  basic: {
    name: 'sonar-pro',
    description: 'Basic queries and web search',
    requiresPro: false,
  },
  advanced: {
    name: 'sonar-reasoning-pro',
    description: 'Advanced reasoning (Pro plan required)',
    requiresPro: true,
  },
  research: {
    name: 'sonar-deep-research',
    description: 'Deep research (Pro plan required)',
    requiresPro: true,
  },
};

/**
 * Make HTTP request
 */
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            status: res.statusCode,
            body: parsed,
            headers: res.headers,
          });
        } catch {
          resolve({
            status: res.statusCode,
            body,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 모델 접근성 테스트
 */
async function testModel(modelKey, modelConfig) {
  console.log(`\n📡 테스트: ${modelKey.toUpperCase()} (${modelConfig.name})`);
  console.log(`   설명: ${modelConfig.description}`);

  const options = {
    hostname: 'api.perplexity.ai',
    port: 443,
    path: '/chat/completions',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  const payload = {
    model: modelConfig.name,
    messages: [{ role: 'user', content: 'test' }],
    max_tokens: 50,
  };

  try {
    const result = await makeRequest(options, payload);

    if (result.status === 200) {
      console.log('   ✅ Success: Model accessible');
      return { success: true, status: result.status };
    }
    if (result.status === 401) {
      console.log('   ❌ 401 Unauthorized: Authentication failed');
      if (result.body?.error) {
        console.log(`      Error message: ${result.body.error.message || result.body.error}`);
      }
      return { success: false, status: result.status, error: 'unauthorized' };
    }
    if (result.status === 403) {
      console.log('   🔒 403 Forbidden: Access denied (plan does not include)');
      return { success: false, status: result.status, error: 'forbidden' };
    }
    if (result.status === 429) {
      console.log('   ⚠️  429 Too Many Requests: Request limit exceeded');
      return { success: false, status: result.status, error: 'rate_limit' };
    }
    console.log(`   ⚠️  Status code: ${result.status}`);
    if (result.body?.error) {
      console.log(`      Error: ${JSON.stringify(result.body.error)}`);
    }
    return { success: false, status: result.status, error: 'unknown' };
  } catch (error) {
    console.log(`   ❌ 네트워크 오류: ${error.message}`);
    return { success: false, error: 'network' };
  }
}

/**
 * 플랜 유형 추론
 */
function inferPlan(results) {
  const basicOk = results.basic.success;
  const advancedOk = results.advanced.success;
  const researchOk = results.research.success;

  if (basicOk && advancedOk && researchOk) {
    return 'Pro 플랜 (모든 모델 지원)';
  }
  if (basicOk && !advancedOk && !researchOk) {
    return 'Free 또는 Basic 플랜 (기본 모델만 지원)';
  }
  if (!basicOk && !advancedOk && !researchOk) {
    return 'API 키 오류 또는 인증 실패';
  }
  return '알 수 없음';
}

/**
 * 주 함수
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 Perplexity MCP API Diagnostic Tool');
  console.log('═══════════════════════════════════════════════════════');

  // Step 1: Check API key
  console.log('\n📋 Step 1: Checking environment variables');
  if (!API_KEY) {
    console.log('❌ PERPLEXITY_API_KEY environment variable not set.');
    console.log('   Fix: export PERPLEXITY_API_KEY="your_key_here"');
    process.exit(1);
  }
  console.log('✅ API key detected');
  console.log(`   Length: ${API_KEY.length} chars`);
  console.log(`   Prefix: ${API_KEY.substring(0, 8)}...`);

  // Step 2: Test each model
  console.log('\n📋 Step 2: Testing model accessibility');
  const results = {};

  for (const [key, config] of Object.entries(MODELS)) {
    results[key] = await testModel(key, config);
    // Delay between requests (prevent rate limit)
    await sleep(1000);
  }

  // Step 3: Infer plan type
  console.log('\n📋 Step 3: Inferring plan type');
  const inferredPlan = inferPlan(results);
  console.log(`Inferred plan: ${inferredPlan}`);

  // Step 4: Summary and recommendations
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 Diagnostic Results Summary');
  console.log('═══════════════════════════════════════════════════════');

  const summary = {
    basic: results.basic.success ? '✅' : '❌',
    advanced: results.advanced.success ? '✅' : '❌',
    research: results.research.success ? '✅' : '❌',
  };

  console.log(`
Basic model (sonar-pro):           ${summary.basic}
Advanced reasoning (sonar-reasoning-pro): ${summary.advanced}
Deep research (sonar-deep-research): ${summary.research}
  `);

  // Recommendations
  console.log('💡 Recommendations:');
  if (results.basic.success && !results.advanced.success) {
    if (results.advanced.error === 'forbidden') {
      console.log('  • Advanced models not available with current plan.');
      console.log('  • Consider upgrading to Pro plan: https://www.perplexity.ai/pro');
      console.log('  • Or use basic features only (Ask, Search).');
    }
  }

  if (results.basic.error === 'unauthorized' || results.basic.error === 'network') {
    console.log('  • Re-check API key: https://www.perplexity.ai/account/api/group');
    console.log('  • Verify environment variable: echo $PERPLEXITY_API_KEY');
  }

  console.log('\n═══════════════════════════════════════════════════════');
}

// Execute
main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
