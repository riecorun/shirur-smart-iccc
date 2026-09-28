import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'shirur_smart_iccc_jwt_secret_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  municipality: {
    name: process.env.MUNICIPALITY_NAME || 'SHIRUR NAGAR PARISHAD',
    code: process.env.MUNICIPALITY_CODE || 'SNP',
    tagline: process.env.MUNICIPALITY_TAGLINE || 'CLEANER | SMARTER | GREENER | SAFER SHIRUR',
    address: 'Pune-Nagar Road, Shirur, Dist. Pune, Maharashtra 412210',
    emergencyPhone: '+91 2137 222123 / 1800-233-1020',
    centerLat: parseFloat(process.env.MUNICIPALITY_LAT || '18.8260'),
    centerLng: parseFloat(process.env.MUNICIPALITY_LNG || '74.3789')
  },
  
  wialon: {
    apiUrl: process.env.WIALON_API_URL || 'https://hst-api.wialon.com/wialon/ajax.html',
    token: process.env.WIALON_TOKEN || '',
    serverType: 'WIALON_HOSTING',
    syncIntervalSec: 10
  },
  
  thresholds: {
    stoppedDurationMinutes: 10, // Stop > 10 min generates alert
    idleDurationMinutes: 15,
    routeDeviationMeters: 150,  // > 150m from assigned route
    overspeedKmH: 45            // municipal speed limit
  }
};
