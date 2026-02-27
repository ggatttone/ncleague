import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateMatch, MatchWithTeams } from '@/hooks/use-matches';
import { useTranslation } from 'react-i18next';

interface MatchScoreEditorProps {
  match: MatchWithTeams;
  onSaved: () => void;
}

export const MatchScoreEditor = ({ match, onSaved }: MatchScoreEditorProps) => {
  const { t } = useTranslation();
  const updateMatch = useUpdateMatch();
  const [isEditing, setIsEditing] = useState(false);
  const [homeInput, setHomeInput] = useState(String(match.home_score));
  const [awayInput, setAwayInput] = useState(String(match.away_score));

  const isCompleted = match.status === 'completed';

  const handleEdit = () => {
    setHomeInput(String(match.home_score));
    setAwayInput(String(match.away_score));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    const finalHomeScore = isCompleted ? Math.max(0, Number(homeInput) || 0) : 0;
    const finalAwayScore = isCompleted ? Math.max(0, Number(awayInput) || 0) : 0;

    await updateMatch.mutateAsync({
      id: match.id,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      match_date: match.match_date,
      status: match.status,
      home_score: finalHomeScore,
      away_score: finalAwayScore,
      venue_id: match.venue_id ?? undefined,
      competition_id: match.competition_id ?? undefined,
      season_id: match.season_id ?? undefined,
      referee_team_id: match.referee_team_id ?? undefined,
    });

    onSaved();
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-4xl sm:text-5xl font-bold tabular-nums">
            {isCompleted ? match.home_score : '—'}
          </span>
          <span className="text-3xl sm:text-4xl font-light text-muted-foreground">–</span>
          <span className="text-4xl sm:text-5xl font-bold tabular-nums">
            {isCompleted ? match.away_score : '—'}
          </span>
        </div>
        {isCompleted && (
          <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            {t('pages.admin.fixtureDetails.editScoreButton')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="flex items-center gap-3 sm:gap-4">
        <Input
          type="number"
          min="0"
          value={homeInput}
          onChange={(e) => setHomeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-16 h-10 text-xl sm:w-20 sm:h-12 sm:text-2xl text-center font-bold"
          autoFocus // eslint-disable-line jsx-a11y/no-autofocus
        />
        <span className="text-2xl sm:text-3xl font-light text-muted-foreground">–</span>
        <Input
          type="number"
          min="0"
          value={awayInput}
          onChange={(e) => setAwayInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-16 h-10 text-xl sm:w-20 sm:h-12 sm:text-2xl text-center font-bold"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="default"
          onClick={handleSave}
          disabled={updateMatch.isPending}
          className="gap-1.5"
        >
          {updateMatch.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {t('pages.admin.fixtureDetails.saveScoreButton')}
        </Button>
        <Button
          variant="ghost"
          onClick={handleCancel}
          disabled={updateMatch.isPending}
          className="gap-1.5"
        >
          <X className="h-4 w-4" />
          {t('pages.admin.fixtureDetails.cancelScoreButton')}
        </Button>
      </div>
    </div>
  );
};
