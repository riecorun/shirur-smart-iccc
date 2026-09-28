/**
 * SHIRUR NAGAR PARISHAD - CONTRACTOR AUTOMATION NOTICES SYSTEM
 * (मक्तेदार ऑटोमेशन नोटीस व दंड व्यवस्थापन - शिरूर नगरपरिषद)
 * Automatically triggers penalty notices when work is delayed, skipped, or vehicles remain idle.
 */

class ContractorNoticeService {
  constructor() {
    this.contractors = [
      {
        id: 'c1',
        name: 'मे. शिरूर स्वच्छता व घनकचरा व्यवस्थापन',
        proprietor: 'श्री. कैलास थोरात',
        phone: '919822110001',
        ward: 'प्रभाग क्र. ०१ व ०२ (मध्यवर्ती बाजारपेठ व पुणे-नगर रस्ता)',
        vehicles: ['S MH 12 QW 8149 (407)', 'S MH 12 VT 2894'],
      },
      {
        id: 'c2',
        name: 'मे. विघ्नहर्ता वेस्ट मॅनेजमेंट सर्व्हिसेस, शिरूर',
        proprietor: 'श्री. संभाजी जाधव',
        phone: '919822110002',
        ward: 'प्रभाग क्र. ०३ व ०४ (रामलिंग रोड व हुडको कॉलनी)',
        vehicles: ['S MH 12 VT 2895', 'S MH 12 XM 6731'],
      },
      {
        id: 'c3',
        name: 'मे. घोडनदी क्लीनिंग सर्व्हिसेस, शिरूर',
        proprietor: 'श्री. संतोष सावंत',
        phone: '919822110003',
        ward: 'प्रभाग क्र. ०५ व ०६ (स्टेशन रोड व घोडनदी परिसर)',
        vehicles: ['S MH 12 XM 6994', 'S MH 12 XM 6995'],
      },
    ];

    // Persisted or seed notices for Shirur Nagar Parishad
    this.notices = JSON.parse(localStorage.getItem('contractor_notices') || 'null') || [
      {
        id: 'SNP-NOT-2026-01',
        date: new Date().toLocaleDateString('en-CA'),
        contractorName: 'मे. शिरूर स्वच्छता व घनकचरा व्यवस्थापन',
        violation: 'वाहन २ तासांपेक्षा जास्त विनापरवाना आइडल (थांबलेले)',
        location: 'पुणे-नगर रस्ता कॉर्नर (शिरूर)',
        penalty: 1500,
        status: 'Sent',
        vehicle: 'S MH 12 QW 8149 (407)'
      }
    ];

    this.renderNoticesList();
  }

  renderNoticesList() {
    const container = document.getElementById('noticesListContainer');
    if (!container) return;

    if (this.notices.length === 0) {
      container.innerHTML = `<div class="empty-state">कोणतीही प्रलंबित नोटीस नाही. सर्व संचलन नियमांनुसार सुरू आहे.</div>`;
      return;
    }

    container.innerHTML = this.notices.map(n => `
      <div class="notice-card" style="background:#ffffff; border:1px solid #fee2e2; border-left:4px solid #ef4444; border-radius:8px; padding:12px 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-weight:700; color:#991b1b; font-size:13px;">${n.id} • ${n.contractorName}</span>
          <span style="background:#fef2f2; color:#b91c1c; font-size:11px; font-weight:700; padding:2px 8px; border-radius:9999px;">दंड: ₹${n.penalty}</span>
        </div>
        <div style="font-size:12px; color:#334155; line-height:1.5;">
          <div><strong>उल्लंघन:</strong> ${n.violation}</div>
          <div><strong>स्थान:</strong> ${n.location} | <strong>वाहन:</strong> ${n.vehicle || '-'}</div>
          <div style="color:#64748b; font-size:11px; margin-top:4px;">तारीख: ${n.date} • स्थिती: ${n.status}</div>
        </div>
      </div>
    `).join('');
  }
}

// Global Singleton
window.contractorNoticeService = new ContractorNoticeService();
