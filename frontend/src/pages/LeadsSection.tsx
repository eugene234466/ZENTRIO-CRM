import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppState } from '@/hooks/useAppState';
import type { Lead, LeadStage, LeadTemperature } from '@/types';
import { formatCurrency, generateId } from '@/lib/format';
import { LeadTemperatureBadge } from '@/components/statusBadge';

export const LeadsSection = ({ 
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