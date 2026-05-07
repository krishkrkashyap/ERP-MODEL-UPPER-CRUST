# Petpooja Inventory API - Credentials & Configuration Guide

**Status:** ✅ API Activated  
**Date:** May 6, 2026  
**Project Path:** `C:\Users\U.C\Desktop\Projects\ERP`

---

## 1. Core API Credentials (Required for ALL APIs)

These credentials are used in **every** API request (push and pull):

| Credential | Value | Notes |
|------------|-------|-------|
| **app_key** | `rpvg7joamn421d3u0x5qhk9ze8sibtcw` | Public identifier for your app |
| **app_secret** | `c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e` | Keep this secret! Used for authentication |
| **access_token** | `7334c01be3a9677868cbf1402880340e79e1ea84` | Session token for API access |
| **menuSharingCode** | `uvhn3bim` (ID: 340305) & `t2jrg8ez` (ID: 340304) | You have TWO menu sharing codes for different outlets/restaurants. Use the appropriate one for each restaurant. |

### ⚠️ Security Warning
- **Never commit these credentials to Git!**
- Store them in environment variables or a secrets manager (HashiCorp Vault, AWS Secrets Manager)
- The `app_secret` should be treated as a password

---

## 2. API Endpoints (Copy-Paste Ready)

### 2.1 Push APIs (Third-Party → Petpooja)
*You send data to Petpooja to update their system*

| API Name | Method | Production URL | Purpose |
|----------|--------|----------------|---------|
| **Purchase API** | POST | `https://inventory.petpooja.com/inventories/purchase_save_api` | Push purchase invoices, add stock |
| **Purchase Return API** | POST | `https://inventory.petpooja.com/inventories/purchase_return_save_api` | Push purchase returns, reduce stock |
| **Inventory Sales API** | POST | `https://inventory.petpooja.com/inventories/sale_save_api` | Push sales invoices, reduce stock |
| **Transfer API** | POST | `https://inventory.petpooja.com/inventories/transfer_save_api` | Push internal transfers |
| **Raw Material API** | POST | `https://api.petpooja.com/V1/thirdparty/rawmaterial_save_api/` | Push new raw materials |
| **Sales Return API** | POST | `https://inventory.petpooja.com/inventories/sale_return_save_api` | Push sales returns, add stock |

### 2.2 Pull APIs (Petpooja → Third-Party)
*You fetch data from Petpooja to sync to your ERP*

| API Name | Method | Production URL | Purpose |
|----------|--------|----------------|---------|
| **Stock API** | POST | `https://api.petpooja.com/V1/thirdparty/get_stock_api/` | Get stock levels for a date |
| **Purchase Order API (Webhook)** | POST | *Your server URL* | Receive POs in real-time (see Section 3) |
| **Get Purchase API** | POST | `https://api.petpooja.com/V1/thirdparty/get_purchase/` | Pull purchase invoices (date range) |
| **Get Sales API** | POST | `https://api.petpooja.com/V1/thirdparty/get_sales/` | Pull sales, transfers, wastage (date range) |
| **Consumption API** | POST | `https://api.petpooja.com/V1/thirdparty/get_orders_api/` | Pull order data (sales + customer data) |

---

## 3. Webhook Configuration (For Real-Time PO Push)

The **Purchase Order API** is the only webhook-based API where Petpooja pushes data to YOU in real-time when a PO is created.

### 3.1 Your Server Requirements
You need to set up a publicly accessible URL to receive webhooks:

| Item | Requirement | Example |
|------|-------------|---------|
| **Server URL** | HTTPS endpoint | `https://erp.yourcompany.com/webhook/petpooja/purchase-order` |
| **Method** | POST | Receives JSON payload |
| **Authentication** | Validate `app_key` in payload | See code sample below |
| **Response** | Return JSON | `{"success": true}` |

