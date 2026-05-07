// src/routes/customer.routes.ts - Customer management routes
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { petpoojaClient } from '../api/petpooja-client';

const router = Router();
const prisma = new PrismaClient();

// ===== GET /api/customers - List all customers =====
router.get('/', async (req: Request, res: Response) => {
    try {
        const { restaurantId, phone } = req.query;

        const where: any = {};
        if (restaurantId) where.restaurantId = parseInt(restaurantId as string);
        if (phone) where.phone = phone;

        const customers = await prisma.customer.findMany({
            where,
            include: { restaurant: true },
            orderBy: { name: 'asc' }
        });

        res.json({ success: true, data: customers });
    } catch (error: any) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== GET /api/customers/:id - Get single customer =====
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { restaurant: true, orders: true }
        });

        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        res.json({ success: true, data: customer });
    } catch (error: any) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== POST /api/customers/sync - Sync customers from Petpooja API =====
router.post('/sync', async (req: Request, res: Response) => {
    try {
        const { restaurantId, menuSharingCode, date } = req.body;

        if (!restaurantId || !menuSharingCode || !date) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: restaurantId, menuSharingCode, date (YYYY-MM-DD)'
            });
        }

        // Fetch consumption data from Petpooja API
        const response = await petpoojaClient.getConsumption(date, '');
        
        if (!response.success) {
            return res.status(400).json({ success: false, error: response.message });
        }

        const orders = response.data?.order_json || [];
        let syncedCount = 0;
        const customersCreated: any[] = [];

        for (const order of orders) {
            const customerData = order.Customer;
            if (!customerData || !customerData.phone) continue;

            // Check if customer already exists
            const existingCustomer = await prisma.customer.findFirst({
                where: {
                    restaurantId: parseInt(restaurantId),
                    phone: customerData.phone
                }
            });

            if (!existingCustomer) {
                const newCustomer = await prisma.customer.create({
                    data: {
                        restaurantId: parseInt(restaurantId),
                        petpoojaCustomerId: customerData.customer_id?.toString(),
                        name: customerData.name || 'walk',
                        phone: customerData.phone,
                        address: customerData.address,
                        gstin: customerData.gst_no,
                        createdDate: customerData.created_date ? new Date(customerData.created_date) : null
                    }
                });
                customersCreated.push(newCustomer);
                syncedCount++;
            }
        }

        res.json({
            success: true,
            message: `Synced ${syncedCount} customers`,
            data: { syncedCount, customers: customersCreated }
        });
    } catch (error: any) {
        console.error('Error syncing customers:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
