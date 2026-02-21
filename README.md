# Welcome to the NCLeague app
Hi everyone!

I want to share a small but meaningful story from my personal projects, one that reminded me why I love building things and experimenting with new technologies.



In my free time, I run a yearly amateur five-a-side football league with a group of friends. Ten or eleven teams, three events throughout the year, a proper ranking table, articles, media, matchdays… basically a little ecosystem that grew much bigger than I initially expected. At the beginning I managed everything through a #WordPress site. It worked but the interface felt outdated, mobile usability became a problem, and the costs started piling up. I knew I needed something more flexible and modern.



Around that time, I became increasingly curious about vibe coding; this idea of building with AI models in a more fluid, intuitive way. And since I happened to receive some free Google Cloud credits, I thought: Why not turn my football league into the perfect test case?



So I jumped in.



I started exploring different models like #Gemini Pro, OpenAI #GPT-4, Anthropic #Claude, each helping me think through the structure, logic, and development from a different angle. Using an AI-first development environment, I connected everything to a Supabase database and deployed the final app on Vercel and GitHub. It was the first time I built something end-to-end using this “AI-augmented” approach… and it felt surprisingly natural.



What came out of it was more than just a website.

It became a clean, scalable, modern web app that works beautifully on any device and gives me full control over calendars, results, content, and the community and... it was really cost saving.



There’s still room for improvement, especially around media management but the speed at which everything came together really impressed me. A clear use case, a methodical mindset, and the right #AI tools made the whole process feel lighter, faster, almost fun.



This little project reminded me that innovation doesn’t always need to start from something big. Sometimes, the best way to learn is by solving a problem you truly care about.



https://www.ncleague.football/

---

## Recent Updates

- News feed redesign with a denser social timeline look inspired by X/Twitter.
- Inline News composer available in `/news` for `admin/editor` roles.
- Composer behavior: max 280 characters, optional single image upload, publish or save draft.
- Automatic `title` and `slug` generation for inline-created posts.
- UI copy updated in all supported locales: Italian, English, Dutch.
- Deprecated hover-only public card controls (`Settings` + `Admin`) on `/teams`, `/players`, and `/matches` to avoid non-functional UI affordances.
- Added a global responsive public footer (hidden on `/admin`) with Instagram and YouTube social links, localized labels, and mobile-safe spacing.
- Mobile matches redesign on `/matches` with a denser LiveScore-inspired row layout for screens `<768px` while keeping desktop cards unchanged.
- New league favicon package (web + PWA): `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`.
- Dynamic favicon fallback improved: default league favicon is restored automatically when `theme.logo_url` is empty/removed, while keeping theme-based override when available.

---

## Documentation

- [Tournament Modes System](docs/TOURNAMENT_MODES.md) - Technical documentation for the flexible tournament mode system
- [Development Guidelines](CLAUDE.md) - Coding conventions and project structure
- [Timezone/Match Date handling (wall-clock model)](CLAUDE.md) - Fix applicata per evitare lo shift +1h post-salvataggio calendario
- [News Feed + Inline Composer](CLAUDE.md) - Note operative su timeline News stile social e flusso composer admin/editor
- [Mobile Matches Redesign (LiveScore-inspired)](docs/dev/MATCHES_MOBILE_LIVESCORE.md) - Obiettivi UX, architettura componenti e checklist regressione
- [Mobile Matches User Test Protocol](docs/dev/MATCHES_MOBILE_USER_TEST.md) - Setup test utenti, metriche e template go/no-go

