import { useState, useMemo } from 'react';
import { Table, Button, Space, Spin, Alert, Tag, Descriptions, Drawer, Typography, Divider, Input, Switch, Select } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { UserOutlined, SyncOutlined, SearchOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import OutletSelector from '../components/OutletSelector';

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
  restaurant?: { name: string };
  orders?: any[];
}

const CustomerProfiles = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [corporateOnly, setCorporateOnly] = useState(false);
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', selectedOutlets],
    queryFn: async () => {
      const params: any = {};
      if (selectedOutlets.length > 0) params.menuSharingCodes = selectedOutlets.join(',');
      const res = await axios.get('/api/customers', { params });
      return res.data.data || res.data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      // Sync customers for each selected outlet
      const outlets = selectedOutlets.length > 0 ? selectedOutlets : ['uvhn3bim'];
      const results = [];
      for (const menuSharingCode of outlets) {
        // Find restaurant ID for this outlet
        const res = await axios.get('/api/reports/filters/restaurants');
        const restaurants = res.data.data || [];
        const restaurant = restaurants.find((r: any) => r.petpoojaRestId === menuSharingCode);
        if (restaurant) {
          const syncRes = await axios.post('/api/customers/sync', {
            restaurantId: restaurant.id,
            menuSharingCode,
            date: dayjs().format('YYYY-MM-DD')
          });
          results.push(syncRes.data);
        }
      }
      return results;
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

  const handleExportCSV = () => {
    if (!filteredData.length) return;
    const csv = [
      'Name,Phone,GSTIN,Total Orders,Restaurant,Created Date',
      ...filteredData.map((c: Customer) =>
        `"${c.name || ''}","${c.phone || ''}","${c.gstin || ''}",${c.orderCount || 0},"${c.restaurant?.name || ''}","${c.createdDate || ''}"`
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'customers.csv';
    a.click();
  };

  // Client-side filtering
  const filteredData = useMemo(() => {
    let list: Customer[] = data || [];
    
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.gstin || '').toLowerCase().includes(q)
      );
    }

    // Corporate only (has GSTIN)
    if (corporateOnly) {
      list = list.filter(c => c.gstin);
    }

    return list;
  }, [data, search, corporateOnly]);

  // Compute totalSpent from order data when available inline
  const customersWithSpent = useMemo(() => {
    return filteredData.map((c: Customer) => ({
      ...c,
      totalSpent: c.totalSpent || (c as any).totalSpentFromOrders || 0,
    }));
  }, [filteredData]);

  const columns: ColumnsType<any> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
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
      render: (gstin: string) => gstin ? <Tag color="purple">{gstin}</Tag> : '-',
    },
    {
      title: 'Total Orders',
      key: 'orderCount',
      render: (_, record) => (
        <Text strong style={{ fontSize: 15 }}>{record.orderCount || 0}</Text>
      ),
    },
    {
      title: 'Restaurant',
      key: 'restaurant',
      render: (_, record) => record.restaurant?.name || '-',
      responsive: ['md' as any],
    },
    {
      title: 'Created',
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (d: string) => d ? dayjs(d).format('DD-MM-YY') : '-',
      responsive: ['lg' as any],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => showCustomerDetails(record)}>
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

  const totalCount = data?.length || 0;
  const corporateCount = (data || []).filter((c: Customer) => c.gstin).length;

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ margin: 0 }}>
          <UserOutlined style={{ marginRight: 8 }} />
          Customer Profiles
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          {totalCount} customers &middot; {corporateCount} corporate (with GSTIN)
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

        <Input
          size="small"
          placeholder="Search by name, phone, or GSTIN..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />

        <Space>
          <Text type="secondary" style={{ fontSize: 12 }}>Corporate only:</Text>
          <Switch
            size="small"
            checked={corporateOnly}
            onChange={setCorporateOnly}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        </Space>

        <Button type="primary" size="small" icon={<SyncOutlined />} onClick={() => syncMutation.mutate()} loading={syncMutation.isPending} style={{ background: '#1e293b', borderColor: '#1e293b' }}>
          Sync Customers
        </Button>

        <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>

        <Button size="small" icon={<DownloadOutlined />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      {/* ===== TABLE ===== */}
      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={customersWithSpent}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          scroll={{ x: 'max-content' }}
        />
      </Spin>

      {/* ===== CUSTOMER DETAIL DRAWER ===== */}
      <Drawer
        title={`Customer Profile: ${selectedCustomer?.name || '...'}`}
        placement="right"
        width={800}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedCustomer && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Name">{selectedCustomer.name}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedCustomer.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                {selectedCustomer.address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="GSTIN">{selectedCustomer.gstin || '-'}</Descriptions.Item>
              <Descriptions.Item label="Created">
                {selectedCustomer.createdDate 
                  ? dayjs(selectedCustomer.createdDate).format('YYYY-MM-DD') 
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Total Orders">
                <Text strong>{selectedCustomer.orders?.length || 0}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Total Spent">
                <Text strong style={{ color: '#059669' }}>
                  ₹{(selectedCustomer.orders || []).reduce((s, o) => s + Number(o.total || 0), 0).toFixed(2)}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {/* Order History */}
            <Divider><Text strong style={{ fontSize: 14 }}>Order History</Text></Divider>
            {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
              <Table
                dataSource={selectedCustomer.orders}
                rowKey="id"
                size="small"
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
                    render: (type: string) => <Tag>{type || '-'}</Tag>,
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
