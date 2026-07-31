import { useState } from "react";
import HelloWorldTab from "./components/HelloWorldTab";
import HashTab from "./components/HashTab";
import BubbleSortTab from "./components/BubbleSortTab";
import ReportPanel from "./components/ReportPanel";

type TabKey = "helloworld" | "hash" | "bubble-sort";

const TABS: { key: TabKey; label: string }[] = [
  { key: "helloworld", label: "HelloWorld" },
  { key: "hash", label: "哈希" },
  { key: "bubble-sort", label: "冒泡排序" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("helloworld");

  return (
    <div className="app">
      <h1>Hello World - 功能演示</h1>
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "helloworld" && <HelloWorldTab />}
      {activeTab === "hash" && <HashTab />}
      {activeTab === "bubble-sort" && <BubbleSortTab />}
      <ReportPanel />
    </div>
  );
}
