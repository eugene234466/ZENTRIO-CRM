import { ChevronLeft, Download, Share2 } from 'lucide-react';
import type { Receipt, Invoice } from '@/types';
import { formatCurrency, formatDateFull } from '@/lib/format';

export const ReceiptView = ({ 
  receipt, 
  invoice, 
  onClose,
  type 
}: { 
  receipt?: Receipt; 
  invoice?: Invoice;
  onClose: () => void;
  type: 'receipt' | 'invoice';
}) => {
  const data = type === 'receipt' ? receipt : invoice;
  if (!data) return null;

  const isInvoice = type === 'invoice';
  const inv = invoice;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = document.getElementById('receipt-print-area')?.innerHTML || '';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${type === 'receipt' ? 'Receipt' : 'Invoice'} - Zentrio</title>
          <style>
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
            .grand-total { font-size: 20px; font-weight: bold; color: #F2C94C; }
            .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .status-paid { background: #d4edda; color: #155724; }
            .status-sent { background: #fff3cd; color: #856404; }
            .status-draft { background: #e2e3e5; color: #383d41; }
            .status-overdue { background: #f8d7da; color: #721c24; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type === 'receipt' ? 'Receipt' : 'Invoice'}-${(receipt?.receiptNumber || invoice?.invoiceNumber || 'document')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#12151C] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[rgba(244,246,251,0.08)]">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgba(244,246,251,0.04)]">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-[#A6A9B6]" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F4F6FB]">
              {type === 'receipt' ? 'Receipt' : 'Invoice'} Details
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgba(244,246,251,0.04)] text-gray-600 dark:text-[#A6A9B6]"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={handlePrint}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgba(244,246,251,0.04)] text-gray-600 dark:text-[#A6A9B6]"
              title="Print"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div id="receipt-print-area" className="bg-white text-gray-900 p-6 sm:p-10 rounded-xl">
            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-[#F2C94C]">
              <div className="text-3xl font-bold text-[#F2C94C]">ZENTRIO</div>
              <div className="text-xs text-gray-500 mt-1">Digital Solutions Agency</div>
              <div className="text-xs text-gray-500">Accra, Ghana</div>
              <div className="text-2xl font-bold mt-4 text-gray-900">{type === 'receipt' ? 'RECEIPT' : 'INVOICE'}</div>
              <div className="text-gray-500 mt-1">
                {type === 'receipt' ? (receipt as Receipt)?.receiptNumber : (invoice as Invoice)?.invoiceNumber}
              </div>
              {isInvoice && inv && (
                <div className="mt-3">
                  <span className={`status-badge status-${inv.status.toLowerCase()}`}>
                    {inv.status}
                  </span>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Bill To</div>
                <div className="font-medium text-gray-900">{data.clientName}</div>
                <div className="text-sm text-gray-500">Client</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Date</div>
                <div className="font-medium text-gray-900">
                  {formatDateFull(type === 'receipt' ? (data as Receipt).paymentDate : (data as Invoice).issueDate)}
                </div>
                {isInvoice && inv && (
                  <>
                    <div className="text-xs font-bold text-gray-500 uppercase mt-3 mb-1">Due Date</div>
                    <div className="font-medium text-gray-900">{formatDateFull(inv.dueDate)}</div>
                  </>
                )}
              </div>
            </div>

            {/* Items Table */}
            {isInvoice && inv && inv.items.length > 0 && (
              <table className="w-full mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 text-xs uppercase text-gray-500">Description</th>
                    <th className="text-center p-3 text-xs uppercase text-gray-500">Qty</th>
                    <th className="text-right p-3 text-xs uppercase text-gray-500">Price</th>
                    <th className="text-right p-3 text-xs uppercase text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Totals */}
            <div className="border-t-2 border-[#F2C94C] pt-4 mt-6">
              {isInvoice && inv ? (
                <>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">{formatCurrency(inv.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Tax ({inv.taxRate}%)</span>
                    <span className="font-medium">{formatCurrency(inv.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between py-3 text-xl font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-[#F2C94C]">{formatCurrency(inv.total)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-3 text-xl font-bold">
                  <span className="text-gray-900">Amount Paid</span>
                  <span className="text-[#F2C94C]">{formatCurrency((data as Receipt).amount)}</span>
                </div>
              )}
            </div>

            {/* Payment Info for Receipt */}
            {type === 'receipt' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Payment Information</div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium">{(data as Receipt).paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Payment Date</span>
                  <span className="font-medium">{formatDateFull((data as Receipt).paymentDate)}</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-10 pt-6 border-t border-gray-200 text-gray-500 text-sm">
              <p>Thank you for your business!</p>
              <p className="mt-1">Zentrio Solutions | info@zentrio.io | +233 20 123 4567</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};