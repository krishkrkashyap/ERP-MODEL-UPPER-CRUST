import request from 'supertest';
import { createApp } from '../app';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $queryRaw: jest.fn(),
    restaurant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const app = createApp();

describe('Health Check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return healthy when database is connected', async () => {
    const { PrismaClient } = require('@prisma/client');
    const prismaMock = new PrismaClient();

    prismaMock.$queryRaw.mockResolvedValue([{ '1': 1 }]);

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('database', 'connected');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should return unhealthy when database connection fails', async () => {
    const { PrismaClient } = require('@prisma/client');
    const prismaMock = new PrismaClient();

    prismaMock.$queryRaw.mockRejectedValue(new Error('DB connection failed'));

    const res = await request(app).get('/health');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('status', 'unhealthy');
    expect(res.body).toHaveProperty('error', 'Database connection failed');
  });
});
