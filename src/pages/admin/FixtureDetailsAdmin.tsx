import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { useDeleteGoal, useGoalsForMatch } from "@/hooks/use-goals";
import { supabase } from "@/lib/supabase/client";
import { Match, Team } from "@/types/database";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GoalForm } from "@/components/admin/GoalForm";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

type MatchWithTeams = Match & {
  home_teams: Team;
  away_teams: Team;
  referee_teams: Team | null;
};

const FixtureDetailsAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: match, isLoading: matchLoading } = useSupabaseQuery<MatchWithTeams>(
    ['match-admin', id],
    async () => supabase
      .from('matches')
      .select('*, venues(name), home_teams:teams!matches_home_team_id_fkey(*), away_teams:teams!matches_away_team_id_fkey(*), referee_teams:teams!matches_referee_team_id_fkey(*)')
      .eq('id', id)
      .single(),
    { enabled: !!id }
  );

  const { data: goals, isLoading: goalsLoading } = useGoalsForMatch(id);
  const deleteGoalMutation = useDeleteGoal();

  const handleDeleteGoal = (goalId: string) => {
    deleteGoalMutation.mutate(goalId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['goals', id] });
        queryClient.invalidateQueries({ queryKey: ['match-admin', id] });
      }
    });
  };

  if (matchLoading) {
    return <AdminLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div></AdminLayout>;
  }

  if (!match) {
    return <AdminLayout><div>Partita non trovata.</div></AdminLayout>;
  }
  
  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Dettaglio Partita</h1>
          <Button onClick={() => navigate(`/admin/fixtures/${id}/edit`)} className="w-full sm:w-auto">
            Modifica
          </Button>
        </div>
        
        <div className="bg-card rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <div className="text-xl font-bold">{match.home_teams.name}</div>
              <div className="text-muted-foreground">Casa</div>
            </div>
            <div className="text-3xl font-bold">{match.home_score} - {match.away_score}</div>
            <div className="text-center">
              <div className="text-xl font-bold">{match.away_teams.name}</div>
              <div className="text-muted-foreground">Ospite</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold">Data e ora</div>
              <div>{new Date(match.match_date).toLocaleString('it-IT')}</div>
            </div>
            <div>
              <div className="font-semibold">Campo</div>
              <div>{match.venues?.name || '-'}</div>
            </div>
            <div>
              <div className="font-semibold">Stato</div>
              <div className="capitalize">{match.status}</div>
            </div>
            <div>
              <div className="font-semibold">Arbitro</div>
              <div>{match.referee_teams?.name || '-'}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Marcatori</h2>
          {goalsLoading ? (
            <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {goals?.map(goal => (
                <div key={goal.id} className="flex justify-between items-center">
                  <div>⚽ {goal.players.first_name} {goal.players.last_name} - {goal.minute}'</div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="link" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-1" /> Elimina
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Elimina marcatore</AlertDialogTitle>
                        <AlertDialogDescription>
                          Sei sicuro di voler eliminare questo goal? L'azione non può essere annullata.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleteGoalMutation.isPending}
                        >
                          {deleteGoalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Elimina
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              {goals?.length === 0 && <p className="text-muted-foreground text-sm">Nessun marcatore registrato.</p>}
            </div>
          )}
          
          <Dialog open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-4">
                + Aggiungi marcatore
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aggiungi Marcatore</DialogTitle>
                <DialogDescription>
                  Seleziona la squadra, il giocatore e il minuto del goal.
                </DialogDescription>
              </DialogHeader>
              <GoalForm 
                matchId={match.id}
                homeTeam={match.home_teams}
                awayTeam={match.away_teams}
                onSuccess={() => setIsGoalFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FixtureDetailsAdmin;