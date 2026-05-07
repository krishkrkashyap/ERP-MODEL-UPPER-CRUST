// src/routes/webhook.routes.ts - Webhook handlers for Petpooja real-time data
import { Router, Request, Response } from 'express';
import { petpoojaClient } from '../api/petpooja-client';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ===== Purchase Order Webhook (syntax.md Section 2.2) =====
// Petpooja pushes PO data to: POST /webhook/petpooja/purchase-order
router.post('/purchase-order', async (req: Request, res: Response) => {
    try {
        const { app_key, access_token, menuSharingCode, data } = req.body;

        // Validate webhook authenticity (syntax.md: validate app_key)
        if (app_key !== process.env.PETPOOJA_APP_KEY) {
            console.warn('❌ Invalid app_key in webhook:', app_key);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('✅ Received PO Webhook:', {
            menuSharingCode,
            poNumber: data?.poNumber,
            total: data?.total
        });

        // Process PO data (plan.md Section 5.3: Procurement Module)
        if (data) {
            const purchaseOrder = await prisma.purchaseOrder.upsert({
                where: { petpoojaPoId: data.id?.toString() || '' },
                update: {
                    receiverType: data.receiverType,
                    receiverName: data.restDetails?.receiver?.receiver_name,
                    deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
                    poNumber: data.poNumber,
                    totalTax: parseFloat(data.totalTax || '0'),
                    total: parseFloat(data.total || '0'),
                    roundOff: parseFloat(data.roundOff || '0'),
                    status: data.status,
                    rawPayload: data
                },
                create: {
                    petpoojaPoId: data.id?.toString() || '',
                    restaurant: {
                        connectOrCreate: {
                            where: { petpoojaRestId: menuSharingCode },
                            create: {
                                petpoojaRestId: menuSharingCode,
                                name: data.restDetails?.sender?.sender_name || 'Unknown'
                            }
                        }
                    },
                    receiverType: data.receiverType,
                    receiverName: data.restDetails?.receiver?.receiver_name,
                    deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
                    poNumber: data.poNumber,
                    totalTax: parseFloat(data.totalTax || '0'),
                    total: parseFloat(data.total || '0'),
                    roundOff: parseFloat(data.roundOff || '0'),
                    status: data.status,
                    rawPayload: data
                }
            });

            console.log('✅ PO saved:', purchaseOrder.poNumber);
        }

        // Acknowledge receipt (syntax.md: return { success: true })
        res.json({ success: true });
    } catch (error: any) {
        console.error('❌ Webhook error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
