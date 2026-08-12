import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import DimensionFilter from './components/DimensionFilter';
import LaborCostChart from './components/LaborCostChart';
import ProjectCostChart from './components/ProjectCostChart';
import CostTable from './components/CostTable';
import ExportButton from './components/ExportButton';
import { getCostDashboard, getCostStat } from '../../api/cost';
import type { CostStatQuery, CostDashboardVO, CostRecordDTO } from '../../types/cost';

export default function CostDashboard() {
  const [query, setQuery] = useState<CostStatQuery>({ dimension: 'DEPT', timeDimension: 'MONTH' });
  const [dashboard, setDashboard] = useState<CostDashboardVO | null>(null);
  const [records, setRecords] = useState<CostRecordDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, statRes] = await Promise.all([
        getCostDashboard(query),
        getCostStat(query),
      ]);
      setDashboard(dashRes.data);
      setRecords(statRes.data);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Spin spinning={loading}>
      <Card title="成本统计 Dashboard" extra={<ExportButton query={query} />}>
        <DimensionFilter value={query} onChange={(v) => setQuery({ ...query, ...v })} />
      </Card>
      {dashboard && (
        <>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={5}>
              <Card><Statistic title="人力成本合计" value={dashboard.summary.totalLaborCost} precision={2} /></Card>
            </Col>
            <Col span={5}>
              <Card><Statistic title="项目预算合计" value={dashboard.summary.totalProjectBudget} precision={2} /></Card>
            </Col>
            <Col span={5}>
              <Card><Statistic title="实际消耗合计" value={dashboard.summary.totalActualCost} precision={2} /></Card>
            </Col>
            <Col span={5}>
              <Card><Statistic title="预算占比" value={dashboard.summary.overallBudgetRatio * 100} precision={2} suffix="%" /></Card>
            </Col>
            <Col span={4}>
              <Card><Statistic title="预计超支合计" value={dashboard.summary.totalEstimatedOverspend} precision={2} /></Card>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}><Card><LaborCostChart data={dashboard.laborCosts} /></Card></Col>
            <Col span={12}><Card><ProjectCostChart data={dashboard.projectCosts} /></Card></Col>
          </Row>
        </>
      )}
      <Card title="成本明细" style={{ marginTop: 16 }}>
        <CostTable data={records} loading={loading} />
      </Card>
    </Spin>
  );
}
