import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Users, TrendingUp, DollarSign, Kanban, FileText, AlertCircle } from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/hooks/useAppState';
import { formatCurrency } from '@/lib/format';
import { InvoiceStatusBadge } from '@/components/statusBadge';

export const DashboardSection = ({ state }: { state: ReturnType<typeof useAppState>['state'] }) => {
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