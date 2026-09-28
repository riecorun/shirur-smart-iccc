import { db } from '../database/store';

export class ReportsService {
  public getDailyFleetReport(dateStr: string) {
    const vehicles = Array.from(db.vehicles.values()).map(v => ({
      vehicleNumber: v.registrationNumber,
      type: v.vehicleType,
      ward: db.wards.get(v.wardId)?.name || v.wardId,
      route: db.routes.get(v.routeId)?.routeName || v.routeId,
      distanceKm: v.todayDistanceKm,
      workingHours: `${Math.floor(v.todayWorkingMinutes / 60)}h ${v.todayWorkingMinutes % 60}m`,
      idleTime: `${v.todayIdleMinutes}m`,
      stopsCount: v.todayStopsCount,
      compliancePct: `${v.routeCompliancePct}%`,
      status: v.status
    }));

    return {
      municipality: db.settings.municipalityName,
      reportType: 'Daily Fleet & Waste Collection Report',
      date: dateStr,
      generatedAt: new Date().toISOString(),
      totalVehicles: vehicles.length,
      records: vehicles
    };
  }

  public getWardPerformanceSummary() {
    return Array.from(db.wards.values()).map(w => {
      const wardVehicles = Array.from(db.vehicles.values()).filter(v => v.wardId === w.id);
      const routes = Array.from(db.routes.values()).filter(r => r.wardId === w.id);
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
        openComplaints: Array.from(db.complaints.values()).filter(c => c.wardId === w.id && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length
      };
    });
  }

  public exportCsv(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}

export const reportsService = new ReportsService();
