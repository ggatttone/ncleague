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
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons } from "@/hooks/use-seasons";
import { useCreateMultipleMatches } from "@/hooks/use-matches";
import * as XLSX from "xlsx";
import { Loader2, Upload, FileCheck2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const steps = [
  { label: "Carica File" },
  { label: "Mappa Colonne" },
  { label: "Anteprima e Importa" },
];

type ExcelRow = Record<string, string | number | undefined>;

type PreviewRow = {
  original: ExcelRow;
  isValid: boolean;
  errors: string[];
  data: {
    home_team_id: string;
    away_team_id: string;
    match_date: string;
    home_score: number;
    away_score: number;
    referee_team_id?: string;
    venue_id?: string;
    competition_id?: string;
    season_id?: string;
    status: 'completed' | 'scheduled';
  } | null;
};

const parseItalianDate = (dateString: string): Date => {
  if (typeof dateString !== 'string') return new Date(NaN);

  const parts = dateString.split(' ');
  if (parts.length < 1) return new Date(NaN);

  const dateParts = parts[0].split('/');
  const timeParts = parts.length > 1 ? parts[1].split(':') : ['0', '0'];

  if (dateParts.length !== 3) return new Date(NaN);

  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const year = parseInt(dateParts[2], 10);
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
    return new Date(NaN);
  }

  return new Date(year, month - 1, day, hours, minutes);
};


