# Petpooja Inventory API - Syntax Reference Guide

**Quick Reference for Developers**  
**Last Updated:** May 6, 2026  
**Project:** `C:\Users\U.C\Desktop\Projects\ERP`

---

## 📋 Quick Credentials Reference

```javascript
const CREDS = {
    app_key: "rpvg7joamn421d3u0x5qhk9ze8sibtcw",
    app_secret: "c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e",
    access_token: "7334c01be3a9677868cbf1402880340e79e1ea84",
    menuSharingCode: "uvhn3bim" // For ID: 340305
    // OR "t2jrg8ez" for ID: 340304
};
```

---

## 🚀 API Categories

### Push APIs (Third-Party → Petpooja)
*You send data to Petpooja to update their system*

### Pull APIs (Petpooja → Third-Party)
*You fetch data from Petpooja to sync to your ERP*

---

## 1. Push APIs (6 APIs)

### 1.1 Purchase API
**Purpose:** Push purchase invoices to Petpooja, add stock  
**Method:** `POST`  
**Endpoint:** `https://inventory.petpooja.com/inventories/purchase_save_api`

#### Request Syntax
```javascript
{
    "app_key": "rpvg7joamn421d3u0x5qhk9ze8sibtcw",
    "app_secret": "c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e",
    "access_token": "7334c01be3a9677868cbf1402880340e79e1ea84",
    "menuSharingCode": "uvhn3bim",
    "Purchase": {
        "id": 112853140,                // Optional: For update existing purchase
        "updateStock": "1",               // "1" = update stock
        "status": "1",                    // "1" = active
        "receiverType": "S/c",             // "S", "S/C", etc.
        "invoiceDate": "2026-02-26",       // YYYY-MM-DD format
        "invoiceNumber": "",               // Optional
        "totalTax": "0.00",
        "totalDiscount": "0",
        "deliveryCharge": "0",
        "discountPer": "0",
        "enable_batch_wise_inventory": "yes",  // Optional
        "itemDetails": [
            {
                "itemName": "Chilli Oil",
                "qty": 3.000,
                "price": "100.00",
                "amount": "300.00",
                "discount": "0.00",
                "lblUnit": "Btls",              // Unit: KG, GM, Btls, etc.
                "description": "SAP SALES",
                "hsnCode": "21050000",
                "sapCode": "FGIF71818",
                "tax1": "0.00",                // CGST
                "tax2": "0.00",                // SGST
                "tax3": "0.00",                // IGST
                "tax4": "0.00",                // CESS
                "tax1Amount": "0.00",
                "tax2Amount": "0.00",
                "tax3Amount": "0.00",
                "tax4Amount": "0.00",
                "actualQty": "3.000",
                "batch_code": "00016",           // Optional: for batch tracking
                "expiryDate": "2026-02-28"     // Optional: for expiry tracking
            }
        ],
        "total": "300.00",
        "roundoff": "0",
        "restDetails": {
            "sender": {
                "senderName": "Your Company Name"
            },
            "receiver": {
                "receiverType": "S/C",
                "receiverName": "Supplier Name"
            }
        }
    }
}
```

#### Response
```json
{
    "status": 1,
    "send_mail": false,
    "purchase_id": "127953809",
    "sap_group_master_id": 0,
    "message": "Purchase invoice saved successfully"
}
```

---

### 1.2 Purchase Return API
**Purpose:** Push purchase returns, reduce stock  
**Method:** `POST`  
**Endpoint:** `https://inventory.petpooja.com/inventories/purchase_return_save_api`

#### Request Syntax
```javascript
{
    "app_key": "...",
    "app_secret": "...",
    "access_token": "...",
    "menuSharingCode": "...",
    "Sale": {                          // Note: Uses "Sale" object, not "Purchase"
        "id": "100833830",            // Optional: For update
        "updateStock": "1",
        "receiverType": "S",
        "invoiceDate": "2025-11-28",
        "invoiceNumber": "",
        "itemDetails": [
            {
                "itemName": "Potato Vat",
                "qty": "2",                  // Note: String format
                "price": "196.25",
                "amount": "392.50",
                "discount": "0.00",
                "lblUnit": "KG",
                "description": "SAP SALES",
                "hsnCode": "21050000",
                "sapCode": "FGIHHP424",
                "tax1": "9.00",
                "tax2": "9.00",
                "tax3": "0.00",
                "tax4": "0.00",
                "tax1Amount": "35.33",
                "tax2Amount": "35.33",
                "tax3Amount": "0.00",
                "tax4Amount": "0.00",
                "actualQty": "1.000"
            }
        ],
        "restDetails": {
            "sender": {
                "senderName": "Your Company",
                "senderGst": ""           // Optional
            },
            "receiver": {
                "receiverType": "S",
                "receiverName": "Sale Supplier",
                "receiverGst": ""         // Optional
            }
        }
    }
}
```

