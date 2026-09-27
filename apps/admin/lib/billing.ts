import ExcelJS from 'exceljs';
import NepaliDate from 'nepali-date-converter';
import type { ApiBill, BillSettings, PaymentMode } from './types';
import { stampSrc, toPngDataUrl } from './billStamp';

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  cash: 'Cash',
  bank: 'Bank/Cheque',
  wallet: 'Wallet/QR',
  credit: 'Credit',
};

// ─── Nepali (B.S.) dates ────────────────────────────────────────────────────

/** Bill dates are stored as UTC midnight of the chosen day. */
function billDateParts(iso: string) {
  const d = new Date(iso);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate() };
}

/** "2083/06/11" */
export function formatBsDate(iso: string) {
  const { y, m, day } = billDateParts(iso);
  return NepaliDate.fromAD(new Date(y, m, day)).format('YYYY/MM/DD');
}

/** Nepal's fiscal year starts on Shrawan 1 (4th B.S. month), e.g. "2083/84". */
export function fiscalYear(iso: string) {
  const { y, m, day } = billDateParts(iso);
  const bs = NepaliDate.fromAD(new Date(y, m, day));
  const start = bs.getMonth() >= 3 ? bs.getYear() : bs.getYear() - 1;
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
}

/** Delivery charges + COD + other charges, before discount. */
export function grossTotal(bill: Pick<ApiBill, 'subtotal' | 'codCharge' | 'otherCharges'>) {
  return Math.round((bill.subtotal + (bill.codCharge ?? 0) + (bill.otherCharges ?? 0)) * 100) / 100;
}

export function formatBillNumber(n: number) {
  return String(n).padStart(4, '0');
}

export function formatNpr(amount: number) {
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Bill dates are stored as UTC midnight of the chosen day, so always format in UTC.
export function formatBillDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// ─── Amount in words (Nepali numbering: thousand, lakh, crore) ──────────────

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number) {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
}

