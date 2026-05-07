import { useState } from 'react';
import { Table, Select, DatePicker, Spin, Alert, Typography, Card, Row, Col, Statistic, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

interface TaxLiability {
  taxType: string; // 'CGST', 'SGST', 'IGST'
  rate: number;
  amount: number;
  orderCount: number;
  invoiceCount: number;
}

const FinancialModule = () => {
  const [period, setPeriod] = useState<string>('monthly');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([dayjs().startOf('month'), dayjs().endOf('month')]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['tax-liability', period, dateRange[0]?.format('YYYY-MM-DD'), dateRange[1]?.format('YYYY-MM-DD')],
    queryFn: async () => {
      const startDate = dateRange[0]?.format('YYYY-MM-DD') || '';
      const endDate = dateRange[1]?.format('YYYY-MM-DD') || '';
      const res = await axios.get(`/api/financial/tax-liability?startDate=${startDate}&endDate=${endDate}`);
      return res.data;
    },
  });

  const columns: ColumnsType<TaxLiability> = [
    {
      title: 'Tax Type',
      dataIndex: 'taxType',
      key: 'taxType',
      render: (type: string) => {
        let color = 'blue';
        if (type.includes('CGST')) color = 'green';
        if (type.includes('SGST')) color = 'orange';
        if (type.includes('IGST')) color = 'purple';
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: 'Rate (%)',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => `${rate}%`,
    },
    {
      title: 'Total Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `₹${Number(amount || 0).toFixed(2)}`,
    },
    {
      title: 'Order Count',
      dataIndex: 'orderCount',
      key: 'orderCount',
    },
    {
      title: 'Invoice Count',
      dataIndex: 'invoiceCount',
      key: 'invoiceCount',
    },
  ];

  if (error) {
    return (
      <Alert
        type="error"
        message="Error loading tax liability data"
        description={error.message || "Please ensure the backend server is running"}
        showIcon
        style={{ margin: 16 }}
      />
    );
  }

  const totalTax = data?.reduce((sum: number, item: TaxLiability) => sum + (item.amount || 0), 0) || 0;

  return (
    <div>
      <Title level={2}>Financial Management</Title>
      
      <div style={{ marginBottom: 16 }}>
        <Select value={period} onChange={setPeriod}>
            <Select.Option value="daily">Daily</Select.Option>
            <Select.Option value="weekly">Weekly</Select.Option>
            <Select.Option value="monthly">Monthly</Select.Option>
          </Select>
          
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            placeholder={['Start Date', 'End Date']}
          />
        </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Tax Liability"
              value={totalTax}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="CGST + SGST"
              value={data?.filter((d: TaxLiability) => d.taxType.includes('GST')).reduce((sum: number, item: TaxLiability) => sum + item.amount, 0) || 0}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="IGST"
              value={data?.filter((d: TaxLiability) => d.taxType.includes('IGST')).reduce((sum: number, item: TaxLiability) => sum + item.amount, 0) || 0}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={data || []}
          rowKey="taxType"
          pagination={false}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>Total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>₹{totalTax.toFixed(2)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>-</Table.Summary.Cell>
                <Table.Summary.Cell index={4}>-</Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Spin>
    </div>
  );
};

export default FinancialModule;
