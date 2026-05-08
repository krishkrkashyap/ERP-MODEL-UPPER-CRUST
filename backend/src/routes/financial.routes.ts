// src/routes/financial.routes.ts - Financial management routes
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get tax liability for a period
router.get('/tax-liability', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, restaurantId, menuSharingCodes } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required (YYYY-MM-DD)' });
        }
        
        const where: any = {
            order: {
                createdOn: {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string)
                }
            }
        };
        
        // Handle multiple menuSharingCodes
        if (menuSharingCodes) {
            const codes = (menuSharingCodes as string).split(',');
            const restaurants = await prisma.restaurant.findMany({
                where: { petpoojaRestId: { in: codes } }
            });
            if (restaurants.length > 0) {
                where.order.restaurantId = { in: restaurants.map(r => r.id) };
            }
        } else if (restaurantId) {
            where.order.restaurantId = parseInt(restaurantId as string);
        }
        
        // Fetch all taxes from OrderTax table
        const taxes = await prisma.orderTax.findMany({
            where,
            include: {
                order: {
                    include: { restaurant: true }
                }
            }
        });
        
        // Aggregate by tax type (title: CGST, SGST, etc.)
        const aggregation: { [key: string]: { rate: number; amount: number; count: number } } = {};
        
        taxes.forEach(tax => {
            const key = tax.title || 'Unknown';
            if (!aggregation[key]) {
                aggregation[key] = { rate: Number(tax.rate), amount: 0, count: 0 };
            }
            aggregation[key].amount += Number(tax.amount);
            aggregation[key].count += 1;
        });
        
        // Convert to array
        const result = Object.keys(aggregation).map(key => ({
            taxType: key,
            rate: aggregation[key].rate,
            amount: aggregation[key].amount,
            orderCount: aggregation[key].count,
            invoiceCount: 0 // TODO: Add purchase invoice taxes
        }));
        
        res.json(result);
    } catch (error: any) {
        console.error('❌ Get tax liability error:', error);
        res.status(500).json({ error: 'Failed to calculate tax liability' });
    }
});

// Get P&L statement for a period
router.get('/pnl', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, restaurantId, menuSharingCodes } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required (YYYY-MM-DD)' });
        }
        
        const where: any = {
            createdOn: {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            }
        };
        
        // Handle multiple menuSharingCodes
        if (menuSharingCodes) {
            const codes = (menuSharingCodes as string).split(',');
            const restaurants = await prisma.restaurant.findMany({
                where: { petpoojaRestId: { in: codes } }
            });
            if (restaurants.length > 0) {
                where.restaurantId = { in: restaurants.map(r => r.id) };
            }
        } else if (restaurantId) {
            where.restaurantId = parseInt(restaurantId as string);
        }
        
        // Get total sales (from orders)
        const sales = await prisma.order.aggregate({
            where,
            _sum: {
                total: true
            }
        });
        
        // Get total purchases (from purchase invoices)
        const purchases = await prisma.purchaseInvoice.aggregate({
            where: {
                invoiceDate: {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string)
                },
                ...(where.restaurantId ? { restaurantId: where.restaurantId } : {})
            },
            _sum: {
                total: true
            }
        });
        
        // Get total tax liability
        const taxes = await prisma.orderTax.findMany({
            where: {
                order: where
            },
            select: {
                amount: true
            }
        });
        
        const totalRevenue = Number(sales._sum.total) || 0;
        const totalPurchases = Number(purchases._sum.total) || 0;
        const totalTax = taxes.reduce((sum, tax) => sum + Number(tax.amount), 0);
        const grossProfit = totalRevenue - totalPurchases;
        
        res.json({
            totalRevenue,
            totalPurchases,
            grossProfit,
            totalTax,
            netProfit: grossProfit - totalTax
        });
    } catch (error: any) {
        console.error('❌ Get P&L error:', error);
        res.status(500).json({ error: 'Failed to generate P&L statement' });
    }
});

export default router;
