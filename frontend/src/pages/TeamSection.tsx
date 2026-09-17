// Team Section
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAppState } from '@/hooks/useAppState';
import type { TeamMember, Task } from '@/types';
import { generateId } from '@/lib/format';
import { TaskStatusBadge } from '@/components/statusBadge';

export const TeamSection = ({ 
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