import React from 'react';

export type ShipmentStatus =
  | 'pending' |'assigned' |'picked_up' |'in_transit' |'delivered' |'failed' |'cancelled';

export type CourierStatus = 'available' | 'busy' | 'offline';

const SHIPMENT_STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; className: string; dotColor: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-warning-bg text-warning-foreground',
    dotColor: 'bg-warning',
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-info-bg text-info-foreground',
    dotColor: 'bg-info',
  },
  picked_up: {
    label: 'Picked Up',
    className: 'bg-info-bg text-info-foreground',
    dotColor: 'bg-info',
  },
  in_transit: {
    label: 'In Transit',
    className: 'bg-primary/10 text-primary',
    dotColor: 'bg-primary',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-positive-bg text-positive-foreground',
    dotColor: 'bg-positive',
  },
  failed: {
    label: 'Failed',
    className: 'bg-danger-bg text-danger-foreground',
    dotColor: 'bg-danger',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-secondary text-muted-foreground',
    dotColor: 'bg-muted-foreground',
  },
};

const COURIER_STATUS_CONFIG: Record<
  CourierStatus,
  { label: string; className: string; dotColor: string }
> = {
  available: {
    label: 'Available',
    className: 'bg-positive-bg text-positive-foreground',
    dotColor: 'bg-positive',
  },
  busy: {
    label: 'Busy',
    className: 'bg-warning-bg text-warning-foreground',
    dotColor: 'bg-warning',
  },
  offline: {
    label: 'Offline',
    className: 'bg-secondary text-muted-foreground',
    dotColor: 'bg-muted-foreground',
  },
};

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export function ShipmentStatusBadge({
  status,
  showDot = true,
  size = 'md',
}: ShipmentStatusBadgeProps) {
  const config = SHIPMENT_STATUS_CONFIG[status];
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  return (
    <span className={`status-badge ${config.className} ${sizeClass}`}>
      {showDot && (
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotColor} shrink-0`} />
      )}
      {config.label}
    </span>
  );
}

interface CourierStatusBadgeProps {
  status: CourierStatus;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export function CourierStatusBadge({
  status,
  showDot = true,
  size = 'md',
}: CourierStatusBadgeProps) {
  const config = COURIER_STATUS_CONFIG[status];
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  return (
    <span className={`status-badge ${config.className} ${sizeClass}`}>
      {showDot && (
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotColor} shrink-0`} />
      )}
      {config.label}
    </span>
  );
}