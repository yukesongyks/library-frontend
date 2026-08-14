import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Tabs } from 'antd';
import DepartmentCost from './DepartmentCost';
import ProjectCost from './ProjectCost';
import PersonnelCost from './PersonnelCost';
import BusinessLineCost from './BusinessLineCost';
import TimeTrend from './TimeTrend';

const CostAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabItems = [
    { key: '/cost/analysis/department', label: '部门维度' },
    { key: '/cost/analysis/project', label: '项目维度' },
    { key: '/cost/analysis/business-line', label: '业务线维度' },
    { key: '/cost/analysis/personnel', label: '人员维度' },
    { key: '/cost/analysis/trend', label: '时间趋势' },
  ];

  const activeKey = tabItems.find(t => location.pathname.startsWith(t.key))?.key || tabItems[0].key;

  return (
    <div>
      <Tabs
        activeKey={activeKey}
        items={tabItems}
        onChange={(key) => navigate(key)}
        style={{ marginBottom: 16 }}
      />
      <Routes>
        <Route path="department" element={<DepartmentCost />} />
        <Route path="project" element={<ProjectCost />} />
        <Route path="business-line" element={<BusinessLineCost />} />
        <Route path="personnel" element={<PersonnelCost />} />
        <Route path="trend" element={<TimeTrend />} />
      </Routes>
    </div>
  );
};

export default CostAnalysis;
