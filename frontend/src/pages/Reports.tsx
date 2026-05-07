import { useState } from 'react';
import { Table, Select, DatePicker, Spin, Alert, Typography, Card, Row, Col, Statistic } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { Title } = Typography;

interface ReportData {
  id: number;
  reportType: string;
  date: string;
  total: number;
  count: number;
  details?: any[];
}

const ReportsModule = () => {
  const [reportType, setReportType] = useState<string>('sales');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', reportType, dateRange[0]?.format('YYYY-MM-DD'), dateRange[1]?.format('YYYY-MM-DD')],
    queryFn: async () => {
      const startDate = dateRange[0]?.format('YYYY-MM-DD') || '';
      const endDate = dateRange[1]?.format('YYYY-MM-DD') || '';
      
      if (reportType === 'sales') {
        const res = await axios.get(`/api/orders?page=1&limit=100&startDate=${startDate}&endDate=${endDate}`);
        return {
          type: 'sales',
          data: res.data.data || [],
          total: res.data.data?.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) || 0,
          count: res.data.data?.length || 0
        };
      } else if (reportType === 'inventory') {
        const res = await axios.get(`/api/inventory/stock?date=${dayjs().format('YYYY-MM-DD')}`);
        return {
          type: 'inventory',
          data: res.data.data || [],
          total: res.data.data?.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0) || 0,
          count: res.data.data?.length || 0
        };
      } else if (reportType === 'financial') {
        const res = await axios.get(`/api/financial/pnl?startDate=${startDate}&endDate=${endDate}`);
        return {
          type: 'financial',
          data: res.data,
          total: res.data?.totalRevenue || 0,
          count: 1
        };
      }
      return { type: 'sales', data: [], total: 0, count: 0 };
    },
  });

  const salesColumns: ColumnsType<any> = [
    { title: 'Order ID', dataIndex: 'petpoojaOrderId', key: 'petpoojaOrderId' },
    { 
      title: 'Date', 
      dataIndex: 'createdOn', 
      key: 'createdOn',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    { title: 'Type', dataIndex: 'orderType', key: 'orderType' },
    { 
      title: 'Total', 
      dataIndex: 'total', 
      key: 'total',
      render: (total: number) => `₹${Number(total || 0).toFixed(2)}`
    },
    { title: 'Status', dataIndex: 'status', key: 'status' },
  ];

  const inventoryColumns: ColumnsType<any> = [
    { title: 'Item Name', key: 'name', render: (_, record) => record.inventoryItem?.name || '-' },
    { title: 'Category', key: 'category', render: (_, record) => record.inventoryItem?.category || '-' },
    { 
      title: 'Quantity', 
      dataIndex: 'quantity', 
      key: 'quantity',
      render: (qty: number) => qty || 0
    },
    { title: 'Unit', key: 'unit', render: (_, record) => record.inventoryItem?.unit || '-' },
  ];

  if (error) {
    return (
      <Alert
        type="error"
        message="Error loading report data"
        description={error.message || "Please ensure the backend server is running"}
        showIcon
        style={{ margin: 16 }}
      />
    );
  }

  return (
    <div>
      <Title level={2}>Reports & Analytics</Title>
     
      <div style={{ marginBottom: 16 }}>
        <Select value={reportType} onChange={setReportType} style={{ width: 200, marginRight: 16 }}>
          <Select.Option value="sales">Sales Report</Select.Option>
          <Select.Option value="inventory">Inventory Report</Select.Option>
          <Select.Option value="financial">Financial Report (P&L)</Select.Option>
        </Select>

        <DatePicker.RangePicker
          value={dateRange}
          onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
          style={{ marginRight: 16 }}
        />

        <button onClick={() => refetch()}>Refresh</button>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total"
              value={data?.total || 0}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Count"
              value={data?.count || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Report Type"
              value={reportType.toUpperCase()}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Spin spinning={isLoading}>
        {reportType === 'sales' && (
          <Table
            columns={salesColumns}
            dataSource={data?.data || []}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}

        {reportType === 'inventory' && (
          <Table
            columns={inventoryColumns}
            dataSource={data?.data || []}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}

        {reportType === 'financial' && data?.data && (
          <Card>
            <Title level={4}>Profit & Loss Statement</Title>
            <p>Total Revenue: ₹{data.data.totalRevenue?.toFixed(2) || '0.00'}</p>
            <p>Total Purchases: ₹{data.data.totalPurchases?.toFixed(2) || '0.00'}</p>
            <p>Gross Profit: ₹{data.data.grossProfit?.toFixed(2) || '0.00'}</p>
            <p>Total Tax: ₹{data.data.totalTax?.toFixed(2) || '0.00'}</p>
            <p><strong>Net Profit: ₹{data.data.netProfit?.toFixed(2) || '0.00'}</strong></p>
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default ReportsModule;
