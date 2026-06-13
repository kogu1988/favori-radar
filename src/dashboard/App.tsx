import { useEffect, useMemo, useState } from "react";
import type {
  PriceObservation,
  TrackedListing
} from "../domain/models";
import { calculatePriceChange } from "../domain/price-change";
import { detectListingKind, groupAttributes } from "../domain/listing-kind";
import {
  getAllListings,
  getPrices
} from "../storage/database";

interface ScanStatus {
  phase: "started" | "list" | "details" | "saving" | "completed" | "error";
  lists?: Array<{ name: string; count: number }>;
  listName?: string;
  listCount?: number;
  listingCount?: number;
  current?: number;
  total?: number;
  failedCount?: number;
  listingTitle?: string;
  message?: string;
}

interface ListingView extends TrackedListing {
  prices: PriceObservation[];
}

const demoListings: ListingView[] = [
  {
    id: "1234567890",
    favoriteListName: "Otomobil",
    kind: "car",
    url: "https://www.sahibinden.com/ilan/1234567890",
    title: "2022 model, düşük kilometre, bakımlı otomobil",
    category: "Otomobil / Sedan",
    location: "İstanbul / Kadıköy",
    imageUrl: null,
    images: [],
    description: "Düzenli bakımları yapılmış örnek ilan.",
    attributes: { Marka: "Örnek", Model: "Sedan", Yıl: "2022" },
    seller: {
      displayName: "Örnek Satıcı",
      type: "individual",
      profileUrl: null,
      phone: null
    },
    status: "active",
    firstSeenAt: "2026-05-20T10:00:00.000Z",
    lastSeenAt: "2026-06-12T09:30:00.000Z",
    currentPrice: 1245000,
    previousPrice: 1299000,
    priceChange: -54000,
    priceChangeRate: -4.16,
    prices: []
  },
  {
    id: "1234567891",
    favoriteListName: "Otomobil",
    kind: "car",
    url: "https://www.sahibinden.com/ilan/1234567891",
    title: "Otomatik vites, temiz kullanılmış aile aracı",
    category: "Otomobil / Hatchback",
    location: "Ankara / Çankaya",
    imageUrl: null,
    images: [],
    description: "Ekspertiz bilgileri bulunan örnek ilan.",
    attributes: { Marka: "Örnek", Model: "Hatchback", Yıl: "2021" },
    seller: {
      displayName: "Örnek Galeri",
      type: "business",
      profileUrl: null,
      phone: null
    },
    status: "active",
    firstSeenAt: "2026-05-24T12:00:00.000Z",
    lastSeenAt: "2026-06-12T09:30:00.000Z",
    currentPrice: 985000,
    previousPrice: 985000,
    priceChange: 0,
    priceChangeRate: 0,
    prices: []
  },
  {
    id: "1234567892",
    favoriteListName: "Motosiklet",
    kind: "motorcycle",
    url: "https://www.sahibinden.com/ilan/1234567892",
    title: "Şehir içi kullanıma uygun motosiklet",
    category: "Motosiklet",
    location: "İzmir",
    imageUrl: null,
    images: [],
    description: "Örnek ilan açıklaması.",
    attributes: { Yıl: "2023" },
    seller: { displayName: null, type: "unknown", profileUrl: null, phone: null },
    status: "active",
    firstSeenAt: "2026-06-01T12:00:00.000Z",
    lastSeenAt: "2026-06-12T09:30:00.000Z",
    currentPrice: 215000,
    previousPrice: 205000,
    priceChange: 10000,
    priceChangeRate: 4.88,
    prices: []
  },
  {
    id: "1234567893",
    favoriteListName: "Konut",
    kind: "housing",
    url: "https://www.sahibinden.com/ilan/1234567893",
    title: "Merkezi konumda örnek konut ilanı",
    category: "Satılık Daire",
    location: "Bursa",
    imageUrl: null,
    images: [],
    description: "Örnek ilan açıklaması.",
    attributes: { "Oda Sayısı": "3+1" },
    seller: { displayName: null, type: "unknown", profileUrl: null, phone: null },
    status: "active",
    firstSeenAt: "2026-06-02T12:00:00.000Z",
    lastSeenAt: "2026-06-12T09:30:00.000Z",
    currentPrice: 4250000,
    previousPrice: null,
    priceChange: null,
    priceChangeRate: null,
    prices: []
  },
  {
    id: "1234567894",
    favoriteListName: "Arsa",
    kind: "land",
    url: "https://www.sahibinden.com/ilan/1234567894",
    title: "Yatırıma uygun örnek arsa ilanı",
    category: "Satılık Arsa",
    location: "Muğla",
    imageUrl: null,
    images: [],
    description: "Örnek ilan açıklaması.",
    attributes: { "Metrekare": "500" },
    seller: { displayName: null, type: "unknown", profileUrl: null, phone: null },
    status: "active",
    firstSeenAt: "2026-06-03T12:00:00.000Z",
    lastSeenAt: "2026-06-12T09:30:00.000Z",
    currentPrice: 1750000,
    previousPrice: null,
    priceChange: null,
    priceChangeRate: null,
    prices: []
  }
];

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0
});

