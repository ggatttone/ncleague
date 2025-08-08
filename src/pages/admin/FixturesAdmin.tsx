import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Link } from "react-router-dom";

const columns = [
  { key: "match", label: "Partita" },
  { key: "date", label: "Data" },
  { key: "venue", label: "Campo" },
  { key: "status", label: "Stato" },
  { key: "actions", label: "" },
];

const data = [
  {
    match: <Link to="/admin/fixtures/1" className="text-primary underline">FC Example vs FC Test</Link>,
    date: "15/05/2024 20:30",
    venue: "Campo A",
    status: <span className="text-green-600">Programmata</span>,
    actions: <Link to="/admin/fixtures/1/edit" className="text-xs text-muted-foreground underline">Modifica</Link>,
  },
];

const FixturesAdmin = () => (
  <AdminLayout>
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Calendario Partite</h1>
      <Link
        to="/admin/fixtures/new"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition"
      >
        Nuova partita
      </Link>
    </div>
    <Table columns={columns} data={data} />
  </AdminLayout>
);

export default FixturesAdmin;