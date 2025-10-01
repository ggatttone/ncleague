import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useLeagueTable } from '@/hooks/use-league-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LiveStandings = ({ competitionId, seasonId }: { competitionId?: string; seasonId?: string }) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: tableData, isLoading, isError } = useLeagueTable(competitionId, seasonId);

  useEffect(() => {
    if (!competitionId || !seasonId) return;

    const channel = supabase
      .channel(`public:matches:season_id=eq.${seasonId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `season_id=eq.${seasonId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['league-table', competitionId, seasonId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [competitionId, seasonId, queryClient]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (isError || !tableData) {
    return <div className="text-center text-destructive py-8">{t('errors.loadingTables')}</div>;
  }

  if (tableData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">{t('components.leagueTableWidget.noData')}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px] text-center">{t('pages.tables.pos')}</TableHead>
          <TableHead>{t('pages.tables.team')}</TableHead>
          <TableHead className="text-center">{t('pages.tables.mp')}</TableHead>
          <TableHead className="text-center">{t('pages.tables.w')}</TableHead>
          <TableHead className="text-center">{t('pages.tables.d')}</TableHead>
          <TableHead className="text-center">{t('pages.tables.l')}</TableHead>
          <TableHead className="text-center">{t('pages.tables.gd')}</TableHead>
          <TableHead className="text-center">{t('pages.tables.pts')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableData.map((row, index) => (
          <TableRow key={row.team_id}>
            <TableCell className="font-bold text-center">{index + 1}</TableCell>
            <TableCell>
              <Link to={`/teams/${row.team_id}`} className="flex items-center gap-3 hover:underline">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={row.team_logo_url || undefined} alt={row.team_name} />
                  <AvatarFallback>{row.team_name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{row.team_name}</span>
              </Link>
            </TableCell>
            <TableCell className="text-center">{row.matches_played}</TableCell>
            <TableCell className="text-center">{row.wins}</TableCell>
            <TableCell className="text-center">{row.draws}</TableCell>
            <TableCell className="text-center">{row.losses}</TableCell>
            <TableCell className="text-center">{row.goal_difference}</TableCell>
            <TableCell className="font-bold text-center">{row.points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};