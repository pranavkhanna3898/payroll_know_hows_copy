import { useState } from 'react';
import Header from './Header';
import Legend from './Legend';
import TabBar from './TabBar';
import MatrixTab from './MatrixTab';
import PTTab from './PTTab';
import LWFTab from './LWFTab';
import CycleTab from './CycleTab';
import DetailTab from './DetailTab';
import SimulationsTab from './simulations/SimulationsTab';
import CompanySettingsTab from './settings/CompanySettingsTab';
import PayrollOpsTab from './payroll/PayrollOpsTab';
import EmployeePortal from './portal/EmployeePortal';
import FinanceVerificationTab from './finance/FinanceVerificationTab';
import FRDTab from './FRDTab';
import FieldDictionaryTab from './FieldDictionaryTab';

export default function PayrollMatrix() {
  const [activeTab, setActiveTab] = useState("matrix");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComponent, setSelectedComponent] = useState(null);

  const handleComponentSelect = (comp) => {
    setSelectedComponent(comp);
    setActiveTab("detail");
  };

  return (
    <div className="app-root">
      <Header />
      <Legend />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="tab-content">
        {activeTab === "matrix" && (
          <MatrixTab
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            onComponentSelect={handleComponentSelect}
          />
        )}

        {activeTab === "pt" && <PTTab />}
        {activeTab === "lwf" && <LWFTab />}
        {activeTab === "cycle" && <CycleTab />}
        {activeTab === "simulations" && <SimulationsTab />}
        {activeTab === "settings" && <CompanySettingsTab />}
        {activeTab === "payroll" && <PayrollOpsTab />}
        {activeTab === "portal" && <EmployeePortal />}
        {activeTab === "finance" && <FinanceVerificationTab />}

        {activeTab === "detail" && (
          <DetailTab
            selectedComponent={selectedComponent}
            onComponentSelect={handleComponentSelect}
            onBack={() => setSelectedComponent(null)}
          />
        )}

        {activeTab === "frd" && <FRDTab />}
        {activeTab === "dictionary" && <FieldDictionaryTab />}
      </div>
    </div>
  );
}
