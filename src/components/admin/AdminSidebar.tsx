import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useMemo } from "react";

const adminMenuConfig = [
  {
    category: "Gestione Lega",
    links: [
      { to: "/admin", label: "Dashboard", roles: ['admin', 'editor', 'captain'], exact: true },
      { to: "/admin/teams", label: "Squadre", roles: ['admin', 'editor', 'captain'] },
      { to: "/admin/players", label: "Giocatori", roles: ['admin', 'editor', 'captain'] },
      { to: "/admin/fixtures", label: "Calendario e Risultati", roles: ['admin', 'editor'] },
      { to: "/admin/competitions", label: "Competizioni", roles: ['admin', 'editor'] },
      { to: "/admin/seasons", label: "Stagioni", roles: ['admin', 'editor'] },
      { to: "/admin/venues", label: "Campi da Gioco", roles: ['admin', 'editor'] },
      { to: "/admin/sponsors", label: "Sponsor", roles: ['admin', 'editor'] },
      { to: "/admin/honors", label: "Albo d'Oro", roles: ['admin', 'editor'] },
    ]
  },
  {
    category: "Gestione Contenuti",
    links: [
      { to: "/admin/articles", label: "Articoli", roles: ['admin', 'editor'] },
      { to: "/admin/albums", label: "Galleria", roles: ['admin', 'editor'] },
    ]
  },
  {
    category: "Configurazione Sito",
    links: [
      { to: "/admin/homepage", label: "Layout Homepage", roles: ['admin', 'editor'] },
      { to: "/admin/theme", label: "Aspetto", roles: ['admin'] },
      { to: "/admin/event", label: "Evento Countdown", roles: ['admin'] },
    ]
  },
  {
    category: "Amministrazione",
    links: [
      { to: "/admin/users", label: "Gestione Utenti", roles: ['admin'] },
    ]
  }
];

export const AdminSidebar = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const activeCategory = useMemo(() => {
    let bestMatch: string | undefined = undefined;
    let longestPath = -1;

    for (const group of adminMenuConfig) {
      for (const link of group.links) {
        if (location.pathname.startsWith(link.to)) {
          if (link.to.length > longestPath) {
            longestPath = link.to.length;
            bestMatch = group.category;
          }
        }
      }
    }
    return bestMatch;
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/admin" className="flex items-center gap-2" onClick={onLinkClick}>
          <Shield className="h-6 w-6 text-sidebar-primary" />
          <span className="font-bold text-lg text-sidebar-primary">Admin NC League</span>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <Accordion type="single" collapsible defaultValue={activeCategory} className="w-full">
          {adminMenuConfig.map((group) => {
            const visibleLinks = group.links.filter(link => hasPermission(link.roles as any));
            if (visibleLinks.length === 0) return null;

            return (
              <AccordionItem value={group.category} key={group.category} className="border-b-0">
                <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline hover:bg-sidebar-accent rounded-md">
                  {group.category}
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-2">
                  <ul className="space-y-1">
                    {visibleLinks.map((link) => {
                      const isActive = link.exact
                        ? location.pathname === link.to
                        : location.pathname.startsWith(link.to);

                      return (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            className={cn(
                              "block pl-8 pr-3 py-2 rounded-md text-sm font-medium transition-colors",
                              isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                            onClick={onLinkClick}
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </nav>
    </div>
  );
};