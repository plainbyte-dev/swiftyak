import React from 'react';
import type { ApiBill, BillSettings } from '@/lib/types';
import { amountInWords, fiscalYear, formatBillDate, formatBillNumber, formatBsDate, grossTotal } from '@/lib/billing';
import {
  AmountsPanel, Checkbox, DocFooter, Field, ItemsTable, Letterhead, PAYMENT_BOXES, Paper, SectionLabel,
  SignatureRow, resolveSeller,
} from './DocumentParts';

export type BillCopy = 'customer' | 'office';

interface BillDocumentProps {
  bill: ApiBill;
  /** Settings with the logo already resolved (see withDefaultLogo). */
  settings: BillSettings;
  copy?: BillCopy;
  /** Name printed above "Prepared by". */
  preparedBy?: string | null;
}

/** The PAN bill as it appears on paper, following the SwiftYak invoice format. */
const BillDocument = React.forwardRef<HTMLElement, BillDocumentProps>(function BillDocument(
  { bill, settings, copy = 'customer', preparedBy },
  ref
) {
  const seller = resolveSeller(bill.seller, settings);
  const cancelled = bill.status === 'cancelled';

  return (
    <Paper ref={ref} cancelled={cancelled}>
      <Letterhead seller={seller} settings={settings} title="INVOICE" titleNp="बिल" />

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
          <SectionLabel>Bill to / ग्राहक</SectionLabel>
          <Field label="Name (नाम):" value={bill.customer.name} />
          <Field label="Address (ठेगाना):" value={bill.customer.address} />
          <Field label="Customer PAN, if any (स्था.ले.नं.):" value={bill.customer.pan} />
          <Field label="Phone (फोन):" value={bill.customer.phone} />
        </div>
        <div className="p-3 space-y-2">
          <SectionLabel>Bill details / बिल विवरण</SectionLabel>
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

      <ItemsTable items={bill.items} minRows={8} />

      {/* Amount in words + charges */}
      <section className="grid grid-cols-[1fr_298px] gap-4 mt-3.5 text-[13px]">
        <div className="border border-[#1f2937] p-3">
          <p className="font-bold">Amount in words (अक्षरमा) : Rs.</p>
          <p className="mt-1.5 border-b border-dotted border-[#6b7280] pb-1 italic text-[#111827]">{amountInWords(bill.total)}</p>
          <p className="mt-4">Remarks (कैफियत):</p>
          <p className="mt-1 border-b border-dotted border-[#6b7280] pb-1 min-h-[24px] whitespace-pre-line text-[#111827]">{bill.remarks}</p>
          {cancelled && <p className="mt-2 font-semibold text-[#dc2626]">Cancelled: {bill.cancelReason}</p>}
        </div>
        <AmountsPanel
          rows={[
            ['Total Amount', bill.subtotal],
            ['COD handling charge (COD सेवा शुल्क)', bill.codCharge ?? 0],
            ['Other charges (अन्य शुल्क)', bill.otherCharges ?? 0],
            ['Total (जम्मा)', grossTotal(bill)],
            ['Less: Discount (छुट)', bill.discount],
          ]}
          final={['Net Amount (खुद रकम)', bill.total]}
        />
      </section>

      <SignatureRow seller={seller} settings={settings} preparedBy={preparedBy} />
      <DocFooter settings={settings} />
    </Paper>
  );
});

export default BillDocument;
