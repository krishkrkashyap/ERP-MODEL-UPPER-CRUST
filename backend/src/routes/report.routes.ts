// src/routes/report.routes.ts - All reporting endpoints
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ===== GET /api/reports - List all available reports =====
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 'sales-day-wise', category: 'Sales & Revenue', title: 'All Restaurant Report: Day Wise' },
      { id: 'all-restaurant-sales', category: 'Sales & Revenue', title: 'All Restaurant Sales Report' },
      { id: 'hourly-item-wise', category: 'Sales & Revenue', title: 'All Restaurants Sales: Hourly Item Wise' },
      { id: 'pax-biller-wise', category: 'Sales & Revenue', title: 'Pax Sales Report: Biller Wise' },
      { id: 'sub-order-wise', category: 'Sales & Revenue', title: 'Order Report: Sub-Order Wise' },
      { id: 'orders-master', category: 'Order Reports', title: 'Orders Master Report' },
      { id: 'order-item-wise', category: 'Order Reports', title: 'Order Report: Item Wise' },
      { id: 'cancel-order-item-wise', category: 'Order Reports', title: 'Cancel Order Report: Item Wise' },
      { id: 'cancel-all-restaurants', category: 'Order Reports', title: 'Cancel Order Report: All Restaurants' },
      { id: 'online-order-report', category: 'Order Reports', title: 'Online Order Report' },
      { id: 'discounted-orders', category: 'Discounts', title: 'Discounted Orders (With Reason)' },
      { id: 'discount-report', category: 'Discounts', title: 'Discount Report' },
      { id: 'item-invoice-details', category: 'Item Reports', title: 'Item Report: Invoice Details' },
      { id: 'item-wise-all', category: 'Item Reports', title: 'Item Wise Report: All Restaurants' },
      { id: 'item-wise-brand', category: 'Item Reports', title: 'Item Wise Report (Brand wise)' },
      { id: 'category-wise', category: 'Item Reports', title: 'Category Wise Report' },
      { id: 'tag-wise', category: 'Item Reports', title: 'Tag Wise Report' },
      { id: 'outlet-item-row', category: 'Outlet Reports', title: 'Outlet-Item Wise Report (Row)' },
      { id: 'outlet-item-column', category: 'Outlet Reports', title: 'Outlet-Item Wise Report (Column)' },
      { id: 'locality-wise', category: 'Outlet Reports', title: 'Locality Wise Report' },
      { id: 'corporate-customers', category: 'Customer Reports', title: 'Order Summary: Corporate Customers' },
      { id: 'platform-summary', category: 'Sales & Revenue', title: 'Sales by Platform Summary' },
      { id: 'invoice-all', category: 'Invoice Reports', title: 'Invoice Report: All Restaurants' },
    ]
  });
});

// ===== GET /api/reports/filters/* - Filter data endpoints =====
// NOTE: These must come BEFORE the /:type catch-all route

