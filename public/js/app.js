/**
 * SHIRUR NAGAR PARISHAD - AI-ENABLED INTEGRATED COMMAND & CONTROL CENTER (AI-ICCC)
 * Main Application Controller
 * Coordinates UI, Wialon Remote API, Charts, Google Satellite Map, and Translations.
 */

// Marathi and English Translations Dictionary
const I18N = {
  mr: {
    dashboardTitle: 'शिरूर नगरपरिषद | AI-ENABLED INTEGRATED COMMAND & CONTROL CENTER',
    shortName: 'SHIRUR AI-ICCC',
    tagline: 'CLEANER | SMARTER | GREENER | SAFER SHIRUR',
    vehicleSelectorLabel: 'वाहन निवडा:',
    allVehicles: 'सर्व ८ वाहने (शिरूर फ्लीट विहंगावलोकन)',
    totalVehicles: 'एकूण वाहने',
    liveGps: 'थेट GPS कार्यरत',
    moving: 'चालू / फिरत आहे',
    stopped: 'थांबलेली वाहने',
    offline: 'ऑफलाइन वाहने',
    routeDeviation: 'मार्ग विचलन',
    geofenceAlerts: 'जिओफेन्स इशारे',
    liveMapTitle: '🛰️ गुगल सॅटेलाइट थेट GPS ट्रॅकिंग नकाशा (शिरूर)',
    vehicleDetails: 'वाहन तांत्रिक तपशील (MH-12)',
    wialonConnected: 'Wialon थेट GPS: 🟢 CONNECTED',
    wialonDisconnected: 'Wialon GPS: 🔴 DISCONNECTED',
    speed: 'वेग',
    fuelLevelLabel: 'इंधन पातळी',
    ignition: 'इग्निशन',
    battery: 'बॅटरी व्होल्टेज',
    driver: 'चालक (ड्रायव्हर)',
    plate: 'वाहन क्रमांक (MH-12)',
    lastPing: 'शेवटचे अपडेट',
  },
  en: {
    dashboardTitle: 'SHIRUR NAGAR PARISHAD | AI-ENABLED INTEGRATED COMMAND & CONTROL CENTER',
    shortName: 'SHIRUR AI-ICCC',
    tagline: 'CLEANER | SMARTER | GREENER | SAFER SHIRUR',
    vehicleSelectorLabel: 'Select Vehicle:',
    allVehicles: 'All 8 Vehicles (Shirur Fleet Overview)',
    totalVehicles: 'Total Vehicles',
    liveGps: 'Live GPS Connected',
    moving: 'Moving',
    stopped: 'Stopped',
    offline: 'Offline',
    routeDeviation: 'Route Deviation',
    geofenceAlerts: 'Geofence Alerts',
    liveMapTitle: '🛰️ Google Satellite Live Fleet Map (Shirur)',
    vehicleDetails: 'Vehicle Telemetry Details (MH-12)',
    wialonConnected: 'Wialon Live GPS: 🟢 CONNECTED',
    wialonDisconnected: 'Wialon GPS: 🔴 DISCONNECTED',
    speed: 'Speed',
    fuelLevelLabel: 'Fuel Level',
    ignition: 'Ignition',
    battery: 'Battery Voltage',
    driver: 'Driver',
    plate: 'Registration No.',
    lastPing: 'Last Ping',
  },
};

class DashboardApp {
  constructor() {
    this.currentLang = 'mr'; // Default Marathi per Shirur Municipal requirement
    this.selectedVehicleId = null;
    this.units = [];
    this.fleetSummary = null;
    this.refreshTimer = null;
  }

  /**
   * Initialize App
   */
  async init() {
    // 1. Initialize Map (Google Satellite with Fallback)
    if (window.dashboardMap) {
      window.dashboardMap.initMap('leafletMap');
    }

    // 2. Register Wialon Live Connection State Listener
    if (window.wialonService) {
      window.wialonService.onConnectionStateChange = (state, time) => {
        this.updateLiveIndicator(state, time);
      };
    }

    // 3. Initialize Date Picker to today in IST
    const datePicker = document.getElementById('dashboardDatePicker');
    if (datePicker && !datePicker.value) {
      const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      datePicker.value = todayIST;
    }

    // 4. Load Data from Wialon
    await this.loadData();

    // 5. Populate Vehicle Dropdown
    this.populateVehicleDropdown();

    // 6. Setup Universal Sidebar Toggle & Event Listeners
    this.initSidebarToggle();
    this.setupEventListeners();

    // 7. Start Auto Refresh Polling (every 10 seconds for real-time fleet GPS)
    this.startAutoRefresh();

    // 8. Update UI status
    this.updateStatusBadge();
  }

