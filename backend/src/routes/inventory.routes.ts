// src/routes/inventory.routes.ts - Inventory management routes
import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { PetpoojaClient } from '../api/petpooja-client';

const router = Router();
const prisma = new PrismaClient();

// Helper to get client with correct menuSharingCode
function getPetpoojaClient(menuSharingCode?: string): PetpoojaClient {
  return new PetpoojaClient(menuSharingCode);
}

// Helper function to find or create inventory item
async function findOrCreateInventoryItem(itemData: any, restaurantId: number) {
  // Try to find by sapCode first
  if (itemData.sapcode) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { sapCode: itemData.sapcode }
    });
    if (existing) return existing;
  }

  // Try to find by name and restaurant
  const existing = await prisma.inventoryItem.findFirst({
    where: {
      name: itemData.name,
      restaurantId: restaurantId
    }
  });
  if (existing) return existing;

  // Create new inventory item
  return await prisma.inventoryItem.create({
    data: {
      name: itemData.name || 'Unknown Item',
      unit: itemData.unit || 'NOS',
      category: itemData.category || 'General',
      sapCode: itemData.sapcode || null,
      restaurantId: restaurantId,
      status: true
    }
  });
}

// ===== Stock Levels =====

// Get stock levels for a date (Stock API: syntax.md Section 2.1)
// Date format: YYYY-MM-DD (T-1 rule)
router.get('/stock', async (req: Request, res: Response) => {
  try {
    const { date, restaurantId, menuSharingCodes } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    }

    // Build where clause
    const where: any = {
      date: new Date(date as string),
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

    // First try to get from local DB
    let stockLevels = await prisma.stockLevel.findMany({
      where,
      include: { inventoryItem: true }
    });

    // If not in DB, fetch from Petpooja
    if (stockLevels.length === 0) {
      const codes = menuSharingCodes ? (menuSharingCodes as string).split(',') : ['uvhn3bim'];
      console.log(`🔄 Fetching stock from Petpooja for date: ${date}, outlets: ${codes.join(', ')}`);
      
      let allStockItems: any[] = [];
      
      // Fetch from all outlets
      for (const code of codes) {
        try {
          const client = getPetpoojaClient(code);
          const response = await client.getStock(date as string);
          
          if (response.code === '200' && response.closing_json) {
            allStockItems = [...allStockItems, ...response.closing_json];
          }
        } catch (err: any) {
          console.error(`Error fetching stock for outlet ${code}:`, err.message);
        }
      }
      
      if (allStockItems.length > 0) {
        const defaultRestaurantId = restaurantId ? parseInt(restaurantId as string) : 1;
        const stockDate = new Date(date as string);

        // Save to database - Use upsert to handle duplicates (unique constraint on inventoryItemId+restaurantId+date)
         for (const item of allStockItems) {
          const inventoryItem = await findOrCreateInventoryItem(item, defaultRestaurantId);
          
          await prisma.stockLevel.upsert({
            where: {
              inventoryItemId_restaurantId_date: {
                inventoryItemId: inventoryItem.id,
                restaurantId: defaultRestaurantId,
                date: stockDate
              }
            },
            update: {
              quantity: parseFloat(item.qty) || 0,
              unit: item.unit || 'NOS',
              price: parseFloat(item.price) || 0
            },
            create: {
              inventoryItemId: inventoryItem.id,
              restaurantId: defaultRestaurantId,
              date: stockDate,
              quantity: parseFloat(item.qty) || 0,
              unit: item.unit || 'NOS',
              price: parseFloat(item.price) || 0
            }
          });
        }

        // Fetch again to return
        stockLevels = await prisma.stockLevel.findMany({
          where: { date: stockDate },
          include: { inventoryItem: true }
        });
      }
    }

    res.json({
      date,
      count: stockLevels.length,
      data: stockLevels
    });
  } catch (error: any) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync stock from Petpooja
router.post('/stock/sync', async (req: Request, res: Response) => {
  try {
    const { date, restaurantId, menuSharingCodes } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    }

    // Handle multiple menuSharingCodes
    const codes = Array.isArray(menuSharingCodes) ? menuSharingCodes : 
                   (menuSharingCodes ? [menuSharingCodes] : ['uvhn3bim']);
    
    const restId = restaurantId ? parseInt(restaurantId) : 1;

    console.log(`🔄 Syncing stock for date: ${date}, restaurant: ${restId}, outlets: ${codes.join(', ')}`);

    let totalSynced = 0;
    const results: any[] = [];

    // Loop through each outlet
    for (const code of codes) {
      try {
        const client = getPetpoojaClient(code);
        const response = await client.getStock(date);

        if (response.code === '200' && response.closing_json) {
          let synced = 0;

          for (const item of response.closing_json) {
            const inventoryItem = await findOrCreateInventoryItem(item, restId);
            
            // Upsert stock level
            await prisma.stockLevel.upsert({
              where: {
                inventoryItemId_restaurantId_date: {
                  inventoryItemId: inventoryItem.id,
                  restaurantId: restId,
                  date: new Date(date)
                }
              },
              update: {
                quantity: parseFloat(item.qty) || 0,
                unit: item.unit || 'NOS',
                price: parseFloat(item.price) || 0
              },
              create: {
                inventoryItemId: inventoryItem.id,
                restaurantId: restId,
                date: new Date(date),
                quantity: parseFloat(item.qty) || 0,
                unit: item.unit || 'NOS',
                price: parseFloat(item.price) || 0
              }
            });
            synced++;
          }

          totalSynced += synced;
          results.push({ outlet: code, synced, total: response.closing_json.length });
        } else {
          results.push({ outlet: code, error: 'Failed to fetch stock from Petpooja', response });
        }
      } catch (err: any) {
        console.error(`Error syncing outlet ${code}:`, err.message);
        results.push({ outlet: code, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Synced ${totalSynced} stock items from ${codes.length} outlet(s)`,
      count: totalSynced,
      results
    });
  } catch (error: any) {
    console.error('Error syncing stock:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== Inventory Items =====

// Get all inventory items
router.get('/items', async (req: Request, res: Response) => {
  try {
    const { restaurantId, category, menuSharingCodes } = req.query;

    const where: any = { status: true };
    
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
    
    if (category) where.category = category as string;

    const items = await prisma.inventoryItem.findMany({
      where,
      include: { stockLevels: { take: 1, orderBy: { date: 'desc' } } },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create inventory item (manual)
router.post('/items', async (req: Request, res: Response) => {
  try {
    const { name, category, unit, sapCode, restaurantId } = req.body;

    if (!name || !restaurantId) {
      return res.status(400).json({ error: 'name and restaurantId are required' });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        category: category || 'General',
        unit: unit || 'NOS',
        sapCode,
        restaurantId: parseInt(restaurantId),
        status: true
      }
    });

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== Sync from Raw Material API =====
router.post('/sync-raw-materials', async (req: Request, res: Response) => {
  try {
    const { menuSharingCode, restaurantId } = req.body;

    if (!menuSharingCode || !restaurantId) {
      return res.status(400).json({ error: 'menuSharingCode and restaurantId are required' });
    }

    // Note: Raw Material API is not implemented in petpooja-client yet
    // This is a placeholder for future implementation
    
    res.json({
      success: true,
      message: 'Raw material sync endpoint - implement with Raw Material API',
      note: 'Raw Material API not yet implemented in petpooja-client'
    });
  } catch (error: any) {
    console.error('Error syncing raw materials:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
