import { useState } from 'react';
import { Table, Button, Space, Spin, Alert, Tag, Descriptions, Drawer, Typography, Divider } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface Customer {
  id: number;
  petpoojaCustomerId?: string;
  name: string;
  phone?: string;
  address?: string;
  gstin?: string;
  orderCount?: number;
  totalSpent?: number;
  createdDate?: string;
  orders?: any[];
}

const CustomerProfiles = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await axios.get('/api/customers');
      return res.data.data || res.data; // Handle both { data } and direct array
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/customers/sync', {
        restaurantId: 2, // Default to UVHN3BIM (340305)
        menuSharingCode: 'uvhn3bim',
        date: dayjs().format('YYYY-MM-DD')
      });
      return response.data;
    },
    onSuccess: () => {
      alert('Customers synced successfully!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      alert(`Sync failed: ${error.message}`);
    }
  });

  const showCustomerDetails = async (record: Customer) => {
    try {
      const res = await axios.get(`/api/customers/${record.id}`);
      setSelectedCustomer(res.data.data || res.data);
      setDrawerVisible(true);
    } catch (error: any) {
      alert(`Error fetching customer details: ${error.message}`);
    }
  };

  const columns: ColumnsType<Customer> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'GSTIN',
      dataIndex: 'gstin',
      key: 'gstin',
      render: (gstin: string) => gstin || '-',
    },
    {
      title: 'Total Orders',
      key: 'orderCount',
      render: (_, record) => record.orders?.length || 0,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => showCustomerDetails(record)}>
          View Details
        </Button>
      ),
    },
  ];

  if (error) {
    return (
      <Alert
        type="error"
        message="Error loading customers"
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
          <Button type="primary" onClick={() => syncMutation.mutate()} loading={syncMutation.isPending}>
            Sync Customers
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

      {/* Customer Details Drawer */}
      <Drawer
        title={`Customer Profile: ${selectedCustomer?.name || '...'}`}
        placement="right"
        width={800}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedCustomer && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Name">{selectedCustomer.name}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedCustomer.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                {selectedCustomer.address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="GSTIN">{selectedCustomer.gstin || '-'}</Descriptions.Item>
              <Descriptions.Item label="Created Date">
                {selectedCustomer.createdDate 
                  ? dayjs(selectedCustomer.createdDate).format('YYYY-MM-DD') 
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Order History */}
            <Divider><Title level={5}>Order History</Title></Divider>
            {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
              <Table
                dataSource={selectedCustomer.orders}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                columns={[
                  {
                    title: 'Order ID',
                    dataIndex: 'petpoojaOrderId',
                    key: 'petpoojaOrderId',
                  },
                  {
                    title: 'Date',
                    dataIndex: 'createdOn',
                    key: 'createdOn',
                    render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
                  },
                  {
                    title: 'Type',
                    dataIndex: 'orderType',
                    key: 'orderType',
                    render: (type: string) => <Tag>{type}</Tag>,
                  },
                  {
                    title: 'Total',
                    dataIndex: 'total',
                    key: 'total',
                    render: (total: number) => `₹${Number(total || 0).toFixed(2)}`,
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: string) => (
                      <Tag color={status === 'Success' ? 'green' : 'red'}>
                        {status}
                      </Tag>
                    ),
                  },
                ]}
              />
            ) : (
              <Alert type="info" message="No orders found for this customer" showIcon />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomerProfiles;
