'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Search, X } from 'lucide-react';
import { getBills, ApiError } from '@/lib/api';
import type { ApiBill } from '@/lib/types';
import { formatBillDate, formatBillNumber, formatNpr } from '@/lib/billing';

interface BillPickerProps {
  id?: string;
  value: ApiBill | null;
  onChange: (bill: ApiBill | null) => void;
}

/** Searchable dropdown of issued customer bills (newest first). */
export default function BillPicker({ id, value, onChange }: BillPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [result, setResult] = useState<{ key: string; bills?: ApiBill[]; error?: string } | null>(null);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce typing before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const key = debounced;
    getBills({ search: key || undefined, status: 'issued', perPage: 20 })
      .then((res) => { if (!cancelled) setResult({ key, bills: res.data }); })
      .catch((err) => { if (!cancelled) setResult({ key, error: err instanceof ApiError ? err.message : 'Could not load bills' }); });
    return () => { cancelled = true; };
  }, [open, debounced]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const loading = open && result?.key !== debounced;
  const bills = result?.bills ?? [];

  function openList() {
    setOpen(true);
    setHighlight(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function choose(bill: ApiBill) {
    onChange(bill);
    setOpen(false);
    setQuery('');
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, bills.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (bills[highlight]) choose(bills[highlight]); }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => (open ? setOpen(false) : openList())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-background border border-border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {value ? (
          <span className="flex-1 min-w-0 truncate">
            <span className="font-600 text-foreground">#{formatBillNumber(value.billNumber)}</span>
            <span className="text-muted-foreground"> · {value.customer.name} · Rs. {formatNpr(value.total)}</span>
          </span>
        ) : (
          <span className="flex-1 text-muted-foreground">Select a bill (optional)</span>
        )}
        {value ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear selected bill"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onChange(null); } }}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </span>
        ) : (
          <ChevronDown size={15} className="text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[340px] bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="relative border-b border-border">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
              onKeyDown={onKeyDown}
              placeholder="Search bill no., customer, phone…"
              aria-label="Search bills"
              className="w-full pl-8 pr-3 py-2.5 text-sm bg-transparent focus:outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {loading ? (
              <li className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground"><Loader2 size={13} className="animate-spin" /> Loading bills…</li>
            ) : result?.error ? (
              <li className="px-3 py-3 text-xs text-destructive">{result.error}</li>
            ) : bills.length === 0 ? (
              <li className="px-3 py-3 text-xs text-muted-foreground">No matching bills.</li>
            ) : (
              bills.map((bill, i) => (
                <li
                  key={bill._id}
                  role="option"
                  aria-selected={value?._id === bill._id}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => { e.preventDefault(); choose(bill); }}
                  className={`px-3 py-2 cursor-pointer ${i === highlight ? 'bg-muted' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-600 text-foreground tabular-nums">#{formatBillNumber(bill.billNumber)}</span>
                    <span className="text-foreground tabular-nums">Rs. {formatNpr(bill.total)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="truncate">{bill.customer.name} · {bill.items.length} item{bill.items.length === 1 ? '' : 's'}</span>
                    <span className="shrink-0">{formatBillDate(bill.billDate)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
