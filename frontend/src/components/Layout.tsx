import { Outlet, Link } from 'react-router-dom';
import { Layout as AntLayout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  ShoppingCartOutlined, 
  DatabaseOutlined,
  AppstoreOutlined 
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Content, Footer } = AntLayout;

const LayoutComponent = () => {
  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/orders">Orders</Link>,
    },
    {
      key: '/inventory',
      icon: <DatabaseOutlined />,
      label: <Link to="/inventory">Inventory</Link>,
    },
    {
      key: '/raw-materials',
      icon: <AppstoreOutlined />,
      label: <Link to="/raw-materials">Raw Materials</Link>,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ color: 'white', marginRight: '2rem' }}>ERP System</h1>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['/']}
            items={menuItems}
            style={{ flex: 1 }}
          />
        </div>
      </Header>
      <Content style={{ padding: '24px 48px' }}>
        <div style={{ background: '#fff', padding: 24, minHeight: 280 }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        ERP System ©{new Date().getFullYear()} - Built with Petpooja API
      </Footer>
    </AntLayout>
  );
};

export default LayoutComponent;
