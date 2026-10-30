import React from 'react'
import { Form, Input, Select, Button, Space } from 'antd'
import type { UserType } from '../types/demo'

export interface UserInfo {
  userId: string
  userType: UserType
  level: string
  department: string
}

interface Props {
  value: UserInfo
  onChange: (info: UserInfo) => void
}

const USER_TYPE_OPTIONS: { label: string; value: UserType }[] = [
  { label: 'EMPLOYEE', value: 'EMPLOYEE' },
  { label: 'CONTRACTOR', value: 'CONTRACTOR' },
  { label: 'INTERN', value: 'INTERN' },
]

const UserInfoForm: React.FC<Props> = ({ value, onChange }) => {
  const [form] = Form.useForm<UserInfo>()

  React.useEffect(() => {
    form.setFieldsValue(value)
  }, [value, form])

  const handleApply = () => {
    const values = form.getFieldsValue()
    onChange(values)
  }

  return (
    <Form form={form} layout="inline" initialValues={value} style={{ marginBottom: 16 }}>
      <Form.Item<UserInfo> name="userId" label="用户ID" rules={[{ required: true }]}>
        <Input placeholder="例如: user001" style={{ width: 140 }} />
      </Form.Item>
      <Form.Item<UserInfo> name="userType" label="人员类型" rules={[{ required: true }]}>
        <Select options={USER_TYPE_OPTIONS} style={{ width: 150 }} />
      </Form.Item>
      <Form.Item<UserInfo> name="level" label="层级">
        <Input placeholder="例如: P6" style={{ width: 100 }} />
      </Form.Item>
      <Form.Item<UserInfo> name="department" label="部门">
        <Input placeholder="例如: 技术部" style={{ width: 130 }} />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleApply}>
            应用
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

export default UserInfoForm