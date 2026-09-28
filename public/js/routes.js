/**
 * SHIRUR NAGAR PARISHAD - ROUTE EXECUTION & PROGRESSION ENGINE
 * (शिरूर कचरा संकलन मार्ग व्यवस्थापन व थेट संचलन)
 * Enables designated municipal waste collection routes and waypoint tracking.
 */

class RouteExecutionService {
  constructor() {
    this.routes = [
      {
        id: 'route_shirur_bazar',
        name: 'शिरूर शहर मुख्य बाजारपेठ व पेठ संकलन मार्ग (Route 01)',
        ward: 'प्रभाग क्र. ०१ व ०२ (मध्यवर्ती शिरूर)',
        vehicleId: '601639146',
        vehiclePlate: 'S MH 12 QW 8149 (407)',
        driverName: 'कैलास पवार',
        contractorName: 'मे. शिरूर स्वच्छता व घनकचरा व्यवस्थापन',
        totalDistanceKm: 8.5,
        estimatedTimeMin: 45,
        status: 'Ready',
        waypoints: [
          { id: 'wp1', name: '१. शिरूर नगरपरिषद मुख्य कार्यालय संकलन पॉईंट (प्रारंभ)', lat: 18.8260, lng: 74.3789, status: 'pending', time: '07:00 AM' },
          { id: 'wp2', name: '२. सुभाष चौक मुख्य भाजी मंडई व बाजारपेठ', lat: 18.8240, lng: 74.3770, status: 'pending', time: '07:20 AM' },
          { id: 'wp3', name: '३. मारुती आळी व जुना पोस्ट ऑफिस चौक', lat: 18.8220, lng: 74.3750, status: 'pending', time: '07:40 AM' },
          { id: 'wp4', name: '४. शिरूर घनकचरा प्रक्रिया प्रकल्प (अंतिम)', lat: 18.8350, lng: 74.3910, status: 'pending', time: '08:00 AM' },
        ],
      },
      {
        id: 'route_pune_nagar',
        name: 'पुणे-नगर महामार्ग व स्टेशन रोड स्वच्छता संकलन मार्ग (Route 02)',
        ward: 'प्रभाग क्र. ०३ व ०४ (महामार्ग परिसर)',
        vehicleId: '601638334',
        vehiclePlate: 'S MH 12 VT 2894',
        driverName: 'बाळासाहेब थोरात',
        contractorName: 'मे. विघ्नहर्ता वेस्ट मॅनेजमेंट सर्व्हिसेस',
        totalDistanceKm: 9.2,
        estimatedTimeMin: 50,
        status: 'Ready',
        waypoints: [
          { id: 'wp5', name: '१. शिरूर बस स्थानक परिसर (प्रारंभ)', lat: 18.8270, lng: 74.3800, status: 'pending', time: '07:15 AM' },
          { id: 'wp6', name: '२. छत्रपती शिवाजी महाराज चौक महामार्ग कॉर्नर', lat: 18.8290, lng: 74.3820, status: 'pending', time: '07:35 AM' },
          { id: 'wp7', name: '३. हुडको कॉलनी प्रवेशद्वार संकलन केंद्र', lat: 18.8310, lng: 74.3840, status: 'pending', time: '07:55 AM' },
          { id: 'wp8', name: '४. शिरूर घनकचरा प्रक्रिया प्रकल्प (अंतिम)', lat: 18.8350, lng: 74.3910, status: 'pending', time: '08:15 AM' },
        ],
      },
    ];

    this.activeRoute = this.routes[0];
    this.initUI();
  }

  initUI() {
    const select = document.getElementById('routeSelect');
    if (select) {
      select.innerHTML = this.routes.map(r => `
        <option value="${r.id}">${r.name} - ${r.waypoints.length} कुंड्या</option>
      `).join('');

      select.addEventListener('change', (e) => {
        this.selectRoute(e.target.value);
      });
    }

    this.updateRouteUI();
  }

  selectRoute(routeId) {
    this.activeRoute = this.routes.find(r => r.id === routeId) || this.routes[0];
    this.updateRouteUI();
  }

  updateRouteUI() {
    if (!this.activeRoute) return;

    const r = this.activeRoute;
    const vInfo = document.getElementById('routeVehicleInfo');
    const cInfo = document.getElementById('routeContractorInfo');
    const badge = document.getElementById('routeStatusBadge');
    const pText = document.getElementById('routeProgressText');
    const grid = document.getElementById('waypointsGrid');

    if (vInfo) vInfo.textContent = `${r.vehiclePlate} (${r.driverName})`;
    if (cInfo) cInfo.textContent = r.contractorName;
    if (badge) badge.textContent = r.status;
    if (pText) pText.textContent = `0 / ${r.waypoints.length} कुंड्या संकलित (0%)`;

    if (grid) {
      grid.innerHTML = r.waypoints.map(wp => `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 12px; font-size:12px;">
          <div style="font-weight:600; color:#1e293b;">${wp.name}</div>
          <div style="color:#64748b; font-size:11px; margin-top:2px;">वेळ: ${wp.time} • स्थिती: ${wp.status}</div>
        </div>
      `).join('');
    }
  }
}

// Global Singleton
window.routeExecutionService = new RouteExecutionService();
