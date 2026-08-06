import { Modal, Form, Input, DatePicker, Select, message } from "antd";
import { useEffect } from "react";
import type { Employee, EmployeeFormData } from "../../types/staff";

interface Props {
  open: boolean;
  editingEmployee: Employee | null;
  onCancel: () => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
}

export default function EmployeeFormModal({ open, editingEmployee, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<EmployeeFormData>();

  useEffect(() => {
    if (open) {
      if (editingEmployee) {
        form.setFieldsValue({
          ...editingEmployee,
          hireDate: editingEmployee.hireDate,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingEmployee, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      message.success(editingEmployee ? "更新成功" : "新增成功");
      onCancel();
    } catch (err: any) {
      if (err?.errorFields) return; // validation error
      message.error(err?.message || "操作失败");
    }
  };

  return (
    <Modal
      title={editingEmployee ? "编辑员工" : "新增员工"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      width={640}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="employeeId" label="工号" rules={[{ required: true, message: "请输入工号" }, { whitespace: true, message: "工号不能为纯空格" }]}>
          <Input disabled={!!editingEmployee} placeholder="请输入工号" />
        </Form.Item>
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: "请输入姓名" }]}>
          <Input placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item name="department" label="部门" rules={[{ required: true, message: "请输入部门" }]}>
          <Input placeholder="请输入部门" />
        </Form.Item>
        <Form.Item name="position" label="职位" rules={[{ required: true, message: "请输入职位" }]}>
          <Input placeholder="请输入职位" />
        </Form.Item>
        <Form.Item name="hireDate" label="入职日期" rules={[{ required: true, message: "请选择入职日期" }]}>
          <DatePicker style={{ width: "100%" }} placeholder="请选择日期" />
        </Form.Item>
        <Form.Item name="contactInfo" label="联系方式" rules={[{ required: true, message: "请输入联系方式" }, { pattern: /^1[3-9]\d{9}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "请输入有效的手机号或邮箱" }]}>
          <Input placeholder="手机号或邮箱" />
        </Form.Item>
        <Form.Item name="skills" label="技能标签">
          <Select mode="tags" placeholder="输入后回车添加" />
        </Form.Item>
        <Form.Item name="certifications" label="资质证书">
          <Select mode="tags" placeholder="输入后回车添加" />
        </Form.Item>
        <Form.Item name="projectExperience" label="项目经验备注">
          <Input.TextArea rows={3} placeholder="选填" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
