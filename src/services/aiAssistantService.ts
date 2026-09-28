import { db } from '../database/store';

export class AiAssistantService {
  // Grounded Tool Implementations
  public getLiveVehicles() {
    return Array.from(db.vehicles.values()).map(v => ({
      id: v.id,
      number: v.registrationNumber,
      type: v.vehicleType,
      status: v.status,
      speed: `${v.speed} km/h`,
      ward: db.wards.get(v.wardId)?.name || v.wardId,
      lat: v.latitude,
      lng: v.longitude
    }));
  }

  public getActiveAlerts() {
    return Array.from(db.alerts.values())
      .filter(a => a.status === 'OPEN')
      .map(a => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        description: a.description,
        time: a.timestamp
      }));
  }

  public getStoppageOver10Min() {
    return Array.from(db.vehicles.values())
      .filter(v => (v.status === 'STOPPED' || v.speed === 0) && v.currentStopDurationMinutes >= 10)
      .map(v => ({
        number: v.registrationNumber,
        type: v.vehicleType,
        ward: db.wards.get(v.wardId)?.name || v.wardId,
        durationMinutes: v.currentStopDurationMinutes,
        location: `${v.latitude}, ${v.longitude}`
      }));
  }

  public getRouteDeviations() {
    return Array.from(db.vehicles.values())
      .filter(v => v.status === 'ROUTE_DEVIATION')
      .map(v => ({
        number: v.registrationNumber,
        type: v.vehicleType,
        route: db.routes.get(v.routeId)?.routeName || v.routeId,
        speed: `${v.speed} km/h`,
        compliance: `${v.routeCompliancePct}%`
      }));
  }

  public getFleetSummary() {
    const all = Array.from(db.vehicles.values());
    return {
      total: all.length,
      moving: all.filter(v => v.status === 'MOVING').length,
      stopped: all.filter(v => v.status === 'STOPPED').length,
      idle: all.filter(v => v.status === 'IDLE').length,
      offline: all.filter(v => v.status === 'OFFLINE').length,
      deviated: all.filter(v => v.status === 'ROUTE_DEVIATION').length,
      completed: all.filter(v => v.status === 'COMPLETED').length
    };
  }

  public getCollectionStatus() {
    let totalPoints = 0;
    let completedPoints = 0;
    db.routes.forEach(r => {
      totalPoints += r.collectionPoints.length;
      completedPoints += r.collectionPoints.filter(p => p.isCollectedToday).length;
    });
    return {
      totalPoints,
      completedPoints,
      pendingPoints: totalPoints - completedPoints,
      completionPercentage: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0
    };
  }

  // Natural Language grounded query handler (मराठी, English, हिंदी)
  public async query(prompt: string, language: 'mr' | 'en' | 'hi' = 'mr'): Promise<{ reply: string; data?: any }> {
    const q = prompt.toLowerCase().trim();

    // 1. Stoppage queries (10 min stoppage)
    if (q.includes('१० मिनिट') || q.includes('10 मिनिट') || q.includes('10 min') || q.includes('थांबली')) {
      const stoppedVehicles = this.getStoppageOver10Min();
      if (stoppedVehicles.length === 0) {
        return {
          reply: language === 'mr'
            ? 'सध्या शिरूर नगर परिषदेचे कोणतेही वाहन १० मिनिटांपेक्षा जास्त थांबलेले नाही. सर्व वाहने सुरळीत सुरू आहेत.'
            : 'Currently, no waste collection vehicle is stopped for more than 10 minutes.',
          data: stoppedVehicles
        };
      }
      const details = stoppedVehicles
        .map(v => `• ${v.number} (${v.type}) - ${v.ward} मध्ये ${v.durationMinutes} मिनिटांपासून थांबले आहे.`)
        .join('\n');
      return {
        reply: language === 'mr'
          ? `खालील वाहने १० मिनिटांपेक्षा जास्त थांबलेली आढळली आहेत (ऑटो-कॉल अलर्ट पाठवला आहे):\n\n${details}`
          : `The following vehicles have stopped for >10 minutes:\n\n${details}`,
        data: stoppedVehicles
      };
    }

    // 2. Active / Live Vehicles query
    if (q.includes('किती गाड्या') || q.includes('चालू आहेत') || q.includes('how many vehicles') || q.includes('active vehicles')) {
      const summary = this.getFleetSummary();
      return {
        reply: language === 'mr'
          ? `शिरूर नगर परिषद एकूण ताफा तपशील:\n• एकूण वाहने: ${summary.total}\n• धावणारी वाहने (Moving): ${summary.moving}\n• थांबलेली (Stopped): ${summary.stopped}\n• निष्क्रिय (Idle): ${summary.idle}\n• मार्ग भरकटलेली (Deviated): ${summary.deviated}\n• कार्य पूर्ण (Completed): ${summary.completed}\n• ऑफलाइन (Offline): ${summary.offline}`
          : `Shirur Fleet Summary:\nTotal: ${summary.total} | Moving: ${summary.moving} | Stopped: ${summary.stopped} | Idle: ${summary.idle} | Deviated: ${summary.deviated} | Completed: ${summary.completed}`,
        data: summary
      };
    }

    // 3. Route Deviation queries
    if (q.includes('deviation') || q.includes('मार्ग') || q.includes('भरकट') || q.includes('route')) {
      const devs = this.getRouteDeviations();
      if (devs.length === 0) {
        return {
          reply: language === 'mr'
            ? 'आज कोणत्याही वाहनाने ठरवून दिलेल्या मार्गाचे विचलन (Route Deviation) केलेले नाही.'
            : 'No route deviations detected today.',
          data: devs
        };
      }
      const text = devs.map(d => `• ${d.number} (${d.type}) - मार्ग: ${d.route}, अनुपालन: ${d.compliance}`).join('\n');
      return {
        reply: language === 'mr'
          ? `खालील वाहने ठरवून दिलेल्या मार्गाबाहेर (Route Deviation) आढळली आहेत:\n\n${text}`
          : `Vehicles currently off-route:\n\n${text}`,
        data: devs
      };
    }

    // 4. Collection points query
    if (q.includes('collection') || q.includes('कचरा') || q.includes('संकलन') || q.includes('पॉइंट्स')) {
      const coll = this.getCollectionStatus();
      return {
        reply: language === 'mr'
          ? `आजचे कचरा संकलन प्रगती अहवाल:\n• एकूण संकलन पॉइंट्स: ${coll.totalPoints}\n• पूर्ण झाले: ${coll.completedPoints} (${coll.completionPercentage}%)\n• शिल्लक पॉइंट्स: ${coll.pendingPoints}`
          : `Collection Progress: Total: ${coll.totalPoints}, Completed: ${coll.completedPoints} (${coll.completionPercentage}%), Pending: ${coll.pendingPoints}`,
        data: coll
      };
    }

    // 5. Alerts query
    if (q.includes('alert') || q.includes('अलर्ट') || q.includes('तक्रार')) {
      const alerts = this.getActiveAlerts();
      return {
        reply: language === 'mr'
          ? `सध्या सिस्टीममध्ये ${alerts.length} सक्रिय अलर्ट्स आहेत.`
          : `Currently ${alerts.length} active alerts in the system.`,
        data: alerts
      };
    }

    // Default grounded fallback
    return {
      reply: language === 'mr'
        ? `आपला प्रश्न समजला. आपण खालीलपैकी विचारू शकता:\n१. "आज किती गाड्या चालू आहेत?"\n२. "कोणती गाडी १० मिनिटांपेक्षा जास्त थांबली?"\n३. "कोणत्या वाहनाने route deviation केले?"\n४. "आजचे कचरा संकलन किती पूर्ण झाले?"`
        : `I can assist with real-time operational queries. Try asking about active vehicles, stopped vehicles (>10 min), route deviations, or collection progress.`
    };
  }
}

export const aiAssistantService = new AiAssistantService();
