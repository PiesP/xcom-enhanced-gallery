// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

export type Source = { host: string; path: string };

export type Identity = { handle: string; statusId: string };

export type QuoteTarget = {
  kind: 'quoted-video';
  articleIndex: number;
  quoteBoundary: string;
  quoteIndex: number;
  nestedArticleIndex: number;
  quoteStatusIds: string[];
  ownershipPath: { tag: string; testId: string | null }[];
  videoIndex: number;
  playerIndex: number;
  previewIndex: number;
  posterIndex: number;
  hitKind: string;
  posterSource: Source | null;
  hostVideoSource: Source | null;
  initialHitTest?: ReturnType<typeof inspectHitTestedVideoActionDocument>;
  hitTestAfterNativePlayback?: ReturnType<typeof inspectHitTestedVideoActionDocument>;
  nativePlayback?: {
    status: string;
    before?: ReturnType<typeof inspectHostVideoDocument>;
    confirmation?: {
      inQuote: boolean;
      nativePlay: NonNullable<ReturnType<typeof inspectHitTestedVideoActionDocument>>['nativePlay'];
      rejectedControls: number;
    } | null;
    action?: NonNullable<ReturnType<typeof inspectHitTestedVideoActionDocument>>['nativePlay'];
    pointShift?: { x: number; y: number };
    galleryOpenedOnControlClick?: boolean;
    after?: ReturnType<typeof inspectHostVideoDocument> | null;
  };
  galleryActionKind?: string;
};

export type ImageTarget = {
  kind: 'image';
  articleIndex: number;
  imageIndex: number;
  imageLoaded: boolean;
  imageSource: Source;
  imageVisible: boolean;
  quoteBoundary?: 'compact-two-level';
  directQuoteId?: string;
  ownerStatusId?: string;
  ownerHandle?: string;
  selectedPhotoIndex?: number;
  actionAriaLabel?: string | null;
  actionIndex?: number;
  actionPath?: string;
  duplicateActionCount?: number;
};

export type NativePreviewTarget = {
  kind: 'native-preview-photo';
  articleIndex: number;
  actionIndex: number;
  actionPath: string;
  ownerHandle: string;
  ownerStatusId: string;
  photoNumber: number;
  quoteBoundary: 'flat-nested-preview';
};

export type LiveTarget = QuoteTarget | ImageTarget | NativePreviewTarget;

export type LiveReadiness =
  | { state: 'ready'; target: LiveTarget }
  | { state: 'ambiguous' | 'terminal'; reason: string; candidateCount?: number }
  | false;

export function resolveLiveImageDocument({
  identity,
  target,
}: {
  identity: Identity;
  target: ImageTarget;
}): HTMLImageElement | null {
  const expectedStatus = `/${identity.handle}/status/${identity.statusId}`.toLowerCase();
  const ownsStatus = (article: Element, status: string) =>
    [...article.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
      if (anchor.closest('article') !== article) {
        return false;
      }
      try {
        const url = new URL(anchor.href, location.href);
        return (
          ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
          url.pathname.toLowerCase() === status
        );
      } catch {
        return false;
      }
    });
  const matches = [...document.querySelectorAll<HTMLImageElement>('article img')].filter(
    (image) => {
      const article = image.closest('article');
      if (!article || !image.isConnected) {
        return false;
      }
      try {
        const source = new URL(image.currentSrc || image.src);
        if (
          source.protocol !== 'https:' ||
          source.hostname.toLowerCase() !== target.imageSource.host ||
          source.pathname !== target.imageSource.path
        ) {
          return false;
        }
      } catch {
        return false;
      }
      if (target.quoteBoundary === 'compact-two-level') {
        const outerArticle = article.parentElement?.closest('article');
        const compact = image.closest('[role="link"]');
        if (!outerArticle || !compact || compact.closest('article') !== article) {
          return false;
        }
        const ownerPath = `/${target.ownerHandle}/status/${target.ownerStatusId}`.toLowerCase();
        return (
          !!target.ownerHandle &&
          !!target.ownerStatusId &&
          ownsStatus(outerArticle, expectedStatus) &&
          [...compact.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
            try {
              const url = new URL(anchor.href, location.href);
              return (
                ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
                url.pathname.toLowerCase().startsWith(ownerPath) &&
                (url.pathname.length === ownerPath.length ||
                  /^\/photo\/[1-9]\d*$/u.test(url.pathname.slice(ownerPath.length)))
              );
            } catch {
              return false;
            }
          })
        );
      }
      return ownsStatus(article, expectedStatus);
    }
  );
  const selected = matches.length === 1 ? matches[0] : null;
  return selected?.complete && selected.naturalWidth > 0 ? selected : null;
}

export function resolveLiveImageActionDocument(
  image: HTMLImageElement,
  { actionIndex, compactQuote }: { actionIndex: number; compactQuote: boolean }
): HTMLAnchorElement | null {
  if (!image.isConnected) {
    return null;
  }
  const article = image.closest('article');
  const actionRoot = compactQuote ? article?.parentElement?.closest('article') : article;
  return actionRoot?.querySelectorAll<HTMLAnchorElement>('a[href]')[actionIndex] ?? null;
}

export function isBoundLiveImageOwnerDocument(image: HTMLImageElement, owner: Element): boolean {
  return image.isConnected && owner.isConnected && image.closest('article') === owner;
}

export function findPrecedingLiveStatusAnchorDocument(
  image: HTMLImageElement,
  { identity, host }: { identity: Identity; host: string }
): HTMLAnchorElement | null {
  const article = image.closest('article');
  const articles = [...document.querySelectorAll('article')];
  const articleIndex = article ? articles.indexOf(article) : -1;
  for (let index = articleIndex - 1; index >= 0; index -= 1) {
    const preceding = articles[index];
    if (!preceding) {
      continue;
    }
    const candidate = [...preceding.querySelectorAll<HTMLAnchorElement>('a[href]')].find((link) => {
      if (link.closest('article') !== preceding) {
        return false;
      }
      try {
        const url = new URL(link.href, location.href);
        const match = /^\/([A-Za-z0-9_]{1,15})\/status\/([1-9]\d*)$/u.exec(url.pathname);
        return (
          url.protocol === 'https:' &&
          url.hostname === host &&
          !url.search &&
          !url.hash &&
          match?.[1]?.toLowerCase() === identity.handle.toLowerCase() &&
          match[2] !== identity.statusId
        );
      } catch {
        return false;
      }
    });
    if (candidate) {
      return candidate;
    }
  }
  return null;
}

