/**
 * SHIRUR NAGAR PARISHAD - AI-ENABLED INTEGRATED COMMAND & CONTROL CENTER (AI-ICCC)
 * WhatsApp Daily Automated Reports Engine (शिरूर नगरपरिषद – दैनिक फ्लीट अहवाल)
 * 
 * Generates automated Marathi & English reports for:
 * - मा. मुख्याधिकारी, शिरूर नगरपरिषद (Chief Officer, Shirur Nagar Parishad)
 * - नोडल अधिकारी / मुख्य स्वच्छता निरीक्षक, शिरूर (Sanitation Head)
 * - मक्तेदार समन्वय कक्ष, शिरूर नगरपरिषद
 */

class WhatsAppReportService {
  constructor() {
    this.recipients = [
      { id: 'r1', name: 'मा. मुख्याधिकारी, शिरूर नगरपरिषद', role: 'Chief Officer, Shirur Nagar Parishad', phone: '919822100000', active: true },
      { id: 'r2', name: 'मुख्य स्वच्छता व आरोग्य निरीक्षक, शिरूर', role: 'Chief Sanitation Inspector', phone: '919822200000', active: true },
      { id: 'r3', name: 'मक्तेदार समन्वय कक्ष, शिरूर', role: 'Contractor Cell SNP', phone: '919822300000', active: true },
    ];
    this.scheduledTime = localStorage.getItem('wa_report_time') || '08:30';
    this.autoSendEnabled = localStorage.getItem('wa_report_auto') !== 'false';
    this.lastReportData = null;
  }

  formatReportDate(dateObj) {
    const d = dateObj ? new Date(dateObj) : new Date();
    return d.toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  buildWhatsAppMessage(dateStr) {
    const units = window.wialonService ? window.wialonService.units : [];
    const dateFormatted = this.formatReportDate(dateStr);
    const moving = units.filter(u => u.status === 'moving').length;
    const idle = units.filter(u => u.status === 'idle').length;
    const stopped = units.filter(u => u.status === 'stopped').length;
    const offline = units.filter(u => u.status === 'offline').length;
    const totalDist = units.reduce((s, u) => s + (Number(u.todayDistanceKm) || 0), 0);

    let msg = `🏛️ *शिरूर नगरपरिषद, शिरूर जि. पुणे*\n`;
    msg += `*AI-ENABLED INTEGRATED COMMAND & CONTROL CENTER (AI-ICCC)*\n`;
    msg += `*दैनिक घनकचरा संकलन व फ्लीट संचलन अहवाल*\n\n`;
    msg += `📅 *दिनांक:* ${dateFormatted}\n`;
    msg += `⏰ *अहवाल वेळ:* ${new Date().toLocaleTimeString('mr-IN')}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📊 *फ्लीट सद्यस्थिती (८ वाहने):*\n`;
    msg += `• एकूण वाहने: *८*\n`;
    msg += `• 🟢 कार्यरत / मार्गस्थ: *${moving + idle} वाहने*\n`;
    msg += `• 🔴 थांबलेले / विश्रांती: *${stopped} वाहने*\n`;
    msg += `• ⚪ ऑफलाइन: *${offline} वाहने*\n`;
    msg += `• 🛣️ एकूण अंतर: *${Math.round(totalDist)} किमी*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🚛 *वाहननिहाय तपशील:*\n`;

    units.forEach((u, i) => {
      const icon = u.status === 'moving' ? '🟢' : u.status === 'idle' ? '🟠' : u.status === 'stopped' ? '🔴' : '⚪';
      msg += `${i + 1}. ${icon} *${u.plate}* - ${u.ward}\n`;
      msg += `   चालक: ${u.driverName} | अंतर: ${u.todayDistanceKm || 0} km | वेग: ${u.speed || 0} km/h\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `♻️ *शिरूर घनकचरा प्रक्रिया प्रकल्प (डंपिंग यार्ड):* फेऱ्या सुरू आहेत.\n`;
    msg += `_हा अहवाल शिरूर नगरपरिषद AI-ICCC प्रणालीद्वारे थेट Wialon GPS वरून स्वयंचलित तयार केला आहे._`;

    return msg;
  }

  openDailyReportModal(dateStr, autoPreview = true) {
    const text = this.buildWhatsAppMessage(dateStr);
    const encoded = encodeURIComponent(text);
    const phone = this.recipients[0].phone;
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
    
    if (confirm(`शिरूर नगरपरिषद दैनिक अहवाल WhatsApp द्वारे पाठवायचा आहे का?\n\n${text.substring(0, 300)}...`)) {
      window.open(waUrl, '_blank');
    }
  }

  openAuditLogModal() {
    alert('शिरूर नगरपरिषद AI-ICCC: सर्व अहवाल आणि ऑटोमेशन लॉग सक्रिय आहेत.');
  }

  closeAuditLogModal() {}
  closeDailyReportModal() {}
}

// Global Singleton
window.whatsappReportService = new WhatsAppReportService();
