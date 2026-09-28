export type UserRole =
  | 'SUPER_ADMIN'
  | 'MUNICIPAL_COMMISSIONER'
  | 'ADMINISTRATOR'
  | 'HEALTH_SWM_OFFICER'
  | 'SANITARY_INSPECTOR'
  | 'WARD_OFFICER'
  | 'FLEET_MANAGER'
  | 'SUPERVISOR'
  | 'DRIVER'
  | 'FIELD_WORKER'
  | 'CONTRACTOR'
  | 'BILLING_OFFICER'
  | 'CALL_CENTER_OPERATOR'
  | 'CITIZEN';

export type VehicleStatus =
  | 'MOVING'
  | 'STOPPED'
  | 'IDLE'
  | 'OFFLINE'
  | 'ROUTE_DEVIATION'
  | 'ALERT'
  | 'COMPLETED';

export type VehicleCategory =
  | 'Ghantagadi'
  | 'Tipper'
  | 'Compactor'
  | 'Sweeper'
  | 'Tractor'
  | 'Water Tanker'
  | 'Drain Cleaning Vehicle'
  | 'Sewerage Vehicle'
  | 'Canal Cleaning Vehicle'
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  wardId?: string;
  language: 'mr' | 'en' | 'hi';
  isActive: boolean;
  createdAt: string;
}

export interface Ward {
  id: string;
  wardNumber: number;
  name: string;
  nameMr: string;
  officerName: string;
  officerPhone: string;
  population: number;
  dailyWasteTargetKg: number;
  center: [number, number]; // [lat, lng]
  boundary: [number, number][]; // Polygon coordinates
}

export interface WialonUnit {
  id: number;
  name: string;
  imei: string;
  hardwareType: string;
  phone?: string;
  lastPosition?: {
    lat: number;
    lng: number;
    speed: number;
    course: number;
    altitude: number;
    time: number;
  };
  sensors?: Record<string, any>;
  mappedVehicleId?: string;
  connectionStatus: 'ONLINE' | 'OFFLINE' | 'NO_SIGNAL';
}

