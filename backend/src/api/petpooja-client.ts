// src/api/petpooja-client.ts - Petpooja Inventory API Client
// Based on syntax.md - All 14+ APIs implemented

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ===== CORE CREDENTIALS (From syntax.md) =====
interface PetpoojaCreds {
    app_key: string;
    app_secret: string;
    access_token: string;
    menuSharingCode: string;
}

const DEFAULT_CREDS: PetpoojaCreds = {
    app_key: process.env.PETPOOJA_APP_KEY || 'rpvg7joamn421d3u0x5qhk9ze8sibtcw',
    app_secret: process.env.PETPOOJA_APP_SECRET || 'c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e',
    access_token: process.env.PETPOOJA_ACCESS_TOKEN || '7334c01be3a9677868cbf1402880340e79e1ea84',
    menuSharingCode: process.env.PETPOOJA_MENU_SHARING_CODE || 'uvhn3bim'
};

// ===== API CLIENT CLASS =====
export class PetpoojaClient {
    private client: AxiosInstance;
    private creds: PetpoojaCreds;

    constructor(menuSharingCode?: string) {
        this.creds = {
            ...DEFAULT_CREDS,
            menuSharingCode: menuSharingCode || DEFAULT_CREDS.menuSharingCode
        };

        this.client = axios.create({
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // ===== HELPER: Build request body with credentials =====
    private buildBody(data: Record<string, any>): Record<string, any> {
        return {
            app_key: this.creds.app_key,
            app_secret: this.creds.app_secret,
            access_token: this.creds.access_token,
            menuSharingCode: this.creds.menuSharingCode,
            ...data
        };
    }

    // ===== HELPER: Make POST request =====
    private async post(url: string, data: Record<string, any>, config?: AxiosRequestConfig) {
        try {
            const response = await this.client.post(url, this.buildBody(data), config);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                console.error(`❌ API Error: ${url}`, {
                    status: error.response.status,
                    data: error.response.data
                });
            } else {
                console.error(`❌ Network Error: ${url}`, error.message);
            }
            throw error;
        }
    }

    // ===== PUSH APIS (Third-Party → Petpooja) =====

    // 1.1 Purchase API (syntax.md Section 1.1)
    async createPurchase(data: {
        id?: number; // For update
        updateStock: string;
        status: string;
        receiverType: string;
        invoiceDate: string; // YYYY-MM-DD
        invoiceNumber?: string;
        totalTax: string;
        totalDiscount: string;
        deliveryCharge: string;
        discountPer: string;
        enable_batch_wise_inventory?: string;
        itemDetails: Array<{
            itemName: string;
            qty: number;
            price: string;
            amount: string;
            discount: string;
            lblUnit: string;
            description: string;
            hsnCode: string;
            sapCode: string;
            tax1: string;
            tax2: string;
            tax3: string;
            tax4: string;
            tax1Amount: string;
            tax2Amount: string;
            tax3Amount: string;
            tax4Amount: string;
            actualQty?: string;
            batch_code?: string;
            expiryDate?: string;
        }>;
        total: string;
        roundoff: string;
        restDetails: {
            sender: { senderName: string; senderGst?: string };
            receiver: { receiverType: string; receiverName: string; receiverGst?: string };
        };
    }) {
        return this.post('https://inventory.petpooja.com/inventories/purchase_save_api', {
            Purchase: data
        });
    }

    // 1.2 Purchase Return API (syntax.md Section 1.2)
    async createPurchaseReturn(data: {
        id?: string; // For update
        updateStock: string;
        receiverType: string;
        invoiceDate: string;
        invoiceNumber?: string;
        itemDetails: Array<{
            itemName: string;
            qty: string;
            price: string;
            amount: string;
            discount: string;
            lblUnit: string;
            description: string;
            hsnCode: string;
            sapCode: string;
            tax1: string;
            tax2: string;
            tax3: string;
            tax4: string;
            tax1Amount: string;
            tax2Amount: string;
            tax3Amount: string;
            tax4Amount: string;
            actualQty?: string;
        }>;
        restDetails: {
            sender: { senderName: string; senderGst?: string };
            receiver: { receiverType: string; receiverName: string; receiverGst?: string };
        };
    }) {
        return this.post('https://inventory.petpooja.com/inventories/purchase_return_save_api', {
            Sale: data // Note: Uses "Sale" object
        });
    }

    // 1.3 Inventory Sales API (syntax.md Section 1.3)
    async createSale(data: {
        id?: number; // For update (number, not string)
        updateStock: string;
        receiverType: string;
        invoiceDate: string;
        invoiceNumber?: string;
        totalTax: number; // Note: Number, not string
        totalDiscount: number;
        deliveryCharge: number;
        discountPer: number;
        itemDetails: Array<{
            itemName: string;
            qty: number;
            price: string;
            amount: string;
            discount: string;
            lblUnit: string;
            description: string;
            hsnCode: string;
            sapCode: string;
            tax1: string;
            tax2: string;
            tax3: string;
            tax4: string;
            tax1Amount: string;
            tax2Amount: string;
            tax3Amount: string;
            tax4Amount: string;
        }>;
        total: string;
        roundoff: string;
        restDetails: any;
    }) {
        return this.post('https://inventory.petpooja.com/inventories/sale_save_api', {
            Sale: data
        });
    }

    // 1.4 Transfer API (syntax.md Section 1.4)
    async createTransfer(data: {
        id?: string; // For update (string)
        updateStock: string;
        receiverType: string;
        invoiceDate: string;
        challanNo?: string; // Note: challanNo, not invoiceNumber
        itemDetails: Array<{
            itemName: string;
            qty: number;
            price: string;
            amount: string;
            lblUnit: string;
            description: string;
            hsnCode: string;
            sapCode: string;
        }> | { // Can be object or array
            itemName: string;
            qty: number;
            price: string;
            amount: string;
            lblUnit: string;
            description: string;
            hsnCode: string;
            sapCode: string;
        };
        total: string;
        roundoff: string;
        restDetails: any;
    }) {
        return this.post('https://inventory.petpooja.com/inventories/transfer_save_api', {
            Sale: data
        });
    }

    // 1.5 Sales Return API (syntax.md Section 1.5)
    async createSalesReturn(data: {
        updateStock: string;
        status: string;
        receiverType: string;
        invoiceDate: string;
        invoiceNumber?: string;
        totalTax: string;
        totalDiscount: string;
        deliveryCharge: string;
        discountPer: string;
        itemDetails: Array<{
            itemName: string;
            qty: number;
            price: string;
            amount: string;
            discount: string;
            lblUnit: string;
            description: string;
            hsnCode: string;
            invoiceDate: string;
            sapCode: string;
            tax1: string;
            tax2: string;
            tax3: string;
            tax4: string;
            tax1Amount: string;
            tax2Amount: string;
            tax3Amount: string;
            tax4Amount: string;
            actualQty?: string;
        }>;
        total: string;
        roundoff: string;
        restDetails: any;
    }) {
        return this.post('https://inventory.petpooja.com/inventories/sale_return_save_api', {
            Purchase: data // Note: Uses "Purchase" object
        });
    }

    // 1.6 Raw Material API (syntax.md Section 1.6)
    async createRawMaterial(data: Array<{
        name: string;
        category: string;
        type: string; // "R" for Raw Material
        unit: string;
        consumptionUnit: string;
        conversionQty: string;
        description: string;
        status: string;
        hsnCode: string;
        gstPer: string;
        created: string;
        isExpiry: string;
        createdbyUsername: string;
        rawMaterialPurchaseUnit: Array<{
            unitName: string;
            isConsumptionUnit: string; // "1" = consumption, "0" = purchase
        }>;
    }>) {
        return this.post('https://api.petpooja.com/V1/thirdparty/rawmaterial_save_api/', {
            jsonData: data
        });
    }

    // ===== PULL APIS (Petpooja → Third-Party) =====

    // 2.1 Stock API (syntax.md Section 2.1)
    // Date format: YYYY-MM-DD (T-1 rule: request May 6 → get May 5 data)
    async getStock(date: string) {
        return this.post('https://api.petpooja.com/V1/thirdparty/get_stock_api/', {
            date
        });
    }

    // 2.2 Purchase Order API (Webhook - syntax.md Section 2.2)
    // Petpooja pushes to YOUR server: https://your-server/webhook/petpooja/purchase-order
    // This method validates incoming webhook data
    validatePurchaseOrderPayload(payload: any): boolean {
        return (
            payload.app_key === this.creds.app_key &&
            payload.menuSharingCode === this.creds.menuSharingCode
        );
    }

    // 2.3 Get Purchase API (syntax.md Section 2.3)
    // Date format: DD-MM-YYYY (e.g., "01-08-2024")
    // Pagination: 50 records per page, use refId for next page
    async getPurchases(fromDate: string, toDate: string, refId: string = '') {
        return this.post('https://api.petpooja.com/V1/thirdparty/get_purchase/', {
            from_date: fromDate,
            to_date: toDate,
            refId
        });
    }

    // 2.4 Get Sales API (syntax.md Section 2.4)
    // Date format: DD-MM-YYYY
    // sType: "sale" | "transfer" | "wastage" | "purchase return"
    async getSales(fromDate: string, toDate: string, sType: string = 'sale', refId: string = '') {
        return this.post('https://api.petpooja.com/V1/thirdparty/get_sales/', {
            from_date: fromDate,
            to_date: toDate,
            refId,
            sType
        });
    }

    // 2.5 Consumption API (syntax.md Section 2.5)
    // Date format: YYYY-MM-DD (T-1 rule)
    // Pagination: 50 records per page, use refId for next page
    async getConsumption(orderDate: string, refId: string = '') {
        return this.post('https://api.petpooja.com/V1/thirdparty/get_orders_api/', {
            order_date: orderDate,
            refId
        });
    }

    // ===== PAGINATION HELPER =====
    async fetchAllPages<T>(
        fetchFn: (refId: string) => Promise<{ data: { purchases?: T[]; sales?: T[]; order_json?: T[] } }>,
        initialState: { refId?: string } = {}
    ): Promise<T[]> {
        let allData: T[] = [];
        let refId = initialState.refId || '';
        let hasMore = true;

        while (hasMore) {
            const response = await fetchFn(refId);
            const data = response.data.purchases || response.data.sales || response.data.order_json || [];
            
            allData = [...allData, ...data];

            if (data.length < 50) {
                hasMore = false;
            } else {
                // Get last ID for next page
                const lastItem = data[data.length - 1];
                refId = (lastItem as any).purchase_id || (lastItem as any).sale_id || (lastItem as any).orderID;
            }
        }

        return allData;
    }
}

// Export singleton instance
export const petpoojaClient = new PetpoojaClient();
