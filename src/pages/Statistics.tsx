import { MainLayout } from "@/components/MainLayout";
import { useState } from "react";
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons } from "@/hooks/use-seasons";
import { useTopScorers } from "@/hooks/use-statistics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const Statistics = () => {
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const { t } = useTranslation();

  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();
  const { data: topScorers, isLoading: topScorersLoading, isError } = useTopScorers(selectedCompetition, selectedSeason);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('pages.statistics.title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-4 border rounded-lg bg-card">
          <div>
            <label htmlFor="competition-select" className="block text-sm font-medium text-muted-foreground mb-1">
              {t('pages.statistics.competition')}
            </label>
            <Select
              value={selectedCompetition}
              onValueChange={setSelectedCompetition}
              disabled={competitionsLoading}
            >
              <SelectTrigger id="competition-select">
                <SelectValue placeholder={t('pages.statistics.selectCompetition')} />
              </SelectTrigger>
              <SelectContent>
                {competitions?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="season-select" className="block text-sm font-medium text-muted-foreground mb-1">
              {t('pages.statistics.season')}
            </label>
            <Select
              value={selectedSeason}
              onValueChange={setSelectedSeason}
              disabled={seasonsLoading}
            >
              <SelectTrigger id="season-select">
                <SelectValue placeholder={t('pages.statistics.selectSeason')} />
              </SelectTrigger>
              <SelectContent>
                {seasons?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {topScorersLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!topScorersLoading && selectedCompetition && selectedSeason && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('pages.statistics.topScorers')}</h2>
            {isError ? (
              <p className="text-center text-destructive">{t('pages.statistics.errorLoading')}</p>
            ) : topScorers && topScorers.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">{t('pages.statistics.pos')}</TableHead>
                      <TableHead>{t('pages.statistics.player')}</TableHead>
                      <TableHead>{t('pages.statistics.team')}</TableHead>
                      <TableHead className="w-24 text-center">{t('pages.statistics.goals')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topScorers.map((scorer) => (
                      <TableRow key={scorer.player_id}>
                        <TableCell className="font-medium text-center">{scorer.rank}</TableCell>
                        <TableCell>{`${scorer.first_name} ${scorer.last_name}`}</TableCell>
                        <TableCell>{scorer.team_name}</TableCell>
                        <TableCell className="font-bold text-center">{scorer.goals_scored}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t('pages.statistics.noData')}</p>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Statistics;