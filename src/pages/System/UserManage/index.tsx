import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import request from '../../../api/request';
import { getDepartments, Department } from '../../../api/baseData';

interface UserItem {
  id: number;
  username: string;
  name: string;
  deptId: number | null;
  status: number;
  roles: string[];
}

const UserManage: React.FC = () => {
  const [data, setData] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [depts, setDepts] = useState<Department[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    getDepartments().then(r => setDepts(r.data));
    fetchUsers(1);
  }, []);

  const fetchUsers = (pageNum: number) => {
    setLoading(true);
    request.get('/auth/users', { params: { pageNum, pageSize: 10 } })
      .then((res: any) => { setData(res.data.list); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingUser) {
      await request.put(`/auth/users/${editingUser.id}`, values);
      message.success('更新成功');
    } else {
      await request.post('/auth/users', values);
      message.success('创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingUser(null);
    fetchUsers(1);
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '角色', dataIndex: 'roles', key: 'roles', render: (roles: string[]) => roles?.map(r => <Tag key={r}>{r}</Tag>) },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: number) => v === 1 ? <Tag color="green">启用</Tag> : <Tag color="red">停用</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: any, record: UserItem) => (
        <Button type="link" onClick={() => { setEditingUser(record); form.setFieldsValue(record); setModalOpen(true); }}>编辑</Button>
      ),
    },
  ];

  return (
    <Card title="用户管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingUser(null); form.resetFields(); setModalOpen(true); }}>新增用户</Button>}>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading}
        pagination={{ total, pageSize: 10, onChange: fetchUsers }} />
      <Modal title={editingUser ? '编辑用户' : '新增用户'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          {!editingUser && (
            <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          )}
          {!editingUser && (
            <Form.Item name="password" label="密码" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="deptId" label="部门">
            <Select allowClear options={depts.map(d => ({ label: d.name, value: d.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManage;
