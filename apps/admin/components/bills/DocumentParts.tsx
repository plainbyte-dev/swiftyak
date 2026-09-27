import React from 'react';
import { Hind } from 'next/font/google';
import type { BillItem, BillSettings, PaymentMode } from '@/lib/types';
import { formatNpr } from '@/lib/billing';
import { stampSrc } from '@/lib/billStamp';

// Shared building blocks for the printable documents (PAN bill, payment voucher).
// Everything is fixed-size, plain-hex styling so screen, printout and PDF match
// and the paper always renders black-on-white regardless of the app's dark mode.

// Hind covers both Latin and Devanagari, so English and Nepali labels match.
const hind = Hind({ weight: ['400', '500', '600', '700'], subsets: ['latin', 'devanagari'], display: 'swap' });

export const NAVY = '#1b2a4a';
export const ORANGE = '#e8590c';

export interface Seller {
  name: string;
  shortName?: string;
  address: string;
  phone: string;
  email: string;
  pan: string;
}

/** Seller details snapshotted on the document, falling back to current settings for older ones. */
export function resolveSeller(snapshot: Seller | undefined, settings: BillSettings): Seller {
  return snapshot?.name
    ? { ...snapshot, shortName: snapshot.shortName || settings.shortName }
    : { name: settings.businessName, shortName: settings.shortName, address: settings.address, phone: settings.phone, email: settings.email, pan: settings.pan };
}

export const PAYMENT_BOXES: { mode: PaymentMode; label: string }[] = [
  { mode: 'cash', label: 'Cash' },
  { mode: 'bank', label: 'Bank/Cheque' },
  { mode: 'wallet', label: 'Wallet/QR' },
  { mode: 'credit', label: 'Credit' },
];

export function Checkbox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="inline-flex h-[13px] w-[13px] items-center justify-center border border-[#1f2937] text-[11px] leading-none font-bold" style={{ color: NAVY }}>
        {checked ? '✓' : ''}
      </span>
      {label}
    </span>
  );
}

/** "Label: value" on a dotted line, like a pre-printed form. */
export function Field({ label, value, className = '' }: { label: string; value?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <span className="font-semibold whitespace-nowrap">{label}</span>
      <span className="flex-1 min-w-0 border-b border-dotted border-[#6b7280] pb-px text-[#111827] truncate">{value || ' '}</span>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10.5px] font-bold uppercase tracking-[0.1em]" style={{ color: ORANGE }}>{children}</p>;
}

/** A4 sheet (794px @ 96dpi) with an optional CANCELLED watermark. */
export const Paper = React.forwardRef<HTMLElement, { cancelled?: boolean; children: React.ReactNode }>(function Paper(
  { cancelled, children },
  ref
) {
  return (
    <article
      ref={ref}
      className={`${hind.className} relative w-[794px] min-h-[1123px] flex flex-col bg-white text-[#1f2937] text-[13px] leading-snug px-11 pt-8 pb-5 print:min-h-0`}
    >
      {cancelled && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
          <span className="-rotate-[20deg] text-[96px] font-bold tracking-[0.15em] text-[#dc2626]/15 border-[10px] border-[#dc2626]/15 px-8 rounded-2xl">
            CANCELLED
          </span>
        </div>
      )}
      {children}
    </article>
  );
});

