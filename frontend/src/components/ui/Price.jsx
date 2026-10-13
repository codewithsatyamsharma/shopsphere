import { formatINR } from "../../lib/format";

export function Price({ price, originalPrice, discountPercent, size = "md" }) {
  const big = size === "lg";
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-bold ${big ? "text-3xl" : "text-lg"}`}>{formatINR(price)}</span>
      {originalPrice > price && (
        <>
          <span className="muted text-sm line-through">{formatINR(originalPrice)}</span>
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{discountPercent}% off</span>
        </>
      )}
    </div>
  );
}
