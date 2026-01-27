import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { FileText, Pencil, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { useSeasonDrafts, useDeleteDraft } from "@/hooks/use-season-drafts";
import { WIZARD_STEPS } from "./WizardContext";

export function DraftsList() {
  const { data: drafts, isLoading } = useSeasonDrafts();
  const deleteDraft = useDeleteDraft();

  if (isLoading) {
    return null;
  }

  if (!drafts || drafts.length === 0) {
    return null;
  }

  const handleDelete = async (id: string) => {
    await deleteDraft.mutateAsync(id);
  };

  const getStepLabel = (stepNumber: number) => {
    const step = WIZARD_STEPS[stepNumber - 1];
    return step ? step.label : `Step ${stepNumber}`;
  };

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-lg">Bozze in sospeso</CardTitle>
        </div>
        <CardDescription>
          Hai {drafts.length} {drafts.length === 1 ? "bozza" : "bozze"} non completate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-center justify-between p-3 bg-background rounded-lg border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {draft.name || "Bozza senza nome"}
                  </span>
                  {draft.season_id && (
                    <Badge variant="outline" className="text-xs">
                      <Pencil className="h-3 w-3 mr-1" />
                      Modifica
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>Step: {getStepLabel(draft.current_step)}</span>
                  <span>·</span>
                  <span>
                    {formatDistanceToNow(new Date(draft.updated_at), {
                      addSuffix: true,
                      locale: it,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Link to={`/admin/seasons/wizard/${draft.id}`}>
                  <Button variant="default" size="sm">
                    Continua
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Elimina bozza</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sei sicuro di voler eliminare la bozza "{draft.name || "Bozza senza nome"}"?
                        Questa azione non può essere annullata.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(draft.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteDraft.isPending}
                      >
                        {deleteDraft.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Elimina
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
