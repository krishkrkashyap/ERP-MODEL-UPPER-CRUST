// src/server.ts - Main Express server for ERP Backend
import { createApp, prisma } from './app';

const PORT = process.env.PORT || 4000;
const app = createApp();

// ===== START SERVER =====
const server = app.listen(PORT, () => {
    console.log(`🚀 ERP Backend server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close();
    await prisma.$disconnect();
    process.exit(0);
});

export { app, server };
