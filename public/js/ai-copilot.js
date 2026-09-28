/**
 * SHIRUR NAGAR PARISHAD - AI-ENABLED INTEGRATED COMMAND & CONTROL CENTER (AI-ICCC)
 * Intelligent Municipal Fleet AI Assistant (शिरूर AI Copilot)
 * 
 * Directly queries Wialon GPS Telemetry for the 8 verified Shirur Nagar Parishad vehicles:
 * 1. 601639146 -> S MH 12 QW 8149 (407)
 * 2. 601638334 -> S MH 12 VT 2894
 * 3. 601638245 -> S MH 12 VT 2895
 * 4. 601639156 -> S MH 12 XM 6731
 * 5. 601639166 -> S MH 12 XM 6994
 * 6. 601639142 -> S MH 12 XM 6995
 * 7. 601639160 -> S MH 12 XM 6997
 * 8. 601639158 -> S MH 12 XM 7019
 *
 * NO DEMO ANSWERS. NO FAKE GPS COORDINATES.
 * If data is unavailable: "या वाहनाचा सध्या GPS data उपलब्ध नाही."
 */

class SmartFleetAICopilot {
  constructor() {
    this.isOpen = false;
    this.isListening = false;
    this.recognition = null;
    this.chatHistory = [];
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'mr-IN';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateMicUI();
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const inputEl = document.getElementById('aiChatInput');
        if (inputEl) {
          inputEl.value = transcript;
          this.handleSendMessage();
        }
      };

