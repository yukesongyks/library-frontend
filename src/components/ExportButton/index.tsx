import React, { useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportCostReport } from '../../api/export';

interface ExportButtonProps {
  dimension: string;
  timeDimension?: string;
  startDate?: string;
  endDate?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  dimension, timeDimension, startDate, endDate,
}) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportCostReport({ dimension, timeDimension, startDate, endDate });
      message.success('导出成功');
    } catch {
      message.error('导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="primary" icon={<DownloadOutlined />} loading={loading} onClick={handleExport}>
      导出报表
    </Button>
  );
};

export default ExportButton;
