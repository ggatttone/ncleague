import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { useLeagueTable } from "@/hooks/use-league-table";
import { supabase } from "@/lib/supabase/client";
import { Competition, Season } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const LeagueTableWidget = () => {
  // Fetch the main competition (assuming level 1 is the main one)
  const { data: competition, isLoading: competitionLoading } = useSupabaseQuery<Competition>(
    ['main-competition'],
    async () => supabase.from('competitions').select('*').order('level').limit(1).single()
  );

  // Fetch the latest season
  const { data: season, isLoading: seasonLoading } = useSupabaseQuery<Season>(
    ['latest-season'],
    async () => supabase.from('seasons').select('*').order('start_date', { ascending: false }).limit(1).single()
  );

  const { data: tableData, isLoading: tableLoading } = useLeagueTable(competition?.id, season?.id);

  const isLoading = competitionLoading || seasonLoading || tableLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classifica</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !tableData || tableData.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Classifica non ancora disponibile.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">Pos</TableHead>
                <TableHead>Squadra</TableHead>
                <TableHead className="text-right">PT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.slice(0, 5).map((row, index) => (
                <TableRow key={row.team_id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={row.team_logo_url || undefined} alt={row.team_name} />
                        <AvatarFallback>{row.team_name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{row.team_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">{row.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="mt-6 text-center">
          <Button asChild variant="outline" size="sm">
            <Link to="/tables">Vedi classifica completa</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};