import { useState } from "react";
import { Button, Card, Empty, Radio, Spin } from "antd";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import ChartErrorBoundary from "@/components/ChartErrorBoundary";
import { useMetrics } from "@/hooks/useMetrics";
import type { Dimension, MetricsData } from "@/types/api";

const DIMENSION_OPTIONS: { value: Dimension; label: string }[] = [
  { value: "type", label: "Type" },
  { value: "level", label: "Level" },
  { value: "dept", label: "Dept" },
];

function buildTrendOption(data: MetricsData): EChartsOption {
  return {
    title: { text: "Daily Call Trend", left: "center" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: data.trend.map((p) => p.date) },
    yAxis: { type: "value" },
    series: [
      {
        type: "line",
        data: data.trend.map((p) => p.count),
        smooth: true,
      },
    ],
  };
}

function buildPieOption(data: MetricsData): EChartsOption {
  return {
    title: { text: "Distribution", left: "center" },
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: "60%",
        data: data.distribution.map((p) => ({
          name: p.name,
          value: p.count,
        })),
      },
    ],
  };
}

function buildBarOption(data: MetricsData): EChartsOption {
  return {
    title: { text: "Call Count Comparison", left: "center" },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: data.distribution.map((p) => p.name),
    },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: data.distribution.map((p) => p.count),
      },
    ],
  };
}

interface ChartCardProps {
  title: string;
  data: MetricsData;
  option: EChartsOption;
  fallbackLabel: string;
}

function ChartCard({ title, data, option, fallbackLabel }: ChartCardProps) {
  return (
    <Card size="small" title={title}>
      <ChartErrorBoundary
        fallback={{ label: fallbackLabel, distribution: data.distribution }}
      >
        <div className="chart-box">
          <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
        </div>
      </ChartErrorBoundary>
    </Card>
  );
}

/**
 * Metrics report container.
 *
 * - Radio.Group switches the dimension (type | level | dept); changing it
 *   re-fetches metrics via `useMetrics`.
 * - Renders three charts in a responsive row: line (trend), pie (distribution),
 *   bar (distribution comparison).
 * - Loading: Spin. Error: empty state + retry. No data: Empty.
 * - Chart render exceptions are caught by `ChartErrorBoundary`, which falls
 *   back to a text list of distribution items.
 */
export default function MetricsReport() {
  const [dimension, setDimension] = useState<Dimension>("type");
  const { loading, error, data, retry } = useMetrics(dimension);

  return (
    <Card title="Metrics Report" className="section-card">
      <Radio.Group
        value={dimension}
        onChange={(e) => setDimension(e.target.value as Dimension)}
        optionType="button"
        buttonStyle="solid"
        style={{ marginBottom: 16 }}
      >
        {DIMENSION_OPTIONS.map((opt) => (
          <Radio.Button key={opt.value} value={opt.value}>
            {opt.label}
          </Radio.Button>
        ))}
      </Radio.Group>

      {loading && (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spin />
        </div>
      )}

      {!loading && error && (
        <Empty
          description={error}
          style={{ padding: 32 }}
        >
          <Button onClick={retry}>Retry</Button>
        </Empty>
      )}

      {!loading && !error && (!data || data.trend.length === 0) && (
        <Empty description="No metrics data" style={{ padding: 32 }} />
      )}

      {!loading && !error && data && data.trend.length > 0 && (
        <div className="chart-row">
          <div className="chart-col">
            <ChartCard
              title="Trend"
              data={data}
              option={buildTrendOption(data)}
              fallbackLabel="Trend"
            />
          </div>
          <div className="chart-col">
            <ChartCard
              title="Distribution"
              data={data}
              option={buildPieOption(data)}
              fallbackLabel="Distribution"
            />
          </div>
          <div className="chart-col">
            <ChartCard
              title="Comparison"
              data={data}
              option={buildBarOption(data)}
              fallbackLabel="Comparison"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
