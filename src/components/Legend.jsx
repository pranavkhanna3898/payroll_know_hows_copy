import { STATUS } from '../data';

export default function Legend() {
  return (
    <div className="legend-bar">
      <span className="legend-label">LEGEND:</span>
      {Object.entries(STATUS).map(([k, v]) => (
        <div key={k} className="legend-item">
          <div
            className="legend-icon"
            style={{
              background: v.bg,
              border: `1px solid ${v.color}40`,
              color: v.color,
            }}
          >
            {v.symbol}
          </div>
          <span className="legend-text">{v.label}</span>
        </div>
      ))}
    </div>
  );
}
