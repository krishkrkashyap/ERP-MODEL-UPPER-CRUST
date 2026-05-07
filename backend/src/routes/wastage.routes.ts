// src/routes/wastage.routes.ts - Wastage tracking routes
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { petpoojaClient } from '../api/petpooja-client';

const router = Router();
const prisma = new PrismaClient();

// Get wastage records (using Get Sales API with type="Wastage")
router.get('/', async (req: Request, res: Response) => {
    try {
        const { date, restaurantId } = req.query;
        
        if (!date) {
            return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
        }
        
        // Fetch from Petpooja Get Sales API (syntax.md Section 2.4)
        // type: "Wastage" to filter only wastage records
        const response = await petpoojaClient.getSales(
            date as string,
            date as string, // Same date for from/to
            'Wastage'
        );
        
        if (response.code === '200' && response.sales) {
            // Transform and return wastage records
            const wastageRecords = response.sales.map((sale: any) => ({
                id: sale.sale_id || 0,
                invoiceNumber: sale.invoice_number || '',
                invoiceDate: sale.invoice_date || '',
                type: sale.type || 'Wastage',
                total: parseFloat(sale.total || '0'),
                totalTax: parseFloat(sale.total_tax || '0'),
                receiverName: sale.rest_details?.receiver?.receiver_name || '',
                receiverType: sale.rest_details?.receiver?.receiver_type || '',
                status: sale.status || '1',
                rawPayload: sale
            }));
            
            res.json(wastageRecords);
        } else {
            res.json([]);
        }
    } catch (error: any) {
        console.error('❌ Get wastage error:', error);
        res.status(500).json({ error: 'Failed to fetch wastage records' });
    }
});

// Log wastage (Push to Petpooja via Internal Sales API)
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            restaurantId,
            invoiceDate,
            total,
            totalTax,
            receiverName,
            receiverType,
            itemDetails
        } = req.body;
        
        // Push to Petpooja Internal Sales API (syntax.md Section 1.4)
        // type: "Wastage" (syntax.md: type field)
        // Note: createSale wraps data in { Sale: data }
        const petpoojaResponse = await petpoojaClient.createSale({
            updateStock: "1", // Update stock
            receiverType: receiverType || "S", // S, C, etc.
            invoiceDate: invoiceDate,
            invoiceNumber: `WASTAGE-${Date.now()}`, // Generate wastage invoice number
            totalTax: Number(totalTax) || 0, // Note: Number, not string
            totalDiscount: 0,
            deliveryCharge: 0,
            discountPer: 0,
            itemDetails: itemDetails || [],
            total: String(total) || "0.00", // Note: String, not number
            roundoff: "0",
            restDetails: {
                sender: { senderName: "ERP System" },
                receiver: { receiverType: receiverType || "S", receiverName: receiverName || "Wastage Disposal" }
            }
        });
        
        if (petpoojaResponse.status === 1) {
            // Note: For wastage, we typically don't save to local DB
            // since it's pushed to Petpooja and can be fetched via Get Sales API
            // But we could save to internal_sales table if needed
            
            res.json({ 
                success: true, 
                message: 'Wastage logged successfully',
                invoiceNumber: `WASTAGE-${Date.now()}`
            });
        } else {
            res.status(400).json({ 
                error: 'Failed to log wastage in Petpooja', 
                response: petpoojaResponse 
            });
        }
    } catch (error: any) {
        console.error('❌ Log wastage error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
