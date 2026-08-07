import React, { useState, useEffect, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  fetchHelloWorld,
  fetchHash,
  fetchBubbleSort,
  exportResult,
  fetchTrackStatistics,
} from './api/index.js'

/**
 * 主应用组件：功能演示页 + 埋点可视化报表。
 */
function App() {
  const [activeTab, setActiveTab] = useState('helloworld')

  // HelloWorld 状态
  const [helloResult, setHelloResult] = useState(null)
  const [helloLoading, setHelloLoading] = useState(false)

  // Hash 状态
  const [hashInput, setHashInput] = useState('hello world')
  const [hashResult, setHashResult] = useState(null)
  const [hashLoading, setHashLoading] = useState(false)

  // BubbleSort 状态
  const [sortInput, setSortInput] = useState('5,3,8,1,9,2,7')
  const [sortResult, setSortResult] = useState(null)
  const [sortLoading, setSortLoading] = useState(false)

  // 图表状态
  const [dimension, setDimension] = useState('user_type')
  const [pieData, setPieData] = useState(null)
  const [barData, setBarData] = useState(null)
  const [lineData, setLineData] = useState(null)
  const [chartLoading, setChartLoading] = useState(false)

  const [error, setError] = useState('')

  // ---- Tab 1: HelloWorld ----
  const handleHelloWorld = useCallback(async () => {
    setHelloLoading(true)
    setError('')
    try {
      const data = await fetchHelloWorld()
      setHelloResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setHelloLoading(false)
    }
  }, [])

  // ---- Tab 2: Hash ----
  const handleHash = useCallback(async () => {
    if (!hashInput.trim()) {
      setError('请输入待哈希的字符串')
      return
    }
    setHashLoading(true)
    setError('')
    try {
      const data = await fetchHash(hashInput)
      setHashResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setHashLoading(false)
    }
  }, [hashInput])

  // ---- Tab 3: BubbleSort ----
  const handleBubbleSort = useCallback(async () => {
    if (!sortInput.trim()) {
      setError('请输入待排序的数字串')
      return
    }
    setSortLoading(true)
    setError('')
    try {
      const data = await fetchBubbleSort(sortInput)
      setSortResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSortLoading(false)
    }
  }, [sortInput])

  // ---- 导出 ----
  const handleExport = useCallback(() => {
    const exportMap = {
      helloworld: { type: 'helloworld', input: null },
      hash: { type: 'hash', input: hashInput },
      'bubble-sort': { type: 'bubble-sort', input: sortInput },
    }
    const cfg = exportMap[activeTab]
    if (!cfg) return

    // bubble-sort 类型对应导出参数为 bubble-sort
    exportResult(cfg.type, cfg.input)
  }, [activeTab, hashInput, sortInput])

  // ---- 图表数据加载 ----
  const loadAllCharts = useCallback(async () => {
    setChartLoading(true)
    setError('')
    try {
      const [pie, bar, line] = await Promise.all([
        fetchTrackStatistics(dimension, 'pie'),
        fetchTrackStatistics(dimension, 'bar'),
        fetchTrackStatistics(dimension, 'line'),
      ])
      setPieData(pie)
      setBarData(bar)
      setLineData(line)
    } catch (err) {
      setError(err.message)
    } finally {
      setChartLoading(false)
    }
  }, [dimension])

  useEffect(() => {
    loadAllCharts()
  }, [loadAllCharts])

  // ---- ECharts 配置生成 ----

  /** 饼图配置 */
  const getPieOption = () => {
    if (!pieData || !pieData.categoryData) return {}
    const seriesData = pieData.categoryData.map((item) => ({
      name: item.dimensionValue,
      value: item.callCount,
    }))
    return {
      title: { text: '调用占比（饼图）', left: 'center' },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [
        {
          name: '调用次数',
          type: 'pie',
          radius: '60%',
          data: seriesData,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } },
        },
      ],
    }
  }

  /** 柱状图配置 */
  const getBarOption = () => {
    if (!barData || !barData.categoryData) return {}
    const categories = barData.categoryData.map((item) => item.dimensionValue)
    const values = barData.categoryData.map((item) => item.callCount)
    return {
      title: { text: '调用次数（柱状图）', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: categories, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{ name: '调用次数', type: 'bar', data: values, itemStyle: { color: '#1890ff' } }],
    }
  }

  /** 折线图配置 */
  const getLineOption = () => {
    if (!lineData || !lineData.timeSeriesData) return {}
    // 按维度值分组
    const dimensionMap = new Map()
    const dateSet = new Set()
    lineData.timeSeriesData.forEach((item) => {
      dateSet.add(item.date)
      if (!dimensionMap.has(item.dimensionValue)) {
        dimensionMap.set(item.dimensionValue, new Map())
      }
      dimensionMap.get(item.dimensionValue).set(item.date, item.callCount)
    })

    const dates = Array.from(dateSet).sort()
    const series = []
    dimensionMap.forEach((dateCountMap, dimValue) => {
      series.push({
        name: dimValue,
        type: 'line',
        data: dates.map((d) => dateCountMap.get(d) || 0),
        smooth: true,
      })
    })

    return {
      title: { text: '调用趋势（折线图）', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      xAxis: { type: 'category', data: dates, boundaryGap: false },
      yAxis: { type: 'value', minInterval: 1 },
      series,
    }
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>图书管理系统 - 功能演示与调用统计</h1>
        <p>HelloWorld · 哈希算法 · 冒泡排序 · 埋点可视化</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Tab 栏 */}
      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === 'helloworld' ? 'active' : ''}`}
          onClick={() => setActiveTab('helloworld')}
        >
          HelloWorld
        </button>
        <button
          className={`tab-item ${activeTab === 'hash' ? 'active' : ''}`}
          onClick={() => setActiveTab('hash')}
        >
          哈希算法
        </button>
        <button
          className={`tab-item ${activeTab === 'bubble-sort' ? 'active' : ''}`}
          onClick={() => setActiveTab('bubble-sort')}
        >
          冒泡排序
        </button>
      </div>

      {/* 工具栏：导出按钮 */}
      <div className="toolbar">
        <button className="btn btn-export" onClick={handleExport}>
          📥 导出当前结果
        </button>
      </div>

      {/* Tab 内容 */}
      {activeTab === 'helloworld' && (
        <div className="card">
          <h2>HelloWorld 接口</h2>
          <button className="btn btn-primary" onClick={handleHelloWorld} disabled={helloLoading}>
            {helloLoading ? '执行中...' : '执行 HelloWorld'}
          </button>
          {helloResult && (
            <div className="result-area" style={{ marginTop: 16 }}>
              <div>
                <span className="result-label">消息：</span>
                <span className="result-value">{helloResult.message}</span>
              </div>
              <div>
                <span className="result-label">时间：</span>
                <span className="result-value">{helloResult.timestamp}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'hash' && (
        <div className="card">
          <h2>哈希算法接口（SHA-256）</h2>
          <div className="input-group">
            <label>输入字符串：</label>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="请输入需要哈希的字符串"
            />
            <button className="btn btn-primary" onClick={handleHash} disabled={hashLoading}>
              {hashLoading ? '计算中...' : '计算哈希'}
            </button>
          </div>
          {hashResult && (
            <div className="result-area">
              <div>
                <span className="result-label">原始输入：</span>
                <span className="result-value">{hashResult.input}</span>
              </div>
              <div>
                <span className="result-label">算法：</span>
                <span className="result-value">{hashResult.algorithm}</span>
              </div>
              <div>
                <span className="result-label">哈希值：</span>
                <span className="result-value">{hashResult.hashValue}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bubble-sort' && (
        <div className="card">
          <h2>冒泡排序接口</h2>
          <div className="input-group">
            <label>数字串：</label>
            <input
              type="text"
              value={sortInput}
              onChange={(e) => setSortInput(e.target.value)}
              placeholder="逗号分隔的数字，如 5,3,8,1,9"
            />
            <button className="btn btn-primary" onClick={handleBubbleSort} disabled={sortLoading}>
              {sortLoading ? '排序中...' : '执行排序'}
            </button>
          </div>
          {sortResult && (
            <div className="result-area">
              <div>
                <span className="result-label">排序前：</span>
                <span className="result-value">
                  [{sortResult.input.join(', ')}]
                </span>
              </div>
              <div>
                <span className="result-label">排序后：</span>
                <span className="result-value">
                  [{sortResult.output.join(', ')}]
                </span>
              </div>
              <div>
                <span className="result-label">数组长度：</span>
                <span className="result-value">{sortResult.size}</span>
              </div>
              <div>
                <span className="result-label">耗时：</span>
                <span className="result-value">{sortResult.costMs} ms</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 埋点可视化报表 */}
      <div className="chart-section">
        <h2>📊 调用统计报表</h2>
        <div className="chart-controls">
          <label>统计维度：</label>
          <select value={dimension} onChange={(e) => setDimension(e.target.value)}>
            <option value="user_type">人员类型</option>
            <option value="user_level">人员层级</option>
            <option value="user_department">人员部门</option>
            <option value="user_id">调用人</option>
          </select>
          <button className="btn btn-primary" onClick={loadAllCharts} disabled={chartLoading}>
            {chartLoading ? '加载中...' : '刷新数据'}
          </button>
        </div>

        {chartLoading ? (
          <div className="loading">数据加载中...</div>
        ) : (
          <div className="chart-grid">
            <div className="chart-item card">
              <ReactECharts option={getPieOption()} className="chart-box" />
            </div>
            <div className="chart-item card">
              <ReactECharts option={getBarOption()} className="chart-box" />
            </div>
          </div>
        )}

        {!chartLoading && (
          <div className="chart-grid full-width" style={{ marginTop: 24 }}>
            <div className="chart-item card">
              <ReactECharts option={getLineOption()} className="chart-box" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
