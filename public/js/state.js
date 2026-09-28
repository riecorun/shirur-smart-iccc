const state = {
  currentView: 'dashboard',
  language: 'mr',
  currentRole: 'SUPER_ADMIN',
  vehicles: [],
  kpis: {},
  alerts: [],
  wards: [],
  routes: [],
  geofences: [],
  bins: [],
  toilets: [],
  cleaningTasks: [],
  complaints: [],
  contractors: [],
  invoices: [],
  settings: {},
  map: null,
  markers: {},
  geoLayers: [],
  socket: null
};

// Fetch Initial Data from REST API
async function loadInitialData() {
  try {
    const [kpiRes, vehRes, wardRes, routeRes, geoRes, alertRes, binRes, tltRes, tskRes, cmpRes, contRes, invRes, cfgRes] = await Promise.all([
      fetch('/api/fleet/kpis').then(r => r.json()),
      fetch('/api/vehicles').then(r => r.json()),
      fetch('/api/wards').then(r => r.json()),
      fetch('/api/routes').then(r => r.json()),
      fetch('/api/geofences').then(r => r.json()),
      fetch('/api/alerts').then(r => r.json()),
      fetch('/api/bins').then(r => r.json()),
      fetch('/api/toilets').then(r => r.json()),
      fetch('/api/cleaning-tasks').then(r => r.json()),
      fetch('/api/complaints').then(r => r.json()),
      fetch('/api/contractors').then(r => r.json()),
      fetch('/api/billing/invoices').then(r => r.json()),
      fetch('/api/config/admin').then(r => r.json())
    ]);

    state.kpis = kpiRes;
    state.vehicles = vehRes.vehicles || [];
    state.wards = wardRes.wards || [];
    state.routes = routeRes.routes || [];
    state.geofences = geoRes.geofences || [];
    state.alerts = alertRes.alerts || [];
    state.bins = binRes.bins || [];
    state.toilets = tltRes.toilets || [];
    state.cleaningTasks = tskRes.tasks || [];
    state.complaints = cmpRes.complaints || [];
    state.contractors = contRes.contractors || [];
    state.invoices = invRes.invoices || [];
    state.settings = cfgRes.settings || {};
  } catch (err) {
    console.error('Error loading initial data:', err);
  }
}

// Toast Notifications Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  let bg = 'bg-slate-800 border-slate-700 text-slate-100';
  if (type === 'success') bg = 'bg-emerald-950 border-emerald-800 text-emerald-200';
  if (type === 'error') bg = 'bg-rose-950 border-rose-800 text-rose-200';

  toast.className = `p-3 rounded-lg border text-xs shadow-xl transition-all duration-300 transform translate-y-2 opacity-0 flex items-center space-x-2 ${bg}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 50);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
