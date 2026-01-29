import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventDateConfig } from "@/types/database";
import type { Venue, Team } from "@/types/database";

interface EventDateEntryProps {
  index: number;
  event: EventDateConfig;
  venues: Venue[];
  teams: Team[];
  duration: number;
  breakTime: number;
  onChange: (index: number, event: EventDateConfig) => void;
  onRemove: (index: number) => void;
}

function computeSlots(startTime: string, endTime: string, duration: number, breakTime: number): number {
  if (!startTime || !endTime || duration <= 0) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const windowMinutes = (eh * 60 + em) - (sh * 60 + sm);
  const interval = duration + breakTime;
  if (interval <= 0 || windowMinutes <= 0) return 0;
  return Math.floor(windowMinutes / interval);
}

export function EventDateEntry({ index, event, venues, teams, duration, breakTime, onChange, onRemove }: EventDateEntryProps) {
  const { t } = useTranslation();
  const slotsPerVenue = computeSlots(event.startTime, event.endTime, duration, breakTime);
  const totalSlots = slotsPerVenue * event.venueIds.length;

  const update = (partial: Partial<EventDateConfig>) => {
    onChange(index, { ...event, ...partial });
  };

  const toggleVenue = (venueId: string, checked: boolean) => {
    update({
      venueIds: checked
        ? [...event.venueIds, venueId]
        : event.venueIds.filter(id => id !== venueId),
    });
  };

  const toggleTeam = (teamId: string, checked: boolean) => {
    update({
      teamIds: checked
        ? [...event.teamIds, teamId]
        : event.teamIds.filter(id => id !== teamId),
    });
  };

  const toggleAllTeams = (checked: boolean) => {
    update({ teamIds: checked ? teams.map(t => t.id) : [] });
  };

  const allTeamsSelected = teams.length > 0 && event.teamIds.length === teams.length;

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {t('pages.admin.scheduleGenerator.event', { n: index + 1 })}
          </span>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {/* Date + times */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">{t('pages.admin.scheduleGenerator.eventDate')}</Label>
            <Input type="date" value={event.date} onChange={e => update({ date: e.target.value })} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">{t('pages.admin.scheduleGenerator.eventStart')}</Label>
            <Input type="time" value={event.startTime} onChange={e => update({ startTime: e.target.value })} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">{t('pages.admin.scheduleGenerator.eventEnd')}</Label>
            <Input type="time" value={event.endTime} onChange={e => update({ endTime: e.target.value })} className="h-8 text-sm" />
          </div>
        </div>

        {/* Venues */}
        <div>
          <Label className="text-xs">{t('pages.admin.scheduleGenerator.eventVenues')}</Label>
          <div className="grid grid-cols-2 gap-1 mt-1 max-h-24 overflow-y-auto">
            {venues.map(v => (
              <div key={v.id} className="flex items-center space-x-1.5">
                <Checkbox
                  id={`ev${index}-venue-${v.id}`}
                  checked={event.venueIds.includes(v.id)}
                  onCheckedChange={(c) => toggleVenue(v.id, !!c)}
                />
                <Label htmlFor={`ev${index}-venue-${v.id}`} className="text-xs font-normal">{v.name}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">{t('pages.admin.scheduleGenerator.eventTeams')}</Label>
            <div className="flex items-center space-x-1.5">
              <Checkbox
                id={`ev${index}-all-teams`}
                checked={allTeamsSelected}
                onCheckedChange={(c) => toggleAllTeams(!!c)}
              />
              <Label htmlFor={`ev${index}-all-teams`} className="text-xs font-normal">{t('pages.admin.scheduleGenerator.selectAll')}</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-1 max-h-32 overflow-y-auto">
            {teams.map(t => (
              <div key={t.id} className="flex items-center space-x-1.5">
                <Checkbox
                  id={`ev${index}-team-${t.id}`}
                  checked={event.teamIds.includes(t.id)}
                  onCheckedChange={(c) => toggleTeam(t.id, !!c)}
                />
                <Label htmlFor={`ev${index}-team-${t.id}`} className="text-xs font-normal">{t.name}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Slot count */}
        {slotsPerVenue > 0 && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
            {slotsPerVenue} slot × {event.venueIds.length} = <strong>{totalSlots} slot</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
