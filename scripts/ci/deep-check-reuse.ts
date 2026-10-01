#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const SCHEMA = 3;
export const GATES = ['duplication', 'mutation'] as const;
type Gate = (typeof GATES)[number];
type RunnerEnv = Record<string, string | undefined>;
type Marker = {
  schema: number;
  gate: Gate;
  fingerprint: string;
  result: 'success';
  imageVersion: string;
  runId: number;
  runAttempt: number;
  sha: string;
  analyzedAt: string;
};
type ApiFetch = (url: string, init: RequestInit) => Promise<Pick<Response, 'ok' | 'json'>>;
type ApiRun = {
  id: number;
  run_attempt: number;
  head_sha: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
};
type ApiJob = {
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  steps?: Array<{
    name?: string;
    status?: string;
    conclusion?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
  } | null> | null;
};
type Decision = { reuse: boolean; reason: string; savedSeconds?: number };
type Manifest = {
  packageManager?: string;
  volta?: { node?: string; pnpm?: string };
};

function assertGate(gate: string | undefined): asserts gate is Gate {
  if (gate !== 'duplication' && gate !== 'mutation') throw new Error(`Unknown deep gate: ${gate}`);
}

export function runnerIdentity(env: RunnerEnv = process.env) {
  const { RUNNER_OS, RUNNER_ARCH, ImageOS, ImageVersion, DEEP_RUNNER_LABEL } = env;
  if (![RUNNER_OS, RUNNER_ARCH, ImageOS, ImageVersion, DEEP_RUNNER_LABEL].every(Boolean))
    return null;
  // Record ImageVersion in the marker while allowing pinned source-based checks
  // to reuse success across weekly runner image refreshes.
  return { os: RUNNER_OS!, arch: RUNNER_ARCH!, image: ImageOS!, label: DEEP_RUNNER_LABEL! };
}

export function fingerprint(gate: string, cwd = process.cwd(), env: RunnerEnv = process.env) {
  assertGate(gate);
  const runner = runnerIdentity(env);
  if (!runner) return null; // Unknown runner image must run the gate.

  const manifest = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf8')) as Manifest;
  if (!manifest.volta?.node || !manifest.volta?.pnpm || !manifest.packageManager) return null;

  const hash = createHash('sha256');
  hash.update(
    JSON.stringify({
      schema: SCHEMA,
      gate,
      runner,
      tools: {
        node: manifest.volta.node,
        pnpm: manifest.volta.pnpm,
        packageManager: manifest.packageManager,
      },
    })
  );

  // Hash the checked-out bytes, not just the index object IDs. A gitlink is
  // represented by its pinned commit; ordinary files include their mode and bytes.
  const entries = execFileSync('git', ['ls-files', '--stage', '-z'], { cwd })
    .toString('utf8')
    .split('\0');
  for (const entry of entries) {
    if (!entry) continue;
    const match = /^(\d{6}) ([0-9a-f]{40,64}) 0\t(.+)$/.exec(entry);
    if (!match) throw new Error(`Invalid or unmerged Git index entry: ${entry}`);
    const mode = match[1]!;
    const object = match[2]!;
    const path = match[3]!;
    hash.update(`\0${mode}\0${path}\0`);
    if (mode === '160000') {
      hash.update(object);
    } else if (mode === '120000') {
      hash.update(readlinkSync(`${cwd}/${path}`));
    } else {
      const file = `${cwd}/${path}`;
      const bytes = readFileSync(file);
      // Derive size and content from the same read result.
      hash.update(String(bytes.length));
      hash.update('\0');
      hash.update(bytes);
    }
  }
  return hash.digest('hex');
}

