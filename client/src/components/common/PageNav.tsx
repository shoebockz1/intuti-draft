import { AppLink, useRouter } from "../../router/Router";

// The one list of pages, shared by the standalone pages' PageHeader and by
// the main draft board. Single source so adding a page later surfaces it
// everywhere at once instead of only in whichever copy got updated.
//
// Every entry is a real link (AppLink), which is the point: owners run this
// like ClickyDraft, opening the board, the player list and last year's
// rosters into separate tabs with a middle- or cmd-click.
const PAGES: { to: string; label: string }[] = [
  { to: "/", label: "Full board" },
  { to: "/boardonly", label: "Board only" },
  { to: "/players", label: "Players" },
  { to: "/rosters", label: "Rosters" },
];

export default function PageNav({ className }: { className?: string }) {
  const { path } = useRouter();

  return (
    <nav className={`page-nav ${className ?? ""}`}>
      {PAGES.map((p) => (
        <AppLink key={p.to} to={p.to} className={`btn sm ${path === p.to ? "active" : ""}`}>
          {p.label}
        </AppLink>
      ))}
    </nav>
  );
}
