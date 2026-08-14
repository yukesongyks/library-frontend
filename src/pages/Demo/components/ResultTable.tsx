import React from 'react';
import { Table, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface ResultTableProps<T> {
  columns: ColumnsType<T>;
  dataSource: T[];
  loading?: boolean;
  rowKey?: string;
}

function ResultTable<T extends Record<string, unknown>>({
  columns,
  dataSource,
  loading = false,
  rowKey = 'timestamp',
}: ResultTableProps<T>) {
  if (!dataSource.length && !loading) {
    return <Empty description="暂无数据，请先执行接口调用" />;
  }

  return (
    <Table<T>
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey={rowKey}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      size="middle"
      scroll={{ x: 'max-content' }}
    />
  );
}

export default ResultTable;
