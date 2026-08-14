import React, { useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportReport, AnalysisParams } from '../../api/report';

interface ExportButtonProps {
  params: AnalysisParams;
}

const ExportButton: React.FC<ExportButtonProps> = ({ params }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await exportReport(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '成本统计报表.xlsx'; a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="primary" icon={<DownloadOutlined />} loading={loading} onClick={handleExport}>
      导出 Excel
    </Button>
  );
};

export default ExportButton;
