import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/** Render the on-screen bill element to an A4 PDF. */
export async function renderBillPdf(node: HTMLElement): Promise<Blob> {
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  const png = await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff', width, height, cacheBust: true });

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (height * pageW) / width;

  // Long bills spill onto extra pages by shifting the same image up one page at a time.
  let offset = 0;
  pdf.addImage(png, 'PNG', 0, 0, pageW, imgH);
  while (imgH - offset > pageH + 1) {
    offset += pageH;
    pdf.addPage();
    pdf.addImage(png, 'PNG', 0, -offset, pageW, imgH);
  }

  return pdf.output('blob');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Share the PDF through the OS share sheet (WhatsApp, Viber, email…) where supported —
 * mostly phones. Returns false if file sharing isn't available so the caller can fall back.
 */
export async function shareFile(blob: Blob, filename: string, text: string): Promise<boolean> {
  const file = new File([blob], filename, { type: blob.type || 'application/pdf' });
  if (typeof navigator === 'undefined' || !navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: filename, text });
  } catch (err) {
    // User closed the share sheet — not an error.
    if ((err as Error).name !== 'AbortError') throw err;
  }
  return true;
}
