const TABS = [
  { id: "matrix", label: "📊 Full Matrix" },
  { id: "pt", label: "🏛️ Professional Tax" },
  { id: "lwf", label: "⚖️ Labour Welfare Fund" },
  { id: "cycle", label: "🔄 Payroll Cycle & Flow" },
  { id: "detail", label: "📋 Component Detail" },
];

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`tab-button ${activeTab === tab.id ? "tab-button--active" : ""}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
