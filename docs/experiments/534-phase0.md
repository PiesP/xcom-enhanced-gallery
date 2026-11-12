# CRC32 Phase 0 — 2026-11-12

Disposition for [#534](https://github.com/PiesP/xcom-enhanced-gallery/issues/534):
**BLOCKED**. No Rust candidate or TypeScript CRC alternative was introduced.
The useful larger workload does not have the required five first-use and ten
warm observations. An actual browser fetch failure produced a partial ZIP in
the next invocation after a successful three-action run. The successful samples
are diagnostic evidence, not a measured no-go or an adoption result.

## Source and measurement boundary

The refreshed baseline is `473d853ccad10293fa10a3cb7267557b71c91359`, rather than
the issue's historical research revision. The unchanged core gitlink is
`4638d703806b38734430a761104ee73512cbdf5c`. The completed Edge cohort and failed
large invocation used `b3f67365bdf6b2a862409168a450b9f1b7b2c63f`.
Node 26.13.1, pnpm 12.18.0 and Vite+ 1.5.1 were used; dependencies, core, browser
security settings and manifest/grant scope were not updated.

The primary observation starts at the trusted bulk-download click and ends when
the production orchestrator receives the final `OwnedBlob`, before adapter save
and independently of the 300 ms indicator floor. Native saved-file verification
is separate. The production CRC algorithm, maximum 1 MiB chunks, TS-owned yields,
abort checks, admission limits and commit-order contract remain unchanged.

`VITE_ZIP_CRC_PROFILE=1` opts the task build into bounded numeric instrumentation.
Without it, the reporter does not publish a DOM receipt. The Windows selector is
owned by `validation/windows/zip-crc-profile.ts`, under the existing installed
extension route. It uses the existing scoped native HTTPS fixture, without
`context.route`, a new trust installation, global certificate override or page
security-header change. Media has a one-hour cache header. Warm qualification
also requires actual source-transfer observations. Each invocation owns a fresh
browser profile, one first-use action and two warm actions on fresh pages. Every
saved ZIP is verified before genuine page closure; no ownership-ledger reset or
synthetic lifecycle event is used.

The delivered extension manifest SHA-256 was
`ad4c56c97793fd258901d6d141d20e373f151568ca78f1ab62b6b8c9051aa8c4`,
and content.js SHA-256 was
`a8bb70a80c7113c454f7df36eabfbbd0bedccc335776ee8010f0516a95667859`.
The normal product reporter ran in the installed extension content script;
the separately observed main-frame context was nondefault with an extension
origin. This establishes realm identity, not WASM compilation permission.

## Frozen owned workloads

Small is the existing three browser-generated JPEG originals, 480×320, 560×360
and 640×400. The resulting stored ZIP is 14,197 bytes. Their sizes and SHA-256 are:

| Bytes | SHA-256 |
| ---: | --- |
| 4,237 | `991f60cfda525c43bfdb510bb8e363d79da0cdcade09e0a960c98a7b88365ade` |
| 4,711 | `bd8bb9ae1f472bc782773cffa26cc45cf2eb31ac553c93ebf4311558e7e9a258` |
| 4,795 | `3b89f353723b57190cafa7694d3bbe28d23d328d2be5f0caa3332e7a4a469c6a` |

Larger is four distinct, previously owned short MP4 fixtures. They represent a
supported four-clip archive, not measured field prevalence. No payload was
padded, duplicated or newly enlarged to favor a kernel. Total media is 2,992,536
bytes; the complete stored ZIP is 2,993,158 bytes.

| Input | Dimensions / duration | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| clip | 640×360 / 10 s | 2,857,140 | `352daf37b350f50a069c3911b32248c5adb7684ade30b525f6c25685c3b80f5e` |
| motion | 320×180 / 3 s | 98,399 | `36dd064afeefde15ecceea49109fffee6b17cdf0962de6eb21e0255fdd0cb8f8` |
| small | 160×90 / 1 s | 5,184 | `de4c15ff513d41c964eadb5d45ce08030b2a94eea501e9f86edfd8a301e1411e` |
| markers | 320×180 / 1.2 s | 31,813 | `c93c7e6c6102e36089ee5aa79d9fa9758be8b7f62ac1043247ebb22399770004` |

Both workloads stay inside current product admission and the existing 4 MiB
saved-file verifier. Only the exact largest source size/hash can exceed the
native fixture's default 256 KiB per-source bound; its existing 16 MiB cumulative
response bound remains. Inputs and private VM receipts stay with the measurement
owner, outside published assets. The selector and fixtures must be supplied as
described in the Windows README before reproducing this task branch.

## Observations

Installed Windows Edge 157.0.4341.46 ran the normal unpacked extension. Five small
invocations passed: five first-use and ten cache-qualified warm observations.
Source/artifact bindings, collected-file hashes, all saved ZIP members and
controller cleanup were checked. The small output names retain their preassigned
source/byte identity; the verifier allows the production commit-order contract.

| Small workload metric, ms | First-use (n=5) | Warm (n=10) |
| --- | --- | --- |
| Click → final OwnedBlob median | 41.10 | 41.35 |
| Range | 37.80–44.20 | 37.20–44.20 |
| MAD | 2.50 | 1.00 |
| CRC active median | 0.50 | 0.50 |
| CRC active + table construction median | 0.70 | 0.70 |

First-use raw product samples: `44.2, 40.2, 43.6, 37.8, 41.1` ms.
Warm raw product samples: `43.5, 40.4, 44.2, 40.7, 40.4, 40.6, 43.6, 37.2,
42.0, 42.4` ms. Warm CRC active samples: `0.5, 0.3, 0.4, 0.6, 0.5, 0.5, 0.5,
0.7, 0.3, 0.4` ms. These do not establish a larger-workload result.

The one complete large invocation passed all three outputs and actual cache
checks: product `99.9 / 66.3 / 65.9` ms, CRC active `11.4 / 8.8 / 7.4` ms,
and CRC plus table construction `11.7 / 9.0 / 7.6` ms (first-use / warm / warm).
Six kernel chunks respected the 1 MiB maximum. Do not infer a qualified median,
noise-screen result or universal Rust ceiling from these three observations.

The next invocation at the same source and content-script hash failed. Four
action-phase fetch attempts for the largest source reported
`net::ERR_CONNECTION_ABORTED`; a fetch for the next clip also failed before a
later retry succeeded. No largest-source action request reached the native
handler. That handler reported no unexpected route, overflow or server error,
and served 3,101,483 bytes. Product partial-success handling produced a 135,868
byte ZIP missing the 2,857,140 byte member. Its 1,849 ms product time and 1.8 ms
CRC are **invalid baseline samples**. The cause beyond the observed browser-side
connection abort is unknown; connection reuse, cache or TLS explanations remain
hypotheses. No retry campaign was used to select only favorable successes.

Earlier failed preflights remain preserved: an initial transfer/console failure,
a cache-aware media-abort predicate failure, a pre-browser expired-desktop guard,
and an observation-start/phase predicate failure. The latter predicates were
narrowly corrected. Expected pre-click media `ERR_ABORTED` requires exact owned
source identity, real video readiness, full-range 206 bytes/hash, independently
verified ZIP, and either current delivery or a proven cached response from the
same fixture run. Action-phase fetch and connection errors remain failures.

The original small receipts incorrectly labeled their top-level `fixture` field
with the available MP4 inventory. Their selected expected entries and verified
JPEG members were correct. Future receipt metadata is corrected to the selected
workload; original files are not rewritten. The correction changes only the
Windows report, not the timed product or fixture generation.

A separate installed Chrome 157.0.8103.52 confirmation at
`33a8fa100a781ee56678c76bddd9574aae3e6363` passed three small actions, selected
JPEG receipt metadata, saved ZIP identity, genuine page teardown and transport
cleanup. Content.js and manifest hashes matched the Edge artifact above.
Product times were `283.6 / 44.7 / 43.7` ms and CRC active times
`0.4 / 0.3 / 0.7` ms (first-use / warm / warm). This is a separate confirmation,
not Chrome's full baseline, and is not pooled with Edge.

## Attribution and limits

CRC interval union is a conservative upper bound on removable active kernel
work; table construction is separately available. Yields stay with TS. Provider,
admission, commit wait, Blob-to-ArrayBuffer, headers, finalization and Blob
construction are recorded where exercised. Small provider/materialization and
large direct-URL paths differ. Direct-URL `network-fetch` includes response
materialization; its internal network/copy split is not independently timed.
Overlapping stage durations must not be summed into CPU percentages. Full
loading/copy/lifecycle qualification for an acceleration candidate was not done.

The post-boundary 1,000 timer-pair calibration took 0.2–0.5 ms in the small
cohort. It does not measure complete profiler/DOM serialization overhead. Each
report is capped at 128 spans; no retained valid sample overflowed. Renderer heap
point-sample increases before saved-file verification were 1.287–1.303 MiB for
small and 0.753–1.875 MiB for the successful large invocation. These are not peak,
native, manager Blob lifetime or leak measurements. No candidate regression
budgets, p95/p99, cancellation qualification or adoption claims are made.

## Context matrix

Every new-WASM compile/instantiate/export cell and every store submission/review
cell is **NOT_RUN**. No probe, Rust module, encoded WASM, loader, CSP edit,
resource declaration or fallback change was introduced.

| Context | Actual record for this experiment | Remaining evidence |
| --- | --- | --- |
| Edge extension | Installed 157.0.4341.46; exact unpacked package and normal nondefault content-script identity; small cohort passed, large cohort blocked as above | Complete primary cohort; normal-realm WASM permission and final-module qualification untested |
| Chrome extension | Installed 157.0.8103.52; separate three-action small confirmation, exact package and normal content-script identity | Independent primary and WASM evidence; Edge results do not qualify Chrome |
| Firefox extension | Installed inventory 160; maintained filename-focused route, no #534 CRC execution | Normal installed CRC/WASM realm, artifact, CSP and byte delivery unqualified |
| Chrome / Tampermonkey | NOT_RUN; actual reviewed package/version/hash, Content Script API setting and injection world UNKNOWN | Supply validated unpacked manager directory, then source-bound installed run and settings/CSP readback |
| Edge / Tampermonkey | Separate NOT_RUN row; same unknown package/configuration prerequisites | Separate installed Edge/manager run; Chrome or download-mode observations do not substitute |
| Brave extension | Advertised; no applicable maintained installed route established here | Browser/version, package, realm and permission UNKNOWN |
| Violentmonkey userscript | Outside current controller's tested manager coverage; NOT_RUN | Manager/browser/configuration and normal realm UNKNOWN |
| Firefox userscript | Separate from the Firefox extension; NOT_RUN | No applicable installed-manager route established here |
| Safari userscript | NOT_RUN | Windows/Chromium does not qualify Safari |

The documented Tampermonkey 5.5.1 preparation pin is not an installed-version
readback. No reviewed manager package or configured package path was found in
the inspected task/configuration paths; this is not a claim about all storage.
The existing controller requires an explicit validated `--manager-directory`.

Static source/manifests preserve the single-file IIFE userscript and locally
packaged extension content.js, scoped to the existing X/Twitter matches. Any
future userscript WASM bytes must remain inside that one file; extension
executable bytes must ship locally. The extension-pages CSP is
`script-src 'self'; object-src 'none';`. The owned fixture response had no CSP
header; live X.com CSP is UNKNOWN. Extension-page CSP does not alone establish
content-script permission. Chrome's isolated-world policy and Firefox's MV3 CSP
must be assessed independently, using only necessary extension-local
`wasm-unsafe-eval` and exact packaged resources if required by the actual loader.
No target-page CSP, grants, site scope or browser security setting may be widened.

Primary policy references: [Chrome content-script CSP](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#content-security-policy),
[packaged resource declarations](https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources),
[Firefox extension CSP](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy),
[Tampermonkey sandbox settings](https://www.tampermonkey.net/documentation.php?locale=en&q=sandbox).
Static feasibility, runtime acceptance and future store approval remain separate.

## Resume conditions

Local validation passed: `vp run verify` (quality/policy checks and all three CI
production builds), three focused measurement tests, five native-fixture tests
through the configured `windows-native` Vite+ project, and ten existing CRC/ZIP
response-bound regressions. With the opt-in absent, all three delivered products
omit the temporary DOM report attribute; the extension content.js SHA-256 is
`7273a21220b97105bc649328c86d50e1c1377feba22947301b4ae298af61f81e`.
That default-build artifact is distinct from the opt-in measured artifact above.
No installed Firefox/userscript, final WASM, publication or store acceptance is
implied by these checks. The owned desktop lease was stopped and a final
read-only guest audit found zero validation-owned browser/Node processes.

Owner: the product's Windows native-HTTPS measurement owner. Establish reliable
normal-content-realm full delivery of the exact largest owned source without
weakening transport guards, then collect the unchanged five first-use/ten warm
primary cohort with complete saved-member identity. A separately evidenced
transport correction or restored capability is the resume trigger; mere later
success does not erase the failed receipt.

Only a qualified cohort can support the issue's early stop-before-Cargo rule.
If the removable CRC critical-path bound cannot reach both 10% and 50 ms, a
no-code `RETAIN_CURRENT` decision may leave unrun WASM cells explicit. Otherwise
qualify all five maintained normal execution contexts and actual byte delivery
before a Rust pipeline, including the reviewed manager package prerequisite.
Then freeze candidate budgets and validate the final optimized module/glue.

This branch preserves reproducible, opt-in experimental instrumentation and the
consumer-owned harness as **unqualified draft work**. It is not an acceleration
backend ready for admission. At the reviewed `8806e150` snapshot, its task profile listed all four owned
MP4 inputs as bundle assets, including when another installed scenario is
selected. That historical checkout without those measurement-owned inputs could not prepare
the Windows bundle. Follow-up `931165b8` removes the redundant global assets and
loads originals only for the large CRC case; missing/wrong originals still fail.
The historical diagnostic remains failed, and the corrected transport needs its
own fresh primary cohort. See [the follow-up record](534-transport-followup.md).
The issue remains open. No merge, deployment,
publication, #473 final-ZIP work, provider-setting change or infrastructure
campaign is included.
