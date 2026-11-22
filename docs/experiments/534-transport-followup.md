# CRC Phase 0 follow-up — 2026-11-12

This follows [review6813420024](https://github.com/PiesP/xcom-enhanced-gallery/issues/534#issuecomment-6813420024).
The original successful and failed receipts remain unchanged. The initial
[Phase 0 record](534-phase0.md) is historical evidence, not a claim that its
incomplete primary cohort passed.

**Disposition: RETAIN_CURRENT.** The explained fixture correction qualified the
frozen five-first-use/ten-warm larger cohort. Its conservative removable kernel
cost does not plausibly reach the required 50 ms product saving. Rust, manager
provisioning and a TypeScript CRC alternative were not introduced. The issue
stays open for human review of the retained regression tools in PR #538.

## Preparation and admission

Harness `931165b833df70dc8bd62b118e8e133ea69021ae` removes four redundant
installation assets. The existing controller already packages the declared
inputs directory; no schema field or controller framework was added. With the
four task-owned MP4s held separately, ordinary installed preparation planning
reported no conflicts/missing inputs and an actual small CRC bundle completed.
Its complete payload manifest hashes were checked with zero MP4 inputs. Originals
were then restored. Focused tests reject missing or wrong-hash originals for the
large workload and serve only small routes with no clips.

Functional success is separate from performance eligibility. A warm sample can
enter `performanceCohort` only when `cacheConditionQualified === true`; ineligible
attempts remain in `samples`. A focused negative case covers functional success
with unqualified cache. The conservative `idealCrcRemovalUpperBoundMs` now unions
both `crc-table` and `crc-active` intervals, preserving overlap. Yields and all
other product work remain outside this removable-kernel screen.

## One unchanged-artifact diagnostic

The sole initial diagnostic used harness `931165b8`, installed Edge
157.0.4341.46 and the exact four original MP4s. Product content.js SHA-256 was
`a8bb70a80c7113c454f7df36eabfbbd0bedccc335776ee8010f0516a95667859`;
manifest SHA-256 was
`ad4c56c97793fd258901d6d141d20e373f151568ca78f1ab62b6b8c9051aa8c4`.
The product code, listener maxConnections=8, five-second header/request limits,
one-second keep-alive, default one-second keep-alive buffer, 20-second socket
owner timeout, trust/host/path/request/byte guards were unchanged.

Bounded server observations and a default-privacy NetLog captured three real
action-fetch `ERR_CONNECTION_ABORTED` failures for the largest source. Accepted
TCP and TLS counts were nine, peak active sockets eight, drops three, TLS client
errors zero, and event overflow zero. All nine sockets closed and cleanup
reported zero active sockets. HTTP response counters alone had shown no error.

Two failed URL requests are linked through NetLog stream/connect/socket
dependencies and exact local-endpoint matches to the Node drop events. The third
has a connect-address lookup error: its timing matches the remaining drop, but
its endpoint was not retained and is not claimed as an exact match. Browser
request IDs, method/type/Range and distinct start/failure phases are retained
privately. Node performance.timeOrigin/atMs and NetLog tick offset are preserved;
the correlation does not silently combine their clock origins.

The accepted renderer/media connections occupied the single listener. Media and
archive requests used distinct Chromium privacy-mode socket pools. Completed
image keep-alives closed later, after which a subsequent product retry acquired
a slot and saved the complete 2,993,158-byte ZIP with all four verified members.
The diagnostic still **failed** because its real console/fetch errors remain
errors, and its performance cohort is empty. This diagnoses admission pressure
for the reproduced connections, not every historical network failure.

Server `finish` is OS write completion, not proof of browser receipt/cache
completion. Browser completion and independent saved ZIP member identity remain
separate. Raw NetLog, ephemeral endpoints, VM identities and media stay private.

## Bounded fixture correction and fresh cohort contract

In tested harness `46105d696700b332b1b6ebcd6e34678986d86d60`, the CRC owner called Node's
`server.closeIdleConnections()` immediately before the trusted bulk click. This
releases idle renderer/media HTTP keep-alives before the distinct archive pool
needs a slot. It does not increase the eight-connection limit or close in-flight
HTTP requests/responses. Tests verify idle connection closure, preservation of
an active held response and subsequent connection admission with the cap intact.
No HTTP clientError or server/request/response timeout listener is installed.
The existing raw-socket timeout callback retains termination ownership.

The correction changes the fixture protocol, not product bytes. Five fresh
installed-browser/profile invocations each executed one first-use and two
fresh-page warm actions on the frozen larger workload. No diagnostic browser or
prewarmed profile is reused. No NetLog or diagnostic action enters this cohort.
All three actions passed complete saved-member verification, warm admission
was true, and transport drops/observation overflow were zero. All five
invocations passed without replacement. The first corrected invocation was
declared as part of this fresh cohort before execution; it did not reuse the
diagnostic browser or become a performance sample retrospectively.

## Completed product and component evidence

The [retained pre-run plan](534-fixed-cohort-plan.json) and
[sanitized 15-sample index](534-fixed-cohort.json) bind the exact harness/core,
product hashes, five original bundle/result/collection digests, interval
unions, actual sample counts and output summary. The
[failed diagnostic summary](534-transport-diagnostic.json) remains separate.

| Metric, ms | First-use, n=5 | Qualified warm, n=10 |
| --- | ---: | ---: |
| Action → final OwnedBlob median | 89.60 | 66.30 |
| Range | 85.10–102.40 | 62.20–73.80 |
| MAD | 1.80 | 2.20 |
| CRC active median | 8.50 | 8.25 |
| CRC active + table union median | 8.70 | 8.55 |
| CRC active + table union range | 8.10–9.50 | 7.60–10.20 |

The observed removable kernel union is at most 10.20 ms in these warm samples.
Even ideal removal does not plausibly supply the mandatory **50 ms AND 10%**
product improvement on this frozen workload. This is an early cost screen, not
a measured Rust speedup, universal latency ceiling or claim about all larger
archives. The small historical cohort is not pooled with these corrected larger
observations. No candidate was timed, so no candidate MAD/significance claim or
post-hoc regression budget was introduced. No p95/p99 is inferred.

Every action retained six CRC chunks, maximum 1 MiB each, with TS yields/abort
ownership unchanged. All 15 native saved archives had SHA-256
`413c292585c4ff05cc0720222286fa57b473fc6a881eb079224506582e9ed4e8`,
2,993,158 bytes and the same four independently verified stored members. Browser
outer filenames naturally acquired `(1)`/`(2)` suffixes during repeated saves;
each actual name is retained in the index. Member-name/source/byte identity is
unchanged. Observed identical order does not impose a new input-order contract.
The canonical output summary digest is
`d3404c1f547834668ea6d2b933d42594af379e8f96c9f5e5fef9188c2b2869aa`.

Five original source/artifact manifests and all collected-file digests were
checked. Every page closed genuinely after verification; every invocation
collected and cleaned its guest root. Transport closed all accepted sockets,
with zero drops, TLS errors and observation overflow. The post-readiness
1,000 timer-pair calibration took 0.2–0.5 ms; it does not establish full-profiler,
serialization or transport-observer overhead. Interval unions preserve overlap;
network-fetch includes response materialization and is not a separate copy CPU
measurement. Native/peak memory and live-site latency remain unqualified.

## Final no-WASM tree and reproducibility

Product source under `src/` is restored byte-for-byte to baseline
`473d853ccad10293fa10a3cb7267557b71c91359`. The temporary product module/build
flag/DOM reporter, executable CRC selector/profile, MP4 setup and benchmark-only
verifier changes are removed. No Rust/Cargo/glue/WASM/optimizer/dependency/core,
Worker, CSP, host/grant or browser-security change is retained.

Keep only bounded generic HTTPS observations, the explicit idle-connection owner
API, post-close receipts and their protocol regression tests, plus durable
evidence. Normal installed runs do not opt into transport observation and do not
automatically reap idle connections. No orphan performance-admission engine
remains in the product or ordinary runner. The tested warm-negative and
overlap/input tests are preserved with their full tested harness source below.

The inert [reproduction patch](534-crc-preflight.patch), SHA-256
`ca4c71492e09d96c1c793d2299daa74de37946a61dc023de526b1f36e813e138`,
applies to baseline `473d853c` and reconstructs the complete tested tree
`86f7c192291ad908b6e76ce71b05c337c794c6d1` of `46105d69`. A separate temporary Git
index verified that exact tree. It is never imported or applied by builds/CI.
Owned original inputs and old selectors remain with the private evidence owner;
the archived README contains their exact producer/copy/hash requirements. No
media or raw NetLog is published.

All new-WASM delivery/probe/final-module and store cells in the historical
nine-context matrix remain explicitly NOT_RUN. The cost-screen stop precedes
manager provisioning and Rust qualification; unrun cells are not incompatibility
findings. Existing userscript IIFE and extension byte-delivery contracts remain.
No #473 publication work, merge, deployment, release or settings change occurred.

## Validation and remaining admission

The tested experiment passed 12 focused preparation/admission/transport cases,
including negative warm-cache admission and overlapping kernel intervals.
After retiring it, the retained generic owner passed six lifecycle/transport
cases with observation both disabled and enabled, plus five existing native
fixture cases. `vp run verify` passed quality/policy checks and all three CI
production builds. Source-writing boundary-test probes settled before staging;
no generated probe or private input was added. Corrected local test/type-check
failures remain private and are not performance attempts. A scratch auditor's
initial outer-filename equality assumption was corrected to preserve normal
browser uniquification without changing any receipt or product behavior.

Default no-WASM userscript SHA-256 is
`d5f3ce6cedacb1d8d988d40489f8763df9cd1624d76aaaca093e883982611646`;
Chromium and Firefox content.js SHA-256 is
`42e61ae3e19b9d38b84160e3759606b8bb0ce596a8be3b0f63cb486c0ed4acdf`.
These rebuilt baseline-source products are distinct from the opt-in timed
artifact; they are not new performance or WASM compatibility evidence. The owned
desktop lease was closed and the final guest audit found zero validation-owned
browser/Node processes. Unrelated manual processes and VM power were preserved.

Remote exact-head jobs, skipped checks, code-scanning comparison coverage and
human admission must be read separately on PR #538. This source/evidence result
does not grant approval or merge authority. Keep #534 open until the retained
changes have passed review and landed.
