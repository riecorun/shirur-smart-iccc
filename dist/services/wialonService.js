"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wialonService = exports.WialonService = void 0;
const axios_1 = __importDefault(require("axios"));
const store_1 = require("../database/store");
const ruleEngine_1 = require("./ruleEngine");
class WialonService {
    sessionId = null;
    sessionExpiry = 0;
    isAuthenticating = false;
    io = null;
    syncInterval = null;
    setSocketServer(io) {
        this.io = io;
    }
    getSessionId() {
        const now = Date.now();
        if (this.sessionId && now < this.sessionExpiry) {
            return Promise.resolve(this.sessionId);
        }
        return this.authenticate().then(res => res.eid || '');
    }
    async authenticate() {
        // Read live token from env or settings
        const token = process.env.WIALON_TOKEN || store_1.db.settings.wialon.token;
        const apiHost = store_1.db.settings.wialon.apiHost || 'https://hst-api.wialon.com/wialon/ajax.html';
        if (!token || token.trim() === '') {
            store_1.db.settings.wialon.connectionStatus = 'DISCONNECTED';
            store_1.db.settings.wialon.lastError = 'No Wialon token configured';
            return { success: false, error: 'No Wialon token configured' };
        }
        try {
            this.isAuthenticating = true;
            const url = `${apiHost}?svc=token/login&params=${encodeURIComponent(JSON.stringify({ token }))}`;
            const response = await axios_1.default.get(url, { timeout: 10000 });
            const data = response.data;
            if (data && data.eid) {
                this.sessionId = data.eid;
                this.sessionExpiry = Date.now() + 1000 * 60 * 60 * 2; // 2 hour validity
                store_1.db.settings.wialon.connectionStatus = 'CONNECTED';
                store_1.db.settings.wialon.lastSyncTime = new Date().toISOString();
                store_1.db.settings.wialon.lastError = undefined;
                this.logIntegration('token/login', 'SUCCESS', `Authenticated as ${data.user?.nm || 'user'}`);
                return { success: true, eid: data.eid };
            }
            else {
                const errorMsg = `Wialon Login Failed with code ${data.error || 'Unknown'}`;
                store_1.db.settings.wialon.connectionStatus = 'DISCONNECTED';
                store_1.db.settings.wialon.lastError = errorMsg;
                this.logIntegration('token/login', 'FAILED', errorMsg);
                return { success: false, error: errorMsg };
            }
        }
        catch (err) {
            const errorMsg = err.message || 'Wialon Network Error';
            store_1.db.settings.wialon.connectionStatus = 'DISCONNECTED';
            store_1.db.settings.wialon.lastError = errorMsg;
            this.logIntegration('token/login', 'ERROR', errorMsg);
            return { success: false, error: errorMsg };
        }
        finally {
            this.isAuthenticating = false;
        }
    }
    // Live Unit GPS Sync (Direct from Wialon API)
    async syncUnitsLive() {
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
            const url = `${store_1.db.settings.wialon.apiHost}?svc=core/search_items&params=${encodeURIComponent(JSON.stringify(params))}&sid=${sid}`;
            const response = await axios_1.default.get(url, { timeout: 12000 });
            const data = response.data;
            // Handle session expiration error (code 1)
            if (data && data.error === 1) {
                this.sessionId = null;
                return this.syncUnitsLive(); // Auto re-auth and retry
            }
            if (data && data.items) {
                const targetIds = [601639146, 601638334, 601638245, 601639156, 601639166, 601639142, 601639160, 601639158];
                const matched = data.items.filter((it) => targetIds.includes(it.id));
                matched.forEach((u) => {
                    // Update Wialon Unit record
                    store_1.db.wialonUnits.set(u.id, {
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
                    const vehicle = Array.from(store_1.db.vehicles.values()).find(v => v.wialonUnitId === u.id);
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
                        }
                        else {
                            vehicle.ignition = false;
                            // Check stop duration
                            const stopMinutes = Math.floor((Date.now() - u.pos.t * 1000) / 60000);
                            vehicle.currentStopDurationMinutes = Math.max(vehicle.currentStopDurationMinutes, stopMinutes);
                            if (vehicle.currentStopDurationMinutes >= store_1.db.settings.stoppedDurationThresholdMinutes) {
                                vehicle.status = 'STOPPED';
                            }
                            else {
                                vehicle.status = 'IDLE';
                            }
                        }
                        // Run Rule Engine (10-min stop check, route deviations, geofences)
                        ruleEngine_1.ruleEngine.processVehicleTelemetry(vehicle);
                    }
                });
                store_1.db.settings.wialon.connectionStatus = 'CONNECTED';
                store_1.db.settings.wialon.lastSyncTime = new Date().toISOString();
                store_1.db.settings.wialon.lastError = undefined;
                // Broadcast updated telemetry to Web & Mobile clients
                if (this.io) {
                    this.io.emit('fleet:telemetry', {
                        timestamp: new Date().toISOString(),
                        vehicles: Array.from(store_1.db.vehicles.values()),
                        alertsCount: Array.from(store_1.db.alerts.values()).filter(a => a.status === 'OPEN').length
                    });
                }
                return { success: true, count: matched.length };
            }
            else {
                return { success: false, count: 0, error: 'Failed to parse Wialon response' };
            }
        }
        catch (err) {
            store_1.db.settings.wialon.connectionStatus = 'DISCONNECTED';
            store_1.db.settings.wialon.lastError = err.message;
            return { success: false, count: 0, error: err.message };
        }
    }
    // Start background live GPS polling
    startLivePolling(intervalSec = 10) {
        if (this.syncInterval)
            clearInterval(this.syncInterval);
        // Initial sync
        this.syncUnitsLive().then(res => {
            console.log(`[WIALON] Initial sync complete. Matched ${res.count}/8 live units.`);
        });
        this.syncInterval = setInterval(() => {
            this.syncUnitsLive();
        }, intervalSec * 1000);
    }
    stopLivePolling() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    // Diagnostic Test Suite
    async runDiagnostics() {
        const results = {};
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
        results.connectionHealth = store_1.db.settings.wialon.connectionStatus;
        results.lastSyncTime = store_1.db.settings.wialon.lastSyncTime;
        return results;
    }
    logIntegration(requestType, status, details) {
        store_1.db.integrationLogs.unshift({
            id: `int-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            service: 'Wialon Remote API',
            requestType,
            status,
            details
        });
        if (store_1.db.integrationLogs.length > 100) {
            store_1.db.integrationLogs.pop();
        }
    }
}
exports.WialonService = WialonService;
exports.wialonService = new WialonService();
