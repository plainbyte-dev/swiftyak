import type { ApiCourier, ApiShipment, DashboardMetrics, ApiUser, Paginated, ApiCompany, ReportPeriod, CourierPerformance, VolumeDataPoint, CompanyPerformance, ReportsSummary, ShipmentSender, ShipmentConsignee, ShipmentFreight, ApiBill, PaymentMode, BillSettings, BillSettingsImage, ApiVoucher } from './types';
import type { ShipmentStatus, CourierStatus } from '@/components/ui/StatusBadge';

import { API_BASE } from './env';

const TOKEN_KEY = 'cd_token';

export function updateMe(data: Partial<{
  name: string;
  phone: string;
  company: string;
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  theme: ApiUser['theme'];
  notifications: Partial<ApiUser['notifications']>;
}>) {
  return request<{ user: ApiUser }>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function changePassword(data: { currentPassword: string; newPassword: string }) {
  return request<{ success: boolean; message: string }>('/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function getReportsSummary(period: ReportPeriod) {
  return request<{ data: ReportsSummary }>(`/reports/summary?period=${period}`);
}

export function getVolumeTrend(period: ReportPeriod) {
  return request<{ data: VolumeDataPoint[] }>(`/reports/volume?period=${period}`);
}

export function getCompanyPerformance(period: ReportPeriod) {
  return request<{ data: CompanyPerformance[] }>(`/reports/companies?period=${period}`);
}

export function getCourierLeaderboard(period: ReportPeriod) {
  return request<{ data: CourierPerformance[] }>(`/reports/couriers?period=${period}`);
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export interface GetUsersParams {
  search?: string;
  role?: ApiUser['role'] | 'all';
  page?: number;
  perPage?: number;
}

export function getUsers(params: GetUsersParams = {}) {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined) acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return request<Paginated<ApiUser>>(`/users${query ? `?${query}` : ''}`);
}

// Adding a user is two steps: email a 6-digit code to the new user, then verify it.
export function inviteUser(data: {
  name: string;
  email: string;
  password: string;
  role?: ApiUser['role'];
  company?: string;
}) {
  return request<{ message: string; data: { email: string; expiresInMinutes: number; resendAfterSeconds: number } }>('/users/invite', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function resendUserInvite(email: string) {
  return request<{ message: string; data: { email: string; resendAfterSeconds: number } }>('/users/invite/resend', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyUserInvite(email: string, code: string) {
  return request<{ data: ApiUser }>('/users/invite/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function updateUser(id: string, data: Partial<{
  name: string;
  role: ApiUser['role'];
  company: string;
  isActive: boolean;
}>) {
  return request<{ data: ApiUser }>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: string) {
  return request<void>(`/users/${id}`, { method: 'DELETE' });
}
export interface GetCompaniesParams {
  search?: string;
  status?: ApiCompany['status'] | 'all';
  page?: number;
  perPage?: number;
}

export function getCompanies(params: GetCompaniesParams = {}) {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined) acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return request<Paginated<ApiCompany>>(`/companies${query ? `?${query}` : ''}`);
}

export function getCompany(id: string) {
  return request<{ data: ApiCompany }>(`/companies/${id}`);
}

export function createCompany(data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status?: ApiCompany['status'];
  plan?: ApiCompany['plan'];
}) {
  return request<{ data: ApiCompany }>('/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateCompany(id: string, data: Partial<{
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: ApiCompany['plan'];
}>) {
  return request<{ data: ApiCompany }>(`/companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function updateCompanyStatus(id: string, status: ApiCompany['status']) {
  return request<{ data: ApiCompany }>(`/companies/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteCompany(id: string) {
  return request<void>(`/companies/${id}`, { method: 'DELETE' });
}

export interface ShipmentEvent {
  status: ApiShipment['status'];
  changedAt: string;
}

export function getShipmentEvents(shipmentId: string) {
  return request<{ data: ShipmentEvent[] }>(`/shipments/${shipmentId}/events`);
}

interface RequestOptions extends RequestInit {
  /** Next.js data cache behavior. Defaults to no-store — this is a live ops dashboard. */
  cache?: RequestCache;
}

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];

function handleUnauthorized() {
  window.localStorage.removeItem(TOKEN_KEY);
  if (!PUBLIC_PATHS.includes(window.location.pathname)) {
    window.location.href = '/login';
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: options.cache ?? 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    // Token expired/invalid — clear it and bounce to login rather than
    // keep firing requests with a dead token.
    if (res.status === 401 && typeof window !== 'undefined' && path !== '/auth/login') {
      handleUnauthorized();
    }
    throw new ApiError(res.status, body?.message || `Request to ${path} failed with ${res.status}`);
  }

  return body as T;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'dispatcher' | 'courier' | string;


export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export function login(data: { email: string; password: string }) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((res) => {
    setToken(res.token);
    return res;
  });
}

export function forgotPassword(email: string) {
  return request<{ success: boolean; message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(data: { token: string; password: string }) {
  return request<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMe() {
  return request<{ user: ApiUser }>('/auth/me');
}

export function logout() {
  clearToken();
}

// ─── Token storage ──────────────────────────────────────────────────────────

export function getToken(): string | null {
  return typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ─── Shipments ──────────────────────────────────────────────────────────────

export interface GetShipmentsParams {
  search?: string;
  status?: ShipmentStatus | 'all';
  sortKey?: 'trackingNumber' | 'status' | 'createdAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

export function getShipments(params: GetShipmentsParams = {}) {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined) acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return request<Paginated<ApiShipment>>(`/shipments${query ? `?${query}` : ''}`);
}

export function getShipment(id: string) {
  return request<{ data: ApiShipment }>(`/shipments/${id}`);
}

export function createShipment(data: {
  recipient: string;
  origin: string;
  destination: string;
  weightKg: number;
  phone?: string;
  notes?: string;
  eta?: string;
  // Structured shipper/consignee/freight details — feed the printable
  // shipping label and the manifest/invoice exports.
  sender?: Partial<ShipmentSender>;
  consignee?: Partial<ShipmentConsignee>;
  freight?: Partial<ShipmentFreight>;
}) {
  return request<{ data: ApiShipment }>('/shipments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateShipment(id: string, data: Partial<{
  recipient: string;
  origin: string;
  destination: string;
  weightKg: number;
  phone?: string;
  notes?: string;
  eta?: string;
  sender: Partial<ShipmentSender>;
  consignee: Partial<ShipmentConsignee>;
  freight: Partial<ShipmentFreight>;
}>) {
  return request<{ data: ApiShipment }>(`/shipments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function assignCourier(shipmentId: string, courierId: string) {
  return request<{ data: ApiShipment }>(`/shipments/${shipmentId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ courierId }),
  });
}

export function updateShipmentStatus(shipmentId: string, status: ShipmentStatus) {
  return request<{ data: ApiShipment }>(`/shipments/${shipmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteShipment(id: string) {
  return request<void>(`/shipments/${id}`, { method: 'DELETE' });
}

// ─── Couriers ───────────────────────────────────────────────────────────────

export function getCouriers(status?: CourierStatus) {
  const query = status ? `?status=${status}` : '';
  return request<{ data: ApiCourier[]; count: number }>(`/couriers${query}`);
}

export function getCourier(id: string) {
  return request<{ data: ApiCourier }>(`/couriers/${id}`);
}

export function createCourier(data: {
  name: string;
  vehicle: string;
  location?: string;
  phone?: string;
}) {
  return request<{ data: ApiCourier }>('/couriers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateCourier(id: string, data: Partial<{
  name: string;
  vehicle: string;
  location?: string;
  phone?: string;
}>) {
  return request<{ data: ApiCourier }>(`/couriers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function updateCourierStatus(courierId: string, status: CourierStatus) {
  return request<{ data: ApiCourier }>(`/couriers/${courierId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteCourier(id: string) {
  return request<void>(`/couriers/${id}`, { method: 'DELETE' });
}

// ─── Metrics ────────────────────────────────────────────────────────────────

export function getDashboardMetrics() {
  return request<{ data: DashboardMetrics }>('/metrics/dashboard');
}

export { ApiError };

// ─── Avatar ─────────────────────────────────────────────────────────────────

export async function uploadAvatar(file: File) {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;

  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch(`${API_BASE}/auth/avatar`, {
    method: 'POST',
    headers: {
      // Do NOT set Content-Type here — the browser sets the correct
      // multipart boundary automatically when the body is FormData.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON response, fall through to status check
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      handleUnauthorized();
    }
    throw new ApiError(res.status, body?.message || `Avatar upload failed with ${res.status}`);
  }

  return body as { success: boolean; user: ApiUser };
}

// ─── Two-Factor Authentication ─────────────────────────────────────────────

export function setupTwoFactor() {
  return request<{ success: boolean; secret: string; qrCode: string }>('/auth/2fa/setup', {
    method: 'POST',
  });
}

export function verifyTwoFactor(code: string) {
  return request<{ success: boolean; message: string }>('/auth/2fa/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function disableTwoFactor(password: string) {
  return request<{ success: boolean; message: string }>('/auth/2fa/disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// ─── PAN Bills ──────────────────────────────────────────────────────────────

export interface GetBillsParams {
  search?: string;
  status?: ApiBill['status'] | 'all';
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number;
  perPage?: number;
}

export interface BillsResponse extends Paginated<ApiBill> {
  summary: { issuedCount: number; issuedAmount: number };
}

export function getBills(params: GetBillsParams = {}) {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== '') acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return request<BillsResponse>(`/bills${query ? `?${query}` : ''}`);
}

export function getBill(id: string) {
  return request<{ data: ApiBill }>(`/bills/${id}`);
}

export function createBill(data: {
  billDate: string;
  customer: { name: string; pan?: string; address?: string; phone?: string };
  items: { awb?: string; from?: string; to?: string; description: string; quantity: number; unit?: string; rate: number }[];
  codCharge?: number;
  otherCharges?: number;
  discount?: number;
  paymentMode: PaymentMode;
  remarks?: string;
}) {
  return request<{ data: ApiBill }>('/bills', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function cancelBill(id: string, reason: string) {
  return request<{ data: ApiBill }>(`/bills/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export function getBillSettings() {
  return request<{ data: BillSettings }>('/bills/settings');
}

export type BillSettingsText = Omit<BillSettings, BillSettingsImage>;

export function updateBillSettings(data: Partial<BillSettingsText>) {
  return request<{ data: BillSettings }>('/bills/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function removeBillSettingsImage(kind: BillSettingsImage) {
  return request<{ data: BillSettings }>(`/bills/settings/${kind}`, { method: 'DELETE' });
}

export async function uploadBillSettingsImage(kind: BillSettingsImage, file: File) {
  const token = getToken();
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/bills/settings/${kind}`, {
    method: 'PUT',
    // No Content-Type — the browser sets the multipart boundary.
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    throw new ApiError(res.status, body?.message || `Upload failed with ${res.status}`);
  }
  return body as { success: boolean; data: BillSettings };
}

// ─── Payment Vouchers ───────────────────────────────────────────────────────

export interface GetVouchersParams {
  search?: string;
  company?: string;
  status?: ApiVoucher['status'] | 'all';
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number;
  perPage?: number;
}

export interface VouchersResponse extends Paginated<ApiVoucher> {
  summary: { issuedCount: number; issuedAmount: number };
}

export function getVouchers(params: GetVouchersParams = {}) {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== '') acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return request<VouchersResponse>(`/vouchers${query ? `?${query}` : ''}`);
}

export function getVoucher(id: string) {
  return request<{ data: ApiVoucher }>(`/vouchers/${id}`);
}

export function createVoucher(data: {
  company: string;
  voucherDate: string;
  payee: { pan?: string; address?: string; phone?: string };
  items: { awb?: string; from?: string; to?: string; description: string; quantity: number; unit?: string; rate: number }[];
  otherCharges?: number;
  discount?: number;
  paymentMode: PaymentMode;
  paymentRef?: string;
  supplierBillNo?: string;
  againstBillNo?: number;
  remarks?: string;
}) {
  return request<{ data: ApiVoucher }>('/vouchers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function cancelVoucher(id: string, reason: string) {
  return request<{ data: ApiVoucher }>(`/vouchers/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}
