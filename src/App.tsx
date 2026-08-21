import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { downloadExport, getReport, runBubbleSort, runHash, runHelloWorld, type AlgorithmTab, type Report } from './api'

const tabs: { id: AlgorithmTab; label: string; eyebrow: string }[] = [
  { id: 'HELLO_WORLD', label: 'Hello World', eyebrow: '基础接口' },
  { id: 'HASH', label: '哈希算法', eyebrow: 'SHA-256' },
  { id: 'BUBBLE_SORT', label: '冒泡排序', eyebrow: '数字数组' },
]

function Chart({ option, className = '' }: { option: echarts.EChartsOption; className?: string }) {
  const element = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!element.current) return
    const chart = echarts.init(element.current)
    chart.setOption(option)
    const resize = () => chart.resize()
    window.addEventListener('resize', resize)
    return () => { window.removeEventListener('resize', resize); chart.dispose() }
  }, [option])
  return <div ref={element} className={`chart ${className}`} />
}

function App() {
  const [activeTab, setActiveTab] = useState<AlgorithmTab>('HELLO_WORLD')
  const [report, setReport] = useState<Report | null>(null)
  const [loadingReport, setLoadingReport] = useState(true)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [hashText, setHashText] = useState('')
  const [numbers, setNumbers] = useState('8, 3, 5, 1, 9, 2')
  const [direction, setDirection] = useState<'ASC' | 'DESC'>('ASC')
  const [breakdown, setBreakdown] = useState<'userType' | 'userLevel' | 'department'>('userType')
  const [result, setResult] = useState<unknown>(null)

  const refreshReport = () => {
    setLoadingReport(true)
    getReport().then(setReport).catch((err: Error) => setError(err.message)).finally(() => setLoadingReport(false))
  }
  useEffect(refreshReport, [])

  const execute = async () => {
    setRunning(true); setError(''); setMessage('')
    try {
      if (activeTab === 'HELLO_WORLD') setResult(await runHelloWorld(name))
      if (activeTab === 'HASH') setResult(await runHash(hashText))
      if (activeTab === 'BUBBLE_SORT') {
        const parsed = numbers.split(',').map((item) => Number(item.trim()))
        if (parsed.length === 0 || parsed.some(Number.isNaN)) throw new Error('请输入以逗号分隔的数字')
        setResult(await runBubbleSort(parsed, direction))
      }
      setMessage('执行完成，统计数据已更新')
      refreshReport()
    } catch (err) { setError((err as Error).message) }
    finally { setRunning(false) }
  }

  const selected = tabs.find((tab) => tab.id === activeTab)!
  const lineOption = useMemo<echarts.EChartsOption>(() => ({
    color: ['#2f80ed'],
    tooltip: { trigger: 'axis' },
    grid: { left: 42, right: 18, top: 24, bottom: 28 },
    xAxis: { type: 'category', boundaryGap: false, data: report?.timeseries.map((item) => item.label) ?? [] },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ type: 'line', smooth: true, areaStyle: { color: 'rgba(47,128,237,.11)' }, data: report?.timeseries.map((item) => item.count) ?? [] }],
  }), [report])
  const breakdownItems = report ? report[breakdown === 'userType' ? 'byUserType' : breakdown === 'userLevel' ? 'byUserLevel' : 'byDepartment'] : []
  const pieOption = useMemo<echarts.EChartsOption>(() => ({
    color: ['#2f80ed', '#27ae60', '#f2994a', '#9b51e0'],
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, icon: 'circle', textStyle: { color: '#52606d' } },
    series: [{ type: 'pie', radius: ['45%', '70%'], center: ['50%', '44%'], label: { show: false }, data: breakdownItems.map((item) => ({ name: item.label, value: item.count })) }],
  }), [breakdownItems])
  const barOption = useMemo<echarts.EChartsOption>(() => ({
    color: ['#27ae60'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 100, right: 18, top: 22, bottom: 28 },
    xAxis: { type: 'value', minInterval: 1 },
    yAxis: { type: 'category', data: report?.byDepartment.map((item) => item.label) ?? [] },
    series: [{ type: 'bar', barMaxWidth: 24, data: report?.byDepartment.map((item) => item.count) ?? [] }],
  }), [report])

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">AL</span><div><strong>算法实验室</strong><span>Library engineering console</span></div></div>
      <div className="topbar-meta"><span className="status-dot" />服务运行中 <span className="divider" />演示用户 · L2</div>
    </header>
    <main className="content">
      <section className="intro"><div><p className="kicker">ALGORITHM WORKBENCH / 01</p><h1>执行与洞察</h1><p className="intro-copy">运行基础算法，实时查看执行结果与调用行为。</p></div><button className="button secondary" onClick={refreshReport} disabled={loadingReport}><span>↻</span> 刷新报表</button></section>
      <section className="workspace-panel">
        <nav className="tabs" aria-label="算法选择">{tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? 'tab active' : 'tab'} onClick={() => { setActiveTab(tab.id); setResult(null); setError(''); setMessage('') }}><span>{tab.eyebrow}</span>{tab.label}</button>)}</nav>
        <div className="executor">
          <div className="executor-head"><div><p className="section-label">CURRENT MODULE</p><h2>{selected.label}</h2></div><span className="endpoint">POST /api/algorithms/{activeTab.toLowerCase().replace('_', '-')}</span></div>
          <div className="form-row">
            {activeTab === 'HELLO_WORLD' && <label>称呼 <input value={name} onChange={(event) => setName(event.target.value)} placeholder="World" /></label>}
            {activeTab === 'HASH' && <label>待计算文本 <textarea value={hashText} onChange={(event) => setHashText(event.target.value)} placeholder="输入需要计算 SHA-256 的文本" rows={3} /></label>}
            {activeTab === 'BUBBLE_SORT' && <><label className="wide">数字数组 <input value={numbers} onChange={(event) => setNumbers(event.target.value)} /></label><label>排序方向 <select value={direction} onChange={(event) => setDirection(event.target.value as 'ASC' | 'DESC')}><option value="ASC">升序 ASC</option><option value="DESC">降序 DESC</option></select></label></>}
            <button className="button primary" onClick={execute} disabled={running}>{running ? '执行中…' : '执行算法'} <span>→</span></button>
          </div>
          {error && <div className="notice error">{error}</div>}{message && <div className="notice success">{message}</div>}
          <div className="result-box"><div className="result-heading"><span>EXECUTION RESULT</span>{result !== null && <button className="text-button" onClick={() => downloadExport('algorithm', activeTab).catch((err: Error) => setError(err.message))}>↓ 导出明细</button>}</div>{result ? <pre>{JSON.stringify(result, null, 2)}</pre> : <div className="empty-result">执行后将在此处显示结构化结果</div>}</div>
        </div>
      </section>
      <section className="analytics-section">
        <div className="analytics-heading"><div><p className="kicker">OBSERVABILITY / 02</p><h2>调用情况</h2><p>基于持久化埋点的调用趋势与人员分布。</p></div><button className="button secondary" onClick={() => downloadExport('analytics').catch((err: Error) => setError(err.message))}><span>↓</span> 导出报表</button></div>
        <div className="metric-grid"><Metric label="总调用次数" value={report?.summary.totalCalls ?? 0} tone="blue" /><Metric label="成功调用" value={report?.summary.successfulCalls ?? 0} tone="green" /><Metric label="失败调用" value={report?.summary.failedCalls ?? 0} tone="orange" /><Metric label="去重调用人数" value={report?.summary.uniqueUsers ?? 0} tone="purple" /></div>
        {loadingReport ? <div className="loading">加载报表数据…</div> : <div className="charts"><div className="chart-card trend"><div className="card-heading"><div><h3>调用趋势</h3><span>按日统计</span></div><span className="chart-key"><i />调用次数</span></div><Chart option={lineOption} /></div><div className="chart-card"><div className="card-heading"><div><h3>人员维度</h3><span>调用占比</span></div><select className="dimension-select" value={breakdown} onChange={(event) => setBreakdown(event.target.value as typeof breakdown)}><option value="userType">人员类型</option><option value="userLevel">人员层级</option><option value="department">人员部门</option></select></div><Chart option={pieOption} /></div><div className="chart-card department"><div className="card-heading"><div><h3>部门分布</h3><span>调用次数排行</span></div></div><Chart option={barOption} /></div></div>}
      </section>
    </main>
    <footer>Algorithm Workbench <span>·</span> powered by Spring Boot &amp; ECharts</footer>
  </div>
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className="metric"><span className={`metric-icon ${tone}`} /> <div><span>{label}</span><strong>{value.toLocaleString()}</strong></div></div> }

export default App
