/** The ministry's cross as slow-turning solid artwork (CSS 3D, drawn with the site's own colours). Decorative: hidden from screen readers. */
function Box({ w, h, d, x, y }: { w: number; h: number; d: number; x: number; y: number }) {
  return (
    <div className="cx-box" style={{ width: `${w}rem`, height: `${h}rem`, left: `${x}rem`, top: `${y}rem`, ["--w" as string]: `${w}rem`, ["--h" as string]: `${h}rem`, ["--d" as string]: `${d}rem` }}>
      <i className="cx-front" /><i className="cx-back" /><i className="cx-right" /><i className="cx-left" /><i className="cx-top" /><i className="cx-bottom" />
    </div>
  );
}

export function CrossArt() {
  return (
    <div className="cx" aria-hidden>
      <div className="cx-stage">
        <Box w={2.1} h={8.6} d={2.1} x={1.95} y={0} />
        {/* A touch shallower than the upright so the two never share a face. */}
        <Box w={6} h={2.1} d={2.04} x={0} y={2.2} />
      </div>
    </div>
  );
}
