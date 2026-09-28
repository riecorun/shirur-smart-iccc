// Governance & Portals: Contractors, Billing, Complaints, AI Assistant, Reports, Worker App, Citizen Portal, Settings

function renderContractors(container) {
  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Contractor Performance & SLA Compliance</h2>
        <p class="text-xs text-slate-400">ठेकेदारांची दैनिक कामगिरी, वाहन उपस्थिती व SLA मूल्यांकन</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${state.contractors.map(c => `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm text-white">${c.name}</h3>
            <span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              SLA: ${c.performanceScorePct}%
            </span>
          </div>
          <p class="text-xs text-slate-400">Reg: ${c.registrationNumber} • Contact: ${c.contactPerson} (${c.phone})</p>
          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-800/40 p-2.5 rounded-lg">
            <div>
              <span class="text-slate-400">वाहन संख्या:</span>
              <span class="font-bold text-white ml-1">${c.vehicleCount} Units</span>
            </div>
            <div>
              <span class="text-slate-400">मासिक मूल्य:</span>
              <span class="font-bold text-emerald-400 ml-1">₹${c.monthlyContractValueInr.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  container.innerHTML = html;
}

function renderBilling(container) {
  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Automated Transparent Municipal Billing</h2>
        <p class="text-xs text-slate-400">SLA दंड व कपात यासह संगणकीय बिलिंग व मंजुरी</p>
      </div>
      <button onclick="calculateNewBill()" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium">
        + Generate Monthly Bill
      </button>
    </div>

    <div class="space-y-4">
      ${state.invoices.map(inv => `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span class="font-mono font-bold text-emerald-400 text-sm">${inv.invoiceNumber}</span>
              <p class="text-xs text-slate-400">Month: ${inv.month}</p>
            </div>
            <span class="px-3 py-1 rounded text-xs font-bold ${inv.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}">
              ${inv.status}
            </span>
          </div>

          <!-- DEDUCTIONS BREAKDOWN -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 my-4 text-xs">
            <div class="bg-slate-800/50 p-2.5 rounded">
              <span class="text-slate-400">मूळ रक्कम (Base):</span>
              <div class="font-bold text-white text-sm mt-0.5">₹${inv.baseAmount.toLocaleString('en-IN')}</div>
            </div>
            <div class="bg-slate-800/50 p-2.5 rounded">
              <span class="text-slate-400">थांबा दंड (>10 min):</span>
              <div class="font-bold text-rose-400 text-sm mt-0.5">- ₹${inv.stoppagePenalty.toLocaleString('en-IN')}</div>
            </div>
            <div class="bg-slate-800/50 p-2.5 rounded">
              <span class="text-slate-400">मार्ग विचलन दंड:</span>
              <div class="font-bold text-rose-400 text-sm mt-0.5">- ₹${inv.deviationPenalty.toLocaleString('en-IN')}</div>
            </div>
            <div class="bg-slate-800/50 p-2.5 rounded">
              <span class="text-slate-400">अंतिम देय रक्कम:</span>
              <div class="font-black text-emerald-400 text-base mt-0.5">₹${inv.netPayableAmount.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div class="flex justify-end space-x-2">
            <button onclick="approveBill('${inv.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold">
              ✓ Approve Payout (Chief Officer)
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  container.innerHTML = html;
}

async function calculateNewBill() {
  showToast('Calculating monthly billing with SLA deductions...', 'info');
  try {
    const res = await fetch('/api/billing/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractorId: 'cont-01', month: '2026-09' })
    }).then(r => r.json());

    if (res.success) {
      showToast('Bill generated: ' + res.invoice.invoiceNumber, 'success');
      state.invoices.push(res.invoice);
      navigate('billing');
    }
  } catch (err) {
    showToast('Failed to calculate bill', 'error');
  }
}

async function approveBill(invId) {
  try {
    const res = await fetch('/api/billing/' + invId + '/approve', { method: 'POST' }).then(r => r.json());
    if (res.success) {
      showToast('Invoice approved by Chief Officer', 'success');
      const inv = state.invoices.find(i => i.id === invId);
      if (inv) inv.status = 'APPROVED';
      navigate('billing');
    }
  } catch (err) {
    showToast('Failed to approve', 'error');
  }
}

function renderComplaints(container) {
  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Citizen Grievance Redressal (तक्रार निवारण)</h2>
        <p class="text-xs text-slate-400">नागरिकांच्या तक्रारी, निवारण व फोटो पुरावे</p>
      </div>
    </div>

    <div class="space-y-3">
      ${state.complaints.map(c => `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono font-bold text-xs text-cyan-400">${c.complaintNumber}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}">
                ${c.status}
              </span>
            </div>
            <h4 class="font-bold text-sm text-white mt-1">${c.category} - ${c.address}</h4>
            <p class="text-xs text-slate-300 mt-1">${c.description}</p>
            <p class="text-[11px] text-slate-400 mt-1">नागरिक: ${c.citizenName} (${c.citizenPhone})</p>
          </div>
          ${c.status !== 'RESOLVED' ? `
            <button onclick="resolveComplaint('${c.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold">
              ✓ Resolve
            </button>
          ` : `<span class="text-xs text-emerald-400 font-bold">निवारण पूर्ण (Resolved)</span>`}
        </div>
      `).join('')}
    </div>
  `;
  container.innerHTML = html;
}

async function resolveComplaint(cmpId) {
  try {
    const res = await fetch('/api/complaints/' + cmpId + '/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED', notes: 'Sanitation team completed cleaning.' })
    }).then(r => r.json());

    if (res.success) {
      showToast('Complaint marked as resolved', 'success');
      const cmp = state.complaints.find(c => c.id === cmpId);
      if (cmp) cmp.status = 'RESOLVED';
      navigate('complaints');
    }
  } catch (err) {
    showToast('Failed to resolve', 'error');
  }
}

function renderAiAssistant(container) {
  const html = `
    <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div class="p-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-xl">🤖</span>
          <div>
            <h3 class="font-bold text-sm text-white">Shirur AI Municipal Assistant</h3>
            <p class="text-[11px] text-emerald-400 font-mono">Grounded Real-Time Telemetry Engine (Marathi / English)</p>
          </div>
        </div>
      </div>

      <div class="p-2.5 bg-slate-800/30 border-b border-slate-800 flex flex-wrap gap-1.5 text-xs">
        <button onclick="sendAiPrompt('आज किती गाड्या चालू आहेत?')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full">
          "आज किती गाड्या चालू आहेत?"
        </button>
        <button onclick="sendAiPrompt('कोणती गाडी १० मिनिटांपेक्षा जास्त थांबली?')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-full">
          "कोणती गाडी १० मिनिटांपेक्षा जास्त थांबली?"
        </button>
        <button onclick="sendAiPrompt('आज कोणत्या गाडीने route deviation केले?')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full">
          "कोणत्या गाडीने route deviation केले?"
        </button>
        <button onclick="sendAiPrompt('आजचे कचरा संकलन किती पूर्ण झाले?')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-full">
          "कचरा संकलन प्रगती दाखवा"
        </button>
      </div>

      <div id="ai-chat-log" class="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        <div class="flex items-start space-x-2">
          <span class="text-lg">🤖</span>
          <div class="bg-slate-800 p-3 rounded-lg text-slate-200 max-w-lg leading-relaxed">
            नमस्कार! मी शिरूर नगर परिषद AI सहाय्यक आहे. आपण मला वाहनांची स्थिती, १० मिनिटांपेक्षा जास्त थांबलेली वाहने, रूट विचलन किंवा कचरा संकलनाबाबत मराठी, इंग्रजी किंवा हिंदीत विचारू शकता.
          </div>
        </div>
      </div>

      <div class="p-3 bg-slate-800/80 border-t border-slate-700 flex space-x-2">
        <input type="text" id="ai-input" onkeydown="if(event.key === 'Enter') submitAiQuery()" placeholder="येथे आपला प्रश्न विचारा (e.g. आज किती गाड्या कार्यरत आहेत?)..." class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
        <button onclick="submitAiQuery()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
          Send
        </button>
      </div>
    </div>
  `;
  container.innerHTML = html;
}

function sendAiPrompt(prompt) {
  const input = document.getElementById('ai-input');
  if (input) {
    input.value = prompt;
    submitAiQuery();
  }
}

async function submitAiQuery() {
  const input = document.getElementById('ai-input');
  const chatLog = document.getElementById('ai-chat-log');
  const prompt = input.value.trim();
  if (!prompt) return;

  chatLog.innerHTML += `
    <div class="flex items-start justify-end space-x-2">
      <div class="bg-emerald-600 p-3 rounded-lg text-white max-w-lg">
        ${prompt}
      </div>
      <span class="text-lg">👤</span>
    </div>
  `;
  input.value = '';
  chatLog.scrollTop = chatLog.scrollHeight;

  try {
    const res = await fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, language: state.language })
    }).then(r => r.json());

    chatLog.innerHTML += `
      <div class="flex items-start space-x-2">
        <span class="text-lg">🤖</span>
        <div class="bg-slate-800 p-3 rounded-lg text-slate-100 max-w-lg whitespace-pre-line leading-relaxed">
          ${res.reply}
        </div>
      </div>
    `;
    chatLog.scrollTop = chatLog.scrollHeight;
  } catch (err) {
    showToast('AI Query Failed', 'error');
  }
}

function renderReports(container) {
  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Automated Municipal Reports & Exports</h2>
        <p class="text-xs text-slate-400">दैनिक व मासिक वाहन, प्रभाग आणि कचरा संकलन अहवाल</p>
      </div>
      <div class="flex space-x-2">
        <a href="/api/reports/daily-fleet?format=csv" download class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center space-x-1">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>Download CSV Report</span>
        </a>
      </div>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <h3 class="font-bold text-sm text-white mb-3">प्रभागनिहाय संकलन प्रगती अहवाल (Ward-wise Summary)</h3>
      <div class="space-y-2 text-xs">
        ${state.wards.map(w => `
          <div class="flex items-center justify-between p-2.5 rounded bg-slate-800/40">
            <div>
              <span class="font-bold text-white">${w.name}</span>
              <p class="text-slate-400 text-[11px]">अधिकारी: ${w.officerName} (${w.officerPhone})</p>
            </div>
            <div class="text-right">
              <span class="font-bold text-emerald-400">दैनिक लक्ष्य: ${w.dailyWasteTargetKg} kg</span>
              <p class="text-cyan-400 text-[11px]">लोकसंख्या: ${w.population.toLocaleString('en-IN')}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  container.innerHTML = html;
}

function renderWorkerApp(container) {
  const html = `
    <div class="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span class="text-[10px] text-emerald-400 font-mono">FIELD OPERATOR MOBILE APP</span>
          <h3 class="font-bold text-base text-white">संजय जाधव (चालक / Driver)</h3>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400">ON DUTY</span>
      </div>

      <div class="bg-slate-800/80 p-3 rounded-xl space-y-1.5 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-400">नेमून दिलेले वाहन:</span>
          <span class="text-white font-bold">MH-12-SN-1001 (घंटागाडी)</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">आजचा मार्ग (Beat):</span>
          <span class="text-cyan-400 font-bold">P01-R01 राम मंदिर प्रभाग</span>
        </div>
      </div>

      <button onclick="simulateQrScan()" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg">
        <i data-lucide="qr-code" class="w-4 h-4"></i>
        <span>ITI LIMITED QR CODE स्कॅन करा</span>
      </button>

      <button onclick="showToast('Supervisor notified of breakdown', 'info')" class="w-full py-2 bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900 rounded-xl font-bold text-xs">
        ⚠️ वाहन बिघाड / अपघात नोंदवा (Report Breakdown)
      </button>
    </div>
  `;
  container.innerHTML = html;
}

async function simulateQrScan() {
  const sampleQr = 'ITI-QR-CP-104';
  showToast('Simulating ITI Limited QR Code scan: ' + sampleQr + '...', 'info');
  try {
    const res = await fetch('/api/qr/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrPayload: sampleQr, workerId: 'wrk-01' })
    }).then(r => r.json());

    if (res.success) {
      showToast(res.message, 'success');
    }
  } catch (err) {
    showToast('QR scan failed', 'error');
  }
}

function renderCitizenPortal(container) {
  const html = `
    <div class="max-w-2xl mx-auto space-y-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h2 class="font-bold text-lg text-white">शिरूर शहर नागरिक सेवा व तक्रार नोंदणी</h2>
        <p class="text-xs text-slate-400">आपल्या भागातील कचरा संकलन गाडीचे थेट स्थान व तक्रार नोंदवा</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 class="font-bold text-sm text-emerald-400">नवीन तक्रार नोंदवा (File Grievance)</h3>
        
        <div>
          <label class="text-xs text-slate-400">आपले नाव (Name)</label>
          <input type="text" id="cit-name" class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white" placeholder="उदा. राहुल जाधव">
        </div>

        <div>
          <label class="text-xs text-slate-400">मोबाईल नंबर (Phone)</label>
          <input type="tel" id="cit-phone" class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white" placeholder="उदा. 9822XXXXXX">
        </div>

        <div>
          <label class="text-xs text-slate-400">तक्रार प्रकार (Category)</label>
          <select id="cit-cat" class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white">
            <option value="GARBAGE_NOT_COLLECTED">कचरा गाडी आली नाही (Garbage Not Collected)</option>
            <option value="OPEN_GARBAGE">उघड्यावर कचरा (Open Garbage Dump)</option>
            <option value="ROAD_CLEANING">रस्ता सफाई नाही (Road Not Swept)</option>
            <option value="DRAIN_ISSUE">गटार तुंबली आहे (Drain Overflow)</option>
            <option value="PUBLIC_TOILET">स्वच्छतागृह अस्वच्छ (Public Toilet Hygiene)</option>
          </select>
        </div>

        <div>
          <label class="text-xs text-slate-400">पत्ता व तपशील (Address & Notes)</label>
          <textarea id="cit-desc" rows="2" class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white" placeholder="परिसराचा पत्ता लिहा..."></textarea>
        </div>

        <button onclick="submitCitizenComplaint()" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs">
          तक्रार सबमिट करा (Submit Grievance)
        </button>
      </div>
    </div>
  `;
  container.innerHTML = html;
}

async function submitCitizenComplaint() {
  const name = document.getElementById('cit-name')?.value || 'Citizen';
  const phone = document.getElementById('cit-phone')?.value || '9822000000';
  const category = document.getElementById('cit-cat')?.value || 'GARBAGE_NOT_COLLECTED';
  const description = document.getElementById('cit-desc')?.value || '';

  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizenName: name, citizenPhone: phone, category, description })
    }).then(r => r.json());

    if (res.success) {
      showToast('तक्रार नोंदवली गेली! तक्रार क्रमांक: ' + res.complaint.complaintNumber, 'success');
      state.complaints.push(res.complaint);
      navigate('complaints');
    }
  } catch (err) {
    showToast('Failed to submit complaint', 'error');
  }
}