      this.recognition.onerror = () => {
        this.isListening = false;
        this.updateMicUI();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateMicUI();
      };
    }
  }

  toggleVoiceRecognition() {
    if (!this.recognition) {
      alert('तुमच्या ब्राऊझरमध्ये व्हॉईस रेकग्निशन सपोर्ट नाही. कृपया Google Chrome वापरा.');
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  updateMicUI() {
    const micBtn = document.getElementById('btnAiMic');
    if (!micBtn) return;
    if (this.isListening) {
      micBtn.classList.add('listening');
      micBtn.title = 'ऐकत आहे... बोला (Listening...)';
    } else {
      micBtn.classList.remove('listening');
      micBtn.title = 'मायक्रोफोन (बोलून विचारा)';
    }
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById('aiSidebarPanel');
    const floatBtn = document.getElementById('btnFloatAi');
    if (panel) {
      panel.classList.toggle('open', this.isOpen);
    }
    if (floatBtn) {
      floatBtn.style.display = this.isOpen ? 'none' : 'flex';
    }
  }

  sendQuickPrompt(text) {
    const input = document.getElementById('aiChatInput');
    if (input) {
      input.value = text;
      this.handleSendMessage();
    }
  }

  /**
   * Process Marathi and English Municipal Queries against Live Wialon Fleet Data
   */
  async processQuery(userInput) {
    const text = userInput.trim().toLowerCase();
    const units = window.wialonService ? window.wialonService.units : [];

    // 1. SPECIFIC VEHICLE QUERY (e.g., "MH 12 XM 6994 कुठे आहे?", "6994", "8149", "2894", etc.)
    const plateMatch = text.match(/(\d{4})/);
    if (plateMatch || text.includes('mh 12') || text.includes('xm') || text.includes('vt') || text.includes('qw')) {
      const searchNum = plateMatch ? plateMatch[1] : (text.match(/([a-z0-9\s]{4,})/i) || [''])[0];
      
      const vehicle = units.find(u => {
        const p = (u.plate || '').toLowerCase();
        const s = (u.shortName || '').toLowerCase();
        return p.includes(searchNum) || s.includes(searchNum) || String(u.id).includes(searchNum);
      });

      if (vehicle) {
        if (!vehicle.hasGps || vehicle.lat === null || vehicle.lng === null) {
          return {
            text: `📍 **${vehicle.plate}** (${vehicle.ward}):\n\n` +
                  `⚠️ **या वाहनाचा सध्या GPS data उपलब्ध नाही.**\n` +
                  `• सद्यस्थिती: **${vehicle.status.toUpperCase()}**\n` +
                  `• चालक: ${vehicle.driverName} (${vehicle.driverPhone})\n` +
                  `• Wialon Unit ID: \`${vehicle.id}\``,
            action: null
          };
        }

        const statusIcon = vehicle.status === 'moving' ? '🟢 चालू / फिरत आहे (MOVING)' : vehicle.status === 'idle' ? '🟠 आइडल (IDLE)' : '🔴 थांबलेले (STOPPED)';

        return {
          text: `🛰️ **${vehicle.plate}** ची थेट Wialon GPS सद्यस्थिती:\n\n` +
                `• **वाहन प्रकार:** ${vehicle.vehicleType}\n` +
                `• **प्रभाग / क्षेत्र:** ${vehicle.ward}\n` +
                `• **सद्यस्थिती:** ${statusIcon}\n` +
                `• **थेट वेग (Speed):** ${vehicle.speed} km/h\n` +
                `• **अक्षांश व रेखांश:** \`${vehicle.lat.toFixed(5)}° N, ${vehicle.lng.toFixed(5)}° E\`\n` +
                `• **आज कापलेले अंतर:** ${vehicle.todayDistanceKm} km\n` +
                `• **इग्निशन (ACC):** ${vehicle.ignition ? '🟢 चालू (ON)' : '🔴 बंद (OFF)'}\n` +
                `• **बॅटरी व्होल्टेज:** ${vehicle.batteryVoltage}\n` +
                `• **नियुक्त चालक:** ${vehicle.driverName} (${vehicle.driverPhone})\n` +
                `• **शेवटचा सिग्नल:** ${vehicle.lastUpdate}\n` +
                `• **Wialon Unit ID:** \`${vehicle.id}\``,
          action: {
            type: 'FOCUS_VEHICLE',
            vehicleId: vehicle.id,
            label: `🗺️ नकाशामध्ये ${vehicle.shortName} पहा`
          }
        };
      }
    }

    // 2. LIVE VEHICLES QUERY ("सध्या कोणत्या गाड्या live आहेत?", "active vehicles", "चालू गाड्या", "moving")
    if (text.includes('live') || text.includes('चालू') || text.includes('सक्रिय') || text.includes('moving') || text.includes('धावत')) {
      const active = units.filter(u => u.status === 'moving' || u.status === 'idle');
      if (active.length === 0) {
        return {
          text: `ℹ️ शिरूर नगरपरिषदेची सर्व वाहने सध्या थांबलेली (STOPPED) किंवा विश्रांतीवर आहेत. थेट धावणारी कोणतीही गाडी नाही.`
        };
      }

      const listText = active.map((u, i) =>
        `${i + 1}️⃣ **${u.plate}** (${u.ward}) - ${u.speed} km/h • चालक: ${u.driverName}`
      ).join('\n');

      return {
        text: `🟢 **शिरूर नगरपरिषद – सध्या थेट Live असलेली वाहने (${active.length}/8):**\n\n` +
              listText +
              `\n\n💡 _ही माहिती Wialon GPS Remote API वरून रिअल-टाइम थेट प्राप्त होत आहे._`,
        action: {
          type: 'FIT_FLEET',
          label: '🛰️ नकाशामध्ये सर्व वाहने पहा'
        }
      };
    }

    // 3. STOPPED VEHICLES QUERY ("कोणत्या गाड्या थांबलेल्या आहेत?", "stopped", "idle", "पार्क")
    if (text.includes('थांब') || text.includes('stopped') || text.includes('पार्क') || text.includes('बंद')) {
      const stopped = units.filter(u => u.status === 'stopped' || u.status === 'offline');
      const listText = stopped.map((u, i) =>
        `${i + 1}️⃣ **${u.plate}** (${u.ward}) - ${u.status.toUpperCase()} • चालक: ${u.driverName}`
      ).join('\n');

      return {
        text: `🔴 **शिरूर नगरपरिषद – थांबलेली / ऑफलाइन वाहने (${stopped.length}/8):**\n\n` +
              listText +
              `\n\n⏱️ _१० मिनिटांपेक्षा जास्त वेळ विनापरवाना थांबल्यास सिस्टीम आपोआप नोटीस जारी करते._`
      };
    }

    // 4. FLEET TOTAL / SUMMARY ("एकूण वाहने किती आहेत?", "total vehicles", "fleet summary", "शिरूर फ्लीट")
    if (text.includes('एकूण') || text.includes('वाहने') || text.includes('fleet') || text.includes('गाड्या') || text.includes('summary')) {
      const summary = window.wialonService ? window.wialonService.getFleetSummary() : { totalVehicles: 8, moving: 0, stopped: 8 };
      return {
        text: `🏛️ **शिरूर नगरपरिषद AI-ICCC – अधिकृत फ्लीट माहिती:**\n\n` +
              `• **एकूण अधिकृत वाहने:** 8 (सर्व MH-12)\n` +
              `• **Wialon GPS थेट कनेक्ट:** ${summary.liveGps}/8 वाहने\n` +
              `• **सध्या धावणारी (Moving):** ${summary.moving} वाहने\n` +
              `• **आइडल (Idle):** ${summary.idle} वाहने\n` +
              `• **थांबलेली (Stopped):** ${summary.stopped} वाहने\n` +
              `• **ऑफलाइन (Offline):** ${summary.offline} वाहने\n` +
              `• **आज कापलेले एकूण अंतर:** ${summary.totalDistanceKm} km\n\n` +
              `📍 _सर्व ८ वाहने शिरूर शहर व प्रभाग कचरा संकलनासाठी नियुक्त आहेत._`
      };
    }

    // 5. DUMPING GROUND & GEOFENCE ("डंपिंग ग्राउंड", "कचरा डेपो", "फेऱ्या", "dumping", "trips")
    if (text.includes('डंपिंग') || text.includes('dumping') || text.includes('डेपो') || text.includes('फेऱ्या') || text.includes('trips')) {
      return {
        text: `♻️ **शिरूर घनकचरा प्रक्रिया प्रकल्प व डंपिंग यार्ड (रामलिंग रोड):**\n\n` +
              `• **लक्ष्यित जिओफेन्स:** शिरूर घनकचरा प्रकल्प\n` +
              `• **किमान फेरी अंतर नियम:** ३० मिनिटे अंतर बंधनकारक\n` +
              `• **दैनिक संकलन उद्दिष्ट:** १००% प्रभाग व वाड्या संकलन\n\n` +
              `📑 _तपशीलवार Excel ट्रिप अहवाल डाउनलोड करण्यासाठी वरील 'डंपिंग ट्रिप अहवाल (Excel)' बटनावर क्लिक करा._`,
        action: {
          type: 'DOWNLOAD_DUMPING_EXCEL',
          label: '📥 डंपिंग ट्रिप Excel डाउनलोड करा'
        }
      };
    }

    // Default Fallback
    return {
      text: `मी **शिरूर नगरपरिषद AI फ्लीट सहाय्यक (SHIRUR AI-ICCC)** आहे.\n\n` +
            `तुम्ही मला पुढीलप्रमाणे प्रश्न विचारू शकता:\n` +
            `• _"सध्या कोणत्या गाड्या live आहेत?"_\n` +
            `• _"S MH 12 XM 6994 कुठे आहे?"_\n` +
            `• _"कोणती वाहने थांबलेली आहेत?"_\n` +
            `• _"एकूण वाहने किती आहेत?"_\n` +
            `• _"शिरूर कचरा डेपो फेऱ्यांची स्थिती काय आहे?"_`
    };
  }

  async handleSendMessage() {
    const input = document.getElementById('aiChatInput');
    if (!input || !input.value.trim()) return;

    const userText = input.value.trim();
    input.value = '';

    // Append User Message
    this.appendMessage('user', userText);

    // Show Thinking indicator
    const thinkingId = this.appendThinking();

    // Query Answer
    const response = await this.processQuery(userText);

    // Remove Thinking and append AI Response
    this.removeThinking(thinkingId);
    this.appendMessage('ai', response.text, response.action);
  }

  appendMessage(sender, text, action = null) {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `chat-bubble chat-msg-${sender}`;

    const senderName = sender === 'user' ? 'तुम्ही (You)' : '🤖 शिरूर नगरपरिषद AI';
    
    // Markdown-like parser for bold and linebreaks
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.06);padding:2px 4px;border-radius:4px;">$1</code>')
      .replace(/\n/g, '<br>');

    let actionBtnHtml = '';
    if (action && action.label) {
      actionBtnHtml = `
        <div style="margin-top: 8px;">
          <button class="btn btn-sm btn-primary" style="font-size: 11px; padding: 4px 10px;" onclick="window.aiCopilot.executeAction('${action.type}', '${action.vehicleId || ''}')">
            ${action.label}
          </button>
        </div>
      `;
    }

    div.innerHTML = `
      <div class="chat-sender-name">${senderName}</div>
      <div class="chat-bubble-content">${formattedText}</div>
      ${actionBtnHtml}
    `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  executeAction(type, vehicleId) {
    if (type === 'FOCUS_VEHICLE' && vehicleId) {
      if (window.app) window.app.selectVehicle(vehicleId);
      if (window.innerWidth <= 1024) this.togglePanel();
    } else if (type === 'FIT_FLEET') {
      if (window.dashboardMap) window.dashboardMap.fitToFleet();
      if (window.innerWidth <= 1024) this.togglePanel();
    } else if (type === 'DOWNLOAD_DUMPING_EXCEL') {
      if (window.geofenceTripService) window.geofenceTripService.openReportModal(new Date());
    }
  }

  appendThinking() {
    const container = document.getElementById('aiChatMessages');
    if (!container) return null;

    const id = 'thinking_' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'chat-bubble chat-msg-ai thinking';
    div.innerHTML = `<div class="chat-bubble-content" style="color: #64748b; font-style: italic;">Wialon GPS डेटा तपासत आहे...</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
  }

  removeThinking(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }
}

// Global Singleton
window.aiCopilot = new SmartFleetAICopilot();
