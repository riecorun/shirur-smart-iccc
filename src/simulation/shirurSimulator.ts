import { Server } from 'socket.io';
import { db } from '../database/store';
import { ruleEngine } from '../services/ruleEngine';

export class ShirurSimulator {
  private io: Server | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  public setSocketServer(io: Server) {
    this.io = io;
  }

  public start() {
    if (this.intervalId) return;

    console.log('[SIMULATOR] Shirur Municipal Telemetry Simulator active.');
    this.intervalId = setInterval(() => {
      this.tick();
    }, 4000); // 4-second updates
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
    const vehicles = Array.from(db.vehicles.values());

    for (const vehicle of vehicles) {
      if (vehicle.status === 'MOVING') {
        // Nudge position slightly along route
        const latDelta = (Math.random() - 0.48) * 0.0004;
        const lngDelta = (Math.random() - 0.48) * 0.0004;

        vehicle.latitude = parseFloat((vehicle.latitude + latDelta).toFixed(6));
        vehicle.longitude = parseFloat((vehicle.longitude + lngDelta).toFixed(6));
        vehicle.speed = Math.floor(14 + Math.random() * 18);
        vehicle.heading = Math.floor(Math.random() * 360);
        vehicle.ignition = true;
        vehicle.todayDistanceKm = parseFloat((vehicle.todayDistanceKm + 0.04).toFixed(2));
        vehicle.todayWorkingMinutes += 1;
        vehicle.currentStopDurationMinutes = 0;
        vehicle.lastGpsTimestamp = new Date().toISOString();

        // Update corresponding Wialon Unit position
        if (vehicle.wialonUnitId) {
          const unit = db.wialonUnits.get(vehicle.wialonUnitId);
          if (unit) {
            unit.lastPosition = {
              lat: vehicle.latitude,
              lng: vehicle.longitude,
              speed: vehicle.speed,
              course: vehicle.heading,
              altitude: 560,
              time: Math.floor(Date.now() / 1000)
            };
          }
        }

        // Run Rule Engine checks
        ruleEngine.processVehicleTelemetry(vehicle);
      } else if (vehicle.status === 'STOPPED') {
        vehicle.speed = 0;
        vehicle.ignition = false;
        vehicle.todayIdleMinutes += 1;
        vehicle.currentStopDurationMinutes += 1;
        vehicle.lastGpsTimestamp = new Date().toISOString();

        // Run Rule Engine checks (detects > 10 min stoppage)
        ruleEngine.processVehicleTelemetry(vehicle);
      } else if (vehicle.status === 'ROUTE_DEVIATION') {
        // Keeps moving in deviated area
        const latDelta = (Math.random() - 0.5) * 0.0003;
        const lngDelta = (Math.random() - 0.5) * 0.0003;
        vehicle.latitude = parseFloat((vehicle.latitude + latDelta).toFixed(6));
        vehicle.longitude = parseFloat((vehicle.longitude + lngDelta).toFixed(6));
        vehicle.todayDistanceKm = parseFloat((vehicle.todayDistanceKm + 0.03).toFixed(2));
        vehicle.lastGpsTimestamp = new Date().toISOString();

        ruleEngine.processVehicleTelemetry(vehicle);
      }
    }

    // Broadcast updated fleet over WebSocket
    if (this.io) {
      this.io.emit('fleet:telemetry', {
        timestamp: new Date().toISOString(),
        vehicles: Array.from(db.vehicles.values()),
        alertsCount: Array.from(db.alerts.values()).filter(a => a.status === 'OPEN').length
      });
    }
  }
}

export const shirurSimulator = new ShirurSimulator();
