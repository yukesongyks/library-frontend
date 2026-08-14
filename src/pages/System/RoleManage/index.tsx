import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import request from '../../../api/request';

interface RoleItem {
  id: number;
  name: string;
  code: string;
  description: string;
  dataScope: string;
}

const DATA_SCOPE_OPTIONS = [
  { label: '全部数据', value: 'all' },
  { label: '本部门数据', value: 'dept' },
  { label: '本人数据', value: 'self' },
];

const RoleManage: React.FC = () => {
  const [data, setData] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = () => {
    setLoading(true);
    request.get('/auth/roles')
      .then((res: any) => setData(res.data))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingRole) {
      await request.put(`/auth/roles/${editingRole.id}`, values);
      message.success('更新成功');
    } else {
      await request.post('/auth/roles', values);
      message.success('创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingRole(null);
    fetchRoles();
  };

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '角色编码', dataIndex: 'code', key: 'code' },
    { title: '数据范围', dataIndex: 'dataScope', key: 'dataScope', render: (v: string) => DATA_SCOPE_OPTIONS.find(o => o.value === v)?.label || v },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '操作', key: 'action',
      render: (_: any, record: RoleItem) => (
        <Button type="link" onClick={() => { setEditingRole(record); form.setFieldsValue(record); setModalOpen(true); }}>编辑</Button>
      ),
    },
  ];

  return (
    <Card title="角色管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRole(null); form.resetFields(); setModalOpen(true); }}>新增角色</Button>}>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={false} />
      <Modal title={editingRole ? '编辑角色' : '新增角色'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {!editingRole && (
            <Form.Item name="code" label="角色编码" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          )}
          <Form.Item name="dataScope" label="数据范围" rules={[{ required: true }]}>
            <Select options={DATA_SCOPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default RoleManage;