### 3.2 Webhook Payload Structure (What Petpooja Sends to You)
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
    "itemDetails": [...],
    "restDetails": {...},
    "status": "Active"
  }
}
```

### 3.3 Webhook Validation Code (Node.js/Express)
```javascript
// Your webhook endpoint
app.post('/webhook/petpooja/purchase-order', (req, res) => {
    const { app_key, access_token, data } = req.body;
    
    // Validate it's really from Petpooja
    if (app_key !== 'rpvg7joamn421d3u0x5qhk9ze8sibtcw') {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Process the PO data
    console.log('Received PO:', data.poNumber);
    // Save to your ERP database...
    
    // Acknowledge receipt
    res.json({ success: true });
});
```

### 3.4 Share Your Webhook URL with Petpooja
Contact Petpooja support and provide:
- Your webhook URL: `https://your-server/webhook/petpooja/purchase-order`
- They will configure their system to push PO data to this URL

---

## 4. Request/Response Examples

### 4.1 Sample Push Request (Purchase API)
```bash
curl --location 'https://inventory.petpooja.com/inventories/purchase_save_api' \
--header 'Content-Type: application/json' \
--data '{
  "app_key": "rpvg7joamn421d3u0x5qhk9ze8sibtcw",
  "app_secret": "c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e",
  "access_token": "7334c01be3a9677868cbf1402880340e79e1ea84",
  "menuSharingCode": "XXXX",
  "Purchase": {
    "updateStock": "1",
    "status": "1",
    "receiverType": "S/c",
    "invoiceDate": "2026-05-06",
    "invoiceNumber": "INV-001",
    "totalTax": "0.00",
    "totalDiscount": "0",
    "itemDetails": [...],
    "total": "300.00",
    "restDetails": {...}
  }
}'
```

### 4.2 Sample Pull Request (Get Stock API)
```bash
curl --location 'https://api.petpooja.com/V1/thirdparty/get_stock_api/' \
--header 'Content-Type: application/json' \
--data '{
  "app_key": "rpvg7joamn421d3u0x5qhk9ze8sibtcw",
  "app_secret": "c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e",
  "access_token": "7334c01be3a9677868cbf1402880340e79e1ea84",
  "menuSharingCode": "XXXX",
  "date": "2026-05-05"
}'
```

### 4.3 Sample Pull Request (Get Sales API with Date Range)
```bash
curl --location 'https://api.petpooja.com/V1/thirdparty/get_sales/' \
--header 'Content-Type: application/json' \
--data '{
  "app_key": "rpvg7joamn421d3u0x5qhk9ze8sibtcw",
  "app_secret": "c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e",
  "access_token": "7334c01be3a9677868cbf1402880340e79e1ea84",
  "menuSharingCode": "XXXX",
  "from_date": "01-05-2026",
  "to_date": "31-05-2026",
  "refld": "",
  "sType": "sale"
}'
```

---

## 5. Environment Variables (.env File)

Create a `.env` file for your backend (never commit this file!):

```bash
# Petpooja API Credentials
PETPOOJA_APP_KEY=rpvg7joamn421d3u0x5qhk9ze8sibtcw
PETPOOJA_APP_SECRET=c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e
PETPOOJA_ACCESS_TOKEN=7334c01be3a9677868cbf1402880340e79e1ea84
# You have TWO menu sharing codes - use the correct one for each restaurant
PETPOOJA_MENU_SHARING_CODE_UVHN3BIM=uvhn3bim  # For ID: 340305
PETPOOJA_MENU_SHARING_CODE_T2JRG8EZ=t2jrg8ez  # For ID: 340304

# Webhook Configuration
WEBHOOK_BASE_URL=https://erp.yourcompany.com
WEBHOOK_PO_PATH=/webhook/petpooja/purchase-order

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/erp

# JWT Secret for your app
JWT_SECRET=your-super-secure-jwt-secret-here

# Redis
REDIS_URL=redis://localhost:6379
```

Add `.env` to your `.gitignore` file:
```bash
# .gitignore
.env
.env.*
node_modules/
dist/
```

---

## 6. Complete API Checklist

Use this checklist to track your integration progress:

### Phase 1: Credentials Setup
- [ ] Store credentials in environment variables
- [ ] Verify `menuSharingCode` with Petpooja (update if different)
- [ ] Set up webhook URL and share with Petpooja
- [ ] Test webhook endpoint with sample payload

### Phase 2: Push APIs (You → Petpooja)
- [ ] **Purchase API** - Push purchase invoices
- [ ] **Purchase Return API** - Push purchase returns
- [ ] **Inventory Sales API** - Push sales invoices
- [ ] **Transfer API** - Push internal transfers
- [ ] **Raw Material API** - Push new raw materials
- [ ] **Sales Return API** - Push sales returns

### Phase 3: Pull APIs (Petpooja → You)
- [ ] **Stock API** - Pull daily stock levels
- [ ] **Get Purchase API** - Pull purchase invoices (date range)
- [ ] **Get Sales API** - Pull sales, transfers, wastage
- [ ] **Consumption API** - Pull order/customer data
- [ ] **Purchase Order Webhook** - Receive POs in real-time

### Phase 4: Pagination Handling
All pull APIs return max 50 records per request. Implement `refId` pagination:
- [ ] Test pagination with >50 records
- [ ] Handle `refId` parameter correctly
- [ ] Loop through all pages to get complete data

---

## 7. Next Steps

1. **Verify menuSharingCode**: Contact Petpooja to confirm your actual `menuSharingCode` (they mentioned it's dynamic)

2. **Set up webhook**: 
   - Deploy a test endpoint (even a simple Express server)
   - Share the URL with Petpooja support
   - Test with sample PO payload

3. **Start with Phase 1** of the ERP plan (database setup):
   ```bash
   cd C:\Users\U.C\Desktop\Projects\ERP
   # Follow plan.md Phase 1 tasks
   ```

4. **Test API connectivity**:
   ```javascript
   // Quick test script
   const axios = require('axios');
   
   async function testConnection() {
       try {
           const response = await axios.post(
               'https://api.petpooja.com/V1/thirdparty/get_stock_api/',
               {
                   app_key: process.env.PETPOOJA_APP_KEY,
                   app_secret: process.env.PETPOOJA_APP_SECRET,
                   access_token: process.env.PETPOOJA_ACCESS_TOKEN,
                   menuSharingCode: process.env.PETPOOJA_MENU_SHARING_CODE,
                   date: '2026-05-06'
               }
           );
           console.log('✅ API Connection Successful!', response.data);
       } catch (error) {
           console.error('❌ API Connection Failed:', error.message);
       }
   }
   
   testConnection();
   ```

---

## Appendix: Cookie Headers (For Advanced Usage)

Some APIs in the documentation show cookie headers. You may need these for certain requests:

```javascript
// Example with cookies (if required by specific APIs)
headers: {
    'Content-Type': 'application/json',
    'Cookie': 'PETPOOJA_CO=4853nc4r0gu8c93pmr0bq18813; PETPOOJA_API=q852n72u1dc3g6jvlndk4orq30'
}
```

**Note:** The cookie values in the PDFs are samples. Your actual cookies may differ. Check with Petpooja if you encounter authentication issues.

---

**Document Version:** 1.0  
**Last Updated:** May 6, 2026  
**Next Action:** Verify `menuSharingCode` and set up webhook URL
