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
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DeleteConfirmDialogProps {
  title?: string;
  description?: string;
  onConfirm: () => void;
  isPending?: boolean;
  triggerSize?: "default" | "sm" | "icon";
  triggerVariant?: "ghost" | "outline" | "destructive";
}

export const DeleteConfirmDialog = ({
  title,
  description,
  onConfirm,
  isPending = false,
  triggerSize = "sm",
  triggerVariant = "ghost",
}: DeleteConfirmDialogProps) => {
  const { t } = useTranslation();

  const defaultTitle = t('common.deleteDialog.title', 'Conferma eliminazione');
  const defaultDescription = t('common.deleteDialog.description', 'Questa azione non può essere annullata. Sei sicuro di voler procedere?');

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || defaultTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t('common.cancel', 'Annulla')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.delete', 'Elimina')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
