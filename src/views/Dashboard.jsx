import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, message, Spin, Empty } from 'antd';
import { ApartmentOutlined, CheckCircleOutlined, TeamOutlined, RiseOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import axios from 'axios';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const chartRef = useRef(null);
  const myChart = useRef(null);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/dashboard/stats');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (e) {
      message.error('获取仪表盘数据失败');
    }
    setLoading(false);
  };

  const renderChart = (industryDist) => {
    if (!chartRef.current || !industryDist) return;
    
    if (!myChart.current) {
      myChart.current = echarts.init(chartRef.current);
    }

    const filteredData = industryDist.filter(item => item.value > 0);
    
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
      xAxis: { 
        type: 'value', 
        splitLine: { lineStyle: { type: 'dashed' } } 
      },
      yAxis: { 
        type: 'category', 
        data: filteredData.map(item => item.name).reverse(),
        axisLabel: { color: '#666', fontWeight: 500 }
      },
      series: [
        {
          name: '数量',
          type: 'bar',
          data: filteredData.map(item => item.value).reverse(),
          barWidth: '40%',
          itemStyle: {
            borderRadius: [0, 5, 5, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#69c0ff' }
            ])
          },
          label: {
            show: true,
            position: 'right',
            color: '#1890ff',
            fontWeight: 'bold'
          }
        }
      ]
    };
    myChart.current.setOption(option);
  };

  useEffect(() => {
    fetchStats();
    window.addEventListener('resize', () => myChart.current?.resize());
    return () => {
      window.removeEventListener('resize', () => myChart.current?.resize());
      myChart.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!loading && data?.industryDist) {
      renderChart(data.industryDist);
    }
  }, [loading, data]);

  const matrixColumns = [
    { title: '公司名称', dataIndex: 'company', key: 'company', width: '30%' },
    { title: '资质总数', dataIndex: 'total', key: 'total', align: 'center', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '我方领先', dataIndex: 'leading', key: 'leading', align: 'center', render: (val) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>+{val}</span> },
    { title: '我方落后', dataIndex: 'lagging', key: 'lagging', align: 'center', render: (val) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>-{val}</span> },
    { title: '对比概况', dataIndex: 'overview', key: 'overview' },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" tip="正在加载实时对标数据..." /></div>;
  }

  if (!data) return <Empty description="暂无统计数据" />;

  return (
    <div className="dashboard-view" style={{ padding: '0 8px' }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card className="dashboard-card" style={{ height: '100%', background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)', color: '#fff' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>中移系统集成总资质</span>}
              value={data.stats.mainCompanyTotal}
              prefix={<ApartmentOutlined style={{ marginRight: 8 }} />}
              valueStyle={{ color: '#fff', fontSize: 42, fontWeight: 800 }}
            />
            <div style={{ marginTop: 12, opacity: 0.8 }}>
              <RiseOutlined /> 实时自动抓取中
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="dashboard-card">
            <Statistic 
              title="对标公司总数" 
              value={data.stats.competitorCount} 
              prefix={<TeamOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
          <Card className="dashboard-card" style={{ marginTop: 16 }}>
            <Statistic 
              title="今日数据更新" 
              value={data.stats.todayUpdates} 
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="我方资质行业分布" className="dashboard-card" size="small">
            <div ref={chartRef} style={{ height: 180 }}></div>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card 
            title={<span>核心竞争对手对标分析 <small style={{ fontWeight: 'normal', color: '#8c8c8c' }}>(中移集成 vs Top对手)</small></span>} 
            className="dashboard-card"
          >
            <Table
              columns={matrixColumns}
              dataSource={data.matrixData}
              pagination={false}
              size="middle"
              bordered
            />
          </Card>
        </Col>
      </Row>

      <style jsx="true">{`
        .dashboard-card {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s;
        }
        .dashboard-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .ant-statistic-title {
          font-size: 14px;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
