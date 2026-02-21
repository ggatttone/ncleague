import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/test-utils";

import Matches from "@/pages/Matches";

const useSupabaseQueryMock = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const dictionary: Record<string, string> = {
        "pages.matches.title": "Matches",
        "pages.matches.upcoming": "Upcoming",
        "pages.matches.completed": "Completed",
        "pages.matches.finalStage": "Final Stage",
        "pages.matches.selectTeam": "Select team",
        "pages.matches.allTeams": "All teams",
        "pages.matches.selectCompetitionAndSeason": "Select competition and season",
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

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => true,
}));

vi.mock("@/hooks/use-supabase-query", () => ({
  useSupabaseQuery: (...args: unknown[]) => useSupabaseQueryMock(...args),
}));

vi.mock("@/hooks/use-competitions", () => ({
  useCompetitions: () => ({
    data: [{ id: "comp-1", name: "League A" }],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-seasons", () => ({
  useSeasons: () => ({
    data: [{ id: "season-1", name: "2025/26" }],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-teams", () => ({
  useTeams: () => ({
    data: [
      { id: "team-a", name: "Alpha FC" },
      { id: "team-b", name: "Beta FC" },
      { id: "team-c", name: "Gamma Town" },
      { id: "team-d", name: "Delta City" },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-playoffs", () => ({
  usePlayoffBracket: () => ({
    data: null,
  }),
}));

vi.mock("@/lib/supabase/auth-context", () => ({
  useAuth: () => ({
    user: null,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {},
}));

const mockMatches = [
  {
    id: "m-1",
    competition_id: "comp-1",
    season_id: "season-1",
    venue_id: "venue-1",
    home_team_id: "team-a",
    away_team_id: "team-b",
    match_date: "2026-03-08T19:30:00+00:00",
    home_score: 0,
    away_score: 0,
    status: "scheduled",
    stage: "regular_season",
    created_at: "2026-03-01T00:00:00+00:00",
    updated_at: "2026-03-01T00:00:00+00:00",
    home_teams: { id: "team-a", name: "Alpha FC", logo_url: null },
    away_teams: { id: "team-b", name: "Beta FC", logo_url: null },
    venues: { name: "Main Field" },
  },
  {
    id: "m-2",
    competition_id: "comp-1",
    season_id: "season-1",
    venue_id: "venue-1",
    home_team_id: "team-c",
    away_team_id: "team-d",
    match_date: "2026-03-09T20:00:00+00:00",
    home_score: 1,
    away_score: 3,
    status: "completed",
    stage: "regular_season",
    created_at: "2026-03-01T00:00:00+00:00",
    updated_at: "2026-03-01T00:00:00+00:00",
    home_teams: { id: "team-c", name: "Gamma Town", logo_url: null },
    away_teams: { id: "team-d", name: "Delta City", logo_url: null },
    venues: { name: "Main Field" },
  },
];

describe("Matches mobile view", () => {
  beforeAll(() => {
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = () => false;
    }
    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = () => {};
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = () => {};
    }
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = () => {};
    }
  });

  beforeEach(() => {
    useSupabaseQueryMock.mockReturnValue({
      data: mockMatches,
      isLoading: false,
      error: null,
    });
  });

  it("switches tabs without regressions in mobile layout", async () => {
    const user = userEvent.setup();
    render(<Matches />);

    await waitFor(() => {
      expect(screen.getByText("Alpha FC")).toBeInTheDocument();
    });

    const completedTab = screen.getByRole("tab", { name: /Completed \(1\)/i });
    await user.click(completedTab);

    expect(screen.getByText("Gamma Town")).toBeInTheDocument();
    expect(screen.getByText("Delta City")).toBeInTheDocument();
  });

  it("applies team filter correctly on mobile", async () => {
    const user = userEvent.setup();
    render(<Matches />);

    await waitFor(() => {
      expect(screen.getByText("Alpha FC")).toBeInTheDocument();
    });

    const comboBoxes = screen.getAllByRole("combobox");
    await user.click(comboBoxes[2]);
    await user.click(await screen.findByRole("option", { name: "Alpha FC" }));

    expect(screen.getByRole("link", { name: /Alpha FC vs Beta FC/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Gamma Town vs Delta City/i })
    ).not.toBeInTheDocument();
  });
});
