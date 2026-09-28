import { db } from '../database/store';

export class QrService {
  public verifyAndProcessScan(qrPayload: string, workerId: string): { success: boolean; message: string; assetDetails?: any } {
    let code = qrPayload.trim();

    // Check if JSON formatted QR or direct string code
    let parsed: any = null;
    try {
      parsed = JSON.parse(qrPayload);
      if (parsed.code) code = parsed.code;
    } catch {
      // Plain text QR
    }

    // 1. Check Smart Bins
    const bin = Array.from(db.smartBins.values()).find(b => b.qrAssetCode === code || b.binCode === code);
    if (bin) {
      bin.fillLevelPct = 10; // Emptied after collection
      bin.status = 'NORMAL';
      bin.lastPingTime = new Date().toISOString();
      return {
        success: true,
        message: `स्मार्ट कचरा कुंडी स्कॅन यशस्वी (${bin.binCode}). कचरा संकलन नोंदवले गेले.`,
        assetDetails: { type: 'SMART_BIN', id: bin.id, code: bin.binCode, location: bin.locationName }
      };
    }

    // 2. Check Public Toilets
    const toilet = Array.from(db.toilets.values()).find(t => t.qrAssetCode === code || t.toiletCode === code);
    if (toilet) {
      toilet.lastCleanedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today';
      toilet.cleanlinessScore = 4.8;
      toilet.workerId = workerId;
      return {
        success: true,
        message: `सार्वजनिक स्वच्छतागृह स्कॅन यशस्वी (${toilet.name}). स्वच्छता तपासणी नोंदवली गेली.`,
        assetDetails: { type: 'PUBLIC_TOILET', id: toilet.id, name: toilet.name, score: toilet.cleanlinessScore }
      };
    }

    // 3. Check Route Collection Points
    for (const route of db.routes.values()) {
      const point = route.collectionPoints.find(p => p.qrAssetCode === code || p.id === code);
      if (point) {
        point.isCollectedToday = true;
        point.collectedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          success: true,
          message: `संकलन केंद्र स्कॅन यशस्वी (${point.name}). घरोघरी कचरा संकलन पूर्ण.`,
          assetDetails: { type: 'COLLECTION_POINT', id: point.id, name: point.name, route: route.routeName }
        };
      }
    }

    // 4. Check Vehicles
    const vehicle = Array.from(db.vehicles.values()).find(v => v.gpsDeviceId === code || v.registrationNumber === code);
    if (vehicle) {
      return {
        success: true,
        message: `वाहन क्यूआर स्कॅन यशस्वी: ${vehicle.registrationNumber}`,
        assetDetails: { type: 'VEHICLE', id: vehicle.id, number: vehicle.registrationNumber, typeName: vehicle.vehicleType }
      };
    }

    return {
      success: false,
      message: `अवैध किंवा नोंदणी नसलेला ITI Limited QR Code: ${code}`
    };
  }
}

export const qrService = new QrService();
