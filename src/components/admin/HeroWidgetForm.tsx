import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { HomepageWidget } from '@/hooks/use-homepage-layout';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const heroSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio"),
  subtitle: z.string().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
});

type HeroFormData = z.infer<typeof heroSchema>;

interface HeroWidgetFormProps {
  widget: HomepageWidget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}

export const HeroWidgetForm = ({ widget, open, onOpenChange, onSave, isSaving }: HeroWidgetFormProps) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<HeroFormData>({
    resolver: zodResolver(heroSchema),
  });

  useEffect(() => {
    if (widget?.settings) {
      reset(widget.settings);
    } else {
      reset({
        title: "Benvenuti su NC League",
        subtitle: "La piattaforma per la tua lega di calcetto: risultati, classifiche, statistiche e news!",
        buttonText: "Scopri l'ultima giornata",
        buttonLink: "/matches",
      });
    }
  }, [widget, reset]);

  const onSubmit = (data: HeroFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica Widget Hero</DialogTitle>
          <DialogDescription>Personalizza i testi e il pulsante della sezione principale.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Titolo Principale</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="subtitle">Sottotitolo</Label>
            <Textarea id="subtitle" {...register("subtitle")} />
          </div>
          <div>
            <Label htmlFor="buttonText">Testo Pulsante</Label>
            <Input id="buttonText" {...register("buttonText")} />
          </div>
           <div>
            <Label htmlFor="buttonLink">Link Pulsante</Label>
            <Input id="buttonLink" {...register("buttonLink")} placeholder="/matches" />
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