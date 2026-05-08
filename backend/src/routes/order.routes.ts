// src/routes/order.routes.ts - Order management routes
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PetpoojaClient } from '../api/petpooja-client';

const router = Router();
const prisma = new PrismaClient();

// Helper to get client with correct menuSharingCode
function getPetpoojaClient(menuSharingCode?: string): PetpoojaClient {
  return new PetpoojaClient(menuSharingCode);
}

// Get all orders with pagination and filters
router.get('/', async (req: Request, res: Response) => {
    try {
        const { 
            restaurantId, 
            status, 
            startDate, 
            endDate,
            date,
            menuSharingCodes,
            search,
            paymentType,
            page = '1', 
            limit = '10' 
        } = req.query;

        const where: any = {};
        const andConditions: any[] = [];

        // Handle multiple menuSharingCodes
        if (menuSharingCodes) {
            const codes = (menuSharingCodes as string).split(',');
            const restaurants = await prisma.restaurant.findMany({
                where: { petpoojaRestId: { in: codes } }
            });
            if (restaurants.length > 0) {
                andConditions.push({ restaurantId: { in: restaurants.map(r => r.id) } });
            }
        } else if (restaurantId) {
            andConditions.push({ restaurantId: parseInt(restaurantId as string) });
        }

        if (status) andConditions.push({ status: status as string });
        if (paymentType) andConditions.push({ paymentType: paymentType as string });
        
        if (date) {
            const dayStart = new Date(date as string);
            const dayEnd = new Date(date as string);
            dayEnd.setHours(23, 59, 59, 999);
            andConditions.push({ createdOn: { gte: dayStart, lte: dayEnd } });
        } else if (startDate && endDate) {
            const endDateTime = new Date(endDate as string);
            endDateTime.setHours(23, 59, 59, 999);
            andConditions.push({
                createdOn: {
                    gte: new Date(startDate as string),
                    lte: endDateTime
                }
            });
        }

        if (search) {
            const searchStr = search as string;
            andConditions.push({
                OR: [
                    { petpoojaOrderId: { contains: searchStr, mode: 'insensitive' } },
                    { customer: { name: { contains: searchStr, mode: 'insensitive' } } },
                    { customer: { phone: { contains: searchStr } } },
                    { orderItems: { some: { name: { contains: searchStr, mode: 'insensitive' } } } },
                ]
            });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    customer: true,
                    orderItems: true,
                    restaurant: true,
                    taxes: true,
                    discounts: true
                },
                orderBy: { createdOn: 'desc' },
                skip: (parseInt(page as string) - 1) * parseInt(limit as string),
                take: parseInt(limit as string)
            }),
            prisma.order.count({ where })
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
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get order by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: {
                customer: true,
                orderItems: true,
                restaurant: true,
                taxes: true,
                discounts: true
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error: any) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Sync orders from Petpooja (Consumption API) - Live API
router.post('/sync', async (req: Request, res: Response) => {
    try {
        const { orderDate, restaurantId, menuSharingCodes } = req.body;

        if (!orderDate) {
            return res.status(400).json({ error: 'orderDate is required (YYYY-MM-DD)' });
        }

        // Handle multiple menuSharingCodes
        const codes = Array.isArray(menuSharingCodes) ? menuSharingCodes : 
                      (menuSharingCodes ? [menuSharingCodes] : ['uvhn3bim']);
        
        console.log(`🔄 Syncing orders for date: ${orderDate}, outlets: ${codes.join(', ')} (live API)`);

        let totalSynced = 0;
        const results: any[] = [];

        // Loop through each outlet
        for (const code of codes) {
            try {
                // Get client with correct menuSharingCode
                const client = getPetpoojaClient(code);

                // Call Petpooja Consumption API (syntax.md Section 2.5)
                const response = await client.getConsumption(orderDate);
                
                if (response.code === '200' && response.order_json) {
                    const orders = response.order_json;
                    let synced = 0;
                    const restId = restaurantId ? parseInt(restaurantId) : 1;

                    for (const orderData of orders) {
                        try {
                            // Upsert restaurant
                            const restaurant = await prisma.restaurant.upsert({
                                where: { petpoojaRestId: orderData.Restaurant.restID?.toString() || code },
                                update: { 
                                    name: orderData.Restaurant.res_name,
                                    address: orderData.Restaurant.address,
                                    contactInfo: orderData.Restaurant.contact_information,
                                    state: orderData.Restaurant.restaurant_state
                                },
                                create: {
                                    petpoojaRestId: orderData.Restaurant.restID?.toString() || code,
                                    name: orderData.Restaurant.res_name || 'UC - Vastrapur',
                                    address: orderData.Restaurant.address,
                                    contactInfo: orderData.Restaurant.contact_information,
                                    state: orderData.Restaurant.restaurant_state
                                }
                            });

                            // Upsert customer - use phone + restaurantId as unique identifier (per plan.md)
                            let customer = null;
                            if (orderData.Customer && orderData.Customer.phone) {
                                try {
                                    customer = await prisma.customer.upsert({
                                        where: { 
                                            restaurantId_phone: {
                                                restaurantId: restaurant.id,
                                                phone: orderData.Customer.phone
                                            }
                                        },
                                        update: {
                                            name: orderData.Customer.name || 'walk',
                                            address: orderData.Customer.address,
                                            gstin: orderData.Customer.gst_no,
                                            petpoojaCustomerId: orderData.Customer.refId?.toString() || null
                                        },
                                        create: {
                                            restaurantId: restaurant.id,
                                            petpoojaCustomerId: orderData.Customer.refId?.toString() || null,
                                            name: orderData.Customer.name || 'walk',
                                            address: orderData.Customer.address,
                                            phone: orderData.Customer.phone,
                                            gstin: orderData.Customer.gst_no
                                        }
                                    });
                                } catch (customerError: any) {
                                    console.error('Customer upsert error:', customerError.message);
                                    // Continue without customer if there's an error
                                }
                            }

                            // Upsert order
                            try {
                                const petpoojaOrderId = orderData.Order.orderID?.toString();
                                if (!petpoojaOrderId) {
                                    console.warn('Skipping order - missing orderID');
                                    continue;
                                }

                                const order = await prisma.order.upsert({
                                    where: { petpoojaOrderId },
                                    update: {
                                        orderType: orderData.Order.order_type,
                                        paymentType: orderData.Order.payment_type,
                                        orderFrom: orderData.Order.order_from,
                                        subOrderType: orderData.Order.sub_order_type,
                                        tableNo: orderData.Order.table_no,
                                        numberOfPersons: parseInt(orderData.Order.no_of_persons || '0'),
                                        deliveryCharges: parseFloat(orderData.Order.delivery_charges || '0'),
                                        containerCharges: parseFloat(orderData.Order.container_charges || '0'),
                                        discountTotal: parseFloat(orderData.Order.discount_total || '0'),
                                        taxTotal: parseFloat(orderData.Order.tax_total || '0'),
                                        coreTotal: parseFloat(orderData.Order.core_total || '0'),
                                        total: parseFloat(orderData.Order.total || '0'),
                                        status: orderData.Order.status,
                                        createdOn: new Date(orderData.Order.created_on),
                                        rawPayload: JSON.stringify(orderData)
                                    },
                                    create: {
                                        petpoojaOrderId,
                                        restaurantId: restaurant.id,
                                        customerId: customer?.id,
                                        orderType: orderData.Order.order_type,
                                        paymentType: orderData.Order.payment_type,
                                        orderFrom: orderData.Order.order_from,
                                        subOrderType: orderData.Order.sub_order_type,
                                        tableNo: orderData.Order.table_no,
                                        numberOfPersons: parseInt(orderData.Order.no_of_persons || '0'),
                                        deliveryCharges: parseFloat(orderData.Order.delivery_charges || '0'),
                                        containerCharges: parseFloat(orderData.Order.container_charges || '0'),
                                        discountTotal: parseFloat(orderData.Order.discount_total || '0'),
                                        taxTotal: parseFloat(orderData.Order.tax_total || '0'),
                                        coreTotal: parseFloat(orderData.Order.core_total || '0'),
                                        total: parseFloat(orderData.Order.total || '0'),
                                        status: orderData.Order.status,
                                        createdOn: new Date(orderData.Order.created_on),
                                        rawPayload: JSON.stringify(orderData)
                                    }
                                });

                                // Delete existing Order Items, Taxes, Discounts for this order
                                await Promise.all([
                                    prisma.orderItem.deleteMany({ where: { orderId: order.id } }),
                                    prisma.orderTax.deleteMany({ where: { orderId: order.id } }),
                                    prisma.orderDiscount.deleteMany({ where: { orderId: order.id } })
                                ]);

                                // Save Order Items from API (OrderItem array)
                                // API fields: name, itemcode, categoryname, quantity, price, total, itemsapcode
                                 // IMPORTANT: API uses "name" not "itemname", "quantity" not "qty", "itemsapcode" not "hsn_code"
                                 if (orderData.OrderItem && Array.isArray(orderData.OrderItem)) {
                                     for (const item of orderData.OrderItem) {
                                         try {
                                             await prisma.orderItem.create({
                                                 data: {
                                                     orderId: order.id,
                                                     petpoojaItemId: item.itemid?.toString() || null,
                                                     name: item.name || '',  // API: "name" (NOT "itemname")
                                                     itemCode: item.itemcode || null,  // API: "itemcode"
                                                     categoryId: item.categoryid || null,
                                                     categoryName: item.categoryname || null,  // API: "categoryname"
                                                     price: parseFloat(item.price || '0'),
                                                     quantity: parseInt(item.quantity || '0'),  // API: "quantity" (NOT "qty")
                                                     total: parseFloat(item.total || '0'),
                                                     sapCode: item.itemsapcode || null,  // API: "itemsapcode" (NOT "hsn_code")
                                                     addon: item.addon ? JSON.stringify(item.addon) : null
                                                 }
                                             });
                                        } catch (itemError: any) {
                                            console.error('OrderItem create error:', itemError.message);
                                        }
                                    }
                                }

                                // Save Taxes from API (Tax array)
                                // API fields: title, rate, amount, taxid (NOT tax_name, tax_percentage, tax_amount)
                                if (orderData.Tax && Array.isArray(orderData.Tax)) {
                                    for (const tax of orderData.Tax) {
                                        try {
                                            await prisma.orderTax.create({
                                                data: {
                                                    orderId: order.id,
                                                    title: tax.title || '',  // API: "title" (NOT "tax_name")
                                                    rate: parseFloat(tax.rate || '0'),  // API: "rate" (NOT "tax_percentage")
                                                    amount: parseFloat(tax.amount || '0')  // API: "amount" (NOT "tax_amount")
                                                }
                                            });
                                        } catch (taxError: any) {
                                            console.error('OrderTax create error:', taxError.message);
                                        }
                                    }
                                }

                                // Save Discounts from API (Discount array)
                                // API fields: title, type, rate, amount, discountid (NOT discount_name, discount_type, discount_amount)
                                if (orderData.Discount && Array.isArray(orderData.Discount)) {
                                    for (const discount of orderData.Discount) {
                                        try {
                                            await prisma.orderDiscount.create({
                                                data: {
                                                    orderId: order.id,
                                                    title: discount.title || '',  // API: "title" (NOT "discount_name")
                                                    rate: parseFloat(discount.rate || '0'),  // API: "rate" (NOT "discount_type")
                                                    amount: parseFloat(discount.amount || '0')  // API: "amount" (NOT "discount_amount")
                                                }
                                            });
                                        } catch (discountError: any) {
                                            console.error('OrderDiscount create error:', discountError.message);
                                        }
                                    }
                                }

                                synced++;
                            } catch (orderError: any) {
                                console.error('Order upsert error:', orderError.message);
                                // Continue with next order if there's an error
                            }
                        } catch (orderError: any) {
                            console.error('Order processing error:', orderError.message);
                            continue;
                        }
                    }

                    totalSynced += synced;
                    results.push({ outlet: code, synced, total: orders.length });
                } else {
                    results.push({ outlet: code, error: 'Failed to fetch from Petpooja', response });
                }
            } catch (err: any) {
                console.error(`Error syncing outlet ${code}:`, err.message);
                results.push({ outlet: code, error: err.message });
            }
        }

        res.json({
            success: true,
            message: `Synced ${totalSynced} orders from ${codes.length} outlet(s)`,
            results,
            totalSynced
        });
    } catch (error: any) {
        console.error('Error syncing orders:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
