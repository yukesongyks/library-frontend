import { Form, InputNumber, Button, Space, Select } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { CostQueryRequest } from '../types/cost'

interface Props {
  onSearch: (params: CostQueryRequest) => void
  onExport: (params: CostQueryRequest) => void
}

const roleOptions = [
  { value: 'DEVELOPER', label: '开发' },
  { value: 'TESTER', label: '测试' },
  { value: 'PRODUCT', label: '产品' },
  { value: 'OPS', label: '运维' },
]

export default function DimensionFilter({ onSearch, onExport }: Props) {
  const [form] = Form.useForm<CostQueryRequest>()

  return (
    <Form
      form={form}
      layout="inline"
      onFinish={onSearch}
      initialValues={{ costYear: new Date().getFullYear() }}
    >
      <Form.Item name="departmentId" label="部门">
        <InputNumber placeholder="部门ID" min={1} />
      </Form.Item>
      <Form.Item name="businessLineId" label="业务线">
        <InputNumber placeholder="业务线ID" min={1} />
      </Form.Item>
      <Form.Item name="projectId" label="项目">
        <InputNumber placeholder="项目ID" min={1} />
      </Form.Item>
      <Form.Item name="costYear" label="年度">
        <InputNumber min={2020} max={2030} />
      </Form.Item>
      <Form.Item name="costMonth" label="月份">
        <InputNumber placeholder="1-12" min={1} max={12} />
      </Form.Item>
      <Form.Item name="role" label="角色">
        <Select allowClear placeholder="全部角色" options={roleOptions} style={{ width: 120 }} />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            查询
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => onExport(form.getFieldsValue())}>
            导出Excel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
