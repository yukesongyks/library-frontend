import React from 'react';
import { Segmented } from 'antd';
import type { SegmentedProps } from 'antd';

/**
 * OneSegmented - 分段选择器组件
 * 封装 antd Segmented，提供统一样式和类型约束
 */
type OneSegmentedProps<T extends string> = {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

function OneSegmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: OneSegmentedProps<T>) {
  return (
    <Segmented
      className={className}
      options={options as SegmentedProps['options']}
      value={value}
      onChange={(val) => onChange(val as T)}
    />
  );
}

export default OneSegmented;
