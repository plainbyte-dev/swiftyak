import React from 'react';
import type { ApiVoucher, BillSettings } from '@/lib/types';
import { amountInWords, fiscalYear, formatBillDate, formatBillNumber, formatBsDate } from '@/lib/billing';
import {
  AmountsPanel, Checkbox, DocFooter, Field, ItemsTable, Letterhead, PAYMENT_BOXES, Paper, SectionLabel,
  SignatureRow, resolveSeller,
} from './DocumentParts';

interface VoucherDocumentProps {
  voucher: ApiVoucher;
  /** Settings with the logo already resolved (see withDefaultLogo). */
  settings: BillSettings;
  preparedBy?: string | null;
}

/** A payment voucher: what Swift Yak paid a partner courier company, on the same letterhead as bills. */
const VoucherDocument = React.forwardRef<HTMLElement, VoucherDocumentProps>(function VoucherDocument(
  { voucher, settings, preparedBy },
  ref
) {
  const seller = resolveSeller(voucher.seller, settings);
  const cancelled = voucher.status === 'cancelled';
  const gross = Math.round((voucher.subtotal + (voucher.otherCharges ?? 0)) * 100) / 100;

  return (
    <Paper ref={ref} cancelled={cancelled}>
      <Letterhead seller={seller} settings={settings} title="PAYMENT VOUCHER" titleNp="भुक्तानी भौचर" />

      <div className="flex items-center justify-between py-2.5 text-[13px] text-[#374151]">
        <p>Payment to partner courier company (साझेदार कुरियरलाई भुक्तानी)</p>
        <p>Fiscal Year (आर्थिक वर्ष): <span className="font-semibold text-[#111827]">{fiscalYear(voucher.voucherDate)}</span></p>
      </div>

      {/* Paid to / payment details */}
      <section className="grid grid-cols-2 border border-[#1f2937] text-[13px]">
        <div className="p-3 space-y-2 border-r border-[#1f2937]">
          <SectionLabel>Paid to / भुक्तानी पाउने</SectionLabel>
          <Field label="Company (कम्पनी):" value={voucher.payee.name} />
          <Field label="Address (ठेगाना):" value={voucher.payee.address} />
          <Field label="PAN (स्था.ले.नं.):" value={voucher.payee.pan} />
          <Field label="Phone (फोन):" value={voucher.payee.phone} />
          <Field label="Their Bill No. (बिल नं.):" value={voucher.supplierBillNo} />
        </div>
        <div className="p-3 space-y-2">
          <SectionLabel>Payment details / भुक्तानी विवरण</SectionLabel>
          <Field label="Voucher No. (भौचर नं.):" value={<span className="font-semibold">{formatBillNumber(voucher.voucherNumber)}</span>} />
          <div className="flex gap-3">
            <Field label="Date (मिति) B.S.:" value={formatBsDate(voucher.voucherDate)} className="flex-[1.15]" />
            <Field label="A.D.:" value={formatBillDate(voucher.voucherDate)} className="flex-1" />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-semibold">Mode (माध्यम):</span>
            {PAYMENT_BOXES.map((p) => (
              <Checkbox key={p.mode} checked={voucher.paymentMode === p.mode} label={p.label} />
            ))}
          </div>
          <Field label="Cheque / Txn Ref. (सन्दर्भ नं.):" value={voucher.paymentRef} />
          <Field
            label="Against our Bill No.:"
            value={voucher.againstBillNo ? formatBillNumber(voucher.againstBillNo) : ''}
          />
        </div>
      </section>

      <ItemsTable items={voucher.items} minRows={6} />

      {/* Amount in words + amounts */}
      <section className="grid grid-cols-[1fr_298px] gap-4 mt-3.5 text-[13px]">
        <div className="border border-[#1f2937] p-3">
          <p className="font-bold">Amount paid in words (अक्षरमा) : Rs.</p>
          <p className="mt-1.5 border-b border-dotted border-[#6b7280] pb-1 italic text-[#111827]">{amountInWords(voucher.total)}</p>
          <p className="mt-4">Remarks (कैफियत):</p>
          <p className="mt-1 border-b border-dotted border-[#6b7280] pb-1 min-h-[24px] whitespace-pre-line text-[#111827]">{voucher.remarks}</p>
          {cancelled && <p className="mt-2 font-semibold text-[#dc2626]">Cancelled: {voucher.cancelReason}</p>}
        </div>
        <AmountsPanel
          rows={[
            ['Service charges (सेवा शुल्क)', voucher.subtotal],
            ['Other charges (अन्य शुल्क)', voucher.otherCharges ?? 0],
            ['Total (जम्मा)', gross],
            ['Less: Discount (छुट)', voucher.discount],
          ]}
          final={['Net Paid (खुद भुक्तानी)', voucher.total]}
        />
      </section>

      <SignatureRow
        seller={seller}
        settings={settings}
        preparedBy={preparedBy}
        receivedLabel="Received by (भुक्तानी लिनेको दस्तखत)"
        receivedName={voucher.payee.name}
      />
      <DocFooter settings={settings} />
    </Paper>
  );
});

export default VoucherDocument;
