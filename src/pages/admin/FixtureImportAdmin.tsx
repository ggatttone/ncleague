import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Stepper } from "@/components/ui/stepper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTeams } from "@/hooks/use-teams";
import { useVenues } from "@/hooks/use-venues";
import { useCreateMultipleMatches } from "@/hooks/use-matches";
import { read, utils, WorkBook } from "xlsx";
import { Loader2, Upload, FileCheck2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";

const steps = [
  { label: "Carica File" },
  { label: "Mappa Colonne" },
  { label: "Anteprima e Importa" },
];

const REQUIRED_FIELDS = [
  { id: 'home_team_name', label: 'Squadra Casa' },
  { id: 'away_team_name', label: 'Squadra Ospite' },
  { id: 'match_date', label: 'Data e Ora Partita' },
  { id: 'home_score', label: 'Punteggio Casa' },
  { id: 'away_score', label: 'Punteggio Ospite' },
  { id: 'venue_name', label: 'Campo (Opzionale)' },
];

type PreviewRow = {
  original: any;
  isValid: boolean;
  errors: string[];
  data: {
    home_team_id: string;
    away_team_id: string;
    match_date: string;
    home_score: number;
    away_score: number;
    venue_id?: string;
    status: 'completed' | 'scheduled';
  } | null;
};

const FixtureImportAdmin = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: venues, isLoading: venuesLoading } = useVenues();
  const createMultipleMatchesMutation = useCreateMultipleMatches();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook: WorkBook = read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet, { raw: false });

        if (jsonData.length === 0) {
          showError("Il file è vuoto o non contiene dati validi.");
          return;
        }

        const fileHeaders = Object.keys(jsonData[0] as any);
        setHeaders(fileHeaders);
        setRows(jsonData);
        setCurrentStep(1);
      } catch (err) {
        showError("Errore nella lettura del file. Assicurati che sia un formato valido (.xlsx, .csv).");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMappingSubmit = () => {
    const teamsMap = new Map(teams?.map(t => [t.name.toLowerCase(), t.id]));
    const venuesMap = new Map(venues?.map(v => [v.name.toLowerCase(), v.id]));

    const processedData = rows.map(row => {
      const previewRow: PreviewRow = { original: row, isValid: true, errors: [], data: null };
      
      const homeTeamName = row[mapping.home_team_name]?.toString().trim().toLowerCase();
      const awayTeamName = row[mapping.away_team_name]?.toString().trim().toLowerCase();
      const homeTeamId = teamsMap.get(homeTeamName);
      const awayTeamId = teamsMap.get(awayTeamName);

      if (!homeTeamId) {
        previewRow.isValid = false;
        previewRow.errors.push(`Squadra casa non trovata: "${row[mapping.home_team_name]}"`);
      }
      if (!awayTeamId) {
        previewRow.isValid = false;
        previewRow.errors.push(`Squadra ospite non trovata: "${row[mapping.away_team_name]}"`);
      }
      if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
        previewRow.isValid = false;
        previewRow.errors.push("Squadra casa e ospite non possono essere le stesse.");
      }

      const dateValue = row[mapping.match_date];
      const matchDate = new Date(dateValue);
      if (!matchDate || isNaN(matchDate.getTime())) {
        previewRow.isValid = false;
        previewRow.errors.push(`Data non valida: "${dateValue}"`);
      }

      const homeScore = parseInt(row[mapping.home_score], 10);
      const awayScore = parseInt(row[mapping.away_score], 10);
      if (isNaN(homeScore) || isNaN(awayScore)) {
        previewRow.isValid = false;
        previewRow.errors.push("Punteggi non validi.");
      }

      let venueId;
      const venueName = row[mapping.venue_name]?.toString().trim().toLowerCase();
      if (venueName) {
        venueId = venuesMap.get(venueName);
        if (!venueId) {
          previewRow.isValid = false;
          previewRow.errors.push(`Campo non trovato: "${row[mapping.venue_name]}"`);
        }
      }

      const status = matchDate && matchDate > new Date() ? 'scheduled' : 'completed';

      if (previewRow.isValid) {
        previewRow.data = {
          home_team_id: homeTeamId!,
          away_team_id: awayTeamId!,
          match_date: matchDate!.toISOString(),
          home_score: homeScore,
          away_score: awayScore,
          venue_id: venueId,
          status: status,
        };
      }
      return previewRow;
    });

    setPreviewData(processedData);
    setCurrentStep(2);
  };

  const handleImport = async () => {
    const validMatches = previewData.filter(p => p.isValid && p.data).map(p => p.data!);
    if (validMatches.length === 0) {
      showError("Nessuna partita valida da importare.");
      return;
    }
    await createMultipleMatchesMutation.mutateAsync(validMatches, {
      onSuccess: () => {
        showSuccess(`${validMatches.length} partite importate con successo!`);
        navigate("/admin/fixtures");
      }
    });
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Importa Partite da File</h1>
      <div className="mb-12">
        <Stepper steps={steps} currentStep={currentStep} />
      </div>

      {currentStep === 0 && (
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>1. Carica il tuo file</CardTitle>
            <CardDescription>Seleziona un file .xlsx o .csv contenente i dati delle partite.</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clicca per caricare</span> o trascina il file</p>
                <p className="text-xs text-muted-foreground">XLSX, XLS, CSV</p>
              </div>
              <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
            </Label>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>2. Mappa le colonne</CardTitle>
            <CardDescription>Associa le colonne del tuo file ai campi richiesti dal sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {REQUIRED_FIELDS.map(field => (
              <div key={field.id} className="grid grid-cols-2 gap-4 items-center">
                <Label>{field.label}</Label>
                <Select onValueChange={(value) => setMapping(prev => ({ ...prev, [field.id]: value }))}>
                  <SelectTrigger><SelectValue placeholder="Seleziona colonna..." /></SelectTrigger>
                  <SelectContent>
                    {headers.map(header => <SelectItem key={header} value={header}>{header}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(0)}>Indietro</Button>
              <Button onClick={handleMappingSubmit} disabled={teamsLoading || venuesLoading}>
                {(teamsLoading || venuesLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Vai all'Anteprima
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Anteprima e Conferma</CardTitle>
            <CardDescription>Controlla i dati. Le righe con errori non verranno importate.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Stato</TableHead>
                    {REQUIRED_FIELDS.map(f => <TableHead key={f.id}>{f.label}</TableHead>)}
                    <TableHead>Errori</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index} className={!row.isValid ? "bg-destructive/10" : ""}>
                      <TableCell>
                        {row.isValid ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
                      </TableCell>
                      <TableCell>{row.original[mapping.home_team_name]}</TableCell>
                      <TableCell>{row.original[mapping.away_team_name]}</TableCell>
                      <TableCell>{new Date(row.data?.match_date || Date.now()).toLocaleString('it-IT')}</TableCell>
                      <TableCell>{row.original[mapping.home_score]}</TableCell>
                      <TableCell>{row.original[mapping.away_score]}</TableCell>
                      <TableCell>{row.original[mapping.venue_name] || '-'}</TableCell>
                      <TableCell>
                        {row.errors.map((e, i) => <div key={i} className="text-xs text-destructive">{e}</div>)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2 pt-6">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>Indietro</Button>
              <Button onClick={handleImport} disabled={createMultipleMatchesMutation.isPending}>
                {createMultipleMatchesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <FileCheck2 className="mr-2 h-4 w-4" />
                Importa {previewData.filter(r => r.isValid).length} Partite Valide
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
};

export default FixtureImportAdmin;