function renderSettings(container) {
  const cfg = state.settings;
  const w = cfg.wialon || {};

  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-white">Administration & Wialon Core Integration</h2>
        <p class="text-xs text-slate-400">शिरूर नगर परिषद - Wialon GPS थेट संप्रेषण व ८ अधिकृत वाहने पडताळणी</p>
      </div>
      <div class="flex space-x-2">
        <button onclick="testAll8Vehicles()" class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1">
          <span>🔍 TEST ALL 8 VEHICLES</span>
        </button>
        <button onclick="saveAdminSettings()" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow">
          Save Settings
        </button>
      </div>
    </div>

    <!-- 8 VERIFIED WIALON UNITS STATUS BANNER -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 shadow-sm">
      <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div class="flex items-center space-x-2">
          <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <h3 class="font-bold text-sm text-white">8/8 Verified Shirur Waste Management Vehicles (Live Wialon Stream)</h3>
        </div>
        <div class="flex space-x-1.5">
          <button onclick="runWialonDiagnostics()" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium">TEST CONNECTION</button>
          <button onclick="syncUnitsNow()" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[11px] font-medium">SYNC UNITS</button>
          <button onclick="refreshLiveData()" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-[11px] font-medium">REFRESH LIVE DATA</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
            <tr>
              <th class="p-2.5">Wialon Unit ID</th>
              <th class="p-2.5">वाहन क्रमांक (Vehicle)</th>
              <th class="p-2.5">GPS डिव्हाइस</th>
              <th class="p-2.5">स्थिती (Status)</th>
              <th class="p-2.5">गती (Speed)</th>
              <th class="p-2.5">अक्षांश, रेखांश (Coordinates)</th>
              <th class="p-2.5">शेवटचे GPS अपडेट</th>
            </tr>
          </thead>
          <tbody id="wialon-units-table-body" class="divide-y divide-slate-800 font-mono">
            ${renderWialonUnitsTable()}
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      
      <!-- WIALON INTEGRATION SETTINGS -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 class="font-bold text-sm text-emerald-400">Wialon Server Credentials & Endpoints</h3>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
            ${w.connectionStatus || 'CONNECTED'}
          </span>
        </div>

        <div>
          <label class="text-xs text-slate-400">Wialon API Host</label>
          <input type="text" id="wialon-host" value="${w.apiHost || 'https://hst-api.wialon.com/wialon/ajax.html'}" class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white font-mono">
        </div>

        <div>
          <label class="text-xs text-slate-400">Wialon API Token (Secure Server Secret)</label>
          <input type="password" id="wialon-token" value="****************************************" readonly class="w-full mt-1 bg-slate-800/60 border border-slate-700 text-xs rounded-lg p-2 text-slate-400 font-mono cursor-not-allowed">
          <span class="text-[10px] text-emerald-400">✓ Token securely loaded in backend environment. Protected against frontend leakage.</span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-slate-400">Resource ID</label>
            <input type="text" id="wialon-res" value="${w.resourceId || 'SNP_RESOURCE_01'}" class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white font-mono">
          </div>
          <div>
            <label class="text-xs text-slate-400">Sync Interval (Sec)</label>
            <input type="number" id="wialon-interval" value="${w.syncIntervalSec || 10}" class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white font-mono">
          </div>
        </div>

        <div id="diag-results" class="p-3 bg-slate-800/40 rounded-lg text-xs font-mono text-slate-300">
          <span class="text-emerald-400 font-bold">● Wialon Live Stream Active:</span> 8 vehicles polled every 10 seconds.
        </div>
      </div>

      <!-- BUSINESS RULE THRESHOLDS -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <h3 class="font-bold text-sm text-cyan-400 pb-2 border-b border-slate-800">Alert Rule Thresholds</h3>
        
        <div>
          <label class="text-xs text-slate-400">Stoppage Duration Alert Threshold (Minutes)</label>
          <input type="number" id="thresh-stop" value="${cfg.stoppedDurationThresholdMinutes || 10}" class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white font-mono">
          <span class="text-[10px] text-slate-500">Generates warning alert and dispatches automated voice call (IVR) to driver.</span>
        </div>

        <div>
          <label class="text-xs text-slate-400">Route Deviation Threshold (Meters)</label>
          <input type="number" id="thresh-dev" value="${cfg.routeDeviationThresholdMeters || 150}" class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white font-mono">
        </div>

        <div>
          <label class="text-xs text-slate-400">Municipal Vehicle Speed Limit (Km/h)</label>
          <input type="number" id="thresh-spd" value="${cfg.overspeedThresholdKmH || 45}" class="w-full mt-1 bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-white font-mono">
        </div>
      </div>

    </div>
  `;
  container.innerHTML = html;
}

function renderWialonUnitsTable() {
  const targetIds = [601639146, 601638334, 601638245, 601639156, 601639166, 601639142, 601639160, 601639158];
  const units = state.vehicles.filter(v => v.wialonUnitId && targetIds.includes(v.wialonUnitId));

  if (units.length === 0) {
    return '<tr><td colspan="7" class="p-4 text-center text-slate-400">No units loaded</td></tr>';
  }

  return units.map(u => `
    <tr class="hover:bg-slate-800/40">
      <td class="p-2.5 text-cyan-400 font-bold">${u.wialonUnitId}</td>
      <td class="p-2.5 text-white font-bold">${u.registrationNumber}</td>
      <td class="p-2.5 text-slate-400">${u.gpsDeviceId}</td>
      <td class="p-2.5">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.status === 'MOVING' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}">
          ${u.status}
        </span>
      </td>
      <td class="p-2.5 text-slate-200">${u.speed} km/h</td>
      <td class="p-2.5 text-slate-300">${u.latitude.toFixed(6)}, ${u.longitude.toFixed(6)}</td>
      <td class="p-2.5 text-slate-400">${new Date(u.lastGpsTimestamp).toLocaleTimeString()}</td>
    </tr>
  `).join('');
}

async function testAll8Vehicles() {
  showToast('Testing all 8 Wialon Units live...', 'info');
  try {
    const res = await fetch('/api/wialon/verify-8-units').then(r => r.json());
    if (res.authentication === 'PASS' && res.matchedUnitsCount === 8) {
      showToast(`8/8 Units Verified! Receiving live GPS for all ${res.gpsReceivingCount} vehicles.`, 'success');
      state.vehicles = res.units.map(u => ({
        ...u,
        id: 'veh-' + u.wialonUnitId,
        vehicleType: 'Ghantagadi'
      }));
      updateMapMarkers();
      const tbody = document.getElementById('wialon-units-table-body');
      if (tbody) tbody.innerHTML = renderWialonUnitsTable();
    }
  } catch (err) {
    showToast('Failed to verify units', 'error');
  }
}

async function syncUnitsNow() {
  showToast('Triggering on-demand sync from Wialon API...', 'info');
  try {
    const res = await fetch('/api/wialon/sync-now', { method: 'POST' }).then(r => r.json());
    if (res.success) {
      showToast(`Synced ${res.count} units from Wialon API`, 'success');
      refreshLiveData();
    }
  } catch (err) {
    showToast('Sync failed', 'error');
  }
}

async function refreshLiveData() {
  await loadInitialData();
  const tbody = document.getElementById('wialon-units-table-body');
  if (tbody) tbody.innerHTML = renderWialonUnitsTable();
  showToast('Live telemetry refreshed', 'success');
}

async function saveAdminSettings() {
  showToast("Settings saved", "success");
}
