// src/server.ts - Main Express server for ERP Backend
import express, { Express, Request, Response, NextFunction } from 'express';
import c from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(c());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ===== HEALTH CHECK =====
app.get('/health', async (req: Request, res: Response) => {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: 'Database connection failed'
        });
    }
});

// ===== API ROUTES =====

// Restaurant routes
import restaurantRoutes from './routes/restaurant.routes';
app.use('/api/restaurants', restaurantRoutes);

// Customer routes
import customerRoutes from './routes/customer.routes';
app.use('/api/customers', customerRoutes);

// Order routes
import orderRoutes from './routes/order.routes';
app.use('/api/orders', orderRoutes);

// Inventory routes
import inventoryRoutes from './routes/inventory.routes';
app.use('/api/inventory', inventoryRoutes);

// Procurement routes
import procurementRoutes from './routes/procurement.routes';
app.use('/api/procurement', procurementRoutes);

// Raw Material routes
import rawMaterialRoutes from './routes/raw-material.routes';
app.use('/api/raw-materials', rawMaterialRoutes);

// Petpooja webhook routes
import webhookRoutes from './routes/webhook.routes';
app.use('/webhook/petpooja', webhookRoutes);

// ===== ERROR HANDLING =====
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 ERP Backend server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await prisma.$disconnect();
    process.exit(0);
});
