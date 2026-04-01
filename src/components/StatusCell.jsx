import { STATUS } from '../data';

export default function StatusCell({ statusCode }) {
  const s = STATUS[statusCode] || STATUS["N"];
  return (
    <div
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 4,
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 13,
        margin: "auto",
        border: `1px solid ${s.color}40`,
      }}
      title={s.label}
    >
      {s.symbol}
    </div>
  );
}
