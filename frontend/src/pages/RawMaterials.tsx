import { useState } from 'react';
import { Table, Button, Space, Spin, Alert, Input, message, Modal, Form, Select } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';

interface RawMaterial {
  id: number;
  name: string;
  category?: string;
  type: string; // 'R' for Raw Material
  unit: string;
  consumptionUnit?: string;
  conversionQty?: number;
  hsnCode?: string;
  gstPercentage?: number;
  sapCode?: string;
  isExpiry: boolean;
  status: boolean;
  restaurantId: number;
  createdAt: string;
}

const RawMaterials = () => {
  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['raw-materials'],
    queryFn: async () => {
      const res = await axios.get('/api/raw-materials');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.post('/api/raw-materials', values);
      return response.data;
    },
    onSuccess: () => {
      message.success('Raw material created successfully!');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
    onError: (error: any) => {
      message.error(`Failed to create: ${error.message}`);
    }
  });

  const columns: ColumnsType<RawMaterial> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      filteredValue: search ? [search] : null,
      onFilter: (value, record) => 
        record.name.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'HSN Code',
      dataIndex: 'hsnCode',
      key: 'hsnCode',
    },
    {
      title: 'GST %',
      dataIndex: 'gstPercentage',
      key: 'gstPercentage',
      render: (val: number) => val ? `${val}%` : '-',
    },
    {
      title: 'SAP Code',
      dataIndex: 'sapCode',
      key: 'sapCode',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean) => (
        <span style={{ color: status ? 'green' : 'red' }}>
          {status ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
  ];

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      createMutation.mutate({
        ...values,
        type: 'R', // Raw Material
        gstPercentage: values.gstPercentage?.toString() || '0',
        conversionQty: values.conversionQty?.toString() || '0',
      });
    } catch (error) {
      // Form validation error
    }
  };

  if (error) {
    return (
      <Alert
        type="error"
        message="Error loading raw materials"
        description={error.message || "Please ensure the backend server is running"}
        showIcon
        style={{ margin: 16 }}
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input.Search
            placeholder="Search materials..."
            onSearch={(value) => setSearch(value)}
            onChange={(e) => !e.target.value && setSearch('')}
            style={{ width: 300 }}
          />
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Add Raw Material
          </Button>
        </Space>
      </div>

      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={data || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      <Modal
        title="Add Raw Material"
        open={isModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Material Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Maida (All Purpose Flour)" />
          </Form.Item>
          
          <Form.Item name="category" label="Category">
            <Input placeholder="e.g., Flour" />
          </Form.Item>
          
          <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
            <Select placeholder="Select unit">
              <Select.Option value="KG">KG</Select.Option>
              <Select.Option value="GM">GM</Select.Option>
              <Select.Option value="L">L</Select.Option>
              <Select.Option value="ML">ML</Select.Option>
              <Select.Option value="NOS">NOS</Select.Option>
              <Select.Option value="PCS">PCS</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="consumptionUnit" label="Consumption Unit">
            <Select placeholder="Select consumption unit">
              <Select.Option value="KG">KG</Select.Option>
              <Select.Option value="GM">GM</Select.Option>
              <Select.Option value="L">L</Select.Option>
              <Select.Option value="ML">ML</Select.Option>
              <Select.Option value="NOS">NOS</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="conversionQty" label="Conversion Quantity">
            <Input placeholder="e.g., 1000 (1 KG = 1000 GM)" />
          </Form.Item>
          
          <Form.Item name="hsnCode" label="HSN Code">
            <Input placeholder="e.g., 11010000" />
          </Form.Item>
          
          <Form.Item name="gstPercentage" label="GST Percentage">
            <Input placeholder="e.g., 5" />
          </Form.Item>
          
          <Form.Item name="sapCode" label="SAP Code">
            <Input placeholder="e.g., RM001" />
          </Form.Item>
          
          <Form.Item name="isExpiry" label="Has Expiry?" valuePropName="checked">
            <input type="checkbox" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RawMaterials;