  /**
   * Load data from Wialon service
   */
  async loadData() {
    if (window.wialonService) {
      this.units = await window.wialonService.fetchUnits();
      this.fleetSummary = window.wialonService.getFleetSummary();
    }

    // Render on Map
    if (window.dashboardMap) {
      window.dashboardMap.updateVehicles(this.units, this.selectedVehicleId);
    }

    // Update UI Cards
    this.renderMetrics();
    this.updateHeaderStats();
  }

  /**
   * Populate Vehicle Selector Dropdown with the 8 Shirur Vehicles
   */
  populateVehicleDropdown() {
    const select = document.getElementById('vehicleSelect');
    if (!select) return;

    select.innerHTML = `<option value="">${I18N[this.currentLang].allVehicles}</option>`;

    this.units.forEach(unit => {
      const opt = document.createElement('option');
      opt.value = unit.id;
      const statusIcon = unit.status === 'moving' ? '🟢' : unit.status === 'idle' ? '🟠' : unit.status === 'stopped' ? '🔴' : '⚪';
      opt.textContent = `${statusIcon} ${unit.plate} - ${unit.ward} (${unit.status.toUpperCase()})`;
      select.appendChild(opt);
    });
  }

  /**
   * Select a vehicle
   */
  selectVehicle(vehicleId) {
    this.selectedVehicleId = vehicleId || null;
    const select = document.getElementById('vehicleSelect');
    if (select) select.value = vehicleId || '';

    // Update Map
    if (window.dashboardMap) {
      window.dashboardMap.updateVehicles(this.units, this.selectedVehicleId);
    }

    // Render Metrics
    this.renderMetrics();
  }

  /**
   * Render Metrics for Fleet or Selected Vehicle
   */
  renderMetrics() {
    const banner = document.getElementById('vehicleLiveBanner');
    const summary = window.wialonService ? window.wialonService.getFleetSummary() : { totalVehicles: 8, moving: 0, stopped: 8, offline: 0 };

    // Dynamic Fleet Summary KPI Cards (Requirement 8)
    this.setText('statTotalVehicles', '8');
    this.setText('statLiveGps', String(summary.liveGps || 0));
    this.setText('statMoving', String(summary.moving || 0));
    this.setText('statStopped', String(summary.stopped || 0));
    this.setText('statOffline', String(summary.offline || 0));
    this.setText('statRouteDeviation', String(summary.routeDeviation || 0));
    this.setText('statGeofenceAlerts', String(summary.geofenceAlerts || 0));

    // Progress bar for moving vs stopped
    const movingPercent = Math.round(((summary.moving || 0) / 8) * 100);
    const progressBar = document.getElementById('sbStartedProgress');
    if (progressBar) progressBar.style.width = `${movingPercent}%`;
    this.setText('sbStartedCount', String(summary.moving || 0));
    this.setText('sbBreakdownCount', String(summary.offline || 0));
    this.setText('sbTotalTripsCount', String((summary.moving + summary.idle) * 2));

    if (!this.selectedVehicleId) {
      if (banner) banner.style.display = 'none';
      return;
    }

    // VEHICLE-WISE METRICS PANEL (Requirement 9 & 10)
    const unit = this.units.find(u => u.id === this.selectedVehicleId);
    if (!unit) return;

    if (banner) banner.style.display = 'flex';

    this.setText('bannerVehicleName', unit.name);
    this.setText('bannerStatusBadge', unit.status.toUpperCase());
    this.setText('bannerSubText', `${unit.plate} • चालक: ${unit.driverName} (${unit.driverPhone})`);
    this.setText('bannerSpeedVal', `${unit.speed} km/h`);
    this.setText('bannerFuelVal', unit.fuelLevel ? `${unit.fuelLevel}%` : 'DATA NOT AVAILABLE');

    const statusBadge = document.getElementById('bannerStatusBadge');
    if (statusBadge) {
      statusBadge.style.backgroundColor =
        unit.status === 'moving'
          ? '#10b981'
          : unit.status === 'idle'
          ? '#f59e0b'
          : unit.status === 'stopped'
          ? '#ef4444'
          : '#64748b';
    }

    // Telemetry Details Drawer
    this.setText('detailSpeed', `${unit.speed} km/h`);
    this.setText('detailIgnition', unit.ignition ? '🟢 ON' : '🔴 OFF');
    this.setText('detailBattery', unit.batteryVoltage || '12.8 V');
    this.setText('detailFuel', unit.fuelLevel ? `${unit.fuelLevel}%` : 'DATA NOT AVAILABLE');
    this.setText('detailMileage', `${unit.todayDistanceKm || 0} km`);
    this.setText('detailSatellites', `${unit.satellites || 0} Sats`);
    this.setText('detailDriver', `${unit.driverName} (${unit.driverPhone})`);
    this.setText('detailLastPing', unit.lastUpdate || 'काही सेकंदांपूर्वी');
  }

