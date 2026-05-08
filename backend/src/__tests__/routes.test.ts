import request from 'supertest';

// Mock PrismaClient BEFORE any imports that use it
const mockPrisma = {
  $queryRaw: jest.fn(),
  $disconnect: jest.fn(),
  restaurant: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  customer: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), count: jest.fn() },
  order: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn(), create: jest.fn() },
  orderItem: { create: jest.fn(), createMany: jest.fn() },
  inventoryItem: { findMany: jest.fn(), create: jest.fn(), upsert: jest.fn() },
  inventoryStock: { findMany: jest.fn(), upsert: jest.fn() },
  tax: { createMany: jest.fn() },
  discount: { createMany: jest.fn() },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock('../api/petpooja-client', () => ({
  PetpoojaClient: jest.fn().mockImplementation(() => ({
    syncOrders: jest.fn().mockResolvedValue({ orders: [] }),
    getCustomers: jest.fn().mockResolvedValue({ customers: [] }),
  })),
}));

// Now import app AFTER mocks are set up
import { createApp } from '../app';

const app = createApp();

beforeEach(() => {
  jest.clearAllMocks();
  // Set up default mock behavior
  mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
});

describe('Health Check', () => {
  it('should return healthy when database is connected', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('database', 'connected');
  });

  it('should return unhealthy when database fails', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('DB connection failed'));
    const res = await request(app).get('/health');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('status', 'unhealthy');
    expect(res.body).toHaveProperty('error', 'Database connection failed');
  });
});

describe('Restaurant Routes', () => {
  describe('GET /api/restaurants', () => {
    it('should return list of restaurants with counts', async () => {
      const mockRestaurants = [
        { id: 1, petpoojaRestId: 'uvhn3bim', name: 'UC - Vastrapur', _count: { orders: 10, customers: 5, inventoryItems: 20 } },
        { id: 2, petpoojaRestId: 't2jrg8ez', name: 'UC - Another', _count: { orders: 8, customers: 3, inventoryItems: 15 } },
      ];
      mockPrisma.restaurant.findMany.mockResolvedValue(mockRestaurants);

      const res = await request(app).get('/api/restaurants');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('UC - Vastrapur');
      expect(res.body[0]._count.orders).toBe(10);
    });

    it('should return 500 on database error', async () => {
      mockPrisma.restaurant.findMany.mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/restaurants');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/restaurants/:id', () => {
    it('should return a restaurant by id', async () => {
      const mockRestaurant = {
        id: 1, petpoojaRestId: 'uvhn3bim', name: 'UC - Vastrapur',
        customers: [], orders: [], inventoryItems: [],
      };
      mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
      const res = await request(app).get('/api/restaurants/1');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('UC - Vastrapur');
    });

    it('should return 404 when restaurant not found', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      const res = await request(app).get('/api/restaurants/999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Restaurant not found');
    });
  });
});

describe('Order Routes', () => {
  describe('GET /api/orders', () => {
    it('should return paginated orders with default params', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);
      const res = await request(app)
        .get('/api/orders')
        .query({ page: '1', limit: '10' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data', []);
      expect(res.body.pagination).toEqual({
        total: 0, page: 1, limit: 10, totalPages: 0,
      });
    });

    it('should filter by menuSharingCodes', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([{ id: 1, petpoojaRestId: 'uvhn3bim' }]);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);
      const res = await request(app)
        .get('/api/orders')
        .query({ menuSharingCodes: 'uvhn3bim', page: '1', limit: '10' });
      expect(res.status).toBe(200);
      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith({
        where: { petpoojaRestId: { in: ['uvhn3bim'] } },
      });
    });
  });
});
