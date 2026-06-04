import OpenAI from "openai";

type SummarizeRequest = {
  url: string;
  title: string;
  description?: string;
  domain: string;
  category: string;
  tags: string[];
  note?: string;
};

type SummaryResponse = {
  summary: string;
  suggestedTags: string[];
  suggestedNote: string;
  suggestedCategory: string;
  usefulness: string;
};

const MODEL = "llama-3.1-8b-instant";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const ALLOWED_CATEGORIES = [
  "study",
  "code",
  "video",
  "article",
  "tool",
  "shopping",
  "social",
  "other",
] as const;

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function isValidCategory(value: string) {
  return ALLOWED_CATEGORIES.includes(
    value.toLowerCase() as (typeof ALLOWED_CATEGORIES)[number],
  );
}

function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 5);
}

function normalizeCategory(value: unknown, fallback = "other") {
  const category = normalizeText(value).toLowerCase();
  return isValidCategory(category) ? category : fallback;
}

function normalizeSummary(value: unknown): SummaryResponse {
  const candidate =
    value && typeof value === "object"
      ? (value as Partial<SummaryResponse>)
      : {};

  return {
    summary: normalizeText(candidate.summary),
    suggestedTags: normalizeTags(candidate.suggestedTags),
    suggestedNote: normalizeText(candidate.suggestedNote),
    suggestedCategory: normalizeCategory(candidate.suggestedCategory),
    usefulness: normalizeText(candidate.usefulness),
  };
}

function parseHttpUrl(value: unknown) {
  const url = normalizeText(value);
  if (!url) {
    throw new Error("URL is required.");
  }

  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  return parsedUrl.toString();
}

function parseBody(value: unknown): SummarizeRequest {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid request body.");
  }

  const body = value as Partial<SummarizeRequest>;
  const url = parseHttpUrl(body.url);
  const title = normalizeText(body.title);
  const domain = normalizeText(body.domain);
  const category = normalizeText(body.category, "other");

  if (!title || !domain) {
    throw new Error("Title and domain are required.");
  }

  return {
    url,
    title,
    description: normalizeText(body.description) || undefined,
    domain,
    category,
    tags: normalizeTags(body.tags),
    note: normalizeText(body.note) || undefined,
  };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Empty AI response.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI response is not JSON.");
    }

    return JSON.parse(match[0]);
  }
}

function fallbackFromText(text: string, input: SummarizeRequest): SummaryResponse {
  const summary =
    text.trim() ||
    `Link này có vẻ liên quan đến ${input.domain}. Metadata hiện còn ít nên chỉ nên dùng như một gợi ý ban đầu.`;

  return {
    summary,
    suggestedTags: normalizeTags(input.tags),
    suggestedNote: input.note ?? "",
    suggestedCategory: normalizeCategory(input.category),
    usefulness: "Hữu ích để lưu lại và xem nhanh khi cần quay lại nguồn này.",
  };
}

function buildPrompt(input: SummarizeRequest) {
  return [
    "Bạn là trợ lý phân tích link cho app lưu bookmark LinkPocket AI.",
    "Trả lời bằng tiếng Việt, ngắn gọn, thực tế, không văn vẻ.",
    "Không bịa nội dung nếu metadata ít.",
    'Nếu chỉ có URL/title/domain thì suy luận nhẹ nhàng, dùng các cụm như "có vẻ", "nhiều khả năng".',
    "Chỉ trả về JSON hợp lệ, không markdown, không giải thích ngoài JSON.",
    "Schema bắt buộc:",
    '{"summary":"string","suggestedTags":["string"],"suggestedNote":"string","suggestedCategory":"study|code|video|article|tool|shopping|social|other","usefulness":"string"}',
    "Ràng buộc:",
    "- summary 2-3 câu.",
    "- suggestedTags tối đa 5 tags, không có dấu #.",
    "- suggestedNote 1 câu ngắn.",
    "- usefulness 1 câu nói link này hữu ích để làm gì.",
    "- suggestedCategory chỉ được là một trong: study, code, video, article, tool, shopping, social, other.",
    "",
    "Dữ liệu link:",
    JSON.stringify(input, null, 2),
  ].join("\n");
}

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return jsonError(
      "Missing GROQ_API_KEY. Please add it to .env.local.",
      500,
    );
  }

  let input: SummarizeRequest;

  try {
    input = parseBody(await request.json());
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Invalid request body.",
    );
  }

  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: GROQ_BASE_URL,
  });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Bạn chỉ trả về JSON hợp lệ theo schema được yêu cầu. Không dùng markdown.",
        },
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "";

    try {
      return Response.json(normalizeSummary(extractJson(content)));
    } catch {
      return Response.json(fallbackFromText(content, input));
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "AI summary request failed.";

    return jsonError(message, 502);
  }
}
