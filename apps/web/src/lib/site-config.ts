const FALLBACK_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(rawSiteUrl: string | undefined): string {
  if (!rawSiteUrl) {
    return FALLBACK_SITE_URL;
  }

  try {
    return new URL(rawSiteUrl).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const siteConfig = {
  name: "PCINN",
  description:
    "Interactive predictions for polymer properties using physics-constrained neural networks. Compare Baseline NN, PCINN, and SA-PCINN models.",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
} as const;
