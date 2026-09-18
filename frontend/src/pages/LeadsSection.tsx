import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppState } from '@/hooks/useAppState';
import type { Lead, LeadStage, LeadTemperature, LeadSource, Client } from '@/types';
import { formatCurrency, generateId } from '@/lib/format';
import { LeadTemperatureBadge } from '@/components/statusBadge';

const stages: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
const sources: LeadSource[] = ['Referral', 'Social', 'Direct', 'Other'];

export const LeadsSection = ({
  state,
  addLead,
  updateLead,
  deleteLead,
  moveLead,
  addClient,
  addToast
}: {
  state: ReturnType<typeof useAppState>['state'];
  addLead: (lead: Lead) => void;
  updateLead: (lead: Lead) => void;
  deleteLead: (id: string) => void;
  moveLead: (id: string, stage: LeadStage) => void;
  addClient: (client: Client) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [wonLeadPendingConversion, setWonLeadPendingConversion] = useState<Lead | null>(null);

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
      source: formData.get('source') as LeadSource,
      expectedCloseDate: (formData.get('expectedCloseDate') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    addLead(newLead);
    setIsAddDialogOpen(false);
    addToast('Lead added successfully', 'success');
  };

  const handleEditLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLead) return;
    const formData = new FormData(e.currentTarget);
    const updated: Lead = {
      ...editingLead,
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      email: formData.get('email') as string,
      value: Number(formData.get('value')),
      temperature: formData.get('temperature') as LeadTemperature,
      source: formData.get('source') as LeadSource,
      expectedCloseDate: (formData.get('expectedCloseDate') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    updateLead(updated);
    setEditingLead(null);
    addToast('Lead updated', 'success');
  };

  // Single place both drag-and-drop and the "Move to stage" menu funnel through,
  // so the Won-conversion offer only has to live in one spot.
  const handleMoveLead = (lead: Lead, newStage: LeadStage) => {
    if (newStage === lead.stage) return;
    moveLead(lead.id, newStage);
    addToast(`Lead moved to ${newStage}`, 'success');
    if (newStage === 'Won') {
      setWonLeadPendingConversion({ ...lead, stage: newStage });
    }
  };

  const handleConvertToClient = () => {
    if (!wonLeadPendingConversion) return;
    const lead = wonLeadPendingConversion;
    const newClient: Client = {
      id: generateId(),
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: '',
      type: 'SME',
      status: 'Active',
      lastContact: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };
    addClient(newClient);
    addToast(`${lead.name} added as a client`, 'success');
    setWonLeadPendingConversion(null);
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
      const lead = state.leads.find((l) => l.id === draggedLead);
      if (lead) handleMoveLead(lead, stage);
      setDraggedLead(null);
    }
  };

  const leadFormFields = (defaults?: Lead) => (
    <>
      <div>
        <Label htmlFor="lead-name">Contact Name</Label>
        <Input id="lead-name" name="name" required defaultValue={defaults?.name} className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
      </div>
      <div>
        <Label htmlFor="lead-company">Company</Label>
        <Input id="lead-company" name="company" required defaultValue={defaults?.company} className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
      </div>
      <div>
        <Label htmlFor="lead-email">Email</Label>
        <Input id="lead-email" name="email" type="email" required defaultValue={defaults?.email} className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lead-value">Value (₵)</Label>
          <Input id="lead-value" name="value" type="number" required defaultValue={defaults?.value} className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
        </div>
        <div>
          <Label htmlFor="lead-temp">Temperature</Label>
          <Select name="temperature" defaultValue={defaults?.temperature ?? 'Warm'}>
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lead-source">Source</Label>
          <Select name="source" defaultValue={defaults?.source ?? 'Direct'}>
            <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
              {sources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="lead-close-date">Expected Close</Label>
          <Input id="lead-close-date" name="expectedCloseDate" type="date" defaultValue={defaults?.expectedCloseDate} className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
        </div>
      </div>
      <div>
        <Label htmlFor="lead-notes">Notes</Label>
        <Textarea id="lead-notes" name="notes" rows={3} defaultValue={defaults?.notes} className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
      </div>
    </>
  );

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
              {leadFormFields()}
              <Button type="submit" className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]">
                Add Lead
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
        <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <form onSubmit={handleEditLead} className="space-y-4 mt-4">
              {leadFormFields(editingLead)}
              <Button type="submit" className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]">
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Won-lead conversion offer */}
      <AlertDialog open={!!wonLeadPendingConversion} onOpenChange={(open) => !open && setWonLeadPendingConversion(null)}>
        <AlertDialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Create a client from this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              {wonLeadPendingConversion && (
                <>Copy <strong>{wonLeadPendingConversion.name}</strong> from {wonLeadPendingConversion.company} into your Clients list, using their name, company and email.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWonLeadPendingConversion(null)}>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertToClient} className="bg-[#F2C94C] text-white hover:bg-[#D4A93A]">
              Create client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pipeline stages — stacked single column */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {stages.map((stage) => {
          const stageLeads = state.leads.filter(l => l.stage === stage);
          const stageValue = stageLeads.reduce((sum, l) => sum + l.value, 0);
          return (
            <div
              key={stage}
              className="w-full bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-3 sm:p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-[var(--text-main)] text-sm sm:text-base">{stage}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--hover-bg)] text-[var(--text-muted)]">
                  {stageLeads.length}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3 font-mono">{formatCurrency(stageValue)}</p>
              <div className="space-y-2 sm:space-y-3">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    className="bg-[var(--input-bg)] rounded-xl p-3 sm:p-4 border border-[var(--border-color)] cursor-move hover:border-[#F2C94C]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => setEditingLead(lead)}
                        className="text-left flex-1"
                      >
                        <p className="font-medium text-[var(--text-main)] text-sm">{lead.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{lead.company}</p>
                      </button>
                      <LeadTemperatureBadge temp={lead.temperature} />
                    </div>

                    <Select value={lead.stage} onValueChange={(v) => handleMoveLead(lead, v as LeadStage)}>
                      <SelectTrigger className="h-8 text-xs bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">
                        {stages.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm font-mono text-[#D4A93A] dark:text-[#F2C94C]">{formatCurrency(lead.value)}</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="p-1.5 rounded-lg hover:bg-[#F2C94C]/10 text-[var(--text-muted)] hover:text-[#F2C94C] transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
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
