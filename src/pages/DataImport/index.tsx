import React, { useState } from 'react';
import { Card, Upload, Button, Table, Alert, message, Space, Typography } from 'antd';
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { downloadImportTemplate, importCostExcel, ImportResult } from '../../api/cost';

const { Dragger } = Upload;
const { Text } = Typography;

const DataImport: React.FC = () => {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '成本导入模板.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { message.error('下载模板失败'); }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const res = await importCostExcel(file);
      setResult(res.data);
      message.success(`导入完成：成功 ${res.data.successCount} 条`);
    } catch { /* handled */ }
    finally { setLoading(false); }
    return false;
  };

  const failColumns = [
    { title: '行号', dataIndex: 'rowNum', key: 'rowNum' },
    { title: '失败原因', dataIndex: 'reason', key: 'reason' },
  ];

  return (
    <div>
      <Card title="数据导入" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>下载导入模板</Button>
          <Dragger
            accept=".xlsx,.xls"
            beforeUpload={handleUpload}
            showUploadList={false}
            disabled={loading}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">点击或拖拽 Excel 文件到此区域上传</p>
            <p className="ant-upload-hint">仅支持 .xlsx / .xls 格式</p>
          </Dragger>
        </Space>
      </Card>

      {result && (
        <Card title="导入结果">
          <Alert
            type={result.failCount === 0 ? 'success' : 'warning'}
            message={`总计 ${result.totalCount} 条，成功 ${result.successCount} 条，失败 ${result.failCount} 条`}
            style={{ marginBottom: 16 }}
          />
          {result.failDetails.length > 0 && (
            <Table
              dataSource={result.failDetails}
              columns={failColumns}
              rowKey="rowNum"
              size="small"
              pagination={false}
              title={() => <Text strong>失败明细</Text>}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default DataImport;
