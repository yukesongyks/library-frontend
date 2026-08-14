import React, { useState, useEffect } from 'react';
import { Card, Form, Select, InputNumber, DatePicker, Input, Button, message, Table } from 'antd';
import { getDepartments, getProjects, getBusinessLines, getEmployees, Department, Project, BusinessLine, Employee } from '../../api/baseData';
import { createCostEntry, getCostRecords, CostRecord } from '../../api/cost';
import { COST_TYPES, ROLE_TYPES } from '../../utils/constants';
import { formatMoney, costTypeLabel } from '../../utils/format';

const DataEntry: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [depts, setDepts] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bizLines, setBizLines] = useState<BusinessLine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    getDepartments().then(r => setDepts(r.data));
    getProjects().then(r => setProjects(r.data.list));
    getBusinessLines().then(r => setBizLines(r.data));
    getEmployees().then(r => setEmployees(r.data));
    fetchRecords(1);
  }, []);

  const fetchRecords = (pageNum: number) => {
    getCostRecords({ pageNum, pageSize: 10 }).then(res => {
      setRecords(res.data.list);
      setTotal(res.data.total);
    });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await createCostEntry({
        ...values,
        period: values.period.format('YYYY-MM'),
      });
      message.success('录入成功');
      form.resetFields();
      fetchRecords(1);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  };

  const columns = [
    { title: '期间', dataIndex: 'period', key: 'period' },
    { title: '成本类型', dataIndex: 'costType', key: 'costType', render: (v: string) => costTypeLabel[v] || v },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v) },
    { title: '来源', dataIndex: 'source', key: 'source' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  return (
    <div>
      <Card title="成本数据录入" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={handleSubmit} style={{ flexWrap: 'wrap', gap: 8 }}>
          <Form.Item name="deptId" label="部门" rules={[{ required: true }]}>
            <Select style={{ width: 150 }} showSearch optionFilterProp="label"
              options={depts.map(d => ({ label: d.name, value: d.id }))} />
          </Form.Item>
          <Form.Item name="projectId" label="项目">
            <Select allowClear style={{ width: 150 }} showSearch optionFilterProp="label"
              options={projects.map(p => ({ label: p.name, value: p.id }))} />
          </Form.Item>
          <Form.Item name="bizLineId" label="业务线">
            <Select allowClear style={{ width: 150 }} showSearch optionFilterProp="label"
              options={bizLines.map(b => ({ label: b.name, value: b.id }))} />
          </Form.Item>
          <Form.Item name="employeeId" label="人员">
            <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
              options={employees.map(e => ({ label: `${e.name}(${e.empNo})`, value: e.id }))} />
          </Form.Item>
          <Form.Item name="roleType" label="岗位">
            <Select allowClear style={{ width: 100 }} options={ROLE_TYPES} />
          </Form.Item>
          <Form.Item name="costType" label="成本类型" rules={[{ required: true }]}>
            <Select style={{ width: 120 }} options={COST_TYPES} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber min={0.01} precision={2} prefix="¥" />
          </Form.Item>
          <Form.Item name="period" label="期间" rules={[{ required: true }]}>
            <DatePicker picker="month" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
          </Form.Item>
        </Form>
      </Card>
      <Card title="最近录入记录">
        <Table dataSource={records} columns={columns} rowKey="id" size="small"
          pagination={{ total, pageSize: 10, onChange: fetchRecords }} />
      </Card>
    </div>
  );
};

export default DataEntry;
