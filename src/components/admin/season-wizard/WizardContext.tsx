import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSeasonDraft, useCreateDraft, useUpdateDraft, useDeleteDraft } from "@/hooks/use-season-drafts";
import { useSeason, useCreateSeason, useUpdateSeason } from "@/hooks/use-seasons";
import { useDeleteMultipleMatches } from "@/hooks/use-matches";
import { supabase } from "@/lib/supabase/client";
import { SeasonDraftData, Season } from "@/types/database";
import { showSuccess, showError } from "@/utils/toast";

export type MatchAction = "keep" | "delete";

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
  // Edit mode properties
  isEditMode: boolean;
  editingSeasonId: string | null;
  editingSeasonName: string | null;
  matchAction: MatchAction;
  setMatchAction: (action: MatchAction) => void;
  setStepData: <K extends WizardStepKey>(step: K, data: SeasonDraftData[K]) => void;
  nextStep: () => Promise<void>;
  prevStep: () => void;
  saveAndExit: () => Promise<void>;
  goToStep: (step: number) => void;
  publishDraft: () => Promise<void>;
  discardDraft: () => Promise<void>;
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
  const location = useLocation();
  const { draftId: urlDraftId, seasonId: urlSeasonId } = useParams<{ draftId?: string; seasonId?: string }>();

  // Edit mode detection - check URL or existing draft's season_id
  // We need to check multiple sources because after creating an edit draft,
  // we navigate to /wizard/:draftId which no longer contains /edit in the URL
  const isEditRouteUrl = location.pathname.includes('/edit');
  const editingSeasonIdFromUrl = isEditRouteUrl ? urlSeasonId || null : null;

  const [currentStep, setCurrentStep] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(urlDraftId || null);
  const [formData, setFormData] = useState<SeasonDraftData>(getEmptyDraftData());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [matchAction, setMatchAction] = useState<MatchAction>("keep");
  const [editDraftCreated, setEditDraftCreated] = useState(false);

  const { data: existingDraft, isLoading: draftLoading } = useSeasonDraft(draftId || undefined);
  const { data: existingSeason, isLoading: seasonLoading } = useSeason(editingSeasonIdFromUrl || undefined);
  const createDraft = useCreateDraft();
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();
  const createSeason = useCreateSeason();
  const updateSeason = useUpdateSeason();
  const deleteMatches = useDeleteMultipleMatches();

  const [isPublishing, setIsPublishing] = useState(false);
  const [createdSeason, setCreatedSeason] = useState<Season | null>(null);

  // isEditMode is true if:
  // 1. We're on the /edit URL route, OR
  // 2. We created an edit draft (editDraftCreated), OR
  // 3. The loaded draft has a season_id (it's associated with an existing season)
  const isEditMode = isEditRouteUrl || editDraftCreated || !!existingDraft?.season_id;
  const editingSeasonId = editingSeasonIdFromUrl || existingDraft?.season_id || null;

  const isSaving = createDraft.isPending || updateDraft.isPending;
  const isLoading = draftLoading || (isEditRouteUrl && seasonLoading && !editDraftCreated);

  // Get the name of the season being edited (from URL-loaded season or from draft name)
  const editingSeasonName = existingSeason?.name || (isEditMode ? formData.basicInfo.name : null);

  // Debounce timer ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef(false);

  // Ref to avoid stale currentStep in closures
  const currentStepRef = useRef(currentStep);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);

  // Load existing draft data (for resuming drafts)
  useEffect(() => {
    if (existingDraft) {
      setFormData(existingDraft.draft_data);
      setCurrentStep(existingDraft.current_step - 1); // DB is 1-indexed
      setLastSaved(new Date(existingDraft.updated_at));
    }
  }, [existingDraft]);

  // In edit mode, create a draft from the existing season data
  useEffect(() => {
    if (isEditMode && existingSeason && !draftId && !editDraftCreated) {
      const seasonDraftData: SeasonDraftData = {
        basicInfo: {
          name: existingSeason.name,
          start_date: existingSeason.start_date || "",
          end_date: existingSeason.end_date || "",
        },
        teams: {
          team_ids: existingSeason.teams?.map(t => t.id) || [],
        },
        tournament: {
          tournament_mode_id: existingSeason.tournament_mode_id || "",
          use_custom_settings: false,
        },
        completedSteps: ["basicInfo", "teams", "tournament"],
        lastModified: new Date().toISOString(),
      };

      setFormData(seasonDraftData);
      setEditDraftCreated(true);

      // Create draft in background
      createDraft.mutateAsync({
        name: existingSeason.name,
        current_step: 1,
        draft_data: seasonDraftData,
        season_id: existingSeason.id,
      }).then(result => {
        setDraftId(result.id);
        setLastSaved(new Date());
        // Update URL with draft ID
        navigate(`/admin/seasons/wizard/${result.id}`, { replace: true });
      }).catch(error => {
        console.error("Failed to create edit draft:", error);
        showError("Errore nella creazione della bozza");
      });
    }
  }, [isEditMode, existingSeason, draftId, editDraftCreated, createDraft, navigate]);

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
      debouncedSave(updated, currentStepRef.current);
      return updated;
    });
  }, [debouncedSave]);

  const nextStep = useCallback(async () => {
    // Cancel pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Mark current step as completed
    const stepKey = WIZARD_STEPS[currentStep].key;
    const updatedData = {
      ...formData,
      completedSteps: formData.completedSteps.includes(stepKey)
        ? formData.completedSteps
        : [...formData.completedSteps, stepKey],
      lastModified: new Date().toISOString(),
    };
    setFormData(updatedData);

    // Save immediately on step change
    await saveDraft(updatedData, currentStep + 1);
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
      let resultSeason: Season;

      // Get the season_id from the draft (for edit mode)
      const seasonIdToUpdate = existingDraft?.season_id;

      if (seasonIdToUpdate) {
        // EDIT MODE: Update existing season

        // 1. If matchAction is "delete", delete all matches for this season
        if (matchAction === "delete") {
          const { data: matchIds } = await supabase
            .from('matches')
            .select('id')
            .eq('season_id', seasonIdToUpdate);

          if (matchIds && matchIds.length > 0) {
            await deleteMatches.mutateAsync(matchIds.map(m => m.id));
          }
        }

        // 2. Update the season
        resultSeason = await updateSeason.mutateAsync({
          id: seasonIdToUpdate,
          name: formData.basicInfo.name,
          start_date: formData.basicInfo.start_date || undefined,
          end_date: formData.basicInfo.end_date || undefined,
          tournament_mode_id: formData.tournament.tournament_mode_id || undefined,
          team_ids: formData.teams.team_ids,
        });

        showSuccess("Stagione aggiornata con successo!");
      } else {
        // CREATE MODE: Create new season
        resultSeason = await createSeason.mutateAsync({
          name: formData.basicInfo.name,
          start_date: formData.basicInfo.start_date || undefined,
          end_date: formData.basicInfo.end_date || undefined,
          tournament_mode_id: formData.tournament.tournament_mode_id || undefined,
          team_ids: formData.teams.team_ids,
        });

        showSuccess("Stagione creata con successo!");
      }

      // Delete the draft if it exists
      if (draftId) {
        try {
          await deleteDraft.mutateAsync(draftId);
        } catch (deleteError) {
          // Log but don't fail - the season was created/updated successfully
          console.warn("Failed to delete draft:", deleteError);
        }
      }

      // Set created season for success screen
      setCreatedSeason(resultSeason);

      // Navigate to success screen
      navigate(`/admin/seasons/wizard/success/${resultSeason.id}${seasonIdToUpdate ? '?mode=edit' : ''}`, { replace: true });
    } catch (error) {
      console.error("Failed to save season:", error);
      showError(existingDraft?.season_id ? "Errore nell'aggiornamento della stagione" : "Errore nella creazione della stagione");
    } finally {
      setIsPublishing(false);
    }
  }, [formData, draftId, existingDraft?.season_id, matchAction, createSeason, updateSeason, deleteDraft, deleteMatches, navigate]);

  const discardDraft = useCallback(async () => {
    // Cancel pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    try {
      // Delete the draft if it exists
      if (draftId) {
        await deleteDraft.mutateAsync(draftId);
      }
      navigate("/admin/seasons");
    } catch (error) {
      console.error("Failed to discard draft:", error);
      // Navigate anyway - draft deletion is not critical
      navigate("/admin/seasons");
    }
  }, [draftId, deleteDraft, navigate]);

  const value: WizardContextValue = {
    currentStep,
    draftId,
    formData,
    lastSaved,
    isSaving,
    isLoading,
    isPublishing,
    createdSeason,
    // Edit mode properties
    isEditMode,
    editingSeasonId,
    editingSeasonName,
    matchAction,
    setMatchAction,
    setStepData,
    nextStep,
    prevStep,
    saveAndExit,
    goToStep,
    publishDraft,
    discardDraft,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}
