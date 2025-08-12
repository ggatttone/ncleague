import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { showSuccess } from "@/utils/toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVenues } from "@/hooks/use-venues";

const FixtureFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { data: venues, isLoading: venuesLoading } = useVenues();

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? "Modifica partita" : "Nuova partita"}
        </h1>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            showSuccess(isEdit ? "Partita aggiornata!" : "Partita creata!");
            navigate("/admin/fixtures");
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="home-team">Squadra casa</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona squadra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">FC Example</SelectItem>
                  <SelectItem value="2">FC Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="away-team">Squadra ospite</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona squadra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">FC Example</SelectItem>
                  <SelectItem value="2">FC Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="match-date">Data e ora</Label>
            <Input id="match-date" type="datetime-local" required />
          </div>
          
          <div>
            <Label htmlFor="venue_id">Campo</Label>
            <Select disabled={venuesLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un campo" />
              </SelectTrigger>
              <SelectContent>
                {venues?.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="match-status">Stato</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Programmata</SelectItem>
                <SelectItem value="ongoing">In corso</SelectItem>
                <SelectItem value="completed">Completata</SelectItem>
                <SelectItem value="postponed">Rinviata</SelectItem>
                <SelectItem value="cancelled">Cancellata</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/fixtures")}>
              Annulla
            </Button>
            <Button type="submit">{isEdit ? "Salva modifiche" : "Crea partita"}</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default FixtureFormAdmin;