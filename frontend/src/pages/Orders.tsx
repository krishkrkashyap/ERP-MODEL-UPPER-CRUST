import { useState } from 'react';
import { Table, Button, Space, Tag, Spin, Alert, DatePicker, Drawer, Descriptions, Typography, Divider } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { Text, Title } = Typography;
import OutletSelector from '../components/OutletSelector';

interface Order {
  id: number;
  petpoojaOrderId: string;
  orderType: string;
  paymentType: string;
  total: number;
  status: string;
  createdOn: string;
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
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', page, syncDate ? syncDate.format('YYYY-MM-DD') : '2026-05-05', menuSharingCodes],
    queryFn: async () => {
      const formattedDate = syncDate?.format('YYYY-MM-DD') || '2026-05-05';
      const codes = menuSharingCodes.join(',');
      const res = await axios.get(`/api/orders?page=${page}&limit=10&date=${formattedDate}&menuSharingCodes=${codes}`);
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
    },
    {
      title: 'Type',
      dataIndex: 'orderType',
      key: 'orderType',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentType',
      key: 'paymentType',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: any) => {
        const num = parseFloat(total);
        return `₹${isNaN(num) ? '0.00' : num.toFixed(2)}`;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Success' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdOn',
      key: 'createdOn',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => showOrderDetails(record as Order)}>
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

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <OutletSelector value={menuSharingCodes} onChange={setMenuSharingCodes} />
          <DatePicker
            value={syncDate}
            onChange={(date) => date && setSyncDate(date)}
          />
          <Button type="primary" onClick={handleSync}>
            Sync Orders
          </Button>
        </Space>
      </div>
      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: 10,
            total: data?.pagination?.total || 0,
            onChange: setPage,
          }}
        />
      </Spin>

      {/* Order Details Drawer */}
      <Drawer
        title="Order Details"
        placement="right"
        width={800}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedOrder && (
          <div>
            <Title level={4}>Order #{selectedOrder.petpoojaOrderId}</Title>
            
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
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

            {/* Customer Info Table */}
            {selectedOrder.customer && (
              <>
                  <Divider><Title level={5}>Customer Information</Title></Divider>
                  <Table
                    dataSource={[selectedOrder.customer]}
                    rowKey="phone"
                    pagination={false}
                    columns={[
                      { title: 'Name', dataIndex: 'name', key: 'name' },
                      { title: 'Phone', dataIndex: 'phone', key: 'phone' },
                      { title: 'Address', dataIndex: 'address', key: 'address' },
                      { title: 'GST No', dataIndex: 'gst_no', key: 'gst_no' },
                      { title: 'Created Date', dataIndex: 'created_date', key: 'created_date' },
                    ]}
                  />
              </>
            )}

            {/* Order Details from DB */}
            {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
              <>
                  <Divider><Title level={5}>Order Items (from DB)</Title></Divider>
                  <Table
                    dataSource={selectedOrder.orderItems}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: 'Item Name', dataIndex: 'name', key: 'name' },
                      { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode' },
                      { title: 'Category', dataIndex: 'categoryName', key: 'categoryName' },
                      { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                      { title: 'Price', dataIndex: 'price', key: 'price', render: (p: any) => `₹${parseFloat(p || 0).toFixed(2)}` },
                      { title: 'Total', dataIndex: 'total', key: 'total', render: (t: any) => `₹${parseFloat(t || 0).toFixed(2)}` },
                      { title: 'SAP Code', dataIndex: 'sapCode', key: 'sapCode' },
                    ]}
                  />
              </>
            )}

            {/* Order Items from Raw Payload (fallback) */}
            {(!selectedOrder.orderItems || selectedOrder.orderItems.length === 0) && 
              payload?.OrderItem && payload.OrderItem.length > 0 && (
              <>
                  <Divider><Title level={5}>Order Items (from API)</Title></Divider>
                  <Table
                    dataSource={payload.OrderItem}
                    rowKey={(record, index) => String(index)}
                    pagination={false}
                    columns={[
                      { title: 'Item ID', dataIndex: 'itemid', key: 'itemid' },
                      { title: 'Item Name', dataIndex: 'name', key: 'name' },  // API: "name" not "itemname"
                      { title: 'Item Code', dataIndex: 'itemcode', key: 'itemcode' },
                      { title: 'Category', dataIndex: 'categoryname', key: 'categoryname' },
                      { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', render: (q: any) => q || 0 },  // API: "quantity" not "qty"
                      { title: 'Price', dataIndex: 'price', key: 'price', render: (p: any) => `₹${parseFloat(p || 0).toFixed(2)}` },
                      { title: 'Total', dataIndex: 'total', key: 'total', render: (t: any) => `₹${parseFloat(t || 0).toFixed(2)}` },
                      { title: 'SAP Code', dataIndex: 'itemsapcode', key: 'itemsapcode' },  // API: "itemsapcode" not "hsn_code"
                    ]}
                  />
              </>
            )}

            {/* Taxes from DB */}
            {selectedOrder.taxes && selectedOrder.taxes.length > 0 && (
              <>
                  <Divider><Title level={5}>Taxes (from DB)</Title></Divider>
                  <Table
                    dataSource={selectedOrder.taxes}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: 'Title', dataIndex: 'title', key: 'title' },
                      { title: 'Rate (%)', dataIndex: 'rate', key: 'rate' },
                      { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: any) => `₹${parseFloat(a || 0).toFixed(2)}` },
                    ]}
                  />
              </>
            )}

            {/* Taxes from Raw Payload (fallback) */}
            {(!selectedOrder.taxes || selectedOrder.taxes.length === 0) && 
              payload?.Tax && payload.Tax.length > 0 && (
              <>
                  <Divider><Title level={5}>Taxes (from API)</Title></Divider>
                  <Table
                    dataSource={payload.Tax}
                    rowKey={(record, index) => String(index)}
                    pagination={false}
                    columns={[
                      { title: 'Tax Name', dataIndex: 'title', key: 'title' },  // API: "title" not "tax_name"
                      { title: 'Rate (%)', dataIndex: 'rate', key: 'rate' },  // API: "rate" not "tax_percentage"
                      { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: any) => `₹${parseFloat(a || 0).toFixed(2)}` },
                    ]}
                  />
              </>
            )}

            {/* Discounts from DB */}
            {selectedOrder.discounts && selectedOrder.discounts.length > 0 && (
              <>
                  <Divider><Title level={5}>Discounts (from DB)</Title></Divider>
                  <Table
                    dataSource={selectedOrder.discounts}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: 'Title', dataIndex: 'title', key: 'title' },
                      { title: 'Rate (%)', dataIndex: 'rate', key: 'rate' },
                      { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: any) => `₹${parseFloat(a || 0).toFixed(2)}` },
                    ]}
                  />
              </>
            )}

            {/* Discounts from Raw Payload (fallback) */}
            {(!selectedOrder.discounts || selectedOrder.discounts.length === 0) && 
              payload?.Discount && payload.Discount.length > 0 && (
              <>
                  <Divider><Title level={5}>Discounts (from API)</Title></Divider>
                  <Table
                    dataSource={payload.Discount}
                    rowKey={(record, index) => String(index)}
                    pagination={false}
                    columns={[
                      { title: 'Discount Name', dataIndex: 'title', key: 'title' },  // API: "title" not "discount_name"
                      { title: 'Type', dataIndex: 'type', key: 'type' },  // API: "type" not "discount_type"
                      { title: 'Rate', dataIndex: 'rate', key: 'rate' },  // API: "rate"
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
