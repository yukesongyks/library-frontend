import React from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';

/**
 * TypeTabs - 类型化标签页组件
 * 封装 antd Tabs，提供类型安全的 key 约束和项目统一样式
 */
export type TypeTabItem<K extends string> = {
  key: K;
  label: React.ReactNode;
  children: React.ReactNode;
};

type TypeTabsProps<K extends string> = {
  items: TypeTabItem<K>[];
  activeKey: K;
  onChange: (key: K) => void;
  className?: string;
};

function TypeTabs<K extends string>({
  items,
  activeKey,
  onChange,
  className,
}: TypeTabsProps<K>) {
  const tabItems: TabsProps['items'] = items.map((item) => ({
    key: item.key,
    label: item.label,
    children: item.children,
  }));

  return (
    <Tabs
      className={className}
      activeKey={activeKey}
      onChange={(key) => onChange(key as K)}
      items={tabItems}
      type="card"
    />
  );
}

export default TypeTabs;
