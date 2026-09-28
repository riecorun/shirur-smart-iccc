// Core Views: Dashboard, Live Fleet, Drawer

function renderDashboard(container) {
  const t = TRANSLATIONS[state.language];

  const html = `
    <!-- TOP KPI TELEMETRY CARDS -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-medium text-slate-400 uppercase">${t.kpi_total}</span>
        <div class="flex items-baseline justify-between mt-2">
          <span id="kpi-total" class="text-2xl font-black text-white">${state.vehicles.length}</span>
          <span class="text-xs text-slate-500 font-mono">100%</span>
        </div>
      </div>
      <div class="bg-slate-900 border border-emerald-900/60 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-medium text-emerald-400 uppercase">${t.kpi_active}</span>
        <div class="flex items-baseline justify-between mt-2">
          <span id="kpi-moving" class="text-2xl font-black text-emerald-400">${state.vehicles.filter(v => v.status === 'MOVING').length}</span>
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </div>
      </div>
      <div class="bg-slate-900 border border-amber-900/60 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-medium text-amber-400 uppercase">${t.kpi_stopped}</span>
        <div class="flex items-baseline justify-between mt-2">
          <span id="kpi-stopped" class="text-2xl font-black text-amber-400">${state.vehicles.filter(v => v.status === 'STOPPED').length}</span>
          <span class="text-[11px] text-amber-500">Auto-Call</span>
        </div>
      </div>
      <div class="bg-slate-900 border border-rose-900/60 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-medium text-rose-400 uppercase">${t.kpi_deviated}</span>
        <div class="flex items-baseline justify-between mt-2">
          <span id="kpi-deviated" class="text-2xl font-black text-rose-400">${state.vehicles.filter(v => v.status === 'ROUTE_DEVIATION').length}</span>
          <span class="text-[11px] text-rose-500">Deviation</span>
        </div>
      </div>
      <div class="bg-slate-900 border border-cyan-900/60 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-medium text-cyan-400 uppercase">${t.kpi_collection}</span>
        <div class="flex items-baseline justify-between mt-2">
          <span id="kpi-collection" class="text-2xl font-black text-cyan-400">75%</span>
          <span class="text-[11px] text-cyan-500">3/4 Beats</span>
        </div>
      </div>
      <div class="bg-slate-900 border border-purple-900/60 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-medium text-purple-400 uppercase">${t.kpi_alerts}</span>
        <div class="flex items-baseline justify-between mt-2">
          <span id="kpi-alerts" class="text-2xl font-black text-purple-400">${state.alerts.filter(a => a.status === 'OPEN').length}</span>
          <span class="text-[11px] text-purple-500">Live</span>
        </div>
      </div>
    </div>

    <!-- MAIN DASHBOARD SPLIT: GIS MAP + COMMAND PANELS -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
      
      <!-- MAIN GIS COMMAND MAP (3 COLUMNS) -->
      <div class="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col relative shadow-lg">
        <div class="h-10 bg-slate-800/80 px-4 flex items-center justify-between text-xs border-b border-slate-700">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-bold text-slate-200">SHIRUR REAL-TIME GIS FLEET MAP</span>
            <span class="text-slate-400 font-mono">| Lat: 18.8260 N, Lng: 74.3789 E</span>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="zoomToShirur()" class="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px]">Center Shirur</button>
            <button onclick="toggleGeofenceLayer()" class="px-2 py-0.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded text-[11px]">Geofences</button>
          </div>
        </div>
        <div id="map" class="flex-1 w-full"></div>
        
        <!-- Live Alert Banner at bottom of map if critical alerts exist -->
        <div id="map-alert-ticker" class="absolute bottom-2 left-2 right-2 bg-slate-900/95 border border-amber-600/80 rounded-lg p-2.5 flex items-center justify-between text-xs z-[400] backdrop-blur">
          <div class="flex items-center space-x-2">
            <span class="text-amber-400 animate-bounce font-bold">⚠️ अलर्ट:</span>
            <span class="text-slate-200" id="ticker-text">वाहन MH-12-SN-1002 (बाबुराव नगर) १० मिनिटांपेक्षा जास्त थांबले आहे. ऑटो-कॉल पाठवला.</span>
          </div>
          <button onclick="navigate('complaints')" class="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-medium">तपशील पहा</button>
        </div>
      </div>

      <!-- RIGHT COMMAND PANELS (1 COLUMN) -->
      <div class="flex flex-col space-y-4">
        
        <!-- LIVE ALERT STREAM & AUTO-CALL STATUS -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col flex-1 shadow-sm">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 class="font-bold text-xs text-slate-200 uppercase tracking-wide flex items-center space-x-1.5">
              <i data-lucide="bell-ring" class="w-3.5 h-3.5 text-amber-400"></i>
              <span>Active Alerts & Auto-Calls</span>
            </h4>
            <span class="bg-amber-950 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-mono">${state.alerts.length}</span>
          </div>
          <div id="dash-alerts-list" class="space-y-2 mt-3 overflow-y-auto max-h-48 text-xs">
            ${renderAlertsList()}
          </div>
        </div>

        <!-- MUNICIPAL CCTV / WEIGHBRIDGE INTEGRATION PREVIEW -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col shadow-sm">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 class="font-bold text-xs text-slate-200 uppercase tracking-wide flex items-center space-x-1.5">
              <i data-lucide="video" class="w-3.5 h-3.5 text-cyan-400"></i>
              <span>CCTV / Solid Waste Yard</span>
            </h4>
            <span class="text-[10px] text-emerald-400 font-mono">CAM-01 LIVE</span>
          </div>
          <div class="mt-2.5 relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 aspect-video flex items-center justify-center">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
            <img src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400" alt="CCTV Stream" class="w-full h-full object-cover opacity-60">
            <div class="absolute bottom-2 left-2 z-20 text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>DUMPING GROUND ENTRY GATE</span>
            </div>
          </div>
        </div>

        <!-- QUICK MUNICIPAL ACTIONS -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
          <h4 class="font-bold text-xs text-slate-400 uppercase tracking-wide mb-2">Quick Actions</h4>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="navigate('aiAssistant')" class="p-2 bg-fuchsia-950/40 border border-fuchsia-800/60 rounded-lg text-left hover:bg-fuchsia-900/40 transition">
              <div class="text-[11px] font-semibold text-fuchsia-300">🤖 AI Assistant</div>
              <div class="text-[10px] text-slate-400">Ask in Marathi</div>
            </button>
            <button onclick="navigate('reports')" class="p-2 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-left hover:bg-emerald-900/40 transition">
              <div class="text-[11px] font-semibold text-emerald-300">📊 Daily Report</div>
              <div class="text-[10px] text-slate-400">Export CSV</div>
            </button>
          </div>
        </div>

      </div>

    </div>
  `;

  container.innerHTML = html;
  initLeafletMap();
}

