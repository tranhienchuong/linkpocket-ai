const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
  "spm",
  "si",
]);

export type CleanUrlResult = {
  cleanUrl: string;
  domain: string;
};

export function cleanUrl(rawUrl: string): CleanUrlResult {
  const parsedUrl = new URL(rawUrl.trim());

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS links are supported.");
  }

  parsedUrl.hash = "";

  for (const param of Array.from(parsedUrl.searchParams.keys())) {
    if (TRACKING_PARAMS.has(param.toLowerCase())) {
      parsedUrl.searchParams.delete(param);
    }
  }

  const domain = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");

  return {
    cleanUrl: parsedUrl.toString(),
    domain,
  };
}
