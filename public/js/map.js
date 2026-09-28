/**
 * SHIRUR NAGAR PARISHAD - AI-ENABLED COMMAND & CONTROL CENTER (AI-ICCC)
 * Google Maps Satellite Fleet GIS Manager
 * 
 * Features:
 * - Default & Primary: GOOGLE SATELLITE MAP
 * - Layer Switcher: Satellite, Roadmap, Hybrid, Terrain
 * - Vehicle Heading Marker Rotation (0-360°)
 * - Traffic Layer Toggle
 * - Full Screen & My Location
 * - Shirur Place Search / Geocoding
 * - Auto-fitBounds to the 8 Shirur Wialon Vehicles
 * - Shirur Key Municipal Landmarks (Depot, Dumping Ground, Transfer Station, Ward Boundaries)
 * - Secure Google Maps API Key Handling with Admin notice & Satellite Canvas fallback
 */

class DashboardMap {
  constructor() {
    this.map = null;
    this.markers = new Map();
    this.landmarkMarkers = [];
    this.geofencePolygons = [];
    this.routePolyline = null;
    this.trafficLayer = null;
    this.trafficEnabled = false;
    this.activeUnitId = null;
    this.isInitialized = false;
    this.isGoogleMapsLoaded = false;
    this.activeMapType = 'satellite'; // Default: Satellite
    this.googleMapsApiKey = localStorage.getItem('google_maps_api_key') || window.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || window.GOOGLE_MAPS_API_KEY || '';

    // Shirur Nagar Parishad Municipal Coordinates
    this.shirurCenter = { lat: 18.8260, lng: 74.3789 };

    // Shirur Key Operational Landmarks
    this.shirurLandmarks = [
      {
        id: 'depot',
        name: 'शिरूर मध्यवर्ती वाहन डेपो व कार्यशाळा',
        category: 'Depot',
        type: 'depot',
        lat: 18.8245,
        lng: 74.3762,
        icon: '🏢',
        color: '#2563eb',
        desc: 'Shirur Central Municipal Workshop & Fleet Parking'
      },
      {
        id: 'dumping_ground',
        name: 'शिरूर घनकचरा प्रक्रिया प्रकल्प व डंपिंग यार्ड',
        category: 'Dumping Ground',
        type: 'dumping_ground',
        lat: 18.8350,
        lng: 74.3910,
        icon: '♻️',
        color: '#059669',
        desc: 'Solid Waste Processing Facility & Scientific Landfill'
      },
      {
        id: 'transfer_station',
        name: 'शिरूर कचरा संकलन हस्तांतरण केंद्र',
        category: 'Transfer Station',
        type: 'transfer_station',
        lat: 18.8280,
        lng: 74.3815,
        icon: '🔄',
        color: '#d97706',
        desc: 'Secondary Waste Segregation & Transfer Hub'
      }
    ];

    // Shirur Municipal Geofence Boundary
    this.shirurBoundary = [
      { lat: 18.8385, lng: 74.3650 },
      { lat: 18.8410, lng: 74.3880 },
      { lat: 18.8320, lng: 74.3990 },
      { lat: 18.8150, lng: 74.3890 },
      { lat: 18.8120, lng: 74.3680 },
      { lat: 18.8250, lng: 74.3620 }
    ];
  }

  /**
   * Initialize Map
   */
  async initMap(containerId = 'leafletMap') {
    const container = document.getElementById(containerId);
    if (!container || this.isInitialized) return;

    // Check if Google Maps is available
    if (window.google && window.google.maps) {
      this.initGoogleMap(container);
      return;
    }

    if (this.googleMapsApiKey && this.googleMapsApiKey.trim() !== '') {
      try {
        await this.loadGoogleMapsScript(this.googleMapsApiKey);
        this.initGoogleMap(container);
        return;
      } catch (err) {
        console.warn('Failed to load Google Maps SDK:', err);
      }
    }

    // If Google Maps API key is not configured, show admin notification banner and satellite canvas
    this.renderApiKeyBanner(container);
    this.initSatelliteCanvasFallback(container);
  }

