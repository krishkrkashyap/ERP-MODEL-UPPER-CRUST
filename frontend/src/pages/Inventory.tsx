import { useState } from 'react';
import { Table, Button, Input, Space, Spin, Alert, DatePicker, Drawer, Descriptions, Typography, Divider, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import OutletSelector from '../components/OutletSelector';

const { Text, Title } = Typography;

interface StockItem {
  id: number;
  inventoryItem: {
    name: string;
    category: string;
    sapCode: string;
    unit?: string;
    consumptionUnit?: string;
    conversionQty?: number;
    hsnCode?: string;
    gstPercentage?: number;
    type?: string;
    isExpiry?: boolean;
    status?: boolean;
  };
  quantity: number;
  unit: string;
  price: number;
  date: string;
}

const Inventory = () => {
  const [date, setDate] = useState<Dayjs | null>(dayjs().subtract(1, 'day'));
  const [search, setSearch] = useState('');
  const [menuSharingCodes, setMenuSharingCodes] = useState<string[]>(['uvhn3bim']);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', date ? date.format('YYYY-MM-DD') : '2026-05-05', menuSharingCodes],
    queryFn: async () => {
      const formattedDate = date ? date.format('YYYY-MM-DD') : '2026-05-05';
      const codes = menuSharingCodes.join(',');
      const res = await axios.get(`/api/inventory/stock?date=${formattedDate}&menuSharingCodes=${codes}`);
      return res.data;
    },
  });

  const showItemDetails = (record: any) => {
    setSelectedItem(record);
    setDrawerVisible(true);
  };

  const columns: ColumnsType<StockItem> = [
    {
      title: 'Item Name',
      key: 'name',
      render: (_, record) => record.inventoryItem?.name || '-',
    },
    {
      title: 'Category',
      key: 'category',
      render: (_, record) => record.inventoryItem?.category || '-',
    },
    {
      title: 'SAP Code',
      key: 'sapCode',
      render: (_, record) => record.inventoryItem?.sapCode || '-',
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => {
        const qty = Number(record.quantity);
        return `${isNaN(qty) ? '0' : qty} ${record.unit || ''}`;
      },
    },
    {
      title: 'Price',
      key: 'price',
      render: (_, record) => {
        const num = Number(record.price);
        return `₹${isNaN(num) ? '0.00' : num.toFixed(2)}`;
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => showItemDetails(record)}>
          View Details
        </Button>
      ),
    },
  ];

  const handleSync = async () => {
    try {
      const formattedDate = date?.format('YYYY-MM-DD') || '2026-05-05';
      await axios.post('/api/inventory/stock/sync', { date: formattedDate, menuSharingCodes });
      refetch();
      alert('Inventory synced successfully!');
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    }
  };

  const filteredData = data?.data?.filter((item: StockItem) =>
    search
      ? item.inventoryItem?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.inventoryItem?.sapCode?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  if (error) {
    return (
      <Alert
        type="error"
        message="Error loading inventory"
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
          <OutletSelector value={menuSharingCodes} onChange={setMenuSharingCodes} />
          <DatePicker
            value={date}
            onChange={(newDate) => setDate(newDate)}
          />
          <Input
            placeholder="Search by name or SAP code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
          />
          <Button type="primary" onClick={handleSync}>
            Sync Inventory
          </Button>
        </Space>
      </div>
      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={filteredData || []}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Spin>

      {/* Inventory Item Details Drawer */}
      <Drawer
        title="Inventory Item Details"
        placement="right"
        width={640}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedItem && (
          <div>
            <Title level={4}>{selectedItem.inventoryItem?.name || 'Unknown Item'}</Title>
            
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="SAP Code">{selectedItem.inventoryItem?.sapCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="Category">{selectedItem.inventoryItem?.category || '-'}</Descriptions.Item>
              <Descriptions.Item label="Current Stock">
                {Number(selectedItem.quantity) || 0} {selectedItem.unit || ''}
              </Descriptions.Item>
              <Descriptions.Item label="Price">
                ₹{Number(selectedItem.price || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Date" span={2}>
                {selectedItem.date ? dayjs(selectedItem.date).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Additional Item Details */}
            {selectedItem.inventoryItem && (
              <>
                <Divider><Title level={5}>Item Master Data</Title></Divider>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Type">{selectedItem.inventoryItem.type || '-'}</Descriptions.Item>
                  <Descriptions.Item label="HSN Code">{selectedItem.inventoryItem.hsnCode || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Purchase Unit">{selectedItem.inventoryItem.unit || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Consumption Unit">{selectedItem.inventoryItem.consumptionUnit || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Conversion Qty">{selectedItem.inventoryItem.conversionQty || '-'}</Descriptions.Item>
                  <Descriptions.Item label="GST %">{selectedItem.inventoryItem.gstPercentage || '0'}%</Descriptions.Item>
                  <Descriptions.Item label="Expiry Tracking">
                    {selectedItem.inventoryItem.isExpiry ? 'Yes' : 'No'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={selectedItem.inventoryItem.status ? 'green' : 'red'}>
                      {selectedItem.inventoryItem.status ? 'Active' : 'Inactive'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Inventory;