---

### 1.3 Inventory Sales API
**Purpose:** Push sales invoices, reduce stock  
**Method:** `POST`  
**Endpoint:** `https://inventory.petpooja.com/inventories/sale_save_api`

#### Request Syntax
```javascript
{
    "app_key": "...",
    "app_secret": "...",
    "access_token": "...",
    "menuSharingCode": "...",
    "Sale": {
        "id": 100834023,                // Optional: For update (number, not string)
        "updateStock": "1",
        "receiverType": "S",
        "invoiceDate": "2025-11-28",
        "invoiceNumber": "",
        "totalTax": 0,                     // Note: Number, not string
        "totalDiscount": 0,
        "deliveryCharge": 20,
        "discountPer": 5,
        "itemDetails": [
            {
                "itemName": "Kiwi",
                "qty": 3.000,
                "price": "100.00",
                "amount": "300.00",
                "discount": "0.00",
                "lblUnit": "KG",
                "description": "SAP SALES",
                "hsnCode": "21050000",
                "sapCode": "FGIF71818",
                "tax1": "5.00",
                "tax2": "5.00",
                "tax3": "0.00",
                "tax4": "0.00",
                "tax1Amount": "14.5",
                "tax2Amount": "14.5",
                "tax3Amount": "0.00",
                "tax4Amount": "0.00"
            }
        ],
        "total": "300.00",
        "roundoff": "0",
        "restDetails": { ... }
    }
}
```

---

### 1.4 Transfer API
**Purpose:** Push internal transfers (no tax)  
**Method:** `POST`  
**Endpoint:** `https://inventory.petpooja.com/inventories/transfer_save_api`

#### Key Difference
- **NO TAX fields** (tax1, tax2, etc.)
- Uses `challanNo` instead of `invoiceNumber`
- Item details can be an **object** (single item) or **array** (multiple items)

#### Request Syntax
```javascript
{
    "app_key": "...",
    "app_secret": "...",
    "access_token": "...",
    "menuSharingCode": "...",
    "Sale": {
        "id": "100834524",              // String for update
        "updateStock": "1",
        "receiverType": "S",
        "invoiceDate": "2025-11-28",
        "challanNo": "",                // Note: challanNo, not invoiceNumber
        "itemDetails": [                // Can be object or array
            {
                "itemName": "Kiwi",
                "qty": 3.000,
                "price": "100.00",
                "amount": "300.00",
                "lblUnit": "KG",
                "description": "SAP SALES",
                "hsnCode": "21050000",
                "sapCode": "FGIF71818"
            }
        ],
        "total": "300.00",
        "roundoff": "0",
        "restDetails": { ... }
    }
}
```

---

### 1.5 Sales Return API
**Purpose:** Push sales returns, add stock  
**Method:** `POST`  
**Endpoint:** `https://inventory.petpooja.com/inventories/sale_return_save_api`

#### Request Syntax
```javascript
{
    "app_key": "...",
    "app_secret": "...",
    "access_token": "...",
    "menuSharingCode": "xxxx",       // Note: lowercase in sample
    "Purchase": {                     // Note: Uses "Purchase" object (not "Sale")
        "updateStock": "1",
        "status": "1",
        "receiverType": "S",
        "invoiceDate": "2025-12-17",
        "invoiceNumber": "",
        "totalTax": "0.00",
        "totalDiscount": "0",
        "deliveryCharge": "0",
        "discountPer": "0",
        "itemDetails": [ ... ],
        "total": "300.00",
        "roundoff": "0",
        "restDetails": { ... }
    }
}
```

---

### 1.6 Raw Material API
**Purpose:** Push new raw materials to master catalog  
**Method:** `POST`  
**Endpoint:** `https://api.petpooja.com/V1/thirdparty/rawmaterial_save_api/`