export function Letterhead({ seller, settings, title, titleNp }: { seller: Seller; settings: BillSettings; title: string; titleNp: string }) {
  const contact = [seller.phone && `Phone: ${seller.phone}`, seller.email && `Email: ${seller.email}`, settings.website].filter(Boolean);
  return (
    <header className="flex items-start gap-5 pb-3 border-b-[3px]" style={{ borderColor: ORANGE }}>
      {settings.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.logo} alt="" className="h-[84px] w-[110px] object-contain shrink-0 -mt-1" />
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-[27px] font-bold leading-tight" style={{ color: NAVY }}>{seller.name}</h1>
        <p className="text-[13px] text-[#374151]">{seller.address}</p>
        {contact.length > 0 && <p className="text-[13px] text-[#374151]">{contact.join(' · ')}</p>}
        {seller.pan && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[13px] font-bold whitespace-nowrap" style={{ color: NAVY }}>PAN No. (स्थायी लेखा नं.):</span>
            <span className="flex gap-[3px]">
              {seller.pan.split('').map((digit, i) => (
                <span key={i} className="inline-flex h-[22px] w-[18px] items-center justify-center border border-[#1f2937] text-[13px] font-semibold">
                  {digit}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className={`inline-block py-1.5 font-bold text-white rounded-md whitespace-nowrap ${title.length > 10 ? 'px-2.5 text-[13.5px] tracking-[0.03em]' : 'px-4 text-[19px] tracking-[0.08em]'}`} style={{ background: NAVY }}>
          {title}
        </p>
        <p className="text-[18px] font-bold mt-1" style={{ color: NAVY }}>{titleNp}</p>
      </div>
    </header>
  );
}

/** Consignment table shared by bills and vouchers; pads with empty numbered rows. */
export function ItemsTable({ items, minRows }: { items: BillItem[]; minRows: number }) {
  const th = 'px-2 py-1.5 font-semibold text-[11px] leading-tight align-top';
  const td = 'px-2 h-[29px] border-r border-[#d1d5db] align-middle';
  const emptyRows = Math.max(0, minRows - items.length);

  return (
    <table className="w-full mt-3.5 border border-[#1f2937] border-collapse text-[12.5px]">
      <thead>
        <tr className="text-white" style={{ background: NAVY }}>
          <th className={`${th} w-10 text-center`}>S.N.<br />क्र.सं.</th>
          <th className={`${th} w-[96px] text-left`}>Consignment / AWB No.</th>
          <th className={`${th} text-left`}>Description of Service<br />सेवाको विवरण</th>
          <th className={`${th} w-[150px] text-left`}>From → To<br />कहाँबाट → कहाँ</th>
          <th className={`${th} w-[56px] text-right`}>Qty/Kg<br />परिमाण</th>
          <th className={`${th} w-[72px] text-right`}>Rate (Rs.)<br />दर</th>
          <th className={`${th} w-[92px] text-right`}>Amount (Rs.)<br />रकम</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} className="border-b border-[#d1d5db]">
            <td className={`${td} text-center text-[#6b7280]`}>{i + 1}</td>
            <td className={td}>{item.awb}</td>
            <td className={`${td} py-1`}>{item.description}</td>
            <td className={`${td} py-1 whitespace-nowrap`}>{item.from || item.to ? `${item.from || '—'} → ${item.to || '—'}` : ''}</td>
            <td className={`${td} text-right tabular-nums`}>{item.quantity}{item.unit ? ` ${item.unit}` : ''}</td>
            <td className={`${td} text-right tabular-nums`}>{formatNpr(item.rate)}</td>
            <td className={`${td} border-r-0 text-right tabular-nums font-semibold text-[#111827]`}>{formatNpr(item.amount)}</td>
          </tr>
        ))}
        {Array.from({ length: emptyRows }, (_, i) => (
          <tr key={`empty-${i}`} className="border-b border-[#d1d5db] last:border-b-0">
            <td className={`${td} text-center text-[#9ca3af]`}>{items.length + i + 1}</td>
            <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
            <td className={`${td} border-r-0`} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Amounts panel: plain rows, then a navy highlighted final row. */
export function AmountsPanel({ rows, final }: { rows: [string, number][]; final: [string, number] }) {
  return (
    <div className="border border-[#1f2937]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 px-3 py-[6px] border-b border-[#d1d5db]">
          <span>{label}</span>
          <span className="tabular-nums font-medium text-[#111827]">{formatNpr(value)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-white" style={{ background: NAVY }}>
        <span className="font-bold text-[14px]">{final[0]}</span>
        <span className="font-bold text-[15px] tabular-nums">{formatNpr(final[1])}</span>
      </div>
    </div>
  );
}

/**
 * Bottom signature row: a blank "received by" line, "prepared by" with the preparer's
 * name, and the company's stamp + authorised signature.
 */
export function SignatureRow({
  seller, settings, preparedBy, receivedLabel = 'Received by (बुझिलिनेको दस्तखत)', receivedName,
}: {
  seller: Seller;
  settings: BillSettings;
  preparedBy?: string | null;
  receivedLabel?: string;
  receivedName?: string;
}) {
  return (
    <section className="mt-auto pt-4 flex items-end justify-between gap-6 text-[13px]">
      <div className="w-[200px]">
        <p className="text-[#374151] h-5 truncate">{receivedName ?? ''}</p>
        <div className="border-t border-[#1f2937] pt-1 font-semibold">{receivedLabel}</div>
      </div>
      <div className="w-[200px]">
        <p className="text-[#374151] h-5 truncate">{preparedBy ?? ''}</p>
        <div className="border-t border-[#1f2937] pt-1 font-semibold">Prepared by (तयार गर्ने)</div>
      </div>
      <div className="relative w-[220px] text-center">
        <div className="relative h-[96px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={stampSrc(settings)}
            alt="Company stamp"
            className="absolute left-0 top-0 h-[96px] w-[96px] object-contain -rotate-[6deg] opacity-90 mix-blend-multiply"
          />
          {settings.signature && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.signature}
              alt="Signature"
              className="absolute right-0 bottom-0 max-h-[84px] max-w-[140px] object-contain mix-blend-multiply"
            />
          )}
        </div>
        <div className="border-t border-[#1f2937] pt-1">
          <p className="font-bold">For {seller.shortName || seller.name}</p>
          {settings.signatoryName && <p className="text-[#374151]">{settings.signatoryName}</p>}
          <p className="font-semibold">{settings.signatoryTitle || 'Authorised Signatory'} (आधिकारिक दस्तखत)</p>
        </div>
      </div>
    </section>
  );
}

export function DocFooter({ settings }: { settings: BillSettings }) {
  return (
    <footer className="mt-4 pt-2 border-t border-[#d1d5db] flex items-center justify-between gap-6 text-[11px]">
      <span className="text-[#6b7280]">{settings.printerNote}</span>
      {settings.footerNote && <span className="font-bold shrink-0" style={{ color: ORANGE }}>{settings.footerNote}</span>}
    </footer>
  );
}
