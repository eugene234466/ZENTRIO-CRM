// Receipts Section
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt as ReceiptIcon, FileDown, FileSpreadsheet } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import type { Receipt, Invoice } from '@/types';
import { formatCurrency, formatDate, generateId } from '@/lib/format';
import { exportReceiptsCSV, exportReceiptsPDF } from '@/lib/export';
import { ReceiptView } from '@/components/layout/ReceiptView';

export const ReceiptsSection = ({ 
  state, 
  addReceipt,
  addToast,
  isAdmin,
}: { 
  state: ReturnType<typeof useAppState>['state']; 
  addReceipt: (receipt: Receipt) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  isAdmin: boolean;
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);

  const paidInvoices = state.invoices.filter(inv => inv.status === 'Paid');

  const handleExportCSV = () => {
    if (state.receipts.length === 0) {
      addToast('Nothing to export yet.', 'info');
      return;
    }
    exportReceiptsCSV(state.receipts);
    addToast(`Exported ${state.receipts.length} receipt(s) to CSV.`, 'success');
  };

  const handleExportPDF = () => {
    if (state.receipts.length === 0) {
      addToast('Nothing to export yet.', 'info');
      return;
    }
    const ok = exportReceiptsPDF(state.receipts);
    addToast(
      ok ? 'Opening print view — choose "Save as PDF".' : 'Popup blocked. Please allow popups to export PDF.',
      ok ? 'success' : 'error',
    );
  };

  const handleGenerateReceipt = () => {
    if (!selectedInvoice) return;
    
    const newReceipt: Receipt = {
      id: generateId(),
      invoiceId: selectedInvoice.id,
      receiptNumber: `RCP-${1000 + state.receipts.length + 1}`,
      clientName: selectedInvoice.clientName,
      amount: selectedInvoice.total,
      paymentDate: selectedInvoice.paidDate || new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer',
      generatedAt: new Date().toISOString(),
    };
    
    addReceipt(newReceipt);
    setSelectedInvoice(null);
    addToast('Receipt generated successfully', 'success');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">Receipt Generator</h2>
        {isAdmin && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none border-[var(--border-color)] text-[var(--text-main)]"
            title="Export all receipts to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none border-[var(--border-color)] text-[var(--text-main)]"
            title="Export all receipts to PDF"
          >
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Generate Receipt Form */}
        <Card className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg text-[var(--text-main)]">Generate New Receipt</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div>
              <Label>Select Paid Invoice</Label>
              <Select onValueChange={(value) => {
                const inv = paidInvoices.find(i => i.id === value);
                setSelectedInvoice(inv || null);
              }}>
                <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                  <SelectValue placeholder="Choose an invoice" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                  {paidInvoices.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.clientName} ({formatCurrency(inv.total)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedInvoice && (
              <div className="bg-[var(--input-bg)] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Client</span>
                  <span className="text-[var(--text-main)]">{selectedInvoice.clientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Invoice</span>
                  <span className="text-[var(--text-main)]">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Amount</span>
                  <span className="text-[#D4A93A] dark:text-[#F2C94C] font-mono">{formatCurrency(selectedInvoice.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Paid Date</span>
                  <span className="text-[var(--text-main)]">{formatDate(selectedInvoice.paidDate || '')}</span>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleGenerateReceipt}
              disabled={!selectedInvoice}
              className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A] disabled:opacity-50"
            >
              <ReceiptIcon className="w-4 h-4 mr-2" />
              Generate Receipt
            </Button>
          </CardContent>
        </Card>

        {/* Generated Receipts List */}
        <Card className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg text-[var(--text-main)]">Generated Receipts</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-3">
              {state.receipts.map((receipt) => (
                <div 
                  key={receipt.id} 
                  onClick={() => setViewingReceipt(receipt)}
                  className="flex items-center justify-between p-3 sm:p-4 bg-[var(--input-bg)] rounded-xl cursor-pointer hover:border-[#F2C94C]/30 border border-transparent transition-colors"
                >
                  <div>
                    <p className="font-medium text-[var(--text-main)]">{receipt.receiptNumber}</p>
                    <p className="text-sm text-[var(--text-muted)]">{receipt.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D4A93A] dark:text-[#F2C94C] font-mono">{formatCurrency(receipt.amount)}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatDate(receipt.paymentDate)}</p>
                  </div>
                </div>
              ))}
              {state.receipts.length === 0 && (
                <div className="py-8 text-center">
                  <ReceiptIcon className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">No receipts generated yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Receipt Modal */}
      {viewingReceipt && (
        <ReceiptView
          receipt={viewingReceipt}
          type="receipt"
          onClose={() => setViewingReceipt(null)}
          onExported={(message, kind) => addToast(message, kind === 'error' ? 'error' : 'success')}
        />
      )}
    </div>
  );
};