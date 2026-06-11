import type { Listing, ListingSnapshot, PriceObservation } from "../domain/models";

const DATABASE_NAME = "favori-takip";
const DATABASE_VERSION = 1;
const LISTINGS_STORE = "listings";
const PRICES_STORE = "prices";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(LISTINGS_STORE)) {
        database.createObjectStore(LISTINGS_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(PRICES_STORE)) {
        const store = database.createObjectStore(PRICES_STORE, { keyPath: "id" });
        store.createIndex("listingId", "listingId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSnapshot(snapshot: ListingSnapshot): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(
    [LISTINGS_STORE, PRICES_STORE],
    "readwrite"
  );
  const listingStore = transaction.objectStore(LISTINGS_STORE);
  const priceStore = transaction.objectStore(PRICES_STORE);
  const now = new Date().toISOString();
  const existing = (await requestToPromise(
    listingStore.get(snapshot.listing.id)
  )) as Listing | undefined;
  const listing: Listing = {
    ...existing,
    ...snapshot.listing,
    favoriteListName:
      snapshot.listing.favoriteListName ?? existing?.favoriteListName ?? null,
    kind:
      snapshot.listing.kind === "other" && existing?.kind
        ? existing.kind
        : snapshot.listing.kind,
    category: snapshot.listing.category ?? existing?.category ?? null,
    location: snapshot.listing.location ?? existing?.location ?? null,
    imageUrl: snapshot.listing.imageUrl ?? existing?.imageUrl ?? null,
    images:
      snapshot.listing.images.length > 0
        ? snapshot.listing.images
        : existing?.images ?? [],
    description: snapshot.listing.description ?? existing?.description ?? null,
    attributes: {
      ...(existing?.attributes ?? {}),
      ...snapshot.listing.attributes
    },
    seller: {
      ...(existing?.seller ?? snapshot.listing.seller),
      ...snapshot.listing.seller,
      phone:
        snapshot.listing.seller.phone ?? existing?.seller?.phone ?? null
    },
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now
  };
  const price: PriceObservation = {
    ...snapshot.price,
    id: `${snapshot.listing.id}:${now}`,
    observedAt: now
  };

  listingStore.put(listing);
  const previousPrices = (await requestToPromise(
    priceStore.index("listingId").getAll(snapshot.listing.id)
  )) as PriceObservation[];
  const latest = previousPrices.sort((a, b) =>
    b.observedAt.localeCompare(a.observedAt)
  )[0];
  if (!latest || latest.amount !== price.amount) {
    priceStore.put(price);
  }
  await transactionDone(transaction);
  database.close();
}

export async function getAllListings(): Promise<Listing[]> {
  const database = await openDatabase();
  const transaction = database.transaction(LISTINGS_STORE, "readonly");
  const result = await requestToPromise(
    transaction.objectStore(LISTINGS_STORE).getAll()
  );
  await transactionDone(transaction);
  database.close();
  return result as Listing[];
}

export async function getPrices(listingId: string): Promise<PriceObservation[]> {
  const database = await openDatabase();
  const transaction = database.transaction(PRICES_STORE, "readonly");
  const result = await requestToPromise(
    transaction.objectStore(PRICES_STORE).index("listingId").getAll(listingId)
  );
  await transactionDone(transaction);
  database.close();
  return result as PriceObservation[];
}
