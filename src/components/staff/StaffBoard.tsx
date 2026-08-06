import { Tabs } from "antd";
import EmployeeList from "./EmployeeList";
import BudgetPanel from "./BudgetPanel";
import WhitelistPanel from "./WhitelistPanel";
import ImportPanel from "./ImportPanel";

const items = [
  { key: "employees", label: "员工列表", children: <EmployeeList /> },
  { key: "budget", label: "成本预算", children: <BudgetPanel /> },
  { key: "whitelist", label: "白名单管理", children: <WhitelistPanel /> },
  { key: "import", label: "批量导入", children: <ImportPanel /> },
];

export default function StaffBoard() {
  return (
    <div style={{ padding: "16px 0" }}>
      <Tabs defaultActiveKey="employees" items={items} />
    </div>
  );
}