function readMarker(
  markerPath: string,
  gate: string,
  expectedFingerprint: string | null | undefined
): Marker | null {
  assertGate(gate);
  if (!expectedFingerprint || !/^[0-9a-f]{64}$/.test(expectedFingerprint)) return null;
  try {
    const marker = JSON.parse(readFileSync(markerPath, 'utf8')) as Record<string, unknown>;
    return marker.schema === SCHEMA &&
      marker.gate === gate &&
      marker.fingerprint === expectedFingerprint &&
      marker.result === 'success' &&
      typeof marker.imageVersion === 'string' &&
      marker.imageVersion.length > 0 &&
      Number.isSafeInteger(marker.runId) &&
      (marker.runId as number) > 0 &&
      Number.isSafeInteger(marker.runAttempt) &&
      (marker.runAttempt as number) > 0 &&
      typeof marker.sha === 'string' &&
      /^[0-9a-f]{40}$/.test(marker.sha) &&
      typeof marker.analyzedAt === 'string' &&
      Number.isFinite(Date.parse(marker.analyzedAt)) &&
      Date.parse(marker.analyzedAt) <= Date.now() + 60_000
      ? (marker as Marker)
      : null;
  } catch {
    return null;
  }
}

export function validMarker(
  markerPath: string,
  gate: string,
  expectedFingerprint: string | null | undefined
) {
  return readMarker(markerPath, gate, expectedFingerprint) !== null;
}

export function shouldReuse(
  valid: boolean,
  cacheHit: string | undefined,
  restoreOutcome: string | undefined,
  eventName: string | undefined,
  reuseSuccess: string | undefined
) {
  return (
    valid &&
    cacheHit === 'true' &&
    restoreOutcome === 'success' &&
    (eventName === 'schedule' || (eventName === 'workflow_dispatch' && reuseSuccess === 'true'))
  );
}

export function writeMarker(
  markerPath: string,
  gate: string,
  expectedFingerprint: string | undefined,
  env: RunnerEnv = process.env
) {
  assertGate(gate);
  if (!expectedFingerprint || !/^[0-9a-f]{64}$/.test(expectedFingerprint))
    throw new Error('Invalid fingerprint');
  if (!env.ImageVersion) throw new Error('Runner image version is required');
  const runId = Number(env.GITHUB_RUN_ID);
  const runAttempt = Number(env.GITHUB_RUN_ATTEMPT);
  if (!Number.isSafeInteger(runId) || runId <= 0) throw new Error('Invalid run ID');
  if (!Number.isSafeInteger(runAttempt) || runAttempt <= 0) throw new Error('Invalid run attempt');
  if (!env.GITHUB_SHA || !/^[0-9a-f]{40}$/.test(env.GITHUB_SHA)) throw new Error('Invalid run SHA');
  mkdirSync(dirname(markerPath), { recursive: true });
  writeFileSync(
    markerPath,
    `${JSON.stringify({
      schema: SCHEMA,
      gate,
      fingerprint: expectedFingerprint,
      result: 'success',
      imageVersion: env.ImageVersion,
      runId,
      runAttempt,
      sha: env.GITHUB_SHA,
      analyzedAt: new Date().toISOString(),
    })}\n`
  );
}

const MAX_PAGES = 10;
const PAGE_SIZE = 100;
const API_BUDGET_MS = 20_000;
const JOB_NAMES: Record<Gate, string> = {
  duplication: '🔍 Duplication',
  mutation: '🧬 Mutation',
};
const ANALYSIS_STEP_NAMES: Record<Gate, string> = {
  duplication: '🔎 Check for new duplication',
  mutation: '🧬 Run mutation gate',
};