export function inspectLiveTargetDocument({
  handle,
  statusId,
  preferOwnedPhoto = false,
}: Identity & { preferOwnedPhoto?: boolean }): LiveReadiness {
  const statusPath = `/${handle}/status/${statusId}`.toLowerCase();
  const parseVideo = (value: string | null | undefined) => {
    if (!value) {
      return null;
    }
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'video.twimg.com'
        ? { host: url.hostname, path: url.pathname }
        : null;
    } catch {
      return null;
    }
  };
  const isVisible = (element: Element) => {
    const style = getComputedStyle(element);
    const rectangle = element.getBoundingClientRect();
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) !== 0 &&
      rectangle.width > 0 &&
      rectangle.height > 0
    );
  };
  const isRenderedPhoto = (image: HTMLImageElement, source: Source, article: Element) => {
    if (isVisible(image)) {
      return true;
    }
    const style = getComputedStyle(image);
    const photo = image.parentElement;
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      Number(style.opacity) !== 0 ||
      !photo?.matches('[data-testid="tweetPhoto"]') ||
      photo.closest('article') !== article ||
      photo.querySelectorAll('img').length !== 1 ||
      !isVisible(photo)
    ) {
      return false;
    }
    for (let ancestor: Element | null = photo; ancestor; ancestor = ancestor.parentElement) {
      const ancestorStyle = getComputedStyle(ancestor);
      if (
        ancestorStyle.display === 'none' ||
        ancestorStyle.visibility === 'hidden' ||
        Number(ancestorStyle.opacity) === 0
      ) {
        return false;
      }
      if (ancestor === article) {
        break;
      }
    }
    let activeSource: URL;
    try {
      activeSource = new URL(image.currentSrc || image.src);
    } catch {
      return false;
    }
    if (
      activeSource.protocol !== 'https:' ||
      activeSource.hostname.toLowerCase() !== source.host ||
      activeSource.pathname !== source.path
    ) {
      return false;
    }
    const imageRect = image.getBoundingClientRect();
    if (imageRect.width <= 0 || imageRect.height <= 0) {
      return false;
    }
    const paintedSiblings = [...photo.children].filter(
      (sibling) => sibling !== image && getComputedStyle(sibling).backgroundImage !== 'none'
    );
    if (paintedSiblings.length !== 1) {
      return false;
    }
    const surface = paintedSiblings[0];
    if (!surface || !isVisible(surface)) {
      return false;
    }
    const match = /^url\((?:"([^"]+)"|'([^']+)'|([^'")]+))\)$/u.exec(
      getComputedStyle(surface).backgroundImage
    );
    if (!match) {
      return false;
    }
    try {
      const background = new URL(match[1] ?? match[2] ?? match[3] ?? '', location.href);
      if (
        background.protocol !== 'https:' ||
        background.hostname.toLowerCase() !== source.host ||
        background.pathname !== source.path ||
        background.username ||
        background.password ||
        background.port
      ) {
        return false;
      }
    } catch {
      return false;
    }
    const surfaceRect = surface.getBoundingClientRect();
    const centerX = imageRect.left + imageRect.width / 2;
    const centerY = imageRect.top + imageRect.height / 2;
    const hit =
      centerX >= 0 && centerY >= 0 && centerX < innerWidth && centerY < innerHeight
        ? document.elementFromPoint(centerX, centerY)
        : null;
    return (
      hit !== null &&
      photo.contains(hit) &&
      Math.abs(imageRect.left - surfaceRect.left) <= 1 &&
      Math.abs(imageRect.top - surfaceRect.top) <= 1 &&
      Math.abs(imageRect.width - surfaceRect.width) <= 1 &&
      Math.abs(imageRect.height - surfaceRect.height) <= 1
    );
  };
  const parseLink = (anchor: HTMLAnchorElement) => {
    try {
      const url = new URL(anchor.href, location.href);
      if (!['x.com', 'twitter.com'].includes(url.hostname.toLowerCase())) {
        return null;
      }
      return { host: url.hostname.toLowerCase(), path: url.pathname };
    } catch {
      return null;
    }
  };
  const parseMedia = (image: HTMLImageElement) => {
    for (const value of [image.currentSrc, image.src, image.getAttribute('src')]) {
      try {
        const url = new URL(value ?? '', location.href);
        if (
          url.protocol === 'https:' &&
          url.hostname.toLowerCase() === 'pbs.twimg.com' &&
          url.pathname.startsWith('/media/')
        ) {
          return { host: url.hostname.toLowerCase(), path: url.pathname };
        }
      } catch {
        // Try the next image source candidate.
      }
    }
    return null;
  };
  const compactOwnerPath = (anchor: HTMLAnchorElement) =>
    /^(\/[A-Za-z0-9_]{1,15}\/status\/[1-9]\d*)(?:\/photo\/[1-9]\d*)?$/u.exec(
      parseLink(anchor)?.path ?? ''
    )?.[1] ?? null;
  const parsePoster = (value: string | null | undefined) => {
    if (!value) {
      return null;
    }
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' &&
        url.hostname.toLowerCase() === 'pbs.twimg.com' &&
        /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(
          url.pathname
        )
        ? { host: url.hostname.toLowerCase(), path: url.pathname }
        : null;
    } catch {
      return null;
    }
  };

  const articles = [...document.querySelectorAll<HTMLElement>('article')];
  for (let articleIndex = 0; articleIndex < articles.length; articleIndex += 1) {
    const article = articles[articleIndex];
    if (!article) {
      continue;
    }
    const ownsStatus = [...article.querySelectorAll<HTMLAnchorElement>('a[href]')].some(
      (anchor) => {
        const link = parseLink(anchor);
        return anchor.closest('article') === article && link?.path.toLowerCase() === statusPath;
      }
    );
    if (!ownsStatus) {
      continue;
    }

    const directNestedArticles = [...article.querySelectorAll('article')].filter(
      (nested) => nested.parentElement?.closest('article') === article
    );
    const quoteCards = [...article.querySelectorAll('[data-testid="quoteTweet"]')].filter(
      (card) => card.closest('article') === article
    );
    const scopes = directNestedArticles.length
      ? directNestedArticles
      : quoteCards.length
        ? quoteCards
        : [article];
    const videoTargets: { state: 'ready'; target: QuoteTarget }[] = [];
    for (let scopeIndex = 0; scopeIndex < scopes.length; scopeIndex += 1) {
      const quote = scopes[scopeIndex];
      if (!quote) {
        continue;
      }
      const players: Element[] = [
        ...quote.querySelectorAll(
          '[data-testid="videoPlayer"], video, [data-testid="previewInterstitial"]'
        ),
      ].filter(
        (candidate) =>
          candidate.closest('article') === (directNestedArticles.length ? quote : article) &&
          (candidate.matches('[data-testid="videoPlayer"]') ||
            !candidate.closest('[data-testid="videoPlayer"]')) &&
          (!candidate.matches('[data-testid="previewInterstitial"]') ||
            (candidate.closest('[data-testid="tweetPhoto"]') &&
              candidate.querySelector('[data-testid="playButton"]') &&
              !candidate.closest('[data-testid="videoPlayer"]')))
      );
      for (const player of players) {
        const video = player instanceof HTMLVideoElement ? player : player.querySelector('video');
        const preview = player instanceof HTMLVideoElement ? null : player.querySelector('img');
        const playButton = player.matches('[data-testid="previewInterstitial"]')
          ? player.querySelector('[data-testid="playButton"]')
          : null;
        const poster = parsePoster(video?.poster);
        const matchingPosters: HTMLImageElement[] = poster
          ? [...quote.querySelectorAll<HTMLImageElement>('img')].filter((image) => {
              const source = parsePoster(image.currentSrc || image.src);
              return (
                image.closest('article') === (directNestedArticles.length ? quote : article) &&
                source?.path === poster.path &&
                isVisible(image) &&
                image.complete &&
                image.naturalWidth > 0
              );
            })
          : [];
        const matchingPoster = matchingPosters.length === 1 ? matchingPosters[0] : null;
        const hitTarget: Element | null =
          playButton && isVisible(playButton)
            ? playButton
            : video && isVisible(video)
              ? video
              : preview && isVisible(preview) && preview.complete && preview.naturalWidth > 0
                ? preview
                : (matchingPoster ?? (isVisible(player) ? player : null));
        if (!hitTarget) {
          continue;
        }
        const quoteLinks = [...quote.querySelectorAll<HTMLAnchorElement>('a[href]')].flatMap(
          (anchor) => {
            if (directNestedArticles.length && anchor.closest('article') !== quote) {
              return [];
            }
            const link = parseLink(anchor);
            const match = link?.path.match(/^\/[A-Za-z0-9_]{1,15}\/status\/(\d+)(?:\/|$)/u);
            return match?.[1] && match[1] !== statusId ? [match[1]] : [];
          }
        );
        const quoteStatusIds = [...new Set(quoteLinks)].slice(0, 8);
        const path: { tag: string; testId: string | null }[] = [];
        for (
          let node: Element | null = hitTarget;
          node && node !== article && path.length < 10;
          node = node.parentElement
        ) {
          path.push({
            tag: node.tagName.toLowerCase(),
            testId: [
              'quoteTweet',
              'videoPlayer',
              'tweetPhoto',
              'videoComponent',
              'videoPlayerOverlay',
              'videoPlayerControls',
            ].includes(node.getAttribute('data-testid') ?? '')
              ? node.getAttribute('data-testid')
              : null,
          });
        }
        videoTargets.push({
          state: 'ready',
          target: {
            kind: 'quoted-video',
            articleIndex,
            quoteBoundary: directNestedArticles.length
              ? 'nested-article'
              : quoteCards.length
                ? 'quoteTweet'
                : 'unmarked-candidate',
            quoteIndex: quoteCards.length && !directNestedArticles.length ? scopeIndex : -1,
            nestedArticleIndex: directNestedArticles.length
              ? [...article.querySelectorAll<Element>('article')].indexOf(quote)
              : -1,
            quoteStatusIds,
            ownershipPath: path,
            videoIndex: video ? [...article.querySelectorAll('video')].indexOf(video) : -1,
            playerIndex: [...article.querySelectorAll('[data-testid="videoPlayer"]')].indexOf(
              player
            ),
            previewIndex: [
              ...article.querySelectorAll('[data-testid="previewInterstitial"]'),
            ].indexOf(player),
            posterIndex: matchingPoster
              ? [...article.querySelectorAll('img')].indexOf(matchingPoster)
              : hitTarget instanceof HTMLImageElement
                ? [...article.querySelectorAll('img')].indexOf(hitTarget)
                : -1,
            hitKind: hitTarget.tagName.toLowerCase(),
            posterSource: poster ?? parsePoster(preview?.currentSrc || preview?.src),
            hostVideoSource: video ? parseVideo(video.currentSrc || video.src) : null,
          },
        });
      }
    }
    if (videoTargets.length > 1) {
      return {
        state: 'ambiguous',
        reason: 'multiple-visible-video-candidates',
        candidateCount: Math.min(videoTargets.length, 20),
      };
    }
    const directMixedPhotoEntry =
      preferOwnedPhoto &&
      videoTargets.length === 1 &&
      videoTargets[0]?.target.quoteBoundary === 'unmarked-candidate' &&
      videoTargets[0].target.quoteStatusIds.length === 0;
    if (videoTargets.length === 1 && videoTargets[0] && !directMixedPhotoEntry) {
      return videoTargets[0];
    }
    if (
      !directMixedPhotoEntry &&
      scopes.some((quote) =>
        quote.querySelector(
          '[data-testid="videoPlayer"], video, [data-testid="previewInterstitial"]'
        )
      )
    ) {
      return false;
    }

    const images = [...article.querySelectorAll<HTMLImageElement>('img')];
    for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
      const image = images[imageIndex];
      if (!image) {
        continue;
      }
      const source = parseMedia(image);
      if (
        image.closest('article') !== article ||
        image.closest('[data-testid="videoPlayer"], [data-testid="previewInterstitial"]') ||
        !source ||
        !isRenderedPhoto(image, source, article) ||
        !image.complete ||
        image.naturalWidth <= 0
      ) {
        continue;
      }
      return {
        state: 'ready',
        target: {
          kind: 'image',
          articleIndex,
          imageIndex,
          imageLoaded: true,
          imageSource: source,
          imageVisible: true,
        },
      };
    }
    // The public compact layout places C's photo in an unmarked role-link inside
    // B's nested article. Admit only the observed A > B > C ownership chain and
    // a unique image covered by a second link to that same C status.
    const compactTargets: ImageTarget[] = [];
    for (const quoteArticle of directNestedArticles) {
      for (const compact of quoteArticle.querySelectorAll<HTMLElement>('[role="link"]')) {
        if (compact.closest('article') !== quoteArticle) {
          continue;
        }
        const ownLinks = [...compact.querySelectorAll<HTMLAnchorElement>('a[href]')];
        const compactPaths = ownLinks.map(compactOwnerPath);
        const ownerPath = compactPaths[0];
        const ownerMatch = /^\/([A-Za-z0-9_]{1,15})\/status\/([1-9]\d*)$/u.exec(ownerPath ?? '');
        if (!ownerMatch || compactPaths.some((path) => path !== ownerPath)) {
          continue;
        }
        const [, ownerHandle, ownerStatusId] = ownerMatch;
        if (!ownerHandle || !ownerStatusId || ownerStatusId === statusId) {
          continue;
        }
        const directQuoteIds = new Set(
          [...quoteArticle.querySelectorAll<HTMLAnchorElement>('a[href]')]
            .filter(
              (anchor) => anchor.closest('article') === quoteArticle && !compact.contains(anchor)
            )
            .map(
              (anchor) =>
                /^\/[A-Za-z0-9_]{1,15}\/status\/([1-9]\d*)$/u.exec(
                  parseLink(anchor)?.path ?? ''
                )?.[1]
            )
            .filter((id): id is string => !!id)
        );
        if (directQuoteIds.size !== 1) {
          continue;
        }
        const directQuoteId = [...directQuoteIds][0];
        if (!directQuoteId || directQuoteId === statusId || directQuoteId === ownerStatusId) {
          continue;
        }
        for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
          const image = images[imageIndex];
          if (!image || !compact.contains(image) || image.closest('article') !== quoteArticle) {
            continue;
          }
          const source = parseMedia(image);
          if (
            !source ||
            !isRenderedPhoto(image, source, quoteArticle) ||
            !image.complete ||
            image.naturalWidth <= 0
          ) {
            continue;
          }
          const imageLink = image.closest<HTMLAnchorElement>('a[href]');
          const imagePath = imageLink ? parseLink(imageLink)?.path : null;
          if (!imageLink || compactOwnerPath(imageLink) !== ownerPath) {
            continue;
          }
          const rectangle = image.getBoundingClientRect();
          const x = rectangle.left + rectangle.width / 2;
          const y = rectangle.top + rectangle.height / 2;
          if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) {
            continue;
          }
          const hit = document.elementFromPoint(x, y);
          const hitLink = hit?.closest<HTMLAnchorElement>('a[href]');
          if (!hitLink || hitLink === imageLink || parseLink(hitLink)?.path !== imagePath) {
            continue;
          }
          let region = image.parentElement;
          for (let hops = 0; region && !region.contains(hit) && hops < 4; hops += 1) {
            region = region.parentElement;
          }
          if (!region || !region.contains(hit) || !compact.contains(region) || region === compact) {
            continue;
          }
          const regionImages = [...region.querySelectorAll<HTMLImageElement>('img')].filter(
            parseMedia
          );
          const regionLinks = [...region.querySelectorAll<HTMLAnchorElement>('a[href]')];
          if (
            regionImages.length !== 1 ||
            regionImages[0] !== image ||
            regionLinks.length !== 2 ||
            regionLinks.some((anchor) => parseLink(anchor)?.path !== imagePath)
          ) {
            continue;
          }
          compactTargets.push({
            kind: 'image',
            articleIndex,
            imageIndex,
            imageLoaded: true,
            imageSource: source,
            imageVisible: true,
            quoteBoundary: 'compact-two-level',
            directQuoteId,
            ownerStatusId,
            ownerHandle,
          });
        }
      }
    }
    if (compactTargets.length > 1) {
      return {
        state: 'ambiguous',
        reason: 'multiple-compact-quote-images',
        candidateCount: compactTargets.length,
      };
    }
    if (compactTargets[0]) {
      return { state: 'ready', target: compactTargets[0] };
    }

    // The authenticated flat layout exposes C's native photo action without an
    // image. Its unmarked B wrapper does not establish a B-to-C post identity.
    const previewActions = [
      ...article.querySelectorAll<HTMLAnchorElement>('a[data-testid="nestedQuotePreviewMedia"]'),
    ];
    if (previewActions.length > 1) {
      return {
        state: 'ambiguous',
        reason: 'multiple-native-preview-actions',
        candidateCount: Math.min(previewActions.length, 20),
      };
    }
    const action = previewActions[0];
    if (action) {
      const preview = action.closest('div[role="link"][data-testid="nestedQuotePreview"]');
      const wrapper = preview?.parentElement?.closest('div[role="link"]');
      const rectangle = action.getBoundingClientRect();
      const x = rectangle.left + rectangle.width / 2;
      const y = rectangle.top + rectangle.height / 2;
      const hit =
        x >= 0 && y >= 0 && x < innerWidth && y < innerHeight
          ? document.elementFromPoint(x, y)
          : null;
      let owner: RegExpExecArray | null = null;
      let actionPath: string | null = null;
      try {
        const url = new URL(action.href, location.href);
        if (
          url.protocol === 'https:' &&
          ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
          !url.username &&
          !url.password &&
          !url.port &&
          !url.search &&
          !url.hash
        ) {
          owner = /^\/([A-Za-z0-9_]{1,15})\/status\/([1-9]\d*)\/photo\/([1-9]\d*)$/u.exec(
            url.pathname
          );
          actionPath = url.pathname;
        }
      } catch {
        // An unrecognized native action cannot establish C's identity.
      }
      const photoNumber = Number(owner?.[3]);
      const exactArticleCount = articles.filter((candidate) =>
        [...candidate.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
          try {
            const url = new URL(anchor.href, location.href);
            return (
              anchor.closest('article') === candidate &&
              url.protocol === 'https:' &&
              ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
              url.pathname.toLowerCase() === statusPath
            );
          } catch {
            return false;
          }
        })
      ).length;
      if (
        action.getAttribute('role') === 'link' &&
        preview?.closest('article') === article &&
        wrapper?.closest('article') === article &&
        article.querySelectorAll('div[role="link"][data-testid="nestedQuotePreview"]').length ===
          1 &&
        exactArticleCount === 1 &&
        owner?.[1] &&
        owner[2] &&
        owner[2] !== statusId &&
        Number.isSafeInteger(photoNumber) &&
        photoNumber > 0 &&
        isVisible(action) &&
        hit &&
        action.contains(hit) &&
        hit.closest('a[href]') === action &&
        actionPath
      ) {
        return {
          state: 'ready',
          target: {
            kind: 'native-preview-photo',
            articleIndex,
            actionIndex: [...article.querySelectorAll<HTMLAnchorElement>('a[href]')].indexOf(
              action
            ),
            actionPath,
            ownerHandle: owner[1],
            ownerStatusId: owner[2],
            photoNumber,
            quoteBoundary: 'flat-nested-preview',
          },
        };
      }
    }
  }
  const text = document.body?.innerText ?? document.body?.textContent ?? '';
  if (
    /verify you are human|unusual activity|captcha|this post is unavailable|page doesn.?t exist/iu.test(
      text
    )
  ) {
    return { state: 'terminal', reason: 'host-challenge-or-unavailable' };
  }
  return false;
}

