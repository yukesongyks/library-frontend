import { useState, useEffect, useCallback, useRef } from "react";
import { Table, Button, Form, Input, InputNumber, Select, Modal, Card, Row, Col, Statistic, message, Space } from "antd";
import { getBudgets, createBudget, updateBudget, getBudgetSummary } from "../../api/staffApi";
import type { Budget, BudgetFormData, BudgetSummaryItem } from "../../types/staff";

export default function BudgetPanel() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [form] = Form.useForm<BudgetFormData>();
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("");
  // M-03 fix: debounced filter value to avoid per-keystroke API calls
  const [debouncedFilter, setDebouncedFilter] = useState<string>("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilter(filterEmployeeId);
    }, 400);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [filterEmployeeId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetData, summaryData] = await Promise.all([
        getBudgets(debouncedFilter ? { employeeId: debouncedFilter } : {}),
        getBudgetSummary(),
      ]);
      setBudgets(budgetData);
      setSummary(summaryData);
    } catch (err: any) {
      message.error(err?.message || "获取预算数据失败");
    } finally {
      setLoading(false);
    }
  }, [debouncedFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingBudget) {
        await updateBudget(editingBudget.id, values);
      } else {
        await createBudget(values);
      }
      message.success("保存成功");
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || "保存失败");
    }
  };

  const openCreate = () => {
    setEditingBudget(null);
    form.resetFields();
    form.setFieldsValue({ currency: "CNY", budgetMonth: null });
    setModalOpen(true);
  };

  const openEdit = (record: Budget) => {
    setEditingBudget(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {summary.slice(0, 4).map((item) => (
          <Col span={6} key={`${item.department}-${item.year}`}>
            <Card size="small">
              <Statistic title={`${item.department} (${item.year})`} value={item.totalAmount ?? 0} precision={2} suffix="CNY" />
              <div style={{ fontSize: 12, color: "#999" }}>{item.employeeCount} 人</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="按工号筛选" allowClear style={{ width: 200 }}
          onChange={(e) => setFilterEmployeeId(e.target.value)} />
        <Button type="primary" onClick={openCreate}>设置预算</Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={budgets}
        pagination={false}
        columns={[
          { title: "工号", dataIndex: "employeeId", width: 100 },
          { title: "年度", dataIndex: "budgetYear", width: 80 },
          { title: "月份", dataIndex: "budgetMonth", width: 80, render: (v: number | null) => v ?? "全年" },
          { title: "金额", dataIndex: "amount", width: 120, render: (v: number) => (v != null ? v.toFixed(2) : "0.00") },
          { title: "币种", dataIndex: "currency", width: 60 },
          { title: "更新时间", dataIndex: "updatedAt", width: 180 },
          {
            title: "操作", width: 80,
            render: (_, record) => <Button type="link" size="small" onClick={() => openEdit(record)}>调整</Button>,
          },
        ]}
      />

      <Modal title={editingBudget ? "调整预算" : "设置预算"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="employeeId" label="工号" rules={[{ required: true }]}>
            <Input disabled={!!editingBudget} />
          </Form.Item>
          <Form.Item name="budgetYear" label="预算年度" rules={[{ required: true }]}>
            <InputNumber min={2020} max={2030} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="budgetMonth" label="预算月份（留空为年度预算）">
            <InputNumber min={1} max={12} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="currency" label="币种">
            <Select options={[{ value: "CNY", label: "CNY" }, { value: "USD", label: "USD" }]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
