"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = exports.ReportsService = void 0;
const store_1 = require("../database/store");
class ReportsService {
    getDailyFleetReport(dateStr) {
        const vehicles = Array.from(store_1.db.vehicles.values()).map(v => ({
            vehicleNumber: v.registrationNumber,
            type: v.vehicleType,
            ward: store_1.db.wards.get(v.wardId)?.name || v.wardId,
            route: store_1.db.routes.get(v.routeId)?.routeName || v.routeId,
            distanceKm: v.todayDistanceKm,
            workingHours: `${Math.floor(v.todayWorkingMinutes / 60)}h ${v.todayWorkingMinutes % 60}m`,
            idleTime: `${v.todayIdleMinutes}m`,
            stopsCount: v.todayStopsCount,
            compliancePct: `${v.routeCompliancePct}%`,
            status: v.status
        }));
        return {
            municipality: store_1.db.settings.municipalityName,
            reportType: 'Daily Fleet & Waste Collection Report',
            date: dateStr,
            generatedAt: new Date().toISOString(),
            totalVehicles: vehicles.length,
            records: vehicles
        };
    }
    getWardPerformanceSummary() {
        return Array.from(store_1.db.wards.values()).map(w => {
            const wardVehicles = Array.from(store_1.db.vehicles.values()).filter(v => v.wardId === w.id);
            const routes = Array.from(store_1.db.routes.values()).filter(r => r.wardId === w.id);
            let totalPts = 0;
            let completedPts = 0;
            routes.forEach(r => {
                totalPts += r.collectionPoints.length;
                completedPts += r.collectionPoints.filter(p => p.isCollectedToday).length;
            });
            return {
                wardNumber: w.wardNumber,
                wardName: w.name,
                officer: w.officerName,
                phone: w.officerPhone,
                vehiclesAssigned: wardVehicles.length,
                dailyTargetKg: w.dailyWasteTargetKg,
                collectionProgressPct: totalPts > 0 ? Math.round((completedPts / totalPts) * 100) : 0,
                openComplaints: Array.from(store_1.db.complaints.values()).filter(c => c.wardId === w.id && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length
            };
        });
    }
    exportCsv(data) {
        if (data.length === 0)
            return '';
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','));
        return [headers.join(','), ...rows].join('\n');
    }
}
exports.ReportsService = ReportsService;
exports.reportsService = new ReportsService();
