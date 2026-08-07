import { Tabs } from 'antd'
import HelloWorldTab from '../components/HelloWorldTab'
import HashTab from '../components/HashTab'
import BubbleSortTab from '../components/BubbleSortTab'
import CallReport from '../components/CallReport'

export default function AlgoPage() {
  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Tabs
        defaultActiveKey="helloworld"
        items={[
          { key: 'helloworld', label: 'HelloWorld', children: <HelloWorldTab /> },
          { key: 'hash', label: '哈希算法', children: <HashTab /> },
          { key: 'bubblesort', label: '冒泡排序', children: <BubbleSortTab /> },
        ]}
      />
      <CallReport />
    </div>
  )
}
