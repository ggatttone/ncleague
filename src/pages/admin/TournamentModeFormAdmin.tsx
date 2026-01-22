import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateTournamentMode, useUpdateTournamentMode, useTournamentMode } from "@/hooks/use-tournament-modes";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trophy, Swords, Users, Shuffle, Award, CheckCircle2 } from "lucide-react";
import { showError } from "@/utils/toast";
import { TournamentSettingsForm } from "@/components/admin/tournament-settings";
import { getAllHandlerMetadata, getDefaultSettings } from "@/lib/tournament/handler-registry";
import type { TournamentHandlerKey, TournamentHandlerMetadata } from "@/types/tournament-handlers";
import type { TournamentModeSettings } from "@/types/tournament-settings";
import { cn } from "@/lib/utils";

// Import handler to register it
import "@/lib/tournament/handlers/league-only";

const tournamentModeSchema = z.object({
  name: z.string().min(1, "tournament.validation.nameRequired"),
  description: z.string().optional(),
  handler_key: z.string().min(1, "tournament.validation.handlerRequired"),
});

type TournamentModeFormData = z.infer<typeof tournamentModeSchema>;

// Icon mapping for handlers
const HANDLER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  league_only: Trophy,
  knockout: Swords,
  groups_knockout: Users,
  swiss_system: Shuffle,
  round_robin_final: Award,
};

// Handler card component
function HandlerCard({
  metadata,
  selected,
  onClick,
  disabled,
}: {
  metadata: TournamentHandlerMetadata;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const Icon = HANDLER_ICONS[metadata.key] || Trophy;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50",
        selected && "border-primary bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Icon className="h-6 w-6 text-primary" />
          {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
        </div>
        <CardTitle className="text-base">{t(metadata.nameKey)}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">
          {t(metadata.descriptionKey)}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

const TournamentModeFormAdmin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: mode, isLoading: modeLoading } = useTournamentMode(id);
  const createMutation = useCreateTournamentMode();
  const updateMutation = useUpdateTournamentMode();

  // Local state for typed settings
  const [settings, setSettings] = useState<TournamentModeSettings | null>(null);

  // Get all available handlers
  const handlers = useMemo(() => getAllHandlerMetadata(), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue,
  } = useForm<TournamentModeFormData>({
    resolver: zodResolver(tournamentModeSchema),
    defaultValues: {
      handler_key: "",
    },
  });

  const selectedHandlerKey = watch("handler_key");

  // Initialize settings when handler changes
  useEffect(() => {
    if (selectedHandlerKey && !settings) {
      const defaultSettings = getDefaultSettings(selectedHandlerKey as TournamentHandlerKey);
      setSettings(defaultSettings);
    }
  }, [selectedHandlerKey, settings]);

  // Load existing mode data
  useEffect(() => {
    if (mode && isEdit) {
      reset({
        name: mode.name,
        description: mode.description || "",
        handler_key: mode.handler_key,
      });
      if (mode.settings) {
        setSettings(mode.settings as TournamentModeSettings);
      }
    }
  }, [mode, isEdit, reset]);

  // Handle handler selection
  const handleHandlerSelect = (handlerKey: string) => {
    setValue("handler_key", handlerKey);
    // Reset settings to defaults for new handler
    const defaultSettings = getDefaultSettings(handlerKey as TournamentHandlerKey);
    setSettings(defaultSettings);
  };

  const onSubmit = async (data: TournamentModeFormData) => {
    try {
      const submissionData = {
        ...data,
        settings: settings || undefined,
      };

      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, ...submissionData });
      } else {
        await createMutation.mutateAsync(submissionData);
      }
      navigate("/admin/tournament-modes");
    } catch (error) {
      showError(t("common.error"));
    }
  };

  if (modeLoading && isEdit) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit
              ? t("admin.tournamentModes.editTitle")
              : t("admin.tournamentModes.createTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("admin.tournamentModes.formDescription")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.tournamentModes.basicInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input id="name" {...register("name")} autoFocus />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {t(errors.name.message || "")}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">{t("common.description")}</Label>
                <Textarea id="description" {...register("description")} rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Handler Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.tournamentModes.selectFormat")}</CardTitle>
              <CardDescription>
                {t("admin.tournamentModes.selectFormatDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                name="handler_key"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {handlers.map((handler) => (
                      <HandlerCard
                        key={handler.key}
                        metadata={handler}
                        selected={field.value === handler.key}
                        onClick={() => handleHandlerSelect(handler.key)}
                      />
                    ))}
                  </div>
                )}
              />
              {errors.handler_key && (
                <p className="text-sm text-destructive mt-2">
                  {t(errors.handler_key.message || "")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Handler-specific Settings */}
          {selectedHandlerKey && (
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.tournamentModes.settings")}</CardTitle>
                <CardDescription>
                  {t("admin.tournamentModes.settingsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TournamentSettingsForm
                  handlerKey={selectedHandlerKey}
                  value={settings}
                  onChange={setSettings}
                />
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/admin/tournament-modes")}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending ||
                !selectedHandlerKey
              }
            >
              {(isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? t("common.saveChanges") : t("common.create")}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default TournamentModeFormAdmin;
