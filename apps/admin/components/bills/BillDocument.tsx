import React from 'react';
import { Hind } from 'next/font/google';
import type { ApiBill, BillSettings, PaymentMode } from '@/lib/types';
import {
  amountInWords, fiscalYear, formatBillDate, formatBillNumber, formatBsDate, formatNpr, grossTotal,
} from '@/lib/billing';
import { stampSrc } from '@/lib/billStamp';

// Hind covers both Latin and Devanagari, so English and Nepali labels match.
const hind = Hind({ weight: ['400', '500', '600', '700'], subsets: ['latin', 'devanagari'], display: 'swap' });

export type BillCopy = 'customer' | 'office';

interface BillDocumentProps {
  bill: ApiBill;
  /** Settings with the logo already resolved (see withDefaultLogo). */
  settings: BillSettings;
  copy?: BillCopy;
  /** Name printed above "Prepared by". */
  preparedBy?: string | null;
}

const NAVY = '#1b2a4a';
const ORANGE = '#e8590c';
const MIN_ROWS = 8;

const PAYMENT_BOXES: { mode: PaymentMode; label: string }[] = [
  { mode: 'cash', label: 'Cash' },
  { mode: 'bank', label: 'Bank/Cheque' },
  { mode: 'wallet', label: 'Wallet/QR' },
  { mode: 'credit', label: 'Credit' },
];

