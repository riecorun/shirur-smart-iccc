// Main App Entrypoint

document.addEventListener('DOMContentLoaded', async () => {
  initClock();
  initSocket();
  await loadInitialData();
  navigate('dashboard');
  if (window.lucide) lucide.createIcons();
});

function initClock() {
  const clockEl = document.getElementById('live-clock');
  setInterval(() => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  }, 1000);
}

function initSocket() {
  state.socket = io();

  state.socket.on('connect', () => {
    console.log('[WS] Connected to Shirur ICCC Telemetry Gateway');
    const badge = document.getElementById('wialon-badge');
    if (badge) {
      badge.textContent = 'CONNECTED';
      badge.className = 'font-semibold text-emerald-400';
    }
  });

  state.socket.on('disconnect', () => {
    const badge = document.getElementById('wialon-badge');
    if (badge) {
      badge.textContent = 'OFFLINE';
      badge.className = 'font-semibold text-rose-400';
    }
  });

  state.socket.on('fleet:telemetry', data => {
    state.vehicles = data.vehicles;
    updateMapMarkers();
    updateKpis();
    if (state.currentView === 'dashboard') {
      const listEl = document.getElementById('dash-alerts-list');
      if (listEl) {
        listEl.innerHTML = renderAlertsList();
        if (window.lucide) lucide.createIcons();
      }
    } else if (state.currentView === 'liveFleet') {
      filterFleetTable();
    }
  });
}

function updateKpis() {
  const moving = state.vehicles.filter(v => v.status === 'MOVING').length;
  const stopped = state.vehicles.filter(v => v.status === 'STOPPED').length;
  const deviated = state.vehicles.filter(v => v.status === 'ROUTE_DEVIATION').length;

  const elMoving = document.getElementById('kpi-moving');
  const elStopped = document.getElementById('kpi-stopped');
  const elDeviated = document.getElementById('kpi-deviated');

  if (elMoving) elMoving.textContent = moving;
  if (elStopped) elStopped.textContent = stopped;
  if (elDeviated) elDeviated.textContent = deviated;
}

function setLanguage(lang) {
  state.language = lang;
  ['mr', 'en', 'hi'].forEach(l => {
    const btn = document.getElementById(`lang-${l}`);
    if (l === lang) {
      btn.className = 'px-2 py-1 rounded text-xs font-medium bg-emerald-600 text-white';
    } else {
      btn.className = 'px-2 py-1 rounded text-xs font-medium text-slate-400 hover:text-white';
    }
  });

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang][key]) {
      el.textContent = TRANSLATIONS[lang][key];
    }
  });

  navigate(state.currentView);
}

function onRoleChange(role) {
  state.currentRole = role;
  const roleEl = document.getElementById('session-role');
  roleEl.textContent = role.replace(/_/g, ' ');
  showToast('Role changed to: ' + role, 'info');
  if (role === 'CITIZEN') {
    navigate('citizenPortal');
  } else if (role === 'FIELD_WORKER') {
    navigate('workerApp');
  } else {
    navigate('dashboard');
  }
}

function navigate(viewName) {
  state.currentView = viewName;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('bg-emerald-600', 'text-white');
    el.classList.add('text-slate-300', 'hover:bg-slate-800', 'hover:text-white');
  });
  const activeBtn = document.getElementById(`nav-${viewName}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-emerald-600', 'text-white');
    activeBtn.classList.remove('text-slate-300', 'hover:bg-slate-800');
  }

  const container = document.getElementById('main-content');
  container.innerHTML = '';

  switch (viewName) {
    case 'dashboard':
      renderDashboard(container);
      break;
    case 'liveFleet':
      renderLiveFleet(container);
      break;
    case 'routes':
      renderRoutes(container);
      break;
    case 'routeOptimization':
      renderRouteOptimization(container);
      break;
    case 'geofencing':
      renderGeofencing(container);
      break;
    case 'vehicles':
      renderVehicles(container);
      break;
    case 'smartBins':
      renderSmartBins(container);
      break;
    case 'toilets':
      renderToilets(container);
      break;
    case 'cleaningTasks':
      renderCleaningTasks(container);
      break;
    case 'contractors':
      renderContractors(container);
      break;
    case 'billing':
      renderBilling(container);
      break;
    case 'complaints':
      renderComplaints(container);
      break;
    case 'aiAssistant':
      renderAiAssistant(container);
      break;
    case 'reports':
      renderReports(container);
      break;
    case 'workerApp':
      renderWorkerApp(container);
      break;
    case 'citizenPortal':
      renderCitizenPortal(container);
      break;
    case 'settings':
      renderSettings(container);
      break;
    default:
      renderDashboard(container);
  }

  if (window.lucide) lucide.createIcons();
}