function integerToWords(n: number): string {
  if (n === 0) return 'Zero';

  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;

  if (crore) parts.push(`${integerToWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));

  return parts.join(' ');
}

export function amountInWords(amount: number) {
  const rounded = Math.round(amount * 100);
  const rupees = Math.floor(rounded / 100);
  const paisa = rounded % 100;

  let words = `Rupees ${integerToWords(rupees)}`;
  if (paisa) words += ` and ${twoDigits(paisa)} Paisa`;
  return `${words} Only`;
}

// ─── Excel exports ──────────────────────────────────────────────────────────

export function triggerDownload(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const MONEY_FMT = '#,##0.00';
export const NAVY_ARGB = 'FF1B2A4A';
export const ORANGE_ARGB = 'FFE8590C';
export const thin = { style: 'thin' as const };
export const BORDER = { top: thin, left: thin, bottom: thin, right: thin };

function sellerOf(bill: ApiBill, settings: BillSettings) {
  return bill.seller?.name
    ? { ...bill.seller, shortName: bill.seller.shortName || settings.shortName }
    : { name: settings.businessName, shortName: settings.shortName, address: settings.address, phone: settings.phone, email: settings.email, pan: settings.pan };
}

export async function addImage(workbook: ExcelJS.Workbook, src: string, knockOutWhite = false) {
  // Excel only embeds PNG/JPEG/GIF, so normalise everything (e.g. the SVG stamp) to PNG.
  const png = src.startsWith('data:image/png') && !knockOutWhite ? src : await toPngDataUrl(src, 400, knockOutWhite);
  return workbook.addImage({ base64: png, extension: 'png' });
}

/**
 * One bill laid out like the printed invoice. `settings` should have the logo resolved
 * (withDefaultLogo) so the letterhead and stamp include it.
 */
export async function exportBillToExcel(bill: ApiBill, settings: BillSettings, copy: 'customer' | 'office' = 'customer') {
  const seller = sellerOf(bill, settings);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Bill ${formatBillNumber(bill.billNumber)}`, {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ showGridLines: false }],
  });

  // A: S.N. | B: AWB | C: Description | D: From → To | E: Qty/Kg | F: Rate | G: Amount
  sheet.columns = [{ width: 6 }, { width: 16 }, { width: 30 }, { width: 22 }, { width: 9 }, { width: 12 }, { width: 15 }];
  const cell = (r: number, c: number) => sheet.getCell(r, c);
  const merge = (r1: number, c1: number, r2: number, c2: number) => sheet.mergeCells(r1, c1, r2, c2);

  // Letterhead (logo sits over column A-B of rows 1-4)
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
  cell(1, 6).value = 'INVOICE';
  cell(1, 6).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  cell(1, 6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_ARGB } };
  cell(1, 6).alignment = { horizontal: 'center', vertical: 'middle' };
  merge(3, 6, 3, 7);
  cell(3, 6).value = 'बिल';
  cell(3, 6).font = { bold: true, size: 13, color: { argb: NAVY_ARGB } };
  cell(3, 6).alignment = { horizontal: 'right' };
  for (let c = 1; c <= 7; c++) cell(5, c).border = { bottom: { style: 'medium', color: { argb: ORANGE_ARGB } } };

  // Copy + fiscal year
  merge(6, 1, 6, 4);
  // Plain [x] marks — box-drawing glyphs are missing from many spreadsheet fonts.
  cell(6, 1).value = `[${copy === 'customer' ? 'x' : ' '}] Original – Customer     [${copy === 'office' ? 'x' : ' '}] Copy – Office`;
  merge(6, 5, 6, 7);
  cell(6, 5).value = `Fiscal Year (आर्थिक वर्ष): ${fiscalYear(bill.billDate)}`;
  cell(6, 5).alignment = { horizontal: 'right' };

  // Bill to / bill details
  const box = (r: number, c1: number, c2: number, label: string, value: string, bold = false) => {
    merge(r, c1, r, c2);
    cell(r, c1).value = { richText: [{ text: `${label} `, font: { bold: true } }, { text: value, font: { bold } }] };
  };
  merge(8, 1, 8, 3);
  cell(8, 1).value = 'BILL TO / ग्राहक';
  cell(8, 1).font = { bold: true, size: 9, color: { argb: ORANGE_ARGB } };
  merge(8, 4, 8, 7);
  cell(8, 4).value = 'BILL DETAILS / बिल विवरण';
  cell(8, 4).font = { bold: true, size: 9, color: { argb: ORANGE_ARGB } };
  box(9, 1, 3, 'Name (नाम):', bill.customer.name);
  box(10, 1, 3, 'Address (ठेगाना):', bill.customer.address);
  box(11, 1, 3, 'Customer PAN, if any (स्था.ले.नं.):', bill.customer.pan);
  box(12, 1, 3, 'Phone (फोन):', bill.customer.phone);
  box(9, 4, 7, 'Bill No. (बिल नं.):', formatBillNumber(bill.billNumber), true);
  box(10, 4, 7, 'Date (मिति) B.S.:', `${formatBsDate(bill.billDate)}    A.D.: ${formatBillDate(bill.billDate)}`);
  box(11, 4, 7, 'Payment (भुक्तानी):', PAYMENT_MODE_LABELS[bill.paymentMode]);
  for (let r = 8; r <= 12; r++) {
    cell(r, 1).border = { left: thin, top: r === 8 ? thin : undefined, bottom: r === 12 ? thin : undefined };
    cell(r, 4).border = { left: thin, top: r === 8 ? thin : undefined, bottom: r === 12 ? thin : undefined };
    cell(r, 7).border = { right: thin, top: r === 8 ? thin : undefined, bottom: r === 12 ? thin : undefined };
    for (const c of [2, 3, 5, 6]) cell(r, c).border = { top: r === 8 ? thin : undefined, bottom: r === 12 ? thin : undefined };
  }

  // Items
  const headerRow = 14;
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
  const rows = Math.max(8, bill.items.length);
  for (let i = 0; i < rows; i++) {
    const item = bill.items[i];
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

  // Amount in words (left) + charges (right)
  let r = headerRow + rows + 2;
  const chargesTop = r;
  const charges: [string, number][] = [
    ['Delivery charges (ढुवानी शुल्क)', bill.subtotal],
    ['COD handling charge (COD सेवा शुल्क)', bill.codCharge ?? 0],
    ['Other charges (अन्य शुल्क)', bill.otherCharges ?? 0],
    ['Total (जम्मा)', grossTotal(bill)],
    ['Less: Discount (छुट)', bill.discount],
  ];
  for (const [label, value] of charges) {
    merge(r, 4, r, 6);
    cell(r, 4).value = label;
    cell(r, 4).border = BORDER;
    cell(r, 7).value = value;
    cell(r, 7).numFmt = MONEY_FMT;
    cell(r, 7).border = BORDER;
    r++;
  }
  merge(r, 4, r, 6);
  cell(r, 4).value = 'Net Amount (खुद रकम)';
  cell(r, 7).value = bill.total;
  cell(r, 7).numFmt = MONEY_FMT;
  for (const c of [4, 7]) {
    cell(r, c).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_ARGB } };
    cell(r, c).border = BORDER;
  }
  const chargesBottom = r;

  merge(chargesTop, 1, chargesTop, 3);
  cell(chargesTop, 1).value = 'Amount in words (अक्षरमा) : Rs.';
  cell(chargesTop, 1).font = { bold: true };
  merge(chargesTop + 1, 1, chargesTop + 2, 3);
  cell(chargesTop + 1, 1).value = amountInWords(bill.total);
  cell(chargesTop + 1, 1).font = { italic: true };
  cell(chargesTop + 1, 1).alignment = { wrapText: true, vertical: 'top' };
  merge(chargesTop + 3, 1, chargesBottom, 3);
  cell(chargesTop + 3, 1).value = `Remarks (कैफियत): ${bill.remarks}${bill.status === 'cancelled' ? `\nCANCELLED: ${bill.cancelReason}` : ''}`;
  cell(chargesTop + 3, 1).alignment = { wrapText: true, vertical: 'top' };
  if (bill.status === 'cancelled') cell(chargesTop + 3, 1).font = { color: { argb: 'FFC00000' } };
  for (let rr = chargesTop; rr <= chargesBottom; rr++) {
    cell(rr, 1).border = { left: thin, top: rr === chargesTop ? thin : undefined, bottom: rr === chargesBottom ? thin : undefined };
    cell(rr, 3).border = { right: thin, top: rr === chargesTop ? thin : undefined, bottom: rr === chargesBottom ? thin : undefined };
    for (const c of [2]) cell(rr, c).border = { top: rr === chargesTop ? thin : undefined, bottom: rr === chargesBottom ? thin : undefined };
  }

  // Signatures: stamp + signature above the line on the right.
  // Rows are fixed at 15pt (20px) so image positions are predictable in any spreadsheet app.
  r = chargesBottom + 7;
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
  merge(r, 1, r + 1, 2);
  cell(r, 1).value = 'Received by\n(बुझिलिनेको दस्तखत)';
  cell(r, 1).alignment = { wrapText: true, vertical: 'top' };
  cell(r, 1).border = { top: thin };
  cell(r, 2).border = { top: thin };
  const preparedBy = typeof bill.createdBy === 'object' ? bill.createdBy.name : '';
  cell(r - 1, 3).value = preparedBy;
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
  triggerDownload(buffer as ArrayBuffer, `bill-${formatBillNumber(bill.billNumber)}${copy === 'office' ? '-office-copy' : ''}.xlsx`);
}

