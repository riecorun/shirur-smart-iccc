// Operational Views: Routes, Route Optimization, Geofences, Vehicles, Smart Bins, Toilets, Cleaning Tasks

function renderRoutes(container) {
  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Route Master & Waste Beat Planner</h2>
        <p class="text-xs text-slate-400">शिरूर नगर परिषद - कचरा संकलन मार्ग व बीट व्यवस्थापन</p>
      </div>
      <button onclick="showToast('KML Export Generated: Shirur_Ward_Routes.kml', 'success')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5">
        <i data-lucide="download" class="w-3.5 h-3.5"></i>
        <span>Export KML / GeoJSON</span>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${state.routes.map(r => `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-emerald-400">${r.id.toUpperCase()}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">${r.frequency}</span>
            </div>
            <h3 class="font-bold text-sm text-white mt-1">${r.routeName}</h3>
            <p class="text-xs text-slate-400 mt-0.5">${r.collectionType} • Vehicle: ${r.vehicleType}</p>
            
            <div class="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-800/50 p-2.5 rounded-lg">
              <div>
                <span class="text-slate-400">एकूण अंतर:</span>
                <span class="font-mono font-bold text-white ml-1">${r.distanceKm} km</span>
              </div>
              <div>
                <span class="text-slate-400">अंदाजे वेळ:</span>
                <span class="font-mono font-bold text-white ml-1">${r.estimatedMinutes} min</span>
              </div>
              <div class="col-span-2">
                <span class="text-slate-400">सुरुवात - शेवट:</span>
                <span class="text-slate-200 ml-1">${r.startPoint.name} ➔ ${r.endPoint.name}</span>
              </div>
            </div>

            <!-- Collection Points Sequence -->
            <div class="mt-3">
              <span class="text-[11px] font-semibold text-slate-400 uppercase">संकलन केंद्र (Collection Points - ${r.collectionPoints.length})</span>
              <div class="mt-1 space-y-1">
                ${r.collectionPoints.map(cp => `
                  <div class="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-800/30">
                    <span class="text-slate-300">${cp.sequence}. ${cp.name}</span>
                    <span class="${cp.isCollectedToday ? 'text-emerald-400 font-bold' : 'text-amber-400'} text-[11px]">
                      ${cp.isCollectedToday ? '✓ संकलित (' + cp.collectedAt + ')' : '⏳ शिल्लक'}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  container.innerHTML = html;
}

function renderRouteOptimization(container) {
  const html = `
    <div class="mb-4">
      <h2 class="text-lg font-bold text-white">AI-GIS Route Optimization Engine</h2>
      <p class="text-xs text-slate-400">वाहतूक कोंडी व इंधन बचतीसाठी AI-आधारित रूट ऑप्टिमायझेशन</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
        <h3 class="font-bold text-sm text-slate-200">ऑप्टिमायझेशन घटक (Inputs)</h3>
        <div>
          <label class="text-xs text-slate-400">मार्ग निवडा (Select Route)</label>
          <select id="opt-route-id" class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white">
            ${state.routes.map(r => `<option value="${r.id}">${r.routeName}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs text-slate-400">ऑप्टिमायझेशन प्राधान्य</label>
          <select class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white">
            <option>किमान इंधन व अंतर (Min Distance & Fuel)</option>
            <option>किमान वेळ (Min Time / Avoid Traffic)</option>
            <option>पूर्ण कचरा संकलन हमी (Max Coverage)</option>
          </select>
        </div>
        <button onclick="runAiRouteOptimization()" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs mt-2 shadow">
          🚀 Run AI Route Optimizer
        </button>
      </div>

      <!-- RESULTS COMPARISON CARD -->
      <div id="opt-results-card" class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <div>
          <h3 class="font-bold text-sm text-emerald-400">AI Optimization Results (Before vs After)</h3>
          <p class="text-xs text-slate-400 mt-0.5">Route: P01-R01 Ram Mandir Beat</p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div class="bg-slate-800/80 p-3 rounded-lg text-center">
              <span class="text-[11px] text-slate-400">अंतर बचत (Distance)</span>
              <div class="text-xl font-bold text-emerald-400 mt-1">2.2 km</div>
              <span class="text-[10px] text-emerald-500 font-mono">-18.2%</span>
            </div>
            <div class="bg-slate-800/80 p-3 rounded-lg text-center">
              <span class="text-[11px] text-slate-400">वेळ बचत (Time)</span>
              <div class="text-xl font-bold text-cyan-400 mt-1">26 min</div>
              <span class="text-[10px] text-cyan-500 font-mono">-14.4%</span>
            </div>
            <div class="bg-slate-800/80 p-3 rounded-lg text-center">
              <span class="text-[11px] text-slate-400">इंधन बचत (Fuel)</span>
              <div class="text-xl font-bold text-amber-400 mt-1">1.8 Liters</div>
              <span class="text-[10px] text-amber-500 font-mono">CNG/Diesel</span>
            </div>
            <div class="bg-slate-800/80 p-3 rounded-lg text-center">
              <span class="text-[11px] text-slate-400">कार्बन उत्सर्जन घट</span>
              <div class="text-xl font-bold text-purple-400 mt-1">4.8 kg</div>
              <span class="text-[10px] text-purple-500 font-mono">CO₂ Saved</span>
            </div>
          </div>
        </div>

        <div class="pt-4 flex justify-end space-x-2">
          <button onclick="showToast('Optimized route published to Driver Mobile App', 'success')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs">
            ✓ Publish to Driver App
          </button>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
}

async function runAiRouteOptimization() {
  const routeId = document.getElementById('opt-route-id')?.value;
  showToast('Running AI Genetic Algorithm on Shirur road network...', 'info');
  try {
    const res = await fetch('/api/routes/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeId })
    }).then(r => r.json());

    if (res.success) {
      showToast(`Optimization complete! Saved ${res.savings.distanceSavedKm} km and ${res.savings.fuelSavedLiters} L fuel.`, 'success');
    }
  } catch (err) {
    showToast('Optimization failed', 'error');
  }
}

function renderGeofencing(container) {
  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Geofence Master & Boundary Controls</h2>
        <p class="text-xs text-slate-400">शिरूर नगर परिषद कार्यक्षेत्र व डंपिंग यार्ड जिओफेन्स नियंत्रण</p>
      </div>
      <button onclick="showToast('Geofence drawing tool ready on map', 'info')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium">
        + Create New Geofence
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${state.geofences.map(g => `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-400 border border-purple-800">${g.type}</span>
            <span class="text-xs text-emerald-400 font-bold">● Active</span>
          </div>
          <h3 class="font-bold text-sm text-white mt-1.5">${g.name}</h3>
          <div class="mt-3 space-y-1.5 text-xs text-slate-300">
            <div class="flex justify-between">
              <span class="text-slate-400">कमाल गती मर्यादा (Speed Limit):</span>
              <span class="font-mono text-white">${g.speedLimitKmH ? g.speedLimitKmH + ' km/h' : 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">थांबण्याची कमाल मर्यादा (Max Dwell):</span>
              <span class="font-mono text-white">${g.maxDwellMinutes ? g.maxDwellMinutes + ' minutes' : 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Polygon Vertices:</span>
              <span class="font-mono text-slate-400">${g.polygon.length} points</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  container.innerHTML = html;
}

function renderVehicles(container) {
  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Vehicle & Fleet Master Register</h2>
        <p class="text-xs text-slate-400">विमा (Insurance), PUC, फिटनेस व इंधन क्षमता तपशील</p>
      </div>
      <button onclick="showToast('Open Add Vehicle Form', 'info')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium">
        + Add New Vehicle
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${state.vehicles.map(v => `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-mono font-bold text-white text-sm">🚛 ${v.registrationNumber}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">${v.vehicleType}</span>
          </div>

          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-400">इंधन प्रकार:</span>
              <span class="text-white">${v.fuelType} (${v.fuelTankCapacityLiters} L)</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">विमा वैधता (Insurance):</span>
              <span class="text-emerald-400 font-mono">${v.insuranceExpiry}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">PUC मुदत:</span>
              <span class="text-slate-200 font-mono">${v.pucExpiry}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">फिटनेस मुदत:</span>
              <span class="text-slate-200 font-mono">${v.fitnessExpiry}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  container.innerHTML = html;
}

function renderSmartBins(container) {
  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Smart IoT Waste Bins Monitoring</h2>
        <p class="text-xs text-slate-400">अल्ट्रासॉनिक सेन्सर्स व स्वयंचलित भरणा पातळी मॉनिटरिंग</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      ${state.bins.map(b => {
        let fillColor = 'text-emerald-400';
        let barColor = 'bg-emerald-500';
        if (b.fillLevelPct >= 80) {
          fillColor = 'text-amber-400';
          barColor = 'bg-amber-500';
        }
        if (b.fillLevelPct >= 90) {
          fillColor = 'text-rose-400';
          barColor = 'bg-rose-500';
        }

        return `
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-xs">
                <span class="font-mono font-bold text-slate-300">${b.binCode}</span>
                <span class="text-[10px] text-slate-400">${b.capacityLiters} L</span>
              </div>
              <h3 class="font-bold text-sm text-white mt-1">${b.locationName}</h3>
              
              <div class="mt-4">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-400">कचरा भरणा (Fill Level):</span>
                  <span class="font-bold ${fillColor}">${b.fillLevelPct}%</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div class="${barColor} h-2.5 rounded-full" style="width: ${b.fillLevelPct}%"></div>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                <span>🔋 Battery: ${b.batteryPct}%</span>
                <span>🌡️ Temp: ${b.temperatureC}°C</span>
              </div>
            </div>

            <button onclick="emptySmartBin('${b.id}')" class="mt-4 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium">
              कचरा गोळा झाला (Mark Emptied)
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
  container.innerHTML = html;
}

async function emptySmartBin(binId) {
  try {
    const res = await fetch('/api/bins/' + binId + '/empty', { method: 'PUT' }).then(r => r.json());
    if (res.success) {
      showToast(res.message, 'success');
      const bin = state.bins.find(b => b.id === binId);
      if (bin) bin.fillLevelPct = 5;
      navigate('smartBins');
    }
  } catch (err) {
    showToast('Failed to update bin', 'error');
  }
}

function renderToilets(container) {
  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Public Toilets & Sanitation Audit</h2>
        <p class="text-xs text-slate-400">स्वच्छता निर्देशांक, पाणी उपलब्धता व तपासणी शेड्युल</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${state.toilets.map(t => `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm text-white">🚻 ${t.name}</h3>
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              ⭐ ${t.cleanlinessScore} / 5.0
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-800/50 p-2.5 rounded-lg">
            <div>
              <span class="text-slate-400">पाणी उपलब्धता:</span>
              <span class="${t.waterAvailable ? 'text-emerald-400' : 'text-rose-400'} font-bold ml-1">${t.waterAvailable ? 'उपलब्ध (Yes)' : 'नाही (No)'}</span>
            </div>
            <div>
              <span class="text-slate-400">दुर्गंधी पातळी:</span>
              <span class="text-white ml-1">${t.odourLevel}</span>
            </div>
            <div>
              <span class="text-slate-400">शेवटची सफाई:</span>
              <span class="text-slate-200 ml-1">${t.lastCleanedAt}</span>
            </div>
            <div>
              <span class="text-slate-400">पुढील शेड्युल:</span>
              <span class="text-cyan-400 ml-1">${t.nextScheduledCleaning}</span>
            </div>
          </div>

          <button onclick="showToast('Audit recorded for ' + t.name, 'success')" class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium">
            ✓ Log Sanitation Inspection
          </button>
        </div>
      `).join('')}
    </div>
  `;
  container.innerHTML = html;
}

function renderCleaningTasks(container) {
  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Drain & Canal De-silting Monitoring</h2>
        <p class="text-xs text-slate-400">पावसाळापूर्व गटार व नाले सफाई प्रगती अहवाल</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${state.cleaningTasks.map(tsk => `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">${tsk.taskType}</span>
            <span class="text-xs ${tsk.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'} font-bold">● ${tsk.status}</span>
          </div>
          <h3 class="font-bold text-sm text-white">${tsk.locationName}</h3>
          <p class="text-xs text-slate-400">${tsk.notes || ''}</p>
          <div class="flex justify-between text-xs bg-slate-800/40 p-2 rounded">
            <span class="text-slate-400">काम मोजमाप:</span>
            <span class="font-bold text-white">${tsk.measurementValue} ${tsk.measurementUnit}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  container.innerHTML = html;
}
