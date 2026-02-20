export function formatTimeSeconds(value: number | string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  if (Number.isInteger(numeric)) return numeric.toLocaleString("en-US");
  return numeric.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
