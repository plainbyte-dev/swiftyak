import { ShipmentStatus, CourierStatus } from '@/components/ui/StatusBadge';

export interface ApiCourier {
  _id: string;
  name: string;
  vehicle: 'Motorcycle' | 'Van' | 'Bicycle' | 'Car' | 'Truck';
  status: CourierStatus;
  location: string;
  lastPingAt: string;
  phone?: string;
  initials: string;
  // Computed server-side in GET /couriers
  currentShipment?: string | null;
  deliveriesLeft?: number;
}

export interface NotificationPreferences {
  newShipment: boolean;
  statusUpdate: boolean;
  courierAlert: boolean;
  weeklyReport: boolean;
  smsAlerts: boolean;
}

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'viewer';
  company: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  phone: string;
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
}

export interface VolumeDataPoint {
  day: string;           // 'Mon', 'Tue', ... or ISO date for longer ranges
  shipments: number;
  delivered: number;
  failed: number;
}

export interface CompanyPerformance {
  companyId: string;
  company: string;
  shipments: number;
  onTime: number;        // percentage, e.g. 94
  revenue: number;        // raw number — format with toLocaleString in the UI, not the API
}

export interface CourierPerformance {
  courierId: string;
  name: string;
  deliveries: number;
  onTime: number;
  rating: number;
}

export interface ReportsSummary {
  totalShipments: number;
  totalShipmentsChangePct: number;
  delivered: number;
  deliveredChangePct: number;
  onTimeRate: number;
  onTimeRateChangePct: number;
  failedOrCancelled: number;
  failedChangePct: number;
  activeCouriers: number;
  activeCouriersChange: number;
  partnerCompanies: number;
  partnerCompaniesChange: number;
}

export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface ApiShipment {
  _id: string;
  trackingNumber: string;
  recipient: string;
  phone?: string;
  origin: string;
  destination: string;
  courier: { _id: string; name: string; vehicle: string; status: CourierStatus } | null;
  status: ShipmentStatus;
  weightKg: number;
  eta: string | null;
  deliveredAt?: string | null;
  notes?: string;
  price?: number;
  sender?: ShipmentSender;
  consignee?: ShipmentConsignee;
  freight?: ShipmentFreight;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentSender {
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
}

export interface ShipmentConsignee {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  contact?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
}

export interface ShipmentFreight {
  houseBill?: string;
  masterBill?: string;
  flightNo?: string;
  airlineCode?: string;
  iataLoadPort?: string;
  iataDestPort?: string;
  portDestination?: string;
  pieces?: number;
  volumetricWeightKg?: number;
  declaredValueUsd?: number;
  currencyCode?: string;
  contentType?: string;
  descriptionOfGoods?: string;
  remarks?: string;
}

export interface DashboardMetrics {
  onTimeDeliveryRate: number | null;
  shipmentsToday: number;
  shipmentsTodayDelta: number;
  activeCouriers: number;
  couriersAvailable: number;
  couriersBusy: number;
  couriersOffline: number;
  avgDeliveryTimeMinutes: number | null;
  inTransitNow: number;
  failedDeliveriesToday: number;
  failedDeliveriesDelta: number;
  pendingAssignment: number;
  oldestPendingMinutes: number | null;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface ApiCompany {
  _id: string;
  name: string;
  contact: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'active' | 'pending' | 'suspended';
  plan: 'Starter' | 'Business' | 'Enterprise';
  createdAt: string;
  updatedAt: string;
}

// ─── PAN Bills ──────────────────────────────────────────────────────────────

export type PaymentMode = 'cash' | 'bank' | 'wallet' | 'credit';

export interface BillItem {
  awb: string;
  from: string;
  to: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface ApiBill {
  _id: string;
  billNumber: number;
  billDate: string;
  customer: {
    name: string;
    pan: string;
    address: string;
    phone: string;
  };
  /** Seller details as they were when the bill was issued. Missing on very old bills. */
  seller?: { name: string; shortName?: string; address: string; phone: string; email: string; pan: string };
  items: BillItem[];
  /** "Delivery charges" — sum of the item amounts */
  subtotal: number;
  codCharge: number;
  otherCharges: number;
  discount: number;
  /** Net amount payable */
  total: number;
  paymentMode: PaymentMode;
  remarks: string;
  status: 'issued' | 'cancelled';
  cancelReason: string;
  cancelledAt: string | null;
  createdBy?: { _id: string; name: string } | string;
  createdAt: string;
}

export interface BillSettings {
  businessName: string;
  /** Used on the stamp and "For … Authorised Signatory", e.g. "Swift Yak Pvt. Ltd." */
  shortName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  pan: string;
  signatoryName: string;
  signatoryTitle: string;
  footerNote: string;
  /** Small print bottom-left, e.g. printing press details */
  printerNote: string;
  /** data: URLs, or '' when not uploaded */
  logo: string;
  stamp: string;
  signature: string;
}

export type BillSettingsImage = 'logo' | 'stamp' | 'signature';
