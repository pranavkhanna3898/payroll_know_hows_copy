import { useMemo } from 'react';
import { STATES, CATEGORIES } from '../data';
import StatusCell from './StatusCell';

export default function MatrixTab({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedState,
  setSelectedState,
  onComponentSelect,
}) {
  const filteredComponents = useMemo(() => {
    let comps = [];
    CATEGORIES.forEach((cat) => {
      if (selectedCategory === "all" || selectedCategory === cat.id) {
        cat.components.forEach((c) => {
          comps.push({ ...c, categoryName: cat.name, categoryColor: cat.color, categoryId: cat.id });
        });
      }
    });
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      comps = comps.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.notes.toLowerCase().includes(q) ||
          c.taxNote.toLowerCase().includes(q)
      );
    }
    return comps;
  }, [selectedCategory, searchTerm]);

  const visibleStates = selectedState
    ? STATES.filter((s) => s.code === selectedState)
    : STATES;

  return (
    <div>
      {/* Filters */}
      <div className="matrix-filters">
        <input
          placeholder="🔍 Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filter-input"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={selectedState || ""}
          onChange={(e) => setSelectedState(e.target.value || null)}
          className="filter-select"
        >
          <option value="">All States</option>
          {STATES.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
        <span className="filter-count">
          {filteredComponents.length} components × {visibleStates.length} states
        </span>
      </div>

      {/* Matrix Table */}
      <div className="matrix-table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th className="matrix-th-component">Component</th>
              <th className="matrix-th-formula">Formula Base</th>
              {visibleStates.map((s) => (
                <th key={s.code} className="matrix-th-state">
                  <div className="state-header-label">{s.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => {
              const catComps = filteredComponents.filter((c) => c.categoryId === cat.id);
              if (catComps.length === 0) return null;
              return [
                <tr key={`cat-${cat.id}`}>
                  <td
                    colSpan={visibleStates.length + 2}
                    className="matrix-category-row"
                    style={{
                      background: cat.color + "18",
                      color: cat.color,
                      borderBottom: `2px solid ${cat.color}30`,
                    }}
                  >
                    {cat.name}
                  </td>
                </tr>,
                ...catComps.map((comp, i) => (
                  <tr
                    key={comp.id}
                    className="matrix-data-row"
                    style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}
                    onClick={() => onComponentSelect(comp)}
                  >
                    <td
                      className="matrix-td-component"
                      style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}
                    >
                      <div className="comp-name">{comp.name}</div>
                      <div className="comp-category">{comp.categoryName}</div>
                    </td>
                    <td className="matrix-td-base">{comp.base}</td>
                    {visibleStates.map((s) => (
                      <td key={s.code} className="matrix-td-status">
                        <StatusCell statusCode={comp.states[s.code] || "N"} />
                      </td>
                    ))}
                  </tr>
                )),
              ];
            })}
          </tbody>
        </table>
      </div>

      <div className="matrix-hint">
        Click any row to view full component details →
      </div>
    </div>
  );
}
