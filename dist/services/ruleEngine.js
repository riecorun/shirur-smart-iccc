"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ruleEngine = exports.RuleEngine = void 0;
const store_1 = require("../database/store");
class RuleEngine {
    processVehicleTelemetry(vehicle) {
        const { stoppedDurationThresholdMinutes, routeDeviationThresholdMeters } = store_1.db.settings;
        // Rule 1: Vehicle Stopped > Configurable Threshold (e.g. 10 Minutes)
        if ((vehicle.status === 'STOPPED' || vehicle.speed === 0) &&
            vehicle.currentStopDurationMinutes >= stoppedDurationThresholdMinutes) {
            this.triggerStoppageAlert(vehicle);
        }
        // Rule 2: Route Deviation Detection
        const route = store_1.db.routes.get(vehicle.routeId);
        if (route && route.path.length > 0 && vehicle.speed > 0) {
            const deviationMeters = (0, store_1.minDistanceToPathMeters)([vehicle.latitude, vehicle.longitude], route.path);
            if (deviationMeters > routeDeviationThresholdMeters) {
                vehicle.status = 'ROUTE_DEVIATION';
                this.triggerDeviationAlert(vehicle, Math.round(deviationMeters));
            }
        }
        // Rule 3: Geofence Check (Municipal Boundary)
        const boundary = store_1.db.geofences.get('geo-boundary');
        if (boundary && boundary.polygon.length > 0) {
            const isInside = (0, store_1.isPointInPolygon)([vehicle.latitude, vehicle.longitude], boundary.polygon);
            if (!isInside && vehicle.collectionStatus === 'IN_PROGRESS') {
                this.triggerGeofenceViolation(vehicle);
            }
        }
    }
    triggerStoppageAlert(vehicle) {
        const existing = Array.from(store_1.db.alerts.values()).find(a => a.vehicleId === vehicle.id && a.type === 'STOPPED_OVER_10_MIN' && a.status === 'OPEN');
        if (existing)
            return; // Prevent duplicate alerts
        const alertId = `alt-${Date.now()}`;
        const newAlert = {
            id: alertId,
            vehicleId: vehicle.id,
            wardId: vehicle.wardId,
            type: 'STOPPED_OVER_10_MIN',
            severity: 'WARNING',
            title: `वाहनाचा थांबा १० मिनिटांपेक्षा जास्त (${vehicle.registrationNumber})`,
            description: `वाहन ${vehicle.registrationNumber} (${vehicle.vehicleType}) हे मागील ${vehicle.currentStopDurationMinutes} मिनिटांपासून थांबले आहे. चालक संपर्क आवश्यक.`,
            status: 'OPEN',
            timestamp: new Date().toISOString(),
            autoCallTriggered: true,
            autoCallStatus: 'INITIATED'
        };
        store_1.db.alerts.set(alertId, newAlert);
        // Auto-calling IVR trigger
        store_1.db.autoCallLogs.unshift({
            id: `call-${Date.now()}`,
            alertId,
            vehicleId: vehicle.id,
            vehicleNumber: vehicle.registrationNumber,
            driverPhone: '+91 9822119900',
            callStatus: 'INITIATED',
            promptLanguage: 'mr',
            messageText: `नमस्कार, शिरूर नगर परिषद कमांड अँड कंट्रोल सेंटरवरून कॉल आहे. आपले वाहन ${vehicle.registrationNumber} १० मिनिटांपेक्षा जास्त वेळ थांबले आहे. कृपया थांबण्याचे कारण नोंदवा किंवा काम पूर्ववत सुरू करा.`,
            timestamp: new Date().toISOString()
        });
        console.log(`[RULE ENGINE] Alert STOPPED_OVER_10_MIN generated for ${vehicle.registrationNumber}. Auto-Call Dispatched.`);
    }
    triggerDeviationAlert(vehicle, deviationDistanceMeters) {
        const existing = Array.from(store_1.db.alerts.values()).find(a => a.vehicleId === vehicle.id && a.type === 'ROUTE_DEVIATION' && a.status === 'OPEN');
        if (existing)
            return;
        const alertId = `alt-${Date.now()}`;
        const newAlert = {
            id: alertId,
            vehicleId: vehicle.id,
            wardId: vehicle.wardId,
            type: 'ROUTE_DEVIATION',
            severity: 'CRITICAL',
            title: `मार्ग विचलन / Route Deviation (${vehicle.registrationNumber})`,
            description: `वाहन ${vehicle.registrationNumber} हे ठरवून दिलेल्या मार्गापासून ${deviationDistanceMeters} मीटर भरकटले आहे.`,
            status: 'OPEN',
            timestamp: new Date().toISOString(),
            autoCallTriggered: false
        };
        store_1.db.alerts.set(alertId, newAlert);
        console.log(`[RULE ENGINE] Alert ROUTE_DEVIATION generated for ${vehicle.registrationNumber}: ${deviationDistanceMeters}m off route.`);
    }
    triggerGeofenceViolation(vehicle) {
        const existing = Array.from(store_1.db.alerts.values()).find(a => a.vehicleId === vehicle.id && a.type === 'GEOFENCE_VIOLATION' && a.status === 'OPEN');
        if (existing)
            return;
        const alertId = `alt-${Date.now()}`;
        const newAlert = {
            id: alertId,
            vehicleId: vehicle.id,
            wardId: vehicle.wardId,
            type: 'GEOFENCE_VIOLATION',
            severity: 'CRITICAL',
            title: `नगरपरिषद हद्द उल्लंघन (${vehicle.registrationNumber})`,
            description: `वाहन ${vehicle.registrationNumber} शिरूर नगरपरिषद कार्यक्षेत्राबाहेर गेले आहे.`,
            status: 'OPEN',
            timestamp: new Date().toISOString(),
            autoCallTriggered: true,
            autoCallStatus: 'INITIATED'
        };
        store_1.db.alerts.set(alertId, newAlert);
    }
}
exports.RuleEngine = RuleEngine;
exports.ruleEngine = new RuleEngine();
