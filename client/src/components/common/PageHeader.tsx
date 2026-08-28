import PageNav from "./PageNav";

// Title + cross-page nav for the standalone pages (/boardonly, /players,
// /rosters). "/" deliberately keeps its own existing header — the full board
// screen is unchanged by design — and renders PageNav on its own instead.
export default function PageHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="page-header">
      <div>
        <h1>Intuti</h1>
        <div className="league-sub">{subtitle}</div>
      </div>
      <PageNav />
    </div>
  );
}