export function inspectLiveCandidateDocument({ handle, statusId }: Identity) {
  const path = `/${handle}/status/${statusId}`.toLowerCase();
  const articles = [...document.querySelectorAll<HTMLElement>('article')];
  const statusPath = (value: string) => {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' &&
        ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
        /^\/[A-Za-z0-9_]{1,15}\/status\/\d+(?:\/|$)/u.test(url.pathname)
        ? url.pathname
        : null;
    } catch {
      return null;
    }
  };
  const mediaPath = (value: string) => {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' &&
        url.hostname === 'pbs.twimg.com' &&
        /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(
          url.pathname
        )
        ? { host: url.hostname, path: url.pathname }
        : null;
    } catch {
      return null;
    }
  };
  const nodePath = (element: Element, article: Element) => {
    const nodes: {
      tag: string;
      testId: string | null;
      role: string | null;
      statusPath: string | null;
      visibleBox: boolean;
      bounds: { x: number; y: number; width: number; height: number };
    }[] = [];
    for (
      let node: Element | null = element;
      node && node !== article && nodes.length < 12;
      node = node.parentElement
    ) {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const testId = node.getAttribute('data-testid');
      const role = node.getAttribute('role');
      nodes.push({
        tag: node.tagName.toLowerCase(),
        testId: [
          'quoteTweet',
          'tweetPhoto',
          'videoPlayer',
          'videoComponent',
          'previewInterstitial',
          'playButton',
          'card.wrapper',
        ].includes(testId ?? '')
          ? testId
          : null,
        role: ['link', 'button', 'presentation', 'application'].includes(role ?? '') ? role : null,
        statusPath: node instanceof HTMLAnchorElement ? statusPath(node.href) : null,
        visibleBox:
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number(style.opacity) !== 0,
        bounds: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      });
    }
    return nodes;
  };
  const articleOwnership = (element: Element, outerArticle: HTMLElement) => {
    const ancestorArticleIndexes = [];
    for (
      let node = element.closest('article');
      node && outerArticle.contains(node);
      node = node.parentElement?.closest('article') ?? null
    ) {
      ancestorArticleIndexes.push(articles.indexOf(node));
      if (node === outerArticle || ancestorArticleIndexes.length >= 6) {
        break;
      }
    }
    const nearest = element.closest('article');
    const ownStatusAnchors = nearest
      ? [...nearest.querySelectorAll<HTMLAnchorElement>('a[href]')]
          .filter((anchor) => anchor.closest('article') === nearest)
          .flatMap((anchor) => {
            const path = statusPath(anchor.href);
            if (!path) {
              return [];
            }
            const structure = [];
            for (
              let node: Element | null = anchor;
              node && node !== nearest && structure.length < 6;
              node = node.parentElement
            ) {
              const role = node.getAttribute('role');
              const testId = node.getAttribute('data-testid');
              structure.push({
                tag: ['a', 'div', 'span', 'time', 'article'].includes(node.tagName.toLowerCase())
                  ? node.tagName.toLowerCase()
                  : 'other',
                role: ['link', 'button', 'presentation'].includes(role ?? '') ? role : null,
                testId: ['User-Name', 'tweet', 'quoteTweet', 'videoPlayer'].includes(testId ?? '')
                  ? testId
                  : null,
              });
            }
            return [
              {
                path,
                containsTime: Boolean(anchor.querySelector('time')),
                nearestArticleIndex: articles.indexOf(nearest),
                structure,
              },
            ];
          })
          .slice(0, 8)
      : [];
    const ownStatusPaths = ownStatusAnchors.map((anchor) => anchor.path);
    return {
      nearestArticleIndex: nearest ? articles.indexOf(nearest) : -1,
      ancestorArticleIndexes,
      ownStatusPaths,
      ownStatusAnchors,
    };
  };
  const article = articles.find((candidate) =>
    [...candidate.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
      try {
        const url = new URL(anchor.href, location.href);
        return (
          ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
          url.pathname.toLowerCase() === path &&
          anchor.closest('article') === candidate
        );
      } catch {
        return false;
      }
    })
  );
  if (!article) {
    return { exactArticleFound: false, articleCount: Math.min(articles.length, 50) };
  }
  const videoDetails = [...article.querySelectorAll<HTMLVideoElement>('video')]
    .slice(0, 6)
    .map((video) => {
      const rect = video.getBoundingClientRect();
      const x = Math.min(innerWidth - 1, Math.max(0, rect.x + rect.width / 2));
      const y = Math.min(innerHeight - 1, Math.max(0, rect.y + rect.height / 2));
      return {
        sourceKind:
          video.currentSrc?.startsWith('blob:') || video.src.startsWith('blob:')
            ? 'blob'
            : video.currentSrc || video.src
              ? 'other'
              : 'none',
        poster: mediaPath(video.poster),
        ...articleOwnership(video, article),
        nodePath: nodePath(video, article),
        hitPath:
          rect.width > 0 && rect.height > 0 && typeof document.elementsFromPoint === 'function'
            ? document
                .elementsFromPoint(x, y)
                .slice(0, 4)
                .map((node) => ({
                  tag: node.tagName.toLowerCase(),
                  testId: [
                    'videoPlayer',
                    'videoComponent',
                    'playButton',
                    'previewInterstitial',
                  ].includes(node.getAttribute('data-testid') ?? '')
                    ? node.getAttribute('data-testid')
                    : null,
                }))
            : [],
      };
    });
  const thumbnailDetails = [];
  for (const element of [...article.querySelectorAll('*')].slice(0, 800)) {
    if (thumbnailDetails.length >= 8) {
      break;
    }
    const image =
      element instanceof HTMLImageElement ? mediaPath(element.currentSrc || element.src) : null;
    const background = getComputedStyle(element).backgroundImage;
    const backgroundUrl = background.match(/^url\(["']?(.*?)["']?\)$/u)?.[1];
    const backgroundSource = backgroundUrl ? mediaPath(backgroundUrl) : null;
    if (!image && !backgroundSource) {
      continue;
    }
    thumbnailDetails.push({
      source: image ?? backgroundSource,
      sourceKind: image ? 'image' : 'background',
      ...articleOwnership(element, article),
      nodePath: nodePath(element, article),
    });
  }
  const statusIds = [
    ...new Set(
      [...article.querySelectorAll<HTMLAnchorElement>('a[href]')].flatMap((anchor) => {
        try {
          const url = new URL(anchor.href, location.href);
          const match = ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase())
            ? url.pathname.match(/^\/[A-Za-z0-9_]{1,15}\/status\/(\d+)(?:\/|$)/u)
            : null;
          return match ? [match[1]] : [];
        } catch {
          return [];
        }
      })
    ),
  ].slice(0, 12);
  return {
    exactArticleFound: true,
    articleIndex: articles.indexOf(article),
    outerArticleOwnStatusAnchors: articleOwnership(article, article).ownStatusAnchors,
    quoteCardCount: Math.min(article.querySelectorAll('[data-testid="quoteTweet"]').length, 20),
    videoPlayerCount: Math.min(article.querySelectorAll('[data-testid="videoPlayer"]').length, 20),
    previewInterstitialCount: Math.min(
      article.querySelectorAll('[data-testid="previewInterstitial"]').length,
      20
    ),
    playButtonCount: Math.min(article.querySelectorAll('[data-testid="playButton"]').length, 20),
    videoCount: Math.min(article.querySelectorAll('video').length, 20),
    statusIds,
    videoDetails,
    thumbnailDetails,
  };
}

export function inspectNativePreviewOwnerDocument(): string | null {
  const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
  const panel =
    galleries.length === 1
      ? galleries[0]?.querySelector('[data-gallery-element="tweet-panel"]')
      : null;
  const paths = [...(panel?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? [])].flatMap(
    (anchor) => {
      try {
        const url = new URL(anchor.href, location.href);
        return url.protocol === 'https:' &&
          ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
          !url.username &&
          !url.password &&
          !url.port &&
          !url.search &&
          !url.hash &&
          /^\/[A-Za-z0-9_]{1,15}\/status\/[1-9]\d*$/u.test(url.pathname)
          ? [url.pathname]
          : [];
      } catch {
        return [];
      }
    }
  );
  return paths.length === 1 ? (paths[0] ?? null) : null;
}

export function inspectSelectedGalleryDocument({
  expectedIndex,
  expectedPath,
  allowPhotoFormatVariant = false,
}: {
  expectedIndex: number | null;
  expectedPath: string;
  allowPhotoFormatVariant?: boolean;
}) {
  const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
  const gallery = galleries.length === 1 ? galleries[0] : null;
  const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
  const position = toolbar?.querySelector('#xeg-toolbar-counter[data-gallery-element="position"]');
  const items = [...(gallery?.querySelectorAll('[data-gallery-element="item"]') ?? [])];
  const resolvedIndex = expectedIndex ?? Number(position?.getAttribute('data-position'));
  const selectedItems = items.filter(
    (candidate) => candidate.getAttribute('data-index') === String(resolvedIndex - 1)
  );
  const item = selectedItems.length === 1 ? selectedItems[0] : null;
  if (
    !(gallery instanceof HTMLElement) ||
    !(toolbar instanceof HTMLElement) ||
    !(position instanceof HTMLElement) ||
    !(item instanceof HTMLElement)
  ) {
    return false;
  }

  const total = Number(position.getAttribute('data-total'));
  if (
    !Number.isSafeInteger(resolvedIndex) ||
    resolvedIndex < 1 ||
    !Number.isSafeInteger(total) ||
    total !== items.length ||
    resolvedIndex > total ||
    position.getAttribute('data-position') !== String(resolvedIndex) ||
    position.getAttribute('data-current-index') !== String(resolvedIndex - 1) ||
    position.getAttribute('data-focused-index') !== String(resolvedIndex - 1) ||
    toolbar.getAttribute('data-current-index') !== String(resolvedIndex - 1) ||
    toolbar.getAttribute('data-focused-index') !== String(resolvedIndex - 1)
  ) {
    return false;
  }

  const isVisible = (element: Element) => {
    const style = getComputedStyle(element);
    const rectangle = element.getBoundingClientRect();
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) !== 0 &&
      rectangle.bottom > 0 &&
      rectangle.top < innerHeight &&
      rectangle.right > 0 &&
      rectangle.left < innerWidth
    );
  };
  const matchingImages = [...gallery.querySelectorAll('[data-gallery-element="item"] img')].filter(
    (candidate) => {
      if (
        !(candidate instanceof HTMLImageElement) ||
        !candidate.complete ||
        candidate.naturalWidth <= 0 ||
        !isVisible(candidate)
      ) {
        return false;
      }
      try {
        const url = new URL(candidate.currentSrc || candidate.src);
        if (url.hostname !== 'pbs.twimg.com') {
          return false;
        }
        if (url.pathname === expectedPath) {
          return true;
        }
        if (!allowPhotoFormatVariant) {
          return false;
        }
        const stem = (path: string) => path.replace(/\.(?:jpe?g|png|webp|gif)$/iu, '');
        return (
          expectedPath.startsWith('/media/') &&
          url.pathname.startsWith('/media/') &&
          stem(url.pathname) === stem(expectedPath)
        );
      } catch {
        return false;
      }
    }
  );
  const selectedImage = matchingImages.length === 1 ? matchingImages[0] : null;
  if (
    item.getAttribute('data-media-loaded') !== 'true' ||
    !isVisible(item) ||
    !(selectedImage instanceof HTMLImageElement) ||
    !item.contains(selectedImage)
  ) {
    return false;
  }
  const source = new URL(selectedImage.currentSrc || selectedImage.src);
  return {
    imageSource: { host: source.hostname, path: source.pathname },
    itemIndex: Number(item.getAttribute('data-index')),
    itemVisible: true,
    positionValue: Number(position.getAttribute('data-position')),
  };
}

