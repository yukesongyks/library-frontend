import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportCostReport } from '../../../api/cost';
import { downloadBlob } from '../../../api/request';
import type { CostStatQuery } from '../../../types/cost';

interface Props {
  query: CostStatQuery;
}

export default function ExportButton({ query }: Props) {
  const handleExport = async () => {
    try {
      const blob = await exportCostReport(query);
      downloadBlob(blob, 'cost-report.xlsx');
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  return (
    <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
      导出报表
    </Button>
  );
}