function Checkbox({ checked, label }: { checked: boolean; label: string }) {
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
function Field({ label, value, className = '' }: { label: string; value?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <span className="font-semibold whitespace-nowrap">{label}</span>
      <span className="flex-1 min-w-0 border-b border-dotted border-[#6b7280] pb-px text-[#111827] truncate">{value || ' '}</span>
    </div>
  );
}

/**
 * The bill as it appears on paper, following the SwiftYak invoice format. Fixed at A4 width
 * (794px @ 96dpi) so screen, printout and PDF match. Colours are plain hex so it always
 * renders black-on-white regardless of the app's dark mode.
 */
const BillDocument = React.forwardRef<HTMLElement, BillDocumentProps>(function BillDocument(
  { bill, settings, copy = 'customer', preparedBy },
  ref
) {
  // Seller details are snapshotted on the bill; fall back to current settings for older bills.
  const seller = bill.seller?.name
    ? { ...bill.seller, shortName: bill.seller.shortName || settings.shortName }
    : { name: settings.businessName, shortName: settings.shortName, address: settings.address, phone: settings.phone, email: settings.email, pan: settings.pan };
  const cancelled = bill.status === 'cancelled';
  const contact = [seller.phone && `Phone: ${seller.phone}`, seller.email && `Email: ${seller.email}`, settings.website].filter(Boolean);
  const emptyRows = Math.max(0, MIN_ROWS - bill.items.length);
  const gross = grossTotal(bill);

  const th = 'px-2 py-1.5 font-semibold text-[11px] leading-tight align-top';
  const td = 'px-2 h-[29px] border-r border-[#d1d5db] align-middle';

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

      {/* Letterhead */}
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
              <span className="text-[13px] font-bold" style={{ color: NAVY }}>PAN No. (स्थायी लेखा नं.):</span>
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
          <p className="inline-block px-4 py-1.5 text-[19px] font-bold tracking-[0.08em] text-white rounded-md" style={{ background: NAVY }}>
            INVOICE
          </p>
          <p className="text-[18px] font-bold mt-1" style={{ color: NAVY }}>बिल</p>
        </div>
      </header>

      {/* Copy + fiscal year */}
      <div className="flex items-center justify-between py-2.5 text-[13px] text-[#374151]">
        <div className="flex items-center gap-5">
          <Checkbox checked={copy === 'customer'} label="Original – Customer" />
          <Checkbox checked={copy === 'office'} label="Copy – Office" />
        </div>
        <p>Fiscal Year (आर्थिक वर्ष): <span className="font-semibold text-[#111827]">{fiscalYear(bill.billDate)}</span></p>
      </div>

      {/* Bill to / bill details */}
      <section className="grid grid-cols-2 border border-[#1f2937] text-[13px]">
        <div className="p-3 space-y-2 border-r border-[#1f2937]">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em]" style={{ color: ORANGE }}>Bill to / ग्राहक</p>
          <Field label="Name (नाम):" value={bill.customer.name} />
          <Field label="Address (ठेगाना):" value={bill.customer.address} />
          <Field label="Customer PAN, if any (स्था.ले.नं.):" value={bill.customer.pan} />
          <Field label="Phone (फोन):" value={bill.customer.phone} />
        </div>
        <div className="p-3 space-y-2">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em]" style={{ color: ORANGE }}>Bill details / बिल विवरण</p>
          <Field label="Bill No. (बिल नं.):" value={<span className="font-semibold">{formatBillNumber(bill.billNumber)}</span>} />
          <div className="flex gap-3">
            <Field label="Date (मिति) B.S.:" value={formatBsDate(bill.billDate)} className="flex-[1.15]" />
            <Field label="A.D.:" value={formatBillDate(bill.billDate)} className="flex-1" />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-semibold">Payment (भुक्तानी):</span>
            {PAYMENT_BOXES.map((p) => (
              <Checkbox key={p.mode} checked={bill.paymentMode === p.mode} label={p.label} />
            ))}
          </div>
        </div>
      </section>

      {/* Items */}
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
          {bill.items.map((item, i) => (
            <tr key={i} className="border-b border-[#d1d5db]">
              <td className={`${td} text-center text-[#6b7280]`}>{i + 1}</td>
              <td className={td}>{item.awb}</td>
              <td className={`${td} py-1`}>{item.description}</td>
              <td className={`${td} py-1`}>{item.from || item.to ? `${item.from || '—'} → ${item.to || '—'}` : ''}</td>
              <td className={`${td} text-right tabular-nums`}>{item.quantity}{item.unit ? ` ${item.unit}` : ''}</td>
              <td className={`${td} text-right tabular-nums`}>{formatNpr(item.rate)}</td>
              <td className={`${td} border-r-0 text-right tabular-nums font-semibold text-[#111827]`}>{formatNpr(item.amount)}</td>
            </tr>
          ))}
          {Array.from({ length: emptyRows }, (_, i) => (
            <tr key={`empty-${i}`} className="border-b border-[#d1d5db] last:border-b-0">
              <td className={`${td} text-center text-[#9ca3af]`}>{bill.items.length + i + 1}</td>
              <td className={td} /><td className={td} /><td className={td} /><td className={td} /><td className={td} />
              <td className={`${td} border-r-0`} />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Amount in words + charges */}
      <section className="grid grid-cols-[1fr_298px] gap-4 mt-3.5 text-[13px]">
        <div className="border border-[#1f2937] p-3">
          <p className="font-bold">Amount in words (अक्षरमा) : Rs.</p>
          <p className="mt-1.5 border-b border-dotted border-[#6b7280] pb-1 italic text-[#111827]">{amountInWords(bill.total)}</p>
          <p className="mt-4">Remarks (कैफियत):</p>
          <p className="mt-1 border-b border-dotted border-[#6b7280] pb-1 min-h-[24px] whitespace-pre-line text-[#111827]">{bill.remarks}</p>
          {cancelled && <p className="mt-2 font-semibold text-[#dc2626]">Cancelled: {bill.cancelReason}</p>}
        </div>
        <div className="border border-[#1f2937]">
          {[
            ['Total Amount', bill.subtotal],
            ['COD handling charge (COD सेवा शुल्क)', bill.codCharge ?? 0],
            ['Other charges (अन्य शुल्क)', bill.otherCharges ?? 0],
            ['Total (जम्मा)', gross],
            ['Less: Discount (छुट)', bill.discount],
          ].map(([label, value]) => (
            <div key={label as string} className="flex items-center justify-between gap-3 px-3 py-[6px] border-b border-[#d1d5db]">
              <span>{label}</span>
              <span className="tabular-nums font-medium text-[#111827]">{formatNpr(value as number)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-white" style={{ background: NAVY }}>
            <span className="font-bold text-[14px]">Net Amount (खुद रकम)</span>
            <span className="font-bold text-[15px] tabular-nums">{formatNpr(bill.total)}</span>
          </div>
        </div>
      </section>

      {/* Signatures, pushed to the bottom of the page */}
      <section className="mt-auto pt-4 flex items-end justify-between gap-6 text-[13px]">
        <div className="w-[200px] text-center">
          <div className="border-t border-[#1f2937] pt-1 font-semibold text-left">Received by (बुझिलिनेको दस्तखत)</div>
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

      <footer className="mt-4 pt-2 border-t border-[#d1d5db] flex items-center justify-between gap-6 text-[11px]">
        <span className="text-[#6b7280]">{settings.printerNote}</span>
        {settings.footerNote && <span className="font-bold shrink-0" style={{ color: ORANGE }}>{settings.footerNote}</span>}
      </footer>
    </article>
  );
});

export default BillDocument;
