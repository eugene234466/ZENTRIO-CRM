import { useState } from 'react';
import { Building2, GraduationCap, Heart, Briefcase, Plus, Edit, Trash2, Search, Filter, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAppState } from '@/hooks/useAppState';
import type { Client, ClientType, ClientStatus } from '@/types';
import { generateId } from '@/lib/format';
import { ClientStatusBadge } from '@/components/statusBadge';

export  const ClientsSection = ({ 
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
            <form onSubmit={handleAddClient} className="space-y-5 mt-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input id="name" name="name" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" required className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                            <form onSubmit={handleUpdateClient} className="space-y-5 mt-6">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Company Name</Label>
                                <Input 
                                  id="edit-name" 
                                  name="name" 
                                  defaultValue={editingClient.name}
                                  required 
                                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" 
                                />
                              </div>
                              <div className="space-y-2">
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
                              <div className="space-y-2">
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
                                <div className="space-y-2">
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
                                <div className="space-y-2">
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