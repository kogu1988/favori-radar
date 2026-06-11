import type { ListingKind, ListingSnapshot } from "../domain/models";
import type { ExtensionMessage } from "../shared/messages";

const FAVORITES_PATH = "/favori-ilanlar";
const LIST_PATH = "/favori-ilanlar/liste";
const SCAN_STATE_KEY = "favoriteScanQueue";
const PRICE_PATTERN = /(\d[\d.\s]*)\s*TL\b/i;
const LISTING_ID_PATTERN = /-(\d+)\/detay\/?$/i;

interface FavoriteList {
  name: string;
  count: number;
  url: string;
}

interface ScanQueue {
  lists: FavoriteList[];
  remaining: FavoriteList[];
  listingCount: number;
}

function detectListingKind(
  favoriteListName: string | null,
  category: string | null
): ListingKind {
  const value = `${favoriteListName ?? ""} ${category ?? ""}`.toLocaleLowerCase(
    "tr-TR"
  );
  if (/motosiklet/.test(value)) return "motorcycle";
  if (/otomobil|arazi, suv|minivan|ticari araç|vasıta/.test(value)) return "car";
  if (/arsa/.test(value)) return "land";
  if (/konut|daire|villa|müstakil|rezidans|ev/.test(value)) return "housing";
  return "other";
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parsePrice(value: string): number | null {
  const match = value.match(PRICE_PATTERN);
  if (!match) return null;
  const amount = Number(match[1].replace(/[.\s]/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function listingIdFromUrl(url: string): string | null {
  return url.match(LISTING_ID_PATTERN)?.[1] ?? null;
}

function findFavoriteLists(): FavoriteList[] {
  return [
    ...document.querySelectorAll<HTMLAnchorElement>(
      'a[href^="/favori-ilanlar/liste?folderId="]'
    )
  ].flatMap((anchor) => {
    const text = normalizeText(anchor.innerText);
    const match = text.match(/^(.+?)\s*\((\d+)\s+ilan\)$/i);
    if (!match) return [];
    return [
      {
        name: match[1].trim(),
        count: Number(match[2]),
        url: new URL(anchor.getAttribute("href")!, location.origin).href
      }
    ];
  });
}

async function waitForFavoriteLists(): Promise<FavoriteList[]> {
  const current = findFavoriteLists();
  if (current.length > 0) return current;

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      resolve(findFavoriteLists());
    }, 15_000);
    const observer = new MutationObserver(() => {
      const lists = findFavoriteLists();
      if (lists.length === 0) return;
      window.clearTimeout(timeout);
      observer.disconnect();
      resolve(lists);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function readListings(listName: string): ListingSnapshot[] {
  const rows = [
    ...document.querySelectorAll<HTMLElement>(".favorite-classified-row")
  ];

  return rows.flatMap((row) => {
    const titleAnchor =
      row.querySelector<HTMLAnchorElement>("a.classified-title[href]");
    const priceElement = row.querySelector<HTMLElement>(
      ".favorite-feature-price-position"
    );
    if (!titleAnchor || !priceElement) return [];

    const url = new URL(titleAnchor.href, location.href).href;
    const id = listingIdFromUrl(url);
    const amount = parsePrice(priceElement.innerText);
    const title = normalizeText(titleAnchor.innerText);
    if (!id || amount === null || !title) return [];

    const breadcrumbs = [
      ...row.querySelectorAll<HTMLElement>(".classified-location-bread li span")
    ].map((item) => normalizeText(item.innerText));
    const image = row.querySelector<HTMLImageElement>(".col-image img");

    return [
      {
        listing: {
          id,
          favoriteListName: listName,
          kind: detectListingKind(listName, breadcrumbs.join(" > ")),
          url,
          title,
          category: breadcrumbs.join(" > ") || listName,
          location: null,
          imageUrl: image?.currentSrc || image?.src || null,
          images: image?.currentSrc || image?.src ? [image.currentSrc || image.src] : [],
          description: null,
          attributes: {},
          seller: {
            displayName: null,
            type: "unknown",
            profileUrl: null,
            phone: null
          },
          status: row.classList.contains("active-classified")
            ? "active"
            : "removed"
        },
        price: {
          listingId: id,
          amount,
          currency: "TRY"
        }
      }
    ];
  });
}

function currentPageFingerprint(): string {
  return [
    ...document.querySelectorAll<HTMLAnchorElement>(
      ".favorite-classified-row a.classified-title[href]"
    )
  ]
    .map((anchor) => anchor.href)
    .join("|");
}

async function waitForListingRows(previousFingerprint?: string): Promise<void> {
  if (
    document.querySelector(".favorite-classified-row") &&
    (!previousFingerprint ||
      currentPageFingerprint() !== previousFingerprint)
  ) {
    return;
  }

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 10_000);
    const observer = new MutationObserver(() => {
      const fingerprint = currentPageFingerprint();
      if (
        !document.querySelector(".favorite-classified-row") ||
        (previousFingerprint && fingerprint === previousFingerprint)
      ) {
        return;
      }
      window.clearTimeout(timeout);
      observer.disconnect();
      resolve();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

async function readAllListingPages(
  listName: string
): Promise<ListingSnapshot[]> {
  const snapshots = new Map<string, ListingSnapshot>();

  await waitForListingRows();
  for (let page = 0; page < 100; page += 1) {
    for (const snapshot of readListings(listName)) {
      snapshots.set(snapshot.listing.id, snapshot);
    }

    const next = document.querySelector<HTMLAnchorElement>(
      'a[aria-label="Next"]'
    );
    if (!next || next.parentElement?.classList.contains("disabled")) break;

    const previousFingerprint = currentPageFingerprint();
    next.click();
    await waitForListingRows(previousFingerprint);
    if (currentPageFingerprint() === previousFingerprint) break;
  }

  return [...snapshots.values()];
}

function send(message: ExtensionMessage): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

function readDetailDocument(
  documentRoot: Document,
  base: ListingSnapshot
): ListingSnapshot {
  const attributes: Record<string, string> = {};
  for (const item of documentRoot.querySelectorAll<HTMLElement>(
    ".classifiedInfoList li"
  )) {
    const key = normalizeText(item.querySelector("strong")?.textContent);
    const value = normalizeText(item.querySelector("span")?.textContent);
    if (key && value) attributes[key] = value;
  }
  const images = [
    ...documentRoot.querySelectorAll<HTMLImageElement>(
      ".classifiedDetailThumbList img"
    )
  ]
    .map((image) => image.dataset.src || image.src)
    .filter(Boolean)
    .map((url) => url.replace("/thmb_", "/x5_"));
  const sellerStyle = [
    ...documentRoot.querySelectorAll<HTMLStyleElement>(".classifiedUserBox style")
  ]
    .map((style) => style.textContent ?? "")
    .join(" ");
  const sellerName =
    sellerStyle.match(/content:\s*['"]([^'"]+)['"]/)?.[1] ?? null;
  const detailHtml = documentRoot.documentElement.outerHTML;
  const visiblePhone = documentRoot.querySelector<HTMLElement>(
    ".pretty-phone-part.show-part [data-content]"
  )?.dataset.content;
  const phoneValues = [
    visiblePhone ?? "",
    ...[
      ...documentRoot.querySelectorAll<HTMLElement>(
        ".classifiedUserBox [data-content], .classifiedUserBox a[href^='tel:']"
      )
    ].flatMap((element) => [
      element.dataset.content ?? "",
      element.getAttribute("href")?.replace(/^tel:/, "") ?? ""
    ])
  ];
  const scriptedPhones = [
    ...detailHtml.matchAll(
      /(?:data-content['"]?\s*,\s*['"]|data-content=["'])(0\s*\(5\d{2}\)\s*\d{3}\s*\d{2}\s*\d{2})/gi
    )
  ].map((match) => match[1]);
  const phone =
    [...phoneValues, ...scriptedPhones]
      .map((value) => normalizeText(value))
      .find((value) =>
        /^0\s*\(5\d{2}\)\s*\d{3}\s*\d{2}\s*\d{2}$/.test(value)
      ) ?? null;
  const locationText = normalizeText(
    documentRoot.querySelector(".classifiedInfo h2")?.textContent
  );
  const description = normalizeText(
    documentRoot.querySelector(
      "#classifiedDescription, .classifiedDescription"
    )?.textContent
  );

  return {
    ...base,
    listing: {
      ...base.listing,
      location: locationText || base.listing.location,
      imageUrl: images[0] ?? base.listing.imageUrl,
      images: images.length ? images : base.listing.images,
      description: description || base.listing.description,
      attributes,
      seller: {
        displayName: sellerName,
        type: attributes.Kimden === "Sahibinden" ? "individual" : "unknown",
        profileUrl: null,
        phone
      }
    }
  };
}

async function enrichSnapshots(
  snapshots: ListingSnapshot[],
  listName: string,
  lists: FavoriteList[]
): Promise<{ snapshots: ListingSnapshot[]; failedCount: number }> {
  const enriched: ListingSnapshot[] = [];
  let failedCount = 0;
  for (let index = 0; index < snapshots.length; index += 1) {
    const snapshot = snapshots[index];
    await send({
      type: "FAVORITE_SCAN_STATUS",
      payload: {
        phase: "details",
        lists: lists.map(({ name, count }) => ({ name, count })),
        listName,
        current: index + 1,
        total: snapshots.length,
        failedCount,
        listingTitle: snapshot.listing.title
      }
    });
    try {
      const response = (await send({
        type: "FETCH_LISTING_DETAIL",
        payload: { url: snapshot.listing.url }
      })) as { ok: boolean; html?: string };
      if (!response.ok || !response.html) {
        failedCount += 1;
        enriched.push(snapshot);
        continue;
      }
      const detailDocument = new DOMParser().parseFromString(
        response.html,
        "text/html"
      );
      const detailed = readDetailDocument(detailDocument, snapshot);
      if (
        Object.keys(detailed.listing.attributes).length === 0 &&
        !detailed.listing.description
      ) {
        failedCount += 1;
        enriched.push(snapshot);
      } else {
        enriched.push(detailed);
      }
    } catch {
      failedCount += 1;
      enriched.push(snapshot);
    }
  }
  return { snapshots: enriched, failedCount };
}

async function saveQueue(queue: ScanQueue | null): Promise<void> {
  if (queue) {
    await chrome.storage.local.set({ [SCAN_STATE_KEY]: queue });
  } else {
    await chrome.storage.local.remove(SCAN_STATE_KEY);
  }
}

async function getQueue(): Promise<ScanQueue | null> {
  const stored = await chrome.storage.local.get(SCAN_STATE_KEY);
  return (stored[SCAN_STATE_KEY] as ScanQueue | undefined) ?? null;
}

async function startScan(): Promise<void> {
  const lists = await waitForFavoriteLists();
  if (lists.length === 0) {
    throw new Error("Favori listeleri sayfada bulunamadı");
  }
  const queue: ScanQueue = {
    lists,
    remaining: lists.filter((list) => list.count > 0),
    listingCount: 0
  };

  await send({
    type: "FAVORITE_SCAN_STATUS",
    payload: {
      phase: "started",
      listCount: lists.length,
      lists: lists.map(({ name, count }) => ({ name, count }))
    }
  });

  const next = queue.remaining.shift();
  if (!next) {
    await send({
      type: "FAVORITE_SCAN_STATUS",
      payload: { phase: "completed", lists: [], listingCount: 0 }
    });
    return;
  }

  await saveQueue(queue);
  location.href = next.url;
}

async function scanCurrentList(): Promise<void> {
  const queue = await getQueue();
  if (!queue) return;

  const folderId = new URL(location.href).searchParams.get("folderId");
  const current =
    queue.lists.find(
      (list) => new URL(list.url).searchParams.get("folderId") === folderId
    ) ?? null;
  if (!current) return;

  const listSnapshots = await readAllListingPages(current.name);
  const detailResult = await enrichSnapshots(
    listSnapshots,
    current.name,
    queue.lists
  );
  const snapshots = detailResult.snapshots;
  await send({
    type: "FAVORITE_SCAN_STATUS",
    payload: {
      phase: "saving",
      lists: queue.lists.map(({ name, count }) => ({ name, count })),
      listName: current.name,
      listingCount: snapshots.length,
      failedCount: detailResult.failedCount
    }
  });
  if (snapshots.length > 0) {
    await send({ type: "FAVORITES_DISCOVERED", payload: snapshots });
  }
  queue.listingCount += snapshots.length;

  await send({
    type: "FAVORITE_SCAN_STATUS",
    payload: {
      phase: "list",
      lists: queue.lists.map(({ name, count }) => ({ name, count })),
      listName: current.name,
      listingCount: snapshots.length,
      failedCount: detailResult.failedCount
    }
  });

  const next = queue.remaining.shift();
  if (next) {
    await saveQueue(queue);
    location.href = next.url;
    return;
  }

  await saveQueue(null);
  await send({
    type: "FAVORITE_SCAN_STATUS",
    payload: {
      phase: "completed",
      lists: queue.lists.map(({ name, count }) => ({ name, count })),
      listingCount: queue.listingCount
    }
  });
}

async function run(): Promise<void> {
  if (/\/ilan\/.+-\d+\/detay\/?$/.test(location.pathname)) {
    await scanListingDetail();
  } else if (location.pathname === FAVORITES_PATH) {
    await startScan();
  } else if (location.pathname === LIST_PATH) {
    await scanCurrentList();
  }
}

async function scanListingDetail(): Promise<void> {
  const id = listingIdFromUrl(location.href);
  const title = normalizeText(
    document.querySelector<HTMLElement>(".classifiedDetailTitle h1")?.innerText
  );
  const priceText = normalizeText(
    document.querySelector<HTMLElement>(
      ".classifiedInfo .classified-price-wrapper"
    )?.innerText
  );
  const amount = parsePrice(priceText);
  if (!id || !title || amount === null) return;

  const base: ListingSnapshot = {
    listing: {
      id,
      favoriteListName: null,
      kind: detectListingKind(null, document.querySelector(".classifiedBreadCrumb")?.textContent ?? null),
      url: location.href,
      title,
      category: null,
      location: null,
      imageUrl: null,
      images: [],
      description: null,
      attributes: {},
      seller: {
        displayName: null,
        type: "unknown",
        profileUrl: null,
        phone: null
      },
      status: "active"
    },
    price: { listingId: id, amount, currency: "TRY" }
  };
  await send({
    type: "LISTING_DETAIL_DISCOVERED",
    payload: readDetailDocument(document, base)
  });
}

void run().catch((error: unknown) => {
  void saveQueue(null);
  void send({
    type: "FAVORITE_SCAN_STATUS",
    payload: {
      phase: "error",
      message: error instanceof Error ? error.message : "Bilinmeyen hata"
    }
  });
});
