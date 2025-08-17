import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Link } from "react-router-dom";
import { useMatches, useDeleteMatch, useUpdateMultipleMatches, useDeleteMultipleMatches } from "@/hooks/use-matches";
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons } from "@/hooks/use-seasons";
import { useVenues } from "@/hooks/use-venues";
import { useTeams } from "@/hooks/use-teams";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus, Edit, Trash2, Upload, ChevronDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { BulkEditDialog } from "@/components/admin/BulkEditDialog";
import { showSuccess } from "@/utils/toast";

const FixturesAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [dialogState, setDialogState] = useState<{ open: boolean; type: 'status' | 'competition' | 'season' | 'venue' | 'referee' | null }>({ open: false, type: null });

  const { data: matches, isLoading, error } = useMatches();
  const { data: competitions } = useCompetitions();
  const { data: seasons } = useSeasons();
  const { data: venues } = useVenues();
  const { data: teams } = useTeams();

  const deleteMatchMutation = useDeleteMatch();
  const updateMultipleMutation = useUpdateMultipleMatches();
  const deleteMultipleMutation = useDeleteMultipleMatches();

  const filteredMatches = useMemo(() => {
    if (!matches || !searchTerm) return matches;
    
    return matches.filter(match => 
      match.home_teams.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.away_teams.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.venues?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  const isAllSelected = filteredMatches && selectedMatches.length === filteredMatches.length && filteredMatches.length > 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMatches(filteredMatches?.map(m => m.id) || []);
    } else {
      setSelectedMatches([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedMatches(prev => [...prev, id]);
    } else {
      setSelectedMatches(prev => prev.filter(matchId => matchId !== id));
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    await deleteMatchMutation.mutateAsync(matchId);
  };

  const handleBulkUpdate = (value: string) => {
    if (!dialogState.type) return;

    const key = dialogState.type === 'status' ? 'status' : `${dialogState.type}_id`;
    const updates = { [key]: value };

    updateMultipleMutation.mutate({ ids: selectedMatches, updates }, {
        onSuccess: () => {
            showSuccess('Partite aggiornate con successo!');
            setSelectedMatches([]);
            setDialogState({ open: false, type: null });
        }
    });
  };

  const handleBulkDelete = () => {
    deleteMultipleMutation.mutate(selectedMatches, {
        onSuccess: () => {
            showSuccess('Partite eliminate con successo!');
            setSelectedMatches([]);
        }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="outline">Programmata</Badge>;
      case 'ongoing': return <Badge variant="default" className="bg-green-600">In corso</Badge>;
      case 'completed': return <Badge variant="secondary">Completata</Badge>;
      case 'postponed': return <Badge variant="destructive">Rinviata</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancellata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns = [
    { 
      key: "select", 
      label: <Checkbox checked={isAllSelected} onCheckedChange={(checked) => handleSelectAll(checked as boolean)} aria-label="Select all" />
    },
    { key: "match", label: "Partita" },
    { key: "date", label: "Data" },
    { key: "status", label: "Stato" },
    { key: "actions", label: "Azioni" },
  ];

  const data = filteredMatches?.map(match => ({
    select: <Checkbox checked={selectedMatches.includes(match.id)} onCheckedChange={(checked) => handleSelectRow(match.id, checked as boolean)} aria-label={`Select match ${match.id}`} />,
    match: <Link to={`/admin/fixtures/${match.id}`} className="text-primary underline hover:text-primary/80">{match.home_teams.name} vs {match.away_teams.name}</Link>,
    date: format(new Date(match.match_date), "dd/MM/yyyy HH:mm", { locale: it }),
    status: getStatusBadge(match.status),
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/fixtures/${match.id}/edit`}><Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button></Link>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Elimina partita</AlertDialogTitle><AlertDialogDescription>Sei sicuro di voler eliminare la partita "{match.home_teams.name} vs {match.away_teams.name}"? Questa azione non può essere annullata.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteMatch(match.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMatchMutation.isPending}>
                {deleteMatchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
  })) || [];

  const statusOptions = [
    { value: 'scheduled', label: 'Programmata' }, { value: 'ongoing', label: 'In corso' }, { value: 'completed', label: 'Completata' }, { value: 'postponed', label: 'Rinviata' }, { value: 'cancelled', label: 'Cancellata' },
  ];
  const competitionOptions = competitions?.map(c => ({ value: c.id, label: c.name })) || [];
  const seasonOptions = seasons?.map(s => ({ value: s.id, label: s.name })) || [];
  const venueOptions = venues?.map(v => ({ value: v.id, label: v.name })) || [];
  const refereeOptions = teams?.map(t => ({ value: t.id, label: t.name })) || [];

  const dialogConfig = {
    status: { title: 'Modifica Stato', description: `Seleziona il nuovo stato per le ${selectedMatches.length} partite selezionate.`, label: 'Nuovo Stato', options: statusOptions },
    competition: { title: 'Assegna Competizione', description: `Seleziona la competizione per le ${selectedMatches.length} partite selezionate.`, label: 'Competizione', options: competitionOptions },
    season: { title: 'Assegna Stagione', description: `Seleziona la stagione per le ${selectedMatches.length} partite selezionate.`, label: 'Stagione', options: seasonOptions },
    venue: { title: 'Assegna Campo', description: `Seleziona il campo per le ${selectedMatches.length} partite selezionate.`, label: 'Campo', options: venueOptions },
    referee: { title: 'Assegna Arbitro', description: `Seleziona la squadra arbitro per le ${selectedMatches.length} partite selezionate.`, label: 'Arbitro', options: refereeOptions },
  };
  const currentDialog = dialogState.type ? dialogConfig[dialogState.type] : null;

  if (error) return <AdminLayout><div className="text-center py-12"><p className="text-red-600 mb-4">Errore nel caricamento delle partite</p><p className="text-muted-foreground">{error.message}</p></div></AdminLayout>;

  return (
    <AdminLayout>
      <AlertDialog>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Calendario Partite</h1>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Link to="/admin/fixtures/import" className="w-full"><Button variant="outline" className="w-full"><Upload className="mr-2 h-4 w-4" />Importa</Button></Link>
            <Link to="/admin/fixtures/new/bulk" className="w-full"><Button variant="outline" className="w-full"><Plus className="mr-2 h-4 w-4" />Multiplo</Button></Link>
            <Link to="/admin/fixtures/new" className="w-full"><Button className="w-full"><Plus className="mr-2 h-4 w-4" />Nuova partita</Button></Link>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Cerca partite..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        {selectedMatches.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-6">
            <div className="text-sm font-medium">{selectedMatches.length} partit{selectedMatches.length === 1 ? 'a' : 'e'} selezionat{selectedMatches.length === 1 ? 'a' : 'e'}</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Azioni di gruppo <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDialogState({ open: true, type: 'status' })}>Modifica Stato</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogState({ open: true, type: 'competition' })}>Assegna Competizione</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogState({ open: true, type: 'season' })}>Assegna Stagione</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogState({ open: true, type: 'venue' })}>Assegna Campo</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogState({ open: true, type: 'referee' })}>Assegna Arbitro</DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive focus:text-destructive">Elimina Selezionate</DropdownMenuItem></AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {isLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : <Table columns={columns} data={data} />}

        <BulkEditDialog
          open={dialogState.open && !!currentDialog}
          onOpenChange={(open) => setDialogState({ ...dialogState, open })}
          title={currentDialog?.title || ''}
          description={currentDialog?.description || ''}
          label={currentDialog?.label || ''}
          options={currentDialog?.options || []}
          isPending={updateMultipleMutation.isPending}
          onConfirm={handleBulkUpdate}
        />
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Elimina partite selezionate</AlertDialogTitle><AlertDialogDescription>Sei sicuro di voler eliminare {selectedMatches.length} partit{selectedMatches.length === 1 ? 'a' : 'e'}? Questa azione non può essere annullata.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMultipleMutation.isPending}>
              {deleteMultipleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default FixturesAdmin;