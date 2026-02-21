import { render, screen } from "@/test/test-utils";
import { describe, expect, it, vi } from "vitest";
import { Footer } from "@/components/Footer";

vi.mock("@/components/theme/ThemeProvider", () => ({
  useThemeContext: () => ({
    theme: null,
    isLoading: false,
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "footer.rights") {
        return `© ${options?.year} NC League. All rights reserved.`;
      }

      const dictionary: Record<string, string> = {
        "footer.followUs": "Follow us",
        "footer.instagram": "Instagram",
        "footer.youtube": "YouTube",
        "footer.brandFallback": "NC League",
      };

      return dictionary[key] ?? key;
    },
  }),
}));

describe("Footer", () => {
  it("renders instagram and youtube links with expected URLs", () => {
    render(<Footer />);

    const instagram = screen.getByRole("link", { name: "Instagram" });
    const youtube = screen.getByRole("link", { name: "YouTube" });

    expect(instagram).toHaveAttribute(
      "href",
      "https://www.instagram.com/nc_league25/"
    );
    expect(youtube).toHaveAttribute(
      "href",
      "https://www.youtube.com/@NCLeague.football"
    );
  });

  it("opens social links in a new tab with secure rel attributes", () => {
    render(<Footer />);

    const instagram = screen.getByRole("link", { name: "Instagram" });
    const youtube = screen.getByRole("link", { name: "YouTube" });

    expect(instagram).toHaveAttribute("target", "_blank");
    expect(youtube).toHaveAttribute("target", "_blank");
    expect(instagram).toHaveAttribute("rel", "noopener noreferrer");
    expect(youtube).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the current year in the rights text", () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();

    expect(
      screen.getByText(`© ${currentYear} NC League. All rights reserved.`)
    ).toBeInTheDocument();
  });
});
