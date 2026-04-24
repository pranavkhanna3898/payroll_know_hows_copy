const TABS = [
  { id: "matrix", label: "📊 Full Matrix" },
  { id: "pt", label: "🏛️ Professional Tax" },
  { id: "lwf", label: "⚖️ Labour Welfare Fund" },
  { id: "cycle", label: "🔄 Payroll Cycle & Flow" },
  { id: "simulations", label: "⚙️ Simulations" },
  { id: "settings", label: "🏢 Company Settings" },
  { id: "payroll", label: "▶️ Payroll Operations" },
  { id: "portal", label: "👤 Employee Portal" },
  { id: "finance", label: "🛡️ Finance Dashboard" },
  { id: "detail", label: "📋 Component Detail" },
  { id: "frd", label: "📄 FRD Document" },
  { id: "dictionary", label: "📖 Data Dictionary" },
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
