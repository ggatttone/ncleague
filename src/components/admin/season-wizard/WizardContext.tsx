import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSeasonDraft, useCreateDraft, useUpdateDraft, useDeleteDraft } from "@/hooks/use-season-drafts";
import { useCreateSeason } from "@/hooks/use-seasons";
import { useCreateTournamentMode, useUpdateTournamentMode } from "@/hooks/use-tournament-modes";
import { SeasonDraftData, Season } from "@/types/database";
import { showSuccess, showError } from "@/utils/toast";

export const WIZARD_STEPS = [
  { key: "basicInfo", label: "Informazioni" },
  { key: "teams", label: "Squadre" },
  { key: "tournament", label: "Formato" },
  { key: "confirm", label: "Conferma" },
] as const;

export type WizardStepKey = typeof WIZARD_STEPS[number]["key"];

const getEmptyDraftData = (): SeasonDraftData => ({
  basicInfo: { name: "", start_date: "", end_date: "" },
  teams: { team_ids: [] },
  tournament: { tournament_mode_id: "", use_custom_settings: false },
  completedSteps: [],
  lastModified: new Date().toISOString(),
});

interface WizardContextValue {
  currentStep: number;
  draftId: string | null;
  formData: SeasonDraftData;
  lastSaved: Date | null;
  isSaving: boolean;
  isLoading: boolean;
  isPublishing: boolean;
  createdSeason: Season | null;
  setStepData: <K extends WizardStepKey>(step: K, data: SeasonDraftData[K]) => void;
  nextStep: () => Promise<void>;
  prevStep: () => void;
  saveAndExit: () => Promise<void>;
  goToStep: (step: number) => void;
  publishDraft: () => Promise<void>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}

interface WizardProviderProps {
  children: ReactNode;
}

export function WizardProvider({ children }: WizardProviderProps) {
  const navigate = useNavigate();
  const { draftId: urlDraftId } = useParams<{ draftId?: string }>();

  const [currentStep, setCurrentStep] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(urlDraftId || null);
  const [formData, setFormData] = useState<SeasonDraftData>(getEmptyDraftData());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { data: existingDraft, isLoading: draftLoading } = useSeasonDraft(draftId || undefined);
  const createDraft = useCreateDraft();
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();
  const createSeason = useCreateSeason();

  const [isPublishing, setIsPublishing] = useState(false);
  const [createdSeason, setCreatedSeason] = useState<Season | null>(null);

  const isSaving = createDraft.isPending || updateDraft.isPending;

  // Debounce timer ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef(false);

  // Load existing draft data
  useEffect(() => {
    if (existingDraft) {
      setFormData(existingDraft.draft_data);
      setCurrentStep(existingDraft.current_step - 1); // DB is 1-indexed
      setLastSaved(new Date(existingDraft.updated_at));
    }
  }, [existingDraft]);

  // Auto-save function
  const saveDraft = useCallback(async (data: SeasonDraftData, step: number) => {
    try {
      if (draftId) {
        await updateDraft.mutateAsync({
          id: draftId,
          name: data.basicInfo.name || "Bozza senza nome",
          current_step: step + 1, // DB is 1-indexed
          draft_data: data,
        });
      } else {
        const result = await createDraft.mutateAsync({
          name: data.basicInfo.name || "Bozza senza nome",
          current_step: step + 1,
          draft_data: data,
        });
        setDraftId(result.id);
        // Update URL with new draftId
        navigate(`/admin/seasons/wizard/${result.id}`, { replace: true });
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save draft:", error);
      showError("Errore nel salvataggio della bozza");
    }
  }, [draftId, createDraft, updateDraft, navigate]);

  // Debounced auto-save
  const debouncedSave = useCallback((data: SeasonDraftData, step: number) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    pendingSaveRef.current = true;

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(data, step);
      pendingSaveRef.current = false;
    }, 1000);
  }, [saveDraft]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const setStepData = useCallback(<K extends WizardStepKey>(step: K, data: SeasonDraftData[K]) => {
    setFormData(prev => {
      const updated = { ...prev, [step]: data };
      debouncedSave(updated, currentStep);
      return updated;
    });
  }, [currentStep, debouncedSave]);

  const nextStep = useCallback(async () => {
    // Cancel pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save immediately on step change
    await saveDraft(formData, currentStep + 1);
    setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  }, [formData, currentStep, saveDraft]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  }, []);

  const saveAndExit = useCallback(async () => {
    // Cancel pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    try {
      await saveDraft(formData, currentStep);
      showSuccess("Bozza salvata");
      navigate("/admin/seasons");
    } catch {
      showError("Errore nel salvataggio");
    }
  }, [formData, currentStep, saveDraft, navigate]);

  const publishDraft = useCallback(async () => {
    // Cancel pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsPublishing(true);

    try {
      // 1. Create the season
      const newSeason = await createSeason.mutateAsync({
        name: formData.basicInfo.name,
        start_date: formData.basicInfo.start_date || undefined,
        end_date: formData.basicInfo.end_date || undefined,
        tournament_mode_id: formData.tournament.tournament_mode_id || undefined,
        team_ids: formData.teams.team_ids,
      });

      // 2. Delete the draft if it exists
      if (draftId) {
        try {
          await deleteDraft.mutateAsync(draftId);
        } catch (deleteError) {
          // Log but don't fail - the season was created successfully
          console.warn("Failed to delete draft:", deleteError);
        }
      }

      // 3. Set created season for success screen
      setCreatedSeason(newSeason);

      showSuccess("Stagione creata con successo!");

      // 4. Navigate to success screen
      navigate(`/admin/seasons/wizard/success/${newSeason.id}`, { replace: true });
    } catch (error) {
      console.error("Failed to create season:", error);
      showError("Errore nella creazione della stagione");
    } finally {
      setIsPublishing(false);
    }
  }, [formData, draftId, createSeason, deleteDraft, navigate]);

  const value: WizardContextValue = {
    currentStep,
    draftId,
    formData,
    lastSaved,
    isSaving,
    isLoading: draftLoading,
    isPublishing,
    createdSeason,
    setStepData,
    nextStep,
    prevStep,
    saveAndExit,
    goToStep,
    publishDraft,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}
