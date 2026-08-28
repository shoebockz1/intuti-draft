// The board's colour key. Shared by the full draft screen and /boardonly —
// these swatches have to stay in step with the .cell-* rules in draft.css,
// and a second hand-maintained copy would quietly drift out of sync.
export default function BoardLegend() {
  return (
    <div className="legend">
      <div className="legend-item">
        <div className="ldot" style={{ background: "rgba(186,117,23,.5)" }} />
        on clock
      </div>
      <div className="legend-item">
        <div className="ldot" style={{ background: "rgba(29,158,117,.4)" }} />
        kept own
      </div>
      <div className="legend-item">
        <div className="ldot" style={{ background: "rgba(55,138,221,.4)" }} />
        unprotected
      </div>
      <div className="legend-item">
        <div className="ldot" style={{ background: "rgba(127,119,221,.5)" }} />
        5th jump
      </div>
      <div className="legend-item">
        <div className="ldot" style={{ background: "var(--bg2)" }} />
        skipped
      </div>
    </div>
  );
}
