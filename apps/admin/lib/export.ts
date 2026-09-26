import ExcelJS from 'exceljs';
import type { ApiShipment } from './types';

function triggerDownload(buffer: ArrayBuffer, filename: string) {
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

function formatDate(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const MANIFEST_COLUMNS: { header: string; width: number; get: (s: ApiShipment) => string | number }[] = [
  { header: 'House Bill', width: 14, get: (s) => s.freight?.houseBill ?? '' },
  { header: 'ETA', width: 12, get: (s) => formatDate(s.eta) },
  { header: 'Consignee Name', width: 22, get: (s) => s.consignee?.name || s.recipient },
  { header: 'Consignee Address1', width: 26, get: (s) => s.consignee?.address1 || s.destination },
  { header: 'Consignee Address2', width: 20, get: (s) => s.consignee?.address2 ?? '' },
  { header: 'Consignee State', width: 14, get: (s) => s.consignee?.state ?? '' },
  { header: 'Consignee City', width: 18, get: (s) => s.consignee?.city ?? '' },
  { header: 'Consignee Country', width: 16, get: (s) => s.consignee?.country ?? '' },
  { header: 'Consignee Postcode', width: 16, get: (s) => s.consignee?.postcode ?? '' },
  { header: 'Consignee Phone', width: 16, get: (s) => s.consignee?.phone || s.phone || '' },
  { header: 'Consignee Contact', width: 18, get: (s) => s.consignee?.contact || s.consignee?.name || s.recipient },
  { header: 'IATA Dest Port', width: 14, get: (s) => s.freight?.iataDestPort ?? '' },
  { header: 'Weight', width: 10, get: (s) => s.weightKg },
  { header: 'Pieces', width: 8, get: (s) => s.freight?.pieces ?? 1 },
  { header: 'Currency Code', width: 12, get: (s) => s.freight?.currencyCode || 'USD' },
  { header: 'Customs Value', width: 14, get: (s) => s.freight?.declaredValueUsd ?? 0 },
  { header: 'Description of Goods', width: 20, get: (s) => s.freight?.descriptionOfGoods || s.freight?.contentType || '' },
  { header: 'Flight No', width: 12, get: (s) => s.freight?.flightNo ?? '' },
  { header: 'Master Bill', width: 14, get: (s) => s.freight?.masterBill ?? '' },
  { header: 'IATA Load Port', width: 14, get: (s) => s.freight?.iataLoadPort ?? '' },
  { header: 'Shipper Name', width: 22, get: (s) => s.sender?.name ?? '' },
  { header: 'Shipper Address1', width: 26, get: (s) => s.sender?.address1 || s.origin },
  { header: 'Shipper Address2', width: 20, get: (s) => s.sender?.address2 ?? '' },
  { header: 'Shipper City', width: 18, get: (s) => s.sender?.city ?? '' },
  { header: 'Shipper Country', width: 16, get: (s) => s.sender?.country ?? '' },
  { header: 'Shipper PostCode', width: 16, get: (s) => s.sender?.postcode ?? '' },
  { header: 'Port Destination', width: 16, get: (s) => s.freight?.portDestination ?? '' },
  { header: 'Airline Code', width: 12, get: (s) => s.freight?.airlineCode ?? '' },
  { header: 'Remarks', width: 24, get: (s) => s.freight?.remarks || s.notes || '' },
];

export async function exportShipmentManifest(shipments: ApiShipment[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Manifest');

  sheet.columns = MANIFEST_COLUMNS.map((c) => ({ header: c.header, width: c.width }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };

  for (const shipment of shipments) {
    sheet.addRow(MANIFEST_COLUMNS.map((c) => c.get(shipment)));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(buffer as ArrayBuffer, `shipment-manifest-${stamp}.xlsx`);
}

const INVOICE_COLUMNS: { header: string; width: number; get: (s: ApiShipment) => string | number }[] = [
  { header: 'Tracking #', width: 16, get: (s) => s.trackingNumber },
  { header: 'House Bill', width: 14, get: (s) => s.freight?.houseBill ?? '' },
  { header: 'Consignee Name', width: 22, get: (s) => s.consignee?.name || s.recipient },
  { header: 'Consignee Company', width: 20, get: (s) => s.consignee?.company ?? '' },
  { header: 'Weight (kg)', width: 12, get: (s) => s.weightKg },
  { header: 'Pieces', width: 8, get: (s) => s.freight?.pieces ?? 1 },
  { header: 'Currency Code', width: 12, get: (s) => s.freight?.currencyCode || 'USD' },
  { header: 'Declared Value', width: 14, get: (s) => s.freight?.declaredValueUsd ?? 0 },
  { header: 'Price', width: 12, get: (s) => s.price ?? 0 },
  { header: 'Delivered Date', width: 16, get: (s) => formatDate(s.deliveredAt) },
];

export async function exportInvoiceList(shipments: ApiShipment[]) {
  const delivered = shipments.filter((s) => s.status === 'delivered');

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Invoices');

  sheet.columns = INVOICE_COLUMNS.map((c) => ({ header: c.header, width: c.width }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };

  for (const shipment of delivered) {
    sheet.addRow(INVOICE_COLUMNS.map((c) => c.get(shipment)));
  }

  const priceColIndex = INVOICE_COLUMNS.findIndex((c) => c.header === 'Price') + 1;
  const total = delivered.reduce((sum, s) => sum + (s.price ?? 0), 0);
  const totalRow = sheet.addRow([]);
  totalRow.getCell(priceColIndex - 1).value = 'Total';
  totalRow.getCell(priceColIndex - 1).font = { bold: true };
  totalRow.getCell(priceColIndex).value = Math.round(total * 100) / 100;
  totalRow.getCell(priceColIndex).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(buffer as ArrayBuffer, `invoice-list-${stamp}.xlsx`);
}
