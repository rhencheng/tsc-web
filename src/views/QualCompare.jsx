import React, { useState, useEffect } from 'react';
import { Select, Button, Space, Card, Divider, Empty, Table, Tag, Row, Col, message, Typography, Tooltip } from 'antd';
import { SwapOutlined, DownloadOutlined, ApartmentOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

const QualCompare = () => {
  const [companies, setCompanies] = useState([]);
  const [target] = useState('中移系统集成有限公司');
  const [reference, setReference] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get('/api/company-names');
        if (res.data.success) {
          setCompanies(res.data.companies.filter(c => c !== '中移系统集成有限公司'));
        }
      } catch (e) {}
    };
    fetchCompanies();
  }, []);

  const runComparison = async () => {
    if (reference.length === 0) {
      message.warning('请至少选择一个对比公司');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/compare', {
        target_company: target,
        reference_company: reference
      });
      if (res.data.success) {
        setResult(res.data);
      } else {
        message.error(res.data.error || '对比失败');
      }
    } catch (e) {
      message.error('网络请求失败');
    }
    setLoading(false);
  };

  const exportReport = async () => {
    if (reference.length === 0) return;
    try {
      const res = await axios.post('/api/compare/export', {
        target_company: target,
        reference_company: reference
      });
      if (res.data.success && res.data.download_url) {
        window.open(res.data.download_url, '_blank');
        message.success('报告导出成功');
      }
    } catch (e) {
      message.error('导出失败');
    }
  };

  // 动态生成表格列
  const getColumns = () => {
    if (!result) return [];

    const baseColumns = [
      { 
        title: '资质名称', 
        dataIndex: 'qualification_name', 
        key: 'qualification_name', 
        fixed: 'left', 
        width: 200 
      },
      { 
        title: '对比情况', 
        dataIndex: 'comparison_summary', 
        key: 'comparison_summary', 
        width: 180,
        render: (text) => <Text type="secondary" style={{ fontSize: 12 }}>{text}</Text>
      },
      { 
        title: (
          <div style={{ textAlign: 'center' }}>
            <Tag color="blue">己方</Tag><br/>
            <small>{target}</small>
          </div>
        ), 
        key: 'target', 
        width: 150,
        align: 'center',
        render: (_, record) => (
          <div style={{ fontWeight: 'bold' }}>
            {record.target_info.has ? (
              record.target_info.level ? `有 (${record.target_info.level})` : '有'
            ) : '无'}
          </div>
        )
      },
    ];

    // 为每个对比公司生成列
    const competitorColumns = result.reference_companies.map(refName => ({
      title: <div style={{ textAlign: 'center' }}>{refName}</div>,
      key: refName,
      width: 150,
      align: 'center',
      render: (_, record) => {
        const info = record.competitors[refName];
        let bgColor = 'transparent';
        let textColor = 'inherit';

        // 颜色逻辑：
        // 1. 集成有，该公司无 -> 浅绿色
        if (record.target_info.has && !info.has) {
          bgColor = '#f6ffed'; // 浅绿 (AntD success-bg)
          textColor = '#52c41a';
        }
        // 2. 集成有，该公司也有
        else if (record.target_info.has && info.has) {
          if (info.comparison_status === 'better') {
            bgColor = '#fff1f0'; // 浅红 (AntD error-bg)
            textColor = '#f5222d';
          } else if (info.comparison_status === 'worse') {
            bgColor = '#e6f7ff'; // 浅蓝 (AntD info-bg)
            textColor = '#1890ff';
          }
        }
        // 3. 集成无，该公司有 -> 浅红色
        else if (!record.target_info.has && info.has) {
          bgColor = '#fff1f0'; // 浅红
          textColor = '#f5222d';
        }

        return (
          <div style={{ 
            backgroundColor: bgColor, 
            color: textColor,
            padding: '8px 4px',
            borderRadius: '4px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: (bgColor !== 'transparent' && bgColor !== 'inherit') ? 500 : 'normal'
          }}>
            {info.has ? (info.level ? `有 (${info.level})` : '有') : '无'}
          </div>
        );
      }
    }));

    return [...baseColumns, ...competitorColumns];
  };

  return (
    <div style={{ maxWidth: '100%', padding: '0 24px' }}>
      <Card title="资质对标多公司分析">
        <Row gutter={32} align="middle" justify="center">
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 8, color: '#8c8c8c' }}>己方公司 (固定)</div>
              <Card size="small" style={{ background: '#f5f5f5', border: '1px dashed #d9d9d9' }}>
                <Space>
                  <ApartmentOutlined />
                  <Text strong>{target}</Text>
                </Space>
              </Card>
            </div>
          </Col>
          <Col span={2}>
            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <SwapOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
            </div>
          </Col>
          <Col span={14}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 8, color: '#8c8c8c' }}>对比公司 (可选择多家)</div>
              <Select
                mode="multiple"
                placeholder="请从已有的公司名单中选择"
                style={{ width: '100%' }}
                value={reference}
                onChange={setReference}
                options={companies.map(c => ({ label: c, value: c }))}
                maxTagCount="responsive"
              />
            </div>
          </Col>
        </Row>
        
        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Button type="primary" size="large" onClick={runComparison} loading={loading} disabled={reference.length === 0}>
            生成对标矩阵
          </Button>
        </div>
      </Card>
      
      {result ? (
        <div style={{ marginTop: 24 }}>
          <Card 
            title={
              <Space>
                <span>对标详细矩阵</span>
                <Tooltip title="浅绿：己方占优 | 浅蓝：己方领先该对手等级 | 浅红：对方占优或等级更高">
                  <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              </Space>
            } 
            extra={<Button icon={<DownloadOutlined />} onClick={exportReport}>导出详细报告</Button>}
          >
            <Table 
              columns={getColumns()} 
              dataSource={result.comparison} 
              rowKey="qualification_name" 
              pagination={{ pageSize: 50 }}
              bordered
              size="middle"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </div>
      ) : (
        <div style={{ marginTop: 40 }}>
          <Empty description="请选择对比公司并生成对标矩阵" />
        </div>
      )}

      <style jsx="true">{`
        .ant-table-cell {
          padding: 8px !important;
        }
      `}</style>
    </div>
  );
};

export default QualCompare;
