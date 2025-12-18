import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Switch, Modal, Form, Input, Select, message, Popconfirm, Card, Row, Col, InputNumber, Divider, Tooltip, Typography } from 'antd';
import { PlayCircleOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, DragOutlined, QuestionCircleOutlined, CodeOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Title, Text } = Typography;

const PARAM_LABELS = {
  'seconds': '等待秒数',
  'target': '元素选择器',
  'value': '输入内容/选项值',
  'checked': '是否选中',
  'url': '目标 URL',
  'filename': '保存文件名',
  'summary_prompt': '大模型提示词',
  'match_text': '匹配链接文字',
  'extract_selectors': '提取区域选择器 (CSS)',
  'max_links': '最大链接数',
  'wait_after_visit': '访问后等待秒数',
  'wait_after_click': '点击后等待秒数',
  'keyword': '识别关键字',
  'input_selector': '输入框选择器',
  'submit_selector': '提交按钮选择器',
  'target_type': '验证目标描述',
  'max_retries': '最大重试次数',
  'list_selector': '列表项选择器',
};

const ACTION_TYPES = [
  { value: 'wait', label: '等待 (Wait)', params: ['seconds'], desc: '在继续下一步之前等待指定时间' },
  { value: 'input', label: '输入文本 (Input)', params: ['target', 'value'], desc: '在指定选择器中输入内容' },
  { value: 'click', label: '点击元素 (Click)', params: ['target'], desc: '点击指定选择器匹配的元素' },
  { value: 'optional_click', label: '可选点击 (Optional Click)', params: ['target'], desc: '如果元素存在则点击，不存在则忽略' },
  { value: 'submit', label: '提交表单 (Submit)', params: ['target'], desc: '点击提交按钮或触发表单提交' },
  { value: 'checkbox', label: '勾选框 (Checkbox)', params: ['target', 'checked'], desc: '设置复选框的选中状态' },
  { value: 'select', label: '下拉选择 (Select)', params: ['target', 'value'], desc: '从下拉列表中选择一个选项' },
  { value: 'hover', label: '悬停 (Hover)', params: ['target'], desc: '模拟鼠标悬停到指定元素' },
  { value: 'navigate', label: '导航 (Navigate)', params: ['url'], desc: '直接跳转到指定 URL' },
  { value: 'click_and_navigate', label: '点击并导航', params: ['target'], desc: '获取链接 URL 并直接导航（不打开新窗口）' },
  { value: 'extract', label: '提取数据 (Extract)', params: ['target'], desc: '标记此步骤为数据提取点' },
  { value: 'extract_text', label: '提取全页文本', params: [], desc: '直接抓取并保存当前页面的所有文字信息' },
  { value: 'screenshot', label: '网页截图 (Screenshot)', params: ['filename'], desc: '截取当前页面并保存为文件' },
  { value: 'screenshot_ocr', label: '截图并汇总 (OCR)', params: ['filename', 'summary_prompt'], desc: '截图后使用大模型识别文字并生成摘要' },
  { value: 'switch_to_new_window', label: '切换到新窗口', params: [], desc: '切换控制权到新打开的浏览器窗口' },
  { value: 'switch_to_latest_tab', label: '切换到最新标签', params: [], desc: '切换控制权到最后打开的标签页' },
  { value: 'loop_click_extract', label: '循环提取列表', params: ['list_selector', 'extract_selectors', 'wait_after_click'], desc: '点击列表中的每一项并提取详情页数据' },
  { value: 'find_links_extract', label: '查找文字链接提取', params: ['match_text', 'extract_selectors', 'max_links', 'wait_after_visit'], desc: '寻找包含特定文字的链接，依次访问并提取详情' },
  { value: 'extract_links_by_keyword', label: '提取关键字链接', params: ['keyword', 'max_links', 'wait_after_visit'], desc: '提取包含关键字的链接并获取其页面文字' },
  { value: 'math_captcha', label: '处理算术验证码', params: ['input_selector', 'submit_selector', 'keyword'], desc: '自动识别并计算图片中的加减法算式' },
  { value: 'image_captcha', label: '处理图片验证码', params: ['input_selector', 'submit_selector', 'keyword'], desc: '自动识别并填入数字/字母混合图片验证码' },
  { value: 'geetest_captcha', label: '处理极验验证码', params: ['target_type', 'max_retries'], desc: '处理 GeeTest 类型图标/拼图验证码' },
];

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();
  const [selectedCompany, setSelectedCompany] = useState('中移系统集成有限公司');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tasks');
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (e) {
      message.error('获取任务列表失败');
    }
    setLoading(false);
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get('/api/company-names');
      if (res.data.success) {
        setCompanies(res.data.companies);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchTasks();
    fetchCompanies();
  }, []);

  const runTask = async (taskFile) => {
    try {
      const res = await axios.post(`/api/tasks/${taskFile}/run`, { company_name: selectedCompany });
      if (res.data.success) {
        message.success('任务已开始执行');
      } else {
        message.error('启动任务失败: ' + res.data.error);
      }
    } catch (e) {
      message.error('网络请求失败');
    }
  };

  const toggleTask = async (taskFile, disabled) => {
    try {
      const res = await axios.post(`/api/tasks/${taskFile}/toggle`, { disabled: !disabled });
      if (res.data.success) {
        message.success(`${disabled ? '启用' : '禁用'}成功`);
        fetchTasks();
      }
    } catch (e) {
      message.error('操作失败');
    }
  };

  const deleteTask = async (taskFile) => {
    try {
      const res = await axios.delete(`/api/tasks/${taskFile}`);
      if (res.data.success) {
        message.success('删除成功');
        fetchTasks();
      } else {
        message.error('删除失败: ' + res.data.error);
      }
    } catch (e) {
      message.error('网络请求失败');
    }
  };

  const showEditModal = (task) => {
    setEditingTask(task);
    form.setFieldsValue({
      name: task.name,
      url: task.url,
      description: task.description,
      actions: task.actions || []
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingTask) {
        const res = await axios.put(`/api/tasks/${editingTask._file}`, values);
        if (res.data.success) {
          message.success('保存成功');
          setIsModalOpen(false);
          fetchTasks();
        }
      } else {
        const res = await axios.post('/api/tasks', {
          ...values,
          _file: `task_${Date.now()}.json`
        });
        if (res.data.success) {
          message.success('创建成功');
          setIsModalOpen(false);
          fetchTasks();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderParamField = (actionName, fieldName, type) => {
    const commonProps = { style: { width: '100%' } };
    
    switch (fieldName) {
      case 'seconds':
      case 'wait_after_click':
      case 'wait_after_visit':
        return <InputNumber {...commonProps} min={0.1} step={0.5} />;
      case 'checked':
        return (
          <Select {...commonProps}>
            <Option value={true}>是</Option>
            <Option value={false}>否</Option>
          </Select>
        );
      case 'max_links':
      case 'max_retries':
        return <InputNumber {...commonProps} min={1} />;
      case 'extract_selectors':
        return <Select {...commonProps} mode="tags" placeholder="回车添加多个选择器" tokenSeparators={[',', ' ']} />;
      case 'target':
      case 'input_selector':
      case 'submit_selector':
      case 'link_selector':
      case 'list_selector':
        return <Input {...commonProps} placeholder="ID/Name/CSS/XPath/Text" />;
      case 'summary_prompt':
        return <Input.TextArea {...commonProps} rows={1} />;
      case 'match_text':
      case 'keyword':
      case 'target_type':
        return <Input {...commonProps} />;
      case 'filename':
        return <Input {...commonProps} />;
      default:
        return <Input {...commonProps} />;
    }
  };

  const columns = [
    { title: '任务名称', dataIndex: 'name', key: 'name', width: '20%' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '状态',
      dataIndex: 'disabled',
      key: 'status',
      width: 100,
      render: (disabled, record) => (
        <Switch
          checked={!disabled}
          onChange={() => toggleTask(record._file, disabled)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => runTask(record._file)}
            disabled={record.disabled}
          >
            执行
          </Button>
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除该任务吗？"
            onConfirm={() => deleteTask(record._file)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="task-list">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Title level={4} style={{ margin: 0 }}>任务配置列表</Title>
          <Divider type="vertical" />
          <span style={{ color: '#8c8c8c' }}>查询公司：</span>
          <Select
            style={{ width: 240 }}
            value={selectedCompany}
            onChange={setSelectedCompany}
            options={companies.map(c => ({ label: c, value: c }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTask(null); form.resetFields(); setIsModalOpen(true); }}>
            新建任务
          </Button>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={fetchTasks}>刷新</Button>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="_file"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingTask ? "编辑任务配置" : "新建任务配置"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleModalOk}
        width={1000}
        destroyOnClose
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}><Input placeholder="例如：ITSS资质查询" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="url" label="目标 URL" rules={[{ required: true, message: '请输入目标 URL' }]}><Input placeholder="https://example.com" /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="任务描述"><Input.TextArea rows={2} placeholder="简单描述该任务的功能" /></Form.Item>

          <Divider orientation="left"><CodeOutlined /> 执行动作序列 (Actions)</Divider>
          
          <Form.List name="actions">
            {(fields, { add, remove, move }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Card 
                    key={key} 
                    size="small" 
                    title={`步骤 ${index + 1}`}
                    extra={
                      <Space>
                        <Tooltip title={ACTION_TYPES.find(t => t.value === form.getFieldValue(['actions', name, 'type']))?.desc || '动作描述'}>
                           <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                        </Tooltip>
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                      </Space>
                    }
                    className="action-card"
                  >
                    <Row gutter={12}>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'type']}
                          rules={[{ required: true, message: '必填' }]}
                        >
                          <Select 
                            placeholder="动作类型" 
                            showSearch
                            optionFilterProp="label"
                            onChange={() => {
                              const currentActions = form.getFieldValue('actions');
                              const type = currentActions[name].type;
                              currentActions[name] = { type };
                              form.setFieldsValue({ actions: currentActions });
                            }}
                          >
                            {ACTION_TYPES.map(t => <Option key={t.value} value={t.value} label={t.label}>{t.label}</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      
                      <Col span={18}>
                        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.actions?.[name]?.type !== currentValues.actions?.[name]?.type}>
                          {({ getFieldValue }) => {
                            const type = getFieldValue(['actions', name, 'type']);
                            const typeConfig = ACTION_TYPES.find(t => t.value === type);
                            if (!typeConfig) return null;
                            
                            return (
                              <Row gutter={12}>
                                {typeConfig.params.map(param => (
                                  <Col key={param} span={typeConfig.params.length === 1 ? 24 : 12}>
                                    <Form.Item
                                      {...restField}
                                      label={PARAM_LABELS[param] || param}
                                      name={[name, param]}
                                      rules={[{ required: true, message: '必填' }]}
                                      style={{ marginBottom: 8 }}
                                    >
                                      {renderParamField(name, param, type)}
                                    </Form.Item>
                                  </Col>
                                ))}
                              </Row>
                            );
                          }}
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加执行步骤
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      <style jsx="true">{`
        .action-card {
          border: 1px solid #f0f0f0;
          transition: all 0.3s;
        }
        .action-card:hover {
          border-color: #1890ff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .ant-form-item {
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  );
};

export default TaskList;
