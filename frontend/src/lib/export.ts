import type { Invoice, Receipt } from '@/types';
import { formatCurrency, formatDateFull } from './format';

/* ---------- generic helpers ---------- */

const escapeHtml = (value: string | number | undefined | null): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const stamp = () => new Date().toISOString().slice(0, 10);

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const csvCell = (value: string | number | undefined | null): string => {
  const s = value === undefined || value === null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const lines = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ];
  // BOM so Excel opens UTF-8 (e.g. GH₵) correctly.
  saveBlob(filename, new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
}

/* ---------- PDF via print window (user picks "Save as PDF") ---------- */

const DOC_STYLES = `
  body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
  .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #F2C94C; padding-bottom: 20px; }
  .logo { font-size: 32px; font-weight: bold; color: #F2C94C; }
  .tagline { color: #666; font-size: 12px; margin-top: 5px; }
  .doc-type { font-size: 24px; font-weight: bold; margin-top: 10px; color: #1a1a2e; }
  .doc-number { color: #666; margin-top: 5px; }
  .section { margin: 25px 0; }
  .section-title { font-weight: bold; color: #1a1a2e; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
  .row:last-child { border-bottom: none; }
  .label { color: #666; }
  .value { font-weight: 500; }
  .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .items-table th { background: #f8f8f8; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; }
  .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
  .items-table tr:last-child td { border-bottom: 2px solid #F2C94C; }
  .totals { margin-top: 20px; border-top: 2px solid #F2C94C; padding-top: 20px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
  .grand-total { font-size: 20px; font-weight: bold; color: #b8912f; }
  .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
  .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
  .status-paid { background: #d4edda; color: #155724; }
  .status-sent { background: #fff3cd; color: #856404; }
  .status-draft { background: #e2e3e5; color: #383d41; }
  .status-overdue { background: #f8d7da; color: #721c24; }
  @media print { body { padding: 20px; } }
`;

/**
 * Opens the document in a print window so the user can save it as PDF.
 * Returns false when a popup blocker prevented it.
 */
export function printDocument(title: string, bodyHtml: string): boolean {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return false;
  win.document.write(
    `<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title><style>${DOC_STYLES}</style></head><body>${bodyHtml}</body></html>`,
  );
  win.document.close();
  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } catch {
      /* user can print manually from the opened tab */
    }
  };
  win.onload = doPrint;
  setTimeout(doPrint, 800);
  return true;
}

/* ---------- single-document bodies ---------- */

export function invoiceDocHTML(inv: Invoice): string {
  const items = inv.items
    .map(
      (item) => `<tr><td>${escapeHtml(item.description)}</td><td style="text-align:center">${item.quantity}</td>` +
        `<td style="text-align:right">${escapeHtml(formatCurrency(item.unitPrice))}</td>` +
        `<td style="text-align:right">${escapeHtml(formatCurrency(item.quantity * item.unitPrice))}</td></tr>`,
    )
    .join('');
  return `
    <div class="header">
      <div class="logo">ZENTRIO</div>
      <div class="tagline">Digital Solutions Agency — Accra, Ghana</div>
      <div class="doc-type">INVOICE</div>
      <div class="doc-number">${escapeHtml(inv.invoiceNumber)}</div>
      <div style="margin-top:10px"><span class="status-badge status-${inv.status.toLowerCase()}">${escapeHtml(inv.status)}</span></div>
    </div>
    <div class="section"><div class="section-title">Bill To</div><div class="value">${escapeHtml(inv.clientName)}</div></div>
    <div class="section">
      <div class="row"><span class="label">Issue Date</span><span class="value">${escapeHtml(formatDateFull(inv.issueDate))}</span></div>
      <div class="row"><span class="label">Due Date</span><span class="value">${escapeHtml(formatDateFull(inv.dueDate))}</span></div>
      ${inv.paidDate ? `<div class="row"><span class="label">Paid Date</span><span class="value">${escapeHtml(formatDateFull(inv.paidDate))}</span></div>` : ''}
    </div>
    <table class="items-table">
      <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${items}</tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span class="label">Subtotal</span><span class="value">${escapeHtml(formatCurrency(inv.subtotal))}</span></div>
      <div class="total-row"><span class="label">Tax (${inv.taxRate}%)</span><span class="value">${escapeHtml(formatCurrency(inv.taxAmount))}</span></div>
      <div class="total-row grand-total"><span>Total</span><span>${escapeHtml(formatCurrency(inv.total))}</span></div>
    </div>
    <div class="footer"><p>Thank you for your business!</p><p>Zentrio Solutions | info@zentrio.io | +233 20 123 4567</p></div>
  `;
}

export function receiptDocHTML(r: Receipt): string {
  return `
    <div class="header">
      <div class="logo">ZENTRIO</div>
      <div class="tagline">Digital Solutions Agency — Accra, Ghana</div>
      <div class="doc-type">RECEIPT</div>
      <div class="doc-number">${escapeHtml(r.receiptNumber)}</div>
    </div>
    <div class="section"><div class="section-title">Received From</div><div class="value">${escapeHtml(r.clientName)}</div></div>
    <div class="section">
      <div class="row"><span class="label">Payment Date</span><span class="value">${escapeHtml(formatDateFull(r.paymentDate))}</span></div>
      <div class="row"><span class="label">Payment Method</span><span class="value">${escapeHtml(r.paymentMethod)}</span></div>
      <div class="row"><span class="label">Invoice</span><span class="value">${escapeHtml(r.invoiceId)}</span></div>
    </div>
    <div class="totals"><div class="total-row grand-total"><span>Amount Paid</span><span>${escapeHtml(formatCurrency(r.amount))}</span></div></div>
    <div class="footer"><p>Thank you for your business!</p><p>Zentrio Solutions | info@zentrio.io | +233 20 123 4567</p></div>
  `;
}

