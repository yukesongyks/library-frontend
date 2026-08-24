import React, { useState, useEffect, useCallback } from 'react';
import { Card, Space, Typography, DatePicker, Alert, Spin, Empty } from 'antd';
import { Line, Pie, Column } from '@ant-design/charts';
import { OneSegmented } from '../../components';
import { fetchInvocationStats } from '../../services/dtcoderApi';
import type { StatsDimension, InvocationStat } from '../../types';
import dayjs from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;

type ChartType = 'line' | 'pie' | 'bar';

const DIMENSION_OPTIONS: { label: string; value: StatsDimension }[] = [
  { label: '人员类型', value: 'personType' },
  { label: '层级', value: 'level' },
  { label: '部门', value: 'department' },
];

const CHART_OPTIONS: { label: string; value: ChartType }[] = [
  { label: '折线图', value: 'line' },
  { label: '饼图', value: 'pie' },
  { label: '柱状图', value: 'bar' },
];

/**
 * InvocationStats - 调用统计图表组件
 * 支持按人员类型/层级/部门维度筛选，展示折线图/饼图/柱状图
 */
function InvocationStats() {
  const [dimension, setDimension] = useState<StatsDimension>('personType');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [data, setData] = useState<InvocationStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchInvocationStats({
        dimension,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      });
      if (response.code === 200) {
        setData(response.data);
      } else {
        setError(response.message || '查询失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求异常');
    } finally {
      setLoading(false);
    }
  }, [dimension, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const renderChart = () => {
    if (data.length === 0) {
      return <Empty description="暂无数据" />;
    }

    const chartData = data.map((item) => ({
      label: item.label,
      count: item.count,
      date: item.date || item.label,
    }));

    if (chartType === 'line') {
      return (
        <Line
          data={chartData}
          xField="date"
          yField="count"
          seriesField="label"
          smooth
          height={350}
          axis={{
            x: { title: '日期' },
            y: { title: '调用次数' },
          }}
        />
      );
    }

    if (chartType === 'pie') {
      return (
        <Pie
          data={chartData}
          angleField="count"
          colorField="label"
          radius={0.8}
          innerRadius={0.5}
          height={350}
          label={{
            text: 'label',
            position: 'outside',
          }}
          legend={{ position: 'right' }}
        />
      );
    }

    return (
      <Column
        data={chartData}
        xField="label"
        yField="count"
        height={350}
        axis={{
          x: { title: '分类' },
          y: { title: '调用次数' },
        }}
      />
    );
  };

  return (
    <Card title="调用统计" bordered={false} style={{ marginTop: 16 }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Space>
            <Text>维度：</Text>
            <OneSegmented
              options={DIMENSION_OPTIONS}
              value={dimension}
              onChange={setDimension}
            />
          </Space>
          <Space>
            <Text>图表：</Text>
            <OneSegmented
              options={CHART_OPTIONS}
              value={chartType}
              onChange={setChartType}
            />
          </Space>
          <Space>
            <Text>日期：</Text>
            <RangePicker
              value={dateRange}
              onChange={handleDateChange}
              format="YYYY-MM-DD"
            />
          </Space>
        </Space>

        <Spin spinning={loading}>
          {error && <Alert type="error" message={error} showIcon />}
          {renderChart()}
        </Spin>
      </Space>
    </Card>
  );
}

export default InvocationStats;
