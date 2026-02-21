import { useThemeContext } from "@/components/theme/ThemeProvider";
import { Instagram, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";

const INSTAGRAM_URL = "https://www.instagram.com/nc_league25/";
const YOUTUBE_URL = "https://www.youtube.com/@NCLeague.football";

const socialLinks = [
  {
    key: "instagram",
    href: INSTAGRAM_URL,
    icon: Instagram,
  },
  {
    key: "youtube",
    href: YOUTUBE_URL,
    icon: Youtube,
  },
] as const;

export const Footer = () => {
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pt-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="space-y-2">
            {theme?.logo_url ? (
              <img
                src={theme.logo_url}
                alt={t("footer.brandFallback")}
                className="mx-auto h-9 max-w-[180px] object-contain sm:mx-0"
              />
            ) : (
              <p className="text-sm font-semibold text-foreground">
                {t("footer.brandFallback")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("footer.rights", { year: currentYear })}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 sm:items-end">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("footer.followUs")}
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map(({ key, href, icon: Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t(`footer.${key}`)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground/75 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
