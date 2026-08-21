import { Card, Statistic } from 'antd'

export default function StatCard({
  title,
  value,
  extra
}: {
  title: string
  value: string
  extra?: string
}) {
  return (
    <Card data-testid={`stat-${title}`}>
      <Statistic title={title} value={value} />
      {extra ? <div style={{ color: 'rgba(0, 0, 0, 0.45)', marginTop: 8 }}>{extra}</div> : null}
    </Card>
  )
}