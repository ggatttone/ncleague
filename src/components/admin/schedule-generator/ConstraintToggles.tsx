import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import type { EventConstraints } from "@/types/database";

interface ConstraintTogglesProps {
  constraints: EventConstraints;
  onChange: (constraints: EventConstraints) => void;
}

export function ConstraintToggles({ constraints, onChange }: ConstraintTogglesProps) {
  const { t } = useTranslation();
  const update = (partial: Partial<EventConstraints>) => {
    onChange({ ...constraints, ...partial });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{t('pages.admin.scheduleGenerator.constraints')}</Label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="ct-avoid" className="text-xs font-normal">{t('pages.admin.scheduleGenerator.avoidRepeats')}</Label>
          <Switch id="ct-avoid" checked={constraints.avoidRepeats} onCheckedChange={v => update({ avoidRepeats: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="ct-balance" className="text-xs font-normal">{t('pages.admin.scheduleGenerator.balanceMatches')}</Label>
          <Switch id="ct-balance" checked={constraints.balanceMatches} onCheckedChange={v => update({ balanceMatches: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="ct-b2b" className="text-xs font-normal">{t('pages.admin.scheduleGenerator.avoidBackToBack')}</Label>
          <Switch id="ct-b2b" checked={constraints.avoidBackToBack} onCheckedChange={v => update({ avoidBackToBack: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="ct-ref" className="text-xs font-normal">{t('pages.admin.scheduleGenerator.autoReferee')}</Label>
          <Switch id="ct-ref" checked={constraints.autoReferee} onCheckedChange={v => update({ autoReferee: v })} />
        </div>
      </div>

      <div>
        <Label htmlFor="ct-target" className="text-xs font-normal">{t('pages.admin.scheduleGenerator.targetMatchesPerTeam')}</Label>
        <Input
          id="ct-target"
          type="number"
          min={1}
          className="h-8 text-sm mt-1"
          value={constraints.targetMatchesPerTeam ?? ''}
          onChange={e => update({ targetMatchesPerTeam: e.target.value ? Number(e.target.value) : undefined })}
          placeholder={t('pages.admin.scheduleGenerator.targetPlaceholder')}
        />
      </div>
    </div>
  );
}
