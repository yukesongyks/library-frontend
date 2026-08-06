import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Popconfirm, message, Tag } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../../api/staffApi";
import type { Employee, EmployeeFormData, EmployeeQuery } from "../../types/staff";
import EmployeeFormModal from "./EmployeeFormModal";

export default function EmployeeList() {
  const [data, setData] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<EmployeeQuery>({ page: 1, pageSize: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEmployees(query);
      setData(result.records);
      setTotal(result.total);
    } catch (err: any) {
      message.error(err?.message || "获取员工列表失败");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const handleEdit = (record: Employee) => {
    setEditingEmployee(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEmployee(id);
      message.success("删除成功");
      fetchData();
    } catch (err: any) {
      message.error(err?.message || "删除失败");
    }
  };

  const handleSubmit = async (formData: EmployeeFormData) => {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, formData);
    } else {
      await createEmployee(formData);
    }
    fetchData();
  };

  const columns: ColumnsType<Employee> = [
    { title: "工号", dataIndex: "employeeId", key: "employeeId", width: 100 },
    { title: "姓名", dataIndex: "name", key: "name", width: 100 },
    { title: "部门", dataIndex: "department", key: "department", width: 120 },
    { title: "职位", dataIndex: "position", key: "position", width: 120 },
    { title: "入职日期", dataIndex: "hireDate", key: "hireDate", width: 120 },
    { title: "联系方式", dataIndex: "contactInfo", key: "contactInfo", width: 150 },
    {
      title: "技能标签",
      dataIndex: "skills",
      key: "skills",
      render: (skills: string[]) => skills?.map((s) => <Tag key={s}>{s}</Tag>),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索姓名"
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 200 }}
          onChange={(e) => setQuery((q) => ({ ...q, name: e.target.value || undefined, page: 1 }))}
        />
        <Input
          placeholder="搜索部门"
          allowClear
          style={{ width: 200 }}
          onChange={(e) => setQuery((q) => ({ ...q, department: e.target.value || undefined, page: 1 }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增员工</Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          onChange: (page, pageSize) => setQuery((q) => ({ ...q, page, pageSize })),
        }}
      />
      <EmployeeFormModal
        open={modalOpen}
        editingEmployee={editingEmployee}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
