import { useState, useEffect, useCallback } from "react";
import { Table, Button, Input, Modal, Form, Popconfirm, Space, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getWhitelist, addToWhitelist, removeFromWhitelist, batchAddToWhitelist } from "../../api/staffApi";
import type { WhitelistItem } from "../../types/staff";

export default function WhitelistPanel() {
  const [data, setData] = useState<WhitelistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getWhitelist());
    } catch (err: any) {
      message.error(err?.message || "获取白名单失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    try {
      const { employeeId, remark } = await addForm.validateFields();
      await addToWhitelist(employeeId, remark);
      message.success("添加成功");
      setAddModalOpen(false);
      addForm.resetFields();
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || "添加失败");
    }
  };

  const handleBatchAdd = async () => {
    try {
      const { employeeIds, remark } = await batchForm.validateFields();
      const ids = employeeIds.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean);
      await batchAddToWhitelist({ employeeIds: ids, remark });
      message.success(`批量添加 ${ids.length} 条成功`);
      setBatchModalOpen(false);
      batchForm.resetFields();
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || "批量添加失败");
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeFromWhitelist(id);
      message.success("已移除");
      fetchData();
    } catch (err: any) {
      message.error(err?.message || "移除失败");
    }
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>添加白名单</Button>
        <Button onClick={() => setBatchModalOpen(true)}>批量添加</Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: "工号", dataIndex: "employeeId", width: 120 },
          { title: "添加时间", dataIndex: "addedAt", width: 180 },
          { title: "操作人", dataIndex: "addedBy", width: 120 },
          { title: "备注", dataIndex: "remark" },
          {
            title: "操作", width: 80,
            render: (_, record) => (
              <Popconfirm title="确认移除？" onConfirm={() => handleRemove(record.id)}>
                <Button type="link" size="small" danger>移除</Button>
              </Popconfirm>
            ),
          },
        ]}
      />

      <Modal title="添加白名单" open={addModalOpen} onOk={handleAdd} onCancel={() => setAddModalOpen(false)} destroyOnClose>
        <Form form={addForm} layout="vertical">
          <Form.Item name="employeeId" label="工号" rules={[{ required: true, message: "请输入工号" }]}>
            <Input placeholder="请输入工号" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="批量添加白名单" open={batchModalOpen} onOk={handleBatchAdd} onCancel={() => setBatchModalOpen(false)} destroyOnClose>
        <Form form={batchForm} layout="vertical">
          <Form.Item name="employeeIds" label="工号列表" rules={[{ required: true, message: "请输入工号" }]}>
            <Input.TextArea rows={6} placeholder="每行一个工号，或用逗号分隔" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
