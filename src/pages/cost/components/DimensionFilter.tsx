import { Form, Select, Input } from 'antd';
import type { CostStatQuery, CostDimension, TimeDimension } from '../../../types/cost';

const { Option } = Select;

interface Props {
  value: CostStatQuery;
  onChange: (val: Partial<CostStatQuery>) => void;
}

export default function DimensionFilter({ value, onChange }: Props) {
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
      <Form.Item label="时间值">
        <Input
          placeholder="如 2026-08 / 2026-Q3 / 2026"
          value={value.timeValue}
          onChange={(e) => onChange({ timeValue: e.target.value })}
          style={{ width: 160 }}
        />
      </Form.Item>
    </Form>
  );
}
