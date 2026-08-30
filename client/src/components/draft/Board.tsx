import { useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { ROUNDS } from "../../engine/types";
import type { Pick } from "../../engine/types";

export default function Board() {
  const { draft } = useApp();
  const curCellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      curCellRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
    return () => clearTimeout(timer);
  }, [draft?.cur]);

  if (!draft) return null;

  return (
    <table className="board">
      {/* Column widths live in draft.css (.col-rnd / .col-owner) rather than
          inline here, so the phone breakpoint can widen them. Inline widths
          plus table-layout:fixed let the browser squeeze all 10 columns down
          to fit the container instead of overflowing into the scroller. */}
      <colgroup>
        <col className="col-rnd" />
        {draft.owners.map((o) => (
          <col className="col-owner" key={o.idx} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className="rnd-th">Rd</th>
          {draft.owners.map((o) => (
            <th className="owner-th" key={o.idx} title={o.name}>
              {o.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: ROUNDS }, (_, r) => (
          <tr key={r}>
            <td className="rnd-td">{r + 1}</td>
            {draft.owners.map((owner) => {
              const round = r + 1;
              const pick: Pick | undefined = draft.picks.find(
                (p) => p.round === round && p.ownerIdx === owner.idx && !p.isFifthJump,
              );
              const jumpPick: Pick | undefined = draft.picks.find(
                (p) => p.round === round && p.ownerIdx === owner.idx && p.isFifthJump,
              );
              // The normal pick deliberately wins this cell.
              //
              // The 5th-place jump is an oddball by design: it gives one owner
              // two picks in a single round, which a uniform round-by-owner
              // grid fundamentally cannot represent. Rather than distort the
              // board for every other owner, the jump is surfaced elsewhere —
              // the "5th Place Jump Pick" panel on "/" and the "5th-place
              // pick:" line on /boardonly — and the round-18 skip cell shows
              // the balancing side of it. QA has flagged the missing cell
              // twice; it is a known, accepted trade-off, not an oversight.
              // Don't "fix" this without a deliberate redesign of the grid.
              const disp = pick || jumpPick;
              if (!disp) return <td key={owner.idx}></td>;

              const idx = draft.picks.indexOf(disp);
              const isCur = idx === draft.cur;

              let cellCls = "";
              if (disp.isSkipped) cellCls = "cell-skip";
              else if (isCur) cellCls = "cell-cur";
              else if (disp.type === "kept") cellCls = "cell-kept";
              else if (disp.type === "fifth-jump") cellCls = "cell-jump";
              else if (disp.type === "unprotected") cellCls = "cell-unprot";
              else cellCls = "cell-empty";

              return (
                <td key={owner.idx}>
                  <div className={`cell ${cellCls}`} ref={isCur ? curCellRef : undefined}>
                    <div className="cell-pnum">#{idx + 1}</div>
                    {disp.isSkipped ? (
                      <div className="cell-skip-text">skip</div>
                    ) : disp.player ? (
                      <div className="cell-player">{disp.player}</div>
                    ) : isCur ? (
                      <div className="cell-picking">picking…</div>
                    ) : null}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
