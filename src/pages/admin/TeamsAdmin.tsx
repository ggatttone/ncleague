import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Link } from "react-router-dom";

const columns = [
  { key: "name", label: "Nome" },
  { key: "parish", label: "Parrocchia" },
  { key: "venue", label: "Campo" },
  { key: "actions", label: "" },
];

const data = [
  {
    name: <Link to="/admin/teams/1" className="text-primary underline">FC Example</Link>,
    parish: "San Marco",
    venue: "Campo A",
    actions: <Link to="/admin/teams/1/edit" className="text-xs text-muted-foreground underline">Modifica</Link>,
  },
];

const TeamsAdmin = () => (
  <AdminLayout>
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Squadre</h1>
      <Link
        to="/admin/teams/new"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition"
      >
        Nuova squadra
      </Link>
    </div>
    <Table columns={columns} data={data} />
  </AdminLayout>
);

export default TeamsAdmin;