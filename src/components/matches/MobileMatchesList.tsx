import { MobileLivescoreRow, MobileLivescoreRowProps } from "@/components/matches/MobileLivescoreRow";

interface MobileMatchesListProps {
  matches: MobileLivescoreRowProps["match"][];
}

export const MobileMatchesList = ({ matches }: MobileMatchesListProps) => {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="divide-y divide-border/80">
        {matches.map((match) => (
          <MobileLivescoreRow key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};