const kindIcons = {
  car: "AUTO",
  motorcycle: "MOTO",
  housing: "EV",
  land: "ARSA",
  other: "LISTE"
} as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

async function loadListingViews(): Promise<ListingView[]> {
  const listings = await getAllListings();
  return Promise.all(
    listings.map(async (listing) => {
      const prices = await getPrices(listing.id);
      return {
        ...listing,
        kind: listing.kind ?? detectListingKind(listing.favoriteListName, listing.category),
        images: listing.images ?? (listing.imageUrl ? [listing.imageUrl] : []),
        description: listing.description ?? null,
        attributes: listing.attributes ?? {},
        seller: {
          ...listing.seller,
          phone: listing.seller.phone ?? null
        },
        ...calculatePriceChange(prices),
        prices: prices.sort((a, b) =>
          b.observedAt.localeCompare(a.observedAt)
        )
      };
    })
  );
}

function PriceChange({ listing }: { listing: ListingView }) {
  if (listing.priceChange === null || listing.priceChange === 0) {
    return <span className="change neutral">Değişim yok</span>;
  }
  const decreased = listing.priceChange < 0;
  return (
    <span className={`change ${decreased ? "down" : "up"}`}>
      {decreased ? "Düştü" : "Arttı"}{" "}
      {priceFormatter.format(Math.abs(listing.priceChange))}
      {listing.priceChangeRate === null
        ? ""
        : ` (%${Math.abs(listing.priceChangeRate).toFixed(1)})`}
    </span>
  );
}

