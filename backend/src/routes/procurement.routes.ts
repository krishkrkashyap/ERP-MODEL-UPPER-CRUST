// src/routes/procurement.routes.ts - Procurement management routes
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { petpoojaClient } from '../api/petpooja-client';

const router = Router();
const prisma = new PrismaClient();

// ===== Purchase Orders (Webhook receives these) =====

// Get all purchase orders
router.get('/purchase-orders', async (req: Request, res: Response) => {
    try {
        const { restaurantId, status, page = '1', limit = '10' } = req.query;

        const where: any = {};
        if (restaurantId) where.restaurantId = parseInt(restaurantId as string);
        if (status) where.status = status;

        const [orders, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page as string) - 1) * parseInt(limit as string),
                take: parseInt(limit as string),
                include: { restaurant: true }
            }),
            prisma.purchaseOrder.count({ where })
        ]);

        res.json({
            data: orders,
            pagination: {
                total,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                totalPages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('❌ Get purchase orders error:', error);
        res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
});

// Sync purchase orders from Petpooja (Get Purchase API: syntax.md Section 2.3)
// Date format: DD-MM-YYYY (e.g., "01-08-2024")
router.post('/purchase-orders/sync', async (req: Request, res: Response) => {
    try {
        const { fromDate, toDate, restaurantId } = req.body;

        if (!fromDate || !toDate) {
            return res.status(400).json({ error: 'fromDate and toDate required (DD-MM-YYYY)' });
        }

        console.log(`🔄 Syncing purchase orders from ${fromDate} to ${toDate}`);

        // Call Petpooja Get Purchase API (syntax.md Section 2.3)
        const response = await petpoojaClient.getPurchases(fromDate, toDate);
        
        if (response.code === '200' && response.purchases) {
            let synced = 0;

            for (const poData of response.purchases) {
                // Upsert purchase order
                await prisma.purchaseOrder.upsert({
                    where: { petpoojaPoId: poData.purchase_id?.toString() || '' },
                    update: {
                        receiverType: poData.receiver_type,
                        receiverName: poData.restaurant_details?.receiver?.receiver_name,
                        deliveryDate: poData.delivery_date ? new Date(poData.delivery_date) : undefined,
                        poNumber: poData.poNumber,
                        totalTax: parseFloat(poData.total_tax || '0'),
                        total: parseFloat(poData.total || '0'),
                        roundOff: parseFloat(poData.roundOff || '0'),
                        status: poData.status,
                        rawPayload: poData
                    },
                    create: {
                        petpoojaPoId: poData.purchase_id?.toString() || '',
                        restaurant: {
                            connectOrCreate: {
                                where: { id: restaurantId ? parseInt(restaurantId) : 0 },
                                create: {
                                    petpoojaRestId: 'unknown',
                                    name: poData.restaurant_details?.sender?.sender_name || 'Unknown'
                                }
                            }
                        },
                        receiverType: poData.receiver_type,
                        receiverName: poData.restaurant_details?.receiver?.receiver_name,
                        deliveryDate: poData.delivery_date ? new Date(poData.delivery_date) : undefined,
                        poNumber: poData.poNumber,
                        totalTax: parseFloat(poData.total_tax || '0'),
                        total: parseFloat(poData.total || '0'),
                        roundOff: parseFloat(poData.roundOff || '0'),
                        status: poData.status,
                        rawPayload: poData
                    }
                });

                synced++;
            }

            res.json({
                message: `✅ Synced ${synced} purchase orders`,
                total: response.purchases.length
            });
        } else {
            res.status(400).json({ error: 'Failed to fetch from Petpooja', response });
        }
    } catch (error: any) {
        console.error('❌ Sync purchase orders error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ===== Purchase Invoices =====

// Get all purchase invoices
router.get('/purchase-invoices', async (req: Request, res: Response) => {
    try {
        const { restaurantId, paymentStatus, page = '1', limit = '10' } = req.query;

        const where: any = {};
        if (restaurantId) where.restaurantId = parseInt(restaurantId as string);
        if (paymentStatus) where.paymentStatus = paymentStatus;

        const [invoices, total] = await Promise.all([
            prisma.purchaseInvoice.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page as string) - 1) * parseInt(limit as string),
                take: parseInt(limit as string),
                include: { restaurant: true }
            }),
            prisma.purchaseInvoice.count({ where })
        ]);

        res.json({
            data: invoices,
            pagination: {
                total,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                totalPages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch purchase invoices' });
    }
});

// Create purchase invoice (Push to Petpooja: syntax.md Section 1.1)
router.post('/purchase-invoices', async (req: Request, res: Response) => {
    try {
        const { 
            restaurantId, 
            invoiceNumber, 
            invoiceDate, 
            receiverName, 
            receiverType,
            totalTax, 
            totalDiscount, 
            deliveryCharge, 
            total, 
            itemDetails 
        } = req.body;

        // Push to Petpooja (syntax.md: Purchase API)
        const petpoojaResponse = await petpoojaClient.createPurchase({
            updateStock: "1",
            status: "1",
            receiverType,
            invoiceDate,
            invoiceNumber,
            totalTax: totalTax?.toString() || "0.00",
            totalDiscount: totalDiscount?.toString() || "0",
            deliveryCharge: deliveryCharge?.toString() || "0",
            discountPer: "0",
            itemDetails: itemDetails || [],
            total: total?.toString() || "0.00",
            roundoff: "0",
            restDetails: {
                sender: { senderName: "Your Company" },
                receiver: { receiverType, receiverName }
            }
        });

        if (petpoojaResponse.status === 1) {
            // Save to local DB
            const invoice = await prisma.purchaseInvoice.create({
                data: {
                    petpoojaPurchaseId: petpoojaResponse.purchase_id?.toString(),
                    restaurantId: parseInt(restaurantId),
                    invoiceNumber,
                    invoiceDate: new Date(invoiceDate),
                    receiverName,
                    receiverType,
                    subTotal: total - totalTax,
                    totalTax,
                    totalDiscount,
                    deliveryCharge,
                    total,
                    paymentStatus: 'Unpaid',
                    rawPayload: petpoojaResponse
                }
            });

            res.status(201).json({
                message: '✅ Purchase invoice created',
                invoice,
                petpoojaResponse
            });
        } else {
            res.status(400).json({ error: 'Failed to create in Petpooja', petpoojaResponse });
        }
    } catch (error: any) {
        console.error('❌ Create purchase invoice error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ===== Internal Sales (Transfers & Wastage) =====

// Get internal sales (transfers, wastage)
router.get('/internal-sales', async (req: Request, res: Response) => {
    try {
        const { type, restaurantId } = req.query;

        const where: any = {};
        if (type) where.type = type; // "Transfer", "Wastage", "Normal"
        if (restaurantId) where.restaurantId = parseInt(restaurantId as string);

        const sales = await prisma.internalSale.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { restaurant: true }
        });

        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch internal sales' });
    }
});

// Sync internal sales from Petpooja (Get Sales API: syntax.md Section 2.4)
router.post('/internal-sales/sync', async (req: Request, res: Response) => {
    try {
        const { fromDate, toDate, sType = 'sale', restaurantId } = req.body;

        if (!fromDate || !toDate) {
            return res.status(400).json({ error: 'fromDate and toDate required (DD-MM-YYYY)' });
        }

        console.log(`🔄 Syncing ${sType} from ${fromDate} to ${toDate}`);

        // Call Petpooja Get Sales API (syntax.md Section 2.4)
        const response = await petpoojaClient.getSales(fromDate, toDate, sType);
        
        if (response.code === '200' && response.sales) {
            let synced = 0;

            for (const saleData of response.sales) {
                await prisma.internalSale.upsert({
                    where: { petpoojaSaleId: saleData.sale_id?.toString() || '' },
                    update: {
                        type: saleData.type,
                        invoiceNumber: saleData.invoice_number,
                        invoiceDate: saleData.invoice_date ? new Date(saleData.invoice_date) : undefined,
                        total: parseFloat(saleData.total || '0'),
                        totalTax: parseFloat(saleData.total_tax || '0'),
                        status: saleData.status,
                        rawPayload: saleData
                    },
                    create: {
                        petpoojaSaleId: saleData.sale_id?.toString() || '',
                        restaurantId: restaurantId ? parseInt(restaurantId) : 0,
                        type: saleData.type,
                        invoiceNumber: saleData.invoice_number,
                        invoiceDate: saleData.invoice_date ? new Date(saleData.invoice_date) : undefined,
                        total: parseFloat(saleData.total || '0'),
                        totalTax: parseFloat(saleData.total_tax || '0'),
                        status: saleData.status,
                        rawPayload: saleData
                    }
                });

                synced++;
            }

            res.json({
                message: `✅ Synced ${synced} ${sType} records`,
                total: response.sales.length
            });
        } else {
            res.status(400).json({ error: 'Failed to fetch from Petpooja', response });
        }
    } catch (error: any) {
        console.error('❌ Sync internal sales error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
