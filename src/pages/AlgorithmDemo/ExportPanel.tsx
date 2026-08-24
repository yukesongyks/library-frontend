import React, { useState } from 'react';
import { Card, Space, Typography, Alert, Spin } from 'antd';
import { FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import { TextIconButton } from '../../components';
import { exportData } from '../../services/dtcoderApi';
import { downloadBlob, getExportFilename } from '../../utils/download';
import type { ExportFormat } from '../../types';

const { Text } = Typography;

/**
 * 导出面板 - 支持 excel/csv 格式 blob 下载
 */
function ExportPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleExport = async (format: ExportFormat) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const blob = await exportData({ format });
      const filename = getExportFilename(format);
      downloadBlob(blob, filename);
      setSuccess(`文件 ${filename} 已开始下载`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="数据导出" bordered={false} style={{ marginTop: 16 }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text type="secondary">
          调用 POST /api/dtcoder/export 接口，支持 Excel 和 CSV 格式下载
        </Text>
        <Space>
          <TextIconButton
            icon={<FileExcelOutlined />}
            onClick={() => handleExport('excel')}
            loading={loading}
          >
            导出 Excel
          </TextIconButton>
          <TextIconButton
            icon={<FileTextOutlined />}
            onClick={() => handleExport('csv')}
            loading={loading}
          >
            导出 CSV
          </TextIconButton>
        </Space>
        <Spin spinning={loading}>
          {error && <Alert type="error" message={error} showIcon />}
          {success && <Alert type="success" message={success} showIcon />}
        </Spin>
      </Space>
    </Card>
  );
}

export default ExportPanel;
