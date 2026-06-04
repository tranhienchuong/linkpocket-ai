type RawMetadata = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  favicon?: string;
  siteName?: string;
};

type MetadataResponse = RawMetadata & {
  image?: string;
};

const HTML_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];
const MAX_HTML_BYTES = 1_000_000;
const FETCH_TIMEOUT_MS = 7000;

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function parseHttpUrl(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("URL is required.");
  }

  const parsedUrl = new URL(value.trim());
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  return parsedUrl;
}

function decodeHtml(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanMetadataValue(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const cleaned = decodeHtml(value).replace(/\s+/g, " ").trim();
  return cleaned || undefined;
}

function parseAttributes(tag: string) {
  const attrs: Record<string, string> = {};
  const attrPattern = /([^\s=/"'>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(tag)) !== null) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }

  return attrs;
}

function findMeta(html: string, attribute: "property" | "name", names: string[]) {
  const normalizedNames = new Set(names.map((name) => name.toLowerCase()));
  const metaPattern = /<meta\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = metaPattern.exec(html)) !== null) {
    const attrs = parseAttributes(match[0]);
    const key = attrs[attribute]?.toLowerCase();
    if (key && normalizedNames.has(key)) {
      return cleanMetadataValue(attrs.content);
    }
  }

  return undefined;
}

function findTitle(html: string) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return cleanMetadataValue(match?.[1]);
}

function findFavicon(html: string, pageUrl: URL) {
  const linkPattern = /<link\b[^>]*>/gi;
  let fallbackIcon: string | undefined;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const attrs = parseAttributes(match[0]);
    const rel = attrs.rel?.toLowerCase();
    const href = cleanMetadataValue(attrs.href);

    if (!rel || !href) {
      continue;
    }

    if (rel.split(/\s+/).includes("icon") || rel.includes("shortcut icon")) {
      return toAbsoluteUrl(href, pageUrl);
    }

    if (!fallbackIcon && rel.includes("apple-touch-icon")) {
      fallbackIcon = toAbsoluteUrl(href, pageUrl);
    }
  }

  return fallbackIcon ?? new URL("/favicon.ico", pageUrl.origin).toString();
}

function toAbsoluteUrl(value: string | undefined, baseUrl: URL) {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function parseMetadata(html: string, pageUrl: URL): MetadataResponse {
  const title = findTitle(html);
  const description = findMeta(html, "name", ["description"]);
  const ogTitle = findMeta(html, "property", ["og:title"]);
  const ogDescription = findMeta(html, "property", ["og:description"]);
  const ogImage = findMeta(html, "property", ["og:image", "og:image:url"]);
  const twitterTitle = findMeta(html, "name", ["twitter:title"]);
  const twitterDescription = findMeta(html, "name", ["twitter:description"]);
  const twitterImage = findMeta(html, "name", ["twitter:image", "twitter:image:src"]);
  const siteName = findMeta(html, "property", ["og:site_name"]);
  const favicon = findFavicon(html, pageUrl);
  const image = toAbsoluteUrl(ogImage ?? twitterImage, pageUrl);

  return {
    title: ogTitle ?? twitterTitle ?? title,
    description: ogDescription ?? twitterDescription ?? description,
    ogTitle,
    ogDescription,
    ogImage: toAbsoluteUrl(ogImage, pageUrl),
    twitterTitle,
    twitterDescription,
    twitterImage: toAbsoluteUrl(twitterImage, pageUrl),
    favicon,
    image,
    siteName,
  };
}

async function readLimitedHtml(response: Response) {
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_HTML_BYTES) {
    throw new Error("HTML response is too large.");
  }

  const html = await response.text();
  return html.slice(0, MAX_HTML_BYTES);
}

export async function POST(request: Request) {
  let pageUrl: URL;

  try {
    const body = await request.json();
    pageUrl = parseHttpUrl(body?.url);
  } catch {
    return jsonError("Please provide a valid http or https URL.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(pageUrl.toString(), {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "LinkPocketAI/1.0 Metadata Preview",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      return jsonError("Website blocked the request or returned an error.", 502);
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (
      contentType &&
      !HTML_CONTENT_TYPES.some((htmlType) => contentType.includes(htmlType))
    ) {
      return jsonError("The URL did not return an HTML page.", 415);
    }

    const html = await readLimitedHtml(response);
    const metadata = parseMetadata(html, pageUrl);

    if (
      !metadata.title &&
      !metadata.description &&
      !metadata.image &&
      !metadata.siteName
    ) {
      return jsonError("No metadata found for this page.", 404);
    }

    return Response.json(metadata);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError("Metadata request timed out.", 504);
    }

    return jsonError("Could not fetch metadata for this URL.", 502);
  } finally {
    clearTimeout(timeoutId);
  }
}