export function eligibleLiveImageGalleryCountDocument(gallery: Element): number {
  const items = [...gallery.querySelectorAll('[data-gallery-element="item"]')];
  return items.length >= 2 &&
    items.length <= 4 &&
    items.every((item) => item.querySelectorAll('img').length === 1 && !item.querySelector('video'))
    ? items.length
    : 0;
}

export function inspectSelectedGalleryVideoDocument() {
  const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
  const gallery = galleries.length === 1 ? galleries[0] : null;
  const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
  const position = toolbar?.querySelector('#xeg-toolbar-counter[data-gallery-element="position"]');
  const items = [...(gallery?.querySelectorAll('[data-gallery-element="item"]') ?? [])];
  const current = Number(position?.getAttribute('data-current-index'));
  const total = Number(position?.getAttribute('data-total'));
  const item = Number.isSafeInteger(current) && current >= 0 ? items[current] : null;
  const video = item?.querySelector('video');
  if (
    !(gallery instanceof HTMLElement) ||
    !(toolbar instanceof HTMLElement) ||
    !(position instanceof HTMLElement) ||
    !(item instanceof HTMLElement) ||
    !(video instanceof HTMLVideoElement) ||
    !Number.isSafeInteger(total) ||
    total !== items.length ||
    current >= total ||
    position.getAttribute('data-position') !== String(current + 1) ||
    position.getAttribute('data-focused-index') !== String(current) ||
    toolbar.getAttribute('data-current-index') !== String(current) ||
    toolbar.getAttribute('data-focused-index') !== String(current)
  ) {
    return false;
  }
  const style = getComputedStyle(video);
  const rect = video.getBoundingClientRect();
  const visible =
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity) !== 0 &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.top < innerHeight &&
    rect.right > 0 &&
    rect.left < innerWidth;
  let source = null;
  try {
    const url = new URL(video.currentSrc || video.src);
    if (url.protocol === 'https:' && url.hostname === 'video.twimg.com') {
      source = { host: url.hostname, path: url.pathname };
    }
  } catch {
    // An unrecognized or blob-only source cannot establish video identity.
  }
  return {
    index: current,
    position: current + 1,
    total,
    itemLoaded: item.getAttribute('data-media-loaded') === 'true',
    visible,
    source,
    readyState: video.readyState,
    width: video.videoWidth,
    height: video.videoHeight,
    mediaErrorCode: video.error?.code ?? null,
    currentTime: video.currentTime,
  };
}

