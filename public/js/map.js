// Leaflet GIS Mapping Engine for Shirur Smart ICCC

function initLeafletMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  if (state.map) {
    state.map.remove();
  }

  // Centered on Shirur Town
  state.map = L.map('map', {
    center: [18.8260, 74.3789],
    zoom: 14,
    zoomControl: false
  });

  L.control.zoom({ position: 'topright' }).addTo(state.map);

  // High-performance clean CartoDB Voyager Tile Layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(state.map);

  // Overlay Shirur Ward Boundaries
  state.wards.forEach(ward => {
    if (ward.boundary && ward.boundary.length > 0) {
      const polygon = L.polygon(ward.boundary, {
        color: '#10b981',
        weight: 1.5,
        fillColor: '#10b981',
        fillOpacity: 0.08
      }).addTo(state.map);
      polygon.bindTooltip(`<b>${ward.name}</b><br>Officer: ${ward.officerName}`, { sticky: true });
    }
  });

  // Overlay Dumping Ground Geofence
  state.geofences.forEach(gf => {
    if (gf.type === 'DUMPING_GROUND') {
      const poly = L.polygon(gf.polygon, {
        color: '#f59e0b',
        weight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 0.15,
        dashArray: '4, 4'
      }).addTo(state.map);
      poly.bindTooltip(`<b>${gf.name}</b>`, { sticky: true });
    }
  });

  updateMapMarkers();
}

function zoomToShirur() {
  if (state.map) {
    state.map.setView([18.8260, 74.3789], 14);
  }
}

function toggleGeofenceLayer() {
  showToast('Geofence boundary overlay active', 'info');
}

function updateMapMarkers() {
  if (!state.map) return;

  state.vehicles.forEach(vehicle => {
    const lat = vehicle.latitude;
    const lng = vehicle.longitude;

    let markerColor = '#10b981'; // Green for MOVING
    if (vehicle.status === 'STOPPED') {
      markerColor = '#ef4444'; // Red
    } else if (vehicle.status === 'IDLE') {
      markerColor = '#f59e0b'; // Amber
    } else if (vehicle.status === 'ROUTE_DEVIATION') {
      markerColor = '#ec4899'; // Pink
    } else if (vehicle.status === 'OFFLINE') {
      markerColor = '#64748b'; // Slate
    }

    const iconHtml = `
      <div style="background-color: ${markerColor};" class="w-7 h-7 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-bold ${vehicle.status === 'MOVING' ? 'marker-pulse-moving' : ''}">
        🚛
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    if (state.markers[vehicle.id]) {
      state.markers[vehicle.id].setLatLng([lat, lng]);
      state.markers[vehicle.id].setIcon(customIcon);
    } else {
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(state.map);
      marker.on('click', () => openVehicleDrawer(vehicle.id));
      state.markers[vehicle.id] = marker;
    }
  });
}
