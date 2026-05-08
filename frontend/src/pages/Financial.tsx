import { useState, useEffect } from 'react';
import { Table, Select, DatePicker, Spin, Alert, Typography, Card, Row, Col, Statistic, Tag, Button, Space, Divider } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { DollarOutlined, DownloadOutlined, RiseOutlined, FallOutlined, BankOutlined, PercentageOutlined } from '@ant-design/icons';
import OutletSelector from '../components/OutletSelector';

const { Title, Text } = Typography;

interface TaxLiability {
  taxType: string;
  rate: number;
  amount: number;
  orderCount: number;
  invoiceCount: number;
}

interface PnL {
  totalRevenue: number;
  totalPurchases: number;
  grossProfit: number;
  totalTax: number;
  netProfit: number;
}

const FinancialModule = () => {
  const [period, setPeriod] = useState<string>('monthly');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);

  // Fetch restaurant list
  useEffect(() => {
    axios.get('/api/restaurants').then(r => setRestaurants(r.data || [])).catch(() => {});
  }, []);

  // Tax liability query
  const { data: taxData, isLoading: taxLoading, error: taxError } = useQuery({
    queryKey: ['tax-liability', dateRange[0]?.format('YYYY-MM-DD'), dateRange[1]?.format('YYYY-MM-DD'), selectedOutlets],
    queryFn: async () => {
      const startDate = dateRange[0]?.format('YYYY-MM-DD') || '';
      const endDate = dateRange[1]?.format('YYYY-MM-DD') || '';
      const params: any = { startDate, endDate };
      if (selectedOutlets.length > 0) params.menuSharingCodes = selectedOutlets.join(',');
      const res = await axios.get('/api/financial/tax-liability', { params });
      return res.data;
    },
  });

  // P&L query
  const { data: pnlData, isLoading: pnlLoading } = useQuery({
    queryKey: ['pnl', dateRange[0]?.format('YYYY-MM-DD'), dateRange[1]?.format('YYYY-MM-DD'), selectedOutlets],
    queryFn: async () => {
      const startDate = dateRange[0]?.format('YYYY-MM-DD') || '';
      const endDate = dateRange[1]?.format('YYYY-MM-DD') || '';
      const params: any = { startDate, endDate };
      if (selectedOutlets.length > 0) params.menuSharingCodes = selectedOutlets.join(',');
      const res = await axios.get('/api/financial/pnl', { params });
      return res.data;
    },
    enabled: !!dateRange[0] && !!dateRange[1],
  });

  const handleExportCSV = () => {
    const taxRows = taxData || [];
    if (!taxRows.length) return;
    const csv = [
      'Tax Type,Rate (%),Total Amount,Order Count',
      ...taxRows.map((r: TaxLiability) =>
        `${r.taxType},${r.rate}%,${r.amount.toFixed(2)},${r.orderCount}`
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tax-liability-${dateRange[0]?.format('YYYY-MM-DD') || ''}.csv`;
    a.click();
  };

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
      render: (amount: number) => (
        <Text strong>₹{Number(amount || 0).toFixed(2)}</Text>
      ),
    },
    {
      title: 'Order Count',
      dataIndex: 'orderCount',
      key: 'orderCount',
    },
    {
      title: 'Invoices',
      dataIndex: 'invoiceCount',
      key: 'invoiceCount',
    },
  ];

  const totalTax = (taxData || []).reduce((sum: number, item: TaxLiability) => sum + (item.amount || 0), 0);

  // Group taxes by rate for a more meaningful breakdown
  const cgstSgstTotal = (taxData || [])
    .filter((d: TaxLiability) => d.taxType.includes('GST') && !d.taxType.includes('IGST'))
    .reduce((s: number, i: TaxLiability) => s + i.amount, 0);

  const igstTotal = (taxData || [])
    .filter((d: TaxLiability) => d.taxType.includes('IGST'))
    .reduce((s: number, i: TaxLiability) => s + i.amount, 0);

  if (taxError) {
    return (
      <Alert
        type="error"
        message="Error loading financial data"
        description="Please ensure the backend server is running"
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
          <DollarOutlined style={{ marginRight: 8 }} />
          Financial Management
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Tax liability &amp; P&L for{' '}
          {dateRange[0]?.format('DD-MM-YYYY')} – {dateRange[1]?.format('DD-MM-YYYY')}
        </Text>
      </div>

      {/* ===== FILTERS ===== */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Select value={period} onChange={setPeriod} size="small" style={{ width: 120 }}>
          <Select.Option value="daily">Daily</Select.Option>
          <Select.Option value="weekly">Weekly</Select.Option>
          <Select.Option value="monthly">Monthly</Select.Option>
          <Select.Option value="quarterly">Quarterly</Select.Option>
          <Select.Option value="yearly">Yearly</Select.Option>
        </Select>

        <DatePicker.RangePicker
          size="small"
          value={dateRange}
          onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
          placeholder={['Start Date', 'End Date']}
        />

        <OutletSelector
          value={selectedOutlets}
          onChange={setSelectedOutlets}
          placeholder="All Outlets"
          style={{ minWidth: 180 }}
        />

        <Button size="small" icon={<DownloadOutlined />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      {/* ===== P&L SECTION ===== */}
      <Card
        title={<span><BankOutlined style={{ marginRight: 6 }} />Profit &amp; Loss Summary</span>}
        size="small"
        style={{ borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 16 }}
      >
        <Spin spinning={pnlLoading}>
          {pnlData ? (
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="Total Revenue"
                  value={pnlData.totalRevenue}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: '#059669' }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="Total Purchases"
                  value={pnlData.totalPurchases}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: '#dc2626' }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="Gross Profit"
                  value={pnlData.grossProfit}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: pnlData.grossProfit >= 0 ? '#059669' : '#dc2626' }}
                  suffix={
                    pnlData.totalRevenue > 0 ? (
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>
                        ({((pnlData.grossProfit / pnlData.totalRevenue) * 100).toFixed(1)}%)
                      </Text>
                    ) : null
                  }
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="Total Tax"
                  value={pnlData.totalTax}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: '#d97706' }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="Net Profit"
                  value={pnlData.netProfit}
                  precision={2}
                  valueStyle={{ color: pnlData.netProfit >= 0 ? '#059669' : '#dc2626' }}
                  prefix={pnlData.netProfit >= 0 ? <><RiseOutlined /> ₹</> : <><FallOutlined /> ₹</>}
                />
              </Col>
            </Row>
          ) : (
            <Text type="secondary">Select a date range to view P&amp;L</Text>
          )}
        </Spin>
      </Card>

      {/* ===== TAX LIABILITY SECTION ===== */}
      <Card
        title={<span><PercentageOutlined style={{ marginRight: 6 }} />Tax Liability Breakdown</span>}
        size="small"
        style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
      >
        {/* Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Total Tax Liability"
                value={totalTax}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="CGST + SGST"
                value={cgstSgstTotal}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="IGST"
                value={igstTotal}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Spin spinning={taxLoading}>
          <Table
            columns={columns}
            dataSource={taxData || []}
            rowKey="taxType"
            size="small"
            pagination={false}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong>₹{totalTax.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text strong>{(taxData || []).reduce((s: number, i: TaxLiability) => s + i.orderCount, 0)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>-</Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default FinancialModule;