export function inspectLiveMixedGallerySelectionDocument(): {
  index: number;
  total: number;
  kind: 'image' | 'video';
  source: Source;
  otherPlayingVideos: number;
} | null {
  const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
  const gallery = galleries.length === 1 ? galleries[0] : null;
  const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
  const counter = toolbar?.querySelector('#xeg-toolbar-counter[data-gallery-element="position"]');
  const items = [...(gallery?.querySelectorAll('[data-gallery-element="item"]') ?? [])];
  const index = Number(counter?.getAttribute('data-current-index'));
  const total = Number(counter?.getAttribute('data-total'));
  const item = items[index];
  if (
    !gallery ||
    !toolbar ||
    !counter ||
    !item ||
    !Number.isSafeInteger(index) ||
    index < 0 ||
    !Number.isSafeInteger(total) ||
    total !== items.length ||
    total < 2 ||
    total > 4 ||
    counter.getAttribute('data-position') !== String(index + 1) ||
    counter.getAttribute('data-focused-index') !== String(index) ||
    toolbar.getAttribute('data-current-index') !== String(index) ||
    toolbar.getAttribute('data-focused-index') !== String(index) ||
    item.getAttribute('data-media-loaded') !== 'true'
  ) {
    return null;
  }
  const video = item.querySelector('video');
  const image = item.querySelector('img');
  const kind =
    video instanceof HTMLVideoElement
      ? 'video'
      : image instanceof HTMLImageElement
        ? 'image'
        : null;
  if (
    !kind ||
    (kind === 'video' && (video?.readyState ?? 0) < 2) ||
    (kind === 'image' && (!image?.complete || (image?.naturalWidth ?? 0) <= 0))
  ) {
    return null;
  }
  try {
    const source = new URL(
      kind === 'video'
        ? video?.currentSrc || video?.src || ''
        : image?.currentSrc || image?.src || ''
    );
    if (
      source.protocol !== 'https:' ||
      (kind === 'video'
        ? source.hostname !== 'video.twimg.com'
        : source.hostname !== 'pbs.twimg.com' || !source.pathname.startsWith('/media/'))
    ) {
      return null;
    }
    const otherPlayingVideos = [...gallery.querySelectorAll('video')].filter(
      (candidate) => !item.contains(candidate) && !candidate.paused && !candidate.ended
    ).length;
    return {
      index,
      total,
      kind,
      source: { host: source.hostname, path: source.pathname },
      otherPlayingVideos,
    };
  } catch {
    return null;
  }
}

