import React, { useState, useEffect, useCallback } from 'react';
import { Card, Select, DatePicker, Radio, Space, Row, Col, Spin, message } from 'antd';
import { fetchAnalytics } from '../../services/demoApi';
import type { AnalyticsData } from '../../types/demo';
import ChartPanel from './components/ChartPanel';
import StatsCard from './components/StatsCard';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const AnalyticsTab: React.FC = () => {
  const [dimension, setDimension] = useState<'personnelType' | 'personnelLevel' | 'department'>('department');
  const [apiType, setApiType] = useState<string>('all');
  const [chartType, setChartType] = useState<'line' | 'pie' | 'bar'>('bar');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAnalytics({
        dimension,
        apiType: apiType as any,
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
        chartType,
      });
      if (res.code === 200) {
        setData(res.data);
      } else {
        message.error(res.message);
      }
    } catch {
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  }, [dimension, apiType, chartType, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 筛选区域 */}
      <Card title="筛选条件">
        <Space wrap>
          <Space>
            <span>统计维度:</span>
            <Select value={dimension} onChange={setDimension} style={{ width: 140 }}>
              <Select.Option value="department">人员部门</Select.Option>
              <Select.Option value="personnelType">人员类型</Select.Option>
              <Select.Option value="personnelLevel">人员层级</Select.Option>
            </Select>
          </Space>
          <Space>
            <span>接口类型:</span>
            <Select value={apiType} onChange={setApiType} style={{ width: 140 }}>
              <Select.Option value="all">全部</Select.Option>
              <Select.Option value="helloworld">HelloWorld</Select.Option>
              <Select.Option value="hash">哈希算法</Select.Option>
              <Select.Option value="bubble-sort">冒泡排序</Select.Option>
            </Select>
          </Space>
          <Space>
            <span>日期范围:</span>
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
          <Space>
            <span>图表类型:</span>
            <Radio.Group value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <Radio.Button value="bar">柱状图</Radio.Button>
              <Radio.Button value="pie">饼图</Radio.Button>
              <Radio.Button value="line">折线图</Radio.Button>
            </Radio.Group>
          </Space>
        </Space>
      </Card>

      {/* 统计卡片 */}
      {data && (
        <Row gutter={16}>
          <Col span={6}>
            <StatsCard title="总调用次数" value={data.totalCalls} />
          </Col>
          <Col span={6}>
            <StatsCard title="今日调用" value={data.todayCalls} />
          </Col>
          <Col span={6}>
            <StatsCard title="活跃用户数" value={data.activeUsers} />
          </Col>
          <Col span={6}>
            <StatsCard title="平均响应耗时" value={data.avgDurationMs} suffix="ms" precision={2} />
          </Col>
        </Row>
      )}

      {/* 图表区域 */}
      <Card title="调用统计图表">
        <Spin spinning={loading}>
          {data ? (
            <ChartPanel chartType={chartType} data={data} />
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              暂无数据，请先调用接口产生埋点数据
            </div>
          )}
        </Spin>
      </Card>
    </Space>
  );
};

export default AnalyticsTab;
