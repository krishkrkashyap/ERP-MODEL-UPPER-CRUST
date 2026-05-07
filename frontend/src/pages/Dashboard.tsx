import { Card, Col, Row, Statistic, Spin, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ShoppingCartOutlined, 
  DatabaseOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';

interface DashboardStats {
  totalOrders: number;
  totalInventory: number;
  syncedItems: number;
}

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [ordersRes, inventoryRes] = await Promise.all([
        axios.get('/api/orders?page=1&limit=1'),
        axios.get('/api/inventory/stock?date=2026-05-05'),
      ]);
      return {
        totalOrders: ordersRes.data.pagination?.total || 0,
        totalInventory: inventoryRes.data.length || 0,
        syncedItems: inventoryRes.data.length || 0,
      };
    },
  });

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

  return (
    <div>
      <h2>Dashboard</h2>
      <Spin spinning={isLoading}>
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Orders"
                value={Number(data?.totalOrders) || 0}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Inventory Items"
                value={Number(data?.totalInventory) || 0}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Synced Items"
                value={Number(data?.syncedItems) || 0}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
