import { describe, expect, it } from "vitest";
import {
  AUTO_TITLE_MAX_LENGTH,
  buildArticlePayload,
  buildAutoSlug,
  buildAutoTitle,
} from "@/lib/news/articleComposer";

describe("articleComposer", () => {
  it("buildAutoTitle generates title from first non-empty line", () => {
    const title = buildAutoTitle("  \n  Primo aggiornamento importante\nSeconda linea");
    expect(title).toBe("Primo aggiornamento importante");
  });

  it("buildAutoTitle falls back when content is empty", () => {
    const title = buildAutoTitle("   \n   ");
    expect(title).toBe("Aggiornamento");
  });

  it("buildAutoTitle truncates to max length", () => {
    const longInput = "a".repeat(AUTO_TITLE_MAX_LENGTH + 20);
    const title = buildAutoTitle(longInput);
    expect(title).toHaveLength(AUTO_TITLE_MAX_LENGTH);
  });

  it("buildAutoSlug appends unique suffix", () => {
    const slug = buildAutoSlug("Titolo Prova");
    expect(slug).toMatch(/^titolo-prova-[a-z0-9]+$/);
  });

  it("buildArticlePayload returns published payload", () => {
    const payload = buildArticlePayload({
      authorId: "user-1",
      content: "Messaggio pubblicato",
      status: "published",
      coverImageUrl: "https://example.com/test.png",
    });

    expect(payload.author_id).toBe("user-1");
    expect(payload.status).toBe("published");
    expect(payload.published_at).toBeTruthy();
    expect(payload.is_pinned).toBe(false);
    expect(payload.slug).toMatch(/^messaggio-pubblicato-[a-z0-9]+$/);
  });

  it("buildArticlePayload returns draft payload", () => {
    const payload = buildArticlePayload({
      authorId: "user-1",
      content: "Messaggio bozza",
      status: "draft",
    });

    expect(payload.status).toBe("draft");
    expect(payload.published_at).toBeNull();
  });

  it("buildArticlePayload throws on empty content", () => {
    expect(() =>
      buildArticlePayload({
        authorId: "user-1",
        content: "   ",
        status: "published",
      })
    ).toThrowError("CONTENT_EMPTY");
  });

  it("buildArticlePayload throws on too long content", () => {
    expect(() =>
      buildArticlePayload({
        authorId: "user-1",
        content: "a".repeat(281),
        status: "published",
      })
    ).toThrowError("CONTENT_TOO_LONG");
  });
});
