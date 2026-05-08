// src/app.ts - Express app factory (separated for testability)
import express, { Express, Request, Response, NextFunction } from 'express';
import c from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Route imports
import restaurantRoutes from './routes/restaurant.routes';
import customerRoutes from './routes/customer.routes';
import orderRoutes from './routes/order.routes';
import inventoryRoutes from './routes/inventory.routes';
import procurementRoutes from './routes/procurement.routes';
import rawMaterialRoutes from './routes/raw-material.routes';
import wastageRoutes from './routes/wastage.routes';
import financialRoutes from './routes/financial.routes';
import webhookRoutes from './routes/webhook.routes';
import reportRoutes from './routes/report.routes';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

export function createApp(): Express {
    const app: Express = express();

    // Middleware
    app.use(express.json());
    app.use(c());

    // Request logging middleware (silent in test mode)
    if (process.env.NODE_ENV !== 'test') {
        app.use((req: Request, res: Response, next: NextFunction) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    // ===== HEALTH CHECK =====
    app.get('/health', async (req: Request, res: Response) => {
        try {
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
    app.use('/api/restaurants', restaurantRoutes);
    app.use('/api/customers', customerRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/procurement', procurementRoutes);
    app.use('/api/raw-materials', rawMaterialRoutes);
    app.use('/api/wastage', wastageRoutes);
    app.use('/api/financial', financialRoutes);
    app.use('/webhook/petpooja', webhookRoutes);
    app.use('/api/reports', reportRoutes);

    // ===== ERROR HANDLING =====
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error('Unhandled error:', err.stack);
        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    });

    return app;
}

export { prisma };
