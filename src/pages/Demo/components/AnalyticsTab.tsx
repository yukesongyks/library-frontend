import React, { useState, useEffect, useCallback } from 'react';
import { Card, Select, DatePicker, Space, Row, Col, Statistic, Segmented, Spin, Empty } from 'antd';
import {
  TeamOutlined,
  ApiOutlined,
  CalendarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { getAnalyticsSummary, getAnalyticsTrend } from '../services/demoApi';
import type {
  AnalyticsDimension,
  ApiType,
  Granularity,
  AnalyticsSummaryData,
  AnalyticsTrendData,
} from '../types/demo';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';
import BarChart from './charts/BarChart';

const { RangePicker } = DatePicker;

type ChartType = 'line' | 'pie' | 'bar';

const AnalyticsTab: React.FC = () => {
  const [dimension, setDimension] = useState<AnalyticsDimension>('DEPARTMENT');
  const [apiType, setApiType] = useState<ApiType | ''>('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [granularity, setGranularity] = useState<Granularity>('DAY');
  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null);
  const [trend, setTrend] = useState<AnalyticsTrendData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, trendRes] = await Promise.all([
        getAnalyticsSummary({
          dimension,
          apiType: apiType || undefined,
        }),
        getAnalyticsTrend({
          apiType: apiType || undefined,
          granularity,
        }),
      ]);
      setSummary(summaryRes.data);
      setTrend(trendRes.data);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [dimension, apiType, granularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Spin spinning={loading}>
      {/* 筛选区 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Space>
            <span>维度：</span>
            <Select
              value={dimension}
              onChange={setDimension}
              style={{ width: 140 }}
              options={[
                { label: '人员类型', value: 'PERSON_TYPE' },
                { label: '人员层级', value: 'PERSON_LEVEL' },
                { label: '人员部门', value: 'DEPARTMENT' },
                { label: '日期', value: 'DATE' },
              ]}
            />
          </Space>
          <Space>
            <span>接口：</span>
            <Select
              value={apiType}
              onChange={setApiType}
              style={{ width: 140 }}
              options={[
                { label: '全部', value: '' },
                { label: 'HelloWorld', value: 'HELLOWORLD' },
                { label: '哈希算法', value: 'HASH' },
                { label: '冒泡排序', value: 'BUBBLE_SORT' },
              ]}
            />
          </Space>
          <Space>
            <span>粒度：</span>
            <Select
              value={granularity}
              onChange={setGranularity}
              style={{ width: 100 }}
              options={[
                { label: '日', value: 'DAY' },
                { label: '周', value: 'WEEK' },
                { label: '月', value: 'MONTH' },
              ]}
            />
          </Space>
          <RangePicker />
        </Space>
      </Card>

      {/* 汇总卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总调用次数"
              value={summary?.totalCount ?? 0}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="维度分类数"
              value={summary?.items?.length ?? 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最活跃分类"
              value={summary?.items?.[0]?.label ?? '-'}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据范围"
              value={summary?.dateRange ? `${summary.dateRange.start} ~ ${summary.dateRange.end}` : '-'}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表展示区 */}
      <Card
        title="数据可视化"
        extra={
          <Segmented
            value={chartType}
            onChange={(val) => setChartType(val as ChartType)}
            options={[
              { label: '📈 折线图', value: 'line' },
              { label: '🥧 饼图', value: 'pie' },
              { label: '📊 柱状图', value: 'bar' },
            ]}
          />
        }
      >
        {chartType === 'line' && trend && trend.series.length > 0 && (
          <LineChart series={trend.series} />
        )}
        {chartType === 'pie' && summary && summary.items.length > 0 && (
          <PieChart items={summary.items} title={`按${dimension === 'DEPARTMENT' ? '部门' : dimension === 'PERSON_TYPE' ? '人员类型' : dimension === 'PERSON_LEVEL' ? '层级' : '日期'}分布`} />
        )}
        {chartType === 'bar' && summary && summary.items.length > 0 && (
          <BarChart items={summary.items} title={`按${dimension === 'DEPARTMENT' ? '部门' : dimension === 'PERSON_TYPE' ? '人员类型' : dimension === 'PERSON_LEVEL' ? '层级' : '日期'}调用次数`} />
        )}
        {((chartType === 'line' && (!trend || trend.series.length === 0)) ||
          ((chartType === 'pie' || chartType === 'bar') && (!summary || summary.items.length === 0))) && (
          <Empty description="暂无统计数据" />
        )}
      </Card>
    </Spin>
  );
};

export default AnalyticsTab;
