import { Form, Select, Input } from 'antd';
import type { CostStatQuery, CostDimension, TimeDimension } from '../../../types/cost';

const { Option } = Select;

interface Props {
  value: CostStatQuery;
  onChange: (val: Partial<CostStatQuery>) => void;
}

const TIME_PATTERNS: Record<TimeDimension, RegExp> = {
  MONTH: /^\d{4}-(0[1-9]|1[0-2])$/,
  QUARTER: /^\d{4}-Q[1-4]$/,
  YEAR: /^\d{4}$/,
};

function getTimePlaceholder(timeDimension: TimeDimension | undefined): string {
  switch (timeDimension) {
    case 'QUARTER':
      return '如 2026-Q3';
    case 'YEAR':
      return '如 2026';
    default:
      return '如 2026-08';
  }
}

export default function DimensionFilter({ value, onChange }: Props) {
  const timeDimension = value.timeDimension ?? 'MONTH';
  const timeValue = value.timeValue ?? '';
  const isValid = !timeValue || TIME_PATTERNS[timeDimension].test(timeValue);

  return (
    <Form layout="inline">
      <Form.Item label="统计维度">
        <Select
          value={value.dimension}
          onChange={(v: CostDimension) => onChange({ dimension: v })}
          style={{ width: 120 }}
        >
          <Option value="DEPT">部门</Option>
          <Option value="PROJECT">项目</Option>
          <Option value="BUSINESS_LINE">业务线</Option>
          <Option value="PERSON">人员</Option>
        </Select>
      </Form.Item>
      <Form.Item label="时间维度">
        <Select
          value={value.timeDimension}
          onChange={(v: TimeDimension) => onChange({ timeDimension: v })}
          style={{ width: 120 }}
        >
          <Option value="MONTH">月份</Option>
          <Option value="QUARTER">季度</Option>
          <Option value="YEAR">年度</Option>
        </Select>
      </Form.Item>
      <Form.Item
        label="时间值"
        validateStatus={timeValue && !isValid ? 'error' : ''}
        help={timeValue && !isValid ? '格式不正确：月份 yyyy-MM / 季度 yyyy-Qq / 年度 yyyy' : ''}
      >
        <Input
          placeholder={getTimePlaceholder(timeDimension)}
          value={value.timeValue}
          onChange={(e) => onChange({ timeValue: e.target.value })}
          style={{ width: 160 }}
        />
      </Form.Item>
    </Form>
  );
}