// GET /api/reports/filters/restaurants - restaurant list for filter dropdowns
router.get('/filters/restaurants', async (req: Request, res: Response) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true, petpoojaRestId: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: restaurants });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/filters/categories - distinct category names from order items
router.get('/filters/categories', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';
    const restaurantId = req.query.restaurantId ? parseInt(req.query.restaurantId as string) : undefined;
    const menuSharingCodes = req.query.menuSharingCodes as string || '';
    
    // Handle multiple menuSharingCodes
    let restaurantIds: number[] = [];
    if (menuSharingCodes) {
      const codes = menuSharingCodes.split(',');
      const restaurants = await prisma.restaurant.findMany({
        where: { petpoojaRestId: { in: codes } }
      });
      restaurantIds = restaurants.map(r => r.id);
    } else if (restaurantId) {
      restaurantIds = [restaurantId];
    }
    
    const where: any = { categoryName: { not: null } };
    if (restaurantIds.length > 0) where.order = { restaurantId: { in: restaurantIds } };
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59.999Z');
      where.order = { ...(where.order || {}), createdOn: dateFilter };
    }
    const result = await prisma.orderItem.findMany({
      where,
      select: { categoryName: true },
      distinct: ['categoryName'],
      orderBy: { categoryName: 'asc' }
    });
    res.json({ success: true, data: result.map(r => r.categoryName).filter(Boolean) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/filters/items - distinct item names from order items
router.get('/filters/items', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';
    const restaurantId = req.query.restaurantId ? parseInt(req.query.restaurantId as string) : undefined;
    const menuSharingCodes = req.query.menuSharingCodes as string || '';
    
    // Handle multiple menuSharingCodes
    let restaurantIds: number[] = [];
    if (menuSharingCodes) {
      const codes = menuSharingCodes.split(',');
      const restaurants = await prisma.restaurant.findMany({
        where: { petpoojaRestId: { in: codes } }
      });
      restaurantIds = restaurants.map(r => r.id);
    } else if (restaurantId) {
      restaurantIds = [restaurantId];
    }
    
    const where: any = { name: { not: null } };
    if (restaurantIds.length > 0) where.order = { restaurantId: { in: restaurantIds } };
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59.999Z');
      where.order = { ...(where.order || {}), createdOn: dateFilter };
    }
    const result = await prisma.orderItem.findMany({
      where,
      select: { name: true },
      distinct: ['name'],
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: result.map(r => r.name).filter(Boolean) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/filters/statuses - order status options
router.get('/filters/statuses', (_req: Request, res: Response) => {
  res.json({ success: true, data: ['Success', 'Cancelled'] });
});

// GET /api/reports/filters/payment-types - distinct payment types
router.get('/filters/payment-types', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';
    const restaurantId = req.query.restaurantId ? parseInt(req.query.restaurantId as string) : undefined;
    const menuSharingCodes = req.query.menuSharingCodes as string || '';
    
    // Handle multiple menuSharingCodes
    let restaurantIds: number[] = [];
    if (menuSharingCodes) {
      const codes = menuSharingCodes.split(',');
      const restaurants = await prisma.restaurant.findMany({
        where: { petpoojaRestId: { in: codes } }
      });
      restaurantIds = restaurants.map(r => r.id);
    } else if (restaurantId) {
      restaurantIds = [restaurantId];
    }
    
    const where: any = { paymentType: { not: null } };
    if (restaurantIds.length > 0) where.restaurantId = { in: restaurantIds };
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59.999Z');
      where.createdOn = dateFilter;
    }
    const result = await prisma.order.findMany({
      where,
      select: { paymentType: true },
      distinct: ['paymentType'],
      orderBy: { paymentType: 'asc' }
    });
    res.json({ success: true, data: result.map(r => r.paymentType).filter(Boolean) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/filters/platforms - distinct online order platforms
router.get('/filters/platforms', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';
    const restaurantId = req.query.restaurantId ? parseInt(req.query.restaurantId as string) : undefined;
    const menuSharingCodes = req.query.menuSharingCodes as string || '';
    
    // Handle multiple menuSharingCodes
    let restaurantIds: number[] = [];
    if (menuSharingCodes) {
      const codes = menuSharingCodes.split(',');
      const restaurants = await prisma.restaurant.findMany({
        where: { petpoojaRestId: { in: codes } }
      });
      restaurantIds = restaurants.map(r => r.id);
    } else if (restaurantId) {
      restaurantIds = [restaurantId];
    }
    
    const where: any = { orderFrom: { not: null } };
    if (restaurantIds.length > 0) where.restaurantId = { in: restaurantIds };
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59.999Z');
      where.createdOn = dateFilter;
    }
    const result = await prisma.order.findMany({
      where,
      select: { orderFrom: true },
      distinct: ['orderFrom'],
      orderBy: { orderFrom: 'asc' }
    });
    res.json({ success: true, data: result.map(r => r.orderFrom).filter(Boolean) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GET /api/reports/:type - Execute a specific report =====
router.get('/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';
    const restaurantId = req.query.restaurantId ? parseInt(req.query.restaurantId as string) : undefined;
    const menuSharingCodes = req.query.menuSharingCodes as string || '';
    const statusFilter = (req.query.status as string) || '';
    const paymentTypeFilter = (req.query.paymentType as string) || '';
    const platformFilter = (req.query.platform as string) || '';

    // Handle multiple menuSharingCodes
    let restaurantIds: number[] = [];
    if (menuSharingCodes) {
      const codes = menuSharingCodes.split(',');
      const restaurants = await prisma.restaurant.findMany({
        where: { petpoojaRestId: { in: codes } }
      });
      restaurantIds = restaurants.map(r => r.id);
    } else if (restaurantId) {
      restaurantIds = [restaurantId];
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate + 'T00:00:00.000Z');
    if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59.999Z');

    const whereDate: any = {};
    if (startDate || endDate) whereDate.createdOn = dateFilter;
    if (restaurantIds.length > 0) whereDate.restaurantId = { in: restaurantIds };
    if (statusFilter) whereDate.status = statusFilter;
    if (paymentTypeFilter) whereDate.paymentType = paymentTypeFilter;
    if (platformFilter) whereDate.orderFrom = platformFilter;

    const whereItemDate: any = {};
    if (startDate || endDate) whereItemDate.order = { createdOn: dateFilter };
    if (restaurantIds.length > 0) whereItemDate.order = { ...whereItemDate.order, restaurantId: { in: restaurantIds } };
    if (statusFilter) whereItemDate.order = { ...whereItemDate.order, status: statusFilter };
    if (paymentTypeFilter) whereItemDate.order = { ...whereItemDate.order, paymentType: paymentTypeFilter };
    if (platformFilter) whereItemDate.order = { ...whereItemDate.order, orderFrom: platformFilter };

    const whereOrderForItems: any = {};
    if (startDate || endDate) whereOrderForItems.createdOn = dateFilter;
    if (restaurantIds.length > 0) whereOrderForItems.restaurantId = { in: restaurantIds };
    if (statusFilter) whereOrderForItems.status = statusFilter;
    if (paymentTypeFilter) whereOrderForItems.paymentType = paymentTypeFilter;
    if (platformFilter) whereOrderForItems.orderFrom = platformFilter;

    let result: any;

    switch (type) {

      // ===== SALES & REVENUE =====
      case 'sales-day-wise': {
        const orders = await prisma.order.findMany({
          where: { ...whereOrderForItems, status: 'Success' },
          select: { id: true, total: true, createdOn: true, orderType: true, restaurantId: true }
        });
        const dayMap = new Map<string, { count: number; total: number; types: Set<string> }>();
        for (const o of orders) {
          const day = o.createdOn ? new Date(o.createdOn).toISOString().split('T')[0] : 'Unknown';
          const entry = dayMap.get(day) || { count: 0, total: 0, types: new Set<string>() };
          entry.count++;
          entry.total += Number(o.total);
          if (o.orderType) entry.types.add(o.orderType);
          dayMap.set(day, entry);
        }
        result = Array.from(dayMap.entries())
          .map(([day, data]) => ({ day, ...data, types: Array.from(data.types) }))
          .sort((a, b) => a.day.localeCompare(b.day));
        break;
      }

      case 'all-restaurant-sales': {
        const orders = await prisma.order.findMany({
          where: { ...whereOrderForItems, status: 'Success' },
          include: { restaurant: { select: { name: true, petpoojaRestId: true } } },
          orderBy: { createdOn: 'desc' }
        });
        result = orders.map(o => ({
          id: o.id,
          orderId: o.petpoojaOrderId,
          restaurant: o.restaurant?.name || 'Unknown',
          date: o.createdOn,
          type: o.orderType,
          payment: o.paymentType,
          total: Number(o.total),
          status: o.status,
        }));
        break;
      }

      case 'hourly-item-wise': {
        const items = await prisma.orderItem.findMany({
          where: whereItemDate,
          include: { order: { select: { createdOn: true, restaurantId: true } } }
        });
        const hourMap = new Map<string, { count: number; total: number; items: number }>();
        for (const item of items) {
          if (!item.order.createdOn) continue;
          const hour = new Date(item.order.createdOn).getHours().toString().padStart(2, '0') + ':00';
          const entry = hourMap.get(hour) || { count: 0, total: 0, items: 0 };
          entry.count++;
          entry.total += Number(item.total);
          entry.items += item.quantity;
          hourMap.set(hour, entry);
        }
        result = Array.from(hourMap.entries())
          .map(([hour, data]) => ({ hour, ...data }))
          .sort((a, b) => a.hour.localeCompare(b.hour));
        break;
      }

      case 'pax-biller-wise': {
        const orders = await prisma.order.findMany({
          where: { ...whereOrderForItems, status: 'Success', biller: { not: null } },
          select: { biller: true, total: true, id: true }
        });
        const billerMap = new Map<string, { count: number; total: number }>();
        for (const o of orders) {
          const name = o.biller || 'Unknown';
          const entry = billerMap.get(name) || { count: 0, total: 0 };
          entry.count++;
          entry.total += Number(o.total);
          billerMap.set(name, entry);
        }
        result = Array.from(billerMap.entries())
          .map(([biller, data]) => ({ biller, ...data }))
          .sort((a, b) => b.total - a.total);
        break;
      }

      case 'sub-order-wise': {
        const orders = await prisma.order.findMany({
          where: { ...whereOrderForItems },
          select: { subOrderType: true, total: true, id: true, status: true }
        });
        const typeMap = new Map<string, { count: number; total: number; cancelled: number }>();
        for (const o of orders) {
          const type = o.subOrderType || 'Regular';
          const entry = typeMap.get(type) || { count: 0, total: 0, cancelled: 0 };
          entry.count++;
          entry.total += Number(o.total);
          if (o.status === 'Cancelled') entry.cancelled++;
          typeMap.set(type, entry);
        }
        result = Array.from(typeMap.entries())
          .map(([type, data]) => ({ type, ...data }))
          .sort((a, b) => b.total - a.total);
        break;
      }

      // ===== ORDER REPORTS =====
      case 'orders-master': {
        const orders = await prisma.order.findMany({
          where: whereOrderForItems,
          include: {
            restaurant: { select: { name: true } },
            customer: { select: { name: true, phone: true, gstin: true } },
            orderItems: { select: { name: true, quantity: true, total: true } },
            taxes: { select: { title: true, amount: true } },
            discounts: { select: { title: true, amount: true } },
          },
          orderBy: { createdOn: 'desc' }
        });
        result = orders.map(o => ({
          id: o.id,
          orderId: o.petpoojaOrderId,
          restaurant: o.restaurant?.name,
          customer: o.customer?.name || 'Walk-in',
          phone: o.customer?.phone,
          gstin: o.customer?.gstin,
          date: o.createdOn,
          type: o.orderType,
          status: o.status,
          items: o.orderItems.length,
          subtotal: Number(o.coreTotal),
          discount: Number(o.discountTotal),
          tax: Number(o.taxTotal),
          total: Number(o.total),
          payment: o.paymentType,
        }));
        break;
      }

      case 'order-item-wise': {
        const items = await prisma.orderItem.findMany({
          where: whereItemDate,
          include: {
            order: {
              select: {
                petpoojaOrderId: true, createdOn: true, status: true,
                restaurant: { select: { name: true } },
                customer: { select: { name: true, phone: true } }
              }
            }
          },
          orderBy: { order: { createdOn: 'desc' } }
        });
        result = items.map(i => ({
          orderId: i.order.petpoojaOrderId,
          date: i.order.createdOn,
          restaurant: i.order.restaurant?.name,
          customer: i.order.customer?.name || 'Walk-in',
          phone: i.order.customer?.phone,
          item: i.name,
          category: i.categoryName,
          qty: i.quantity,
          price: Number(i.price),
          total: Number(i.total),
          status: i.order.status,
        }));
        break;
      }

      case 'cancel-order-item-wise':
      case 'cancel-all-restaurants': {
        const cancelled = await prisma.order.findMany({
          where: { ...whereOrderForItems, status: 'Cancelled' },
          include: {
            restaurant: { select: { name: true } },
            customer: { select: { name: true, phone: true } },
            orderItems: { select: { name: true, quantity: true, total: true, price: true } },
          },
          orderBy: { createdOn: 'desc' }
        });
        if (type === 'cancel-order-item-wise') {
          // Item-wise breakdown
          const items: any[] = [];
          for (const o of cancelled) {
            for (const i of o.orderItems) {
              items.push({
                orderId: o.petpoojaOrderId,
                date: o.createdOn,
                restaurant: o.restaurant?.name,
                customer: o.customer?.name || 'Walk-in',
                phone: o.customer?.phone,
                item: i.name,
                qty: i.quantity,
                price: Number(i.price),
                total: Number(i.total),
              });
            }
          }
          result = items;
        } else {
          // Summary by restaurant
          result = cancelled.map(o => ({
            orderId: o.petpoojaOrderId,
            date: o.createdOn,
            restaurant: o.restaurant?.name,
            customer: o.customer?.name || 'Walk-in',
            total: Number(o.total),
            items: o.orderItems.length,
          }));
        }
        break;
      }

      case 'online-order-report': {
        const orders = await prisma.order.findMany({
          where: { ...whereOrderForItems, orderFrom: { not: null } },
          include: { restaurant: { select: { name: true } } },
          orderBy: { createdOn: 'desc' }
        });
        result = orders.map(o => ({
          orderId: o.petpoojaOrderId,
          date: o.createdOn,
          restaurant: o.restaurant?.name,
          platform: o.orderFrom,
          type: o.orderType,
          total: Number(o.total),
          status: o.status,
        }));
        break;
      }

      // ===== DISCOUNTS =====
      case 'discounted-orders': {
        const ordersWithDiscounts = await prisma.orderDiscount.findMany({
          where: { order: { ...whereOrderForItems } },
          include: {
            order: {
              include: {
                restaurant: { select: { name: true } },
                customer: { select: { name: true, phone: true } },
              }
            }
          },
          orderBy: { order: { createdOn: 'desc' } }
        });
        result = ordersWithDiscounts.map(d => ({
          orderId: d.order.petpoojaOrderId,
          date: d.order.createdOn,
          restaurant: d.order.restaurant?.name,
          customer: d.order.customer?.name || 'Walk-in',
          discountTitle: d.title,
          discountType: d.type === 'P' ? `${Number(d.rate)}%` : `₹${Number(d.rate)}`,
          discountAmount: Number(d.amount),
          orderTotal: Number(d.order.total),
        }));
        break;
      }

      case 'discount-report': {
        const allDiscounts = await prisma.orderDiscount.groupBy({
          by: ['title', 'type'],
          _count: { id: true },
          _sum: { amount: true },
        });
        result = allDiscounts.map(d => ({
          title: d.title || 'Unknown',
          type: d.type === 'P' ? 'Percentage' : 'Flat',
          count: d._count.id,
          totalAmount: Number(d._sum.amount || 0),
        })).sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      }

      // ===== ITEM REPORTS =====
      case 'item-invoice-details':
      case 'category-wise': {
        const items = await prisma.orderItem.findMany({
          where: whereItemDate,
          include: { order: { select: { petpoojaOrderId: true, createdOn: true, restaurantId: true } } }
        });
        const groupField = type === 'category-wise' ? 'categoryName' : 'categoryName';
        const groupMap = new Map<string, { count: number; qty: number; total: number }>();
        for (const i of items) {
          const group = i.categoryName || 'Uncategorized';
          const entry = groupMap.get(group) || { count: 0, qty: 0, total: 0 };
          entry.count++;
          entry.qty += i.quantity;
          entry.total += Number(i.total);
          groupMap.set(group, entry);
        }
        result = Array.from(groupMap.entries())
          .map(([group, data]) => ({ category: group, ...data }))
          .sort((a, b) => b.total - a.total);
        break;
      }

      case 'item-wise-all':
      case 'item-wise-brand': {
        const items = await prisma.orderItem.findMany({
          where: whereItemDate,
          include: { order: { select: { createdOn: true, restaurantId: true } } }
        });
        const itemMap = new Map<string, { count: number; qty: number; total: number; sapCode?: string }>();
        for (const i of items) {
          const name = i.name || 'Unknown Item';
          const entry = itemMap.get(name) || { count: 0, qty: 0, total: 0 };
          entry.count++;
          entry.qty += i.quantity;
          entry.total += Number(i.total);
          if (i.sapCode) entry.sapCode = i.sapCode;
          itemMap.set(name, entry);
        }
        result = Array.from(itemMap.entries())
          .map(([item, data]) => ({ item, ...data }))
          .sort((a, b) => b.total - a.total);
        break;
      }

      case 'tag-wise': {
        const orders = await prisma.order.findMany({
          where: { ...whereOrderForItems, groupNames: { not: null } },
          select: { groupNames: true, total: true, id: true }
        });
        const tagMap = new Map<string, { count: number; total: number }>();
        for (const o of orders) {
          const tags = (o.groupNames || '').split(',').map(t => t.trim()).filter(Boolean);
          for (const tag of tags) {
            const entry = tagMap.get(tag) || { count: 0, total: 0 };
            entry.count++;
            entry.total += Number(o.total);
            tagMap.set(tag, entry);
          }
        }
        result = Array.from(tagMap.entries())
          .map(([tag, data]) => ({ tag, ...data }))
          .sort((a, b) => b.total - a.total);
        break;
      }

      // ===== OUTLET REPORTS =====
      case 'outlet-item-row':
      case 'outlet-item-column': {
        const items = await prisma.orderItem.findMany({
          where: whereItemDate,
          include: { order: { include: { restaurant: { select: { name: true } } } } }
        });
        const outletMap = new Map<string, Map<string, { qty: number; total: number }>>();
        for (const i of items) {
          const outlet = i.order.restaurant?.name || 'Unknown';
          const itemName = i.name || 'Unknown';
          if (!outletMap.has(outlet)) outletMap.set(outlet, new Map());
          const itemMap = outletMap.get(outlet)!;
          const entry = itemMap.get(itemName) || { qty: 0, total: 0 };
          entry.qty += i.quantity;
          entry.total += Number(i.total);
          itemMap.set(itemName, entry);
        }
        result = Array.from(outletMap.entries()).map(([outlet, items]) => ({
          outlet,
          items: Array.from(items.entries()).map(([item, data]) => ({ item, ...data }))
        }));
        break;
      }

      case 'locality-wise': {
        const orders = await prisma.order.findMany({
          where: { ...whereOrderForItems, address: { not: null } },
          include: { restaurant: { select: { name: true, address: true } } },
        });
        const localityMap = new Map<string, { count: number; total: number; restaurants: Set<string> }>();
        for (const o of orders) {
          const locality = o.address || o.restaurant?.address || 'Unknown';
          const entry = localityMap.get(locality) || { count: 0, total: 0, restaurants: new Set<string>() };
          entry.count++;
          entry.total += Number(o.total);
          if (o.restaurant?.name) entry.restaurants.add(o.restaurant.name);
          localityMap.set(locality, entry);
        }
        result = Array.from(localityMap.entries())
          .map(([locality, data]) => ({ locality, ...data, restaurants: Array.from(data.restaurants) }))
          .sort((a, b) => b.total - a.total);
        break;
      }

      // ===== CUSTOMER REPORTS =====
      case 'corporate-customers': {
        const customers = await prisma.customer.findMany({
          where: { gstin: { not: null }, restaurantId },
          include: {
            orders: {
              where: startDate || endDate ? { createdOn: dateFilter } : {},
              select: { id: true, petpoojaOrderId: true, total: true, createdOn: true, status: true }
            }
          },
          orderBy: { name: 'asc' }
        });
        result = customers.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          gstin: c.gstin,
          address: c.address,
          orders: c.orders.length,
          totalSpent: Number(c.orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)),
          recentOrders: c.orders.slice(0, 5).map(o => ({
            orderId: o.petpoojaOrderId,
            date: o.createdOn,
            total: Number(o.total),
            status: o.status,
          }))
        }));
        break;
      }

      // ===== PLATFORM SUMMARY =====
      case 'platform-summary': {
        const orders = await prisma.order.findMany({
          where: { ...whereOrderForItems },
          select: { orderFrom: true, total: true, id: true, status: true }
        });
        const platformMap = new Map<string, { count: number; total: number; success: number; cancelled: number }>();
        for (const o of orders) {
          const platform = o.orderFrom || 'Walk-in';
          const entry = platformMap.get(platform) || { count: 0, total: 0, success: 0, cancelled: 0 };
          entry.count++;
          entry.total += Number(o.total);
          if (o.status === 'Success') entry.success++; else entry.cancelled++;
          platformMap.set(platform, entry);
        }
        result = Array.from(platformMap.entries())
          .map(([platform, data]) => ({ platform, ...data }))
          .sort((a, b) => b.total - a.total);
        break;
      }

      // ===== INVOICE REPORTS =====
      case 'invoice-all': {
        const orders = await prisma.order.findMany({
          where: whereOrderForItems,
          include: {
            restaurant: { select: { name: true } },
            _count: { select: { orderItems: true } },
          },
          orderBy: { createdOn: 'desc' }
        });
        result = orders.map(o => ({
          invoiceNo: o.petpoojaOrderId,
          date: o.createdOn,
          restaurant: o.restaurant?.name,
          customer: o.customerId ? 'Existing' : 'Walk-in',
          items: o._count?.orderItems || 0,
          subtotal: Number(o.coreTotal),
          discount: Number(o.discountTotal),
          tax: Number(o.taxTotal),
          total: Number(o.total),
          status: o.status,
        }));
        break;
      }

      default:
        return res.status(404).json({ success: false, error: `Report type '${type}' not found` });
    }

    // Add summary
    const summary = Array.isArray(result) ? {
      count: result.length,
      total: result.reduce((sum: number, r: any) => sum + (Number(r.total) || 0), 0),
    } : { count: 0, total: 0 };

    res.json({ success: true, data: result, summary });

  } catch (error: any) {
    console.error(`Error executing report ${req.params.type}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
