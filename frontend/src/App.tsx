import { useState, useEffect, useRef } from 'react';

import { 
  LayoutDashboard, Users, Kanban, FileText, Receipt as ReceiptIcon, UsersRound, 
  MessageSquare, Plus, Search, Bell, Menu, X, Sun, Moon,
  Calendar, TrendingUp, Clock, CheckCircle, Eye, Download, Share2,
  AlertCircle, DollarSign, Filter, Edit, Trash2,
  Send, Pin, CheckCircle2, Circle,
  Clock3, Building2, GraduationCap, Heart, Briefcase, ChevronLeft
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/hooks/useAppState';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/hooks/useTheme.tsx';
import type { Client, Lead, Invoice, Receipt, TeamMember, Message, Task, ClientType, ClientStatus, LeadStage, LeadTemperature, InvoiceStatus, TaskStatus, View } from '@/types';
import './App.css';

gsap.registerPlugin(ScrollTrigger);


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatDateFull = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GH', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const ClientStatusBadge = ({ status }: { status: ClientStatus }) => {
  const styles = {
    Active: 'bg-[#7DD3A6]/20 text-[#059669] dark:text-[#7DD3A6] border-[#7DD3A6]/30',
    Prospect: 'bg-[#F2C94C]/20 text-[#B45309] dark:text-[#F2C94C] border-[#F2C94C]/30',
    Lead: 'bg-gray-200 dark:bg-[#A6A9B6]/20 text-gray-600 dark:text-[#A6A9B6] border-gray-300 dark:border-[#A6A9B6]/30',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};

const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const styles = {
    Paid: 'bg-[#7DD3A6]/20 text-[#059669] dark:text-[#7DD3A6] border-[#7DD3A6]/30',
    Sent: 'bg-[#F2C94C]/20 text-[#B45309] dark:text-[#F2C94C] border-[#F2C94C]/30',
    Draft: 'bg-gray-200 dark:bg-[#A6A9B6]/20 text-gray-600 dark:text-[#A6A9B6] border-gray-300 dark:border-[#A6A9B6]/30',
    Overdue: 'bg-[#E57A7A]/20 text-[#DC2626] dark:text-[#E57A7A] border-[#E57A7A]/30',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};

const LeadTemperatureBadge = ({ temp }: { temp: LeadTemperature }) => {
  const styles = {
    Hot: 'bg-[#E57A7A]/20 text-[#DC2626] dark:text-[#E57A7A] border-[#E57A7A]/30',
    Warm: 'bg-[#F2C94C]/20 text-[#B45309] dark:text-[#F2C94C] border-[#F2C94C]/30',
    Cold: 'bg-gray-200 dark:bg-[#A6A9B6]/20 text-gray-600 dark:text-[#A6A9B6] border-gray-300 dark:border-[#A6A9B6]/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[temp]}`}>
      {temp}
    </span>
  );
};

const TaskStatusBadge = ({ status }: { status: TaskStatus }) => {
  const icons = {
    Pending: Circle,
    'In Progress': Clock3,
    Completed: CheckCircle2,
  };
  const Icon = icons[status];
  const styles = {
    Pending: 'text-gray-500 dark:text-[#A6A9B6]',
    'In Progress': 'text-[#B45309] dark:text-[#F2C94C]',
    Completed: 'text-[#059669] dark:text-[#7DD3A6]',
  };
  return (
    <span className={`flex items-center gap-1 text-xs ${styles[status]}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};


const ToastContainer = ({ toasts, removeToast }: { toasts: ReturnType<typeof useToast>['toasts']; removeToast: (id: string) => void }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] max-w-[90vw] animate-slide-in pointer-events-auto ${
            toast.type === 'success' ? 'bg-[#7DD3A6] text-white' :
            toast.type === 'error' ? 'bg-[#E57A7A] text-white' :
            'bg-[#F2C94C] text-[#1a1a2e]'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <Bell className="w-5 h-5 flex-shrink-0" />}
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};


const ReceiptView = ({ 
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

// Sidebar Component
const Sidebar = ({ 
  currentView, 
  setView, 
  isOpen, 
  setIsOpen 
}: { 
  currentView: View; 
  setView: (view: View) => void; 
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const navItems: { view: View; label: string; icon: React.ElementType }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'clients', label: 'Clients', icon: Users },
    { view: 'leads', label: 'Leads', icon: Kanban },
    { view: 'invoices', label: 'Invoices', icon: FileText },
    { view: 'receipts', label: 'Receipts', icon: ReceiptIcon },
    { view: 'team', label: 'Team', icon: UsersRound },
    { view: 'board', label: 'Board', icon: MessageSquare },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-[260px] bg-[var(--bg-secondary)] border-r border-[var(--border-color)]
        flex flex-col z-50 transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F2C94C] to-[#D4A93A] flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <span className="text-xl font-semibold text-[var(--text-main)]">Zentrio</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => {
                  setView(item.view);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-[#F2C94C]/15 text-[#D4A93A] dark:text-[#F2C94C]' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)]'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center">
              <span className="text-[#D4A93A] dark:text-[#F2C94C] text-xs font-bold">KM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-main)] truncate">Kwesi Mensah</p>
              <p className="text-xs text-[var(--text-muted)]">Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// Bottom Navigation for Mobile
const BottomNav = ({ 
  currentView, 
  setView 
}: { 
  currentView: View; 
  setView: (view: View) => void;
}) => {
  const navItems: { view: View; label: string; icon: React.ElementType }[] = [
    { view: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { view: 'clients', label: 'Clients', icon: Users },
    { view: 'invoices', label: 'Invoices', icon: FileText },
    { view: 'team', label: 'Team', icon: UsersRound },
    { view: 'board', label: 'Board', icon: MessageSquare },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] safe-area-bottom z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                isActive 
                  ? 'text-[#D4A93A] dark:text-[#F2C94C]' 
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Topbar Component
const Topbar = ({ onMenuClick, onLogout }: { onMenuClick: () => void; onLogout: () => void }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="h-[64px] bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-[200px] lg:w-[280px] pl-10 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#F2C94C]/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button className="relative p-2.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F2C94C] rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center ml-1">
          <span className="text-[#D4A93A] dark:text-[#F2C94C] text-sm font-bold">KM</span>
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)]"
        >
          Log out
        </button>
      </div>
    </header>
  );
};

// Dashboard Section
const DashboardSection = ({ state }: { state: ReturnType<typeof useAppState>['state'] }) => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-title',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      );
      
      gsap.fromTo('.hero-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.4 }
      );

      gsap.fromTo('.kpi-card',
        { opacity: 0, y: 40, scale: 0.96 },
        { 
          opacity: 1, y: 0, scale: 1, 
          duration: 0.7, 
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.5
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const totalClients = state.clients.length;
  const totalRevenue = state.invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  const pendingInvoices = state.invoices
    .filter(inv => inv.status === 'Sent' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.total, 0);
  const activeLeads = state.leads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost').length;

  const revenueData = [
    { name: 'Jan', revenue: 15000 },
    { name: 'Feb', revenue: 22000 },
    { name: 'Mar', revenue: 18000 },
    { name: 'Apr', revenue: 28000 },
    { name: 'May', revenue: 24500 },
    { name: 'Jun', revenue: 32000 },
  ];

  const leadSourceData = [
    { name: 'Referral', value: 35 },
    { name: 'Social', value: 25 },
    { name: 'Direct', value: 20 },
    { name: 'Other', value: 20 },
  ];

  const COLORS = ['#F2C94C', '#7DD3A6', '#A6A9B6', '#E57A7A'];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div ref={heroRef} className="space-y-4">
        <div className="space-y-1">
          <h1 className="hero-title text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-main)]">
            Run your agency like a product.
          </h1>
          <p className="hero-subtitle text-[var(--text-muted)] text-sm sm:text-base max-w-xl">
            Track clients, leads, invoices, and team tasks—one dashboard, zero clutter.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="kpi-card bg-[var(--card-bg)] rounded-2xl sm:rounded-[28px] p-4 sm:p-6 border border-[var(--border-color)] card-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F2C94C]/10 flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A93A] dark:text-[#F2C94C]" />
              </div>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-[#059669] dark:text-[#7DD3A6]">
                <TrendingUp className="w-3 h-3" />
                +12
              </span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#D4A93A] dark:text-[#F2C94C] font-mono">{totalClients}</p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">Total Clients</p>
          </div>

          <div className="kpi-card bg-[var(--card-bg)] rounded-2xl sm:rounded-[28px] p-4 sm:p-6 border border-[var(--border-color)] card-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#7DD3A6]/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#059669] dark:text-[#7DD3A6]" />
              </div>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-[#059669] dark:text-[#7DD3A6]">
                <TrendingUp className="w-3 h-3" />
                +8%
              </span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#D4A93A] dark:text-[#F2C94C] font-mono">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">Revenue</p>
          </div>

          <div className="kpi-card bg-[var(--card-bg)] rounded-2xl sm:rounded-[28px] p-4 sm:p-6 border border-[var(--border-color)] card-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F2C94C]/10 flex items-center justify-center">
                <Kanban className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A93A] dark:text-[#F2C94C]" />
              </div>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-[#B45309] dark:text-[#F2C94C]">
                <TrendingUp className="w-3 h-3" />
                +5
              </span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#D4A93A] dark:text-[#F2C94C] font-mono">{activeLeads}</p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">Active Leads</p>
          </div>

          <div className="kpi-card bg-[var(--card-bg)] rounded-2xl sm:rounded-[28px] p-4 sm:p-6 border border-[var(--border-color)] card-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#E57A7A]/10 flex items-center justify-center">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#DC2626] dark:text-[#E57A7A]" />
              </div>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-[#DC2626] dark:text-[#E57A7A]">
                <AlertCircle className="w-3 h-3" />
                3
              </span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#D4A93A] dark:text-[#F2C94C] font-mono">{formatCurrency(pendingInvoices)}</p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">Pending</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg text-[var(--text-main)]">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="h-[200px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F2C94C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F2C94C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `₵${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#F2C94C" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg text-[var(--text-main)]">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="h-[180px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leadSourceData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mt-2">
              {leadSourceData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg text-[var(--text-main)]">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-3">
            {state.invoices.slice(0, 3).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-[var(--border-color)] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                    invoice.status === 'Paid' ? 'bg-[#7DD3A6]/10' :
                    invoice.status === 'Overdue' ? 'bg-[#E57A7A]/10' :
                    'bg-[#F2C94C]/10'
                  }`}>
                    <FileText className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      invoice.status === 'Paid' ? 'text-[#059669] dark:text-[#7DD3A6]' :
                      invoice.status === 'Overdue' ? 'text-[#DC2626] dark:text-[#E57A7A]' :
                      'text-[#B45309] dark:text-[#F2C94C]'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-main)]">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-[var(--text-muted)]">{invoice.clientName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[var(--text-main)] font-mono">{formatCurrency(invoice.total)}</p>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Clients Section
const ClientsSection = ({ 
  state, 
  addClient, 
  updateClient, 
  deleteClient,
  addToast 
}: { 
  state: ReturnType<typeof useAppState>['state']; 
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ClientType | 'all'>('all');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredClients = state.clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || client.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newClient: Client = {
      id: generateId(),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      type: formData.get('type') as ClientType,
      status: formData.get('status') as ClientStatus,
      lastContact: 'Today',
      createdAt: new Date().toISOString().split('T')[0],
    };
    addClient(newClient);
    setIsAddDialogOpen(false);
    addToast('Client added successfully', 'success');
  };

  const handleUpdateClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;
    const formData = new FormData(e.currentTarget);
    const updatedClient: Client = {
      ...editingClient,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      type: formData.get('type') as ClientType,
      status: formData.get('status') as ClientStatus,
    };
    updateClient(updatedClient);
    setEditingClient(null);
    addToast('Client updated successfully', 'success');
  };

  const handleDeleteClient = (id: string) => {
    deleteClient(id);
    addToast('Client deleted successfully', 'success');
  };

  const getTypeIcon = (type: ClientType) => {
    switch (type) {
      case 'Enterprise': return <Building2 className="w-4 h-4" />;
      case 'School': return <GraduationCap className="w-4 h-4" />;
      case 'Healthcare': return <Heart className="w-4 h-4" />;
      case 'SME': return <Briefcase className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">Clients</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F2C94C] text-white hover:bg-[#D4A93A] font-medium w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Company Name</Label>
                <Input id="name" name="name" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" defaultValue="SME">
                    <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                      <SelectItem value="SME">SME</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                      <SelectItem value="School">School</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="Lead">
                    <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Prospect">Prospect</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]">
                Add Client
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)]"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as ClientType | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px] bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="SME">SME</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
            <SelectItem value="School">School</SelectItem>
            <SelectItem value="Healthcare">Healthcare</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="bg-[var(--card-bg)] border-[var(--border-color)]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-[var(--text-main)]">{client.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{client.email}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
                    {getTypeIcon(client.type)}
                    <span>{client.type}</span>
                  </div>
                </div>
                <ClientStatusBadge status={client.status} />
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
                <button 
                  onClick={() => setEditingClient(client)}
                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)]"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteClient(client.id)}
                  className="p-2 rounded-lg hover:bg-[#E57A7A]/10 text-[var(--text-muted)] hover:text-[#E57A7A]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block bg-[var(--card-bg)] border-[var(--border-color)] rounded-[28px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-muted)]">Client</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-muted)]">Type</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-muted)]">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-muted)]">Last Contact</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-[var(--text-main)]">{client.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{client.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      {getTypeIcon(client.type)}
                      <span className="text-sm">{client.type}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <ClientStatusBadge status={client.status} />
                  </td>
                  <td className="py-4 px-6 text-sm text-[var(--text-muted)]">{client.lastContact}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button 
                            onClick={() => setEditingClient(client)}
                            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </DialogTrigger>
                        {editingClient?.id === client.id && (
                          <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-xl">Edit Client</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleUpdateClient} className="space-y-4 mt-4">
                              <div>
                                <Label htmlFor="edit-name">Company Name</Label>
                                <Input 
                                  id="edit-name" 
                                  name="name" 
                                  defaultValue={editingClient.name}
                                  required 
                                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" 
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-email">Email</Label>
                                <Input 
                                  id="edit-email" 
                                  name="email" 
                                  type="email" 
                                  defaultValue={editingClient.email}
                                  required 
                                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" 
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-phone">Phone</Label>
                                <Input 
                                  id="edit-phone" 
                                  name="phone" 
                                  defaultValue={editingClient.phone}
                                  required 
                                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" 
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-type">Type</Label>
                                  <Select name="type" defaultValue={editingClient.type}>
                                    <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                                      <SelectItem value="SME">SME</SelectItem>
                                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                                      <SelectItem value="School">School</SelectItem>
                                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="edit-status">Status</Label>
                                  <Select name="status" defaultValue={editingClient.status}>
                                    <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                                      <SelectItem value="Lead">Lead</SelectItem>
                                      <SelectItem value="Prospect">Prospect</SelectItem>
                                      <SelectItem value="Active">Active</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <Button type="submit" className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]">
                                Update Client
                              </Button>
                            </form>
                          </DialogContent>
                        )}
                      </Dialog>
                      <button 
                        onClick={() => handleDeleteClient(client.id)}
                        className="p-2 rounded-lg hover:bg-[#E57A7A]/10 text-[var(--text-muted)] hover:text-[#E57A7A] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredClients.length === 0 && (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">No clients found</p>
          </div>
        )}
      </Card>
    </div>
  );
};

// Leads Pipeline Section
const LeadsSection = ({ 
  state, 
  addLead, 
  deleteLead, 
  moveLead,
  addToast 
}: { 
  state: ReturnType<typeof useAppState>['state']; 
  addLead: (lead: Lead) => void;
  deleteLead: (id: string) => void;
  moveLead: (id: string, stage: LeadStage) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  const stages: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

  const handleAddLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newLead: Lead = {
      id: generateId(),
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      email: formData.get('email') as string,
      value: Number(formData.get('value')),
      stage: 'New',
      temperature: formData.get('temperature') as LeadTemperature,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    addLead(newLead);
    setIsAddDialogOpen(false);
    addToast('Lead added successfully', 'success');
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    if (draggedLead) {
      moveLead(draggedLead, stage);
      setDraggedLead(null);
      addToast(`Lead moved to ${stage}`, 'success');
    }
  };

  const getStageColor = (stage: LeadStage) => {
    switch (stage) {
      case 'New': return 'border-gray-400 dark:border-[#A6A9B6]';
      case 'Contacted': return 'border-[#F2C94C]';
      case 'Qualified': return 'border-[#7DD3A6]';
      case 'Proposal Sent': return 'border-[#F2C94C]';
      case 'Won': return 'border-[#7DD3A6]';
      case 'Lost': return 'border-[#E57A7A]';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">Leads Pipeline</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F2C94C] text-white hover:bg-[#D4A93A] font-medium w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLead} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="lead-name">Contact Name</Label>
                <Input id="lead-name" name="name" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
              </div>
              <div>
                <Label htmlFor="lead-company">Company</Label>
                <Input id="lead-company" name="company" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
              </div>
              <div>
                <Label htmlFor="lead-email">Email</Label>
                <Input id="lead-email" name="email" type="email" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead-value">Value (₵)</Label>
                  <Input id="lead-value" name="value" type="number" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
                </div>
                <div>
                  <Label htmlFor="lead-temp">Temperature</Label>
                  <Select name="temperature" defaultValue="Warm">
                    <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                      <SelectItem value="Hot">Hot</SelectItem>
                      <SelectItem value="Warm">Warm</SelectItem>
                      <SelectItem value="Cold">Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]">
                Add Lead
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board - Horizontal scroll on mobile */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
        {stages.map((stage) => {
          const stageLeads = state.leads.filter(l => l.stage === stage);
          return (
            <div 
              key={stage}
              className={`min-w-[280px] sm:min-w-[300px] flex-1 max-w-[350px] bg-[var(--card-bg)] rounded-2xl border-t-4 ${getStageColor(stage)} p-3 sm:p-4`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-[var(--text-main)] text-sm sm:text-base">{stage}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--hover-bg)] text-[var(--text-muted)]">
                  {stageLeads.length}
                </span>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    className="bg-[var(--input-bg)] rounded-xl p-3 sm:p-4 border border-[var(--border-color)] cursor-move hover:border-[#F2C94C]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-[var(--text-main)] text-sm">{lead.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{lead.company}</p>
                      </div>
                      <LeadTemperatureBadge temp={lead.temperature} />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm font-mono text-[#D4A93A] dark:text-[#F2C94C]">{formatCurrency(lead.value)}</p>
                      <button 
                        onClick={() => {
                          deleteLead(lead.id);
                          addToast('Lead deleted', 'success');
                        }}
                        className="p-1.5 rounded-lg hover:bg-[#E57A7A]/10 text-[var(--text-muted)] hover:text-[#E57A7A] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="py-6 sm:py-8 text-center border-2 border-dashed border-[var(--border-color)] rounded-xl">
                    <p className="text-sm text-[var(--text-muted)]">Drop leads here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Invoices Section
const InvoicesSection = ({ 
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

  const handleMarkAsPaid = (invoice: Invoice) => {
    updateInvoice({ ...invoice, status: 'Paid', paidDate: new Date().toISOString().split('T')[0] });
    addToast('Invoice marked as paid', 'success');
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">Invoices</h2>
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
        />
      )}
    </div>
  );
};

// Receipts Section
const ReceiptsSection = ({ 
  state, 
  addReceipt,
  addToast 
}: { 
  state: ReturnType<typeof useAppState>['state']; 
  addReceipt: (receipt: Receipt) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);

  const paidInvoices = state.invoices.filter(inv => inv.status === 'Paid');

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
        />
      )}
    </div>
  );
};

// Team Section
const TeamSection = ({ 
  state, 
  addTeamMember, 
  deleteTeamMember, 
  addTask,
  addToast 
}: { 
  state: ReturnType<typeof useAppState>['state']; 
  addTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (id: string) => void;
  addTask: (memberId: string, task: Task) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [taskModalMember, setTaskModalMember] = useState<TeamMember | null>(null);

  const handleAddMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMember: TeamMember = {
      id: generateId(),
      name: formData.get('name') as string,
      role: formData.get('role') as TeamMember['role'],
      email: formData.get('email') as string,
      status: 'Active',
      tasks: [],
    };
    addTeamMember(newMember);
    setIsAddDialogOpen(false);
    addToast('Team member added', 'success');
  };

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!taskModalMember) return;
    const formData = new FormData(e.currentTarget);
    const newTask: Task = {
      id: generateId(),
      title: formData.get('title') as string,
      status: 'Pending',
      assignedAt: new Date().toISOString().split('T')[0],
    };
    addTask(taskModalMember.id, newTask);
    setTaskModalMember(null);
    addToast('Task assigned', 'success');
  };

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'Active': return 'bg-[#7DD3A6]';
      case 'Away': return 'bg-[#F2C94C]';
      case 'Offline': return 'bg-[#A6A9B6]';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">Team</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F2C94C] text-white hover:bg-[#D4A93A] font-medium w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Add Team Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMember} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="member-name">Name</Label>
                <Input id="member-name" name="name" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
              </div>
              <div>
                <Label htmlFor="member-email">Email</Label>
                <Input id="member-email" name="email" type="email" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
              </div>
              <div>
                <Label htmlFor="member-role">Role</Label>
                <Select name="role" defaultValue="Developer">
                  <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                    <SelectItem value="Designer">Designer</SelectItem>
                    <SelectItem value="Developer">Developer</SelectItem>
                    <SelectItem value="Intern">Intern</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]">
                Add Member
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {state.team.map((member) => (
          <Card key={member.id} className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center">
                    <span className="text-[#D4A93A] dark:text-[#F2C94C] font-bold text-sm sm:text-base">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-main)] text-sm sm:text-base truncate">{member.name}</p>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)]">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(member.status)}`} />
                  <button 
                    onClick={() => {
                      deleteTeamMember(member.id);
                      addToast('Team member removed', 'success');
                    }}
                    className="p-1.5 rounded-lg hover:bg-[#E57A7A]/10 text-[var(--text-muted)] hover:text-[#E57A7A] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">Tasks ({member.tasks.length})</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button 
                        onClick={() => setTaskModalMember(member)}
                        className="text-xs text-[#D4A93A] dark:text-[#F2C94C] hover:underline"
                      >
                        + Add Task
                      </button>
                    </DialogTrigger>
                    {taskModalMember?.id === member.id && (
                      <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-xl">Add Task to {member.name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddTask} className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="task-title">Task Title</Label>
                            <Input id="task-title" name="title" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
                          </div>
                          <Button type="submit" className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]">
                            Assign Task
                          </Button>
                        </form>
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
                <div className="space-y-2">
                  {member.tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center justify-between py-2 px-3 bg-[var(--input-bg)] rounded-lg">
                      <span className="text-sm text-[var(--text-main)] truncate flex-1">{task.title}</span>
                      <TaskStatusBadge status={task.status} />
                    </div>
                  ))}
                  {member.tasks.length === 0 && (
                    <p className="text-sm text-[var(--text-muted)] py-2">No tasks assigned</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Message Board Section
const MessageBoardSection = ({ 
  state, 
  addMessage, 
  pinMessage, 
  unpinMessage,
  addToast 
}: { 
  state: ReturnType<typeof useAppState>['state']; 
  addMessage: (message: Message) => void;
  pinMessage: (id: string) => void;
  unpinMessage: (id: string) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}) => {
  const [newMessage, setNewMessage] = useState('');

  const handlePostMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: generateId(),
      author: 'Spirit',
      authorRole: 'Operations',
      content: newMessage,
      timestamp: new Date().toISOString(),
      isPinned: false,
    };
    
    addMessage(message);
    setNewMessage('');
    addToast('Message posted', 'success');
  };

  const handleTogglePin = (message: Message) => {
    if (message.isPinned) {
      unpinMessage(message.id);
      addToast('Message unpinned', 'info');
    } else {
      pinMessage(message.id);
      addToast('Message pinned', 'success');
    }
  };

  const pinnedMessages = state.messages.filter(m => m.isPinned);
  const regularMessages = state.messages.filter(m => !m.isPinned);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-GH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">Intern Message Board</h2>

      {/* Compose */}
      <Card className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[#D4A93A] dark:text-[#F2C94C] font-bold text-xs sm:text-sm">S</span>
            </div>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Post an announcement to the team..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)] resize-none min-h-[80px] sm:min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handlePostMessage}
                  disabled={!newMessage.trim()}
                  className="bg-[#F2C94C] text-white hover:bg-[#D4A93A] disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#D4A93A] dark:text-[#F2C94C]">
            <Pin className="w-4 h-4" />
            <span className="text-sm font-medium">Pinned</span>
          </div>
          {pinnedMessages.map((message) => (
            <Card key={message.id} className="bg-[var(--card-bg)] border-[#F2C94C]/30 rounded-2xl sm:rounded-[28px] animate-pulse-glow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#D4A93A] dark:text-[#F2C94C] font-bold text-xs sm:text-sm">S</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-medium text-[var(--text-main)] text-sm sm:text-base">{message.author}</span>
                      <span className="text-xs text-[var(--text-muted)]">({message.authorRole})</span>
                      <span className="text-xs text-[var(--text-muted)]">• {formatTime(message.timestamp)}</span>
                    </div>
                    <p className="text-[var(--text-main)] text-sm sm:text-base">{message.content}</p>
                  </div>
                  <button 
                    onClick={() => handleTogglePin(message)}
                    className="p-2 rounded-lg hover:bg-[#F2C94C]/10 text-[#D4A93A] dark:text-[#F2C94C] transition-colors flex-shrink-0"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Regular Messages */}
      <div className="space-y-3">
        {regularMessages.map((message) => (
          <Card key={message.id} className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D4A93A] dark:text-[#F2C94C] font-bold text-xs sm:text-sm">S</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-medium text-[var(--text-main)] text-sm sm:text-base">{message.author}</span>
                    <span className="text-xs text-[var(--text-muted)]">({message.authorRole})</span>
                    <span className="text-xs text-[var(--text-muted)]">• {formatTime(message.timestamp)}</span>
                  </div>
                  <p className="text-[var(--text-main)] text-sm sm:text-base">{message.content}</p>
                </div>
                <button 
                  onClick={() => handleTogglePin(message)}
                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[#D4A93A] dark:hover:text-[#F2C94C] transition-colors flex-shrink-0"
                >
                  <Pin className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function authRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

const AuthPage = ({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        await authRequest('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ username, email, password }),
        });
        setMode('login');
        setPassword('');
        setMessage('Account created. Sign in to continue.');
      } else {
        const user = await authRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        onAuthenticated(user);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to complete the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="grain-overlay" />
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-[#D4A93A] dark:text-[#F2C94C] text-sm font-semibold tracking-[0.2em]">ZENTRIO CRM</p>
          <h1 className="text-3xl font-bold text-[var(--text-main)] mt-3">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-[var(--text-muted)] mt-2">
            {mode === 'login' ? 'Sign in to access your workspace.' : 'Register to start managing your workspace.'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="auth-username">Username</Label>
            <Input id="auth-username" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={4} maxLength={20} className="mt-2" />
          </div>
          {mode === 'register' && (
            <div>
              <Label htmlFor="auth-email">Email</Label>
              <Input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2" />
            </div>
          )}
          <div>
            <Label htmlFor="auth-password">Password</Label>
            <Input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={20} className="mt-2" />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-[#E57A7A]">{error}</p>}
        {message && <p className="mt-4 text-sm text-[#7DD3A6]">{message}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-[#F2C94C] text-[#1a1a2e] hover:bg-[#D4A93A]">
          {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage(''); }}
          className="w-full mt-4 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>
      </form>
    </main>
  );
};

const CrmApp = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { state, setView, addClient, updateClient, deleteClient, addLead, deleteLead, moveLead, addInvoice, updateInvoice, deleteInvoice, addReceipt, addTeamMember, deleteTeamMember, addTask, addMessage, pinMessage, unpinMessage } = useAppState();
  const { toasts, addToast, removeToast } = useToast();

  const renderContent = () => {
    switch (state.currentView) {
      case 'dashboard':
        return <DashboardSection state={state} />;
      case 'clients':
        return <ClientsSection state={state} addClient={addClient} updateClient={updateClient} deleteClient={deleteClient} addToast={addToast} />;
      case 'leads':
        return <LeadsSection state={state} addLead={addLead} deleteLead={deleteLead} moveLead={moveLead} addToast={addToast} />;
      case 'invoices':
        return <InvoicesSection state={state} addInvoice={addInvoice} updateInvoice={updateInvoice} deleteInvoice={deleteInvoice} addToast={addToast} />;
      case 'receipts':
        return <ReceiptsSection state={state} addReceipt={addReceipt} addToast={addToast} />;
      case 'team':
        return <TeamSection state={state} addTeamMember={addTeamMember} deleteTeamMember={deleteTeamMember} addTask={addTask} addToast={addToast} />;
      case 'board':
        return <MessageBoardSection state={state} addMessage={addMessage} pinMessage={pinMessage} unpinMessage={unpinMessage} addToast={addToast} />;
      default:
        return <DashboardSection state={state} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Grain Overlay */}
      <div className="grain-overlay" />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Sidebar */}
      <Sidebar 
        currentView={state.currentView} 
        setView={setView} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} />
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav currentView={state.currentView} setView={setView} />
    </div>
  );
};

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    authRequest('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsCheckingSession(false));
  }, []);

  const handleLogout = async () => {
    await authRequest('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
  };

  if (isCheckingSession) {
    return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)]">Checking session...</div>;
  }

  return user ? <CrmApp user={user} onLogout={handleLogout} /> : <AuthPage onAuthenticated={setUser} />;
}

export default App;
