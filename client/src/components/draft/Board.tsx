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

  const colW = 62;

  return (
    <table className="board">
      <colgroup>
        <col style={{ width: 26 }} />
        {draft.owners.map((o) => (
          <col style={{ width: colW }} key={o.idx} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className="rnd-th">Rd</th>
          {draft.owners.map((o) => (
            <th className="owner-th" key={o.idx}>
              {o.name.split(" ")[0].substring(0, 7)}
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
