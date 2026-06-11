import type { ListingSnapshot } from "../domain/models";

export type ExtensionMessage =
  | { type: "FAVORITES_DISCOVERED"; payload: ListingSnapshot[] }
  | { type: "LISTING_DETAIL_DISCOVERED"; payload: ListingSnapshot }
  | { type: "FETCH_LISTING_DETAIL"; payload: { url: string } }
  | {
      type: "FAVORITE_SCAN_STATUS";
      payload: {
        phase:
          | "started"
          | "list"
          | "details"
          | "saving"
          | "completed"
          | "error";
        lists?: Array<{ name: string; count: number }>;
        listName?: string;
        listCount?: number;
        listingCount?: number;
        current?: number;
        total?: number;
        failedCount?: number;
        listingTitle?: string;
        message?: string;
      };
    }
  | { type: "OPEN_DASHBOARD" };