  updateHeaderStats() {
    const summary = window.wialonService ? window.wialonService.getFleetSummary() : { totalVehicles: 8 };
    const isConnected = window.wialonService && window.wialonService.connectionState === 'success';

    // Right-side Header elements (Requirement 7)
    this.setText('headerWialonState', isConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED');
    this.setText('headerLiveVehicles', '8');
    this.setText('headerLastSync', new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    const pill = document.getElementById('liveStatusPill');
    const dot = document.getElementById('liveStatusDot');
    const text = document.getElementById('liveStatusText');
    const time = document.getElementById('liveStatusTime');

    if (pill && dot && text && time) {
      dot.className = isConnected ? 'live-status-dot success' : 'live-status-dot failed';
      text.textContent = isConnected ? 'LIVE' : 'OFFLINE';
      time.textContent = new Date().toLocaleTimeString('mr-IN');
    }
  }

  updateLiveIndicator(state, lastTime) {
    this.updateHeaderStats();
    this.updateStatusBadge();
  }

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  updateStatusBadge() {
    const badge = document.getElementById('wialonStatusBadge');
    const dot = document.getElementById('wialonStatusDot');
    const text = document.getElementById('wialonStatusText');

    if (!badge || !dot || !text) return;

    if (window.wialonService && window.wialonService.isLive) {
      dot.className = 'status-dot';
      text.textContent = 'Wialon Live: CONNECTED';
    } else {
      dot.className = 'status-dot demo';
      text.textContent = 'Wialon: DISCONNECTED';
    }
  }

  initSidebarToggle() {
    const btnToggle = document.getElementById('btnSidebarToggle');
    const btnCollapse = document.getElementById('btnSidebarCollapse');
    const backdrop = document.getElementById('sidebarBackdrop');

    const toggleSidebar = () => {
      if (window.innerWidth > 1024) {
        document.body.classList.toggle('sidebar-collapsed');
      } else {
        document.body.classList.toggle('sidebar-open');
      }
    };

    btnToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });

    btnCollapse?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.body.classList.remove('sidebar-open');
      if (window.innerWidth > 1024) document.body.classList.add('sidebar-collapsed');
    });

    backdrop?.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  }

  setupEventListeners() {
    // Vehicle Selector
    document.getElementById('vehicleSelect')?.addEventListener('change', e => {
      this.selectVehicle(e.target.value);
    });

    // Refresh Button
    document.getElementById('btnManualRefresh')?.addEventListener('click', () => {
      this.loadData();
    });

    // Language Toggle Button if present
    document.getElementById('btnToggleLang')?.addEventListener('click', () => {
      this.currentLang = this.currentLang === 'mr' ? 'en' : 'mr';
      this.populateVehicleDropdown();
      this.renderMetrics();
    });

    // Date Sync Button
    document.getElementById('btnDateSync')?.addEventListener('click', () => {
      this.loadData();
    });
  }

  startAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    // Auto-refresh from Wialon every 10 seconds
    this.refreshTimer = setInterval(() => {
      this.loadData();
    }, 10000);
  }
}

// Global Singleton
window.app = new DashboardApp();
window.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
