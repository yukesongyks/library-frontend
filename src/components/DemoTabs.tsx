import { useState } from "react";
import { Space, Tabs } from "antd";
import type { TabsProps } from "antd";
import HelloWorldTab from "@/components/HelloWorldTab";
import HashTab from "@/components/HashTab";
import BubbleSortTab from "@/components/BubbleSortTab";
import ExportButton from "@/components/ExportButton";
import type { TabKey } from "@/types/api";

/**
 * Ant Design Tabs container for the three demo pages.
 *
 * - Manages the active tab key (helloworld | hash | bubble-sort).
 * - Renders an ExportButton bound to the active tab in the tab bar extra area.
 * - Renders the matching tab component for the active key.
 */
export default function DemoTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("helloworld");

  const items: TabsProps["items"] = [
    {
      key: "helloworld",
      label: "Hello World",
      children: <HelloWorldTab />,
    },
    {
      key: "hash",
      label: "Hash",
      children: <HashTab />,
    },
    {
      key: "bubble-sort",
      label: "Bubble Sort",
      children: <BubbleSortTab />,
    },
  ];

  return (
    <Tabs
      activeKey={activeTab}
      onChange={(key) => setActiveTab(key as TabKey)}
      items={items}
      tabBarExtraContent={
        <Space>
          <ExportButton tab={activeTab} />
        </Space>
      }
    />
  );
}
