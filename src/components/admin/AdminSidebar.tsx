import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const adminLinks = [
  { to: "/admin/teams", label: "Squadre" },
  { to: "/admin/players", label: "Giocatori" },
  { to: "/admin/fixtures", label: "Calendario" },
  { to: "/admin/results", label: "Risultati" },
  { to: "/admin/articles", label: "Articoli" },
  { to: "/admin/penalties", label: "Penalità" },
  { to: "/admin/audit-log", label: "Audit Log" },
];

export const AdminSidebar = () => {
  const location = useLocation();
  return (
    <aside className="w-56 min-h-screen bg-sidebar px-4 py-8 border-r border-sidebar-border">
      <div className="font-bold text-lg mb-8 text-sidebar-primary">Admin NC League</div>
      <ul className="space-y-2">
        {adminLinks.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname.startsWith(link.to)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};