import { useState } from 'react';
import {
  Building2,
  GraduationCap,
  Heart,
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Users,
  Eye,
  ChevronLeft,
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAppState } from '@/hooks/useAppState';
import type { Client, ClientType, ClientStatus } from '@/types';
import { formatCurrency, formatDateFull, generateId } from '@/lib/format';
import { ClientStatusBadge, InvoiceStatusBadge } from '@/components/statusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export const ClientsSection = ({
  state,
  addClient,
  updateClient,
  deleteClient,
  addToast,
  searchTerm,
  onSearchChange,
}: {
  state: ReturnType<typeof useAppState>['state'];
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}) => {
  const [filterType, setFilterType] = useState<ClientType | 'all'>('all');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredClients = state.clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' || client.type === filterType;

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

    if (viewingClient?.id === updatedClient.id) {
      setViewingClient(updatedClient);
    }

    addToast('Client updated successfully', 'success');
  };

  const handleDeleteClient = (id: string) => {
    deleteClient(id);

    setPendingDeleteId(null);

    if (viewingClient?.id === id) {
      setViewingClient(null);
    }

    addToast('Client deleted successfully', 'success');
  };

  const getTypeIcon = (type: ClientType) => {
    switch (type) {
      case 'Enterprise':
        return <Building2 className="w-4 h-4" />;
      case 'School':
        return <GraduationCap className="w-4 h-4" />;
      case 'Healthcare':
        return <Heart className="w-4 h-4" />;
      case 'SME':
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const clientInvoices = viewingClient
    ? state.invoices.filter(
        (invoice) =>
          invoice.clientId === viewingClient.id ||
          invoice.clientName === viewingClient.name
      )
    : [];

  const clientReceipts = viewingClient
    ? state.receipts.filter(
        (receipt) => receipt.clientName === viewingClient.name
      )
    : [];

  const totalInvoiced = clientInvoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0
  );

  const totalPaid = clientInvoices
    .filter((invoice) => invoice.status === 'Paid')
    .reduce((sum, invoice) => sum + invoice.total, 0);

  const outstanding = clientInvoices
    .filter((invoice) => invoice.status !== 'Paid')
    .reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">
          Clients
        </h2>

        <Dialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#F2C94C] text-white hover:bg-[#D4A93A] font-medium w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Add New Client
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={handleAddClient}
              className="space-y-4 mt-4"
            >
              <div>
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  required
                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>

                  <Select
                    name="type"
                    defaultValue="SME"
                  >
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

                  <Select
                    name="status"
                    defaultValue="Lead"
                  >
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

              <Button
                type="submit"
                className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]"
              >
                Add Client
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />

          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)]"
          />
        </div>

        <Select
          value={filterType}
          onValueChange={(v) =>
            setFilterType(v as ClientType | 'all')
          }
        >
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
          <Card
            key={client.id}
            className="bg-[var(--card-bg)] border-[var(--border-color)]"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <button
                  type="button"
                  onClick={() => setViewingClient(client)}
                  className="text-left"
                >
                  <p className="font-medium text-[var(--text-main)] hover:underline">
                    {client.name}
                  </p>

                  <p className="text-xs text-[var(--text-muted)]">
                    {client.email}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
                    {getTypeIcon(client.type)}
                    <span>{client.type}</span>
                  </div>
                </button>

                <ClientStatusBadge status={client.status} />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setViewingClient(client)}
                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  title="View client"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setEditingClient(client)}
                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  title="Edit client"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setPendingDeleteId(client.id)}
                  className="p-2 rounded-lg hover:bg-[#E57A7A]/10 text-[var(--text-muted)] hover:text-[#E57A7A] transition-colors"
                  title="Delete client"
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
                <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-muted)]">
                  Client
                </th>

                <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-muted)]">
                  Type
                </th>

                <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-muted)]">
                  Status
                </th>

                <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-muted)]">
                  Last Contact
                </th>

                <th className="text-right py-4 px-6 text-sm font-medium text-[var(--text-muted)]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <td className="py-4 px-6">
                    <button
                      type="button"
                      onClick={() => setViewingClient(client)}
                      className="text-left"
                    >
                      <p className="font-medium text-[var(--text-main)] hover:underline">
                        {client.name}
                      </p>

                      <p className="text-xs text-[var(--text-muted)]">
                        {client.email}
                      </p>
                    </button>
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

                  <td className="py-4 px-6 text-sm text-[var(--text-muted)]">
                    {client.lastContact}
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingClient(client)}
                        className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                        title="View client"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <Dialog
                        open={editingClient?.id === client.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingClient(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setEditingClient(client)}
                            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                            title="Edit client"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </DialogTrigger>

                        {editingClient?.id === client.id && (
                          <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-xl">
                                Edit Client
                              </DialogTitle>
                            </DialogHeader>

                            <form
                              onSubmit={handleUpdateClient}
                              className="space-y-4 mt-4"
                            >
                              <div>
                                <Label htmlFor="edit-name">
                                  Company Name
                                </Label>

                                <Input
                                  id="edit-name"
                                  name="name"
                                  defaultValue={editingClient.name}
                                  required
                                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                                />
                              </div>

                              <div>
                                <Label htmlFor="edit-email">
                                  Email
                                </Label>

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
                                <Label htmlFor="edit-phone">
                                  Phone
                                </Label>

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
                                  <Label htmlFor="edit-type">
                                    Type
                                  </Label>

                                  <Select
                                    name="type"
                                    defaultValue={editingClient.type}
                                  >
                                    <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                                      <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                                      <SelectItem value="SME">
                                        SME
                                      </SelectItem>
                                      <SelectItem value="Enterprise">
                                        Enterprise
                                      </SelectItem>
                                      <SelectItem value="School">
                                        School
                                      </SelectItem>
                                      <SelectItem value="Healthcare">
                                        Healthcare
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label htmlFor="edit-status">
                                    Status
                                  </Label>

                                  <Select
                                    name="status"
                                    defaultValue={editingClient.status}
                                  >
                                    <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                                      <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                                      <SelectItem value="Lead">
                                        Lead
                                      </SelectItem>
                                      <SelectItem value="Prospect">
                                        Prospect
                                      </SelectItem>
                                      <SelectItem value="Active">
                                        Active
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <Button
                                type="submit"
                                className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]"
                              >
                                Update Client
                              </Button>
                            </form>
                          </DialogContent>
                        )}
                      </Dialog>

                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(client.id)}
                        className="p-2 rounded-lg hover:bg-[#E57A7A]/10 text-[var(--text-muted)] hover:text-[#E57A7A] transition-colors"
                        title="Delete client"
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
            <p className="text-[var(--text-muted)]">
              No clients found
            </p>
          </div>
        )}
      </Card>

      {/* Mobile Edit Dialog */}
      <Dialog
        open={
          !!editingClient &&
          !filteredClients.some((client) => client.id === editingClient.id)
        }
        onOpenChange={(open) => {
          if (!open) {
            setEditingClient(null);
          }
        }}
      >
        {editingClient &&
          !filteredClients.some(
            (client) => client.id === editingClient.id
          ) && (
            <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Edit Client
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleUpdateClient}
                className="space-y-4 mt-4"
              >
                <div>
                  <Label htmlFor="mobile-edit-name">
                    Company Name
                  </Label>

                  <Input
                    id="mobile-edit-name"
                    name="name"
                    defaultValue={editingClient.name}
                    required
                    className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <Label htmlFor="mobile-edit-email">
                    Email
                  </Label>

                  <Input
                    id="mobile-edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingClient.email}
                    required
                    className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <Label htmlFor="mobile-edit-phone">
                    Phone
                  </Label>

                  <Input
                    id="mobile-edit-phone"
                    name="phone"
                    defaultValue={editingClient.phone}
                    required
                    className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mobile-edit-type">
                      Type
                    </Label>

                    <Select
                      name="type"
                      defaultValue={editingClient.type}
                    >
                      <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                        <SelectItem value="SME">SME</SelectItem>
                        <SelectItem value="Enterprise">
                          Enterprise
                        </SelectItem>
                        <SelectItem value="School">School</SelectItem>
                        <SelectItem value="Healthcare">
                          Healthcare
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mobile-edit-status">
                      Status
                    </Label>

                    <Select
                      name="status"
                      defaultValue={editingClient.status}
                    >
                      <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                        <SelectItem value="Lead">Lead</SelectItem>
                        <SelectItem value="Prospect">
                          Prospect
                        </SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]"
                >
                  Update Client
                </Button>
              </form>
            </DialogContent>
          )}
      </Dialog>

      {/* Client Profile View */}
      {viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#12151C] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Profile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[rgba(244,246,251,0.08)]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewingClient(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgba(244,246,251,0.04)]"
                  title="Back"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-[#A6A9B6]" />
                </button>

                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F4F6FB]">
                  Client Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setEditingClient(viewingClient)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F2C94C] text-white hover:bg-[#D4A93A] text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>

            {/* Scrollable Profile Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="bg-white dark:bg-[#12151C] rounded-xl">
                {/* Client Header */}
                <div className="text-center mb-8 pb-6 border-b-2 border-[#F2C94C]">
                  <div className="w-16 h-16 rounded-2xl bg-[#F2C94C]/10 flex items-center justify-center mx-auto mb-4">
                    {getTypeIcon(viewingClient.type)}
                  </div>

                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#F4F6FB]">
                    {viewingClient.name}
                  </div>

                  <div className="text-sm text-gray-500 dark:text-[#A6A9B6] mt-1">
                    {viewingClient.type} Client
                  </div>

                  <div className="mt-3 flex justify-center">
                    <ClientStatusBadge status={viewingClient.status} />
                  </div>
                </div>

                {/* Contact & Client Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
                  <div className="rounded-xl border border-gray-200 dark:border-[rgba(244,246,251,0.08)] p-5">
                    <div className="text-xs font-bold text-gray-500 dark:text-[#A6A9B6] uppercase mb-4">
                      Contact Information
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 mt-0.5 text-[#D4A93A] dark:text-[#F2C94C]" />

                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#A6A9B6]">
                            Email
                          </p>
                          <p className="font-medium text-gray-900 dark:text-[#F4F6FB] break-all">
                            {viewingClient.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 mt-0.5 text-[#D4A93A] dark:text-[#F2C94C]" />

                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#A6A9B6]">
                            Phone
                          </p>
                          <p className="font-medium text-gray-900 dark:text-[#F4F6FB]">
                            {viewingClient.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 dark:border-[rgba(244,246,251,0.08)] p-5">
                    <div className="text-xs font-bold text-gray-500 dark:text-[#A6A9B6] uppercase mb-4">
                      Client Information
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        {getTypeIcon(viewingClient.type)}

                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#A6A9B6]">
                            Client Type
                          </p>
                          <p className="font-medium text-gray-900 dark:text-[#F4F6FB]">
                            {viewingClient.type}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 mt-0.5 text-[#D4A93A] dark:text-[#F2C94C]" />

                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#A6A9B6]">
                            Client Since
                          </p>
                          <p className="font-medium text-gray-900 dark:text-[#F4F6FB]">
                            {formatDateFull(viewingClient.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 mt-0.5 text-[#D4A93A] dark:text-[#F2C94C]" />

                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#A6A9B6]">
                            Last Contact
                          </p>
                          <p className="font-medium text-gray-900 dark:text-[#F4F6FB]">
                            {viewingClient.lastContact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="mb-8">
                  <div className="text-xs font-bold text-gray-500 dark:text-[#A6A9B6] uppercase mb-3">
                    Financial Summary
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-gray-50 dark:bg-[rgba(244,246,251,0.04)] p-4">
                      <p className="text-xs text-gray-500 dark:text-[#A6A9B6]">
                        Total Invoiced
                      </p>

                      <p className="text-xl font-bold text-gray-900 dark:text-[#F4F6FB] mt-1">
                        {formatCurrency(totalInvoiced)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#7DD3A6]/10 p-4">
                      <p className="text-xs text-[#059669] dark:text-[#7DD3A6]">
                        Total Paid
                      </p>

                      <p className="text-xl font-bold text-[#059669] dark:text-[#7DD3A6] mt-1">
                        {formatCurrency(totalPaid)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F2C94C]/10 p-4">
                      <p className="text-xs text-[#B45309] dark:text-[#F2C94C]">
                        Outstanding
                      </p>

                      <p className="text-xl font-bold text-[#B45309] dark:text-[#F2C94C] mt-1">
                        {formatCurrency(outstanding)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invoices */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-gray-500 dark:text-[#A6A9B6] uppercase">
                      Invoices
                    </div>

                    <span className="text-xs text-gray-500 dark:text-[#A6A9B6]">
                      {clientInvoices.length} invoice
                      {clientInvoices.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {clientInvoices.length > 0 ? (
                    <div className="space-y-2">
                      {clientInvoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-[rgba(244,246,251,0.08)] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#F2C94C]/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-[#D4A93A] dark:text-[#F2C94C]" />
                            </div>

                            <div>
                              <p className="font-medium text-gray-900 dark:text-[#F4F6FB]">
                                {invoice.invoiceNumber}
                              </p>

                              <p className="text-xs text-gray-500 dark:text-[#A6A9B6]">
                                Issued {formatDateFull(invoice.issueDate)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <InvoiceStatusBadge status={invoice.status} />

                            <p className="font-bold text-gray-900 dark:text-[#F4F6FB]">
                              {formatCurrency(invoice.total)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-[rgba(244,246,251,0.08)] py-8 text-center">
                      <FileText className="w-8 h-8 text-gray-400 dark:text-[#A6A9B6] mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-[#A6A9B6]">
                        No invoices for this client yet
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment History */}
                <div className="mb-8">
                  <div className="text-xs font-bold text-gray-500 dark:text-[#A6A9B6] uppercase mb-3">
                    Payment History
                  </div>

                  {clientReceipts.length > 0 ? (
                    <div className="space-y-2">
                      {clientReceipts.map((receipt) => (
                        <div
                          key={receipt.id}
                          className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-[rgba(244,246,251,0.08)] p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#7DD3A6]/10 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-[#059669] dark:text-[#7DD3A6]" />
                            </div>

                            <div>
                              <p className="font-medium text-gray-900 dark:text-[#F4F6FB]">
                                {receipt.receiptNumber}
                              </p>

                              <p className="text-xs text-gray-500 dark:text-[#A6A9B6]">
                                {receipt.paymentMethod} •{' '}
                                {formatDateFull(receipt.paymentDate)}
                              </p>
                            </div>
                          </div>

                          <p className="font-bold text-[#059669] dark:text-[#7DD3A6]">
                            {formatCurrency(receipt.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-[rgba(244,246,251,0.08)] py-8 text-center">
                      <CheckCircle className="w-8 h-8 text-gray-400 dark:text-[#A6A9B6] mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-[#A6A9B6]">
                        No payments recorded for this client yet
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center mt-10 pt-6 border-t border-gray-200 dark:border-[rgba(244,246,251,0.08)] text-gray-500 dark:text-[#A6A9B6] text-sm">
                  <p>Zentrio Solutions</p>
                  <p className="mt-1">
                    Client profile and relationship information
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Edit Dialog */}
      {editingClient &&
        filteredClients.some(
          (client) => client.id === editingClient.id
        ) &&
        !viewingClient && (
          <Dialog
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                setEditingClient(null);
              }
            }}
          >
            <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Edit Client
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleUpdateClient}
                className="space-y-4 mt-4"
              >
                <div>
                  <Label htmlFor="edit-mobile-name">
                    Company Name
                  </Label>

                  <Input
                    id="edit-mobile-name"
                    name="name"
                    defaultValue={editingClient.name}
                    required
                    className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-mobile-email">
                    Email
                  </Label>

                  <Input
                    id="edit-mobile-email"
                    name="email"
                    type="email"
                    defaultValue={editingClient.email}
                    required
                    className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-mobile-phone">
                    Phone
                  </Label>

                  <Input
                    id="edit-mobile-phone"
                    name="phone"
                    defaultValue={editingClient.phone}
                    required
                    className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-mobile-type">
                      Type
                    </Label>

                    <Select
                      name="type"
                      defaultValue={editingClient.type}
                    >
                      <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                        <SelectItem value="SME">SME</SelectItem>
                        <SelectItem value="Enterprise">
                          Enterprise
                        </SelectItem>
                        <SelectItem value="School">School</SelectItem>
                        <SelectItem value="Healthcare">
                          Healthcare
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-mobile-status">
                      Status
                    </Label>

                    <Select
                      name="status"
                      defaultValue={editingClient.status}
                    >
                      <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                        <SelectItem value="Lead">Lead</SelectItem>
                        <SelectItem value="Prospect">
                          Prospect
                        </SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]"
                >
                  Update Client
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Delete this client?"
        description="The client will be removed from your workspace. Admins can restore it from the audit trail."
        confirmLabel="Delete client"
        onConfirm={() => pendingDeleteId && handleDeleteClient(pendingDeleteId)}
      />
    </div>
  );
};
