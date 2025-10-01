import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useTranslation } from "react-i18next";

interface ClosePhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seasonId?: string;
  currentPhaseName: string;
}

export const ClosePhaseDialog = ({ open, onOpenChange, seasonId, currentPhaseName }: ClosePhaseDialogProps) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const closePhaseMutation = useMutation({
    mutationFn: async () => {
      if (!seasonId) throw new Error("Season ID is required.");
      const { data, error } = await supabase.functions.invoke('tournament-phase-manager', {
        body: { season_id: seasonId, phase_to_close: currentPhaseName }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess(t('pages.admin.tournamentDashboard.closePhase.success'));
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['league-table'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      showError(`${t('pages.admin.tournamentDashboard.closePhase.error')}: ${err.message}`);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('pages.admin.tournamentDashboard.closePhase.title')}</DialogTitle>
          <DialogDescription>
            {t('pages.admin.tournamentDashboard.closePhase.description', { phaseName: currentPhaseName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('pages.admin.teams.cancelButton')}</Button>
          <Button onClick={() => closePhaseMutation.mutate()} disabled={closePhaseMutation.isPending}>
            {closePhaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('pages.admin.tournamentDashboard.closePhase.confirmButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};