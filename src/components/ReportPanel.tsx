import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { fetchMetrics, MetricItem, Dimension } from "../api";

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: "userType", label: "人员类型" },
  { value: "userLevel", label: "人员层级" },
  { value: "department", label: "人员部门" },
  { value: "apiName", label: "接口名称" },
];

export default function ReportPanel() {
  const [dimension, setDimension] = useState<Dimension>("department");
  const [lineData, setLineData] = useState<MetricItem[]>([]);
  const [pieData, setPieData] = useState<MetricItem[]>([]);
  const [barData, setBarData] = useState<MetricItem[]>([]);
  const [error, setError] = useState("");

  const lineRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimension]);

  useEffect(() => {
    if (lineRef.current && lineData.length > 0) {
      const chart = echarts.init(lineRef.current);
      chart.setOption({
        title: { text: "调用趋势（折线图）", left: "center", textStyle: { fontSize: 14 } },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: lineData.map((d) => d.label) },
        yAxis: { type: "value" },
        series: [{ data: lineData.map((d) => d.value), type: "line", smooth: true }],
      });
      return () => chart.dispose();
    }
  }, [lineData]);

  useEffect(() => {
    if (pieRef.current && pieData.length > 0) {
      const chart = echarts.init(pieRef.current);
      chart.setOption({
        title: { text: "维度占比（饼图）", left: "center", textStyle: { fontSize: 14 } },
        tooltip: { trigger: "item" },
        series: [
          {
            type: "pie",
            radius: "60%",
            data: pieData.map((d) => ({ name: d.label, value: d.value })),
          },
        ],
      });
      return () => chart.dispose();
    }
  }, [pieData]);

  useEffect(() => {
    if (barRef.current && barData.length > 0) {
      const chart = echarts.init(barRef.current);
      chart.setOption({
        title: { text: "维度对比（柱状图）", left: "center", textStyle: { fontSize: 14 } },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: barData.map((d) => d.label) },
        yAxis: { type: "value" },
        series: [{ data: barData.map((d) => d.value), type: "bar" }],
      });
      return () => chart.dispose();
    }
  }, [barData]);

  const loadData = async () => {
    try {
      setError("");
      const [line, pie, bar] = await Promise.all([
        fetchMetrics(dimension, "line"),
        fetchMetrics(dimension, "pie"),
        fetchMetrics(dimension, "bar"),
      ]);
      setLineData(line);
      setPieData(pie);
      setBarData(bar);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="reports">
      <h2>调用情况报表</h2>
      <div className="dimension-select">
        <label>维度： </label>
        <select
          value={dimension}
          onChange={(e) => setDimension(e.target.value as Dimension)}
        >
          {DIMENSIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <button style={{ marginLeft: 8 }} onClick={loadData}>刷新</button>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div className="chart-grid">
        <div className="chart-item">
          <h3>折线图</h3>
          <div ref={lineRef} className="chart-container"></div>
        </div>
        <div className="chart-item">
          <h3>饼图</h3>
          <div ref={pieRef} className="chart-container"></div>
        </div>
        <div className="chart-item">
          <h3>柱状图</h3>
          <div ref={barRef} className="chart-container"></div>
        </div>
      </div>
    </div>
  );
}
