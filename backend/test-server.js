// test-server.js - Test the ERP backend server
const http = require('http');
const { exec } = require('child_process');

// Start the server
console.log('Starting server...');
const server = exec('node dist/server.js', { cwd: 'C:\\Users\\U.C\\Desktop\\Projects\\ERP\\backend' });

server.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
    
    // Once server is ready, make test requests
    if (data.includes('running on port')) {
        setTimeout(() => {
            testEndpoints();
        }, 2000);
    }
});

server.stderr.on('data', (data) => {
    console.error(`Server error: ${data}`);
});

function testEndpoints() {
    console.log('\n--- Testing Endpoints ---\n');
    
    // Test 1: Health check
    makeRequest('GET', 'http://localhost:4000/health', null, 'Health Check');
    
    // Test 2: Stock sync
    setTimeout(() => {
        makeRequest('POST', 'http://localhost:4000/api/inventory/stock/sync', 
            { date: '2026-05-05' }, 'Stock Sync');
    }, 1000);
    
    // Test 3: Get stock
    setTimeout(() => {
        makeRequest('GET', 'http://localhost:4000/api/inventory/stock?date=2026-05-05', 
            null, 'Get Stock');
    }, 3000);
    
    // Test 4: Order sync (using live API)
    setTimeout(() => {
        makeRequest('POST', 'http://localhost:4000/api/orders/sync', 
            { orderDate: '2026-05-05' }, 'Order Sync');
    }, 5000);
    
    // Test 5: Get orders
    setTimeout(() => {
        makeRequest('GET', 'http://localhost:4000/api/orders', 
            null, 'Get Orders');
    }, 10000);
    
    // Keep server running for a bit, then stop
    setTimeout(() => {
        console.log('\n--- Stopping Server ---');
        server.kill();
        process.exit(0);
    }, 15000);
}

function makeRequest(method, url, body, testName) {
    const options = {
        method: method,
        headers: body ? { 'Content-Type': 'application/json' } : {}
    };
    
    const req = http.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`✅ ${testName}: ${res.statusCode}`);
            try {
                const json = JSON.parse(data);
                console.log(JSON.stringify(json, null, 2).substring(0, 500) + '\n');
            } catch (e) {
                console.log(data.substring(0, 500) + '\n');
            }
        });
    });
    
    req.on('error', (e) => {
        console.error(`❌ ${testName} error:`, e.message);
    });
    
    if (body) {
        req.write(JSON.stringify(body));
    }
    req.end();
}