function ListingDetails({
  listing,
  onBack
}: {
  listing: ListingView;
  onBack: () => void;
}) {
  const attributeGroups = groupAttributes(listing.kind, listing.attributes);
  return (
    <section className="detail">
      <button className="back-button" onClick={onBack}>
        <span aria-hidden="true">←</span> İlanlara dön
      </button>
      <div className="detail-hero">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt="" />
        ) : (
          <div className="image-placeholder">Görsel yok</div>
        )}
        <div>
          <div className="detail-meta">
            <span className="kind-label">{kindIcons[listing.kind]}</span>
            <span>{listing.favoriteListName}</span>
            <span className={listing.status === "active" ? "status-dot active" : "status-dot"}>
              {listing.status === "active" ? "Yayında" : "Yayında değil"}
            </span>
          </div>
          <h2>{listing.title}</h2>
          <strong className="detail-price">
            {listing.currentPrice === null
              ? "Fiyat bilinmiyor"
              : priceFormatter.format(listing.currentPrice)}
          </strong>
          <PriceChange listing={listing} />
        </div>
      </div>
      <div className="detail-actions">
        <a className="external-link" href={listing.url} target="_blank" rel="noreferrer">
          Sahibinden ilanını aç
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h3>İlan bilgileri</h3>
          <dl>
            <div><dt>İlan numarası</dt><dd>{listing.id}</dd></div>
            <div><dt>Kategori</dt><dd>{listing.category ?? "Bilinmiyor"}</dd></div>
            <div><dt>Konum</dt><dd>{listing.location ?? "Henüz alınmadı"}</dd></div>
            <div><dt>Durum</dt><dd>{listing.status === "active" ? "Yayında" : "Yayında değil"}</dd></div>
            <div><dt>İlk görülme</dt><dd>{formatDate(listing.firstSeenAt)}</dd></div>
            <div><dt>Son kontrol</dt><dd>{formatDate(listing.lastSeenAt)}</dd></div>
          </dl>
        </section>

        <section className="panel">
          <h3>Satıcı bilgileri</h3>
          <dl>
            <div><dt>Satıcı</dt><dd>{listing.seller.displayName ?? "Henüz alınmadı"}</dd></div>
            <div><dt>Tür</dt><dd>{listing.seller.type === "business" ? "Kurumsal" : listing.seller.type === "individual" ? "Bireysel" : "Henüz alınmadı"}</dd></div>
            <div><dt>Telefon</dt><dd>{listing.seller.phone ?? "Sayfada görünür değil"}</dd></div>
          </dl>
        </section>
      </div>

      {attributeGroups.map((group) => (
        <section className="panel" key={group.title}>
          <h3>{group.title}</h3>
          <dl className="attributes">
            {group.entries.map(([key, value]) => (
              <div key={key}><dt>{key}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>
      ))}

      <section className="panel">
        <div className="panel-heading">
          <h3>Açıklama</h3>
          <span>{listing.description?.length ?? 0} karakter</span>
        </div>
        <p className="description">{listing.description ?? "Detay sayfası henüz taranmadı."}</p>
      </section>

      <section className="panel">
        <h3>Fiyat geçmişi</h3>
        {listing.prices.length === 0 ? (
          <p>Henüz fiyat kaydı yok.</p>
        ) : (
          <div className="price-history">
            {listing.prices.map((price) => (
              <div key={price.id}>
                <span>{formatDate(price.observedAt)}</span>
                <strong>{priceFormatter.format(price.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export function App() {
  const demoMode = new URLSearchParams(window.location.search).get("demo") === "store";
  const [listings, setListings] = useState<ListingView[]>(
    demoMode ? demoListings : []
  );
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(
    demoMode
      ? {
          phase: "completed",
          listingCount: 49,
          lists: [
            { name: "Otomobil", count: 14 },
            { name: "Motosiklet", count: 18 },
            { name: "Konut", count: 2 },
            { name: "Arsa", count: 10 },
            { name: "Diğer", count: 5 }
          ]
        }
      : null
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    demoMode ? "Otomobil" : null
  );
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [scanStarting, setScanStarting] = useState(false);

  const refresh = () => void loadListingViews().then(setListings);

  const startFullScan = async () => {
    setScanStarting(true);
    setScanStatus({
      phase: "started",
      message: "Favoriler sayfası açılıyor..."
    });
    try {
      const tabs = await chrome.tabs.query({
        url: "https://banaozel.sahibinden.com/favori-ilanlar*"
      });
      const existingTab = tabs.find((tab) => tab.id !== undefined);
      if (existingTab?.id !== undefined) {
        await chrome.tabs.update(existingTab.id, {
          url: "https://banaozel.sahibinden.com/favori-ilanlar",
          active: false
        });
      } else {
        await chrome.tabs.create({
          url: "https://banaozel.sahibinden.com/favori-ilanlar",
          active: false
        });
      }
    } catch (error: unknown) {
      setScanStatus({
        phase: "error",
        message: error instanceof Error ? error.message : "Tarama başlatılamadı"
      });
    } finally {
      setScanStarting(false);
    }
  };

  useEffect(() => {
    if (demoMode) return;
    refresh();
    if (!globalThis.chrome?.storage?.local) return;
    void chrome.storage.local
      .get("favoriteScanStatus")
      .then(({ favoriteScanStatus }) =>
        setScanStatus((favoriteScanStatus as ScanStatus | undefined) ?? null)
      );
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      const status = changes.favoriteScanStatus?.newValue as ScanStatus | undefined;
      if (!status) return;
      setScanStatus(status);
      if (status.phase === "completed" || status.phase === "list") refresh();
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [demoMode]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const listing of listings) {
      const name = listing.favoriteListName ?? "Diğer";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    for (const list of scanStatus?.lists ?? []) {
      if (!counts.has(list.name)) counts.set(list.name, 0);
    }
    return [...counts.entries()].map(([name, count]) => {
      const sample = listings.find((listing) => listing.favoriteListName === name);
      return {
        name,
        count,
        kind: sample?.kind ?? detectListingKind(name, name)
      };
    });
  }, [listings, scanStatus]);

  const summary = useMemo(() => {
    let decreased = 0;
    let increased = 0;
    let detailed = 0;
    for (const listing of listings) {
      if ((listing.priceChange ?? 0) < 0) decreased += 1;
      if ((listing.priceChange ?? 0) > 0) increased += 1;
      if (listing.description || Object.keys(listing.attributes).length > 0) detailed += 1;
    }
    return { decreased, increased, detailed };
  }, [listings]);

  const selectedListing = listings.find((item) => item.id === selectedListingId);
  const filteredListings = selectedCategory
    ? listings.filter((item) => item.favoriteListName === selectedCategory)
    : [];

  const openListing = (listing: ListingView) => {
    setSelectedListingId(listing.id);
  };

  if (selectedListing) {
    return (
      <main className="shell">
        <ListingDetails listing={selectedListing} onBack={() => setSelectedListingId(null)} />
      </main>
    );
  }

  return (
    <main className="shell">
      <header>
        <div className="brand-block">
          <div className="brand-mark">FR</div>
          <div>
            <h1>Favori Radar</h1>
            <p>İlanlarını, detaylarını ve fiyat hareketlerini tek yerde izle.</p>
          </div>
        </div>
        <div className="header-actions">
          <strong>{listings.length} ilan</strong>
          <button
            className="scan-button"
            disabled={
              scanStarting ||
              scanStatus?.phase === "details" ||
              scanStatus?.phase === "saving"
            }
            onClick={() => void startFullScan()}
          >
            {scanStarting ? "Başlatılıyor..." : "Tümünü yeniden tara"}
          </button>
        </div>
      </header>

      <section className="summary-strip" aria-label="Özet">
        <div><span>Takip edilen</span><strong>{listings.length}</strong></div>
        <div><span>Fiyatı düşen</span><strong className="summary-down">{summary.decreased}</strong></div>
        <div><span>Fiyatı artan</span><strong className="summary-up">{summary.increased}</strong></div>
        <div><span>Detayı alınan</span><strong>{summary.detailed}</strong></div>
      </section>

      {scanStatus ? (
        <section className={`scan-progress ${scanStatus.phase === "error" ? "scan-error" : ""}`}>
          <div className="scan-progress-copy">
            <strong>
              {scanStatus.phase === "started" && "Favori listeleri hazırlanıyor"}
              {scanStatus.phase === "details" && `${scanStatus.listName}: ilan detayları alınıyor`}
              {scanStatus.phase === "saving" && `${scanStatus.listName}: veriler kaydediliyor`}
              {scanStatus.phase === "list" && `${scanStatus.listName} tamamlandı`}
              {scanStatus.phase === "completed" && "Tarama tamamlandı"}
              {scanStatus.phase === "error" && "Tarama hatası"}
            </strong>
            <span>
              {scanStatus.phase === "details"
                ? `${scanStatus.current ?? 0} / ${scanStatus.total ?? 0} · ${scanStatus.listingTitle ?? ""}`
                : scanStatus.phase === "completed"
                  ? `${scanStatus.listingCount ?? listings.length} ilan güncellendi`
                  : scanStatus.message ?? `${scanStatus.listCount ?? 0} liste bulundu`}
            </span>
          </div>
          {scanStatus.phase === "details" && scanStatus.total ? (
            <div className="progress-track">
              <span style={{ width: `${((scanStatus.current ?? 0) / scanStatus.total) * 100}%` }} />
            </div>
          ) : null}
          {(scanStatus.failedCount ?? 0) > 0 ? (
            <small>{scanStatus.failedCount} ilanın ayrıntıları alınamadı; temel bilgiler saklandı.</small>
          ) : null}
        </section>
      ) : null}

      <section className="category-grid" aria-label="Favori listeleri">
        {categories.map((category) => (
          <button
            key={category.name}
            className={selectedCategory === category.name ? "category-card selected" : "category-card"}
            onClick={() => setSelectedCategory(category.name)}
          >
            <span className="category-icon">{kindIcons[category.kind]}</span>
            <span className="category-name">{category.name}</span>
            <span className="category-count"><strong>{category.count}</strong> ilan</span>
          </button>
        ))}
      </section>

      {selectedCategory ? (
        <section>
          <div className="section-heading">
            <div><p className="eyebrow">Favori listesi</p><h2>{selectedCategory}</h2><span>{filteredListings.length} ilan</span></div>
            <button className="text-button" onClick={() => setSelectedCategory(null)}>Kapat</button>
          </div>
          <div className="listing-grid">
            {filteredListings.map((listing) => (
              <button
                className="listing-card"
                key={listing.id}
                onClick={() => openListing(listing)}
              >
                {listing.imageUrl ? <img src={listing.imageUrl} alt="" /> : <div className="image-placeholder">Görsel yok</div>}
                <div className="listing-content">
                  <div className="card-meta">
                    <span className="kind-label">{kindIcons[listing.kind]}</span>
                    <span className="listing-category">{listing.category}</span>
                  </div>
                  <h3>{listing.title}</h3>
                  <strong className="listing-price">
                    {listing.currentPrice === null ? "Fiyat bilinmiyor" : priceFormatter.format(listing.currentPrice)}
                  </strong>
                  <PriceChange listing={listing} />
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="empty">
          <h2>Bir favori listesi seç</h2>
          <p>İlanları görmek için yukarıdaki kategori kutularından birine tıkla.</p>
        </section>
      )}
    </main>
  );
}
