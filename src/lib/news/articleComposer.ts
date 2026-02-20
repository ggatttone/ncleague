import { UpsertArticleData } from "@/hooks/use-articles";

export const COMPOSER_MAX_LENGTH = 280;
export const AUTO_TITLE_MAX_LENGTH = 72;
const DEFAULT_AUTO_TITLE = "Aggiornamento";

export function buildAutoTitle(content: string): string {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return DEFAULT_AUTO_TITLE;
  }

  const firstNonEmptyLine =
    trimmedContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  const compactLine = firstNonEmptyLine.replace(/\s+/g, " ").trim();
  const truncatedTitle = compactLine.slice(0, AUTO_TITLE_MAX_LENGTH).trim();

  return truncatedTitle || DEFAULT_AUTO_TITLE;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildAutoSlug(title: string): string {
  const slugBase = slugify(title) || slugify(DEFAULT_AUTO_TITLE);
  const uniqueSuffix = Date.now().toString(36);
  return `${slugBase}-${uniqueSuffix}`;
}

export interface BuildArticlePayloadInput {
  authorId: string;
  content: string;
  coverImageUrl?: string;
  status: "draft" | "published";
}

export function buildArticlePayload({
  authorId,
  content,
  coverImageUrl,
  status,
}: BuildArticlePayloadInput): UpsertArticleData {
  const normalizedContent = content.trim();

  if (!normalizedContent) {
    throw new Error("CONTENT_EMPTY");
  }

  if (normalizedContent.length > COMPOSER_MAX_LENGTH) {
    throw new Error("CONTENT_TOO_LONG");
  }

  const title = buildAutoTitle(normalizedContent);
  const slug = buildAutoSlug(title);

  return {
    author_id: authorId,
    title,
    slug,
    content: normalizedContent,
    cover_image_url: coverImageUrl,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
    is_pinned: false,
  };
}
