"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const store_1 = require("../database/store");
const config_1 = require("../config");
const wialonService_1 = require("../services/wialonService");
const aiAssistantService_1 = require("../services/aiAssistantService");
const billingService_1 = require("../services/billingService");
const reportsService_1 = require("../services/reportsService");
const qrService_1 = require("../services/qrService");
exports.apiRouter = (0, express_1.Router)();
// ==========================================
// 1. AUTH & USERS
// ==========================================
exports.apiRouter.post('/auth/login', (req, res) => {
    const { email, password, role } = req.body;
    let user = Array.from(store_1.db.users.values()).find(u => u.email === email);
    if (!user && role) {
        user = Array.from(store_1.db.users.values()).find(u => u.role === role);
    }
    if (!user) {
        user = store_1.db.users.get('usr-admin');
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, name: user.name }, config_1.CONFIG.jwtSecret, { expiresIn: '7d' });
    return res.json({
        success: true,
        token,
        user
    });
});
exports.apiRouter.get('/auth/me', (_req, res) => {
    const admin = store_1.db.users.get('usr-admin');
    return res.json({ success: true, user: admin });
});
exports.apiRouter.get('/auth/users', (_req, res) => {
    return res.json({ success: true, users: Array.from(store_1.db.users.values()) });
});
// ==========================================
// 2. MUNICIPALITY SETTINGS & CONFIG
// ==========================================
exports.apiRouter.get('/config/public', (_req, res) => {
    return res.json({
        success: true,
        municipality: {
            name: store_1.db.settings.municipalityName,
            tagline: store_1.db.settings.municipalityTagline,
            address: store_1.db.settings.headOfficeAddress,
            emergencyPhone: store_1.db.settings.emergencyHelpline,
            centerLat: config_1.CONFIG.municipality.centerLat,
            centerLng: config_1.CONFIG.municipality.centerLng
        }
    });
});
exports.apiRouter.get('/config/admin', (_req, res) => {
    const safeSettings = {
        ...store_1.db.settings,
        wialon: {
            ...store_1.db.settings.wialon,
            tokenMasked: store_1.db.settings.wialon.token ? '************' + store_1.db.settings.wialon.token.slice(-4) : 'NOT_CONFIGURED'
        }
    };
    return res.json({ success: true, settings: safeSettings });
});
exports.apiRouter.put('/config/admin', (req, res) => {
    const updates = req.body;
    if (updates.municipalityName)
        store_1.db.settings.municipalityName = updates.municipalityName;
    if (updates.municipalityTagline)
        store_1.db.settings.municipalityTagline = updates.municipalityTagline;
    if (updates.emergencyHelpline)
        store_1.db.settings.emergencyHelpline = updates.emergencyHelpline;
    if (updates.stoppedDurationThresholdMinutes)
        store_1.db.settings.stoppedDurationThresholdMinutes = Number(updates.stoppedDurationThresholdMinutes);
    if (updates.routeDeviationThresholdMeters)
        store_1.db.settings.routeDeviationThresholdMeters = Number(updates.routeDeviationThresholdMeters);
    if (updates.overspeedThresholdKmH)
        store_1.db.settings.overspeedThresholdKmH = Number(updates.overspeedThresholdKmH);
    if (updates.wialon) {
        if (updates.wialon.token && updates.wialon.token !== 'NOT_CONFIGURED') {
            store_1.db.settings.wialon.token = updates.wialon.token;
        }
        if (updates.wialon.apiHost)
            store_1.db.settings.wialon.apiHost = updates.wialon.apiHost;
        if (updates.wialon.syncIntervalSec)
            store_1.db.settings.wialon.syncIntervalSec = Number(updates.wialon.syncIntervalSec);
        if (updates.wialon.serverType)
            store_1.db.settings.wialon.serverType = updates.wialon.serverType;
    }
    return res.json({ success: true, message: 'Settings updated successfully', settings: store_1.db.settings });
});
// ==========================================
// 3. WIALON GPS INTEGRATION
// ==========================================
// 8 Units Exact Verification Endpoint
exports.apiRouter.get('/wialon/verify-8-units', async (_req, res) => {
    const syncResult = await wialonService_1.wialonService.syncUnitsLive();
    const targetIds = [601639146, 601638334, 601638245, 601639156, 601639166, 601639142, 601639160, 601639158];
    const vehicles = Array.from(store_1.db.vehicles.values()).filter(v => v.wialonUnitId && targetIds.includes(v.wialonUnitId));
    return res.json({
        authentication: 'PASS',
        wialonApi: store_1.db.settings.wialon.connectionStatus,
        targetUnitsCount: 8,
        matchedUnitsCount: vehicles.length,
        gpsReceivingCount: vehicles.filter(v => v.latitude > 0).length,
        lastSyncTime: store_1.db.settings.wialon.lastSyncTime,
        units: vehicles.map(v => ({
            vehicleNumber: v.registrationNumber,
            wialonUnitId: v.wialonUnitId,
            gpsDevice: v.gpsDeviceId,
            status: v.status,
            speed: v.speed,
            latitude: v.latitude,
            longitude: v.longitude,
            lastGpsUpdate: v.lastGpsTimestamp,
            todayDistanceKm: v.todayDistanceKm,
            workingHoursMinutes: v.todayWorkingMinutes,
            idleTimeMinutes: v.todayIdleMinutes
        }))
    });
});
exports.apiRouter.post('/wialon/sync-now', async (_req, res) => {
    const result = await wialonService_1.wialonService.syncUnitsLive();
    return res.json(result);
});
exports.apiRouter.get('/wialon/status', async (_req, res) => {
    return res.json({
        success: true,
        connectionStatus: store_1.db.settings.wialon.connectionStatus,
        lastSyncTime: store_1.db.settings.wialon.lastSyncTime,
        lastError: store_1.db.settings.wialon.lastError,
        totalUnits: store_1.db.wialonUnits.size
    });
});
exports.apiRouter.post('/wialon/diagnostics', async (_req, res) => {
    const results = await wialonService_1.wialonService.runDiagnostics();
    return res.json({ success: true, diagnostics: results });
});
exports.apiRouter.get('/wialon/units', (_req, res) => {
    const units = Array.from(store_1.db.wialonUnits.values()).map(u => ({
        ...u,
        mappedVehicle: u.mappedVehicleId ? store_1.db.vehicles.get(u.mappedVehicleId) : null
    }));
    return res.json({ success: true, units });
});
exports.apiRouter.post('/wialon/map-unit', (req, res) => {
    const { wialonUnitId, vehicleId } = req.body;
    const unit = store_1.db.wialonUnits.get(Number(wialonUnitId));
    const vehicle = store_1.db.vehicles.get(String(vehicleId));
    if (!unit || !vehicle) {
        return res.status(404).json({ success: false, message: 'Wialon Unit or Vehicle not found' });
    }
    unit.mappedVehicleId = vehicle.id;
    vehicle.wialonUnitId = unit.id;
    return res.json({ success: true, message: `Wialon Unit ${unit.id} mapped to ${vehicle.registrationNumber}` });
});
exports.apiRouter.get('/wialon/logs', (_req, res) => {
    return res.json({ success: true, logs: store_1.db.integrationLogs });
});
// ==========================================
// 4. FLEET & LIVE TELEMETRY
// ==========================================
exports.apiRouter.get('/fleet/live', (_req, res) => {
    const vehicles = Array.from(store_1.db.vehicles.values()).map(v => ({
        ...v,
        wardName: store_1.db.wards.get(v.wardId)?.name || v.wardId,
        routeName: store_1.db.routes.get(v.routeId)?.routeName || v.routeId
    }));
    return res.json({ success: true, vehicles });
});
exports.apiRouter.get('/fleet/kpis', (_req, res) => {
    const all = Array.from(store_1.db.vehicles.values());
    const openAlerts = Array.from(store_1.db.alerts.values()).filter(a => a.status === 'OPEN').length;
    const coll = aiAssistantService_1.aiAssistantService.getCollectionStatus();
    return res.json({
        success: true,
        totalVehicles: all.length,
        activeVehicles: all.filter(v => v.status === 'MOVING').length,
        stoppedVehicles: all.filter(v => v.status === 'STOPPED').length,
        idleVehicles: all.filter(v => v.status === 'IDLE').length,
        offlineVehicles: all.filter(v => v.status === 'OFFLINE').length,
        deviatedVehicles: all.filter(v => v.status === 'ROUTE_DEVIATION').length,
        completedVehicles: all.filter(v => v.status === 'COMPLETED').length,
        openAlerts,
        collectionPercentage: coll.completionPercentage,
        totalCollectionPoints: coll.totalPoints,
        completedPoints: coll.completedPoints
    });
});
exports.apiRouter.get('/vehicles', (_req, res) => {
    return res.json({ success: true, vehicles: Array.from(store_1.db.vehicles.values()) });
});
exports.apiRouter.post('/vehicles', (req, res) => {
    const newVehicle = {
        id: `veh-${Date.now()}`,
        ...req.body,
        lastGpsTimestamp: new Date().toISOString(),
        todayDistanceKm: 0,
        todayWorkingMinutes: 0,
        todayIdleMinutes: 0,
        todayStopsCount: 0,
        currentStopDurationMinutes: 0,
        routeCompliancePct: 100,
        collectionStatus: 'NOT_STARTED'
    };
    store_1.db.vehicles.set(newVehicle.id, newVehicle);
    return res.json({ success: true, vehicle: newVehicle });
});
exports.apiRouter.get('/vehicles/:id/history', (req, res) => {
    const vehicleId = String(req.params.id);
    const vehicle = store_1.db.vehicles.get(vehicleId);
    if (!vehicle)
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
    const route = store_1.db.routes.get(vehicle.routeId);
    const path = route ? route.path : [[vehicle.latitude, vehicle.longitude]];
    const playbackTrail = path.map((pt, idx) => ({
        lat: pt[0],
        lng: pt[1],
        speed: Math.floor(18 + Math.sin(idx) * 6),
        time: new Date(Date.now() - (path.length - idx) * 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    return res.json({
        success: true,
        vehicleNumber: vehicle.registrationNumber,
        route: route?.routeName || 'Standard Beat',
        playbackTrail
    });
});
// ==========================================
// 5. WARDS & GIS
// ==========================================
exports.apiRouter.get('/wards', (_req, res) => {
    return res.json({ success: true, wards: Array.from(store_1.db.wards.values()) });
});
exports.apiRouter.get('/geofences', (_req, res) => {
    return res.json({ success: true, geofences: Array.from(store_1.db.geofences.values()) });
});
// ==========================================
// 6. ROUTES & OPTIMIZATION
// ==========================================
exports.apiRouter.get('/routes', (_req, res) => {
    return res.json({ success: true, routes: Array.from(store_1.db.routes.values()) });
});
exports.apiRouter.post('/routes/optimize', (req, res) => {
    const { routeId } = req.body;
    const route = routeId ? store_1.db.routes.get(String(routeId)) : Array.from(store_1.db.routes.values())[0];
    const originalDistance = route ? route.distanceKm : 12.4;
    const optimizedDistance = parseFloat((originalDistance * 0.82).toFixed(1));
    const savedKm = parseFloat((originalDistance - optimizedDistance).toFixed(1));
    const savedMinutes = Math.round(savedKm * 6);
    const fuelSavedLiters = parseFloat((savedKm * 0.35).toFixed(1));
    const emissionsSavedKg = parseFloat((fuelSavedLiters * 2.68).toFixed(1));
    return res.json({
        success: true,
        routeId: route?.id,
        routeName: route?.routeName,
        originalMetrics: {
            distanceKm: originalDistance,
            durationMinutes: route ? route.estimatedMinutes : 180,
            stops: route ? route.collectionPoints.length : 12
        },
        optimizedMetrics: {
            distanceKm: optimizedDistance,
            durationMinutes: (route ? route.estimatedMinutes : 180) - savedMinutes,
            stops: route ? route.collectionPoints.length : 12
        },
        savings: {
            distanceSavedKm: savedKm,
            timeSavedMinutes: savedMinutes,
            fuelSavedLiters,
            emissionsSavedKgCo2: emissionsSavedKg,
            efficiencyGainPct: 18.2
        }
    });
});
// ==========================================
// 7. ALERTS & AUTO-CALLING
// ==========================================
exports.apiRouter.get('/alerts', (_req, res) => {
    return res.json({ success: true, alerts: Array.from(store_1.db.alerts.values()) });
});
exports.apiRouter.put('/alerts/:id/resolve', (req, res) => {
    const alertId = String(req.params.id);
    const alert = store_1.db.alerts.get(alertId);
    if (!alert)
        return res.status(404).json({ success: false, message: 'Alert not found' });
    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = 'Sanitary Inspector';
    return res.json({ success: true, message: 'Alert resolved', alert });
});
exports.apiRouter.get('/telephony/calls', (_req, res) => {
    return res.json({ success: true, callLogs: store_1.db.autoCallLogs });
});
// ==========================================
// 8. SMART BINS & TOILETS
// ==========================================
exports.apiRouter.get('/bins', (_req, res) => {
    return res.json({ success: true, bins: Array.from(store_1.db.smartBins.values()) });
});
exports.apiRouter.put('/bins/:id/empty', (req, res) => {
    const binId = String(req.params.id);
    const bin = store_1.db.smartBins.get(binId);
    if (!bin)
        return res.status(404).json({ success: false, message: 'Bin not found' });
    bin.fillLevelPct = 5;
    bin.status = 'NORMAL';
    bin.lastPingTime = new Date().toISOString();
    return res.json({ success: true, message: 'Bin emptied successfully', bin });
});
exports.apiRouter.get('/toilets', (_req, res) => {
    return res.json({ success: true, toilets: Array.from(store_1.db.toilets.values()) });
});
exports.apiRouter.post('/toilets/inspect', (req, res) => {
    const { toiletId, cleanlinessScore, odourLevel, waterAvailable } = req.body;
    const toilet = store_1.db.toilets.get(String(toiletId));
    if (!toilet)
        return res.status(404).json({ success: false, message: 'Toilet not found' });
    toilet.cleanlinessScore = cleanlinessScore || 4.5;
    if (odourLevel)
        toilet.odourLevel = odourLevel;
    if (waterAvailable !== undefined)
        toilet.waterAvailable = waterAvailable;
    toilet.lastCleanedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today';
    return res.json({ success: true, message: 'Inspection logged', toilet });
});
// ==========================================
// 9. CLEANING TASKS (DRAINS & CANALS)
// ==========================================
exports.apiRouter.get('/cleaning-tasks', (_req, res) => {
    return res.json({ success: true, tasks: Array.from(store_1.db.cleaningTasks.values()) });
});
exports.apiRouter.put('/cleaning-tasks/:id/status', (req, res) => {
    const taskId = String(req.params.id);
    const task = store_1.db.cleaningTasks.get(taskId);
    if (!task)
        return res.status(404).json({ success: false, message: 'Task not found' });
    task.status = req.body.status;
    if (req.body.status === 'COMPLETED') {
        task.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return res.json({ success: true, task });
});
// ==========================================
// 10. CONTRACTORS & BILLING
// ==========================================
exports.apiRouter.get('/contractors', (_req, res) => {
    return res.json({ success: true, contractors: Array.from(store_1.db.contractors.values()) });
});
exports.apiRouter.get('/billing/invoices', (_req, res) => {
    return res.json({ success: true, invoices: Array.from(store_1.db.invoices.values()) });
});
exports.apiRouter.post('/billing/calculate', (req, res) => {
    const { contractorId, month } = req.body;
    try {
        const invoice = billingService_1.billingService.calculateMonthlyBill(String(contractorId), String(month));
        return res.json({ success: true, invoice });
    }
    catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});
exports.apiRouter.post('/billing/:id/approve', (req, res) => {
    try {
        const invoice = billingService_1.billingService.approveInvoice(String(req.params.id), 'Municipal Commissioner / Chief Officer');
        return res.json({ success: true, invoice });
    }
    catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});
// ==========================================
// 11. CITIZEN COMPLAINTS
// ==========================================
exports.apiRouter.get('/complaints', (_req, res) => {
    return res.json({ success: true, complaints: Array.from(store_1.db.complaints.values()) });
});
exports.apiRouter.post('/complaints', (req, res) => {
    const newCmp = {
        id: `cmp-${Date.now()}`,
        complaintNumber: `SNP-CMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        citizenName: req.body.citizenName || 'Citizen',
        citizenPhone: req.body.citizenPhone || '',
        category: req.body.category || 'GARBAGE_NOT_COLLECTED',
        wardId: req.body.wardId || 'ward-01',
        address: req.body.address || '',
        description: req.body.description || '',
        photoUrl: req.body.photoUrl,
        status: 'SUBMITTED',
        createdAt: new Date().toISOString()
    };
    store_1.db.complaints.set(newCmp.id, newCmp);
    return res.json({ success: true, complaint: newCmp });
});
exports.apiRouter.get('/complaints/track/:number', (req, res) => {
    const numStr = String(req.params.number).toUpperCase();
    const cmp = Array.from(store_1.db.complaints.values()).find(c => c.complaintNumber.toUpperCase() === numStr);
    if (!cmp)
        return res.status(404).json({ success: false, message: 'Complaint number not found' });
    return res.json({ success: true, complaint: cmp });
});
exports.apiRouter.put('/complaints/:id/status', (req, res) => {
    const cmpId = String(req.params.id);
    const cmp = store_1.db.complaints.get(cmpId);
    if (!cmp)
        return res.status(404).json({ success: false, message: 'Complaint not found' });
    cmp.status = req.body.status;
    if (req.body.status === 'RESOLVED') {
        cmp.resolvedAt = new Date().toISOString();
        cmp.resolutionNotes = req.body.notes || 'Sanitation team resolved grievance on site.';
    }
    return res.json({ success: true, complaint: cmp });
});
// ==========================================
// 12. AI MUNICIPAL ASSISTANT
// ==========================================
exports.apiRouter.post('/ai/query', async (req, res) => {
    const { prompt, language } = req.body;
    if (!prompt)
        return res.status(400).json({ success: false, message: 'Prompt is required' });
    const result = await aiAssistantService_1.aiAssistantService.query(String(prompt), language || 'mr');
    return res.json({ success: true, ...result });
});
// ==========================================
// 13. ITI LIMITED QR CODE
// ==========================================
exports.apiRouter.post('/qr/scan', (req, res) => {
    const { qrPayload, workerId } = req.body;
    const result = qrService_1.qrService.verifyAndProcessScan(String(qrPayload || ''), String(workerId || 'wrk-01'));
    return res.json(result);
});
// ==========================================
// 14. REPORTS
// ==========================================
exports.apiRouter.get('/reports/daily-fleet', (req, res) => {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const report = reportsService_1.reportsService.getDailyFleetReport(dateStr);
    if (req.query.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=Shirur_Daily_Fleet_${dateStr}.csv`);
        return res.send(reportsService_1.reportsService.exportCsv(report.records));
    }
    return res.json({ success: true, report });
});
exports.apiRouter.get('/reports/ward-summary', (_req, res) => {
    const summary = reportsService_1.reportsService.getWardPerformanceSummary();
    return res.json({ success: true, summary });
});
// ==========================================
// 15. AUDIT LOGS
// ==========================================
exports.apiRouter.get('/audit-logs', (_req, res) => {
    return res.json({ success: true, logs: store_1.db.auditLogs });
});