export function readSelectedCurrentVideoUrlDocument(selectedIndex: number): string | null {
  const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
  const gallery = galleries.length === 1 ? galleries[0] : null;
  const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
  const items = gallery?.querySelectorAll('[data-gallery-element="item"]');
  const video = items?.[selectedIndex]?.querySelector('video');
  return Number.isSafeInteger(selectedIndex) &&
    selectedIndex >= 0 &&
    toolbar?.getAttribute('data-current-index') === String(selectedIndex) &&
    video instanceof HTMLVideoElement &&
    video.currentSrc
    ? video.currentSrc
    : null;
}

export function inspectHitTestedVideoActionDocument(
  element: Element,
  { posterPath }: { posterPath: string | null }
) {
  if (!(element instanceof HTMLElement) || typeof document.elementsFromPoint !== 'function') {
    return null;
  }
  const quoteArticle = element.closest('article');
  if (!quoteArticle) {
    return null;
  }
  const scopeCounts = (scope: Element, depth: number) => {
    if (depth > 3) {
      return null;
    }
    const counts = {
      scopeDepth: depth,
      videoCount: 0,
      totalImageCount: 0,
      trustedVideoThumbnailCount: 0,
      ordinaryImageCount: 0,
    };
    const media = [scope, ...scope.querySelectorAll('video, img')];
    for (const node of media) {
      if (node.closest('article') !== quoteArticle) {
        continue;
      }
      if (node instanceof HTMLVideoElement) {
        counts.videoCount = Math.min(counts.videoCount + 1, 20);
        continue;
      }
      if (!(node instanceof HTMLImageElement)) {
        continue;
      }
      counts.totalImageCount = Math.min(counts.totalImageCount + 1, 20);
      let trusted = false;
      try {
        const url = new URL(node.currentSrc || node.src, location.href);
        trusted =
          url.protocol === 'https:' &&
          url.hostname === 'pbs.twimg.com' &&
          /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(
            url.pathname
          );
      } catch {
        // Count unknown images without retaining their source.
      }
      const key = trusted ? 'trustedVideoThumbnailCount' : 'ordinaryImageCount';
      counts[key] = Math.min(counts[key] + 1, 20);
    }
    return counts;
  };
  if (posterPath) {
    const value =
      element instanceof HTMLImageElement
        ? element.currentSrc || element.src
        : element instanceof HTMLVideoElement
          ? element.poster
          : element.querySelector('video')?.poster ||
            element.querySelector('img')?.currentSrc ||
            element.querySelector('img')?.src;
    try {
      const url = new URL(value ?? '', location.href);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'pbs.twimg.com' ||
        url.pathname !== posterPath
      ) {
        return null;
      }
    } catch {
      return null;
    }
  }
  const rect = element.getBoundingClientRect();
  const samples: [number, number][] = [
    [0.2, 0.2],
    [0.8, 0.2],
    [0.2, 0.4],
    [0.8, 0.4],
    [0.5, 0.25],
    [0.5, 0.45],
    [0.2, 0.6],
    [0.8, 0.6],
    [0.5, 0.7],
  ];
  let rejectedControls = 0;
  let nativePlay: {
    x: number;
    y: number;
    topTag: string;
    mediaScopeDepth: number;
    scopeCounts: ReturnType<typeof scopeCounts>;
  } | null = null;
  for (const [fx, fy] of samples) {
    const x = Math.round(rect.left + rect.width * fx);
    const y = Math.round(rect.top + rect.height * fy);
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) {
      continue;
    }
    const top = document.elementsFromPoint(x, y)[0];
    if (!top || top.closest('article') !== quoteArticle) {
      continue;
    }
    const control = top.closest(
      'button, [role="button"], input, select, textarea, [data-testid="videoPlayerControls"]'
    );
    if (control) {
      rejectedControls += 1;
      if (!nativePlay && control.matches('button, [role="button"]')) {
        let mediaScope: HTMLElement | null = element;
        for (
          let depth = 0;
          mediaScope && depth <= 5 && mediaScope !== quoteArticle;
          depth += 1, mediaScope = mediaScope.parentElement
        ) {
          if (mediaScope.contains(control)) {
            nativePlay = {
              x,
              y,
              topTag: top.tagName.toLowerCase(),
              mediaScopeDepth: depth,
              scopeCounts: scopeCounts(mediaScope, depth),
            };
            break;
          }
        }
      }
      continue;
    }
    let mediaScope: HTMLElement | null = element;
    for (
      let depth = 0;
      mediaScope && depth <= 3 && mediaScope !== quoteArticle;
      depth += 1, mediaScope = mediaScope.parentElement
    ) {
      if (mediaScope.contains(top)) {
        return {
          inQuote: true,
          x,
          y,
          topTag: top.tagName.toLowerCase(),
          topTestId: [
            'videoPlayer',
            'videoComponent',
            'previewInterstitial',
            'tweetPhoto',
          ].includes(top.getAttribute('data-testid') ?? '')
            ? top.getAttribute('data-testid')
            : null,
          mediaScopeDepth: depth,
          rejectedControls,
          nativePlay,
        };
      }
    }
  }
  return {
    inQuote: false,
    x: null,
    y: null,
    topTag: null,
    topTestId: null,
    mediaScopeDepth: null,
    rejectedControls,
    nativePlay,
  };
}

export function findHitTestedVideoControlDocument(
  element: Element,
  { x, y, posterPath }: { x: number; y: number; posterPath: string | null }
) {
  if (!(element instanceof HTMLElement) || typeof document.elementsFromPoint !== 'function') {
    return null;
  }
  const quoteArticle = element.closest('article');
  if (
    !quoteArticle ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    y < 0 ||
    x >= innerWidth ||
    y >= innerHeight
  ) {
    return null;
  }
  if (posterPath) {
    const value =
      element instanceof HTMLImageElement
        ? element.currentSrc || element.src
        : element instanceof HTMLVideoElement
          ? element.poster
          : element.querySelector('video')?.poster ||
            element.querySelector('img')?.currentSrc ||
            element.querySelector('img')?.src;
    try {
      const url = new URL(value ?? '', location.href);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'pbs.twimg.com' ||
        url.pathname !== posterPath
      ) {
        return null;
      }
    } catch {
      return null;
    }
  }
  const top = document.elementsFromPoint(x, y)[0];
  if (!top || top.closest('article') !== quoteArticle) {
    return null;
  }
  const control = top.closest('button, [role="button"]');
  if (!(control instanceof HTMLElement)) {
    return null;
  }
  for (
    let scope: HTMLElement | null = element, depth = 0;
    scope && scope !== quoteArticle && depth <= 5;
    scope = scope.parentElement, depth += 1
  ) {
    if (scope.contains(control)) {
      return control;
    }
  }
  return null;
}

