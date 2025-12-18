import React, { useState, useEffect } from 'react';
import { List, Card, Space, Button, Input, message, Divider, Typography, Row, Col, Badge } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const Config = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [sysConfig, setSysConfig] = useState(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/company-names');
      if (res.data.success) setCompanies(res.data.companies);
    } catch (e) {
      message.error('加载公司名单失败');
    }
    setLoading(false);
  };

  const fetchSysConfig = async () => {
    try {
      const res = await axios.get('/api/config');
      if (res.data.success) setSysConfig(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchCompanies();
    fetchSysConfig();
  }, []);

  const addCompany = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await axios.post('/api/company-names', { name });
      if (res.data.success) {
        message.success('添加成功');
        setNewName('');
        fetchCompanies();
      } else {
        message.error(res.data.error || '添加失败');
      }
    } catch (e) {
      message.error('添加失败');
    }
  };

  const deleteCompany = async (name) => {
    try {
      const res = await axios.delete(`/api/company-names/${encodeURIComponent(name)}`);
      if (res.data.success) {
        message.success('删除成功');
        fetchCompanies();
      } else {
        message.error(res.data.error || '删除失败');
      }
    } catch (e) {
      message.error('删除失败');
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <Title level={4}>系统配置与管理</Title>
      
      <Row gutter={24}>
        <Col span={14}>
          <Card 
            title="公司名单管理" 
            extra={<Button type="text" icon={<ReloadOutlined />} onClick={fetchCompanies} />}
          >
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              <Input
                placeholder="输入新公司全称"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onPressEnter={addCompany}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={addCompany}>添加</Button>
            </div>
            
            <List
              bordered
              loading={loading}
              dataSource={companies}
              pagination={{ pageSize: 10, size: 'small' }}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button
                      danger
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => deleteCompany(item)}
                    />
                  ]}
                >
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col span={10}>
          <Card title="运行时状态" icon={<SettingOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">浏览器引擎</Text>
                <Badge status="processing" text={sysConfig?.browser?.engine || 'Hybrid'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">大模型模型</Text>
                <Badge status="success" text={sysConfig?.llm?.model || 'Qwen3-Max'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">数据库</Text>
                <Text strong>MySQL (code_bag)</Text>
              </div>
              
              <Divider style={{ margin: '12px 0' }} />
              
              <Title level={5}>操作日志</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                系统所有操作行为已自动记录至：<br />
                <code>logs/法务资质对标.{new Date().toISOString().split('T')[0]}.log</code>
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Config;