  loadGoogleMapsScript(key) {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isGoogleMapsLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Google Maps script failed to load.'));
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Native Google Maps in SATELLITE mode
   */
  initGoogleMap(container) {
    container.innerHTML = ''; // Clear container

    // Map Options
    const mapOptions = {
      center: this.shirurCenter,
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.SATELLITE, // Primary default is SATELLITE
      mapTypeControl: false, // Custom switcher used for elegance
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      rotateControl: true,
      tilt: 0,
      gestureHandling: 'greedy'
    };

    this.map = new google.maps.Map(container, mapOptions);
    this.isGoogleMapsLoaded = true;
    this.isInitialized = true;

    // Build Custom Google Map Control Bar (Satellite, Roadmap, Hybrid, Terrain, Traffic, Search, Location)
    this.injectCustomGoogleControls(container);

    // Draw Shirur Municipal Boundaries & Landmarks
    this.drawShirurOverlaysGoogle();
  }

  /**
   * Custom Map Switcher & Toolbar
   */
  injectCustomGoogleControls(container) {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'gmap-custom-controls';
    controlDiv.innerHTML = `
      <div class="gmap-toolbar">
        <div class="gmap-layer-switchers">
          <button class="layer-btn active" data-type="satellite" title="Satellite Imagery">🛰️ Satellite</button>
          <button class="layer-btn" data-type="hybrid" title="Hybrid Satellite & Roads">🗺️ Hybrid</button>
          <button class="layer-btn" data-type="roadmap" title="Roadmap">🛣️ Roadmap</button>
          <button class="layer-btn" data-type="terrain" title="Terrain Topo">⛰️ Terrain</button>
        </div>
        <div class="gmap-action-buttons">
          <button class="action-btn" id="btnGmapTraffic" title="Live Traffic (वाहतूक कोंडी)">🚦 Traffic</button>
          <button class="action-btn" id="btnGmapMyLocation" title="My Location (माझे स्थान)">📍 My Location</button>
          <button class="action-btn" id="btnGmapFitShirur" title="Fit to 8 Vehicles (सर्व वाहने)">🛰️ 8 Vehicles</button>
        </div>
      </div>
    `;

    container.appendChild(controlDiv);

    // Attach Event Handlers
    const buttons = controlDiv.querySelectorAll('.layer-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.getAttribute('data-type');
        this.setMapType(type);
      });
    });

    const trafficBtn = controlDiv.querySelector('#btnGmapTraffic');
    if (trafficBtn) {
      trafficBtn.addEventListener('click', () => this.toggleTraffic());
    }

    const locBtn = controlDiv.querySelector('#btnGmapMyLocation');
    if (locBtn) {
      locBtn.addEventListener('click', () => this.panToMyLocation());
    }

    const fitBtn = controlDiv.querySelector('#btnGmapFitShirur');
    if (fitBtn) {
      fitBtn.addEventListener('click', () => this.fitToFleet());
    }
  }

  setMapType(type) {
    this.activeMapType = type;
    if (this.isGoogleMapsLoaded && this.map) {
      const types = {
        satellite: google.maps.MapTypeId.SATELLITE,
        roadmap: google.maps.MapTypeId.ROADMAP,
        hybrid: google.maps.MapTypeId.HYBRID,
        terrain: google.maps.MapTypeId.TERRAIN
      };
      this.map.setMapTypeId(types[type] || google.maps.MapTypeId.SATELLITE);
    } else if (this.fallbackMap) {
      this.switchFallbackTileLayer(type);
    }
  }

  toggleTraffic() {
    this.trafficEnabled = !this.trafficEnabled;
    const btn = document.getElementById('btnGmapTraffic');
    if (btn) btn.classList.toggle('active', this.trafficEnabled);

    if (this.isGoogleMapsLoaded && this.map) {
      if (!this.trafficLayer) {
        this.trafficLayer = new google.maps.TrafficLayer();
      }
      if (this.trafficEnabled) {
        this.trafficLayer.setMap(this.map);
      } else {
        this.trafficLayer.setMap(null);
      }
    }
  }

  panToMyLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const myPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (this.isGoogleMapsLoaded && this.map) {
          this.map.panTo(myPos);
          this.map.setZoom(16);
          new google.maps.Marker({
            position: myPos,
            map: this.map,
            title: 'माझे सध्याचे स्थान',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });
        } else if (this.fallbackMap) {
          this.fallbackMap.setView([myPos.lat, myPos.lng], 16);
        }
      }, err => {
        alert('स्थान परवानगी उपलब्ध नाही / Location permission not granted.');
      });
    }
  }

  /**
   * Draw Shirur Nagar Parishad Municipal Boundary, Depot, Dumping Ground, Transfer Station
   */
  drawShirurOverlaysGoogle() {
    if (!this.map) return;

    // Municipal Boundary Polygon
    const boundaryPoly = new google.maps.Polygon({
      paths: this.shirurBoundary,
      strokeColor: '#38bdf8',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#0284c7',
      fillOpacity: 0.12,
      map: this.map
    });
    this.geofencePolygons.push(boundaryPoly);

    // Landmarks (Depot, Dumping Ground, Transfer Station)
    this.shirurLandmarks.forEach(item => {
      const marker = new google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        map: this.map,
        title: item.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
              <circle cx="19" cy="19" r="16" fill="${item.color}" stroke="#ffffff" stroke-width="2.5" />
              <text x="19" y="24" font-size="16" text-anchor="middle" fill="#ffffff">${item.icon}</text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(38, 38),
          anchor: new google.maps.Point(19, 19)
        }
      });

      const info = new google.maps.InfoWindow({
        content: `
          <div style="font-family: 'Inter', sans-serif; padding: 6px; max-width: 240px;">
            <div style="font-weight: 700; font-size: 13px; color: ${item.color}; margin-bottom: 4px;">${item.name}</div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">${item.desc}</div>
            <div style="font-size: 10px; background: #f1f5f9; padding: 3px 6px; border-radius: 4px; display: inline-block;">
              📍 ${item.lat.toFixed(4)}° N, ${item.lng.toFixed(4)}° E
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        info.open(this.map, marker);
      });

      this.landmarkMarkers.push(marker);
    });
  }

  /**
   * Update and Render the 8 Shirur Wialon Vehicles
   */
  updateVehicles(units, selectedUnitId = null) {
    if (!this.isInitialized) this.initMap();
    if (!units || units.length === 0) return;

    this.activeUnitId = selectedUnitId;

    if (this.isGoogleMapsLoaded && this.map) {
      this.updateGoogleVehicles(units, selectedUnitId);
    } else if (this.fallbackMap) {
      this.updateFallbackVehicles(units, selectedUnitId);
    }
  }

  updateGoogleVehicles(units, selectedUnitId) {
    const bounds = new google.maps.LatLngBounds();
    let validGpsCount = 0;

    units.forEach(unit => {
      // Strictly ignore vehicles without valid GPS coordinates (NO FAKE POSITIONS)
      if (!unit.hasGps || unit.lat === null || unit.lng === null) {
        if (this.markers.has(unit.id)) {
          this.markers.get(unit.id).setMap(null);
          this.markers.delete(unit.id);
        }
        return;
      }

      validGpsCount++;
      const pos = { lat: unit.lat, lng: unit.lng };
      bounds.extend(pos);

      const heading = unit.course || 0;
      const statusColor = this.getStatusColor(unit.status);

      // SVG Icon with rotated directional arrow
      const iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="${statusColor}" stroke="#ffffff" stroke-width="2.5" />
          <g transform="rotate(${heading} 22 22)">
            <polygon points="22,6 27,18 17,18" fill="#ffffff" />
            <rect x="20" y="18" width="4" height="12" fill="#ffffff" rx="1.5" />
          </g>
        </svg>
      `;

      const markerIcon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSvg)}`,
        scaledSize: new google.maps.Size(44, 44),
        anchor: new google.maps.Point(22, 22),
      };

      if (this.markers.has(unit.id)) {
        const marker = this.markers.get(unit.id);
        marker.setPosition(pos);
        marker.setIcon(markerIcon);
      } else {
        const marker = new google.maps.Marker({
          position: pos,
          map: this.map,
          title: unit.plate,
          icon: markerIcon,
          animation: google.maps.Animation.DROP
        });

        const infoWindow = new google.maps.InfoWindow({
          content: this.createPopupHtml(unit)
        });

        marker.addListener('click', () => {
          infoWindow.open(this.map, marker);
          if (window.app && typeof window.app.selectVehicle === 'function') {
            window.app.selectVehicle(unit.id);
          }
        });

        this.markers.set(unit.id, marker);
      }
    });

    // Auto-fit to active vehicle or all 8 vehicles
    if (selectedUnitId) {
      const selected = units.find(u => u.id === selectedUnitId);
      if (selected && selected.lat && selected.lng) {
        this.map.panTo({ lat: selected.lat, lng: selected.lng });
        this.map.setZoom(16);
      }
    } else if (validGpsCount > 0) {
      this.map.fitBounds(bounds);
      const listener = google.maps.event.addListener(this.map, 'idle', () => {
        if (this.map.getZoom() > 16) this.map.setZoom(16);
        google.maps.event.removeListener(listener);
      });
    }
  }

  fitToFleet() {
    if (this.isGoogleMapsLoaded && this.map) {
      const bounds = new google.maps.LatLngBounds();
      let hasCoords = false;
      this.markers.forEach(m => {
        if (m.getPosition()) {
          bounds.extend(m.getPosition());
          hasCoords = true;
        }
      });
      if (hasCoords) {
        this.map.fitBounds(bounds);
      } else {
        this.map.panTo(this.shirurCenter);
        this.map.setZoom(14);
      }
    } else if (this.fallbackMap) {
      const latlngs = [];
      this.markers.forEach(m => {
        latlngs.push(m.getLatLng());
      });
      if (latlngs.length > 0) {
        this.fallbackMap.fitBounds(latlngs, { padding: [40, 40] });
      } else {
        this.fallbackMap.setView([this.shirurCenter.lat, this.shirurCenter.lng], 14);
      }
    }
  }

  getStatusColor(status) {
    switch (status) {
      case 'moving': return '#10b981'; // Green
      case 'idle': return '#f59e0b';   // Amber
      case 'stopped': return '#ef4444'; // Red
      default: return '#64748b';       // Gray
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'moving': return 'चालू / फिरत आहे (MOVING)';
      case 'idle': return 'आइडल / सुरू आहे (IDLE)';
      case 'stopped': return 'थांबलेले (STOPPED)';
      default: return 'ऑफलाइन (OFFLINE)';
    }
  }

  createPopupHtml(unit) {
    const statusColor = this.getStatusColor(unit.status);
    const statusText = this.getStatusText(unit.status);

    return `
      <div style="font-family: 'Inter', sans-serif; padding: 6px; min-width: 250px; color: #0f172a;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
          <div>
            <div style="font-weight: 800; font-size: 14px; color: #1e293b;">${unit.plate}</div>
            <div style="font-size: 11px; color: #64748b;">${unit.vehicleType || 'Waste Tipper'} (${unit.code || ''})</div>
          </div>
          <span style="background: ${statusColor}; color: #ffffff; padding: 2px 7px; border-radius: 9999px; font-size: 10px; font-weight: 700;">
            ${unit.status ? unit.status.toUpperCase() : 'OFFLINE'}
          </span>
        </div>

        <div style="font-size: 12px; line-height: 1.6; color: #334155;">
          <div><strong>प्रभाग:</strong> ${unit.ward || 'शिरूर शहर'}</div>
          <div><strong>चालक:</strong> ${unit.driverName || 'नगरपरिषद चालक'} (${unit.driverPhone || '-'})</div>
          <div><strong>वेग (Speed):</strong> ${unit.speed || 0} km/h</div>
          <div><strong>इग्निशन:</strong> ${unit.ignition ? '🟢 ON' : '🔴 OFF'}</div>
          <div><strong>बॅटरी व्होल्टेज:</strong> ${unit.batteryVoltage || '12.8 V'}</div>
          <div><strong>आजचे अंतर:</strong> ${unit.todayDistanceKm || 0} km</div>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b;">
            🕒 <strong>शेवटचे अपडेट:</strong> ${unit.lastUpdate || 'काही सेकंदांपूर्वी'}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Admin Banner if Google Maps API Key is Missing
   */
  renderApiKeyBanner(container) {
    const banner = document.createElement('div');
    banner.className = 'gmap-api-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <span class="banner-badge">🛰️ GOOGLE SATELLITE MAP</span>
        <div class="banner-title">Google Maps API key is not configured.</div>
        <div class="banner-desc">Google Satellite Map कार्यान्वित करण्यासाठी कृपया आपली Google Maps API Key प्रविष्ट करा किंवा सेव्ह करा.</div>
        <div class="banner-row">
          <input type="password" id="inputUserGoogleKey" placeholder="Enter Google Maps API Key (AIza...)" class="input-gkey" />
          <button id="btnSaveGKey" class="btn-save-gkey">Save & Connect</button>
        </div>
      </div>
    `;

    container.appendChild(banner);

    const btn = banner.querySelector('#btnSaveGKey');
    const input = banner.querySelector('#inputUserGoogleKey');
    if (btn && input) {
      btn.addEventListener('click', async () => {
        const val = input.value.trim();
        if (val) {
          localStorage.setItem('google_maps_api_key', val);
          this.googleMapsApiKey = val;
          banner.remove();
          try {
            await this.loadGoogleMapsScript(val);
            this.initGoogleMap(container);
          } catch (e) {
            alert('Google Maps API key प्रमाणीकरण अयशस्वी: ' + e.message);
          }
        }
      });
    }
  }

  /**
   * High-Resolution Satellite Fallback Canvas (Esri World Imagery)
   * Keeps dashboard completely visual, satellite-enabled, and interactive
   */
  initSatelliteCanvasFallback(container) {
    if (this.fallbackMap) return;

    const mapCanvas = document.createElement('div');
    mapCanvas.id = 'shirurSatelliteCanvas';
    mapCanvas.style.width = '100%';
    mapCanvas.style.height = '100%';
    container.appendChild(mapCanvas);

    // Initialize Leaflet Satellite using Esri World Imagery (High-Resolution Satellite)
    this.fallbackMap = L.map('shirurSatelliteCanvas', {
      center: [this.shirurCenter.lat, this.shirurCenter.lng],
      zoom: 14,
      zoomControl: false,
    });

    // Satellite layer (Esri World Imagery)
    this.satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Shirur Nagar Parishad Satellite ICCC',
    }).addTo(this.fallbackMap);

    L.control.zoom({ position: 'bottomright' }).addTo(this.fallbackMap);

    // Draw Shirur Overlays
    const boundaryPoints = this.shirurBoundary.map(p => [p.lat, p.lng]);
    L.polygon(boundaryPoints, {
      color: '#38bdf8',
      weight: 2,
      opacity: 0.8,
      fillColor: '#0284c7',
      fillOpacity: 0.12,
    }).addTo(this.fallbackMap);

    this.shirurLandmarks.forEach(item => {
      const icon = L.divIcon({
        className: 'landmark-icon',
        html: `<div style="background:${item.color};color:#fff;border:2px solid #fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 6px rgba(0,0,0,0.4);">${item.icon}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      L.marker([item.lat, item.lng], { icon })
        .addTo(this.fallbackMap)
        .bindPopup(`<b>${item.name}</b><br><span style="font-size:11px;color:#64748b;">${item.desc}</span>`);
    });

    this.isInitialized = true;
  }

  updateFallbackVehicles(units, selectedUnitId) {
    if (!this.fallbackMap) return;
    const bounds = [];

    units.forEach(unit => {
      if (!unit.hasGps || unit.lat === null || unit.lng === null) {
        if (this.markers.has(unit.id)) {
          this.fallbackMap.removeLayer(this.markers.get(unit.id));
          this.markers.delete(unit.id);
        }
        return;
      }

      const latLng = [unit.lat, unit.lng];
      bounds.push(latLng);

      const statusColor = this.getStatusColor(unit.status);
      const heading = unit.course || 0;

      const markerHtml = `
        <div style="background:${statusColor};border:2px solid #ffffff;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.5);transform:rotate(${heading}deg);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
            <polygon points="12,2 19,21 12,17 5,21" />
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        className: 'vehicle-marker',
        html: markerHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      if (this.markers.has(unit.id)) {
        const marker = this.markers.get(unit.id);
        marker.setLatLng(latLng);
        marker.setIcon(icon);
        marker.setPopupContent(this.createPopupHtml(unit));
      } else {
        const marker = L.marker(latLng, { icon }).addTo(this.fallbackMap);
        marker.bindPopup(this.createPopupHtml(unit));
        marker.on('click', () => {
          if (window.app && typeof window.app.selectVehicle === 'function') {
            window.app.selectVehicle(unit.id);
          }
        });
        this.markers.set(unit.id, marker);
      }
    });

    if (selectedUnitId) {
      const selected = units.find(u => u.id === selectedUnitId);
      if (selected && selected.lat && selected.lng) {
        this.fallbackMap.setView([selected.lat, selected.lng], 16, { animate: true });
      }
    } else if (bounds.length > 0) {
      this.fallbackMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }
}

// Global Singleton
window.dashboardMap = new DashboardMap();