function renderAlertsList() {
  if (state.alerts.length === 0) {
    return `<div class="text-slate-500 text-center py-4">कोणतेही प्रलंबित अलर्ट्स नाहीत (No alerts)</div>`;
  }
  return state.alerts.map(a => `
    <div class="p-2.5 rounded-lg border ${a.severity === 'CRITICAL' ? 'bg-rose-950/30 border-rose-800/60' : 'bg-amber-950/30 border-amber-800/60'}">
      <div class="flex items-center justify-between font-semibold text-[11px]">
        <span class="${a.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}">${a.title}</span>
        <span class="text-[10px] text-slate-400">${new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <p class="text-[11px] text-slate-300 mt-1">${a.description}</p>
      ${a.autoCallTriggered ? `<div class="mt-1.5 text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
        <i data-lucide="phone-outgoing" class="w-3 h-3"></i>
        <span>Auto-Call Dispatched: ${a.autoCallStatus || 'ANSWERED'}</span>
      </div>` : ''}
    </div>
  `).join('');
}

function renderLiveFleet(container) {
  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Live Fleet Tracking & Wialon Monitoring</h2>
        <p class="text-xs text-slate-400">शिरूर नगर परिषद - थेट वाहन निरीक्षण व GPS स्थिती</p>
      </div>
      <div class="flex items-center space-x-2">
        <input type="text" id="fleet-search" oninput="filterFleetTable()" placeholder="वाहन क्रमांक शोधा (Search MH-12...)" class="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 w-60">
        <select id="ward-filter" onchange="filterFleetTable()" class="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-300">
          <option value="ALL">सर्व प्रभाग (All Wards)</option>
          ${state.wards.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- FLEET TABLE -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
            <tr>
              <th class="p-3">वाहन क्रमांक (Vehicle)</th>
              <th class="p-3">प्रकार (Type)</th>
              <th class="p-3">प्रभाग (Ward)</th>
              <th class="p-3">स्थिती (Status)</th>
              <th class="p-3">गती (Speed)</th>
              <th class="p-3">आजचे अंतर (Km)</th>
              <th class="p-3">थांबण्याचा कालावधी</th>
              <th class="p-3">अनुपालन (Compliance)</th>
              <th class="p-3 text-right">कृती (Actions)</th>
            </tr>
          </thead>
          <tbody id="fleet-table-body" class="divide-y divide-slate-800">
            ${renderFleetTableRows(state.vehicles)}
          </tbody>
        </table>
      </div>
    </div>
  `;
  container.innerHTML = html;
}

function renderFleetTableRows(vehicles) {
  return vehicles.map(v => {
    let badgeClass = 'bg-emerald-950 text-emerald-400 border border-emerald-800';
    if (v.status === 'STOPPED') badgeClass = 'bg-rose-950 text-rose-400 border border-rose-800';
    if (v.status === 'IDLE') badgeClass = 'bg-amber-950 text-amber-400 border border-amber-800';
    if (v.status === 'ROUTE_DEVIATION') badgeClass = 'bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-800';
    if (v.status === 'OFFLINE') badgeClass = 'bg-slate-800 text-slate-400 border border-slate-700';

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="p-3 font-mono font-bold text-white flex items-center space-x-2">
          <span>🚛</span>
          <span>${v.registrationNumber}</span>
        </td>
        <td class="p-3 text-slate-300">${v.vehicleType}</td>
        <td class="p-3 text-slate-400">${v.wardName || v.wardId}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${badgeClass}">
            ${v.status}
          </span>
        </td>
        <td class="p-3 font-mono text-slate-200">${v.speed} km/h</td>
        <td class="p-3 font-mono text-slate-200">${v.todayDistanceKm} km</td>
        <td class="p-3 font-mono ${v.currentStopDurationMinutes >= 10 ? 'text-rose-400 font-bold' : 'text-slate-400'}">
          ${v.currentStopDurationMinutes} min ${v.currentStopDurationMinutes >= 10 ? '⚠️' : ''}
        </td>
        <td class="p-3 font-mono text-emerald-400">${v.routeCompliancePct}%</td>
        <td class="p-3 text-right space-x-1">
          <button onclick="openVehicleDrawer('${v.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px]">
            तपशील
          </button>
          <button onclick="playHistoricalRoute('${v.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]">
            Replay
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterFleetTable() {
  const query = (document.getElementById('fleet-search')?.value || '').toLowerCase();
  const ward = document.getElementById('ward-filter')?.value || 'ALL';

  const filtered = state.vehicles.filter(v => {
    const matchesQuery = v.registrationNumber.toLowerCase().includes(query) || v.vehicleType.toLowerCase().includes(query);
    const matchesWard = ward === 'ALL' || v.wardId === ward;
    return matchesQuery && matchesWard;
  });

  const tbody = document.getElementById('fleet-table-body');
  if (tbody) tbody.innerHTML = renderFleetTableRows(filtered);
}


function openVehicleDrawer(vehicleId) {
  const vehicle = state.vehicles.find(v => v.id === vehicleId || v.wialonUnitId === Number(vehicleId));
  if (!vehicle) return;

  const drawer = document.getElementById('vehicle-drawer');
  const numEl = document.getElementById('drawer-veh-num');
  const contentEl = document.getElementById('drawer-content');

  numEl.textContent = vehicle.registrationNumber;
  contentEl.innerHTML = `
    <div class="bg-slate-800/80 p-3 rounded-lg space-y-2 font-mono">
      <div class="flex justify-between">
        <span class="text-slate-400">Vehicle Number:</span>
        <span class="text-white font-bold">${vehicle.registrationNumber}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Wialon Unit ID:</span>
        <span class="text-cyan-400 font-bold">${vehicle.wialonUnitId || 'N/A'}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">GPS Device:</span>
        <span class="text-slate-300">${vehicle.gpsDeviceId || 'Teltonika FMB920'}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Status:</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${vehicle.status === 'MOVING' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}">${vehicle.status}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Speed:</span>
        <span class="text-emerald-400 font-bold">${vehicle.speed} km/h</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Latitude, Longitude:</span>
        <span class="text-slate-200 text-[11px]">${vehicle.latitude.toFixed(6)}, ${vehicle.longitude.toFixed(6)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Last GPS Update:</span>
        <span class="text-slate-300 text-[11px]">${new Date(vehicle.lastGpsTimestamp).toLocaleTimeString()}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Today's Distance:</span>
        <span class="text-white font-bold">${vehicle.todayDistanceKm} km</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Working Hours:</span>
        <span class="text-white font-bold">${Math.floor(vehicle.todayWorkingMinutes / 60)}h ${vehicle.todayWorkingMinutes % 60}m</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Idle Time:</span>
        <span class="text-amber-400 font-bold">${vehicle.todayIdleMinutes} minutes</span>
      </div>
    </div>

    <div class="pt-2 flex space-x-2">
      <button onclick="playHistoricalRoute('${vehicle.id}')" class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs">
        ▶ Trip Playback
      </button>
      <button onclick="showToast('Voice call dispatched to driver of ' + vehicle.registrationNumber, 'success')" class="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-xs">
        📞 Call Driver
      </button>
    </div>
  `;

  drawer.classList.remove('hidden');
}


function closeVehicleDrawer() {
  document.getElementById('vehicle-drawer').classList.add('hidden');
}

async function playHistoricalRoute(vehicleId) {
  closeVehicleDrawer();
  navigate('dashboard');
  showToast(`Loading GPS route replay for ${vehicleId}...`, 'info');
  try {
    const res = await fetch(`/api/vehicles/${vehicleId}/history`).then(r => r.json());
    if (res.success && res.playbackTrail && state.map) {
      const latlngs = res.playbackTrail.map(p => [p.lat, p.lng]);
      const polyline = L.polyline(latlngs, { color: '#06b6d4', weight: 4, dashArray: '6, 6' }).addTo(state.map);
      state.map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      showToast(`Showing GPS trail for ${res.vehicleNumber}`, 'success');
    }
  } catch (err) {
    showToast('Failed to load playback trail', 'error');
  }
}
