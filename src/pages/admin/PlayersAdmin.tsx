import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Link } from "react-router-dom";

const columns = [
  { key: "name", label: "Nome" },
  { key: "dob", label: "Data nascita" },
  { key: "team", label: "Squadra" },
  { key: "actions", label: "" },
];

const data = [
  {
    name: <Link to="/admin/players/1" className="text-primary underline">Mario Rossi</Link>,
    dob: "01-01-1990",
    team: <Link to="/admin/teams/1" className="underline">FC Example</Link>,
    actions: <Link to="/admin/players/1/edit" className="text-xs text-muted-foreground underline">Modifica</Link>,
  },
];

const PlayersAdmin = () => (
  <AdminLayout>
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Giocatori</h1>
      <Link
        to="/admin/players/new"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition"
      >
        Nuovo giocatore
      </Link>
    </div>
    <Table columns={columns} data={data} />
  </AdminLayout>
);

export default PlayersAdmin;