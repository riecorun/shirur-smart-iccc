import axios from 'axios';
import { Server } from 'socket.io';
import { db } from '../database/store';
import { WialonUnit } from '../types';
import { ruleEngine } from './ruleEngine';
import { CONFIG } from '../config';

export class WialonService {
  private sessionId: string | null = null;
  private sessionExpiry: number = 0;
  private isAuthenticating: boolean = false;
  private io: Server | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  public setSocketServer(io: Server) {
    this.io = io;
  }

  public getSessionId(): Promise<string> {
    const now = Date.now();
    if (this.sessionId && now < this.sessionExpiry) {
      return Promise.resolve(this.sessionId);
    }
    return this.authenticate().then(res => res.eid || '');
  }

  public async authenticate(): Promise<{ success: boolean; error?: string; eid?: string }> {
    // Read live token from env or settings
    const token = process.env.WIALON_TOKEN || db.settings.wialon.token;
    const apiHost = db.settings.wialon.apiHost || 'https://hst-api.wialon.com/wialon/ajax.html';

    if (!token || token.trim() === '') {
      db.settings.wialon.connectionStatus = 'DISCONNECTED';
      db.settings.wialon.lastError = 'No Wialon token configured';
      return { success: false, error: 'No Wialon token configured' };
    }

    try {
      this.isAuthenticating = true;
      const url = `${apiHost}?svc=token/login&params=${encodeURIComponent(JSON.stringify({ token }))}`;
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;

      if (data && data.eid) {
        this.sessionId = data.eid;
        this.sessionExpiry = Date.now() + 1000 * 60 * 60 * 2; // 2 hour validity
        db.settings.wialon.connectionStatus = 'CONNECTED';
        db.settings.wialon.lastSyncTime = new Date().toISOString();
        db.settings.wialon.lastError = undefined;

        this.logIntegration('token/login', 'SUCCESS', `Authenticated as ${data.user?.nm || 'user'}`);
        return { success: true, eid: data.eid };
      } else {
        const errorMsg = `Wialon Login Failed with code ${data.error || 'Unknown'}`;
        db.settings.wialon.connectionStatus = 'DISCONNECTED';
        db.settings.wialon.lastError = errorMsg;
        this.logIntegration('token/login', 'FAILED', errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Wialon Network Error';
      db.settings.wialon.connectionStatus = 'DISCONNECTED';
      db.settings.wialon.lastError = errorMsg;
      this.logIntegration('token/login', 'ERROR', errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      this.isAuthenticating = false;
    }
  }

  // Live Unit GPS Sync (Direct from Wialon API)
  public async syncUnitsLive(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const sid = await this.getSessionId();
      if (!sid) {
        return { success: false, count: 0, error: 'Could not obtain Wialon session' };
      }

      const params = {
        spec: {
          itemsType: 'avl_unit',
          propName: 'sys_name',
          propValueMask: '*',
          sortType: 'sys_name'
        },
        force: 1,
        flags: 1 | 1024 | 4096, // 1: base, 1024: pos, 4096: sensors
        from: 0,
        to: 0
      };

      const url = `${db.settings.wialon.apiHost}?svc=core/search_items&params=${encodeURIComponent(JSON.stringify(params))}&sid=${sid}`;
      const response = await axios.get(url, { timeout: 12000 });
      const data = response.data;

      // Handle session expiration error (code 1)
      if (data && data.error === 1) {
        this.sessionId = null;
        return this.syncUnitsLive(); // Auto re-auth and retry
      }

      if (data && data.items) {
        const targetIds = [601639146, 601638334, 601638245, 601639156, 601639166, 601639142, 601639160, 601639158];
        const matched = data.items.filter((it: any) => targetIds.includes(it.id));

        matched.forEach((u: any) => {
          // Update Wialon Unit record
          db.wialonUnits.set(u.id, {
            id: u.id,
            name: u.nm,
            imei: u.uid2 || String(u.id),
            hardwareType: u.hw || 'Standard GPS Tracker',
            phone: u.ph,
            lastPosition: u.pos
              ? {
                  lat: u.pos.y,
                  lng: u.pos.x,
                  speed: u.pos.s,
                  course: u.pos.c,
                  altitude: u.pos.z,
                  time: u.pos.t
                }
              : undefined,
            connectionStatus: u.pos && Date.now() / 1000 - u.pos.t < 900 ? 'ONLINE' : 'OFFLINE'
          });

          // Update mapped Shirur Vehicle
          const vehicle = Array.from(db.vehicles.values()).find(v => v.wialonUnitId === u.id);
          if (vehicle && u.pos) {
            vehicle.latitude = u.pos.y;
            vehicle.longitude = u.pos.x;
            vehicle.speed = u.pos.s;
            vehicle.heading = u.pos.c;
            vehicle.lastGpsTimestamp = new Date(u.pos.t * 1000).toISOString();

            if (u.pos.s > 0) {
              vehicle.status = 'MOVING';
              vehicle.ignition = true;
              vehicle.currentStopDurationMinutes = 0;
            } else {
              vehicle.ignition = false;
              // Check stop duration
              const stopMinutes = Math.floor((Date.now() - u.pos.t * 1000) / 60000);
              vehicle.currentStopDurationMinutes = Math.max(vehicle.currentStopDurationMinutes, stopMinutes);
              if (vehicle.currentStopDurationMinutes >= db.settings.stoppedDurationThresholdMinutes) {
                vehicle.status = 'STOPPED';
              } else {
                vehicle.status = 'IDLE';
              }
            }

            // Run Rule Engine (10-min stop check, route deviations, geofences)
            ruleEngine.processVehicleTelemetry(vehicle);
          }
        });

        db.settings.wialon.connectionStatus = 'CONNECTED';
        db.settings.wialon.lastSyncTime = new Date().toISOString();
        db.settings.wialon.lastError = undefined;

        // Broadcast updated telemetry to Web & Mobile clients
        if (this.io) {
          this.io.emit('fleet:telemetry', {
            timestamp: new Date().toISOString(),
            vehicles: Array.from(db.vehicles.values()),
            alertsCount: Array.from(db.alerts.values()).filter(a => a.status === 'OPEN').length
          });
        }

        return { success: true, count: matched.length };
      } else {
        return { success: false, count: 0, error: 'Failed to parse Wialon response' };
      }
    } catch (err: any) {
      db.settings.wialon.connectionStatus = 'DISCONNECTED';
      db.settings.wialon.lastError = err.message;
      return { success: false, count: 0, error: err.message };
    }
  }

  // Start background live GPS polling
  public startLivePolling(intervalSec: number = 10) {
    if (this.syncInterval) clearInterval(this.syncInterval);

    // Initial sync
    this.syncUnitsLive().then(res => {
      console.log(`[WIALON] Initial sync complete. Matched ${res.count}/8 live units.`);
    });

    this.syncInterval = setInterval(() => {
      this.syncUnitsLive();
    }, intervalSec * 1000);
  }

  public stopLivePolling() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Diagnostic Test Suite
  public async runDiagnostics(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    const authStart = Date.now();
    const authRes = await this.authenticate();
    results.authentication = {
      status: authRes.success ? 'PASSED' : 'FAILED',
      timeMs: Date.now() - authStart,
      details: authRes.success ? 'Session initialized successfully' : authRes.error
    };

    const syncStart = Date.now();
    const syncRes = await this.syncUnitsLive();
    results.units = {
      status: syncRes.success ? 'PASSED' : 'FAILED',
      timeMs: Date.now() - syncStart,
      count: syncRes.count,
      targetExpected: 8,
      details: syncRes.success ? `Verified ${syncRes.count} of 8 Shirur Wialon Units` : syncRes.error
    };

    results.connectionHealth = db.settings.wialon.connectionStatus;
    results.lastSyncTime = db.settings.wialon.lastSyncTime;
    return results;
  }

  private logIntegration(requestType: string, status: string, details: string) {
    db.integrationLogs.unshift({
      id: `int-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      service: 'Wialon Remote API',
      requestType,
      status,
      details
    });
    if (db.integrationLogs.length > 100) {
      db.integrationLogs.pop();
    }
  }
}

export const wialonService = new WialonService();
