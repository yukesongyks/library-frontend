import React, { useState } from 'react';
import { Card, Space, Typography } from 'antd';
import FilterBar from '../../components/FilterBar';
import ExportButton from '../../components/ExportButton';
import { AnalysisParams } from '../../api/report';

const { Paragraph } = Typography;

const ReportExport: React.FC = () => {
  const [params, setParams] = useState<AnalysisParams>({});

  return (
    <Card title="报表导出">
      <Paragraph>选择筛选条件后，点击导出按钮生成 Excel 文件。导出内容包含：汇总、明细、项目成本、人力成本四个 Sheet。</Paragraph>
      <FilterBar onSearch={setParams} showCostType showRoleType showTimeGranularity />
      <Space style={{ marginTop: 16 }}>
        <ExportButton params={params} />
      </Space>
    </Card>
  );
};

export default ReportExport;
