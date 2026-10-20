# Request and download redirects

Initial URL validation remains mandatory at each request/download boundary.
`isAllowedUrl` owns HTTP host/API-path admission; native media downloads use
their existing narrower media URL, sender and filename checks. No redirect
policy broadens those initial authorities.

| Transport | Redirect policy | Observable boundary |
| --- | --- | --- |
| MV3 content-script HTTP | `redirect: 'error'` rejects redirects before following. | Fetch fails; no redirected body reaches the reader or API parser. Headers are caller-owned and browser credential defaults remain in effect. |
| GM HTTP | The manager follows redirects. The final URL must pass `isAllowedUrl` before response use or bounded JSON parsing. Missing destination metadata fails as unreadable. | This is post-response admission; it cannot prevent a prior redirected request or header/cookie disclosure. |
| GM XMLHTTP Blob download fallback | The manager follows redirects. The observed final URL must pass the existing media URL validator before Blob URL creation. | This protects handoff of a response, after manager dispatch and buffering. It does not enforce each hop. |
| Browser native downloads and GM download APIs | The browser/manager controls following redirects. The application retains initial media authority, exact filename, cancellation/completion ownership and no duplicate fallback. | These APIs provide no portable pre-follow destination callback. Chrome may expose `DownloadItem.finalUrl` after redirects; Firefox and userscript managers differ. Cancellation after creation is not a guarantee that no redirected request occurred. |

Canonical API/media requests do not need HTTP redirects in the maintained
deterministic request fixtures. Rejecting redirects in content-script Fetch
keeps that boundary explicit. Live provider routing can change; a failed
redirected request has no hidden compatibility retry with a weaker policy.

Userscript managers have different redirect APIs. [Tampermonkey's request
documentation](https://www.tampermonkey.net/documentation.php?ext=d2&q=GM_xmlhttpRequest)
offers build-dependent redirect modes that select Fetch, with different timeout
and progress behavior. [Violentmonkey's documented request API](https://violentmonkey.github.io/api/gm/)
does not offer the same option. The common adapter therefore retains the
manager-controlled route and explicitly limits its promise to response use.
Request headers and cookies remain subject to manager behavior across hops;
the application does not promise a pre-dispatch credential boundary there.

The native route avoids a preliminary body fetch or background HTTP proxy, which
would change media buffering, download identity and lifecycle. The
[Chrome downloads API](https://developer.chrome.com/docs/extensions/reference/api/downloads)
and [Firefox download API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/downloads/download)
own transfer and redirect behavior. No new host permission or endpoint is
introduced. Controlled fixtures establish application behavior and the tested
runtime only; they do not establish which live provider redirects are required
or the absence of an exploitable redirect at an allowed host.

For JSON body admission and manager-buffering limitations, see
[the metadata contract](twitter-api-contract.md#text-and-response-admission).
