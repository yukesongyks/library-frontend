import React, { useEffect, useState } from 'react';
import { Form, Select, DatePicker, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getDepartments, getProjects, getBusinessLines, Department, Project, BusinessLine } from '../../api/baseData';
import { COST_TYPES, ROLE_TYPES, TIME_GRANULARITY } from '../../utils/constants';

const { RangePicker } = DatePicker;

interface FilterBarProps {
  onSearch: (values: any) => void;
  showCostType?: boolean;
  showRoleType?: boolean;
  showGroupBy?: boolean;
  showTimeGranularity?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ onSearch, showCostType, showRoleType, showGroupBy, showTimeGranularity }) => {
  const [form] = Form.useForm();
  const [depts, setDepts] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bizLines, setBizLines] = useState<BusinessLine[]>([]);

  useEffect(() => {
    getDepartments().then(r => setDepts(r.data));
    getProjects().then(r => setProjects(r.data.list));
    getBusinessLines().then(r => setBizLines(r.data));
  }, []);

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const params: any = { ...values };
    if (values.periodRange) {
      params.periodStart = values.periodRange[0].format('YYYY-MM');
      params.periodEnd = values.periodRange[1].format('YYYY-MM');
      delete params.periodRange;
    }
    onSearch(params);
  };

  const handleReset = () => {
    form.resetFields();
    handleSearch();
  };

  return (
    <Form form={form} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
      <Form.Item name="deptId" label="部门">
        <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
          options={depts.map(d => ({ label: d.name, value: d.id }))} />
      </Form.Item>
      <Form.Item name="projectId" label="项目">
        <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
          options={projects.map(p => ({ label: p.name, value: p.id }))} />
      </Form.Item>
      <Form.Item name="bizLineId" label="业务线">
        <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
          options={bizLines.map(b => ({ label: b.name, value: b.id }))} />
      </Form.Item>
      {showCostType && (
        <Form.Item name="costType" label="成本类型">
          <Select allowClear style={{ width: 120 }} options={COST_TYPES} />
        </Form.Item>
      )}
      {showRoleType && (
        <Form.Item name="roleType" label="岗位">
          <Select allowClear style={{ width: 120 }} options={ROLE_TYPES} />
        </Form.Item>
      )}
      {showGroupBy && (
        <Form.Item name="groupBy" label="分组维度">
          <Select style={{ width: 120 }} defaultValue="dept" options={[
            { label: '部门', value: 'dept' }, { label: '项目', value: 'project' },
            { label: '业务线', value: 'bizLine' }, { label: '人员', value: 'employee' },
            { label: '岗位', value: 'roleType' },
          ]} />
        </Form.Item>
      )}
      {showTimeGranularity && (
        <Form.Item name="timeGranularity" label="时间粒度">
          <Select style={{ width: 100 }} defaultValue="month" options={TIME_GRANULARITY} />
        </Form.Item>
      )}
      <Form.Item name="periodRange" label="期间">
        <RangePicker picker="month" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default FilterBar;
