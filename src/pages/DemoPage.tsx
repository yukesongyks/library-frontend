import React, { useState, useCallback } from 'react'
import { Tabs } from 'antd'
import UserInfoForm from '../components/UserInfoForm'
import HelloTab from '../components/HelloTab'
import HashTab from '../components/HashTab'
import BubbleSortTab from '../components/BubbleSortTab'
import StatsChart from '../components/StatsChart'
import type { UserInfo } from '../components/UserInfoForm'

const DEFAULT_USER: UserInfo = {
  userId: 'user001',
  userType: 'EMPLOYEE',
  level: 'P6',
  department: '技术部',
}

const DemoPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>(DEFAULT_USER)
  const [activeTab, setActiveTab] = useState('hello')

  const handleUserChange = useCallback((info: UserInfo) => {
    setUserInfo(info)
  }, [])

  const tabItems = [
    {
      key: 'hello',
      label: 'Hello World',
      children: <HelloTab userInfo={userInfo} />,
    },
    {
      key: 'hash',
      label: '哈希算法',
      children: <HashTab userInfo={userInfo} />,
    },
    {
      key: 'bubble-sort',
      label: '冒泡排序',
      children: <BubbleSortTab userInfo={userInfo} />,
    },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h2>图书管理系统 — API 功能演示</h2>
      <UserInfoForm value={userInfo} onChange={handleUserChange} />
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      <StatsChart apiNameFilter={activeTab} />
    </div>
  )
}

export default DemoPage