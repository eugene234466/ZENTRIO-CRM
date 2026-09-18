// Invoices Section
import { useState } from 'react';
import { Plus, Trash2, FileText, Calendar, Clock, Eye, CheckCircle, FileDown, FileSpreadsheet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAppState } from '@/hooks/useAppState';
import type { Invoice } from '@/types';
import { formatCurrency, formatDate, generateId } from '@/lib/format';
import { exportInvoicesCSV, exportInvoicesPDF } from '@/lib/export';
import { InvoiceStatusBadge } from '@/components/statusBadge';
import { ReceiptView } from '@/components/layout/ReceiptView';

export const InvoicesSection = ({ 
  state, 
  addInvoice, 
  updateInvoice, 
  deleteInvoice,
  addToast 
}: { 
  state: ReturnType<typeof useAppState>['state']; 
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: '', quantity: 1, unitPrice: 0 }
  ]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = 15;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleCreateInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientId = formData.get('clientId') as string;
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    const { subtotal, taxAmount, total } = calculateTotals();
    const invoiceItems = items.map((item, i) => ({
      id: `item-${i}`,
      ...item
    }));

    const newInvoice: Invoice = {
      id: generateId(),
      clientId,
      clientName: client.name,
      invoiceNumber: `INV-${2000 + state.invoices.length + 1}`,
      items: invoiceItems,
      subtotal,
      taxRate: 15,
      taxAmount,
      total,
      status: 'Draft',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: formData.get('dueDate') as string,
    };

    addInvoice(newInvoice);
    setIsAddDialogOpen(false);
    setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    addToast('Invoice created successfully', 'success');
  };

  const handleExportCSV = () => {
    if (state.invoices.length === 0) {
      addToast('Nothing to export yet.', 'info');
      return;
    }
    exportInvoicesCSV(state.invoices);
    addToast(`Exported ${state.invoices.length} invoice(s) to CSV.`, 'success');
  };

  const handleExportPDF = () => {
    if (state.invoices.length === 0) {
      addToast('Nothing to export yet.', 'info');
      return;
    }
    const ok = exportInvoicesPDF(state.invoices);
    addToast(
      ok ? 'Opening print view — choose "Save as PDF".' : 'Popup blocked. Please allow popups to export PDF.',
      ok ? 'success' : 'error',
    );
  };
  const handleMarkAsPaid = (invoice: Invoice) => {
    updateInvoice({ ...invoice, status: 'Paid', paidDate: new Date().toISOString().split('T')[0] });
    addToast('Invoice marked as paid', 'success');
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">Invoices</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none border-[var(--border-color)] text-[var(--text-main)]"
              title="Export all invoices to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none border-[var(--border-color)] text-[var(--text-main)]"
              title="Export all invoices to PDF"
            >
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F2C94C] text-white hover:bg-[#D4A93A] font-medium w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateInvoice} className="space-y-4 sm:space-y-6 mt-4">
              <div>
                <Label htmlFor="client">Client</Label>
                <Select name="clientId" required>
                  <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                    {state.clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  id="dueDate" 
                  name="dueDate" 
                  type="date" 
                  required 
                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="border-[var(--border-color)] text-[var(--text-main)]">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                          className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                        />
                      </div>
                      <div className="col-span-2">
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(index)} className="text-[#E57A7A]">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--input-bg)] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Subtotal</span>
                  <span className="text-[var(--text-main)] font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Tax (15%)</span>
                  <span className="text-[var(--text-main)] font-mono">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-medium pt-2 border-t border-[var(--border-color)]">
                  <span className="text-[var(--text-main)]">Total</span>
                  <span className="text-[#D4A93A] dark:text-[#F2C94C] font-mono">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]">
                Create Invoice
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Invoices List */}
      <div className="grid gap-3 sm:gap-4">
        {state.invoices.map((invoice) => (
          <Card key={invoice.id} className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    invoice.status === 'Paid' ? 'bg-[#7DD3A6]/10' :
                    invoice.status === 'Overdue' ? 'bg-[#E57A7A]/10' :
                    invoice.status === 'Sent' ? 'bg-[#F2C94C]/10' :
                    'bg-gray-100 dark:bg-[#A6A9B6]/10'
                  }`}>
                    <FileText className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      invoice.status === 'Paid' ? 'text-[#059669] dark:text-[#7DD3A6]' :
                      invoice.status === 'Overdue' ? 'text-[#DC2626] dark:text-[#E57A7A]' :
                      invoice.status === 'Sent' ? 'text-[#B45309] dark:text-[#F2C94C]' :
                      'text-gray-500 dark:text-[#A6A9B6]'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[var(--text-main)] text-sm sm:text-base">{invoice.invoiceNumber}</p>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <p className="text-sm text-[var(--text-muted)] truncate">{invoice.clientName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(invoice.issueDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due: {formatDate(invoice.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <p className="text-xl sm:text-2xl font-bold text-[#D4A93A] dark:text-[#F2C94C] font-mono">{formatCurrency(invoice.total)}</p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button 
                      onClick={() => setViewingInvoice(invoice)}
                      className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    {invoice.status !== 'Paid' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkAsPaid(invoice)}
                        className="bg-[#7DD3A6] text-white hover:bg-[#6bc795] text-xs"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Pay
                      </Button>
                    )}
                    <button 
                      onClick={() => {
                        deleteInvoice(invoice.id);
                        addToast('Invoice deleted', 'success');
                      }}
                      className="p-2 rounded-lg hover:bg-[#E57A7A]/10 text-[var(--text-muted)] hover:text-[#E57A7A] transition-colors"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {state.invoices.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">No invoices yet</p>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <ReceiptView
          invoice={viewingInvoice}
          type="invoice"
          onClose={() => setViewingInvoice(null)}
          onExported={(message, kind) => addToast(message, kind === 'error' ? 'error' : 'success')}
        />
      )}
    </div>
  );
};