/** Sales register: one row per bill, for a filtered date range. */
export async function exportBillRegister(
  bills: ApiBill[],
  range: { from?: string; to?: string },
  settings: BillSettings
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sales Register');

  const columns = [
    { header: 'Bill No.', width: 10 },
    { header: 'Date (B.S.)', width: 12 },
    { header: 'Date (A.D.)', width: 14 },
    { header: 'Fiscal Year', width: 11 },
    { header: 'Customer', width: 28 },
    { header: 'Customer PAN', width: 14 },
    { header: 'Address', width: 24 },
    { header: 'Phone', width: 14 },
    { header: 'Consignments / AWB', width: 22 },
    { header: 'Services', width: 34 },
    { header: 'Delivery Charges', width: 15 },
    { header: 'COD Charge', width: 12 },
    { header: 'Other Charges', width: 13 },
    { header: 'Discount', width: 11 },
    { header: 'Net Amount', width: 14 },
    { header: 'Payment', width: 13 },
    { header: 'Status', width: 11 },
    { header: 'Remarks', width: 28 },
  ];
  const money = [11, 12, 13, 14, 15];

  const title = sheet.addRow([`${settings.businessName} — Sales Register`]);
  title.font = { bold: true, size: 14 };
  sheet.addRow([settings.pan ? `PAN No.: ${settings.pan}` : settings.address]);
  const rangeText =
    range.from || range.to ? `Period: ${range.from || 'start'} to ${range.to || 'today'} (A.D.)` : 'Period: all bills';
  sheet.addRow([rangeText]);
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

  // Oldest first reads naturally in a register.
  const sorted = [...bills].sort((a, b) => a.billNumber - b.billNumber);
  for (const bill of sorted) {
    const cancelled = bill.status === 'cancelled';
    const row = sheet.addRow([
      formatBillNumber(bill.billNumber),
      formatBsDate(bill.billDate),
      formatBillDate(bill.billDate),
      fiscalYear(bill.billDate),
      bill.customer.name,
      bill.customer.pan,
      bill.customer.address,
      bill.customer.phone,
      bill.items.map((i) => i.awb).filter(Boolean).join(', '),
      bill.items.map((i) => i.description).join(', '),
      bill.subtotal,
      bill.codCharge ?? 0,
      bill.otherCharges ?? 0,
      bill.discount,
      bill.total,
      PAYMENT_MODE_LABELS[bill.paymentMode],
      cancelled ? 'Cancelled' : 'Issued',
      cancelled ? `Cancelled: ${bill.cancelReason}` : bill.remarks,
    ]);
    money.forEach((c) => (row.getCell(c).numFmt = MONEY_FMT));
    if (cancelled) row.font = { color: { argb: 'FF999999' }, strike: true };
  }

  const issued = sorted.filter((b) => b.status === 'issued');
  const sum = (get: (b: ApiBill) => number) => Math.round(issued.reduce((s, b) => s + get(b), 0) * 100) / 100;
  const totals = new Array(columns.length).fill('');
  totals[9] = 'Total (issued bills)';
  totals[10] = sum((b) => b.subtotal);
  totals[11] = sum((b) => b.codCharge ?? 0);
  totals[12] = sum((b) => b.otherCharges ?? 0);
  totals[13] = sum((b) => b.discount);
  totals[14] = sum((b) => b.total);
  const totalRow = sheet.addRow(totals);
  totalRow.font = { bold: true };
  money.forEach((c) => (totalRow.getCell(c).numFmt = MONEY_FMT));

  sheet.views = [{ state: 'frozen', ySplit: 5 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const stamp = range.from || range.to ? `${range.from || 'start'}_to_${range.to || 'today'}` : new Date().toISOString().slice(0, 10);
  triggerDownload(buffer as ArrayBuffer, `sales-register-${stamp}.xlsx`);
}
