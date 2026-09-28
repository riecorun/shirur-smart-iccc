// Root server launcher for Hostinger and PaaS hosting
process.on('uncaughtException', (err) => {
  console.error('[FATAL UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL UNHANDLED REJECTION]', reason);
});

console.log('[HOSTINGER LAUNCHER] Starting Shirur Smart ICCC backend...');
console.log('[HOSTINGER LAUNCHER] Node version:', process.version);
console.log('[HOSTINGER LAUNCHER] Environment PORT:', process.env.PORT);

require('./dist/server.js');