#### Request Syntax
```javascript
{
    "app_key": "...",
    "app_secret": "...",
    "access_token": "...",
    "menuSharingCode": "...",
    "jsonData": [                     // Array of raw materials
        {
            "name": "Curd 3000ml",
            "category": "bread",           // Category name
            "type": "R",                    // "R" = Raw Material
            "unit": "KG",                   // Purchase unit
            "consumptionUnit": "GM",        // Consumption unit
            "conversionQty": "1000",       // Conversion: 1 KG = 1000 GM
            "description": "Curd 100m2",
            "status": "1",                  // "1" = active
            "hsnCode": "20079910",
            "gstPer": "12.00",             // GST percentage
            "created": "2021-11-22 10:41:11",
            "isExpiry": "0",              // "0" = no expiry tracking
            "createdbyUsername": "harshitjoshi",
            "rawMaterialPurchaseUnit": [    // Unit definitions
                {
                    "unitName": "GM",
                    "isConsumptionUnit": "1"  // "1" = is consumption unit
                },
                {
                    "unitName": "KG",
                    "isConsumptionUnit": "0"  // "0" = is purchase unit
                }
            ]
        }
    ]
}
```

---

## 2. Pull APIs (5 APIs + 1 Webhook)

### 2.1 Stock API
**Purpose:** Get stock levels for a specific date  
**Method:** `POST`  
**Endpoint:** `https://api.petpooja.com/V1/thirdparty/get_stock_api/`  
**Date Format:** `YYYY-MM-DD`  
**T-1 Rule:** Request May 6 → Get May 5 data

#### Request Syntax
```javascript
{
    "app_key": "...",
    "app_secret": "...",
    "access_token": "...",
    "menuSharingCode": "...",
    "date": "2026-05-05"            // YYYY-MM-DD format
}
```

#### Response
```json
{
    "code": "200",
    "success": "1",
    "message": "",
    "closing_json": [
        {
            "name": "Curd 50ml",
            "price": "0",
            "unit": "ML",
            "qty": "0",
            "restaurant_id": null,
            "category": "",
            "sapcode": "FP1101003"
        }
    ]
}
```

---

### 2.2 Purchase Order API (Webhook)
**Purpose:** Receive POs in real-time when created in Petpooja  
**Method:** `POST` (Petpooja pushes to YOUR server)  
**Your Endpoint:** `https://your-server.com/webhook/petpooja/purchase-order`

#### Payload Petpooja Sends to You
```json
{
    "menuSharingCode": "xxxxx",
    "app_key": "rjf495xzemq07ut3nvsgbpcdhi8ao2y1",
    "access_token": "c63fad2df67de0171d278d497adbb0785b212c9c",
    "app_secret": "adc54ecc7411cbc5d4f700d1251ae73a1035ae79",
    "data": {
        "id": "46839231",
        "menuSharingCode": "***",
        "receiverType": "Supplier",
        "deliveryDate": "2026-03-18",
        "poNumber": "PO0046839231",
        "totalTax": "20",
        "total": "520",
        "roundOff": "0",
        "itemDetails": [
            {
                "itemname": "0 Number Candle Cl Per Pcs",
                "qty": 5,
                "price": 100,
                "amount": 500,
                "lbl_unit": "pcs",
                "hsn_code": "",
                "sap_code": "",
                "standard_qty": 0,
                "item_lock": 0,
                "category": "",
                "sub_category": "",
                "tax1": 0,
                "tax2": 0,
                "tax3": 0,
                "tax1_amount": "0.000",
                "tax2_amount": "0.000",
                "tax3_amount": "0.000",
                "tax4": 4,
                "tax4_amount": "20.000",
                "yield_qty": "0"
            }
        ],
        "chargeDetails": { ... },
        "restDetails": { ... },
        "status": "Active"
    }
}
```

#### Your Webhook Response
```json
{
    "success": true
}
```

---

### 2.3 Get Purchase API (Pull)
**Purpose:** Pull purchase invoices with date range  
**Method:** `POST`  
**Endpoint:** `https://api.petpooja.com/V1/thirdparty/get_purchase/`  
**Date Format:** `DD-MM-YYYY` (e.g., `01-08-2024`)  
**Pagination:** 50 records per page, use `refId` for next page

#### Request Syntax
```javascript
{
    "app_key": "...",
    "app_secret": "...",
    "access_token": "...",
    "menuSharingCode": "...",
    "from_date": "01-08-2024",      // DD-MM-YYYY format
    "to_date": "31-08-2024",       // DD-MM-YYYY format
    "refId": ""                      // Optional: For pagination
}
```

