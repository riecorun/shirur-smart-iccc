/**
 * Shirur Nagar Parishad – Report Database (IndexedDB)
 * Database Name: ShirurFleetDB
 * Persistent storage for daily reports, dumping ground geofence trips,
 * summaries, WhatsApp automation logs, fleet master, and audit history.
 */

class ReportDatabase {
  constructor() {
    this.dbName = 'ShirurFleetDB';
    this.dbVersion = 2;
    this.db = null;
    this.initPromise = this.init();
  }

  /**
   * Initialize IndexedDB with all required object stores and indexes
   */
  init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to localStorage');
        resolve(null);
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Daily Report Data (Key: [reportDate, vehicleId])
        if (!db.objectStoreNames.contains('daily_report_data')) {
          const dailyStore = db.createObjectStore('daily_report_data', { keyPath: ['reportDate', 'vehicleId'] });
          dailyStore.createIndex('reportDate', 'reportDate', { unique: false });
          dailyStore.createIndex('vehicleId', 'vehicleId', { unique: false });
          dailyStore.createIndex('plate', 'plate', { unique: false });
          dailyStore.createIndex('operationalStatus', 'operationalStatus', { unique: false });
          dailyStore.createIndex('breakdownStatus', 'breakdownStatus', { unique: false });
        }

        // 2. Geofence Trip Data (Key: [reportDate, vehicleId, tripNumber])
        if (!db.objectStoreNames.contains('geofence_trip_data')) {
          const tripStore = db.createObjectStore('geofence_trip_data', { keyPath: ['reportDate', 'vehicleId', 'tripNumber'] });
          tripStore.createIndex('reportDate', 'reportDate', { unique: false });
          tripStore.createIndex('vehicleId', 'vehicleId', { unique: false });
          tripStore.createIndex('plate', 'plate', { unique: false });
          tripStore.createIndex('validationStatus', 'validationStatus', { unique: false });
        }

        // 3. Report Summary Data (Key: reportDate)
        if (!db.objectStoreNames.contains('report_summary_data')) {
          const summaryStore = db.createObjectStore('report_summary_data', { keyPath: 'reportDate' });
          summaryStore.createIndex('reportDate', 'reportDate', { unique: true });
          summaryStore.createIndex('reportGeneratedTime', 'reportGeneratedTime', { unique: false });
        }

        // 4. WhatsApp Automation Log (Key: id autoIncrement)
        if (!db.objectStoreNames.contains('whatsapp_automation_log')) {
          const waStore = db.createObjectStore('whatsapp_automation_log', { keyPath: 'id', autoIncrement: true });
          waStore.createIndex('reportDate', 'reportDate', { unique: false });
          waStore.createIndex('whatsappSentTime', 'whatsappSentTime', { unique: false });
          waStore.createIndex('sendStatus', 'sendStatus', { unique: false });
        }

        // 5. Fleet Master (Key: plate)
        if (!db.objectStoreNames.contains('fleet_master')) {
          const fleetStore = db.createObjectStore('fleet_master', { keyPath: 'plate' });
          fleetStore.createIndex('wialonId', 'wialonId', { unique: false });
          fleetStore.createIndex('routeCode', 'routeCode', { unique: false });
          fleetStore.createIndex('vehicleType', 'vehicleType', { unique: false });
          fleetStore.createIndex('groupName', 'groupName', { unique: false });
        }

