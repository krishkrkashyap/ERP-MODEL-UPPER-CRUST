import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col, Typography, Input, Tag, Empty, Button, Tooltip, Space, Divider, Modal, Table, Spin, Alert, Statistic, Descriptions, Drawer, Select, DatePicker } from 'antd';
import { 
  HeartOutlined, 
  HeartFilled, 
  FileTextOutlined,
  SearchOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  TeamOutlined,
  TagOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  PercentageOutlined,
  OrderedListOutlined,
  GlobalOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import OutletSelector from '../components/OutletSelector';

const { RangePicker } = DatePicker;

const { Title, Text } = Typography;

// ===== REPORT DEFINITIONS =====
const ALL_REPORTS = [
  { id: 'sales-day-wise', category: 'Sales & Revenue', title: 'All Restaurant Report: Day Wise', desc: 'Total sales of all your restaurant per day', icon: <BarChartOutlined /> },
  { id: 'all-restaurant-sales', category: 'Sales & Revenue', title: 'All Restaurant Sales Report', desc: 'Get insights to all your restaurant & sales related activities', icon: <BarChartOutlined /> },
  { id: 'hourly-item-wise', category: 'Sales & Revenue', title: 'All Restaurants Sales: Hourly Item Wise', desc: 'Total hourly sales at your restaurant', icon: <ClockCircleOutlined /> },
  { id: 'pax-biller-wise', category: 'Sales & Revenue', title: 'Pax Sales Report: Biller Wise', desc: 'Sales per pax made by each biller', icon: <TeamOutlined /> },
  { id: 'sub-order-wise', category: 'Sales & Revenue', title: 'Order Report: Sub-Order Wise', desc: 'Proper bifurcation of orders based on its sub-order type', icon: <OrderedListOutlined /> },
  { id: 'orders-master', category: 'Order Reports', title: 'Orders Master Report: All Restaurants', desc: 'All restaurants orders with customer information & charges incurred on each bill', icon: <FileTextOutlined /> },
  { id: 'order-item-wise', category: 'Order Reports', title: 'Order Report: Item Wise All Restaurants', desc: 'All restaurants item wise orders with customer information & charges', icon: <ShoppingCartOutlined /> },
  { id: 'cancel-order-item-wise', category: 'Order Reports', title: 'Cancel Order Report: Item Wise All Restaurants', desc: 'Item wise orders with customer information and charges incurred on each cancelled bill', icon: <DeleteOutlined /> },
  { id: 'cancel-all-restaurants', category: 'Order Reports', title: 'Cancel Order Report: All Restaurants', desc: 'Quantity and Cost of Canceled Orders from all your restaurants', icon: <DeleteOutlined /> },
  { id: 'online-order-report', category: 'Order Reports', title: 'Online Order Report: All Restaurants', desc: 'Track online order details and activities from all restaurants', icon: <GlobalOutlined /> },
  { id: 'discounted-orders', category: 'Discounts', title: 'Discounted Orders: All Restaurants (With Reason)', desc: 'All the orders with applied discounts along with the reason', icon: <PercentageOutlined /> },
  { id: 'discount-report', category: 'Discounts', title: 'Discount Report', desc: 'Get a complete list of discounts on your online and offline orders', icon: <TagOutlined /> },
  { id: 'item-invoice-details', category: 'Item Reports', title: 'Item Report: Invoice Details', desc: 'Total items sold under each group in your restaurant', icon: <FileTextOutlined /> },
  { id: 'item-wise-all', category: 'Item Reports', title: 'Item Wise Report: All Restaurants', desc: 'Total sales from each item in your restaurant', icon: <ShoppingCartOutlined /> },
  { id: 'item-wise-brand', category: 'Item Reports', title: 'Item Wise Report (Brand wise): All Restaurants', desc: 'Total sales from each item in your restaurant', icon: <ShoppingCartOutlined /> },
  { id: 'category-wise', category: 'Item Reports', title: 'Category Wise Report: All Restaurants', desc: 'Total sales from each category in your restaurant', icon: <PieChartOutlined /> },
  { id: 'tag-wise', category: 'Item Reports', title: 'Tag Wise Report: All Restaurants', desc: 'Total sales from each tag in your restaurant', icon: <TagOutlined /> },
  { id: 'outlet-item-row', category: 'Outlet Reports', title: 'Outlet-Item Wise Report (Row)', desc: 'Consolidated Summary of Item sales with outlets in row format', icon: <ShopOutlined /> },
  { id: 'outlet-item-column', category: 'Outlet Reports', title: 'Outlet-Item Wise Report (Column)', desc: 'Consolidated Summary of Item sales with outlets in column format', icon: <ShopOutlined /> },
  { id: 'locality-wise', category: 'Outlet Reports', title: 'Locality Wise Report: All Restaurants', desc: 'Total orders of all restaurants grouped by locality', icon: <EnvironmentOutlined /> },
  { id: 'corporate-customers', category: 'Customer Reports', title: 'Order Summary: Corporate Customers', desc: 'Order summary of all corporate customers with their GST', icon: <TeamOutlined /> },
  { id: 'invoice-all', category: 'Invoice Reports', title: 'Invoice Report: All Restaurants', desc: 'Total invoice of all your restaurants', icon: <DollarOutlined /> },
];

const CATEGORIES = [...new Set(ALL_REPORTS.map(r => r.category))];

// ===== PER-REPORT FILTER CONFIG =====
// Defines which filters are relevant for each report type
const REPORT_FILTERS: Record<string, string[]> = {
  'sales-day-wise':         ['date', 'restaurant'],
  'all-restaurant-sales':   ['date', 'restaurant', 'paymentType'],
  'hourly-item-wise':       ['date', 'restaurant'],
  'pax-biller-wise':        ['date', 'restaurant'],
  'sub-order-wise':         ['date', 'restaurant'],
  'orders-master':          ['date', 'restaurant', 'status', 'paymentType'],
  'order-item-wise':        ['date', 'restaurant', 'category', 'item', 'status'],
  'cancel-order-item-wise': ['date', 'restaurant', 'item'],
  'cancel-all-restaurants': ['date', 'restaurant'],
  'online-order-report':    ['date', 'restaurant', 'platform'],
  'discounted-orders':      ['date', 'restaurant'],
  'discount-report':        ['date'],
  'item-invoice-details':   ['date', 'restaurant', 'category'],
  'item-wise-all':          ['date', 'restaurant', 'item'],
  'item-wise-brand':        ['date', 'restaurant', 'item'],
  'category-wise':          ['date', 'restaurant', 'category'],
  'tag-wise':               ['date', 'restaurant'],
  'outlet-item-row':        ['date', 'restaurant', 'item'],
  'outlet-item-column':     ['date', 'restaurant', 'item'],
  'locality-wise':          ['date', 'restaurant'],
  'corporate-customers':    ['date', 'restaurant'],
  'invoice-all':            ['date', 'restaurant'],
};

// Filter label/placeholder/type definitions
const FILTER_META: Record<string, { label: string; placeholder: string; type: 'date' | 'select' }> = {
  date:        { label: 'Order Date',    placeholder: 'Select date range', type: 'date' },
  restaurant:  { label: 'Restaurant',    placeholder: 'All Restaurants',   type: 'select' },
  category:    { label: 'Category',      placeholder: 'All Categories',     type: 'select' },
  item:        { label: 'Item',          placeholder: 'All Items',         type: 'select' },
  status:      { label: 'Status',        placeholder: 'All Statuses',      type: 'select' },
  paymentType: { label: 'Payment Type',  placeholder: 'All Payment Types', type: 'select' },
  platform:    { label: 'Platform',      placeholder: 'All Platforms',     type: 'select' },
};

// ===== COLUMN DEFINITIONS PER REPORT TYPE =====
function getColumns(reportId: string): any[] {
  const cols: Record<string, any[]> = {
    'sales-day-wise': [
      { title: 'Date', dataIndex: 'day', key: 'day' },
      { title: 'Orders', dataIndex: 'count', key: 'count' },
      { title: 'Total Sales', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
      { title: 'Types', dataIndex: 'types', key: 'types', render: (v: string[]) => v.join(', ') },
    ],
    'all-restaurant-sales': [
      { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
      { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
      { title: 'Restaurant', dataIndex: 'restaurant', key: 'restaurant' },
      { title: 'Type', dataIndex: 'type', key: 'type' },
      { title: 'Payment', dataIndex: 'payment', key: 'payment' },
      { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'hourly-item-wise': [
      { title: 'Hour', dataIndex: 'hour', key: 'hour' },
      { title: 'Orders', dataIndex: 'count', key: 'count' },
      { title: 'Items Sold', dataIndex: 'items', key: 'items' },
      { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'pax-biller-wise': [
      { title: 'Biller', dataIndex: 'biller', key: 'biller' },
      { title: 'Orders', dataIndex: 'count', key: 'count' },
      { title: 'Total Sales', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'sub-order-wise': [
      { title: 'Sub-Order Type', dataIndex: 'type', key: 'type' },
      { title: 'Orders', dataIndex: 'count', key: 'count' },
      { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
      { title: 'Cancelled', dataIndex: 'cancelled', key: 'cancelled' },
    ],
    'orders-master': [
      { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
      { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
      { title: 'Restaurant', dataIndex: 'restaurant', key: 'restaurant' },
      { title: 'Customer', dataIndex: 'customer', key: 'customer' },
      { title: 'Items', dataIndex: 'items', key: 'items' },
      { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => `₹${Number(v).toFixed(2)}` },
      { title: 'Discount', dataIndex: 'discount', key: 'discount', render: (v: number) => `-₹${Number(v).toFixed(2)}` },
      { title: 'Tax', dataIndex: 'tax', key: 'tax', render: (v: number) => `₹${Number(v).toFixed(2)}` },
      { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
      { title: 'Status', dataIndex: 'status', key: 'status' },
    ],
    'order-item-wise': [
      { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
      { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
      { title: 'Restaurant', dataIndex: 'restaurant', key: 'restaurant' },
      { title: 'Customer', dataIndex: 'customer', key: 'customer' },
      { title: 'Item', dataIndex: 'item', key: 'item' },
      { title: 'Category', dataIndex: 'category', key: 'category' },
      { title: 'Qty', dataIndex: 'qty', key: 'qty' },
      { title: 'Price', dataIndex: 'price', key: 'price', render: (v: number) => `₹${Number(v).toFixed(2)}` },
      { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'cancel-order-item-wise': [
      { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
      { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
      { title: 'Item', dataIndex: 'item', key: 'item' },
      { title: 'Qty', dataIndex: 'qty', key: 'qty' },
      { title: 'Price', dataIndex: 'price', key: 'price', render: (v: number) => `₹${Number(v).toFixed(2)}` },
      { title: 'Loss', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'cancel-all-restaurants': [
      { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
      { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
      { title: 'Restaurant', dataIndex: 'restaurant', key: 'restaurant' },
      { title: 'Customer', dataIndex: 'customer', key: 'customer' },
      { title: 'Items', dataIndex: 'items', key: 'items' },
      { title: 'Total Lost', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'online-order-report': [
      { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
      { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
      { title: 'Restaurant', dataIndex: 'restaurant', key: 'restaurant' },
      { title: 'Platform', dataIndex: 'platform', key: 'platform' },
      { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
      { title: 'Status', dataIndex: 'status', key: 'status' },
    ],
    'discounted-orders': [
      { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
      { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
      { title: 'Customer', dataIndex: 'customer', key: 'customer' },
      { title: 'Discount', dataIndex: 'discountTitle', key: 'discountTitle' },
      { title: 'Discount Value', dataIndex: 'discountAmount', key: 'discountAmount', render: (v: number) => `-₹${Number(v).toFixed(2)}` },
      { title: 'Order Total', dataIndex: 'orderTotal', key: 'orderTotal', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'discount-report': [
      { title: 'Discount Name', dataIndex: 'title', key: 'title' },
      { title: 'Type', dataIndex: 'type', key: 'type' },
      { title: 'Times Used', dataIndex: 'count', key: 'count' },
      { title: 'Total Amount', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'item-invoice-details': [
      { title: 'Category', dataIndex: 'category', key: 'category' },
      { title: 'Orders', dataIndex: 'count', key: 'count' },
      { title: 'Qty Sold', dataIndex: 'qty', key: 'qty' },
      { title: 'Total Sales', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'item-wise-all': [
      { title: 'Item', dataIndex: 'item', key: 'item' },
      { title: 'Times Ordered', dataIndex: 'count', key: 'count' },
      { title: 'Qty Sold', dataIndex: 'qty', key: 'qty' },
      { title: 'Total Sales', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'item-wise-brand': [
      { title: 'Item', dataIndex: 'item', key: 'item' },
      { title: 'SAP Code', dataIndex: 'sapCode', key: 'sapCode' },
      { title: 'Times Ordered', dataIndex: 'count', key: 'count' },
      { title: 'Qty Sold', dataIndex: 'qty', key: 'qty' },
      { title: 'Total Sales', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'category-wise': [
      { title: 'Category', dataIndex: 'category', key: 'category' },
      { title: 'Orders', dataIndex: 'count', key: 'count' },
      { title: 'Qty Sold', dataIndex: 'qty', key: 'qty' },
      { title: 'Total Sales', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'tag-wise': [
      { title: 'Tag', dataIndex: 'tag', key: 'tag' },
      { title: 'Orders', dataIndex: 'count', key: 'count' },
      { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'outlet-item-row': [
      { title: 'Outlet', dataIndex: 'outlet', key: 'outlet' },
      { title: 'Items Sold', dataIndex: 'items', key: 'items', render: (v: any[]) => v.length },
      { title: 'Total Items', dataIndex: 'totalQty', key: 'totalQty', render: (_: any, r: any) => r.items?.reduce((s: number, i: any) => s + i.qty, 0) || 0 },
      { title: 'Total Sales', dataIndex: 'totalSales', key: 'totalSales', render: (_: any, r: any) => `₹${(r.items?.reduce((s: number, i: any) => s + i.total, 0) || 0).toFixed(2)}` },
    ],
    'outlet-item-column': [
      { title: 'Outlet', dataIndex: 'outlet', key: 'outlet' },
      { title: 'Items Sold', dataIndex: 'items', key: 'items', render: (v: any[]) => v.length },
      { title: 'Total Sales', dataIndex: 'totalSales', key: 'totalSales', render: (_: any, r: any) => `₹${(r.items?.reduce((s: number, i: any) => s + i.total, 0) || 0).toFixed(2)}` },
    ],
    'locality-wise': [
      { title: 'Locality', dataIndex: 'locality', key: 'locality' },
      { title: 'Orders', dataIndex: 'count', key: 'count' },
      { title: 'Total Sales', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'corporate-customers': [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { title: 'Phone', dataIndex: 'phone', key: 'phone' },
      { title: 'GSTIN', dataIndex: 'gstin', key: 'gstin' },
      { title: 'Orders', dataIndex: 'orders', key: 'orders' },
      { title: 'Total Spent', dataIndex: 'totalSpent', key: 'totalSpent', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
    'invoice-all': [
      { title: 'Invoice No', dataIndex: 'invoiceNo', key: 'invoiceNo' },
      { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
      { title: 'Restaurant', dataIndex: 'restaurant', key: 'restaurant' },
      { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => `₹${Number(v).toFixed(2)}` },
      { title: 'Discount', dataIndex: 'discount', key: 'discount', render: (v: number) => `-₹${Number(v).toFixed(2)}` },
      { title: 'Tax', dataIndex: 'tax', key: 'tax', render: (v: number) => `₹${Number(v).toFixed(2)}` },
      { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => `₹${Number(v).toFixed(2)}` },
    ],
  };
  return cols[reportId] || [{ title: 'Data', dataIndex: 'data', key: 'data' }];
}

// ===== REPORTS PAGE =====
const Reports = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('erp-report-favorites') || '[]'); } catch { return []; }
  });
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportSummary, setReportSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Filter state
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [filterItem, setFilterItem] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterPaymentType, setFilterPaymentType] = useState<string | undefined>(undefined);
  const [filterPlatform, setFilterPlatform] = useState<string | undefined>(undefined);

  // Filter dropdown options
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [itemOptions, setItemOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [paymentTypeOptions, setPaymentTypeOptions] = useState<string[]>([]);
  const [platformOptions, setPlatformOptions] = useState<string[]>([]);

  // Build query params from current filter state for API calls
  const getFilterParams = useCallback(() => {
    const params: any = {};
    if (filterDateRange[0]) params.startDate = filterDateRange[0].format('YYYY-MM-DD');
    if (filterDateRange[1]) params.endDate = filterDateRange[1].format('YYYY-MM-DD');
    if (selectedOutlets.length > 0) params.menuSharingCodes = selectedOutlets.join(',');
    if (filterStatus) params.status = filterStatus;
    if (filterPaymentType) params.paymentType = filterPaymentType;
    if (filterPlatform) params.platform = filterPlatform;
    return params;
  }, [filterDateRange, selectedOutlets, filterStatus, filterPaymentType, filterPlatform]);

  // Client-side filtered data (category + item filters applied after fetch)
  const clientFilteredData = useMemo(() => {
    if (!reportData.length) return [];
    return reportData.filter((r: any) => {
      if (filterCategory) {
        const val = r.category || r.categoryName || '';
        if (String(val).toLowerCase() !== filterCategory.toLowerCase()) return false;
      }
      if (filterItem) {
        const val = r.item || r.name || '';
        if (String(val).toLowerCase() !== filterItem.toLowerCase()) return false;
      }
      return true;
    });
  }, [reportData, filterCategory, filterItem]);

  // Compute summary from client-filtered data
  const filteredSummary = useMemo(() => {
    if (!clientFilteredData.length) return null;
    return {
      count: clientFilteredData.length,
      total: clientFilteredData.reduce((sum: number, r: any) => sum + (Number(r.total) || 0), 0),
    };
  }, [clientFilteredData]);

  // Determine which filters are relevant for the currently selected report
  const activeFilterKeys = useMemo(() => {
    if (!selectedReport?.id) return [];
    return REPORT_FILTERS[selectedReport.id] || ['date', 'restaurant'];
  }, [selectedReport]);

  useEffect(() => {
    localStorage.setItem('erp-report-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch filter dropdown options when drawer opens
  const fetchFilterOptions = useCallback(async () => {
    try {
      const params = getFilterParams();
      // Use menuSharingCodes if available, otherwise don't send restaurant filter
      if (selectedOutlets.length > 0) {
        params.menuSharingCodes = selectedOutlets.join(',');
        delete params.restaurantId; // Remove restaurantId if using menuSharingCodes
      }
      
      const calls: Promise<any>[] = [
        axios.get('/api/reports/filters/restaurants'),
      ];
      if (activeFilterKeys.includes('category')) {
        calls.push(axios.get('/api/reports/filters/categories', { params }));
      }
      if (activeFilterKeys.includes('item')) {
        calls.push(axios.get('/api/reports/filters/items', { params }));
      }
      if (activeFilterKeys.includes('paymentType')) {
        calls.push(axios.get('/api/reports/filters/payment-types', { params }));
      }
      if (activeFilterKeys.includes('platform')) {
        calls.push(axios.get('/api/reports/filters/platforms', { params }));
      }
      if (activeFilterKeys.includes('status')) {
        calls.push(Promise.resolve({ data: { data: ['Success', 'Cancelled'] } }));
      }
      const results = await Promise.all(calls);
      let idx = 0;
      setRestaurants(results[idx++].data.data || []);
      if (activeFilterKeys.includes('category')) setCategoryOptions(results[idx++].data.data || []);
      if (activeFilterKeys.includes('item')) setItemOptions(results[idx++].data.data || []);
      if (activeFilterKeys.includes('paymentType')) setPaymentTypeOptions(results[idx++].data.data || []);
      if (activeFilterKeys.includes('platform')) setPlatformOptions(results[idx++].data.data || []);
      if (activeFilterKeys.includes('status')) { setStatusOptions(['Success', 'Cancelled']); idx++; }
    } catch { /* ignore filter fetch errors */ }
  }, [getFilterParams, activeFilterKeys, selectedOutlets]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilterDateRange([null, null]);
    setSelectedOutlets([]);
    setFilterCategory(undefined);
    setFilterItem(undefined);
    setFilterStatus(undefined);
    setFilterPaymentType(undefined);
    setFilterPlatform(undefined);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const openReport = async (report: any, keepFilters = false) => {
    setSelectedReport(report);
    setDrawerOpen(true);
    if (!keepFilters) resetFilters();
    setLoading(true);
    setReportError(null);
    try {
      const params = keepFilters ? getFilterParams() : {};
      const res = await axios.get(`/api/reports/${report.id}`, { params });
      setReportData(res.data.data || []);
      setReportSummary(res.data.summary);
    } catch (err: any) {
      setReportError(err.message || 'Failed to load report');
      setReportData([]);
    } finally {
      setLoading(false);
    }
    // Fetch filter options after drawer opens
    setTimeout(() => fetchFilterOptions(), 100);
  };

  // Apply filters (re-fetch with current filter params)
  const applyFilters = async () => {
    if (!selectedReport) return;
    setLoading(true);
    setReportError(null);
    try {
      const params = getFilterParams();
      const res = await axios.get(`/api/reports/${selectedReport.id}`, { params });
      setReportData(res.data.data || []);
      setReportSummary(res.data.summary);
      // Re-fetch filter options based on new filters
      fetchFilterOptions();
    } catch (err: any) {
      setReportError(err.message || 'Failed to load report');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter & sort
  let filtered = ALL_REPORTS.filter(r => {
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  filtered.sort((a, b) => {
    const aFav = favorites.includes(a.id) ? 0 : 1;
    const bFav = favorites.includes(b.id) ? 0 : 1;
    return aFav - bFav;
  });

  const favoriteReports = ALL_REPORTS.filter(r => favorites.includes(r.id));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          Reports & Analytics
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          {ALL_REPORTS.length} reports available &middot; {favorites.length} marked as favorites
        </Text>
      </div>

      {/* Favorites */}
      {favoriteReports.length > 0 && (
        <>
          <div style={{ marginBottom: 10 }}>
            <Text strong style={{ fontSize: 15, color: '#dc2626' }}>
              <HeartFilled style={{ marginRight: 6 }} />
              Favourite ({favoriteReports.length})
            </Text>
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>All reports which are marked as favorites to refer frequently</Text>
          </div>
          <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
            {favoriteReports.map(r => (
              <Col xs={24} sm={12} lg={8} key={r.id}>
                <ReportCard report={r} isFavorite={true} onToggleFavorite={toggleFavorite} onOpen={openReport} />
              </Col>
            ))}
          </Row>
          <Divider style={{ margin: '0 0 16px 0' }} />
        </>
      )}

      {/* Search & Filters */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <Input placeholder="Search reports..." prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} allowClear />
        <Space wrap size={4}>
          <Tag style={{ cursor: 'pointer', padding: '2px 12px', fontSize: 13 }} color={!activeCategory ? 'blue' : 'default'} onClick={() => setActiveCategory(null)}>All</Tag>
          {CATEGORIES.map(cat => (
            <Tag key={cat} style={{ cursor: 'pointer', padding: '2px 12px', fontSize: 13 }} color={activeCategory === cat ? 'blue' : 'default'} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}>{cat}</Tag>
          ))}
        </Space>
      </div>

      {/* Report Grid */}
      {filtered.length === 0 ? (
        <Empty description="No reports match your search" style={{ marginTop: 60 }} />
      ) : (
        <Row gutter={[12, 12]}>
          {filtered.map(r => (
            <Col xs={24} sm={12} lg={8} key={r.id}>
              <ReportCard report={r} isFavorite={favorites.includes(r.id)} onToggleFavorite={toggleFavorite} onOpen={openReport} />
            </Col>
          ))}
        </Row>
      )}

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Showing {filtered.length} of {ALL_REPORTS.length} reports
          {favorites.length > 0 && ` · ${favorites.length} favorites`}
        </Text>
      </div>

      {/* ===== REPORT DETAIL DRAWER ===== */}
      <Drawer
        title={
          <Space>
            {selectedReport?.icon}
            <span>{selectedReport?.title}</span>
            {selectedReport && (
              <Tag>{selectedReport.category}</Tag>
            )}
          </Space>
        }
        placement="right"
        width={1100}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => selectedReport && openReport(selectedReport, true)} loading={loading}>
              Refresh
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => {
              const data = clientFilteredData.length ? clientFilteredData : reportData;
              if (!data.length) return;
              const csv = [Object.keys(data[0]).join(','), ...data.map(r => Object.values(r).join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `${selectedReport?.id || 'report'}.csv`;
              a.click();
            }}>
              Export CSV
            </Button>
          </Space>
        }
      >
        {/* ===== SMART FILTER BAR ===== */}
        {activeFilterKeys.length > 0 && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FilterOutlined style={{ color: '#475569' }} />
              <Text strong style={{ fontSize: 13, color: '#334155' }}>Filters</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                ({activeFilterKeys.map(k => FILTER_META[k]?.label || k).join(' · ')})
              </Text>
              <Button size="small" type="link" icon={<ClearOutlined />} onClick={() => {
                resetFilters();
                if (selectedReport) openReport(selectedReport, false);
              }} style={{ fontSize: 12 }}>
                Reset
              </Button>
            </div>
            <Row gutter={[12, 8]}>
              {/* Date filter — always first when present */}
              {activeFilterKeys.includes('date') && (
                <Col xs={24} sm={12} md={activeFilterKeys.length <= 2 ? 8 : 6}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{FILTER_META.date.label}</Text>
                  <RangePicker
                    size="small"
                    value={filterDateRange}
                    onChange={(dates) => setFilterDateRange(dates || [null, null])}
                    style={{ width: '100%' }}
                    allowClear
                  />
                </Col>
              )}

              {/* Restaurant filter - Multi-select with OutletSelector */}
              {activeFilterKeys.includes('restaurant') && (
                <Col xs={24} sm={12} md={activeFilterKeys.length <= 2 ? 8 : 5}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{FILTER_META.restaurant.label}</Text>
                  <OutletSelector
                    value={selectedOutlets}
                    onChange={setSelectedOutlets}
                    placeholder={FILTER_META.restaurant.placeholder}
                    style={{ width: '100%' }}
                  />
                </Col>
              )}

              {/* Status filter */}
              {activeFilterKeys.includes('status') && (
                <Col xs={24} sm={12} md={4}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{FILTER_META.status.label}</Text>
                  <Select
                    size="small"
                    placeholder={FILTER_META.status.placeholder}
                    value={filterStatus}
                    onChange={(val) => setFilterStatus(val)}
                    style={{ width: '100%' }}
                    allowClear
                    options={statusOptions.map(s => ({ label: s, value: s }))}
                  />
                </Col>
              )}

              {/* Payment Type filter */}
              {activeFilterKeys.includes('paymentType') && (
                <Col xs={24} sm={12} md={4}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{FILTER_META.paymentType.label}</Text>
                  <Select
                    size="small"
                    placeholder={FILTER_META.paymentType.placeholder}
                    value={filterPaymentType}
                    onChange={(val) => setFilterPaymentType(val)}
                    style={{ width: '100%' }}
                    allowClear
                    options={paymentTypeOptions.map(p => ({ label: p, value: p }))}
                  />
                </Col>
              )}

              {/* Platform filter */}
              {activeFilterKeys.includes('platform') && (
                <Col xs={24} sm={12} md={4}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{FILTER_META.platform.label}</Text>
                  <Select
                    size="small"
                    placeholder={FILTER_META.platform.placeholder}
                    value={filterPlatform}
                    onChange={(val) => setFilterPlatform(val)}
                    style={{ width: '100%' }}
                    allowClear
                    options={platformOptions.map(p => ({ label: p, value: p }))}
                  />
                </Col>
              )}

              {/* Category filter (client-side) */}
              {activeFilterKeys.includes('category') && (
                <Col xs={24} sm={12} md={activeFilterKeys.length <= 2 ? 8 : 5}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{FILTER_META.category.label}</Text>
                  <Select
                    size="small"
                    placeholder={FILTER_META.category.placeholder}
                    value={filterCategory}
                    onChange={(val) => setFilterCategory(val)}
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    filterOption={(input, option) => (option?.label as string || '').toLowerCase().includes(input.toLowerCase())}
                    options={categoryOptions.map(c => ({ label: c, value: c }))}
                    notFoundContent={categoryOptions.length === 0 ? 'No categories found' : 'No matches'}
                  />
                </Col>
              )}

              {/* Item filter (client-side) */}
              {activeFilterKeys.includes('item') && (
                <Col xs={24} sm={12} md={activeFilterKeys.length <= 2 ? 8 : 5}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{FILTER_META.item.label}</Text>
                  <Select
                    size="small"
                    placeholder={FILTER_META.item.placeholder}
                    value={filterItem}
                    onChange={(val) => setFilterItem(val)}
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    filterOption={(input, option) => (option?.label as string || '').toLowerCase().includes(input.toLowerCase())}
                    options={itemOptions.map(i => ({ label: i, value: i }))}
                    notFoundContent={itemOptions.length === 0 ? 'No items found' : 'No matches'}
                  />
                </Col>
              )}

              {/* Apply button */}
              <Col xs={24} sm={12} md={3} style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button type="primary" size="small" icon={<ReloadOutlined />} onClick={applyFilters} loading={loading} style={{ width: '100%', background: '#1e293b', borderColor: '#1e293b' }}>
                  Apply
                </Button>
              </Col>
            </Row>
          </div>
        )}

        {/* Summary Cards (using client-filtered data) */}
        {(clientFilteredData.length > 0 || reportSummary) && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic title="Total Records" value={clientFilteredData.length || reportSummary?.count || 0} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="Total Amount" value={filteredSummary?.total || reportSummary?.total || 0} precision={2} prefix="₹" />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="Report Generated" value={dayjs().format('YYYY-MM-DD HH:mm')} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="Data Source" value={reportData.length} suffix={`rows fetched`} />
              </Card>
            </Col>
          </Row>
        )}

        {/* Active filter tags */}
        {(filterCategory || filterItem || filterStatus || filterPaymentType || filterPlatform || selectedOutlets.length > 0) && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Showing {clientFilteredData.length} of {reportData.length} rows
              {filterDateRange[0] && <Tag style={{ marginLeft: 6 }}>{filterDateRange[0].format('DD-MM-YY')} – {filterDateRange[1]?.format('DD-MM-YY') || '...'}</Tag>}
              {selectedOutlets.map(outletCode => {
                const outlet = restaurants.find((r: any) => r.petpoojaRestId === outletCode);
                return (
                  <Tag key={outletCode} style={{ marginLeft: 4 }} closable onClose={() => {
                    setSelectedOutlets(prev => prev.filter(o => o !== outletCode));
                    applyFilters();
                  }}>{outlet?.name || outletCode}</Tag>
                );
              })}
              {filterCategory && <Tag style={{ marginLeft: 4 }} closable onClose={() => setFilterCategory(undefined)}>Category: {filterCategory}</Tag>}
              {filterItem && <Tag style={{ marginLeft: 4 }} closable onClose={() => setFilterItem(undefined)}>Item: {filterItem}</Tag>}
              {filterStatus && <Tag style={{ marginLeft: 4 }} closable onClose={() => { setFilterStatus(undefined); applyFilters(); }}>Status: {filterStatus}</Tag>}
              {filterPaymentType && <Tag style={{ marginLeft: 4 }} closable onClose={() => { setFilterPaymentType(undefined); applyFilters(); }}>Payment: {filterPaymentType}</Tag>}
              {filterPlatform && <Tag style={{ marginLeft: 4 }} closable onClose={() => { setFilterPlatform(undefined); applyFilters(); }}>Platform: {filterPlatform}</Tag>}
            </Text>
          </div>
        )}

        {/* Error */}
        {reportError && (
          <Alert type="error" message="Error Loading Report" description={reportError} showIcon style={{ marginBottom: 16 }} />
        )}

        {/* Data Table */}
        <Spin spinning={loading}>
          {clientFilteredData.length > 0 ? (
            <Table
              columns={getColumns(selectedReport?.id || '')}
              dataSource={clientFilteredData}
              rowKey={(_, i) => String(i)}
              pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
              scroll={{ x: 'max-content' }}
              size="small"
            />
          ) : !loading && !reportError ? (
            <Empty description={reportData.length > 0 ? 'No rows match the selected category/item filters. Try clearing filters.' : 'No data available for this report. Sync orders first.'} />
          ) : null}
        </Spin>
      </Drawer>
    </div>
  );
};

// ===== REPORT CARD =====
const ReportCard = ({ report, isFavorite, onToggleFavorite, onOpen }: any) => (
  <Card
    size="small"
    hoverable
    style={{ borderRadius: 8, border: '1px solid #e5e7eb', height: '100%' }}
    styles={{ body: { padding: '14px 16px' } }}
    actions={[
      <Button type="link" size="small"
        icon={isFavorite ? <HeartFilled style={{ color: '#dc2626' }} /> : <HeartOutlined />}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(report.id); }}
        style={{ color: isFavorite ? '#dc2626' : undefined }}
      >
        {isFavorite ? 'Favourite' : 'Add to Favourite'}
      </Button>,
      <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => onOpen(report)}>
        View Details
      </Button>,
    ]}
  >
    <Card.Meta
      avatar={
        <div style={{ fontSize: 22, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: 8, color: '#475569' }}>
          {report.icon}
        </div>
      }
      title={<Text strong style={{ fontSize: 13, lineHeight: 1.3 }} ellipsis={{ tooltip: report.title }}>{report.title}</Text>}
      description={<Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: report.desc }}>{report.desc}</Text>}
    />
  </Card>
);

export default Reports;
