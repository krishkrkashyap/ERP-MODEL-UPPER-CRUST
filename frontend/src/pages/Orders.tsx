import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Spin, Alert, DatePicker, Drawer, Descriptions, Typography, Divider, Select, Input } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { ShoppingCartOutlined, SyncOutlined, SearchOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import OutletSelector from '../components/OutletSelector';

const { Text, Title } = Typography;

interface Order {
  id: number;
  petpoojaOrderId: string;
  orderType: string;
  paymentType: string;
  total: number;
  status: string;
  createdOn: string;
  restaurant?: any;
  customer?: any;
  orderItems?: any[];
  taxes?: any[];
  discounts?: any[];
  rawPayload?: string;
}

const Orders = () => {
  const [page, setPage] = useState(1);
  const [syncDate, setSyncDate] = useState<Dayjs | null>(dayjs().subtract(1, 'day'));
  const [menuSharingCodes, setMenuSharingCodes] = useState<string[]>(['uvhn3bim']);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [paymentFilter, setPaymentFilter] = useState<string | undefined>(undefined);
  const [restaurantFilter, setRestaurantFilter] = useState<number | undefined>(undefined);
  const [searchText, setSearchText] = useState('');

  // Restaurant options
  const [restaurants, setRestaurants] = useState<any[]>([]);
  useEffect(() => {
    axios.get('/api/restaurants').then(r => setRestaurants(r.data || [])).catch(() => {});
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', page, syncDate ? syncDate.format('YYYY-MM-DD') : '2026-05-05', menuSharingCodes, statusFilter, paymentFilter, restaurantFilter],
    queryFn: async () => {
      const formattedDate = syncDate?.format('YYYY-MM-DD') || '2026-05-05';
      const codes = menuSharingCodes.join(',');
      const params: any = { page, limit: 10, date: formattedDate, menuSharingCodes: codes };
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.paymentType = paymentFilter;
      if (restaurantFilter) params.restaurantId = restaurantFilter;
      const res = await axios.get(`/api/orders`, { params });
      return res.data;
    },
  });

  const showOrderDetails = (record: Order) => {
    setSelectedOrder(record);
    setDrawerVisible(true);
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Order ID',
      dataIndex: 'petpoojaOrderId',
      key: 'petpoojaOrderId',
      width: 100,
    },
    {
      title: 'Restaurant',
      key: 'restaurant',
      width: 140,
      render: (_, r) => r.restaurant?.name || '-',
    },
    {
      title: 'Type',
      dataIndex: 'orderType',
      key: 'orderType',
      width: 90,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 110,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 90,
      render: (total: any) => {
        const num = parseFloat(total);
        return `₹${isNaN(num) ? '0.00' : num.toFixed(2)}`;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={status === 'Success' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdOn',
      key: 'createdOn',
      width: 150,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => showOrderDetails(record as Order)}>
          View Details
        </Button>
      ),
    },
  ];

  const handleSync = async () => {
    try {
      await axios.post('/api/orders/sync', {
        orderDate: syncDate?.format('YYYY-MM-DD'),
        menuSharingCodes
      });
      refetch();
      alert('Orders synced successfully!');
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    }
  };

  if (error) {
    return (
      <Alert
        type="error"
        message="Error loading orders"
        description={error.message || "Please ensure the backend server is running"}
        showIcon
        style={{ margin: 16 }}
      />
    );
  }

  // Parse raw payload for display
  let payload: any = null;
  if (selectedOrder?.rawPayload) {
    try {
      payload = JSON.parse(selectedOrder.rawPayload);
    } catch (e) {
      console.error('Failed to parse raw payload:', e);
    }
  }

  // Client-side search filter
  const filteredData = (data?.data || []).filter((o: Order) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return o.petpoojaOrderId?.toLowerCase().includes(q) ||
           o.customer?.name?.toLowerCase().includes(q) ||
           o.customer?.phone?.includes(q);
  });

  const orderTotal = data?.pagination?.total || 0;

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ margin: 0 }}>
          <ShoppingCartOutlined style={{ marginRight: 8 }} />
          Orders
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          {orderTotal} total orders &middot; {syncDate?.format('DD-MM-YYYY') || 'No date'}
        </Text>
      </div>

      {/* ===== ACTION BAR ===== */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <OutletSelector value={menuSharingCodes} onChange={setMenuSharingCodes} />
        <DatePicker value={syncDate} onChange={(date) => date && setSyncDate(date)} size="small" />
        
        <Select
          size="small"
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1); }}
          allowClear
          style={{ width: 130 }}
          options={[
            { label: 'Success', value: 'Success' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
        />

        <Select
          size="small"
          placeholder="Payment Type"
          value={paymentFilter}
          onChange={(val) => { setPaymentFilter(val); setPage(1); }}
          allowClear
          style={{ width: 140 }}
        >
          {/* We'll get options from data or hardcode common ones */}
          <Select.Option value="Cash">Cash</Select.Option>
          <Select.Option value="Other">Other</Select.Option>
          <Select.Option value="Due Payment">Due Payment</Select.Option>
          <Select.Option value="Part Payment">Part Payment</Select.Option>
        </Select>

        <Select
          size="small"
          placeholder="All Restaurants"
          value={restaurantFilter}
          onChange={(val) => { setRestaurantFilter(val); setPage(1); }}
          allowClear
          showSearch
          style={{ width: 180 }}
          filterOption={(input, option) => (option?.label as string || '').toLowerCase().includes(input.toLowerCase())}
          options={restaurants.map(r => ({ label: r.name, value: r.id }))}
        />

        <Input
          size="small"
          placeholder="Search by Order ID or Customer..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 220 }}
          allowClear
        />

        <Button type="primary" size="small" icon={<SyncOutlined />} onClick={handleSync} style={{ background: '#1e293b', borderColor: '#1e293b' }}>
          Sync Orders
        </Button>
        <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* ===== TABLE ===== */}
      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          size="small"
          pagination={{
            current: page,
            pageSize: 10,
            total: data?.pagination?.total || 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Spin>

      {/* ===== ORDER DETAIL DRAWER ===== */}
      <Drawer
        title={`Order #${selectedOrder?.petpoojaOrderId || ''}`}
        placement="right"
        width={800}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Order Type">{selectedOrder.orderType}</Descriptions.Item>
              <Descriptions.Item label="Payment Type">{selectedOrder.paymentType}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedOrder.status === 'Success' ? 'green' : 'red'}>
                  {selectedOrder.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                ₹{parseFloat(String(selectedOrder.total)).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Date" span={2}>
                {selectedOrder.createdOn ? dayjs(selectedOrder.createdOn).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Customer Info */}
            {selectedOrder.customer && (
              <>
                <Divider><Text strong style={{ fontSize: 14 }}>Customer Information</Text></Divider>
                <Table
                  dataSource={[selectedOrder.customer]}
                  rowKey="phone"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Name', dataIndex: 'name', key: 'name' },
                    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
                    { title: 'Address', dataIndex: 'address', key: 'address' },
                    { title: 'GST No', dataIndex: 'gst_no', key: 'gst_no' },
                    { title: 'Created', dataIndex: 'created_date', key: 'created_date' },
                  ]}
                />
              </>
            )}

            {/* Order Items from DB */}
            {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
              <>
                <Divider><Text strong style={{ fontSize: 14 }}>Order Items</Text></Divider>
                <Table
                  dataSource={selectedOrder.orderItems}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Item', dataIndex: 'name', key: 'name' },
                    { title: 'Code', dataIndex: 'itemCode', key: 'itemCode' },
                    { title: 'Category', dataIndex: 'categoryName', key: 'categoryName' },
                    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                    { title: 'Price', dataIndex: 'price', key: 'price', render: (p: any) => `₹${parseFloat(p || 0).toFixed(2)}` },
                    { title: 'Total', dataIndex: 'total', key: 'total', render: (t: any) => `₹${parseFloat(t || 0).toFixed(2)}` },
                    { title: 'SAP', dataIndex: 'sapCode', key: 'sapCode' },
                  ]}
                />
              </>
            )}

            {/* Fallback: Items from Raw Payload */}
            {(!selectedOrder.orderItems || selectedOrder.orderItems.length === 0) && 
              payload?.OrderItem && payload.OrderItem.length > 0 && (
              <>
                <Divider><Text strong style={{ fontSize: 14 }}>Order Items (from API)</Text></Divider>
                <Table
                  dataSource={payload.OrderItem}
                  rowKey={(_, i) => String(i)}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Item', dataIndex: 'name', key: 'name' },
                    { title: 'Code', dataIndex: 'itemcode', key: 'itemcode' },
                    { title: 'Category', dataIndex: 'categoryname', key: 'categoryname' },
                    { title: 'Qty', dataIndex: 'quantity', key: 'quantity', render: (q: any) => q || 0 },
                    { title: 'Price', dataIndex: 'price', key: 'price', render: (p: any) => `₹${parseFloat(p || 0).toFixed(2)}` },
                    { title: 'Total', dataIndex: 'total', key: 'total', render: (t: any) => `₹${parseFloat(t || 0).toFixed(2)}` },
                    { title: 'SAP', dataIndex: 'itemsapcode', key: 'itemsapcode' },
                  ]}
                />
              </>
            )}

            {/* Taxes from DB */}
            {selectedOrder.taxes && selectedOrder.taxes.length > 0 && (
              <>
                <Divider><Text strong style={{ fontSize: 14 }}>Taxes</Text></Divider>
                <Table
                  dataSource={selectedOrder.taxes}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Title', dataIndex: 'title', key: 'title' },
                    { title: 'Rate (%)', dataIndex: 'rate', key: 'rate' },
                    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: any) => `₹${parseFloat(a || 0).toFixed(2)}` },
                  ]}
                />
              </>
            )}

            {/* Fallback: Taxes from Payload */}
            {(!selectedOrder.taxes || selectedOrder.taxes.length === 0) && 
              payload?.Tax && payload.Tax.length > 0 && (
              <>
                <Divider><Text strong style={{ fontSize: 14 }}>Taxes (from API)</Text></Divider>
                <Table
                  dataSource={payload.Tax}
                  rowKey={(_, i) => String(i)}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Name', dataIndex: 'title', key: 'title' },
                    { title: 'Rate (%)', dataIndex: 'rate', key: 'rate' },
                    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: any) => `₹${parseFloat(a || 0).toFixed(2)}` },
                  ]}
                />
              </>
            )}

            {/* Discounts from DB */}
            {selectedOrder.discounts && selectedOrder.discounts.length > 0 && (
              <>
                <Divider><Text strong style={{ fontSize: 14 }}>Discounts</Text></Divider>
                <Table
                  dataSource={selectedOrder.discounts}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Title', dataIndex: 'title', key: 'title' },
                    { title: 'Rate', dataIndex: 'rate', key: 'rate' },
                    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: any) => `₹${parseFloat(a || 0).toFixed(2)}` },
                  ]}
                />
              </>
            )}

            {/* Fallback: Discounts from Payload */}
            {(!selectedOrder.discounts || selectedOrder.discounts.length === 0) && 
              payload?.Discount && payload.Discount.length > 0 && (
              <>
                <Divider><Text strong style={{ fontSize: 14 }}>Discounts (from API)</Text></Divider>
                <Table
                  dataSource={payload.Discount}
                  rowKey={(_, i) => String(i)}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Name', dataIndex: 'title', key: 'title' },
                    { title: 'Type', dataIndex: 'type', key: 'type' },
                    { title: 'Rate', dataIndex: 'rate', key: 'rate' },
                    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: any) => `₹${parseFloat(a || 0).toFixed(2)}` },
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Orders;
