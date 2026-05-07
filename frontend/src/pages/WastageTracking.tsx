import { useState } from 'react';
import { Table, Button, Space, Spin, Alert, DatePicker, Form, Input, Select, message, Modal } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

interface WastageRecord {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  type: string; // "Wastage"
  total: number;
  totalTax: number;
  receiverName: string;
  receiverType: string;
  status: string;
  restaurantId: number;
  createdAt: string;
}

const WastageTracking = () => {
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['wastage', date ? date.format('YYYY-MM-DD') : ''],
    queryFn: async () => {
      const formattedDate = date ? date.format('YYYY-MM-DD') : '';
      const res = await axios.get(`/api/wastage?date=${formattedDate}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await axios.post('/api/wastage', {
        ...values,
        type: 'Wastage', // Always Wastage type
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

  const columns: ColumnsType<WastageRecord> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <span style={{ color: type === 'Wastage' ? 'orange' : 'black' }}>
          {type}
        </span>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `₹${Number(total || 0).toFixed(2)}`,
    },
    {
      title: 'Tax',
      dataIndex: 'totalTax',
      key: 'totalTax',
      render: (tax: number) => `₹${Number(tax || 0).toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === '1' ? 'green' : 'red' }}>
          {status === '1' ? 'Active' : 'Cancelled'}
        </span>
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
      <div style={{ marginBottom: 16 }}>
        <Space>
          <DatePicker
            value={date}
            onChange={(d) => d && setDate(d)}
            placeholder="Filter by date"
          />
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Log Wastage
          </Button>
          <Button onClick={() => refetch()}>
            Refresh
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
            <Input placeholder="Optional" />
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
