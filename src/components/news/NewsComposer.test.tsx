import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "@/test/test-utils";
import { NewsComposer } from "@/components/news/NewsComposer";

const { mutateAsyncMock, authMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  authMock: {
    user: { id: "user-1" },
    profile: { first_name: "Mario", last_name: "Rossi", avatar_url: null, role: "editor" },
  },
}));

vi.mock("@/hooks/use-articles", () => ({
  useCreateArticle: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock("@/lib/supabase/auth-context", () => ({
  useAuth: () => authMock,
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://example.com/image.png" },
        }),
      }),
    },
  },
}));

vi.mock("@/utils/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        "pages.news.composer.placeholder": "Write an update...",
        "pages.news.composer.attachImage": "Attach image",
        "pages.news.composer.removeImage": "Remove image",
        "pages.news.composer.publish": "Publish",
        "pages.news.composer.saveDraft": "Save draft",
        "pages.news.composer.publishSuccess": "Published",
        "pages.news.composer.draftSuccess": "Draft saved",
        "pages.news.composer.submitError": "Submit error",
        "pages.news.composer.uploadSuccess": "Image uploaded",
        "pages.news.composer.uploadError": "Image error",
        "pages.news.composer.validationMaxLength": "Max 280 characters",
      };

      if (key === "pages.news.composer.charCounter") {
        return `${options?.count ?? 0}/${options?.max ?? 0}`;
      }

      return map[key] ?? key;
    },
  }),
}));

describe("NewsComposer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsyncMock.mockResolvedValue({ id: "article-1" });
  });

  it("disables submit buttons when content is empty", () => {
    render(<NewsComposer />);

    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
  });

  it("blocks submit when content is over 280 characters", () => {
    render(<NewsComposer />);
    const textarea = screen.getByPlaceholderText("Write an update...");

    fireEvent.change(textarea, { target: { value: "a".repeat(281) } });

    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
    expect(screen.getByText("Max 280 characters")).toBeInTheDocument();
  });

  it("submits publish payload with status=published", async () => {
    render(<NewsComposer />);
    const textarea = screen.getByPlaceholderText("Write an update...");
    fireEvent.change(textarea, { target: { value: "Nuovo aggiornamento pubblico" } });

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    const payload = mutateAsyncMock.mock.calls[0][0];

    expect(payload.status).toBe("published");
    expect(payload.author_id).toBe("user-1");
    expect(payload.content).toBe("Nuovo aggiornamento pubblico");
    expect(payload.is_pinned).toBe(false);
    expect(payload.published_at).toBeTruthy();
  });

  it("submits draft payload with status=draft", async () => {
    render(<NewsComposer />);
    const textarea = screen.getByPlaceholderText("Write an update...");
    fireEvent.change(textarea, { target: { value: "Bozza interna" } });

    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    const payload = mutateAsyncMock.mock.calls[0][0];

    expect(payload.status).toBe("draft");
    expect(payload.published_at).toBeNull();
  });

  it("resets the form after successful submit", async () => {
    render(<NewsComposer />);
    const textarea = screen.getByPlaceholderText("Write an update...");
    fireEvent.change(textarea, { target: { value: "Test reset field" } });

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(textarea).toHaveValue(""));
  });
});
