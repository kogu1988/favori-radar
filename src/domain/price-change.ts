import type { PriceObservation } from "./models";

export function calculatePriceChange(
  observations: PriceObservation[]
): Pick<
  import("./models").TrackedListing,
  "currentPrice" | "previousPrice" | "priceChange" | "priceChangeRate"
> {
  const sorted = [...observations].sort((a, b) =>
    b.observedAt.localeCompare(a.observedAt)
  );
  const currentPrice = sorted[0]?.amount ?? null;
  const previousPrice = sorted[1]?.amount ?? null;

  if (currentPrice === null || previousPrice === null) {
    return {
      currentPrice,
      previousPrice,
      priceChange: null,
      priceChangeRate: null
    };
  }

  const priceChange = currentPrice - previousPrice;
  return {
    currentPrice,
    previousPrice,
    priceChange,
    priceChangeRate:
      previousPrice === 0 ? null : (priceChange / previousPrice) * 100
  };
}
