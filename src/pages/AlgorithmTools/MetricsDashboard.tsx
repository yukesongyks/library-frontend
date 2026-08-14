import { useState, useEffect, useCallback } from 'react';
import { Card, Select, Radio, DatePicker, Space, Spin, Typography, Statistic, Row, Col } from 'antd';
import ReactECharts from 'echarts-for-react';
import { getMetrics } from '../../api/metrics';
import type { MetricsData } from '../../types/algorithm';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const DIMENSIONS = [
  { value: 'caller_type', label: '人员类型' },
  { value: 'caller_level', label: '人员层级' },
  { value: 'caller_dept', label: '人员部门' },
];

const CHART_TYPES = [
  { value: 'line', label: '折线图' },
  { value: 'pie', label: '饼图' },
  { value: 'bar', label: '柱状图' },
];

export default function MetricsDashboard() {
  const [dimension, setDimension] = useState('caller_type');
  const [chartType, setChartType] = useState('bar');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMetrics({
        dimension,
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
      });
      setData(result);
    } catch {
      // silently fail for dashboard
    } finally {
      setLoading(false);
    }
  }, [dimension, dateRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const getChartOption = () => {
    if (!data) return {};

    if (chartType === 'pie') {
      return {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          type: 'pie',
          radius: '50%',
          data: data.breakdown.map((item) => ({
            name: item.label,
            value: item.count,
          })),
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
          },
        }],
      };
    }

    const xData = data.trend.map((t) => t.date);
    const yData = data.trend.map((t) => t.count);

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: data.breakdown.map((b) => b.label) },
      xAxis: chartType === 'bar'
        ? { type: 'category', data: data.breakdown.map((b) => b.label) }
        : { type: 'category', data: xData },
      yAxis: { type: 'value' },
      series: chartType === 'bar'
        ? [{
            type: 'bar',
            data: data.breakdown.map((b) => ({
              name: b.label,
              value: b.count,
            })),
            label: { show: true, position: 'top' },
          }]
        : [{ type: 'line', data: yData, smooth: true, areaStyle: {} }],
    };
  };

  return (
    <Card title="调用分析报表" style={{ marginTop: 24 }}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Text strong>统计维度：</Text>
        <Select
          value={dimension}
          onChange={setDimension}
          options={DIMENSIONS}
          style={{ width: 140 }}
        />
        <Text strong>图表类型：</Text>
        <Radio.Group
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          options={CHART_TYPES}
          optionType="button"
        />
        <RangePicker
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([
                dates[0].format('YYYY-MM-DD'),
                dates[1].format('YYYY-MM-DD'),
              ]);
            } else {
              setDateRange(null);
            }
          }}
        />
      </Space>

      {data && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic title="总调用次数" value={data.total} />
          </Col>
        </Row>
      )}

      <Spin spinning={loading}>
        <ReactECharts option={getChartOption()} style={{ height: 400 }} />
      </Spin>
    </Card>
  );
}