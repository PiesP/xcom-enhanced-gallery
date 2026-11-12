# CRC Phase 0 follow-up — 2026-11-12

This follows [review6813420024](https://github.com/PiesP/xcom-enhanced-gallery/issues/534#issuecomment-6813420024).
The original successful and failed receipts remain unchanged. The initial
[Phase 0 record](534-phase0.md) is historical evidence, not a claim that its
incomplete primary cohort passed.

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

At the existing CRC fixture phase boundary, the owner now calls Node's
`server.closeIdleConnections()` immediately before the trusted bulk click. This
releases idle renderer/media HTTP keep-alives before the distinct archive pool
needs a slot. It does not increase the eight-connection limit or close in-flight
HTTP requests/responses. Tests verify idle connection closure, preservation of
an active held response and subsequent connection admission with the cap intact.
No HTTP clientError or server/request/response timeout listener is installed.
The existing raw-socket timeout callback retains termination ownership.

The correction changes the fixture protocol, not product bytes. Five fresh
installed-browser/profile invocations will each execute one first-use and two
fresh-page warm actions on the frozen larger workload. No diagnostic browser or
prewarmed profile is reused. No NetLog or diagnostic action enters this cohort.
All three actions must pass complete saved-member verification, warm admission
must be true, and transport drops/observation overflow must be zero. Preserve
every attempt and stop on an invalid invocation rather than replacing it with a
favorable retry. Record this harness revision separately from product hashes.

Only this completed primary cohort can support an early no-Rust cost decision.
If it remains incomplete, keep BLOCKED with the exact missing evidence. No
manager provisioning or Rust pipeline is justified before that screen passes.
