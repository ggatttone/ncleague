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
      <div className="flex items-center justify-center gap-3">
        <span className="text-3xl font-bold tabular-nums">
          {isCompleted ? match.home_score : '-'}
        </span>
        <span className="text-3xl font-bold text-muted-foreground">-</span>
        <span className="text-3xl font-bold tabular-nums">
          {isCompleted ? match.away_score : '-'}
        </span>
        {isCompleted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleEdit}
            title={t('pages.admin.fixtureDetails.editScoreButton')}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          value={homeInput}
          onChange={(e) => setHomeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-16 text-center text-xl font-bold"
        />
        <span className="text-2xl font-bold text-muted-foreground">-</span>
        <Input
          type="number"
          min="0"
          value={awayInput}
          onChange={(e) => setAwayInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-16 text-center text-xl font-bold"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="default" size="sm" onClick={handleSave} disabled={updateMatch.isPending}>
          {updateMatch.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span className="ml-1">{t('pages.admin.fixtureDetails.saveScoreButton')}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={updateMatch.isPending}>
          <X className="h-4 w-4" />
          <span className="ml-1">{t('pages.admin.fixtureDetails.cancelScoreButton')}</span>
        </Button>
      </div>
    </div>
  );
};
