import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Widget } from '@/hooks/use-homepage-layout';
import { usePinnedArticles } from '@/hooks/use-articles';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const pinnedArticleSchema = z.object({
  articleId: z.string().min(1, "È obbligatorio selezionare un articolo"),
});

type PinnedArticleFormData = z.infer<typeof pinnedArticleSchema>;

interface PinnedArticleWidgetFormProps {
  widget: Widget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}

export const PinnedArticleWidgetForm = ({ widget, open, onOpenChange, onSave, isSaving }: PinnedArticleWidgetFormProps) => {
  const { data: pinnedArticles, isLoading: articlesLoading } = usePinnedArticles();
  const { control, handleSubmit, formState: { errors }, reset } = useForm<PinnedArticleFormData>({
    resolver: zodResolver(pinnedArticleSchema),
  });

  useEffect(() => {
    if (widget?.settings) {
      reset(widget.settings);
    } else {
      reset({ articleId: '' });
    }
  }, [widget, reset]);

  const onSubmit = (data: PinnedArticleFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica Widget Articolo in Evidenza</DialogTitle>
          <DialogDescription>Seleziona quale articolo fissato mostrare in questo widget.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="articleId">Articolo Fissato</Label>
            <Controller
              name="articleId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={articlesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={articlesLoading ? "Caricamento..." : "Seleziona un articolo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {pinnedArticles && pinnedArticles.length > 0 ? (
                      pinnedArticles.map(article => (
                        <SelectItem key={article.id} value={article.id}>{article.title}</SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">Nessun articolo fissato trovato.</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.articleId && <p className="text-sm text-destructive mt-1">{errors.articleId.message}</p>}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salva Modifiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};