function analysisSeconds(job: ApiJob, gate: Gate): number | undefined {
  if (!Array.isArray(job.steps)) return undefined;
  if (job.steps.some((step) => !step || typeof step !== 'object' || Array.isArray(step)))
    return undefined;
  const selected = job.steps.filter((step) => step?.name === ANALYSIS_STEP_NAMES[gate]);
  if (selected.length !== 1) return undefined;
  const step = selected[0];
  if (!step) return undefined;
  if (
    step.status !== 'completed' ||
    step.conclusion !== 'success' ||
    typeof step.started_at !== 'string' ||
    typeof step.completed_at !== 'string' ||
    typeof job.started_at !== 'string' ||
    typeof job.completed_at !== 'string'
  )
    return undefined;
  const start = Date.parse(step.started_at);
  const end = Date.parse(step.completed_at);
  const jobStart = Date.parse(job.started_at);
  const jobEnd = Date.parse(job.completed_at);
  if (
    ![start, end, jobStart, jobEnd].every(Number.isFinite) ||
    start < jobStart ||
    end > jobEnd ||
    end < start ||
    end - start >= 24 * 60 * 60_000
  )
    return undefined;
  return Math.floor((end - start) / 1000);
}

function date(value: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error('Invalid API timestamp');
  return timestamp;
}