/* ---------- list reports ---------- */

export function invoicesReportHTML(invoices: Invoice[]): string {
  const rows = invoices
    .map(
      (inv) => `<tr><td>${escapeHtml(inv.invoiceNumber)}</td><td>${escapeHtml(inv.clientName)}</td>` +
        `<td><span class="status-badge status-${inv.status.toLowerCase()}">${escapeHtml(inv.status)}</span></td>` +
        `<td>${escapeHtml(inv.issueDate)}</td><td>${escapeHtml(inv.dueDate)}</td>` +
        `<td style="text-align:right">${escapeHtml(formatCurrency(inv.total))}</td></tr>`,
    )
    .join('');
  const total = invoices.reduce((sum, inv) => sum + inv.total, 0);
  return `
    <div class="header">
      <div class="logo">ZENTRIO</div>
      <div class="doc-type">INVOICES REPORT</div>
      <div class="doc-number">${invoices.length} invoice(s) — ${escapeHtml(stamp())}</div>
    </div>
    <table class="items-table">
      <thead><tr><th>Number</th><th>Client</th><th>Status</th><th>Issued</th><th>Due</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6">No invoices.</td></tr>'}</tbody>
    </table>
    <div class="totals"><div class="total-row grand-total"><span>Combined Total</span><span>${escapeHtml(formatCurrency(total))}</span></div></div>
    <div class="footer"><p>Zentrio Solutions | info@zentrio.io | +233 20 123 4567</p></div>
  `;
}

export function receiptsReportHTML(receipts: Receipt[]): string {
  const rows = receipts
    .map(
      (r) => `<tr><td>${escapeHtml(r.receiptNumber)}</td><td>${escapeHtml(r.clientName)}</td>` +
        `<td>${escapeHtml(r.paymentDate)}</td><td>${escapeHtml(r.paymentMethod)}</td>` +
        `<td style="text-align:right">${escapeHtml(formatCurrency(r.amount))}</td></tr>`,
    )
    .join('');
  const total = receipts.reduce((sum, r) => sum + r.amount, 0);
  return `
    <div class="header">
      <div class="logo">ZENTRIO</div>
      <div class="doc-type">RECEIPTS REPORT</div>
      <div class="doc-number">${receipts.length} receipt(s) — ${escapeHtml(stamp())}</div>
    </div>
    <table class="items-table">
      <thead><tr><th>Number</th><th>Client</th><th>Paid</th><th>Method</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">No receipts.</td></tr>'}</tbody>
    </table>
    <div class="totals"><div class="total-row grand-total"><span>Combined Total</span><span>${escapeHtml(formatCurrency(total))}</span></div></div>
    <div class="footer"><p>Zentrio Solutions | info@zentrio.io | +233 20 123 4567</p></div>
  `;
}

/* ---------- ready-made export actions ---------- */

const money = (n: number) => Number(n ?? 0).toFixed(2);

export function exportInvoicesCSV(invoices: Invoice[]) {
  downloadCSV(
    `invoices-${stamp()}.csv`,
    ['Invoice Number', 'Client', 'Status', 'Issue Date', 'Due Date', 'Paid Date', 'Subtotal', 'Tax Rate %', 'Tax Amount', 'Total'],
    invoices.map((inv) => [
      inv.invoiceNumber, inv.clientName, inv.status, inv.issueDate, inv.dueDate, inv.paidDate ?? '',
      money(inv.subtotal), inv.taxRate, money(inv.taxAmount), money(inv.total),
    ]),
  );
}

export function exportReceiptsCSV(receipts: Receipt[]) {
  downloadCSV(
    `receipts-${stamp()}.csv`,
    ['Receipt Number', 'Invoice ID', 'Client', 'Amount', 'Payment Date', 'Payment Method', 'Generated At'],
    receipts.map((r) => [
      r.receiptNumber, r.invoiceId, r.clientName, money(r.amount), r.paymentDate, r.paymentMethod, r.generatedAt,
    ]),
  );
}

export function exportInvoiceItemsCSV(inv: Invoice) {
  downloadCSV(
    `${inv.invoiceNumber}-items.csv`,
    ['Description', 'Quantity', 'Unit Price', 'Amount'],
    [
      ...inv.items.map((item) => [
        item.description,
        item.quantity,
        money(item.unitPrice),
        money(item.quantity * item.unitPrice),
      ] as (string | number)[]),
      [],
      ['', '', 'Subtotal', money(inv.subtotal)],
      ['', '', `Tax (${inv.taxRate}%)`, money(inv.taxAmount)],
      ['', '', 'Total', money(inv.total)],
    ],
  );
}

export function exportReceiptCSV(r: Receipt) {
  downloadCSV(
    `${r.receiptNumber}.csv`,
    ['Receipt Number', 'Invoice ID', 'Client', 'Amount', 'Payment Date', 'Payment Method', 'Generated At'],
    [[r.receiptNumber, r.invoiceId, r.clientName, money(r.amount), r.paymentDate, r.paymentMethod, r.generatedAt]],
  );
}

export function exportInvoicePDF(inv: Invoice): boolean {
  return printDocument(`Invoice ${inv.invoiceNumber}`, invoiceDocHTML(inv));
}

export function exportReceiptPDF(r: Receipt): boolean {
  return printDocument(`Receipt ${r.receiptNumber}`, receiptDocHTML(r));
}

export function exportInvoicesPDF(invoices: Invoice[]): boolean {
  return printDocument('Invoices Report', invoicesReportHTML(invoices));
}

export function exportReceiptsPDF(receipts: Receipt[]): boolean {
  return printDocument('Receipts Report', receiptsReportHTML(receipts));
}