const FixtureImportAdmin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ExcelRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: venues, isLoading: venuesLoading } = useVenues();
  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();
  const createMultipleMatchesMutation = useCreateMultipleMatches();

  const REQUIRED_FIELDS = [
    { id: 'home_team_name', label: t('pages.admin.fixtureImport.mapping.home_team_name') },
    { id: 'away_team_name', label: t('pages.admin.fixtureImport.mapping.away_team_name') },
    { id: 'match_date', label: t('pages.admin.fixtureImport.mapping.match_date') },
    { id: 'referee_team_name', label: t('pages.admin.fixtureImport.mapping.referee_team_name') },
    { id: 'competition_name', label: t('pages.admin.fixtureImport.mapping.competition_name') },
    { id: 'season_name', label: t('pages.admin.fixtureImport.mapping.season_name') },
    { id: 'home_score', label: t('pages.admin.fixtureImport.mapping.home_score') },
    { id: 'away_score', label: t('pages.admin.fixtureImport.mapping.away_score') },
    { id: 'venue_name', label: t('pages.admin.fixtureImport.mapping.venue_name') },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook: XLSX.WorkBook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'dd/mm/yyyy hh:mm' });

        if (jsonData.length === 0) {
          showError(t('pages.admin.fixtureImport.errors.emptyFile'));
          return;
        }

        const fileHeaders = Object.keys(jsonData[0] as ExcelRow);
        setHeaders(fileHeaders);
        setRows(jsonData);
        setCurrentStep(1);
      } catch (err) {
        showError(t('pages.admin.fixtureImport.errors.readFileError'));
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMappingSubmit = () => {
    const teamsMap = new Map(teams?.map(t => [t.name.toLowerCase(), t.id]));
    const venuesMap = new Map(venues?.map(v => [v.name.toLowerCase(), v.id]));
    const competitionsMap = new Map(competitions?.map(c => [c.name.toLowerCase(), c.id]));
    const seasonsMap = new Map(seasons?.map(s => [s.name.toLowerCase(), s.id]));

    const processedData = rows.map(row => {
      const previewRow: PreviewRow = { original: row, isValid: true, errors: [], data: null };
      
      const homeTeamName = row[mapping.home_team_name]?.toString().trim().toLowerCase();
      const awayTeamName = row[mapping.away_team_name]?.toString().trim().toLowerCase();
      const homeTeamId = teamsMap.get(homeTeamName);
      const awayTeamId = teamsMap.get(awayTeamName);

      if (!homeTeamId) {
        previewRow.isValid = false;
        previewRow.errors.push(t('pages.admin.fixtureImport.errors.homeTeamNotFound', { name: row[mapping.home_team_name] }));
      }
      if (!awayTeamId) {
        previewRow.isValid = false;
        previewRow.errors.push(t('pages.admin.fixtureImport.errors.awayTeamNotFound', { name: row[mapping.away_team_name] }));
      }
      if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
        previewRow.isValid = false;
        previewRow.errors.push(t('pages.admin.fixtureImport.errors.teamsSame'));
      }

      const dateValue = row[mapping.match_date];
      const matchDate = dateValue instanceof Date ? dateValue : parseItalianDate(dateValue);
      
      if (!dateValue || isNaN(matchDate.getTime())) {
        previewRow.isValid = false;
        previewRow.errors.push(t('pages.admin.fixtureImport.errors.invalidDate', { date: row[mapping.match_date] }));
      }

      const status = matchDate && matchDate < new Date() ? 'completed' : 'scheduled';

      const homeScoreRaw = row[mapping.home_score];
      const awayScoreRaw = row[mapping.away_score];
      const homeScore = parseInt(homeScoreRaw, 10);
      const awayScore = parseInt(awayScoreRaw, 10);

      if (status === 'completed') {
        if (homeScoreRaw === undefined || awayScoreRaw === undefined || isNaN(homeScore) || isNaN(awayScore)) {
          previewRow.isValid = false;
          previewRow.errors.push(t('pages.admin.fixtureImport.errors.scoresRequired'));
        }
      }

      let venueId, competitionId, seasonId, refereeTeamId;
      
      const refereeNameRaw = row[mapping.referee_team_name];
      if (refereeNameRaw) {
        const refereeName = refereeNameRaw.toString().trim().toLowerCase();
        refereeTeamId = teamsMap.get(refereeName);
        if (!refereeTeamId) {
          previewRow.isValid = false;
          previewRow.errors.push(t('pages.admin.fixtureImport.errors.refereeNotFound', { name: row[mapping.referee_team_name] }));
        } else if (refereeTeamId === homeTeamId || refereeTeamId === awayTeamId) {
          previewRow.isValid = false;
          previewRow.errors.push(t('pages.admin.fixtureImport.errors.refereeSameAsTeam'));
        }
      }

      const venueNameRaw = row[mapping.venue_name];
      if (venueNameRaw) {
        const venueName = venueNameRaw.toString().trim().toLowerCase();
        venueId = venuesMap.get(venueName);
        if (!venueId) {
          previewRow.isValid = false;
          previewRow.errors.push(t('pages.admin.fixtureImport.errors.venueNotFound', { name: row[mapping.venue_name] }));
        }
      }

      const competitionNameRaw = row[mapping.competition_name];
      if (competitionNameRaw) {
        const competitionName = competitionNameRaw.toString().trim().toLowerCase();
        competitionId = competitionsMap.get(competitionName);
        if (!competitionId) {
          previewRow.isValid = false;
          previewRow.errors.push(t('pages.admin.fixtureImport.errors.competitionNotFound', { name: row[mapping.competition_name] }));
        }
      }

      const seasonNameRaw = row[mapping.season_name];
      if (seasonNameRaw) {
        const seasonName = seasonNameRaw.toString().trim().toLowerCase();
        seasonId = seasonsMap.get(seasonName);
        if (!seasonId) {
          previewRow.isValid = false;
          previewRow.errors.push(t('pages.admin.fixtureImport.errors.seasonNotFound', { name: row[mapping.season_name] }));
        }
      }

      if (previewRow.isValid) {
        previewRow.data = {
          home_team_id: homeTeamId!,
          away_team_id: awayTeamId!,
          match_date: matchDate!.toISOString(),
          home_score: status === 'completed' ? homeScore : 0,
          away_score: status === 'completed' ? awayScore : 0,
          venue_id: venueId,
          competition_id: competitionId,
          season_id: seasonId,
          referee_team_id: refereeTeamId,
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
      showError(t('pages.admin.fixtureImport.errors.noValidMatches'));
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
      <h1 className="text-2xl font-bold mb-6">{t('pages.admin.fixtureImport.title')}</h1>
      <div className="mb-12">
        <Stepper steps={steps.map(s => ({ label: t(s.label, { ns: 'pages.admin.fixtureImport' }) }))} currentStep={currentStep} />
      </div>

      {currentStep === 0 && (
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>{t('pages.admin.fixtureImport.step1Title')}</CardTitle>
            <CardDescription>{t('pages.admin.fixtureImport.step1Description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">{t('pages.admin.fixtureImport.uploadBoxClick')}</span> {t('pages.admin.fixtureImport.uploadBoxDrag')}</p>
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
            <CardTitle>{t('pages.admin.fixtureImport.step2Title')}</CardTitle>
            <CardDescription>{t('pages.admin.fixtureImport.step2Description')}</CardDescription>
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
              <Button variant="outline" onClick={() => setCurrentStep(0)}>{t('pages.admin.fixtureImport.backButton')}</Button>
              <Button onClick={handleMappingSubmit} disabled={teamsLoading || venuesLoading || competitionsLoading || seasonsLoading}>
                {(teamsLoading || venuesLoading || competitionsLoading || seasonsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('pages.admin.fixtureImport.previewButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.admin.fixtureImport.step3Title')}</CardTitle>
            <CardDescription>{t('pages.admin.fixtureImport.step3Description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t('pages.admin.fixtureImport.tableStatus')}</TableHead>
                    {REQUIRED_FIELDS.map(f => <TableHead key={f.id}>{f.label}</TableHead>)}
                    <TableHead>{t('pages.admin.fixtureImport.tableErrors')}</TableHead>
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
                      <TableCell>{row.data?.match_date ? new Date(row.data.match_date).toLocaleString('it-IT') : 'Data invalida'}</TableCell>
                      <TableCell>{row.original[mapping.referee_team_name] || '-'}</TableCell>
                      <TableCell>{row.original[mapping.competition_name] || '-'}</TableCell>
                      <TableCell>{row.original[mapping.season_name] || '-'}</TableCell>
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
              <Button variant="outline" onClick={() => setCurrentStep(1)}>{t('pages.admin.fixtureImport.backButton')}</Button>
              <Button onClick={handleImport} disabled={createMultipleMatchesMutation.isPending}>
                {createMultipleMatchesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <FileCheck2 className="mr-2 h-4 w-4" />
                {t('pages.admin.fixtureImport.importButton', { count: previewData.filter(r => r.isValid).length })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
};

export default FixtureImportAdmin;