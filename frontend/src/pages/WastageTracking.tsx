import { useState } from 'react';
import { Table, Button, Space, Spin, Alert, DatePicker, Form, Input, Select, message, Modal, Typography, Card, Row, Col, Statistic, Tag } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { DeleteOutlined, PlusOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import OutletSelector from '../components/OutletSelector';

const { Title, Text } = Typography;

interface WastageRecord {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  type: string;
  total: number;
  totalTax: number;
  receiverName: string;
  receiverType: string;
  status: string;
}

const WastageTracking = () => {
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['wastage', date ? date.format('YYYY-MM-DD') : '', selectedOutlets],
    queryFn: async () => {
      const formattedDate = date ? date.format('YYYY-MM-DD') : '';
      const params: any = { date: formattedDate };
      if (selectedOutlets.length > 0) params.menuSharingCodes = selectedOutlets.join(',');
      const res = await axios.get('/api/wastage', { params });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.post('/api/wastage', {
        ...values,
        type: 'Wastage',
        invoiceDate: values.invoiceDate?.format('YYYY-MM-DD'),
        itemDetails: values.itemDetails || []
      });
      return response.data;
    },
    onSuccess: () => {
      message.success('Wastage logged successfully!');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['wastage'] });
    },
    onError: (error: any) => {
      message.error(`Failed to log wastage: ${error.message}`);
    }
  });

  const records: WastageRecord[] = data || [];
  const totalLoss = records.reduce((sum, r) => sum + Number(r.total || 0), 0);
  const totalTax = records.reduce((sum, r) => sum + Number(r.totalTax || 0), 0);

  const columns: ColumnsType<WastageRecord> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (v: string) => v || '-',
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Total Loss',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => (
        <Text style={{ color: '#dc2626', fontWeight: 600 }}>
          -₹{Number(total || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Tax',
      dataIndex: 'totalTax',
      key: 'totalTax',
      render: (tax: number) => `₹${Number(tax || 0).toFixed(2)}`,
    },
    {
      title: 'Receiver',
      dataIndex: 'receiverName',
      key: 'receiverName',
      render: (name: string) => name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '1' ? 'green' : 'red'}>
          {status === '1' ? 'Active' : 'Cancelled'}
        </Tag>
      ),
    },
  ];

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      createMutation.mutate(values);
    } catch (error) {
      // Form validation error
    }
  };

  if (error) {
    return (
      <Alert
        type="error"
        message="Error loading wastage records"
        description={error.message || "Please ensure the backend server is running"}
        showIcon
        style={{ margin: 16 }}
      />
    );
  }

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ margin: 0 }}>
          <DeleteOutlined style={{ marginRight: 8 }} />
          Wastage Tracking
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          {records.length} records for {date?.format('DD-MM-YYYY') || 'today'} &middot; Track inventory losses
        </Text>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <Statistic
              title="Total Loss"
              value={totalLoss}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#dc2626' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <Statistic
              title="Total Tax"
              value={totalTax}
              precision={2}
              prefix="₹"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <Statistic
              title="Records"
              value={records.length}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* ===== ACTION BAR ===== */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <OutletSelector
          value={selectedOutlets}
          onChange={setSelectedOutlets}
          placeholder="All Outlets"
          style={{ minWidth: 180 }}
        />
        
        <DatePicker
          value={date}
          onChange={(d) => d && setDate(d)}
          size="small"
        />
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} style={{ background: '#1e293b', borderColor: '#1e293b' }}>
          Log Wastage
        </Button>
        <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* ===== TABLE ===== */}
      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Spin>

      {/* ===== CREATE MODAL ===== */}
      <Modal
        title="Log Wastage"
        open={isModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="invoiceDate" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="invoiceNumber" label="Invoice Number">
            <Input placeholder="Auto-generated if empty" />
          </Form.Item>
          
          <Form.Item name="total" label="Total Loss (₹)" rules={[{ required: true }]}>
            <Input type="number" placeholder="0.00" />
          </Form.Item>
          
          <Form.Item name="totalTax" label="Tax Amount (₹)">
            <Input type="number" placeholder="0.00" />
          </Form.Item>
          
          <Form.Item name="receiverName" label="Receiver Name">
            <Input placeholder="e.g., Waste Disposal" />
          </Form.Item>
          
          <Form.Item name="receiverType" label="Receiver Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Select.Option value="S">S (Sole Proprietor)</Select.Option>
              <Select.Option value="C">C (Corporation)</Select.Option>
              <Select.Option value="P">P (Partnership)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WastageTracking;
