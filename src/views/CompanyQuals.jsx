import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, message, Drawer, List, Typography } from 'antd';
import axios from 'axios';

const { Text } = Typography;

const CompanyQuals = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/companies');
      if (res.data.success) {
        // 严格按照最后更新时间倒序排序
        const sortedData = [...res.data.companies].sort((a, b) => {
          return new Date(b.last_updated || 0) - new Date(a.last_updated || 0);
        });
        setData(sortedData);
      }
    } catch (e) {
      message.error('加载公司数据失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showDetails = async (companyName) => {
    setSelectedCompany(companyName);
    setDetailsLoading(true);
    try {
      const res = await axios.get(`/api/companies/${encodeURIComponent(companyName)}`);
      if (res.data.success) {
        // 过滤掉证书数量为 0 的任务项，只显示有结果的任务
        const filteredCertificates = (res.data.certificates || []).filter(item => (item.total_count || 0) > 0);
        setDetails({
          ...res.data,
          certificates: filteredCertificates
        });
      }
    } catch (e) {
      message.error('获取详情失败');
    }
    setDetailsLoading(false);
  };

  const columns = [
    { title: '公司名称', dataIndex: 'name', key: 'name' },
    { 
      title: '资质数量', 
      dataIndex: 'certificate_count', 
      key: 'certificate_count', 
      render: (val) => val > 0 ? <Tag color="blue">{val}</Tag> : <Text type="secondary">无</Text>
    },
    { 
      title: '最后更新', 
      dataIndex: 'last_updated', 
      key: 'last_updated',
      render: (val) => val ? new Date(val).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={(e) => { e.stopPropagation(); showDetails(record.name); }}>详情</Button>
      ),
    },
  ];

  return (
    <div className="company-quals">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={fetchData}>刷新列表</Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
        onRow={(record) => ({
          onClick: () => showDetails(record.name),
          style: { cursor: 'pointer' }
        })}
      />

      <Drawer
        title={`公司资质详情 - ${selectedCompany}`}
        placement="right"
        width={700}
        onClose={() => setSelectedCompany(null)}
        open={!!selectedCompany}
        loading={detailsLoading}
      >
        {details && details.certificates && details.certificates.length > 0 ? (
          <div style={{ padding: '0 12px' }}>
            <List
              itemLayout="vertical"
              dataSource={details.certificates}
              renderItem={(item) => (
                <List.Item key={item.task_key} style={{ paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    title={<strong style={{ fontSize: 16, color: '#1890ff' }}>{item.task_name}</strong>}
                    description={`更新于 ${new Date(item.last_query_time).toLocaleString()}`}
                  />
                  <Table
                    size="small"
                    columns={[
                      { title: '证书编号', dataIndex: '证书编号', key: 'no' },
                      { title: '等级', dataIndex: '资质等级', key: 'level', render: (t) => t || '-' },
                      { title: '有效期至', dataIndex: '有效期至', key: 'expiry', render: (t) => t || '-' },
                    ]}
                    dataSource={item.certificates}
                    rowKey={(record, idx) => (record.证书编号 || '') + idx}
                    pagination={false}
                    bordered
                  />
                </List.Item>
              )}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <Text type="secondary" style={{ display: 'block', fontSize: 16 }}>暂无抓取到的资质数据</Text>
            {details?.last_updated && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                最后检查时间: {new Date(details.last_updated).toLocaleString()}
              </Text>
            )}
          </div>
        )}
      </Drawer>

      <style jsx="true">{`
        .company-quals :global(.ant-table-row:hover) {
          background-color: #f0f7ff !important;
        }
      `}</style>
    </div>
  );
};

export default CompanyQuals;
