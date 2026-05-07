// src/utils/sample-data.ts - Load sample API data for testing
import * as fs from 'fs';
import * as path from 'path';

const SAMPLE_DIR = 'C:\\Users\\U.C\\Desktop\\Projects\\ERP';

export interface SampleData {
    consumption: any;
    purchase: any;
    sales: any;
    stock: any;
    transfer: any;
}

export function loadSampleData(): SampleData {
    const consumption = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'sample_consumption.json'), 'utf-8'));
    const purchase = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'sample_purchase.json'), 'utf-8'));
    const sales = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'sample_sales.json'), 'utf-8'));
    const stock = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'sample_stock.json'), 'utf-8'));
    const transfer = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'sample_transfer.json'), 'utf-8'));
    
    return { consumption, purchase, sales, stock, transfer };
}

export function getSampleConsumption() {
    const data = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'sample_consumption.json'), 'utf-8'));
    return data;
}

export function getSamplePurchase() {
    const data = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'sample_purchase.json'), 'utf-8'));
    return data;
}

export function getSampleSales() {
    const data = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'sample_sales.json'), 'utf-8'));
    return data;
}

export function getSampleStock() {
    const data = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'sample_stock.json'), 'utf-8'));
    return data;
}

export function getSampleTransfer() {
    const data = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'sample_transfer.json'), 'utf-8'));
    return data;
}
