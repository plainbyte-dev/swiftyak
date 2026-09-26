import { API_BASE } from './env';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON response (e.g. the API is unreachable) — fall through to the status check below.
  }

  if (!res.ok) {
    throw new ApiError(res.status, body?.message || `Request to ${path} failed with ${res.status}`);
  }

  return body as T;
}

// ─── Tracking ───────────────────────────────────────────────────────────────

export type ShipmentStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface TrackedShipmentEvent {
  status: ShipmentStatus;
  changedAt: string;
}

export interface TrackedShipment {
  trackingNumber: string;
  status: ShipmentStatus;
  statusHistory: TrackedShipmentEvent[];
  origin: string;
  destination: string;
  weightKg: number;
  eta: string | null;
  deliveredAt: string | null;
  courier: { name: string; vehicle: string } | null;
}

export function trackShipment(trackingNumber: string) {
  return request<{ success: boolean; data: TrackedShipment }>(
    `/public/track/${encodeURIComponent(trackingNumber)}`
  );
}

// ─── Booking requests ───────────────────────────────────────────────────────

export interface BookingRequestInput {
  name: string;
  email: string;
  phone: string;
  origin: string;
  destination: string;
  isInternational: boolean;
  destCountry?: string;
  weightKg: number;
  serviceType?: string;
  notes?: string;
  estimatedPrice?: string;
}

export interface BookingRequestResult {
  _id: string;
  status: 'new' | 'contacted' | 'converted' | 'rejected';
  createdAt: string;
}

export function submitBookingRequest(data: BookingRequestInput) {
  return request<{ success: boolean; data: BookingRequestResult }>('/booking-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export { ApiError };
