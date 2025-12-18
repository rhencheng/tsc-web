import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Progress, Divider, List } from 'antd';
import { PlusOutlined, ReloadOutlined, PlayCircleOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const BatchTask = () => {
  const [batches, setBatches] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [form] = Form.useForm();

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/batches');
      if (res.data.success) {
        setBatches(res.data.batches);
      }
    } catch (e) {
      message.error('加载批次失败');
    }
    setLoading(false);
  }, []);

  const fetchData = async () => {
    try {
      const [taskResp, compResp] = await Promise.all([
        axios.get('/api/tasks'),
        axios.get('/api/company-names')
      ]);
      if (taskResp.data.success) setTasks(taskResp.data.tasks.filter(t => !t.disabled));
      if (compResp.data.success) setCompanies(compResp.data.companies);
    } catch (e) {}
  };

  useEffect(() => {
    fetchBatches();
    fetchData();
  }, [fetchBatches]);

  const createBatch = async () => {
    try {
      const values = await form.validateFields();
      const res = await axios.post('/api/batches', {
        name: values.name,
        tasks: values.tasks, // 选中的任务文件名列表
        company_name: values.company_name,
        mode: 'sequential'
      });
      if (res.data.success) {
        message.success('创建成功');
        setIsModalOpen(false);
        fetchBatches();
      }
    } catch (e) {}
  };

  const startBatch = async (id) => {
    try {
      const res = await axios.post(`/api/batches/${id}/start`);
      if (res.data.success) {
        message.success('批次已启动');
        fetchBatches();
      }
    } catch (e) {}
  };

  const deleteBatch = async (id) => {
    try {
      const res = await axios.delete(`/api/batches/${id}`);
      if (res.data.success) {
        message.success('已删除');
        fetchBatches();
      }
    } catch (e) {}
  };

  const columns = [
    { title: '批次名称', dataIndex: 'name', key: 'name' },
    { title: '公司', dataIndex: 'company_name', key: 'company_name' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const colors = { pending: 'orange', running: 'processing', completed: 'success', failed: 'error' };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: '进度',
      key: 'progress',
      render: (_, record) => {
        const percent = Math.round((record.completed_count / record.task_count) * 100) || 0;
        return <Progress percent={percent} size="small" />;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => startBatch(record.id)} disabled={record.status === 'running'}>启动</Button>
          <Button size="small" icon={<InfoCircleOutlined />} onClick={() => { setSelectedBatch(record); setDetailModalOpen(true); }}>详情</Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => deleteBatch(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>新建批量任务</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchBatches}>刷新</Button>
      </div>

      <Table columns={columns} dataSource={batches} rowKey="id" loading={loading} />

      <Modal title="新建批量任务" open={isModalOpen} onOk={createBatch} onCancel={() => setIsModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="批次名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="company_name" label="目标公司" rules={[{ required: true }]}>
            <Select options={companies.map(c => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item name="tasks" label="选择任务" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="选择一个或多个任务">
              {tasks.map(t => <Select.Option key={t._file} value={t._file}>{t.name}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal 
        title={`批次详情 - ${selectedBatch?.name}`} 
        open={detailModalOpen} 
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedBatch && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space split={<Divider type="vertical" />}>
                <span>状态: <Tag color="blue">{selectedBatch.status}</Tag></span>
                <span>成功: {selectedBatch.completed_count}</span>
                <span>失败: {selectedBatch.failed_count}</span>
                <span>总数: {selectedBatch.task_count}</span>
              </Space>
            </div>
            <List
              bordered
              dataSource={selectedBatch.items}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.task_name}</span>
                    <Tag color={item.status === 'completed' ? 'green' : item.status === 'failed' ? 'red' : 'blue'}>{item.status}</Tag>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BatchTask;
