// Root index launcher for Hostinger and PaaS hosting
process.on('uncaughtException', (err) => {
  console.error('[FATAL UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL UNHANDLED REJECTION]', reason);
});

console.log('[HOSTINGER INDEX] Starting Shirur Smart ICCC backend...');
require('./dist/server.js');
