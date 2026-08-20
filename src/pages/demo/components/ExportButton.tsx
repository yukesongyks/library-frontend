import React, { useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportData } from '../../services/demoApi';

interface ExportButtonProps {
  type: 'helloworld' | 'hash' | 'bubble-sort';
}

const ExportButton: React.FC<ExportButtonProps> = ({ type }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportData(type);
      message.success('导出成功');
    } catch (err) {
      message.error('导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      loading={loading}
      onClick={handleExport}
    >
      导出 Excel
    </Button>
  );
};

export default ExportButton;
