#!/usr/bin/env node
/**
 * Perplexity API Validation Script.
 */

import * as https from 'node:https';
import type { IncomingHttpHeaders } from 'node:http';

const API_KEY = process.env.PERPLEXITY_API_KEY;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, ms);
  });
}

interface ModelConfig {
  name: string;
  description: string;
  requiresPro: boolean;
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
} satisfies Record<'basic' | 'advanced' | 'research', ModelConfig>;

interface RequestOptions {
  hostname: string;
  port: number;
  path: string;
  method: 'POST';
  headers: Record<string, string>;
}

interface RequestResult<T = unknown> {
  status: number | undefined;
  body: T;
  headers: IncomingHttpHeaders;
}

function makeRequest<T>(
  options: RequestOptions,
  data: unknown
): Promise<RequestResult<T | string>> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body) as T;
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

type ModelKey = keyof typeof MODELS;

interface TestResult {
  success: boolean;
  status?: number;
  error?: 'unauthorized' | 'forbidden' | 'rate_limit' | 'network' | 'unknown';
}

async function testModel(modelKey: ModelKey, modelConfig: ModelConfig): Promise<TestResult> {
  console.log(`\n📡 Testing: ${modelKey.toUpperCase()} (${modelConfig.name})`);
  console.log(`   Description: ${modelConfig.description}`);

  const options: RequestOptions = {
    hostname: 'api.perplexity.ai',
    port: 443,
    path: '/chat/completions',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY ?? ''}`,
      'Content-Type': 'application/json',
    },
  };

  const payload = {
    model: modelConfig.name,
    messages: [{ role: 'user', content: 'test' }],
    max_tokens: 50,
  };

  try {
    const result = await makeRequest<{ error?: { message?: string } }>(options, payload);

    if (result.status === 200) {
      console.log('   ✅ Success: Model accessible');
      return { success: true, status: result.status };
    }
    if (result.status === 401) {
      console.log('   ❌ 401 Unauthorized: Authentication failed');
      const errorMessage =
        typeof result.body === 'string'
          ? result.body
          : (result.body?.error?.message ?? JSON.stringify(result.body));
      console.log(`      Error message: ${errorMessage}`);
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
    if (typeof result.body !== 'string' && result.body?.error) {
      console.log(`      Error: ${JSON.stringify(result.body.error)}`);
    }
    return { success: false, status: result.status, error: 'unknown' };
  } catch (error) {
    const err = error as Error;
    console.log(`   ❌ Network error: ${err.message}`);
    return { success: false, error: 'network' };
  }
}

function inferPlan(results: Record<ModelKey, TestResult>): string {
  const basicOk = results.basic.success;
  const advancedOk = results.advanced.success;
  const researchOk = results.research.success;

  if (basicOk && advancedOk && researchOk) {
    return 'Pro plan (all models available)';
  }
  if (basicOk && !advancedOk && !researchOk) {
    return 'Free or Basic plan (only sonar-pro available)';
  }
  if (!basicOk && !advancedOk && !researchOk) {
    return 'API key error or authentication failure';
  }
  return 'Unknown plan status';
}

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 Perplexity MCP API Diagnostic Tool');
  console.log('═══════════════════════════════════════════════════════');

  console.log('\n📋 Step 1: Checking environment variables');
  if (!API_KEY) {
    console.log('❌ PERPLEXITY_API_KEY environment variable not set.');
    console.log('   Fix: export PERPLEXITY_API_KEY="your_key_here"');
    process.exit(1);
  }
  console.log('✅ API key detected');
  console.log(`   Length: ${API_KEY.length} chars`);
  console.log(`   Prefix: ${API_KEY.substring(0, 8)}...`);

  console.log('\n📋 Step 2: Testing model accessibility');
  const results = {} as Record<ModelKey, TestResult>;

  for (const [key, config] of Object.entries(MODELS) as [ModelKey, ModelConfig][]) {
    results[key] = await testModel(key, config);
    await sleep(1000);
  }

  console.log('\n📋 Step 3: Inferring plan type');
  const inferredPlan = inferPlan(results);
  console.log(`Inferred plan: ${inferredPlan}`);

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

  console.log('💡 Recommendations:');
  if (results.basic.success && !results.advanced.success) {
    if (results.advanced.error === 'forbidden') {
      console.log('  • Advanced models are not available with the current plan.');
      console.log('  • Consider upgrading to Perplexity Pro: https://www.perplexity.ai/pro');
      console.log('  • Or continue using the basic Ask/Search features.');
    }
  }

  if (results.basic.error === 'unauthorized' || results.basic.error === 'network') {
    console.log('  • Re-check API key: https://www.perplexity.ai/account/api/group');
    console.log('  • Verify environment variable: echo $PERPLEXITY_API_KEY');
  }

  console.log('\n═══════════════════════════════════════════════════════');
}

main().catch(err => {
  const error = err as Error;
  console.error('❌ Error:', error.message);
  process.exit(1);
});