export async function evaluateReuse(
  markerPath: string,
  gate: string,
  expectedFingerprint: string | null | undefined,
  env: RunnerEnv = process.env,
  apiFetch: ApiFetch = fetch
): Promise<Decision> {
  assertGate(gate);
  if (
    !shouldReuse(
      validMarker(markerPath, gate, expectedFingerprint),
      env.CACHE_HIT,
      env.RESTORE_OUTCOME,
      env.GITHUB_EVENT_NAME,
      env.REUSE_SUCCESS
    )
  ) {
    const reason =
      env.GITHUB_EVENT_NAME === 'workflow_dispatch' && env.REUSE_SUCCESS !== 'true'
        ? 'manual-fresh'
        : env.CACHE_HIT !== 'true'
          ? 'cache-miss'
          : 'marker-or-policy-invalid';
    return { reuse: false, reason };
  }
  const marker = readMarker(markerPath, gate, expectedFingerprint)!;
  const runId = Number(env.GITHUB_RUN_ID);
  const runAttempt = Number(env.GITHUB_RUN_ATTEMPT);
  const repository = env.GITHUB_REPOSITORY;
  const defaultBranch = env.DEFAULT_BRANCH;
  if (
    !Number.isSafeInteger(runId) ||
    runId <= 0 ||
    !Number.isSafeInteger(runAttempt) ||
    runAttempt <= 0 ||
    !repository ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository) ||
    !defaultBranch ||
    !/^[\w./-]+$/.test(defaultBranch) ||
    env.GITHUB_REF !== `refs/heads/${defaultBranch}` ||
    !env.GH_TOKEN ||
    runId === marker.runId
  )
    return { reuse: false, reason: 'provenance-unavailable' };

  const deadline = Date.now() + API_BUDGET_MS;
  const base = `${env.GITHUB_API_URL || 'https://api.github.com'}/repos/${repository}`;
  async function get<T>(path: string): Promise<T> {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('API deadline exceeded');
    const response = await apiFetch(`${base}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${env.GH_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(remaining),
    });
    if (!response.ok) throw new Error('API request failed');
    return (await response.json()) as T;
  }
  async function allPages<T>(path: string, key: string): Promise<T[]> {
    const values: T[] = [];
    let total: number | undefined;
    for (let page = 1; page <= MAX_PAGES; page++) {
      const separator = path.includes('?') ? '&' : '?';
      const body = await get<Record<string, unknown>>(
        `${path}${separator}per_page=${PAGE_SIZE}&page=${page}`
      );
      if (
        !Number.isSafeInteger(body.total_count) ||
        (body.total_count as number) < 0 ||
        !Array.isArray(body[key])
      )
        throw new Error('Incomplete API page');
      if (total === undefined) total = body.total_count as number;
      if (body.total_count !== total || total > MAX_PAGES * PAGE_SIZE)
        throw new Error('History exceeds bound or changed during pagination');
      const items = body[key] as T[];
      if (items.length > PAGE_SIZE || (items.length === 0 && values.length < total))
        throw new Error('Incomplete API page');
      values.push(...items);
      if (values.length === total) return values;
      if (items.length !== PAGE_SIZE) throw new Error('Incomplete API page');
    }
    throw new Error('History pagination limit');
  }

  try {
    const runs = await allPages<ApiRun>(
      `/actions/workflows/deep-checks.yaml/runs?branch=${encodeURIComponent(defaultBranch)}`,
      'workflow_runs'
    );
    if (new Set(runs.map((run) => run.id)).size !== runs.length)
      throw new Error('Duplicate workflow run');
    const origin = runs.find((run) => run.id === marker.runId);
    if (
      !origin ||
      origin.run_attempt !== marker.runAttempt ||
      origin.head_sha !== marker.sha ||
      origin.status !== 'completed'
    )
      return { reuse: false, reason: 'origin-invalid' };
    const analyzedAt = date(marker.analyzedAt);
    const originCreatedAt = date(origin.created_at);
    if (originCreatedAt > analyzedAt + 120_000 || date(origin.updated_at) < analyzedAt - 120_000)
      return { reuse: false, reason: 'origin-invalid' };
    const candidates = runs.filter((run) => {
      if (run.id === runId && run.run_attempt === runAttempt) return false;
      if (run.id === marker.runId && run.run_attempt === marker.runAttempt) return true;
      return date(run.created_at) >= originCreatedAt || date(run.updated_at) >= originCreatedAt;
    });
    let savedSeconds: number | undefined;
    for (const run of candidates) {
      if (
        !Number.isSafeInteger(run.id) ||
        !Number.isSafeInteger(run.run_attempt) ||
        run.run_attempt <= 0 ||
        !run.head_sha ||
        run.status !== 'completed'
      )
        return { reuse: false, reason: 'newer-gate-incomplete' };
      const jobs = await allPages<ApiJob>(
        `/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs`,
        'jobs'
      );
      const selected = jobs.filter((job) => job.name === JOB_NAMES[gate]);
      if (selected.length !== 1) return { reuse: false, reason: 'gate-history-incomplete' };
      const job = selected[0]!;
      if (run.id !== marker.runId && job.status === 'completed' && job.conclusion === 'skipped')
        continue;
      if (job.status !== 'completed' || job.conclusion !== 'success')
        return {
          reuse: false,
          reason: run.id === marker.runId ? 'origin-invalid' : 'newer-gate-invalid',
        };
      if (run.id === marker.runId) {
        if (
          !job.started_at ||
          !job.completed_at ||
          date(job.started_at) > analyzedAt + 120_000 ||
          date(job.completed_at) > analyzedAt + 120_000
        )
          return { reuse: false, reason: 'origin-invalid' };
        savedSeconds = analysisSeconds(job, gate);
      }
    }
    return savedSeconds === undefined
      ? { reuse: true, reason: 'validated-history' }
      : { reuse: true, reason: 'validated-history', savedSeconds };
  } catch {
    return { reuse: false, reason: 'api-unavailable-or-incomplete' };
  }
}

function output(line: string) {
  if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required');
  appendFileSync(process.env.GITHUB_OUTPUT, `${line}\n`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [, , command, gate, value, markerPath] = process.argv;
  assertGate(gate);
  if (command === 'fingerprint') {
    const value = fingerprint(gate);
    output(`cacheable=${Boolean(value)}`);
    output(`fingerprint=${value ?? 'unavailable'}`);
  } else if (command === 'verify') {
    const decision = await evaluateReuse(markerPath!, gate, value);
    output(`reuse=${decision.reuse}`);
    output(`reason=${decision.reason}`);
    if (decision.savedSeconds !== undefined) output(`saved_seconds=${decision.savedSeconds}`);
    const marker = readMarker(markerPath!, gate, value);
    if (marker) {
      output(`origin_run_id=${marker.runId}`);
      output(`origin_run_attempt=${marker.runAttempt}`);
      output(`origin_sha=${marker.sha}`);
      output(`origin_analyzed_at=${marker.analyzedAt}`);
    }
  } else if (command === 'mark') {
    writeMarker(markerPath!, gate, value);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
}
