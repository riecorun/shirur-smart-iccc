"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.haversineDistanceMeters = haversineDistanceMeters;
exports.isPointInPolygon = isPointInPolygon;
exports.minDistanceToPathMeters = minDistanceToPathMeters;
const config_1 = require("../config");
// Spatial Math Utilities (PostGIS compatibility layer)
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of Earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function isPointInPolygon(point, polygon) {
    const [lat, lng] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
        if (intersect)
            inside = !inside;
    }
    return inside;
}
function minDistanceToPathMeters(point, path) {
    if (path.length === 0)
        return 0;
    let minDistance = Infinity;
    for (const p of path) {
        const dist = haversineDistanceMeters(point[0], point[1], p[0], p[1]);
        if (dist < minDistance)
            minDistance = dist;
    }
    return minDistance;
}
class DatabaseStore {
    users = new Map();
    wards = new Map();
    vehicles = new Map();
    routes = new Map();
    geofences = new Map();
    alerts = new Map();
    smartBins = new Map();
    toilets = new Map();
    cleaningTasks = new Map();
    complaints = new Map();
    contractors = new Map();
    invoices = new Map();
    wialonUnits = new Map();
    auditLogs = [];
    autoCallLogs = [];
    integrationLogs = [];
    settings = {
        municipalityName: config_1.CONFIG.municipality.name,
        municipalityTagline: config_1.CONFIG.municipality.tagline,
        headOfficeAddress: config_1.CONFIG.municipality.address,
        emergencyHelpline: config_1.CONFIG.municipality.emergencyPhone,
        stoppedDurationThresholdMinutes: config_1.CONFIG.thresholds.stoppedDurationMinutes,
        routeDeviationThresholdMeters: config_1.CONFIG.thresholds.routeDeviationMeters,
        overspeedThresholdKmH: config_1.CONFIG.thresholds.overspeedKmH,
        wialon: {
            serverType: 'WIALON_HOSTING',
            apiHost: config_1.CONFIG.wialon.apiUrl,
            token: config_1.CONFIG.wialon.token,
            user: 'shirur_admin',
            resourceId: 'SNP_RESOURCE_01',
            accountId: 'SNP_ACC_2026',
            syncIntervalSec: 10,
            enableLiveTracking: true,
            enableEvents: true,
            enableReports: true,
            enableGeofences: true,
            connectionStatus: 'CONNECTED',
            lastSyncTime: new Date().toISOString()
        },
        whatsAppEnabled: true,
        telegramEnabled: true,
        autoCallingEnabled: true
    };
    constructor() {
        this.seedData();
    }
    seedData() {
        // 1. Initial Users (with roles)
        const adminUser = {
            id: 'usr-admin',
            name: 'Dr. Prashant Patil',
            email: 'admin@shirurnp.gov.in',
            phone: '+91 9822001122',
            role: 'SUPER_ADMIN',
            language: 'mr',
            isActive: true,
            createdAt: new Date().toISOString()
        };
        const coUser = {
            id: 'usr-co',
            name: 'Shri. Ramesh Gaikwad (Chief Officer)',
            email: 'co@shirurnp.gov.in',
            phone: '+91 9422003344',
            role: 'MUNICIPAL_COMMISSIONER',
            language: 'mr',
            isActive: true,
            createdAt: new Date().toISOString()
        };
        const swmOfficer = {
            id: 'usr-swm',
            name: 'Sachin Shinde (Health / SWM Head)',
            email: 'swm@shirurnp.gov.in',
            phone: '+91 9890123456',
            role: 'HEALTH_SWM_OFFICER',
            language: 'mr',
            isActive: true,
            createdAt: new Date().toISOString()
        };
        const fleetMgr = {
            id: 'usr-fleet',
            name: 'Mahesh Jadhav (Fleet Manager)',
            email: 'fleet@shirurnp.gov.in',
            phone: '+91 9823456789',
            role: 'FLEET_MANAGER',
            language: 'en',
            isActive: true,
            createdAt: new Date().toISOString()
        };
        [adminUser, coUser, swmOfficer, fleetMgr].forEach(u => this.users.set(u.id, u));
        // 2. Shirur Wards (Realistic coordinates around Shirur 18.8260 N, 74.3789 E)
        const wardData = [
            {
                id: 'ward-01',
                wardNumber: 1,
                name: 'Ward 01 - Ram Mandir & Old Town',
                nameMr: 'प्रभाग क्र. १ - जुने शहर व राम मंदिर परिसर',
                officerName: 'Sanjay Deshmukh',
                officerPhone: '+91 9822114455',
                population: 5800,
                dailyWasteTargetKg: 1800,
                center: [18.8255, 74.3765],
                boundary: [
                    [18.828, 74.373],
                    [18.829, 74.379],
                    [18.823, 74.381],
                    [18.822, 74.374]
                ]
            },
            {
                id: 'ward-02',
                wardNumber: 2,
                name: 'Ward 02 - Baburao Nagar',
                nameMr: 'प्रभाग क्र. २ - बाबुराव नगर परिसर',
                officerName: 'Anita Kadam',
                officerPhone: '+91 9822116677',
                population: 6400,
                dailyWasteTargetKg: 2100,
                center: [18.831, 74.382],
                boundary: [
                    [18.834, 74.379],
                    [18.835, 74.386],
                    [18.828, 74.388],
                    [18.827, 74.381]
                ]
            },
            {
                id: 'ward-03',
                wardNumber: 3,
                name: 'Ward 03 - Market Yard & ST Stand',
                nameMr: 'प्रभाग क्र. ३ - मार्केट यार्ड व एसटी बस स्थानक परिसर',
                officerName: 'Vikas Jagtap',
                officerPhone: '+91 9822118899',
                population: 7200,
                dailyWasteTargetKg: 2600,
                center: [18.821, 74.384],
                boundary: [
                    [18.825, 74.381],
                    [18.824, 74.389],
                    [18.817, 74.387],
                    [18.818, 74.38]
                ]
            },
            {
                id: 'ward-04',
                wardNumber: 4,
                name: 'Ward 04 - Ghodnadi Riverfront',
                nameMr: 'प्रभाग क्र. ४ - घोडनदी रिव्हरफ्रंट व घाट परिसर',
                officerName: 'Pravin Thorat',
                officerPhone: '+91 9822223344',
                population: 5200,
                dailyWasteTargetKg: 1650,
                center: [18.817, 74.375],
                boundary: [
                    [18.822, 74.372],
                    [18.821, 74.379],
                    [18.813, 74.377],
                    [18.814, 74.371]
                ]
            },
            {
                id: 'ward-05',
                wardNumber: 5,
                name: 'Ward 05 - Pune-Nagar Highway Bypass',
                nameMr: 'प्रभाग क्र. ५ - पुणे-नगर महामार्ग बायपास परिसर',
                officerName: 'Rahul Salunke',
                officerPhone: '+91 9822335566',
                population: 8100,
                dailyWasteTargetKg: 2900,
                center: [18.835, 74.372],
                boundary: [
                    [18.84, 74.368],
                    [18.841, 74.377],
                    [18.832, 74.378],
                    [18.831, 74.369]
                ]
            }
        ];
        wardData.forEach(w => this.wards.set(w.id, w));
        // 3. Contractors
        const contractorsData = [
            {
                id: 'cont-01',
                name: 'M/s Clean Shirur Waste Management Ltd.',
                registrationNumber: 'MAH/PUN/SWM/2023/88',
                contactPerson: 'Sunil Bhosale',
                phone: '+91 9850112233',
                email: 'info@cleanshirur.com',
                vehicleCount: 8,
                assignedWards: ['ward-01', 'ward-02', 'ward-03'],
                monthlyContractValueInr: 450000,
                penaltyPerMissedTripInr: 1500,
                performanceScorePct: 94.2
            },
            {
                id: 'cont-02',
                name: 'Shivshambhu Sanitation & Green Services',
                registrationNumber: 'MAH/PUN/SWM/2024/104',
                contactPerson: 'Ganesh More',
                phone: '+91 9850445566',
                email: 'shivshambhu.swm@gmail.com',
                vehicleCount: 6,
                assignedWards: ['ward-04', 'ward-05'],
                monthlyContractValueInr: 320000,
                penaltyPerMissedTripInr: 1500,
                performanceScorePct: 91.5
            }
        ];
        contractorsData.forEach(c => this.contractors.set(c.id, c));
        // 4. Exactly 8 Real Shirur Wialon Units
        const vehiclesData = [
            {
                id: 'veh-601639146',
                registrationNumber: 'S MH 12 QW 8149 (407)',
                vehicleType: 'Tipper',
                wardId: 'ward-01',
                routeId: 'route-01',
                driverId: 'drv-01',
                contractorId: 'cont-01',
                gpsDeviceId: 'WIALON-GPS-601639146',
                wialonUnitId: 601639146,
                fuelType: 'DIESEL',
                fuelTankCapacityLiters: 90,
                currentFuelLevelLiters: 68,
                purchaseDate: '2023-04-10',
                insuranceExpiry: '2027-04-10',
                pucExpiry: '2026-11-20',
                fitnessExpiry: '2028-04-10',
                status: 'STOPPED',
                speed: 0,
                ignition: false,
                latitude: 18.8192549,
                longitude: 74.368375,
                heading: 0,
                lastGpsTimestamp: new Date().toISOString(),
                todayDistanceKm: 18.4,
                todayWorkingMinutes: 240,
                todayIdleMinutes: 25,
                todayStopsCount: 14,
                currentStopDurationMinutes: 15,
                routeCompliancePct: 96.5,
                collectionStatus: 'IN_PROGRESS'
            },
            {
                id: 'veh-601638334',
                registrationNumber: 'S MH 12 VT 2894',
                vehicleType: 'Ghantagadi',
                wardId: 'ward-02',
                routeId: 'route-01',
                driverId: 'drv-02',
                contractorId: 'cont-01',
                gpsDeviceId: 'WIALON-GPS-601638334',
                wialonUnitId: 601638334,
                fuelType: 'CNG',
                fuelTankCapacityLiters: 60,
                currentFuelLevelLiters: 48,
                purchaseDate: '2023-04-10',
                insuranceExpiry: '2027-04-10',
                pucExpiry: '2026-12-05',
                fitnessExpiry: '2028-04-10',
                status: 'STOPPED',
                speed: 0,
                ignition: false,
                latitude: 18.819305,
                longitude: 74.368465,
                heading: 0,
                lastGpsTimestamp: new Date().toISOString(),
                todayDistanceKm: 14.2,
                todayWorkingMinutes: 190,
                todayIdleMinutes: 18,
                todayStopsCount: 16,
                currentStopDurationMinutes: 12,
                routeCompliancePct: 94.0,
                collectionStatus: 'IN_PROGRESS'
            },
            {
                id: 'veh-601638245',
                registrationNumber: 'S MH 12 VT 2895',
                vehicleType: 'Ghantagadi',
                wardId: 'ward-02',
                routeId: 'route-01',
                driverId: 'drv-03',
                contractorId: 'cont-01',
                gpsDeviceId: 'WIALON-GPS-601638245',
                wialonUnitId: 601638245,
                fuelType: 'CNG',
                fuelTankCapacityLiters: 60,
                currentFuelLevelLiters: 45,
                purchaseDate: '2023-04-10',
                insuranceExpiry: '2027-04-10',
                pucExpiry: '2027-01-15',
                fitnessExpiry: '2028-04-10',
                status: 'STOPPED',
                speed: 0,
                ignition: false,
                latitude: 18.8193366,
                longitude: 74.3683083,
                heading: 0,
                lastGpsTimestamp: new Date().toISOString(),
                todayDistanceKm: 16.5,
                todayWorkingMinutes: 210,
                todayIdleMinutes: 22,
                todayStopsCount: 19,
                currentStopDurationMinutes: 11,
                routeCompliancePct: 95.2,
                collectionStatus: 'IN_PROGRESS'
            },
            {
                id: 'veh-601639156',
                registrationNumber: 'S MH 12 XM 6731',
                vehicleType: 'Ghantagadi',
                wardId: 'ward-03',
                routeId: 'route-01',
                driverId: 'drv-04',
                contractorId: 'cont-01',
                gpsDeviceId: 'WIALON-GPS-601639156',
                wialonUnitId: 601639156,
                fuelType: 'CNG',
                fuelTankCapacityLiters: 60,
                currentFuelLevelLiters: 52,
                purchaseDate: '2023-04-10',
                insuranceExpiry: '2027-04-10',
                pucExpiry: '2026-10-30',
                fitnessExpiry: '2028-04-10',
                status: 'STOPPED',
                speed: 0,
                ignition: false,
                latitude: 18.8193033,
                longitude: 74.368485,
                heading: 0,
                lastGpsTimestamp: new Date().toISOString(),
                todayDistanceKm: 22.1,
                todayWorkingMinutes: 280,
                todayIdleMinutes: 30,
                todayStopsCount: 22,
                currentStopDurationMinutes: 14,
                routeCompliancePct: 98.1,
                collectionStatus: 'IN_PROGRESS'
            },
            {
                id: 'veh-601639166',
                registrationNumber: 'S MH 12 XM 6994',
                vehicleType: 'Compactor',
                wardId: 'ward-01',
                routeId: 'route-01',
                driverId: 'drv-05',
                contractorId: 'cont-02',
                gpsDeviceId: 'WIALON-GPS-601639166',
                wialonUnitId: 601639166,
                fuelType: 'DIESEL',
                fuelTankCapacityLiters: 140,
                currentFuelLevelLiters: 105,
                purchaseDate: '2023-09-12',
                insuranceExpiry: '2027-09-12',
                pucExpiry: '2027-03-10',
                fitnessExpiry: '2028-09-12',
                status: 'STOPPED',
                speed: 0,
                ignition: false,
                latitude: 18.826225,
                longitude: 74.37598,
                heading: 0,
                lastGpsTimestamp: new Date().toISOString(),
                todayDistanceKm: 28.5,
                todayWorkingMinutes: 320,
                todayIdleMinutes: 45,
                todayStopsCount: 12,
                currentStopDurationMinutes: 10,
                routeCompliancePct: 97.0,
                collectionStatus: 'IN_PROGRESS'
            },
            {
                id: 'veh-601639142',
                registrationNumber: 'S MH 12 XM 6995',
                vehicleType: 'Ghantagadi',
                wardId: 'ward-04',
                routeId: 'route-01',
                driverId: 'drv-06',
                contractorId: 'cont-02',
                gpsDeviceId: 'WIALON-GPS-601639142',
                wialonUnitId: 601639142,
                fuelType: 'CNG',
                fuelTankCapacityLiters: 60,
                currentFuelLevelLiters: 40,
                purchaseDate: '2024-02-18',
                insuranceExpiry: '2028-02-18',
                pucExpiry: '2027-02-18',
                fitnessExpiry: '2029-02-18',
                status: 'STOPPED',
                speed: 0,
                ignition: false,
                latitude: 18.8192366,
                longitude: 74.3683666,
                heading: 0,
                lastGpsTimestamp: new Date().toISOString(),
                todayDistanceKm: 19.8,
                todayWorkingMinutes: 240,
                todayIdleMinutes: 28,
                todayStopsCount: 18,
                currentStopDurationMinutes: 12,
                routeCompliancePct: 93.4,
                collectionStatus: 'IN_PROGRESS'
            },
            {
                id: 'veh-601639160',
                registrationNumber: 'S MH 12 XM 6997',
                vehicleType: 'Ghantagadi',
                wardId: 'ward-05',
                routeId: 'route-01',
                driverId: 'drv-07',
                contractorId: 'cont-02',
                gpsDeviceId: 'WIALON-GPS-601639160',
                wialonUnitId: 601639160,
                fuelType: 'CNG',
                fuelTankCapacityLiters: 60,
                currentFuelLevelLiters: 44,
                purchaseDate: '2023-11-05',
                insuranceExpiry: '2027-11-05',
                pucExpiry: '2026-11-05',
                fitnessExpiry: '2028-11-05',
                status: 'STOPPED',
                speed: 0,
                ignition: false,
                latitude: 18.8192816,
                longitude: 74.368365,
                heading: 0,
                lastGpsTimestamp: new Date().toISOString(),
                todayDistanceKm: 21.0,
                todayWorkingMinutes: 260,
                todayIdleMinutes: 20,
                todayStopsCount: 15,
                currentStopDurationMinutes: 12,
                routeCompliancePct: 96.0,
                collectionStatus: 'IN_PROGRESS'
            },
            {
                id: 'veh-601639158',
                registrationNumber: 'S MH 12 XM 7019',
                vehicleType: 'Ghantagadi',
                wardId: 'ward-03',
                routeId: 'route-01',
                driverId: 'drv-08',
                contractorId: 'cont-01',
                gpsDeviceId: 'WIALON-GPS-601639158',
                wialonUnitId: 601639158,
                fuelType: 'CNG',
                fuelTankCapacityLiters: 60,
                currentFuelLevelLiters: 50,
                purchaseDate: '2023-11-05',
                insuranceExpiry: '2027-11-05',
                pucExpiry: '2026-11-05',
                fitnessExpiry: '2028-11-05',
                status: 'STOPPED',
                speed: 0,
                ignition: false,
                latitude: 18.8193416,
                longitude: 74.3684133,
                heading: 0,
                lastGpsTimestamp: new Date().toISOString(),
                todayDistanceKm: 18.2,
                todayWorkingMinutes: 230,
                todayIdleMinutes: 15,
                todayStopsCount: 17,
                currentStopDurationMinutes: 12,
                routeCompliancePct: 95.8,
                collectionStatus: 'IN_PROGRESS'
            }
        ];
        vehiclesData.forEach(v => {
            this.vehicles.set(v.id, v);
            // Seed corresponding Wialon Unit
            if (v.wialonUnitId) {
                this.wialonUnits.set(v.wialonUnitId, {
                    id: v.wialonUnitId,
                    name: `${v.registrationNumber} (${v.vehicleType})`,
                    imei: `86754302910${v.wialonUnitId}`,
                    hardwareType: 'Teltonika FMB920',
                    phone: '+919922883311',
                    mappedVehicleId: v.id,
                    connectionStatus: v.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
                    lastPosition: {
                        lat: v.latitude,
                        lng: v.longitude,
                        speed: v.speed,
                        course: v.heading,
                        altitude: 560,
                        time: Math.floor(Date.now() / 1000)
                    }
                });
            }
        });
        // 5. Routes Master
        const route1 = {
            id: 'route-01',
            routeName: 'P01-R01 - Ram Mandir to Gandhi Chowk Beat',
            wardId: 'ward-01',
            vehicleId: 'veh-01',
            vehicleType: 'Ghantagadi',
            startPoint: { name: 'Shirur Municipal Garage', lat: 18.822, lng: 74.374 },
            endPoint: { name: 'Gandhi Chowk Transfer Bay', lat: 18.828, lng: 74.379 },
            path: [
                [18.822, 74.374],
                [18.824, 74.375],
                [18.8258, 74.3768],
                [18.827, 74.378],
                [18.828, 74.379]
            ],
            collectionPoints: [
                { id: 'cp-101', sequence: 1, name: 'Ram Mandir Lane 1', latitude: 18.823, longitude: 74.3745, address: 'Near Ram Mandir Main Gate', isCollectedToday: true, collectedAt: '07:15 AM', qrAssetCode: 'ITI-QR-CP-101' },
                { id: 'cp-102', sequence: 2, name: 'Somwar Peth Corner', latitude: 18.8245, longitude: 74.3755, address: 'Somwar Peth Chowk', isCollectedToday: true, collectedAt: '07:42 AM', qrAssetCode: 'ITI-QR-CP-102' },
                { id: 'cp-103', sequence: 3, name: 'Bazaar Tal Ground', latitude: 18.8262, longitude: 74.377, address: 'Behind Vegetable Market', isCollectedToday: true, collectedAt: '08:10 AM', qrAssetCode: 'ITI-QR-CP-103' },
                { id: 'cp-104', sequence: 4, name: 'Shani Galli Residential', latitude: 18.8275, longitude: 74.3785, address: 'Shani Mandir Galli', isCollectedToday: false, qrAssetCode: 'ITI-QR-CP-104' }
            ],
            distanceKm: 8.4,
            estimatedMinutes: 180,
            collectionType: 'DOOR_TO_DOOR',
            frequency: 'DAILY_MORNING',
            driverId: 'drv-01',
            workerId: 'wrk-01',
            status: 'ACTIVE'
        };
        this.routes.set(route1.id, route1);
        // 6. Geofences
        const municipalBoundary = {
            id: 'geo-boundary',
            name: 'Shirur Municipal Jurisdiction Boundary',
            type: 'MUNICIPAL_BOUNDARY',
            polygon: [
                [18.845, 74.36],
                [18.846, 74.395],
                [18.81, 74.398],
                [18.808, 74.362]
            ],
            speedLimitKmH: 50,
            isActive: true
        };
        const dumpingGround = {
            id: 'geo-dumping',
            name: 'Shirur Solid Waste Processing Plant & Depot',
            type: 'DUMPING_GROUND',
            polygon: [
                [18.841, 74.388],
                [18.844, 74.392],
                [18.839, 74.394],
                [18.837, 74.389]
            ],
            maxDwellMinutes: 45,
            isActive: true
        };
        this.geofences.set(municipalBoundary.id, municipalBoundary);
        this.geofences.set(dumpingGround.id, dumpingGround);
        // 7. Active Alerts
        const alert1 = {
            id: 'alt-001',
            vehicleId: 'veh-02',
            wardId: 'ward-02',
            type: 'STOPPED_OVER_10_MIN',
            severity: 'WARNING',
            title: 'Vehicle Stopped > 10 Minutes on Active Route',
            description: 'Ghantagadi MH-12-SN-1002 has been stationary for 12 minutes at Baburao Nagar (Route P02-R01). Auto-calling initiated to driver.',
            status: 'OPEN',
            timestamp: new Date().toISOString(),
            autoCallTriggered: true,
            autoCallStatus: 'INITIATED'
        };
        const alert2 = {
            id: 'alt-002',
            vehicleId: 'veh-03',
            wardId: 'ward-03',
            type: 'ROUTE_DEVIATION',
            severity: 'CRITICAL',
            title: 'Route Deviation Detected (220 meters)',
            description: 'Tipper MH-12-SN-1003 deviated 220m from assigned beat P03-R01 near Market Yard bypass.',
            status: 'OPEN',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            autoCallTriggered: false
        };
        this.alerts.set(alert1.id, alert1);
        this.alerts.set(alert2.id, alert2);
        // 8. Smart IoT Waste Bins
        const smartBinsData = [
            { id: 'bin-01', binCode: 'SNP-BIN-101', wardId: 'ward-01', locationName: 'Ram Mandir Chowk', latitude: 18.825, longitude: 74.376, capacityLiters: 1100, fillLevelPct: 88, batteryPct: 92, temperatureC: 29.4, tiltAlert: false, fireAlert: false, lastPingTime: new Date().toISOString(), qrAssetCode: 'ITI-BIN-101', status: 'NEAR_FULL' },
            { id: 'bin-02', binCode: 'SNP-BIN-102', wardId: 'ward-02', locationName: 'Baburao Nagar Bus Stop', latitude: 18.831, longitude: 74.382, capacityLiters: 1100, fillLevelPct: 45, batteryPct: 84, temperatureC: 28.1, tiltAlert: false, fireAlert: false, lastPingTime: new Date().toISOString(), qrAssetCode: 'ITI-BIN-102', status: 'NORMAL' },
            { id: 'bin-03', binCode: 'SNP-BIN-103', wardId: 'ward-03', locationName: 'ST Stand Vegetable Yard', latitude: 18.821, longitude: 74.384, capacityLiters: 2400, fillLevelPct: 96, batteryPct: 78, temperatureC: 31.0, tiltAlert: false, fireAlert: false, lastPingTime: new Date().toISOString(), qrAssetCode: 'ITI-BIN-103', status: 'OVERFLOW' },
            { id: 'bin-04', binCode: 'SNP-BIN-104', wardId: 'ward-04', locationName: 'Ghodnadi Ghat Approach', latitude: 18.817, longitude: 74.375, capacityLiters: 1100, fillLevelPct: 30, batteryPct: 88, temperatureC: 27.5, tiltAlert: false, fireAlert: false, lastPingTime: new Date().toISOString(), qrAssetCode: 'ITI-BIN-104', status: 'NORMAL' }
        ];
        smartBinsData.forEach(b => this.smartBins.set(b.id, b));
        // 9. Public Toilets
        const toiletsData = [
            { id: 'tlt-01', toiletCode: 'SNP-PT-01', name: 'Gandhi Chowk Public Restroom', wardId: 'ward-01', latitude: 18.827, longitude: 74.378, maleSeats: 6, femaleSeats: 6, disabledFriendly: true, waterAvailable: true, lightingWorking: true, odourLevel: 'LOW', cleanlinessScore: 4.5, lastCleanedAt: '08:30 AM Today', nextScheduledCleaning: '01:30 PM Today', qrAssetCode: 'ITI-PT-01' },
            { id: 'tlt-02', toiletCode: 'SNP-PT-02', name: 'ST Stand Complex Toilet', wardId: 'ward-03', latitude: 18.821, longitude: 74.383, maleSeats: 8, femaleSeats: 8, disabledFriendly: true, waterAvailable: true, lightingWorking: true, odourLevel: 'MEDIUM', cleanlinessScore: 3.2, lastCleanedAt: '07:00 AM Today', nextScheduledCleaning: '12:00 PM Today', qrAssetCode: 'ITI-PT-02' }
        ];
        toiletsData.forEach(t => this.toilets.set(t.id, t));
        // 10. Cleaning Tasks (Drains & Canals)
        const tasksData = [
            { id: 'tsk-01', taskType: 'DRAIN', wardId: 'ward-01', locationName: 'Somwar Peth Main Storm Drain', latitude: 18.824, longitude: 74.376, assignedWorkerId: 'wrk-02', assignedVehicleId: 'veh-05', scheduledDate: '2026-09-28', status: 'IN_PROGRESS', measurementValue: 450, measurementUnit: 'Meters De-silted', notes: 'Pre-monsoon silt clearance' },
            { id: 'tsk-02', taskType: 'CANAL', wardId: 'ward-04', locationName: 'Ghodnadi Inflow Channel', latitude: 18.816, longitude: 74.373, assignedWorkerId: 'wrk-03', scheduledDate: '2026-09-28', status: 'COMPLETED', measurementValue: 800, measurementUnit: 'Meters Cleared', completedAt: '11:30 AM' }
        ];
        tasksData.forEach(t => this.cleaningTasks.set(t.id, t));
        // 11. Citizen Complaints
        const complaintsData = [
            { id: 'cmp-01', complaintNumber: 'SNP-CMP-2026-001', citizenName: 'Balasaheb Shirole', citizenPhone: '+91 9822998811', category: 'GARBAGE_NOT_COLLECTED', wardId: 'ward-01', address: 'Bazaar Tal Galli No. 3', description: 'Ghantagadi missed collection at our corner this morning.', status: 'IN_PROGRESS', assignedOfficerId: 'usr-swm', createdAt: new Date(Date.now() - 7200000).toISOString() },
            { id: 'cmp-02', complaintNumber: 'SNP-CMP-2026-002', citizenName: 'Sunita Mane', citizenPhone: '+91 9822998822', category: 'DRAIN_ISSUE', wardId: 'ward-02', address: 'Near Baburao Nagar School', description: 'Drain overflow due to plastic choking.', status: 'RESOLVED', resolutionNotes: 'Jetting machine dispatched and blockage cleared.', resolutionPhotoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400', citizenRating: 5, createdAt: new Date(Date.now() - 86400000).toISOString(), resolvedAt: new Date(Date.now() - 3600000).toISOString() }
        ];
        complaintsData.forEach(c => this.complaints.set(c.id, c));
        // 12. Monthly Billing Invoices
        const invoice1 = {
            id: 'inv-01',
            invoiceNumber: 'SNP-INV-2026-09-01',
            contractorId: 'cont-01',
            month: '2026-09',
            baseAmount: 450000,
            scheduledTrips: 720,
            completedTrips: 698,
            missedTrips: 22,
            stoppagePenalty: 7500,
            deviationPenalty: 9000,
            breakdownDeduction: 12000,
            netPayableAmount: 421500,
            status: 'VERIFIED',
            generatedAt: '2026-09-28T10:00:00Z'
        };
        this.invoices.set(invoice1.id, invoice1);
        // Initial Audit Log
        this.auditLogs.push({
            id: 'aud-001',
            userId: 'usr-admin',
            userName: 'Dr. Prashant Patil',
            action: 'SYSTEM_BOOT',
            entity: 'ICCC_CORE',
            timestamp: new Date().toISOString(),
            details: 'Shirur Nagar Parishad AI-ICCC Engine initialized successfully.'
        });
    }
}
exports.db = new DatabaseStore();
