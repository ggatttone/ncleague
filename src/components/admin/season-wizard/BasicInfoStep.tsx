import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Save, X } from "lucide-react";
import { useWizard } from "./WizardContext";

const basicInfoSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

export function BasicInfoStep() {
  const navigate = useNavigate();
  const { formData, setStepData, nextStep, saveAndExit, isSaving } = useWizard();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: formData.basicInfo,
  });

  // Ref to skip watchedFields effect after a context sync
  const skipNextWatchUpdate = useRef(true); // Start true to skip initial render

  // Sync form with context data
  useEffect(() => {
    skipNextWatchUpdate.current = true;
    reset(formData.basicInfo);
  }, [formData.basicInfo, reset]);

  // Update context on field changes via subscription
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (!name) return; // skip reset events
      if (skipNextWatchUpdate.current) {
        skipNextWatchUpdate.current = false;
        return;
      }

      const { name: n, start_date, end_date } = value;
      if (
        n !== formData.basicInfo.name ||
        (start_date || "") !== formData.basicInfo.start_date ||
        (end_date || "") !== formData.basicInfo.end_date
      ) {
        setStepData("basicInfo", {
          name: n || "",
          start_date: start_date || "",
          end_date: end_date || "",
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, formData.basicInfo, setStepData]);

  const onSubmit = async () => {
    await nextStep();
  };

  const handleCancel = () => {
    navigate("/admin/seasons");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informazioni Base</CardTitle>
        <CardDescription>
          Inserisci il nome e le date della nuova stagione
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Stagione *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="es. Stagione 2024/2025"
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Data Inizio</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                />
              </div>
              <div>
                <Label htmlFor="end_date">Data Fine</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register("end_date")}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 justify-between pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="mr-2 h-4 w-4" />
              Annulla
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={saveAndExit}
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                Salva e Esci
              </Button>
              <Button type="submit" disabled={isSaving}>
                Avanti
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
