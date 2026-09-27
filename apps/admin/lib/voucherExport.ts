import ExcelJS from 'exceljs';
import type { ApiVoucher, BillSettings } from './types';
import {
  BORDER, MONEY_FMT, NAVY_ARGB, ORANGE_ARGB, PAYMENT_MODE_LABELS, addImage, amountInWords, fiscalYear,
  formatBillDate, formatBillNumber, formatBsDate, thin, triggerDownload,
} from './billing';
import { stampSrc } from './billStamp';

function sellerOf(v: ApiVoucher, settings: BillSettings) {
  return v.seller?.name
    ? { ...v.seller, shortName: v.seller.shortName || settings.shortName }
    : { name: settings.businessName, shortName: settings.shortName, address: settings.address, phone: settings.phone, email: settings.email, pan: settings.pan };
}

/** One payment voucher laid out like the printed document. `settings` should have the logo resolved. */
export async function exportVoucherToExcel(voucher: ApiVoucher, settings: BillSettings) {
  const seller = sellerOf(voucher, settings);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Voucher ${formatBillNumber(voucher.voucherNumber)}`, {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ showGridLines: false }],
  });

  // A: S.N. | B: AWB | C: Description | D: From → To | E: Qty/Kg | F: Rate | G: Amount
  sheet.columns = [{ width: 6 }, { width: 16 }, { width: 30 }, { width: 22 }, { width: 9 }, { width: 12 }, { width: 15 }];
  const cell = (r: number, c: number) => sheet.getCell(r, c);
  const merge = (r1: number, c1: number, r2: number, c2: number) => sheet.mergeCells(r1, c1, r2, c2);

  // Letterhead
  for (let r = 1; r <= 4; r++) sheet.getRow(r).height = 18;
  if (settings.logo) {
    sheet.addImage(await addImage(workbook, settings.logo), { tl: { col: 0.1, row: 0.2 }, ext: { width: 100, height: 72 } });
  }
  merge(1, 3, 1, 5);
  cell(1, 3).value = seller.name;
  cell(1, 3).font = { bold: true, size: 16, color: { argb: NAVY_ARGB } };
  merge(2, 3, 2, 5);
  cell(2, 3).value = seller.address;
  merge(3, 3, 3, 5);
  cell(3, 3).value = [seller.phone && `Phone: ${seller.phone}`, seller.email && `Email: ${seller.email}`, settings.website].filter(Boolean).join(' · ');
  if (seller.pan) {
    merge(4, 3, 4, 5);
    cell(4, 3).value = `PAN No. (स्थायी लेखा नं.): ${seller.pan.split('').join(' ')}`;
    cell(4, 3).font = { bold: true, color: { argb: NAVY_ARGB } };
  }
  merge(1, 6, 2, 7);
  cell(1, 6).value = 'PAYMENT VOUCHER';
  cell(1, 6).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  cell(1, 6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_ARGB } };
  cell(1, 6).alignment = { horizontal: 'center', vertical: 'middle' };
  merge(3, 6, 3, 7);
  cell(3, 6).value = 'भुक्तानी भौचर';
  cell(3, 6).font = { bold: true, size: 12, color: { argb: NAVY_ARGB } };
  cell(3, 6).alignment = { horizontal: 'right' };
  for (let c = 1; c <= 7; c++) cell(5, c).border = { bottom: { style: 'medium', color: { argb: ORANGE_ARGB } } };

  merge(6, 1, 6, 4);
  cell(6, 1).value = 'Payment to partner courier company (साझेदार कुरियरलाई भुक्तानी)';
  merge(6, 5, 6, 7);
  cell(6, 5).value = `Fiscal Year (आर्थिक वर्ष): ${fiscalYear(voucher.voucherDate)}`;
  cell(6, 5).alignment = { horizontal: 'right' };

  // Paid to / payment details
  const box = (r: number, c1: number, c2: number, label: string, value: string, bold = false) => {
    merge(r, c1, r, c2);
    cell(r, c1).value = { richText: [{ text: `${label} `, font: { bold: true } }, { text: value, font: { bold } }] };
  };
  merge(8, 1, 8, 3);
  cell(8, 1).value = 'PAID TO / भुक्तानी पाउने';
  cell(8, 1).font = { bold: true, size: 9, color: { argb: ORANGE_ARGB } };
  merge(8, 4, 8, 7);
  cell(8, 4).value = 'PAYMENT DETAILS / भुक्तानी विवरण';
  cell(8, 4).font = { bold: true, size: 9, color: { argb: ORANGE_ARGB } };
  box(9, 1, 3, 'Company (कम्पनी):', voucher.payee.name);
  box(10, 1, 3, 'Address (ठेगाना):', voucher.payee.address);
  box(11, 1, 3, 'PAN (स्था.ले.नं.):', voucher.payee.pan);
  box(12, 1, 3, 'Phone (फोन):', voucher.payee.phone);
  box(13, 1, 3, 'Their Bill No. (बिल नं.):', voucher.supplierBillNo);
  box(9, 4, 7, 'Voucher No. (भौचर नं.):', formatBillNumber(voucher.voucherNumber), true);
  box(10, 4, 7, 'Date (मिति) B.S.:', `${formatBsDate(voucher.voucherDate)}    A.D.: ${formatBillDate(voucher.voucherDate)}`);
  box(11, 4, 7, 'Mode (माध्यम):', PAYMENT_MODE_LABELS[voucher.paymentMode]);
  box(12, 4, 7, 'Cheque / Txn Ref. (सन्दर्भ नं.):', voucher.paymentRef);
  box(13, 4, 7, 'Against our Bill No.:', voucher.againstBillNo ? formatBillNumber(voucher.againstBillNo) : '');
  for (let r = 8; r <= 13; r++) {
    const edge = { top: r === 8 ? thin : undefined, bottom: r === 13 ? thin : undefined };
    cell(r, 1).border = { left: thin, ...edge };
    cell(r, 4).border = { left: thin, ...edge };
    cell(r, 7).border = { right: thin, ...edge };
    for (const c of [2, 3, 5, 6]) cell(r, c).border = edge;
  }

  // Items
  const headerRow = 15;
  sheet.getRow(headerRow).values = [
    'S.N.\nक्र.सं.', 'Consignment /\nAWB No.', 'Description of Service\nसेवाको विवरण', 'From → To\nकहाँबाट → कहाँ',
    'Qty/Kg\nपरिमाण', 'Rate (Rs.)\nदर', 'Amount (Rs.)\nरकम',
  ];
  sheet.getRow(headerRow).height = 30;
  sheet.getRow(headerRow).eachCell((c, col) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_ARGB } };
    c.alignment = { wrapText: true, vertical: 'middle', horizontal: col >= 5 ? 'right' : col === 1 ? 'center' : 'left' };
    c.border = BORDER;
  });
  const rows = Math.max(6, voucher.items.length);
  for (let i = 0; i < rows; i++) {
    const item = voucher.items[i];
    const row = sheet.getRow(headerRow + 1 + i);
    row.values = item
      ? [i + 1, item.awb, item.description, item.from || item.to ? `${item.from || '—'} → ${item.to || '—'}` : '',
         item.unit ? `${item.quantity} ${item.unit}` : item.quantity, item.rate, item.amount]
      : [i + 1];
    row.height = 18;
    for (let c = 1; c <= 7; c++) row.getCell(c).border = BORDER;
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { wrapText: true };
    row.getCell(5).alignment = { horizontal: 'right' };
    row.getCell(6).numFmt = MONEY_FMT;
    row.getCell(7).numFmt = MONEY_FMT;
  }

  // Amount in words (left) + amounts (right)
  let r = headerRow + rows + 2;
  const top = r;
  const gross = Math.round((voucher.subtotal + (voucher.otherCharges ?? 0)) * 100) / 100;
  const amounts: [string, number][] = [
    ['Service charges (सेवा शुल्क)', voucher.subtotal],
    ['Other charges (अन्य शुल्क)', voucher.otherCharges ?? 0],
    ['Total (जम्मा)', gross],
    ['Less: Discount (छुट)', voucher.discount],
  ];
  for (const [label, value] of amounts) {
    merge(r, 4, r, 6);
    cell(r, 4).value = label;
    cell(r, 4).border = BORDER;
    cell(r, 7).value = value;
    cell(r, 7).numFmt = MONEY_FMT;
    cell(r, 7).border = BORDER;
    r++;
  }
  merge(r, 4, r, 6);
  cell(r, 4).value = 'Net Paid (खुद भुक्तानी)';
  cell(r, 7).value = voucher.total;
  cell(r, 7).numFmt = MONEY_FMT;
  for (const c of [4, 7]) {
    cell(r, c).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_ARGB } };
    cell(r, c).border = BORDER;
  }
  const bottom = r;

  merge(top, 1, top, 3);
  cell(top, 1).value = 'Amount paid in words (अक्षरमा) : Rs.';
  cell(top, 1).font = { bold: true };
  merge(top + 1, 1, top + 2, 3);
  cell(top + 1, 1).value = amountInWords(voucher.total);
  cell(top + 1, 1).font = { italic: true };
  cell(top + 1, 1).alignment = { wrapText: true, vertical: 'top' };
  merge(top + 3, 1, bottom, 3);
  cell(top + 3, 1).value = `Remarks (कैफियत): ${voucher.remarks}${voucher.status === 'cancelled' ? `\nCANCELLED: ${voucher.cancelReason}` : ''}`;
  cell(top + 3, 1).alignment = { wrapText: true, vertical: 'top' };
  if (voucher.status === 'cancelled') cell(top + 3, 1).font = { color: { argb: 'FFC00000' } };
  for (let rr = top; rr <= bottom; rr++) {
    const edge = { top: rr === top ? thin : undefined, bottom: rr === bottom ? thin : undefined };
    cell(rr, 1).border = { left: thin, ...edge };
    cell(rr, 3).border = { right: thin, ...edge };
    cell(rr, 2).border = edge;
  }

  // Signatures: stamp + signature above the line on the right; rows fixed at 20px.
  r = bottom + 7;
  for (let k = r - 6; k < r; k++) sheet.getRow(k).height = 15;
  sheet.addImage(await addImage(workbook, stampSrc(settings)), { tl: { col: 4.05, row: r - 6.2 }, ext: { width: 96, height: 96 } });
  if (settings.signature) {
    sheet.addImage(await addImage(workbook, settings.signature, true), { tl: { col: 5.35, row: r - 4.2 }, ext: { width: 130, height: 70 } });
  }
  merge(r, 5, r, 7);
  cell(r, 5).value = `For ${seller.shortName || seller.name}`;
  cell(r, 5).font = { bold: true };
  cell(r, 5).alignment = { horizontal: 'center' };
  cell(r, 5).border = { top: thin };
  merge(r + 1, 5, r + 1, 7);
  cell(r + 1, 5).value = `${settings.signatoryTitle || 'Authorised Signatory'} (आधिकारिक दस्तखत)`;
  cell(r + 1, 5).alignment = { horizontal: 'center' };
  merge(r - 1, 1, r - 1, 2);
  cell(r - 1, 1).value = voucher.payee.name;
  cell(r - 1, 1).alignment = { shrinkToFit: true };
  merge(r, 1, r + 1, 2);
  cell(r, 1).value = 'Received by\n(भुक्तानी लिनेको दस्तखत)';
  cell(r, 1).alignment = { wrapText: true, vertical: 'top' };
  cell(r, 1).border = { top: thin };
  cell(r, 2).border = { top: thin };
  cell(r - 1, 3).value = typeof voucher.createdBy === 'object' ? voucher.createdBy.name : '';
  cell(r, 3).value = 'Prepared by (तयार गर्ने)';
  cell(r, 3).border = { top: thin };

  r += 3;
  merge(r, 1, r, 4);
  cell(r, 1).value = settings.printerNote;
  cell(r, 1).font = { size: 8, color: { argb: 'FF6B7280' } };
  merge(r, 5, r, 7);
  cell(r, 5).value = settings.footerNote;
  cell(r, 5).font = { bold: true, size: 9, color: { argb: ORANGE_ARGB } };
  cell(r, 5).alignment = { horizontal: 'right' };

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer as ArrayBuffer, `payment-voucher-${formatBillNumber(voucher.voucherNumber)}.xlsx`);
}

/** Expense register: one row per payment voucher, for a filtered date range. */
export async function exportVoucherRegister(
  vouchers: ApiVoucher[],
  range: { from?: string; to?: string },
  settings: BillSettings
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Expense Register');

  const columns = [
    { header: 'Voucher No.', width: 11 },
    { header: 'Date (B.S.)', width: 12 },
    { header: 'Date (A.D.)', width: 14 },
    { header: 'Fiscal Year', width: 11 },
    { header: 'Paid To', width: 28 },
    { header: 'Payee PAN', width: 12 },
    { header: 'Their Bill No.', width: 14 },
    { header: 'Against Our Bill', width: 14 },
    { header: 'Consignments / AWB', width: 22 },
    { header: 'Services', width: 32 },
    { header: 'Service Charges', width: 15 },
    { header: 'Other Charges', width: 13 },
    { header: 'Discount', width: 11 },
    { header: 'Net Paid', width: 14 },
    { header: 'Mode', width: 13 },
    { header: 'Cheque / Txn Ref.', width: 18 },
    { header: 'Status', width: 11 },
    { header: 'Remarks', width: 28 },
  ];
  const money = [11, 12, 13, 14];

  const title = sheet.addRow([`${settings.businessName} — Expense Register (payments to partner couriers)`]);
  title.font = { bold: true, size: 14 };
  sheet.addRow([settings.pan ? `PAN No.: ${settings.pan}` : settings.address]);
  sheet.addRow([range.from || range.to ? `Period: ${range.from || 'start'} to ${range.to || 'today'} (A.D.)` : 'Period: all vouchers']);
  sheet.addRow([]);

  const header = sheet.addRow(columns.map((c) => c.header));
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_ARGB } };
    c.border = BORDER;
  });
  columns.forEach((c, i) => {
    sheet.getColumn(i + 1).width = c.width;
  });

  const sorted = [...vouchers].sort((a, b) => a.voucherNumber - b.voucherNumber);
  for (const v of sorted) {
    const cancelled = v.status === 'cancelled';
    const row = sheet.addRow([
      formatBillNumber(v.voucherNumber),
      formatBsDate(v.voucherDate),
      formatBillDate(v.voucherDate),
      fiscalYear(v.voucherDate),
      v.payee.name,
      v.payee.pan,
      v.supplierBillNo,
      v.againstBillNo ? formatBillNumber(v.againstBillNo) : '',
      v.items.map((i) => i.awb).filter(Boolean).join(', '),
      v.items.map((i) => i.description).join(', '),
      v.subtotal,
      v.otherCharges ?? 0,
      v.discount,
      v.total,
      PAYMENT_MODE_LABELS[v.paymentMode],
      v.paymentRef,
      cancelled ? 'Cancelled' : 'Issued',
      cancelled ? `Cancelled: ${v.cancelReason}` : v.remarks,
    ]);
    money.forEach((c) => (row.getCell(c).numFmt = MONEY_FMT));
    if (cancelled) row.font = { color: { argb: 'FF999999' }, strike: true };
  }

  const issued = sorted.filter((v) => v.status === 'issued');
  const sum = (get: (v: ApiVoucher) => number) => Math.round(issued.reduce((s, v) => s + get(v), 0) * 100) / 100;
  const totals = new Array(columns.length).fill('');
  totals[9] = 'Total (issued vouchers)';
  totals[10] = sum((v) => v.subtotal);
  totals[11] = sum((v) => v.otherCharges ?? 0);
  totals[12] = sum((v) => v.discount);
  totals[13] = sum((v) => v.total);
  const totalRow = sheet.addRow(totals);
  totalRow.font = { bold: true };
  money.forEach((c) => (totalRow.getCell(c).numFmt = MONEY_FMT));

  sheet.views = [{ state: 'frozen', ySplit: 5 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const stamp = range.from || range.to ? `${range.from || 'start'}_to_${range.to || 'today'}` : new Date().toISOString().slice(0, 10);
  triggerDownload(buffer as ArrayBuffer, `expense-register-${stamp}.xlsx`);
}
