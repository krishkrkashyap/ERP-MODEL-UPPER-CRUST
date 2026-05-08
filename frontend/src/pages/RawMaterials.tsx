import { useState } from 'react';
import { Table, Button, Space, Spin, Alert, Input, message, Modal, Form, Select, Tag, Typography } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import { AppstoreOutlined, PlusOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import OutletSelector from '../components/OutletSelector';

const { Title, Text } = Typography;

interface RawMaterial {
  id: number;
  name: string;
  category?: string;
  type: string;
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
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['raw-materials', categoryFilter, selectedOutlets],
    queryFn: async () => {
      const params: any = {};
      if (categoryFilter) params.category = categoryFilter;
      if (selectedOutlets.length > 0) params.menuSharingCodes = selectedOutlets.join(',');
      const res = await axios.get('/api/raw-materials', { params });
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

  // Derive categories from data
  const categories = [...new Set((data || []).map((r: RawMaterial) => r.category).filter(Boolean))] as string[];

  // Client-side search
  const filteredData = (data || []).filter((r: RawMaterial) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) ||
           (r.sapCode || '').toLowerCase().includes(q) ||
           (r.category || '').toLowerCase().includes(q);
  });

  const handleExportCSV = () => {
    if (!filteredData.length) return;
    const csv = [
      'Name,Category,Unit,Consumption Unit,Conversion Qty,HSN Code,GST %,SAP Code,Status',
      ...filteredData.map((r: RawMaterial) =>
        `"${r.name}","${r.category || ''}","${r.unit}","${r.consumptionUnit || ''}",${r.conversionQty || ''},"${r.hsnCode || ''}",${r.gstPercentage || 0},"${r.sapCode || ''}",${r.status ? 'Active' : 'Inactive'}`
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'raw-materials.csv';
    a.click();
  };

  const columns: ColumnsType<RawMaterial> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => cat ? <Tag>{cat}</Tag> : '-',
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Consumption Unit',
      dataIndex: 'consumptionUnit',
      key: 'consumptionUnit',
      render: (v: string) => v || '-',
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
        <Tag color={status ? 'green' : 'red'}>
          {status ? 'Active' : 'Inactive'}
        </Tag>
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
        type: 'R',
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

  const totalCount = data?.length || 0;

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ margin: 0 }}>
          <AppstoreOutlined style={{ marginRight: 8 }} />
          Raw Materials
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          {totalCount} raw materials tracked &middot; Inventory ingredients used in production
        </Text>
      </div>

      {/* ===== ACTION BAR ===== */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <OutletSelector
          value={selectedOutlets}
          onChange={setSelectedOutlets}
          placeholder="All Outlets"
          style={{ minWidth: 180 }}
        />

        <Select
          size="small"
          placeholder="All Categories"
          value={categoryFilter}
          onChange={(val) => setCategoryFilter(val)}
          allowClear
          style={{ width: 160 }}
          options={categories.map(c => ({ label: c, value: c }))}
        />

        <Input
          size="small"
          placeholder="Search by name, SAP code, or category..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />

        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} style={{ background: '#1e293b', borderColor: '#1e293b' }}>
          Add Raw Material
        </Button>

        <Button size="small" icon={<DownloadOutlined />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      {/* ===== TABLE ===== */}
      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Spin>

      {/* ===== CREATE MODAL ===== */}
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