#### Response
```json
{
    "code": "200",
    "success": "1",
    "message": "",
    "restID": "XXXX",
    "purchases": [
        {
            "purchase_id": "120220659",
            "type": "Normal",
            "mrn_no": "57156620",
            "invoice_number": "inv323",
            "invoice_date": "2026-02-17",
            "total": "105",
            "paid_amount": "0",
            "action_status": "Active",
            "payment": "Unpaid",
            "gst_no": "",
            "sub_total": 100,
            "total_tax": "5",
            "total_discount": "0",
            "delivery charge": "0",
            "round_off_amount": "0",
            "created_on": "2026-02-17 11:35:17",
            "item_details": [ ... ],
            "restaurant_details": { ... }
        }
    ]
}
```

---

### 2.4 Get Sales API (Pull)
**Purpose:** Pull sales, transfers, wastage, returns  
**Method:** `POST`  
**Endpoint:** `https://api.petpooja.com/V1/thirdparty/get_sales/`  
**Date Format:** `DD-MM-YYYY`  
**Filter:** Use `sType` parameter

#### Request Syntax (Sales)
```javascript
{
    "app_key": "...",
    "app_secret": "...",
    "access_token": "...",
    "menuSharingCode": "...",
    "from_date": "01-08-2025",
    "to_date": "31-08-2025",
    "refId": "",                      // Pagination
    "sType": "sale"                  // "sale" | "transfer" | "wastage" | "purchase return"
}
```

#### sType Values
| Value | Description |
|-------|-------------|
| `sale` | Normal internal sales |
| `transfer` | Internal transfers |
| `wastage` | Wastage records |
| `purchase return` | Purchase returns |

#### Response (Transfer Example)
```json
{
    "code": "200",
    "success": "1",
    "sales": [
        {
            "sale_id": "106671352",
            "type": "Transfer",           // ← Type indicates what was fetched
            "mrn_no": "109",
            "invoice_number": "Acx008",
            "invoice_date": "2026-02-17",
            "total": "750",
            "total_tax": "0",        // Transfers have no tax
            "item_details": [ ... ]
        }
    ]
}
```

---

### 2.5 Consumption API (Pull - Order Data)
**Purpose:** Pull order data with customer, items, taxes (same as Get Orders API)  
**Method:** `POST`  
**Endpoint:** `https://api.petpooja.com/V1/thirdparty/get_orders_api/`  
**Date Format:** `YYYY-MM-DD`  
**T-1 Rule:** Request May 6 → Get May 5 data

#### Request Syntax
```javascript
{
    "app_key": "...",
    "app_secret": "...",
    "access_token": "...",
    "menuSharingCode": "...",
    "order_date": "2026-03-17",      // YYYY-MM-DD format
    "refId": ""                      // Pagination
}
```

#### Response
```json
{
    "code": "200",
    "success": "1",
    "order_json": [
        {
            "Restaurant": {
                "restaurantid": "12670",
                "res_name": "The Bucket List (Ahmedabad) Demo",
                "address": "...",
                "restaurant_state": "Maharashtra",
                "contact_information": "90999124880",
                "restID": "enhfbqyt"
            },
            "Customer": {
                "name": "",
                "address": "",
                "phone": "",
                "gst_no": "",
                "created_date": ""
            },
            "Order": {
                "orderID": "1641",
                "refId": "8005274069",
                "order_type": "Dine In",
                "payment_type": "Cash",
                "total": "945",
                "created_on": "2026-03-17 15:11:34",
                "status": "Success",
                "OrderItem": [ ... ]
            },
            "Tax": [ ... ],
            "Discount": [ ... ]
        }
    ]
}
```

---

## 3. Date Format Cheat Sheet

| API | Date Format | Example | T-1 Rule |
|-----|-------------|---------|----------|
| **Stock API** | `YYYY-MM-DD` | `2026-05-05` | ✅ Yes |
| **Consumption API** | `YYYY-MM-DD` | `2026-03-17` | ✅ Yes |
| **Get Purchase API** | `DD-MM-YYYY` | `01-08-2024` | ❌ No |
| **Get Sales API** | `DD-MM-YYYY` | `01-08-2025` | ❌ No |
| **Push APIs** | `YYYY-MM-DD` | `2026-02-26` | N/A |

