import { Card, Statistic } from 'antd'

interface StatCardProps {
  title: string
  value: number
  precision?: number
  suffix?: string
  prefix?: string
  loading?: boolean
}

export default function StatCard({ title, value, precision = 2, suffix, prefix, loading }: StatCardProps) {
  return (
    <Card loading={loading}>
      <Statistic title={title} value={value} precision={precision} suffix={suffix} prefix={prefix} />
    </Card>
  )
}
