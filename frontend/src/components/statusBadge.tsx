import { Circle, Clock3, CheckCircle2, CheckCircle, AlertCircle, Bell, X } from 'lucide-react';
import type { ClientStatus, InvoiceStatus, LeadTemperature, TaskStatus } from '@/types';
import { useToast } from '@/hooks/useToast';

export const ClientStatusBadge = ({ status }: { status: ClientStatus }) => {
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

export const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => {
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

export const LeadTemperatureBadge = ({ temp }: { temp: LeadTemperature }) => {
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

export const TaskStatusBadge = ({ status }: { status: TaskStatus }) => {
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

// Toast Component
export const ToastContainer = ({ toasts, removeToast }: { toasts: ReturnType<typeof useToast>['toasts']; removeToast: (id: string) => void }) => {
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