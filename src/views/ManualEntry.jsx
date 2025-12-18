import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Card, message, AutoComplete } from 'antd';
import axios from 'axios';

const ManualEntry = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compResp, catResp] = await Promise.all([
          axios.get('/api/company-names'),
          axios.get('/api/qualifications/categories')
        ]);
        if (compResp.data.success) setCompanies(compResp.data.companies);
        if (catResp.data.success) setCategories(catResp.data.categories);
      } catch (e) {
        console.error('加载选项失败', e);
      }
    };
    fetchData();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : ''
      };
      const res = await axios.post('/api/qualifications/manual', data);
      if (res.data.success) {
        message.success('录入成功');
        form.resetFields();
      } else {
        message.error('保存失败: ' + res.data.error);
      }
    } catch (e) {
      message.error('网络请求失败');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card title="手动录入资质信息">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="category_name" label="资质名称" rules={[{ required: true, message: '请输入资质名称' }]}>
            <AutoComplete
              options={categories.map(c => ({ value: c }))}
              placeholder="例如：ITSS信息技术服务标准"
              filterOption={(inputValue, option) =>
                option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>
          <Form.Item name="company_name" label="公司名称" rules={[{ required: true, message: '请选择公司名称' }]}>
            <Select placeholder="选择公司" showSearch>
              {companies.map(name => (
                <Select.Option key={name} value={name}>{name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="certificate_no" label="证书编号" rules={[{ required: true, message: '请输入证书编号' }]}>
            <Input placeholder="请输入证书上的编号" />
          </Form.Item>
          <Form.Item name="level" label="证书等级">
            <Input placeholder="例如：一级 / 甲级 / A" />
          </Form.Item>
          <Form.Item name="expiry_date" label="有效期至">
            <DatePicker style={{ width: '100%' }} placeholder="请选择到期日期" />
          </Form.Item>
          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              确认录入数据
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ManualEntry;
