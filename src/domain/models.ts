export type ListingStatus = "active" | "removed" | "unknown";
export type SellerType = "individual" | "business" | "unknown";
export type ListingKind = "car" | "motorcycle" | "housing" | "land" | "other";

export interface Seller {
  displayName: string | null;
  type: SellerType;
  profileUrl: string | null;
  phone: string | null;
}

export interface Listing {
  id: string;
  favoriteListName: string | null;
  kind: ListingKind;
  url: string;
  title: string;
  category: string | null;
  location: string | null;
  imageUrl: string | null;
  images: string[];
  description: string | null;
  attributes: Record<string, string>;
  seller: Seller;
  status: ListingStatus;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface PriceObservation {
  id: string;
  listingId: string;
  amount: number;
  currency: "TRY";
  observedAt: string;
}

export interface ListingSnapshot {
  listing: Omit<Listing, "firstSeenAt" | "lastSeenAt">;
  price: Omit<PriceObservation, "id" | "observedAt">;
}

export interface TrackedListing extends Listing {
  currentPrice: number | null;
  previousPrice: number | null;
  priceChange: number | null;
  priceChangeRate: number | null;
}
