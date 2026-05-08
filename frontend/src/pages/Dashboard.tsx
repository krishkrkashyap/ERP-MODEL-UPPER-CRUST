import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, Col, Row, Statistic, Spin, Alert, Typography, Table, Tag, Space, Button, Select, Divider, Radio } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ShoppingCartOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  UserOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  SyncOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TagsOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import OutletSelector from '../components/OutletSelector';

const { Title, Text } = Typography;

// ─── Colors ────────────────────────────────────────────────────────────────
const COLORS = [
  '#1e293b', '#059669', '#2563eb', '#d97706', '#dc2626',
  '#7c3aed', '#0891b2', '#ca8a04', '#be185d', '#65a30d',
];
const CHART_HEIGHT = 280;

// ─── Helpers ────────────────────────────────────────────────────────────────
const currency = (v: number) => `₹${Number(v || 0).toFixed(2)}`;
const formatMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  return `${['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)]} ${y}`;
};

// ─── Component ──────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'monthly' | 'hourly'>('daily');
  const [datePreset, setDatePreset] = useState<string>('today');
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>(['uvhn3bim', 't2jrg8ez']); // Default: all outlets selected
  const selectedOutletsRef = useRef(selectedOutlets);
  useEffect(() => { selectedOutletsRef.current = selectedOutlets; }, [selectedOutlets]);

  // Compute date range based on preset
  const getDateRange = useMemo(() => {
    const today = dayjs();
    switch (datePreset) {
      case 'today':
        return { startDate: today.format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD') };
      case 'yesterday':
        return { startDate: today.subtract(1, 'day').format('YYYY-MM-DD'), endDate: today.subtract(1, 'day').format('YYYY-MM-DD') };
      case 'last7':
        return { startDate: today.subtract(6, 'day').format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD') };
      case 'thisMonth':
        return { startDate: today.startOf('month').format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD') };
      case 'lastMonth':
        const lastMonth = today.subtract(1, 'month');
        return { startDate: lastMonth.startOf('month').format('YYYY-MM-DD'), endDate: lastMonth.endOf('month').format('YYYY-MM-DD') };
      case 'allTime':
        return { startDate: '2024-01-01', endDate: today.format('YYYY-MM-DD') };
      case 'custom':
        return {
          startDate: customDateRange[0]?.format('YYYY-MM-DD') || today.format('YYYY-MM-DD'),
          endDate: customDateRange[1]?.format('YYYY-MM-DD') || today.format('YYYY-MM-DD')
        };
      default:
        return { startDate: today.format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD') };
    }
  }, [datePreset, customDateRange]);

  const { startDate, endDate } = getDateRange;

  // Helper to create URLSearchParams with common filters
  const getQueryParams = (extraParams?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (selectedOutlets.length > 0) params.append('menuSharingCodes', selectedOutlets.join(','));
    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => params.append(key, value));
    }
    return params;
  };

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', startDate, endDate, selectedOutlets],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedOutlets.length > 0) params.append('menuSharingCodes', selectedOutlets.join(','));
      
      const [ordersRes, inventoryRes, customersRes, salesRes, todaySalesRes] = await Promise.all([
        axios.get(`/api/orders?page=1&limit=1&${params.toString()}`),
        axios.get(`/api/inventory/stock?date=${endDate}&${params.toString()}`),
        axios.get(`/api/customers?${params.toString()}`),
        axios.get(`/api/reports/sales-day-wise?startDate=${startDate}&endDate=${endDate}&${params.toString()}`),
        axios.get(`/api/reports/sales-day-wise?startDate=${endDate}&endDate=${endDate}&${params.toString()}`),
      ]);

      const todayArr = todaySalesRes.data?.data || [];
      const periodArr = salesRes.data?.data || [];
      const todayTotal = todayArr.reduce((s: number, r: any) => s + (Number(r.total) || 0), 0);
      const periodTotal = periodArr
        .filter((r: any) => r.day === endDate)
        .reduce((s: number, r: any) => s + (Number(r.total) || 0), 0);
      const yesterdayTotal = periodArr
        .filter((r: any) => r.day !== endDate)
        .reduce((s: number, r: any) => s + (Number(r.total) || 0), 0);

      return {
        totalOrders: ordersRes.data.pagination?.total || 0,
        totalInventory: inventoryRes.data?.data?.length || 0,
        totalCustomers: customersRes.data?.data?.length || 0,
        todayRevenue: todayTotal,
        periodRevenue: periodTotal,
        yesterdayRevenue: yesterdayTotal,
        lowStockItems: (inventoryRes.data?.data || []).filter((i: any) => Number(i.quantity) <= 0).length,
      };
    },
    refetchInterval: 60000,
  });

  // Recent orders
  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders', selectedOutlets],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedOutlets.length > 0) params.append('menuSharingCodes', selectedOutlets.join(','));
      params.append('page', '1');
      params.append('limit', '10');
      params.append('sort', 'createdOn');
      params.append('order', 'desc');
      const res = await axios.get(`/api/orders?${params.toString()}`);
      return res.data.data || [];
    },
    refetchInterval: 60000,
  });

  // Low stock
  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock', endDate, selectedOutlets],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedOutlets.length > 0) params.append('menuSharingCodes', selectedOutlets.join(','));
      const res = await axios.get(`/api/inventory/stock?date=${endDate}&${params.toString()}`);
      return (res.data?.data || []).filter((i: any) => Number(i.quantity) <= 5);
    },
  });

  // ── Sales Trend Data ─────────────────────────────────────────────────────
  const { data: salesTrendRaw } = useQuery({
    queryKey: ['sales-trend', trendPeriod, startDate, endDate, selectedOutlets],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedOutlets.length > 0) params.append('menuSharingCodes', selectedOutlets.join(','));
      if (trendPeriod === 'hourly') {
        const res = await axios.get(`/api/reports/hourly-item-wise?startDate=${startDate}&endDate=${endDate}&${new URLSearchParams(params).toString()}`);
        return res.data.data || [];
      }
      // Daily or Monthly – fetch full period data
      const res = await axios.get(`/api/reports/sales-day-wise?startDate=${startDate}&endDate=${endDate}&${new URLSearchParams(params).toString()}`);
      return res.data.data || [];
    },
  });

  const salesTrendData = useMemo(() => {
    const raw = salesTrendRaw || [];
    if (trendPeriod === 'hourly') return raw;
    if (trendPeriod === 'monthly') {
      const map = new Map<string, { month: string; count: number; total: number }>();
      for (const d of raw) {
        const key = (d.day || '').substring(0, 7); // YYYY-MM
        if (!key) continue;
        const e = map.get(key) || { month: key, count: 0, total: 0 };
        e.count += d.count || 0;
        e.total += Number(d.total) || 0;
        map.set(key, e);
      }
      return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    }
    // Daily – raw data
    return raw;
  }, [salesTrendRaw, trendPeriod]);

  // ── Category Data ──────────────────────────────────────────────────────
  const { data: categoryRaw } = useQuery({
    queryKey: ['category-sales', startDate, endDate, selectedOutlets],
    queryFn: async () => {
      const params = getQueryParams({ startDate, endDate });
      const res = await axios.get('/api/reports/category-wise', { params });
      return (res.data.data || []).slice(0, 10);
    },
  });

  // ── Platform Data ──────────────────────────────────────────────────────
  const { data: platformRaw } = useQuery({
    queryKey: ['platform-sales', startDate, endDate, selectedOutlets],
    queryFn: async () => {
      const params = getQueryParams({ startDate, endDate });
      const res = await axios.get('/api/reports/platform-summary', { params });
      return res.data.data || [];
    },
  });

  // ── Sync Mutations ────────────────────────────────────────────
  const queryClient = useQueryClient();
  
  // Sync orders for all selected outlets
  const syncOrdersMutation = useMutation({
    mutationFn: async () => {
      const date = dayjs().format('YYYY-MM-DD');
      const outlets = selectedOutletsRef.current;
      // Sync for each selected outlet
      for (const code of outlets) {
        await axios.post('/api/orders/sync', { date, menuSharingCodes: [code] });
      }
      // Also sync for all selected outlets together
      await axios.post('/api/orders/sync', { date, menuSharingCodes: outlets });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['recent-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sales-trend'] });
      queryClient.invalidateQueries({ queryKey: ['category-sales'] });
      queryClient.invalidateQueries({ queryKey: ['platform-sales'] });
    },
  });

  // Sync inventory for all selected outlets
  const syncInventoryMutation = useMutation({
    mutationFn: async () => {
      const date = dayjs().format('YYYY-MM-DD');
      await axios.post('/api/inventory/stock/sync', { date, menuSharingCodes: selectedOutletsRef.current });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  // Sync customers for all selected outlets
  const syncCustomersMutation = useMutation({
    mutationFn: async () => {
      const date = dayjs().format('YYYY-MM-DD');
      await axios.post('/api/customers/sync', { date, menuSharingCodes: selectedOutletsRef.current });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sales-trend'] });
      queryClient.invalidateQueries({ queryKey: ['category-sales'] });
      queryClient.invalidateQueries({ queryKey: ['platform-sales'] });
    },
  });

  // Auto-sync state
  const [autoSyncInterval, setAutoSyncInterval] = useState<number | null>(15); // Default: 15s
  const autoSyncTimerRef = useRef<number | null>(null);

  // Start/stop auto-sync
  const toggleAutoSync = (interval: number | null) => {
    if (autoSyncTimerRef.current) {
      clearInterval(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }
    if (interval) {
      // Run immediately
      syncOrdersMutation.mutate();
      syncInventoryMutation.mutate();
      syncCustomersMutation.mutate();
      // Then set interval
      autoSyncTimerRef.current = setInterval(() => {
        syncOrdersMutation.mutate();
        syncInventoryMutation.mutate();
        syncCustomersMutation.mutate();
      }, interval * 1000);
    }
    setAutoSyncInterval(interval);
  };

  // Start auto-sync on mount, cleanup on unmount
  useEffect(() => {
    toggleAutoSync(15);
    return () => {
      if (autoSyncTimerRef.current) {
        clearInterval(autoSyncTimerRef.current);
        autoSyncTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Computed values ──────────────────────────────────────────────────────
  const revenueChange = stats?.todayRevenue && stats?.yesterdayRevenue ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue * 100).toFixed(1) : '0';
  const isRevenueUp = Number(revenueChange) >= 0;

  const totalToday = salesTrendData?.reduce((s: number, r: any) => s + (r.count || 0), 0) || 0;
  const topPlatform = (platformRaw || []).length > 0 ? platformRaw[0].platform : '-';

  // Custom tooltip
  const TrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Text strong style={{ fontSize: 12 }}>
            {trendPeriod === 'hourly' ? d.hour : trendPeriod === 'monthly' ? formatMonth(d.month) : d.day}
          </Text>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            <div>Orders: <Text strong>{d.count}</Text></div>
            <div>Revenue: <Text strong>{currency(d.total)}</Text></div>
          </div>
        </div>
      );
    }
    return null;
  };

  // ── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <Alert
        type="error"
        message="Error loading dashboard"
        description="Please ensure the backend server is running on port 4000"
        showIcon
      />
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ══════ HEADER ══════ */}
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ margin: 0 }}>
          <DashboardOutlined style={{ marginRight: 8 }} />
          Dashboard
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Business overview · {dayjs().format('dddd, MMMM D, YYYY')}
        </Text>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        {/* Date Preset Selector */}
        <div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Date Filter</Text>
          <Radio.Group
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            size="small"
            optionType="button"
            buttonStyle="solid"
            options={[
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              { value: 'last7', label: 'Last 7 Days' },
              { value: 'thisMonth', label: 'This Month' },
              { value: 'lastMonth', label: 'Last Month' },
              { value: 'allTime', label: 'All Time' },
            ]}
          />
        </div>
          {/* Outlet Selector */}
        <div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Outlets</Text>
          <OutletSelector
            value={selectedOutlets}
            onChange={setSelectedOutlets}
            placeholder="All Outlets"
            style={{ minWidth: 200 }}
          />
        </div>

        {/* Sync Buttons */}
        <div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Sync Data</Text>
          <Space>
            <Button 
              size="small" 
              type="primary" 
              icon={<SyncOutlined />} 
              loading={syncOrdersMutation.isPending || syncInventoryMutation.isPending || syncCustomersMutation.isPending}
              onClick={() => {
                syncOrdersMutation.mutate();
                syncInventoryMutation.mutate();
                syncCustomersMutation.mutate();
              }}
              style={{ background: '#1e293b', borderColor: '#1e293b' }}
            >
              Sync All
            </Button>
            <Select
              size="small"
              value={autoSyncInterval}
              onChange={toggleAutoSync}
              style={{ width: 130 }}
              options={[
                { value: null, label: 'Auto-Sync OFF' },
                { value: 10, label: 'Every 10s' },
                { value: 15, label: 'Every 15s' },
                { value: 30, label: 'Every 30s' },
                { value: 60, label: 'Every 1min' },
              ]}
            />
          </Space>
        </div>
      </div>
      
      <Spin spinning={isLoading}>
        {/* ══════ STATS CARDS ══════ */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: 8, border: '1px solid #e5e7eb' }} onClick={() => navigate('/orders')}>
              <Statistic title="Total Orders" value={stats?.totalOrders || 0} prefix={<ShoppingCartOutlined style={{ color: '#1e293b' }} />} valueStyle={{ color: '#1e293b' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <Statistic
                title={datePreset === 'today' ? "Today's Revenue" : datePreset === 'yesterday' ? "Yesterday's Revenue" : `Period Revenue`}
                value={stats?.todayRevenue || 0}
                precision={2}
                prefix="₹"
                suffix={<Text style={{ fontSize: 13, color: isRevenueUp ? '#16a34a' : '#dc2626', marginLeft: 8 }}>{isRevenueUp ? <RiseOutlined /> : <FallOutlined />} {Math.abs(Number(revenueChange))}%</Text>}
                valueStyle={{ color: '#059669' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: 8, border: '1px solid #e5e7eb' }} onClick={() => navigate('/customers')}>
              <Statistic title="Active Customers" value={stats?.totalCustomers || 0} prefix={<UserOutlined style={{ color: '#2563eb' }} />} valueStyle={{ color: '#2563eb' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: 8, border: '1px solid #e5e7eb' }} onClick={() => navigate('/inventory')}>
              <Statistic
                title="Inventory Items"
                value={stats?.totalInventory || 0}
                prefix={<DatabaseOutlined style={{ color: '#7c3aed' }} />}
                valueStyle={{ color: '#7c3aed' }}
                suffix={stats && stats.lowStockItems > 0 ? <Tag color="warning" style={{ marginLeft: 8 }}>{stats.lowStockItems} low</Tag> : null}
              />
            </Card>
          </Col>
        </Row>

        {/* ══════ CHARTS ROW ══════ */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* ── SALES TREND CHART ── */}
          <Col xs={24} lg={16}>
            <Card
              size="small"
              style={{ borderRadius: 8, border: '1px solid #e5e7eb', height: '100%' }}
              title={<span><BarChartOutlined style={{ marginRight: 6 }} />Sales Trend</span>}
              extra={
                <Select
                  size="small"
                  value={trendPeriod}
                  onChange={(v) => setTrendPeriod(v)}
                  style={{ width: 110 }}
                  options={[
                    { value: 'daily', label: <><CalendarOutlined /> Daily</> },
                    { value: 'monthly', label: <><AppstoreOutlined /> Monthly</> },
                    { value: 'hourly', label: <><ClockCircleOutlined /> Hourly</> },
                  ]}
                />
              }
            >
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={salesTrendData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey={trendPeriod === 'hourly' ? 'hour' : trendPeriod === 'monthly' ? 'month' : 'day'}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => trendPeriod === 'monthly' ? formatMonth(v) : trendPeriod === 'hourly' ? v.replace(':00', '') : v.substring(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<TrendTooltip />} />
                  <Bar dataKey="total" fill="#1e293b" radius={[4, 4, 0, 0]} maxBarSize={trendPeriod === 'monthly' ? 48 : 24} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* ── ORDER STATS SIDEBAR ── */}
          <Col xs={24} lg={8}>
            <Card
              size="small"
              style={{ borderRadius: 8, border: '1px solid #e5e7eb', height: '100%' }}
              title={<span><OrderedListOutlined style={{ marginRight: 6 }} />Order Summary</span>}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>Total Orders (Year)</Text>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{stats?.totalOrders || 0}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ background: '#f0fdf4', borderRadius: 6, padding: '10px 12px' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>Today</Text>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>{totalToday}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ background: '#f0f9ff', borderRadius: 6, padding: '10px 12px' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>Avg / Day</Text>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>
                        {salesTrendData?.length ? Math.round((salesTrendData.reduce((s: number, r: any) => s + (r.count || 0), 0)) / salesTrendData.length) : 0}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ background: '#fffbeb', borderRadius: 6, padding: '10px 12px' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>Top Platform</Text>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>{topPlatform}</div>
                    </div>
                  </Col>
                </Row>
                <Divider style={{ margin: '4px 0' }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Platform Breakdown</Text>
                  {(platformRaw || []).map((p: any, i: number) => (
                    <Row key={p.platform} style={{ marginTop: 6 }} align="middle">
                      <Col flex="auto">
                        <Space>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                          <Text style={{ fontSize: 12 }}>{p.platform}</Text>
                        </Space>
                      </Col>
                      <Col>
                        <Text strong style={{ fontSize: 12 }}>{p.count}</Text>
                      </Col>
                      <Col>
                        <Tag style={{ fontSize: 10, marginLeft: 6 }}>{currency(p.total)}</Tag>
                      </Col>
                    </Row>
                  ))}
                  {(!platformRaw || platformRaw.length === 0) && (
                    <Text type="secondary" style={{ fontSize: 12 }}>No platform data</Text>
                  )}
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* ══════ CATEGORY & PLATFORM CHARTS ══════ */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* ── CATEGORY PIE CHART ── */}
          <Col xs={24} lg={12}>
            <Card
              size="small"
              style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              title={<span><TagsOutlined style={{ marginRight: 6 }} />Sales by Category (Top 10)</span>}
            >
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={(categoryRaw || []).filter((c: any) => c.total > 0)}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    paddingAngle={2}
                    label={({ category, percent }: any) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(categoryRaw || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => currency(Number(v || 0))} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'center', marginTop: 4 }}>
                {(categoryRaw || []).slice(0, 8).map((c: any, i: number) => (
                  <Space key={c.category} size={4}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <Text style={{ fontSize: 11 }}>{c.category}</Text>
                  </Space>
                ))}
              </div>
            </Card>
          </Col>

          {/* ── PLATFORM BAR CHART ── */}
          <Col xs={24} lg={12}>
            <Card
              size="small"
              style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              title={<span><PieChartOutlined style={{ marginRight: 6 }} />Sales by Platform</span>}
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={platformRaw || []} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="platform" tick={{ fontSize: 12 }} width={70} />
                  <Tooltip formatter={(v: any) => currency(Number(v || 0))} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={32}>
                    {(platformRaw || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* ══════ TWO-COLUMN: Recent Orders + Low Stock ══════ */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              title={<span><ShoppingCartOutlined style={{ marginRight: 6 }} />Recent Orders</span>}
              size="small"
              style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              extra={<Button type="link" onClick={() => navigate('/orders')}>View All</Button>}
            >
              <Table
                dataSource={(recentOrders || []).slice(0, 8)}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Order ID', dataIndex: 'petpoojaOrderId', key: 'petpoojaOrderId', width: 90 },
                  { title: 'Date', dataIndex: 'createdOn', key: 'createdOn', width: 130, render: (d: string) => d ? dayjs(d).format('DD-MM HH:mm') : '-' },
                  { title: 'Type', dataIndex: 'orderType', key: 'orderType', width: 80 },
                  { title: 'Total', dataIndex: 'total', key: 'total', width: 85, render: (t: any) => currency(Number(t)) },
                  { title: 'Status', dataIndex: 'status', key: 'status', width: 85, render: (s: string) => <Tag color={s === 'Success' ? 'green' : 'red'} style={{ fontSize: 11 }}>{s}</Tag> },
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              title={<span><WarningOutlined style={{ marginRight: 6, color: '#dc2626' }} />Low Stock Alerts</span>}
              size="small"
              style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              extra={<Button type="link" onClick={() => navigate('/inventory')}>View All</Button>}
            >
              {lowStockData && lowStockData.length > 0 ? (
                <Table
                  dataSource={lowStockData.slice(0, 8)}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Item', key: 'name', render: (_: any, r: any) => r.inventoryItem?.name || '-', width: 120 },
                    { title: 'Qty', key: 'qty', render: (_: any, r: any) => <Text style={{ color: Number(r.quantity) <= 0 ? '#dc2626' : '#ea580c', fontWeight: 600 }}>{Number(r.quantity) || 0}</Text>, width: 70 },
                    { title: 'Unit', key: 'unit', render: (_: any, r: any) => r.unit || '-', width: 60 },
                  ]}
                />
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <Text type="secondary">All items are sufficiently stocked</Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* ══════ QUICK ACTIONS ══════ */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card size="small" style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <Space wrap>
                <Text strong style={{ fontSize: 13 }}>Quick Actions:</Text>
                <Button icon={<SyncOutlined />} onClick={() => navigate('/orders')} size="small">Sync Orders</Button>
                <Button icon={<SyncOutlined />} onClick={() => navigate('/inventory')} size="small">Sync Inventory</Button>
                <Button icon={<BarChartOutlined />} onClick={() => navigate('/reports')} size="small">View Reports</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
