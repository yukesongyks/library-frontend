import { Typography } from "antd";
import DemoTabs from "@/components/DemoTabs";
import MetricsReport from "@/components/MetricsReport";

const { Title } = Typography;

export default function App() {
  return (
    <div className="app-container">
      <Title level={2} className="app-title">
        Library Frontend Demo
      </Title>
      <DemoTabs />
      <MetricsReport />
    </div>
  );
}
