import { HeroSection } from "@/components/HeroSection";
import { LatestNews } from "@/components/LatestNews";
import { LeagueTableWidget } from "@/components/LeagueTableWidget";
import { UpcomingMatches } from "@/components/UpcomingMatches";
import Countdown from "@/components/Countdown";
import { MediaCarousel } from "@/components/MediaCarousel";
import { Widget } from "@/hooks/use-homepage-layout";
import { PinnedArticleWidget } from "./PinnedArticleWidget";

interface WidgetRendererProps {
  widget: Widget;
}

export const WidgetRenderer = ({ widget }: WidgetRendererProps) => {
  switch (widget.widget_type) {
    case 'hero':
      return <HeroSection {...widget.settings} />;
    case 'countdown':
      return <Countdown />;
    case 'media_carousel':
      return <MediaCarousel />;
    case 'upcoming_matches':
      return <UpcomingMatches />;
    case 'latest_news':
      return <LatestNews />;
    case 'league_table':
      return <LeagueTableWidget />;
    case 'pinned_article':
      return <PinnedArticleWidget {...widget} />;
    default:
      return null;
  }
};