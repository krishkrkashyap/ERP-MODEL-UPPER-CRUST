import { Outlet, Link, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Typography } from 'antd';
import { 
  DashboardOutlined, 
  ShoppingCartOutlined, 
  DatabaseOutlined,
  AppstoreOutlined,
  DeleteOutlined, 
  UserOutlined,
  DollarOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Content, Footer } = AntLayout;
const { Text } = Typography;

const NAV_ITEMS: MenuProps['items'] = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: <Link to="/orders">Orders</Link> },
  { key: '/inventory', icon: <DatabaseOutlined />, label: <Link to="/inventory">Inventory</Link> },
  { key: '/raw-materials', icon: <AppstoreOutlined />, label: <Link to="/raw-materials">Raw Materials</Link> },
  { key: '/wastage', icon: <DeleteOutlined />, label: <Link to="/wastage">Wastage Tracking</Link> },
  { key: '/customers', icon: <UserOutlined />, label: <Link to="/customers">Customer Profiles</Link> },
  { key: '/financial', icon: <DollarOutlined />, label: <Link to="/financial">Financial</Link> },
  { key: '/reports', icon: <BarChartOutlined />, label: <Link to="/reports">Reports</Link> },
];

const LayoutComponent = () => {
  const location = useLocation();

  return (
    <AntLayout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ===== NAV BAR ===== */}
      <Header
        style={{
          background: '#1e293b',      // Slate-800 dark background
          height: 56,
          lineHeight: '56px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid #334155',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        {/* Brand / Title */}
        <div
          style={{
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 18,
            marginRight: 32,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <DatabaseOutlined style={{ fontSize: 20 }} />
          <span>Upper Crust ERP</span>
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={NAV_ITEMS}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            borderBottom: 'none',
            fontSize: 14,
          }}
        />
      </Header>

      {/* ===== MAIN CONTENT ===== */}
      <Content
        style={{
          flex: 1,
          padding: '24px 32px',
          background: '#f1f5f9',  // Slate-100
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: 24,
            borderRadius: 8,
            minHeight: 320,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <Outlet />
        </div>
      </Content>

      {/* ===== FOOTER ===== */}
      <Footer
        style={{
          textAlign: 'center',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          color: '#64748b',
          padding: '16px 24px',
          fontSize: 13,
        }}
      >
        <Text type="secondary">
          Upper Crust ERP &copy;{new Date().getFullYear()} &mdash; Built with Petpooja API
        </Text>
      </Footer>
    </AntLayout>
  );
};

export default LayoutComponent;
