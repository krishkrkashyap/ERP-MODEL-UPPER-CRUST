// src/routes/raw-material.routes.ts - Raw Material management routes
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { petpoojaClient } from '../api/petpooja-client';

const router = Router();
const prisma = new PrismaClient();

// Get all raw materials
router.get('/', async (req: Request, res: Response) => {
    try {
        const { restaurantId, category, status } = req.query;
        
        const where: any = {};
        if (restaurantId) where.restaurantId = parseInt(restaurantId as string);
        if (category) where.category = category;
        if (status !== undefined) where.status = status === 'true';
        
        const materials = await prisma.inventoryItem.findMany({
            where: {
                ...where,
                type: 'R' // Raw Material type
            },
            orderBy: { name: 'asc' }
        });
        
        res.json(materials);
    } catch (error) {
        console.error('❌ Get raw materials error:', error);
        res.status(500).json({ error: 'Failed to fetch raw materials' });
    }
});

// Create raw material (Push to Petpooja via Raw Material API)
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            restaurantId,
            name,
            category,
            unit,
            consumptionUnit,
            conversionQty,
            hsnCode,
            gstPer,
            isExpiry,
            sapCode
        } = req.body;
        
        // Push to Petpooja Raw Material API (syntax.md Section 1.6)
        const petpoojaResponse = await petpoojaClient.createRawMaterial([{
            name,
            category: category || '',
            type: 'R', // Raw Material
            unit: unit || 'KG',
            consumptionUnit: consumptionUnit || 'GM',
            conversionQty: conversionQty?.toString() || '1000',
            description: '',
            status: '1', // Active
            hsnCode: hsnCode || '',
            gstPer: gstPer?.toString() || '0',
            created: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            isExpiry: isExpiry ? '1' : '0',
            createdbyUsername: 'admin',
            rawMaterialPurchaseUnit: [{
                unitName: unit || 'KG',
                isConsumptionUnit: '0' // 0 = purchase unit
            }]
        }]);
        
        if (petpoojaResponse.code === '200') {
            // Save to local DB
            const material = await prisma.inventoryItem.create({
                data: {
                    name,
                    category: category || null,
                    type: 'R',
                    unit: unit || 'KG',
                    consumptionUnit: consumptionUnit || 'GM',
                    conversionQty: conversionQty ? parseFloat(conversionQty) : 1000,
                    hsnCode: hsnCode || null,
                    gstPercentage: gstPer ? parseFloat(gstPer) : null,
                    sapCode: sapCode || null,
                    isExpiry: isExpiry || false,
                    status: true,
                    restaurantId: parseInt(restaurantId)
                }
            });
            
            res.json({ success: true, material });
        } else {
            res.status(400).json({ error: 'Failed to create in Petpooja', response: petpoojaResponse });
        }
    } catch (error: any) {
        console.error('❌ Create raw material error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
