import { MainLayout } from "@/components/MainLayout";
import { Table } from "@/components/Table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons } from "@/hooks/use-seasons";
import { useLeagueTable } from "@/hooks/use-league-table";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getOptimizedImageUrl } from "@/lib/image";

const Tables = () => {
  const { t } = useTranslation();
  const [selectedCompetition, setSelectedCompetition] = useState<string | undefined>();
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>();

  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();
  const { data: tableData, isLoading: tableLoading, error: tableError } = useLeagueTable(selectedCompetition, selectedSeason);

  useEffect(() => {
    if (!competitionsLoading && competitions?.length === 1 && !selectedCompetition) {
      setSelectedCompetition(competitions[0].id);
    }
    if (!seasonsLoading && seasons?.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0].id);
    }
  }, [competitions, seasons, competitionsLoading, seasonsLoading, selectedCompetition, selectedSeason]);

  const columns = [
    { key: "position", label: t('pages.tables.pos') },
    { key: "team", label: t('pages.tables.team') },
    { key: "mp", label: t('pages.tables.mp') },
    { key: "w", label: t('pages.tables.w') },
    { key: "d", label: t('pages.tables.d') },
    { key: "l", label: t('pages.tables.l') },
    { key: "gf", label: t('pages.tables.gf') },
    { key: "ga", label: t('pages.tables.ga') },
    { key: "gd", label: t('pages.tables.gd') },
    { key: "pts", label: t('pages.tables.pts') },
  ];

  const data = tableData?.map((row, index) => ({
    position: <div className="font-bold text-center">{index + 1}</div>,
    team: (
      <Link to={`/teams/${row.team_id}`} className="flex items-center gap-3 hover:underline">
        <Avatar className="h-8 w-8">
          <AvatarImage src={getOptimizedImageUrl(row.team_logo_url, { width: 32, height: 32, resize: 'cover' })} alt={row.team_name} />
          <AvatarFallback>{row.team_name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{row.team_name}</span>
      </Link>
    ),
    mp: <div className="text-center">{row.matches_played}</div>,
    w: <div className="text-center">{row.wins}</div>,
    d: <div className="text-center">{row.draws}</div>,
    l: <div className="text-center">{row.losses}</div>,
    gf: <div className="text-center">{row.goals_for}</div>,
    ga: <div className="text-center">{row.goals_against}</div>,
    gd: <div className="text-center">{row.goal_difference}</div>,
    pts: <div className="font-bold text-center">{row.points}</div>,
  })) || [];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('pages.tables.title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-lg">
          <Select onValueChange={setSelectedCompetition} value={selectedCompetition} disabled={competitionsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={t('pages.tables.selectCompetition')} />
            </SelectTrigger>
            <SelectContent>
              {competitions?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedSeason} value={selectedSeason} disabled={seasonsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={t('pages.tables.selectSeason')} />
            </SelectTrigger>
            <SelectContent>
              {seasons?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {tableLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {tableError && (
          <div className="text-center py-12 bg-destructive/10 text-destructive rounded-lg">
            <p className="font-semibold mb-2">{t('errors.loadingTables')}</p>
            <p className="text-sm">{tableError.message}</p>
          </div>
        )}

        {!tableLoading && !tableError && selectedCompetition && selectedSeason && (
          tableData && tableData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table columns={columns} data={data} />
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">{t('components.leagueTableWidget.noData')}</p>
            </div>
          )
        )}

        {!selectedCompetition || !selectedSeason && !tableLoading && (
           <div className="text-center py-12 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">{t('pages.tables.selectToView')}</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Tables;