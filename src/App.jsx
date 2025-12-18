import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import lawLogo from './law.jpeg';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  SyncOutlined,
  BankOutlined,
  LineChartOutlined,
  EditOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import Dashboard from './views/Dashboard';
import TaskList from './views/TaskList';
import BatchTask from './views/BatchTask';
import CompanyQuals from './views/CompanyQuals';
import QualCompare from './views/QualCompare';
import ManualEntry from './views/ManualEntry';
import Config from './views/Config';

const { Header, Content, Sider } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '智慧大屏' },
    { key: 'tasks', icon: <UnorderedListOutlined />, label: '任务列表' },
    { key: 'batches', icon: <SyncOutlined />, label: '批量任务' },
    { key: 'companies', icon: <BankOutlined />, label: '公司资质' },
    { key: 'compare', icon: <LineChartOutlined />, label: '资质对比' },
    { key: 'manual', icon: <EditOutlined />, label: '手动录入' },
    { key: 'config', icon: <SettingOutlined />, label: '系统配置' },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <TaskList />;
      case 'batches': return <BatchTask />;
      case 'companies': return <CompanyQuals />;
      case 'compare': return <QualCompare />;
      case 'manual': return <ManualEntry />;
      case 'config': return <Config />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="logo-container">
          <img src={lawLogo} alt="logo" style={{ width: 32, height: 32, borderRadius: 8 }} />
          {!collapsed && <span className="logo-text">资质对标</span>}
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={['dashboard']}
          mode="inline"
          items={menuItems}
          onSelect={({ key }) => setCurrentView(key)}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: '100%',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;

