# Request and download redirects

Initial URL validation remains mandatory at each request/download boundary.
`isAllowedUrl` owns HTTP host/API-path admission; native media downloads use
their existing narrower media URL, sender and filename checks. No redirect
policy broadens those initial authorities.

| Transport | Authority and redirect boundary | Headers and credentials | Cancellation and completion |
| --- | --- | --- | --- |
| MV3 content-script HTTP | `isAllowedUrl` admits the initial URL; `redirect: 'error'` rejects redirects before following, so no redirected body reaches the reader or API parser. | The caller supplies headers; browser credential defaults remain in effect. | `AbortController` owns abort and timeout; the adapter reports one terminal callback and settlement. |
| GM HTTP | `isAllowedUrl` admits the initial URL. The manager follows redirects; the final URL must pass `isAllowedUrl` before response use or bounded JSON parsing. Missing destination metadata fails as unreadable. | Caller headers and browser/manager cookies may cross hops under manager policy; final admission cannot prevent prior disclosure. | The GM request handle owns abort; manager callbacks report completion, failure, timeout or abort, with one adapter settlement. |
| GM XMLHTTP Blob download fallback | The initial media URL passes `isValidMediaUrl`. After manager following and buffering, the observed final URL must pass the same validator before Blob URL creation; the application does not enforce intermediate-hop destinations. | This GET supplies no custom headers; the manager controls cookies and redirect dispatch. | The GM handle aborts on cancellation or size failure. A successful Blob becomes a page-owned anchor URL; its lease and URL remain until real page teardown because anchor dispatch has no native completion signal. |
| Browser native downloads and GM download APIs | The initial media URL passes `isValidMediaUrl`; the browser/manager controls following and provides no portable pre-follow destination callback. Chrome may expose `DownloadItem.finalUrl` afterward; Firefox and userscript managers differ. | Ordinary single downloads supply no custom headers; browser/manager credential behavior owns each hop. | MV3 retains pre-ID cancellation intent and reconciles the native ID through `complete` or `interrupted`; an allocated ID alone is not success. Modern GM download uses its abort handle and completion callback; legacy GM download is used only without a cancellation signal. No duplicate fallback starts after an ambiguous native result. |

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
