import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Calendar,
  LayoutDashboard,
  PlusCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useSeason } from "@/hooks/use-seasons";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export function SuccessScreen() {
  const navigate = useNavigate();
  const { seasonId } = useParams<{ seasonId: string }>();
  const { data: season, isLoading } = useSeason(seasonId);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Non specificata";
    try {
      return format(new Date(dateStr), "d MMMM yyyy", { locale: it });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!season) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Stagione non trovata</p>
          <Button asChild className="mt-4">
            <Link to="/admin/seasons">Torna alle Stagioni</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <CardTitle className="text-2xl">Stagione Creata con Successo!</CardTitle>
        <CardDescription>
          La nuova stagione è pronta per essere configurata
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Season Details */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{season.name}</span>
            <Badge variant="secondary">Nuova</Badge>
          </div>
          <Separator />
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Inizio:</span>
              <span>{formatDate(season.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Fine:</span>
              <span>{formatDate(season.end_date)}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-3">
          <h3 className="font-medium">Prossimi Passi</h3>
          <div className="grid gap-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-primary">Genera il Calendario</p>
                <p className="text-sm text-muted-foreground">
                  Crea automaticamente le partite per questa stagione
                </p>
              </div>
              <Button asChild size="sm">
                <Link to={`/admin/schedule-generator?season=${season.id}`}>
                  Genera
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/admin/seasons")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Vai alle Stagioni
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/admin/seasons/wizard")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Crea Altra Stagione
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
