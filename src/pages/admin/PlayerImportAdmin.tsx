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
import { useCreateMultiplePlayers } from "@/hooks/use-players";
import * as XLSX from "xlsx";
import { Loader2, Upload, FileCheck2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { CreatePlayerData } from "@/hooks/use-players";

const steps = [
  { label: "Carica File" },
  { label: "Mappa Colonne" },
  { label: "Anteprima e Importa" },
];

const REQUIRED_FIELDS = [
  { id: 'first_name', label: 'Nome' },
  { id: 'last_name', label: 'Cognome' },
  { id: 'team_name', label: 'Nome Squadra' },
  { id: 'date_of_birth', label: 'Data di Nascita (Opzionale)' },
  { id: 'role', label: 'Ruolo (Opzionale)' },
  { id: 'jersey_number', label: 'Numero Maglia (Opzionale)' },
  { id: 'nationality', label: 'Nazionalità (Opzionale)' },
  { id: 'document_id', label: 'ID Documento (Opzionale)' },
];

type ExcelRow = Record<string, string | number | undefined>;

type PreviewRow = {
  original: ExcelRow;
  isValid: boolean;
  errors: string[];
  data: CreatePlayerData | null;
};

const parseDate = (dateInput: string | number | Date | null | undefined): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    
    // Prova a parsare come numero di serie di Excel
    if (typeof dateInput === 'number') {
        return new Date(Math.round((dateInput - 25569) * 86400 * 1000));
    }

    // Prova a parsare come stringa
    if (typeof dateInput === 'string') {
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) return date;
    }

    return null;
};

const PlayerImportAdmin = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ExcelRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  const { data: teams, isLoading: teamsLoading } = useTeams();
  const createMultiplePlayersMutation = useCreateMultiplePlayers();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook: XLSX.WorkBook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });

        if (jsonData.length === 0) {
          showError("Il file è vuoto o non contiene dati validi.");
          return;
        }

        const fileHeaders = Object.keys(jsonData[0] as ExcelRow);
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

    const processedData = rows.map(row => {
      const previewRow: PreviewRow = { original: row, isValid: true, errors: [], data: null };
      
      const firstName = row[mapping.first_name]?.toString().trim();
      const lastName = row[mapping.last_name]?.toString().trim();
      const teamName = row[mapping.team_name]?.toString().trim().toLowerCase();
      const teamId = teamsMap.get(teamName);

      if (!firstName) {
        previewRow.isValid = false;
        previewRow.errors.push("Il nome è obbligatorio.");
      }
      if (!lastName) {
        previewRow.isValid = false;
        previewRow.errors.push("Il cognome è obbligatorio.");
      }
      if (!teamId) {
        previewRow.isValid = false;
        previewRow.errors.push(`Squadra non trovata: "${row[mapping.team_name]}"`);
      }

      const dateOfBirth = parseDate(row[mapping.date_of_birth]);
      const jerseyNumber = parseInt(row[mapping.jersey_number], 10);

      if (previewRow.isValid) {
        previewRow.data = {
          first_name: firstName,
          last_name: lastName,
          team_id: teamId,
          date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
          role: row[mapping.role]?.toString() || null,
          jersey_number: !isNaN(jerseyNumber) ? jerseyNumber : null,
          nationality: row[mapping.nationality]?.toString() || null,
          document_id: row[mapping.document_id]?.toString() || null,
        };
      }
      return previewRow;
    });

    setPreviewData(processedData);
    setCurrentStep(2);
  };

  const handleImport = async () => {
    const validPlayers = previewData.filter(p => p.isValid && p.data).map(p => p.data!);
    if (validPlayers.length === 0) {
      showError("Nessun giocatore valido da importare.");
      return;
    }
    await createMultiplePlayersMutation.mutateAsync(validPlayers, {
      onSuccess: () => {
        showSuccess(`${validPlayers.length} giocatori importati con successo!`);
        navigate("/admin/players");
      }
    });
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Importa Giocatori da File</h1>
      <div className="mb-12">
        <Stepper steps={steps} currentStep={currentStep} />
      </div>

      {currentStep === 0 && (
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>1. Carica il tuo file</CardTitle>
            <CardDescription>Seleziona un file .xlsx o .csv contenente i dati dei giocatori.</CardDescription>
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
            <CardDescription>Associa le colonne del tuo file ai campi richiesti.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {REQUIRED_FIELDS.map(field => (
              <div key={field.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
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
              <Button onClick={handleMappingSubmit} disabled={teamsLoading}>
                {teamsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                      <TableCell>{row.original[mapping.first_name]}</TableCell>
                      <TableCell>{row.original[mapping.last_name]}</TableCell>
                      <TableCell>{row.original[mapping.team_name]}</TableCell>
                      <TableCell>{row.data?.date_of_birth || '-'}</TableCell>
                      <TableCell>{row.original[mapping.role] || '-'}</TableCell>
                      <TableCell>{row.original[mapping.jersey_number] || '-'}</TableCell>
                      <TableCell>{row.original[mapping.nationality] || '-'}</TableCell>
                      <TableCell>{row.original[mapping.document_id] || '-'}</TableCell>
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
              <Button onClick={handleImport} disabled={createMultiplePlayersMutation.isPending}>
                {createMultiplePlayersMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <FileCheck2 className="mr-2 h-4 w-4" />
                Importa {previewData.filter(r => r.isValid).length} Giocatori Validi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
};

export default PlayerImportAdmin;