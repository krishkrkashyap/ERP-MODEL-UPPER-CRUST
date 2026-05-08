import { useState } from 'react';
import { Table, Button, Input, Space, Spin, Alert, DatePicker, Drawer, Descriptions, Typography, Divider, Tag, Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { DatabaseOutlined, SyncOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
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
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
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

  // Derive unique categories from data
  const categories = [...new Set((data?.data || []).map((r: StockItem) => r.inventoryItem?.category).filter(Boolean))] as string[];

  // Filtered data
  const filteredData = (data?.data || []).filter((item: StockItem) => {
    const name = item.inventoryItem?.name || '';
    const sap = item.inventoryItem?.sapCode || '';
    const cat = item.inventoryItem?.category || '';
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || sap.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || cat === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
    if (!filteredData.length) return;
    const csv = [
      'Item Name,Category,SAP Code,Quantity,Unit,Price',
      ...filteredData.map((r: StockItem) =>
        `"${r.inventoryItem?.name || ''}","${r.inventoryItem?.category || ''}","${r.inventoryItem?.sapCode || ''}",${Number(r.quantity) || 0},${r.unit || ''},${Number(r.price) || 0}`
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `inventory-${date?.format('YYYY-MM-DD') || 'unknown'}.csv`;
    a.click();
  };

  const columns: ColumnsType<StockItem> = [
    {
      title: 'Item Name',
      key: 'name',
      render: (_, record) => (
        <Text ellipsis={{ tooltip: record.inventoryItem?.name }}>
          {record.inventoryItem?.name || '-'}
        </Text>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      render: (_, record) => <Tag>{record.inventoryItem?.category || '-'}</Tag>,
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
        const isLow = qty <= 0;
        return (
          <Text style={{ color: isLow ? '#dc2626' : undefined, fontWeight: isLow ? 600 : undefined }}>
            {isNaN(qty) ? '0' : qty} {record.unit || ''}
          </Text>
        );
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
        <Button type="link" size="small" onClick={() => showItemDetails(record)}>
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

  const totalItems = data?.data?.length || 0;
  const lowStockCount = (data?.data || []).filter((i: any) => Number(i.quantity) <= 0).length;

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ margin: 0 }}>
          <DatabaseOutlined style={{ marginRight: 8 }} />
          Inventory
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          {totalItems} items tracked &middot; {lowStockCount > 0 ? <Text style={{ color: '#dc2626' }}>{lowStockCount} out of stock</Text> : 'All stocked'}
        </Text>
      </div>

      {/* ===== ACTION BAR ===== */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <OutletSelector value={menuSharingCodes} onChange={setMenuSharingCodes} />
        <DatePicker value={date} onChange={(newDate) => setDate(newDate)} size="small" />
        
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
          placeholder="Search by name or SAP code..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />

        <Button type="primary" size="small" icon={<SyncOutlined />} onClick={handleSync} style={{ background: '#1e293b', borderColor: '#1e293b' }}>
          Sync Inventory
        </Button>
        <Button size="small" icon={<DownloadOutlined />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          scroll={{ x: 'max-content' }}
        />
      </Spin>

      {/* ===== INVENTORY ITEM DETAIL DRAWER ===== */}
      <Drawer
        title={selectedItem?.inventoryItem?.name || 'Item Details'}
        placement="right"
        width={640}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedItem && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="SAP Code">{selectedItem.inventoryItem?.sapCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="Category">{selectedItem.inventoryItem?.category || '-'}</Descriptions.Item>
              <Descriptions.Item label="Current Stock">
                <Text style={{ color: Number(selectedItem.quantity) <= 0 ? '#dc2626' : undefined, fontWeight: 600 }}>
                  {Number(selectedItem.quantity) || 0} {selectedItem.unit || ''}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Price">
                ₹{Number(selectedItem.price || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Date" span={2}>
                {selectedItem.date ? dayjs(selectedItem.date).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedItem.inventoryItem && (
              <>
                <Divider><Text strong style={{ fontSize: 14 }}>Item Master Data</Text></Divider>
                <Descriptions bordered column={2} size="small">
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