export interface Vehicle {
  id: string;
  registrationNumber: string; // e.g. MH-12-SN-1001
  vehicleType: VehicleCategory;
  wardId: string;
  routeId: string;
  driverId: string;
  helperId?: string;
  contractorId: string;
  gpsDeviceId: string;
  wialonUnitId?: number;
  fuelType: 'DIESEL' | 'CNG' | 'ELECTRIC' | 'PETROL';
  fuelTankCapacityLiters: number;
  currentFuelLevelLiters?: number;
  purchaseDate: string;
  insuranceExpiry: string;
  pucExpiry: string;
  fitnessExpiry: string;
  status: VehicleStatus;
  speed: number;
  ignition: boolean;
  latitude: number;
  longitude: number;
  heading: number;
  lastGpsTimestamp: string;
  todayDistanceKm: number;
  todayWorkingMinutes: number;
  todayIdleMinutes: number;
  todayStopsCount: number;
  currentStopDurationMinutes: number;
  routeCompliancePct: number;
  collectionStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface RoutePoint {
  id: string;
  sequence: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  isCollectedToday: boolean;
  collectedAt?: string;
  qrAssetCode?: string;
}

export interface Route {
  id: string;
  routeName: string;
  wardId: string;
  vehicleId: string;
  vehicleType: VehicleCategory;
  startPoint: { name: string; lat: number; lng: number };
  endPoint: { name: string; lat: number; lng: number };
  path: [number, number][]; // LineString
  collectionPoints: RoutePoint[];
  distanceKm: number;
  estimatedMinutes: number;
  collectionType: 'DOOR_TO_DOOR' | 'COMMERCIAL' | 'BULK';
  frequency: 'DAILY_MORNING' | 'DAILY_EVENING' | 'TWICE_DAILY' | 'ALTERNATE_DAYS';
  driverId: string;
  workerId: string;
  status: 'ACTIVE' | 'PLANNED' | 'ARCHIVED';
}

export interface Geofence {
  id: string;
  name: string;
  type:
    | 'MUNICIPAL_BOUNDARY'
    | 'WARD'
    | 'COLLECTION_ZONE'
    | 'DEPOT'
    | 'DUMPING_GROUND'
    | 'TRANSFER_STATION'
    | 'PARKING_AREA'
    | 'RESTRICTED_AREA'
    | 'WORKSHOP'
    | 'FUEL_STATION'
    | 'PUBLIC_TOILET';
  polygon: [number, number][];
  speedLimitKmH?: number;
  maxDwellMinutes?: number;
  isActive: boolean;
}

export interface Alert {
  id: string;
  vehicleId?: string;
  wardId?: string;
  type:
    | 'STOPPED_OVER_10_MIN'
    | 'ROUTE_DEVIATION'
    | 'OVERSPEED'
    | 'GEOFENCE_VIOLATION'
    | 'OFFLINE'
    | 'BIN_OVERFLOW'
    | 'TOILET_UNHYGIENIC'
    | 'DRAIN_PENDING'
    | 'EMERGENCY_SOS';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  timestamp: string;
  resolvedAt?: string;
  resolvedBy?: string;
  autoCallTriggered: boolean;
  autoCallStatus?: 'INITIATED' | 'ANSWERED' | 'NO_ANSWER' | 'BUSY' | 'RESOLVED';
}

export interface SmartBin {
  id: string;
  binCode: string;
  wardId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  capacityLiters: number;
  fillLevelPct: number;
  batteryPct: number;
  temperatureC: number;
  tiltAlert: boolean;
  fireAlert: boolean;
  lastPingTime: string;
  qrAssetCode: string;
  status: 'NORMAL' | 'NEAR_FULL' | 'OVERFLOW' | 'FIRE_ALERT' | 'OFFLINE';
}

export interface PublicToilet {
  id: string;
  toiletCode: string;
  name: string;
  wardId: string;
  latitude: number;
  longitude: number;
  maleSeats: number;
  femaleSeats: number;
  disabledFriendly: boolean;
  waterAvailable: boolean;
  lightingWorking: boolean;
  odourLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  cleanlinessScore: number; // 1-5
  lastCleanedAt: string;
  nextScheduledCleaning: string;
  workerId?: string;
  qrAssetCode: string;
}

export interface CleaningTask {
  id: string;
  taskType: 'SEWERAGE' | 'DRAIN' | 'CANAL' | 'PUBLIC_TOILET';
  wardId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  assignedWorkerId: string;
  assignedVehicleId?: string;
  scheduledDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  measurementValue?: number;
  measurementUnit?: string;
  notes?: string;
  completedAt?: string;
}

export interface Complaint {
  id: string;
  complaintNumber: string; // SNP-CMP-2026-001
  citizenName: string;
  citizenPhone: string;
  category:
    | 'GARBAGE_NOT_COLLECTED'
    | 'OPEN_GARBAGE'
    | 'ROAD_CLEANING'
    | 'DRAIN_ISSUE'
    | 'PUBLIC_TOILET'
    | 'VEHICLE_ISSUE'
    | 'OTHER';
  wardId: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description: string;
  photoUrl?: string;
  status:
    | 'SUBMITTED'
    | 'ASSIGNED'
    | 'ACCEPTED'
    | 'IN_PROGRESS'
    | 'RESOLVED'
    | 'VERIFIED'
    | 'CLOSED';
  assignedOfficerId?: string;
  resolutionNotes?: string;
  resolutionPhotoUrl?: string;
  citizenRating?: number; // 1-5
  createdAt: string;
  resolvedAt?: string;
}

export interface Contractor {
  id: string;
  name: string;
  registrationNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  vehicleCount: number;
  assignedWards: string[];
  monthlyContractValueInr: number;
  penaltyPerMissedTripInr: number;
  performanceScorePct: number;
}

export interface MonthlyInvoice {
  id: string;
  invoiceNumber: string;
  contractorId: string;
  month: string; // YYYY-MM
  baseAmount: number;
  scheduledTrips: number;
  completedTrips: number;
  missedTrips: number;
  stoppagePenalty: number;
  deviationPenalty: number;
  breakdownDeduction: number;
  netPayableAmount: number;
  status: 'DRAFT' | 'VERIFIED' | 'APPROVED' | 'PAID';
  generatedAt: string;
  approvedBy?: string;
}

export interface WialonSettings {
  serverType: 'WIALON_HOSTING' | 'WIALON_LOCAL';
  apiHost: string;
  token: string;
  user: string;
  resourceId: string;
  accountId: string;
  syncIntervalSec: number;
  enableLiveTracking: boolean;
  enableEvents: boolean;
  enableReports: boolean;
  enableGeofences: boolean;
  lastSyncTime?: string;
  connectionStatus: 'CONNECTED' | 'DELAYED' | 'DISCONNECTED';
  lastError?: string;
}

export interface SystemSettings {
  municipalityName: string;
  municipalityTagline: string;
  headOfficeAddress: string;
  emergencyHelpline: string;
  stoppedDurationThresholdMinutes: number;
  routeDeviationThresholdMeters: number;
  overspeedThresholdKmH: number;
  wialon: WialonSettings;
  openAiApiKey?: string;
  whatsAppEnabled: boolean;
  telegramEnabled: boolean;
  autoCallingEnabled: boolean;
}