export function inspectHostVideoDocument(
  video: Element,
  { posterPath }: { posterPath: string | null }
) {
  if (!(video instanceof HTMLVideoElement) || !video.closest('article')) {
    return null;
  }
  const parsePoster = (value: string) => {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' &&
        url.hostname === 'pbs.twimg.com' &&
        /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(
          url.pathname
        )
        ? { host: url.hostname, path: url.pathname }
        : null;
    } catch {
      return null;
    }
  };
  const ownArticle = video.closest('article');
  if (!ownArticle) {
    return null;
  }
  const attributePoster = video.poster ? parsePoster(video.poster) : null;
  const matchingSiblings = [...ownArticle.querySelectorAll('img')].filter(
    (image) =>
      image.closest('article') === ownArticle &&
      parsePoster(image.currentSrc || image.src)?.path === posterPath
  );
  const posterEvidence =
    video.poster && attributePoster?.path !== posterPath
      ? 'conflict'
      : attributePoster?.path === posterPath
        ? 'video-attribute'
        : matchingSiblings.length === 1
          ? 'unique-sibling-image'
          : matchingSiblings.length > 1
            ? 'ambiguous-sibling-images'
            : 'missing';
  const poster =
    ['video-attribute', 'unique-sibling-image'].includes(posterEvidence) && posterPath
      ? { host: 'pbs.twimg.com', path: posterPath }
      : null;
  const sourceValue = video.currentSrc || video.src;
  let sourceKind = 'none';
  let source = null;
  if (sourceValue.startsWith('blob:')) {
    sourceKind = 'blob';
  } else if (sourceValue) {
    try {
      const url = new URL(sourceValue);
      if (url.protocol === 'https:' && url.hostname === 'video.twimg.com') {
        sourceKind = 'trusted-video-cdn';
        source = { host: url.hostname, path: url.pathname };
      } else {
        sourceKind = 'other';
      }
    } catch {
      sourceKind = 'other';
    }
  }
  return {
    poster,
    posterEvidence,
    matchingSiblingCount: Math.min(matchingSiblings.length, 20),
    sourceKind,
    source,
    readyState: video.readyState,
    width: video.videoWidth,
    height: video.videoHeight,
    mediaErrorCode: video.error?.code ?? null,
    currentTime: video.currentTime,
    paused: video.paused,
  };
}

export function quotedVideoHitTestPassed({
  controlledVideoClickMode,
  galleryActionKind,
  initialHit,
  finalHit,
  identityBeforeClick,
  focusPrepared,
  meaningfulFocusTarget,
  focusedControlStillOwnsClick,
}: {
  controlledVideoClickMode: string | null;
  galleryActionKind: string | undefined;
  initialHit: ReturnType<typeof inspectHitTestedVideoActionDocument>;
  finalHit: ReturnType<typeof inspectHitTestedVideoActionDocument>;
  identityBeforeClick: boolean;
  focusPrepared: boolean;
  meaningfulFocusTarget: boolean;
  focusedControlStillOwnsClick: boolean | undefined;
}) {
  if (!identityBeforeClick) {
    return false;
  }
  if (galleryActionKind === 'non-control-media-surface') {
    return initialHit?.inQuote === true && finalHit?.inQuote === true;
  }
  if (
    galleryActionKind !== 'media-scoped-control-under-allow-all' ||
    controlledVideoClickMode !== 'allow-all' ||
    initialHit?.inQuote !== false ||
    finalHit?.inQuote !== false ||
    !focusPrepared ||
    !meaningfulFocusTarget ||
    focusedControlStillOwnsClick !== true
  ) {
    return false;
  }
  return [initialHit.nativePlay, finalHit.nativePlay].every(
    (control) =>
      control &&
      Number.isFinite(control.x) &&
      Number.isFinite(control.y) &&
      Number.isInteger(control.mediaScopeDepth) &&
      control.mediaScopeDepth >= 0 &&
      control.mediaScopeDepth <= 5
  );
}

export function captureActivationFocusDocument(
  surface: Element,
  { articleIndex, point }: { articleIndex: number; point: { x: number; y: number } }
) {
  const article = document.querySelectorAll('article')[articleIndex];
  const state: { focus: HTMLElement | null; captured: boolean } = { focus: null, captured: false };
  const onClick = (event: MouseEvent) => {
    if (
      state.captured ||
      !event.isTrusted ||
      event.button !== 0 ||
      Math.abs(event.clientX - point.x) > 1 ||
      Math.abs(event.clientY - point.y) > 1 ||
      !(event.target instanceof Element) ||
      !article?.contains(surface) ||
      !surface.contains(event.target) ||
      !article.contains(event.target)
    ) {
      return;
    }
    const focused = document.activeElement;
    if (
      !(focused instanceof HTMLElement) ||
      !focused.isConnected ||
      !article.contains(focused) ||
      ['BODY', 'HTML'].includes(focused.tagName)
    ) {
      return;
    }
    state.focus = focused;
    state.captured = true;
  };
  window.addEventListener('click', onClick, true);
  return {
    get focus() {
      return state.focus;
    },
    get captured() {
      return state.captured;
    },
    dispose() {
      window.removeEventListener('click', onClick, true);
    },
  };
}

export function findActivationHitDocument(
  surface: Element,
  { articleIndex, point }: { articleIndex: number; point: { x: number; y: number } }
) {
  const article = document.querySelectorAll('article')[articleIndex];
  const top = document.elementsFromPoint(point.x, point.y)[0];
  if (
    !(top instanceof Element) ||
    !article?.contains(surface) ||
    !article.contains(top) ||
    surface.closest('article') !== top.closest('article')
  ) {
    return null;
  }
  if (surface === top || surface.contains(top)) {
    return top;
  }
  if (surface.matches('button, [role="button"]')) {
    return null;
  }
  const mediaShell = surface.closest(
    '[data-testid="videoPlayer"], [data-testid="previewInterstitial"]'
  );
  return mediaShell?.contains(top) ? top : null;
}

export function quotedVideoSurface(
  target: Pick<
    QuoteTarget,
    'playerIndex' | 'previewIndex' | 'posterIndex' | 'videoIndex' | 'hitKind'
  >
) {
  if (target.playerIndex >= 0) {
    return { selector: '[data-testid="videoPlayer"]', index: target.playerIndex };
  }
  if (target.previewIndex >= 0) {
    return { selector: '[data-testid="previewInterstitial"]', index: target.previewIndex };
  }
  // Playback can remove the sibling poster while retaining the identified video.
  if (target.hitKind === 'video' && target.videoIndex >= 0) {
    return { selector: 'video', index: target.videoIndex };
  }
  if (target.posterIndex >= 0) {
    return { selector: 'img', index: target.posterIndex };
  }
  return { selector: 'video', index: target.videoIndex };
}