        // 6. Audit History (Key: id autoIncrement)
        if (!db.objectStoreNames.contains('audit_history')) {
          const auditStore = db.createObjectStore('audit_history', { keyPath: 'id', autoIncrement: true });
          auditStore.createIndex('reportDate', 'reportDate', { unique: false });
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('✓ ShirurFleetDB (IndexedDB) connected successfully');
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        resolve(null);
      };
    });
  }

  async getDb() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  /**
   * Save Daily Report Data (Vehicles + Summary)
   */
  async saveDailyReport(reportDate, vehicles, summary) {
    const db = await this.getDb();
    if (!db) {
      // LocalStorage fallback
      try {
        localStorage.setItem(`bmc_report_${reportDate}`, JSON.stringify({ vehicles, summary, savedAt: Date.now() }));
      } catch (e) {}
      return true;
    }

    return new Promise((resolve) => {
      const tx = db.transaction(['daily_report_data', 'report_summary_data', 'audit_history'], 'readwrite');
      const dailyStore = tx.objectStore('daily_report_data');
      const summaryStore = tx.objectStore('report_summary_data');
      const auditStore = tx.objectStore('audit_history');

      // Put vehicles
      if (Array.isArray(vehicles)) {
        vehicles.forEach(v => {
          dailyStore.put({
            reportDate: reportDate,
            vehicleId: v.vehicleId || v.id || v.plate,
            plate: v.plate,
            ward: v.ward || '',
            route: v.route || '',
            routeCode: v.routeCode || v.code || '',
            vehicleType: v.vehicleType || v.category || 'घंटागाडी',
            firstOperationalStartTime: v.firstOperationalStartTime || v.startTimeFormatted || v.time || '-',
            operationalStatus: v.operationalStatus || (v.validTrips > 0 || v.started ? 'Operational' : 'Zero Trip / Not Dispatched'),
            breakdownStatus: v.breakdownStatus || (v.isBreakdown ? 'Breakdown' : 'Normal'),
            daysOff: v.daysOff || 0,
            tripCount: v.tripCount !== undefined ? v.tripCount : (v.validTrips || 0),
            updatedAt: Date.now()
          });
        });
      }

      // Put summary
      if (summary) {
        summaryStore.put({
          reportDate: reportDate,
          totalVehiclesProcessed: summary.totalFleet || 50,
          vehiclesWithTrips: summary.activeVehicles || 0,
          vehiclesWithZeroTrips: summary.zeroTripVehiclesCount || 0,
          totalValidTrips: summary.totalValidTrips || 0,
          totalInvalidTrips: summary.totalInvalidTrips || 0,
          startedVehiclesCount: summary.startedVehiclesCount || 0,
          notStartedVehiclesCount: summary.notStartedVehiclesCount || 0,
          under7HoursCount: summary.under7HoursCount || 0,
          under4hGeofenceCount: summary.under4hGeofenceCount || 0,
          reportGeneratedTime: summary.generatedAtIST || new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
          timestamp: Date.now()
        });
      }

      // Log audit
      auditStore.add({
        reportDate: reportDate,
        action: 'REPORT_SAVED',
        totalVehicles: vehicles ? vehicles.length : 50,
        validTrips: summary ? summary.totalValidTrips : 0,
        timestamp: new Date().toISOString()
      });

      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => {
        console.error('Error saving daily report to IndexedDB:', e);
        resolve(false);
      };
    });
  }

  /**
   * Save Geofence Trips Data
   */
  async saveGeofenceTrips(reportDate, detailedTrips) {
    const db = await this.getDb();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(['geofence_trip_data'], 'readwrite');
      const store = tx.objectStore('geofence_trip_data');

      detailedTrips.forEach((t, index) => {
        store.put({
          reportDate: reportDate,
          vehicleId: t.vehicleId || t.plate,
          tripNumber: t.tripNumber || (index + 1),
          plate: t.plate,
          geofenceName: t.geofence || 'Shirur Waste Processing Plant',
          entryTimestamp: t.timeIn || t.entryTime,
          exitTimestamp: t.timeOut || t.exitTime,
          tripDuration: t.duration || '',
          intervalFromPrevTrip: t.interval || '',
          validationStatus: t.status || 'VALID',
          invalidReason: t.reason || '',
          timestamp: Date.now()
        });
      });

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  /**
   * Fetch Daily Report from Database for a specific Date
   */
  async getDailyReport(reportDate) {
    const db = await this.getDb();
    if (!db) {
      try {
        const item = localStorage.getItem(`bmc_report_${reportDate}`);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        return null;
      }
    }

    return new Promise((resolve) => {
      const tx = db.transaction(['daily_report_data', 'report_summary_data'], 'readonly');
      const dailyStore = tx.objectStore('daily_report_data');
      const summaryStore = tx.objectStore('report_summary_data');

      const dateIndex = dailyStore.index('reportDate');
      const vehiclesReq = dateIndex.getAll(reportDate);
      const summaryReq = summaryStore.get(reportDate);

      let vehicles = [];
      let summary = null;

      vehiclesReq.onsuccess = (e) => {
        vehicles = e.target.result || [];
      };

      summaryReq.onsuccess = (e) => {
        summary = e.target.result || null;
      };

      tx.oncomplete = () => {
        if (vehicles.length > 0 || summary) {
          resolve({ reportDate, vehicles, summary, fromDatabase: true });
        } else {
          resolve(null);
        }
      };

      tx.onerror = () => resolve(null);
    });
  }

  /**
   * Fetch Geofence Trips for a Date
   */
  async getGeofenceTrips(reportDate) {
    const db = await this.getDb();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction(['geofence_trip_data'], 'readonly');
      const store = tx.objectStore('geofence_trip_data');
      const dateIndex = store.index('reportDate');
      const req = dateIndex.getAll(reportDate);

      req.onsuccess = (e) => resolve(e.target.result || []);
      req.onerror = () => resolve([]);
    });
  }

  /**
   * Log WhatsApp Automation Dispatch
   */
  async logWhatsAppDispatch(logEntry) {
    const db = await this.getDb();
    const entry = {
      reportDate: logEntry.reportDate || new Date().toISOString().slice(0, 10),
      reportGeneratedTime: logEntry.reportGeneratedTime || new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      whatsappSentTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      recipient: logEntry.recipient || 'Shirur Municipal Fleet Group',
      sendStatus: logEntry.sendStatus || 'SUCCESS',
      errorMessage: logEntry.errorMessage || '',
      retryCount: logEntry.retryCount || 0,
      timestamp: Date.now()
    };

    // Save to localStorage as backup
    try {
      const currentLogs = JSON.parse(localStorage.getItem('wa_audit_logs') || '[]');
      currentLogs.unshift(entry);
      localStorage.setItem('wa_audit_logs', JSON.stringify(currentLogs.slice(0, 50)));
    } catch (e) {}

    if (!db) return true;

    return new Promise((resolve) => {
      const tx = db.transaction(['whatsapp_automation_log'], 'readwrite');
      const store = tx.objectStore('whatsapp_automation_log');
      store.add(entry);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  /**
   * Get WhatsApp Automation Logs
   */
  async getWhatsAppLogs(reportDate = null) {
    const db = await this.getDb();
    if (!db) {
      try {
        const logs = JSON.parse(localStorage.getItem('wa_audit_logs') || '[]');
        if (reportDate) return logs.filter(l => l.reportDate === reportDate);
        return logs;
      } catch (e) {
        return [];
      }
    }

    return new Promise((resolve) => {
      const tx = db.transaction(['whatsapp_automation_log'], 'readonly');
      const store = tx.objectStore('whatsapp_automation_log');
      const req = store.getAll();

      req.onsuccess = (e) => {
        let logs = e.target.result || [];
        if (reportDate) logs = logs.filter(l => l.reportDate === reportDate);
        logs.sort((a, b) => b.timestamp - a.timestamp);
        resolve(logs);
      };
      req.onerror = () => resolve([]);
    });
  }

  /**
   * Save Central Fleet Master
   */
  async saveFleetMaster(fleet) {
    const db = await this.getDb();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(['fleet_master'], 'readwrite');
      const store = tx.objectStore('fleet_master');
      fleet.forEach(v => store.put(v));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  /**
   * Get Fleet Master from DB
   */
  async getFleetMaster() {
    const db = await this.getDb();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction(['fleet_master'], 'readonly');
      const store = tx.objectStore('fleet_master');
      const req = store.getAll();
      req.onsuccess = (e) => resolve(e.target.result || []);
      req.onerror = () => resolve([]);
    });
  }
}

// Global instance
window.reportDatabase = new ReportDatabase();
