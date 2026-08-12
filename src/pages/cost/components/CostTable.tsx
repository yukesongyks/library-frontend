import { Table } from 'antd';
import type { CostRecordDTO } from '../../../types/cost';

interface Props {
  data: CostRecordDTO[];
  loading: boolean;
}

const columns = [
  { title: '部门', dataIndex: 'deptName' },
  { title: '项目', dataIndex: 'projectName' },
  { title: '业务线', dataIndex: 'businessLineName' },
  { title: '人员', dataIndex: 'personName' },
  { title: '角色', dataIndex: 'laborRole' },
  { title: '金额(元)', dataIndex: 'amount', render: (v: number) => v.toFixed(2) },
  { title: '日期', dataIndex: 'costDate' },
];

export default function CostTable({ data, loading }: Props) {
  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 20 }}
    />
  );
}