export async function inspectHitTestedAction(
  image:
    | import('@playwright/test').Locator
    | import('@playwright/test').ElementHandle<HTMLImageElement>,
  identity: Identity,
  target?: ImageTarget
): Promise<{
  actionAriaLabel: string | null;
  actionIndex: number;
  actionPath: string;
  duplicateActionCount: number;
} | null> {
  return (image as import('@playwright/test').Locator).evaluate(
    (element, { identity: { handle, statusId }, target }) => {
      const article = element.closest('article');
      if (!(element instanceof HTMLImageElement) || !article || !element.isConnected) {
        return null;
      }
      if (target) {
        if (!element.complete || element.naturalWidth <= 0) {
          return null;
        }
        try {
          const source = new URL(element.currentSrc || element.src);
          if (
            source.protocol !== 'https:' ||
            source.hostname.toLowerCase() !== target.imageSource.host ||
            source.pathname !== target.imageSource.path
          ) {
            return null;
          }
        } catch {
          return null;
        }
      }
      const mediaPath = new RegExp(`^/${handle}/status/${statusId}/photo/\\d+$`, 'iu');
      const anchors = [...article.querySelectorAll<HTMLAnchorElement>('a[href]')];
      const parseLink = (anchor: HTMLAnchorElement) => {
        try {
          const url = new URL(anchor.href, location.href);
          return ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) ? url : null;
        } catch {
          return null;
        }
      };
      const rectangle = element.getBoundingClientRect();
      if (
        rectangle.bottom <= 0 ||
        rectangle.top >= innerHeight ||
        rectangle.right <= 0 ||
        rectangle.left >= innerWidth
      ) {
        return null;
      }
      const x = Math.max(0, Math.min(innerWidth - 1, rectangle.left + rectangle.width / 2));
      const y = Math.max(0, Math.min(innerHeight - 1, rectangle.top + rectangle.height / 2));
      if (target?.quoteBoundary === 'compact-two-level') {
        if (
          !target.ownerHandle ||
          !target.ownerStatusId ||
          !target.directQuoteId ||
          !element.complete ||
          element.naturalWidth <= 0
        ) {
          return null;
        }
        try {
          const source = new URL(element.currentSrc || element.src);
          if (
            source.hostname !== target.imageSource.host ||
            source.pathname !== target.imageSource.path
          ) {
            return null;
          }
        } catch {
          return null;
        }
        const outerArticle = article.parentElement?.closest('article');
        const compact = element.closest('[role="link"]');
        const ownerPath = `/${target.ownerHandle}/status/${target.ownerStatusId}`;
        const compactOwnerPath = (anchor: HTMLAnchorElement) =>
          /^(\/[A-Za-z0-9_]{1,15}\/status\/[1-9]\d*)(?:\/photo\/[1-9]\d*)?$/u.exec(
            parseLink(anchor)?.pathname ?? ''
          )?.[1] ?? null;
        const imageLink = element.closest<HTMLAnchorElement>('a[href]');
        const hit = document.elementFromPoint(x, y);
        const hitLink = hit?.closest<HTMLAnchorElement>('a[href]');
        const imagePath = imageLink ? parseLink(imageLink)?.pathname : null;
        const actionPath = hitLink ? parseLink(hitLink)?.pathname : null;
        if (
          !outerArticle?.contains(article) ||
          ![...outerArticle.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
            const url = parseLink(anchor);
            return (
              anchor.closest('article') === outerArticle &&
              url?.pathname.toLowerCase() === `/${handle}/status/${statusId}`.toLowerCase()
            );
          }) ||
          !compact ||
          compact.closest('article') !== article ||
          !imageLink ||
          !hitLink ||
          imageLink === hitLink ||
          compactOwnerPath(imageLink) !== ownerPath ||
          actionPath !== imagePath ||
          !actionPath ||
          [...compact.querySelectorAll<HTMLAnchorElement>('a[href]')].some(
            (anchor) => compactOwnerPath(anchor) !== ownerPath
          )
        ) {
          return null;
        }
        const directQuoteIds = new Set(
          [...article.querySelectorAll<HTMLAnchorElement>('a[href]')]
            .filter((anchor) => anchor.closest('article') === article && !compact.contains(anchor))
            .map(
              (anchor) =>
                /^\/[A-Za-z0-9_]{1,15}\/status\/([1-9]\d*)$/u.exec(
                  parseLink(anchor)?.pathname ?? ''
                )?.[1]
            )
            .filter((id): id is string => !!id)
        );
        if (directQuoteIds.size !== 1 || !directQuoteIds.has(target.directQuoteId)) {
          return null;
        }
        let region = element.parentElement;
        for (let hops = 0; region && !region.contains(hit) && hops < 4; hops += 1) {
          region = region.parentElement;
        }
        if (!region || !region.contains(hit) || !compact.contains(region) || region === compact) {
          return null;
        }
        const mediaImages = [...region.querySelectorAll<HTMLImageElement>('img')].filter(
          (candidate) => {
            try {
              const url = new URL(candidate.currentSrc || candidate.src);
              return (
                url.protocol === 'https:' &&
                url.hostname === 'pbs.twimg.com' &&
                url.pathname.startsWith('/media/')
              );
            } catch {
              return false;
            }
          }
        );
        const regionLinks = [...region.querySelectorAll<HTMLAnchorElement>('a[href]')];
        if (
          mediaImages.length !== 1 ||
          mediaImages[0] !== element ||
          regionLinks.length !== 2 ||
          regionLinks.some((anchor) => parseLink(anchor)?.pathname !== actionPath)
        ) {
          return null;
        }
        const outerAnchors = [...outerArticle.querySelectorAll<HTMLAnchorElement>('a[href]')];
        const actionIndex = outerAnchors.indexOf(hitLink);
        if (actionIndex < 0) {
          return null;
        }
        return {
          actionAriaLabel: hitLink.getAttribute('aria-label'),
          actionIndex,
          actionPath,
          duplicateActionCount: regionLinks.length,
        };
      }
      const hitAnchors = [
        ...new Set(
          document
            .elementsFromPoint(x, y)
            .map((candidate) => candidate.closest<HTMLAnchorElement>('a[href]'))
            .filter((candidate): candidate is HTMLAnchorElement => candidate !== null)
        ),
      ];
      const ownsStatus = anchors.some((anchor) => {
        const url = parseLink(anchor);
        return (
          anchor.closest('article') === article &&
          url?.pathname.toLowerCase() === `/${handle}/status/${statusId}`.toLowerCase()
        );
      });
      if (!ownsStatus) {
        return null;
      }
      if (target) {
        const sameSourceCount = [...article.querySelectorAll<HTMLImageElement>('img')].filter(
          (candidate) => {
            if (candidate.closest('article') !== article) {
              return false;
            }
            try {
              const source = new URL(candidate.currentSrc || candidate.src);
              return (
                source.protocol === 'https:' &&
                source.hostname.toLowerCase() === target.imageSource.host &&
                source.pathname === target.imageSource.path
              );
            } catch {
              return false;
            }
          }
        ).length;
        if (sameSourceCount !== 1) {
          return null;
        }
      }
      const action = hitAnchors.find((anchor) => {
        const url = parseLink(anchor);
        return anchor.closest('article') === article && url && mediaPath.test(url.pathname);
      });
      if (!action) {
        return null;
      }
      const actionUrl = parseLink(action);
      if (!actionUrl) {
        return null;
      }
      const duplicateActionCount = anchors.filter((anchor) => {
        const url = parseLink(anchor);
        return anchor.closest('article') === article && url?.pathname === actionUrl.pathname;
      }).length;
      return {
        actionAriaLabel: action.getAttribute('aria-label'),
        actionIndex: anchors.indexOf(action),
        actionPath: actionUrl.pathname,
        duplicateActionCount,
      };
    },
    { identity, target }
  );
}

export async function inspectHitTestedNativePreviewAction(
  action: import('@playwright/test').Locator,
  identity: Identity,
  target: NativePreviewTarget
): Promise<boolean> {
  return action.evaluate(
    (element, { identity: { handle, statusId }, target }) => {
      const article = document.querySelectorAll('article')[target.articleIndex];
      const preview = element.closest('div[role="link"][data-testid="nestedQuotePreview"]');
      const wrapper = preview?.parentElement?.closest('div[role="link"]');
      if (
        !(element instanceof HTMLAnchorElement) ||
        !article ||
        element.closest('article') !== article ||
        element.getAttribute('role') !== 'link' ||
        element.getAttribute('data-testid') !== 'nestedQuotePreviewMedia' ||
        preview?.closest('article') !== article ||
        wrapper?.closest('article') !== article ||
        article.querySelectorAll('a[data-testid="nestedQuotePreviewMedia"]').length !== 1 ||
        article.querySelectorAll('div[role="link"][data-testid="nestedQuotePreview"]').length !==
          1 ||
        [...article.querySelectorAll<HTMLAnchorElement>('a[href]')].indexOf(element) !==
          target.actionIndex
      ) {
        return false;
      }
      const exactArticleCount = [...document.querySelectorAll('article')].filter((candidate) =>
        [...candidate.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
          try {
            const url = new URL(anchor.href, location.href);
            return (
              anchor.closest('article') === candidate &&
              url.protocol === 'https:' &&
              ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
              url.pathname.toLowerCase() === `/${handle}/status/${statusId}`.toLowerCase()
            );
          } catch {
            return false;
          }
        })
      ).length;
      const rectangle = element.getBoundingClientRect();
      const x = rectangle.left + rectangle.width / 2;
      const y = rectangle.top + rectangle.height / 2;
      const hit =
        x >= 0 && y >= 0 && x < innerWidth && y < innerHeight
          ? document.elementFromPoint(x, y)
          : null;
      try {
        const url = new URL(element.href, location.href);
        return (
          exactArticleCount === 1 &&
          url.protocol === 'https:' &&
          ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
          !url.username &&
          !url.password &&
          !url.port &&
          !url.search &&
          !url.hash &&
          url.pathname === target.actionPath &&
          url.pathname ===
            `/${target.ownerHandle}/status/${target.ownerStatusId}/photo/${target.photoNumber}` &&
          rectangle.width > 0 &&
          rectangle.height > 0 &&
          getComputedStyle(element).display !== 'none' &&
          getComputedStyle(element).visibility !== 'hidden' &&
          Number(getComputedStyle(element).opacity) !== 0 &&
          hit !== null &&
          element.contains(hit) &&
          hit.closest('a[href]') === element
        );
      } catch {
        return false;
      }
    },
    { identity, target }
  );
}
