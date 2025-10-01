import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const AdminSidebar = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const { t } = useTranslation();

  const adminMenuConfig = useMemo(() => [
    {
      category: t('pages.admin.sidebar.leagueManagement'),
      links: [
        { to: "/admin", label: t('pages.admin.sidebar.dashboard'), roles: ['admin', 'editor', 'captain'], exact: true },
        { to: "/admin/tournament-dashboard", label: "Dashboard Torneo", roles: ['admin', 'editor'] },
        { to: "/admin/teams", label: t('pages.admin.sidebar.teams'), roles: ['admin', 'editor', 'captain'] },
        { to: "/admin/players", label: t('pages.admin.sidebar.players'), roles: ['admin', 'editor', 'captain'] },
        { to: "/admin/fixtures", label: t('pages.admin.sidebar.fixtures'), roles: ['admin', 'editor'] },
        { to: "/admin/schedule-generator", label: "Generatore Calendario", roles: ['admin', 'editor'] },
        { to: "/admin/competitions", label: t('pages.admin.sidebar.competitions'), roles: ['admin', 'editor'] },
        { to: "/admin/seasons", label: t('pages.admin.sidebar.seasons'), roles: ['admin', 'editor'] },
        { to: "/admin/tournament-modes", label: t('pages.admin.sidebar.tournamentModes'), roles: ['admin', 'editor'] },
        { to: "/admin/venues", label: t('pages.admin.sidebar.venues'), roles: ['admin', 'editor'] },
        { to: "/admin/sponsors", label: t('pages.admin.sidebar.sponsors'), roles: ['admin', 'editor'] },
        { to: "/admin/honors", label: t('pages.admin.sidebar.honors'), roles: ['admin', 'editor'] },
      ]
    },
    {
      category: t('pages.admin.sidebar.contentManagement'),
      links: [
        { to: "/admin/articles", label: t('pages.admin.sidebar.articles'), roles: ['admin', 'editor'] },
        { to: "/admin/albums", label: t('pages.admin.sidebar.gallery'), roles: ['admin', 'editor'] },
      ]
    },
    {
      category: t('pages.admin.sidebar.siteConfig'),
      links: [
        { to: "/admin/homepage", label: t('pages.admin.sidebar.homepageLayout'), roles: ['admin', 'editor'] },
        { to: "/admin/theme", label: t('pages.admin.sidebar.appearance'), roles: ['admin'] },
        { to: "/admin/event", label: t('pages.admin.sidebar.countdownEvent'), roles: ['admin'] },
      ]
    },
    {
      category: t('pages.admin.sidebar.administration'),
      links: [
        { to: "/admin/users", label: t('pages.admin.sidebar.userManagement'), roles: ['admin'] },
      ]
    }
  ], [t]);

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
  }, [location.pathname, adminMenuConfig]);

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