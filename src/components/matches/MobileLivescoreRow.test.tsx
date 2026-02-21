import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";

import { MobileLivescoreRow, MobileLivescoreRowProps } from "@/components/matches/MobileLivescoreRow";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const dictionary: Record<string, string> = {
        "matchStatus.scheduled": "Scheduled",
        "matchStatus.ongoing": "Ongoing",
        "matchStatus.completed": "Completed",
        "matchStatus.postponed": "Postponed",
        "matchStatus.cancelled": "Cancelled",
      };
      return dictionary[key] ?? String(options?.defaultValue ?? key);
    },
  }),
}));

const buildMatch = (
  overrides: Partial<MobileLivescoreRowProps["match"]> = {}
): MobileLivescoreRowProps["match"] => ({
  id: "match-1",
  status: "scheduled",
  match_date: "2026-03-08T19:30:00+00:00",
  home_score: 0,
  away_score: 0,
  home_teams: {
    name: "North City",
    logo_url: "https://example.com/home.png",
  },
  away_teams: {
    name: "South United",
    logo_url: "https://example.com/away.png",
  },
  venues: {
    name: "Main Field",
  },
  ...overrides,
});

describe("MobileLivescoreRow", () => {
  it("renders scheduled matches with kickoff time and vs placeholder", () => {
    render(<MobileLivescoreRow match={buildMatch()} />);

    expect(screen.getByText("19:30")).toBeInTheDocument();
    expect(screen.getByText("vs")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /North City vs South United, Scheduled/i })
    ).toHaveAttribute("href", "/matches/match-1");
  });

  it("renders completed matches with final score", () => {
    render(
      <MobileLivescoreRow
        match={buildMatch({
          status: "completed",
          home_score: 2,
          away_score: 1,
        })}
      />
    );

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("2-1")).toBeInTheDocument();
  });

  it("renders ongoing matches with live score", () => {
    render(
      <MobileLivescoreRow
        match={buildMatch({
          status: "ongoing",
          home_score: 3,
          away_score: 3,
        })}
      />
    );

    expect(screen.getByText("Ongoing")).toBeInTheDocument();
    expect(screen.getByText("3-3")).toBeInTheDocument();
  });

  it.each([
    ["postponed", "Postponed"],
    ["cancelled", "Cancelled"],
  ] as const)(
    "renders %s matches with compact score placeholder",
    (status, expectedLabel) => {
      render(
        <MobileLivescoreRow
          match={buildMatch({
            status,
            home_score: 0,
            away_score: 0,
          })}
        />
      );

      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      expect(screen.getByText("--")).toBeInTheDocument();
    }
  );

  it("shows fallback icon container when team logo is missing", () => {
    render(
      <MobileLivescoreRow
        match={buildMatch({
          home_teams: { name: "Fallback Home", logo_url: null },
          away_teams: { name: "Fallback Away", logo_url: null },
        })}
      />
    );

    expect(screen.getByLabelText("Fallback Home fallback")).toBeInTheDocument();
    expect(screen.getByLabelText("Fallback Away fallback")).toBeInTheDocument();
  });
});