⚠️ **Common Error:** Using wrong date format will return "Please provide valid date" error!

---

## 4. Pagination Pattern (All Pull APIs)

All pull APIs return **max 50 records** per request. Use `refId` or `refld` to fetch next page.

### Pattern
```javascript
async function fetchAllPages(fetchFn, initialState = {}) {
    let allData = [];
    let refId = initialState.refId || '';
    let hasMore = true;
    
    while (hasMore) {
        const response = await fetchFn(refId);
        const data = response.data.purchases || response.data.sales || response.data.order_json;
        
        allData = [...allData, ...data];
        
        if (data.length < 50) {
            hasMore = false;
        } else {
            // Get last ID for next page
            const lastItem = data[data.length - 1];
            refId = lastItem.purchase_id || lastItem.sale_id || lastItem.orderID;
        }
    }
    
    return allData;
}
```

---

## 5. Field Name Variations (Gotchas!)

### Different APIs use different field names for the same thing:

| Concept | Purchase API | Sales API | Get Sales API | Notes |
|---------|----------------|------------|-----------------|-------|
| Item Name | `itemName` | `itemName` | `itemname` | Case varies! |
| Unit | `lblUnit` | `lblUnit` | `lbl_unit` | Underscore! |
| Tax Amount | `tax1Amount` | `tax1Amount` | `tax1_amount` | Underscore! |
| Invoice Date | `invoiceDate` | `invoiceDate` | `invoice_date` | Underscore! |
| Receiver Type | `receiverType` | `receiverType` | `receiver_type` | Underscore! |

⚠️ **Tip:** Always check the specific API documentation for correct field names!

---

## 6. Cookie Headers (When Required)

Some APIs in the documentation show cookie headers. Use if you get authentication errors:

```javascript
headers: {
    'Content-Type': 'application/json',
    'Cookie': 'PETPOOJA_CO=4853nc4r0gu8c93pmr0bq18813; PETPOOJA_API=q852n72u1dc3g6jvlndk4orq30'
}
```

**Note:** Your actual cookie values may differ from the samples. Check with Petpooja support.

---

## 7. cURL Quick Copy-Paste

### Test Stock API
```bash
curl --location 'https://api.petpooja.com/V1/thirdparty/get_stock_api/' \
--header 'Content-Type: application/json' \
--data '{
    "app_key": "rpvg7joamn421d3u0x5qhk9ze8sibtcw",
    "app_secret": "c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e",
    "access_token": "7334c01be3a9677868cbf1402880340e79e1ea84",
    "menuSharingCode": "uvhn3bim",
    "date": "2026-05-05"
}'
```

### Test Get Sales API (Sales)
```bash
curl --location 'https://api.petpooja.com/V1/thirdparty/get_sales/' \
--header 'Content-Type: application/json' \
--data '{
    "app_key": "rpvg7joamn421d3u0x5qhk9ze8sibtcw",
    "app_secret": "c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e",
    "access_token": "7334c01be3a9677868cbf1402880340e79e1ea84",
    "menuSharingCode": "uvhn3bim",
    "from_date": "01-05-2026",
    "to_date": "06-05-2026",
    "refId": "",
    "sType": "sale"
}'
```

---

## 8. Node.js Axios Quick Template

```javascript
const axios = require('axios');

const client = axios.create({
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
});

async function callPetpoojaAPI(endpoint, data) {
    try {
        const response = await client.post(endpoint, {
            app_key: "rpvg7joamn421d3u0x5qhk9ze8sibtcw",
            app_secret: "c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e",
            access_token: "7334c01be3a9677868cbf1402880340e79e1ea84",
            menuSharingCode: "uvhn3bim",
            ...data
        });
        
        if (response.data.code === '200' || response.data.success === '1') {
            console.log('✅ Success:', response.data);
            return response.data;
        } else {
            console.log('⚠️ Unexpected:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
        }
        throw error;
    }
}

// Usage examples:
// await callPetpoojaAPI('https://api.petpooja.com/V1/thirdparty/get_stock_api/', { date: '2026-05-05' });
// await callPetpoojaAPI('https://inventory.petpooja.com/inventories/purchase_save_api', { Purchase: {...} });
```

---

**Document Version:** 2.0  
**Next Review:** After first API integration test  
**Author:** ERP Development Team
