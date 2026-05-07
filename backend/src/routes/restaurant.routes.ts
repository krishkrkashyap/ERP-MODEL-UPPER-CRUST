// src/routes/restaurant.routes.ts - Restaurant management routes
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all restaurants
router.get('/', async (req: Request, res: Response) => {
    try {
        const restaurants = await prisma.restaurant.findMany({
            include: {
                _count: {
                    select: { orders: true, customers: true, inventoryItems: true }
                }
            }
        });
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurants' });
    }
});

// Get restaurant by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: parseInt(id) },
            include: {
                customers: true,
                orders: { take: 10, orderBy: { createdAt: 'desc' } },
                inventoryItems: true
            }
        });

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurant' });
    }
});

// Create restaurant
router.post('/', async (req: Request, res: Response) => {
    try {
        const { petpoojaRestId, name, address, state, contactInfo } = req.body;

        const restaurant = await prisma.restaurant.create({
            data: {
                petpoojaRestId,
                name,
                address,
                state,
                contactInfo
            }
        });

        res.status(201).json(restaurant);
    } catch (error: any) {
        console.error('Error creating restaurant:', error);
        res.status(500).json({ error: 'Failed to create restaurant', details: error.message });
    }
});

// Get restaurants from Petpooja (sync)
router.post('/sync', async (req: Request, res: Response) => {
    try {
        // This would call Petpooja API to get restaurant details
        // For now, return success
        res.json({ message: 'Sync endpoint - implement with Petpooja API' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to sync restaurants' });
    }
});

export default router;
