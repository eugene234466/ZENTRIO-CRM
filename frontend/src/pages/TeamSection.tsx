import { useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  ClipboardList,
  UserRound,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Card, CardContent } from '@/components/ui/card';

import { useAppState } from '@/hooks/useAppState';

import type {
  TeamMember,
  Task,
} from '@/types';

import { generateId } from '@/lib/format';
import { TaskStatusBadge } from '@/components/statusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export const TeamSection = ({
  state,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
  addTask,
  updateTask,
  deleteTask,
  addToast,
  isAdmin,
}: {
  state: ReturnType<typeof useAppState>['state'];
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (id: string) => void;
  addTask: (memberId: string, task: Task) => void;
  updateTask: (memberId: string, task: Task) => void;
  deleteTask: (memberId: string, taskId: string) => void;
  addToast: (
    message: string,
    type: 'success' | 'error' | 'info'
  ) => void;
  isAdmin: boolean;
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [editingMember, setEditingMember] =
    useState<TeamMember | null>(null);

  const [taskModalMember, setTaskModalMember] =
    useState<TeamMember | null>(null);

  const [viewingMember, setViewingMember] =
    useState<TeamMember | null>(null);

  const [editingTask, setEditingTask] =
    useState<{
      memberId: string;
      task: Task;
    } | null>(null);

  const [deleteMemberTarget, setDeleteMemberTarget] =
    useState<TeamMember | null>(null);

  const [deleteTaskTarget, setDeleteTaskTarget] =
    useState<{
      memberId: string;
      task: Task;
    } | null>(null);

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-[#7DD3A6]';
      case 'Away':
        return 'bg-[#F2C94C]';
      case 'Offline':
        return 'bg-[#A6A9B6]';
    }
  };

  const handleAddMember = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!isAdmin) return;

    const formData = new FormData(e.currentTarget);

    const newMember: TeamMember = {
      id: generateId(),
      name: String(formData.get('name') || ''),
      role: formData.get('role') as TeamMember['role'],
      email: String(formData.get('email') || ''),
      status: formData.get('status') as TeamMember['status'],
      tasks: [],
    };

    addTeamMember(newMember);
    setIsAddDialogOpen(false);

    addToast('Team member added', 'success');
  };

  const handleUpdateMember = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!editingMember || !isAdmin) return;

    const formData = new FormData(e.currentTarget);

    const updatedMember: TeamMember = {
      ...editingMember,
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      role: formData.get('role') as TeamMember['role'],
      status: formData.get('status') as TeamMember['status'],
    };

    updateTeamMember(updatedMember);

    setEditingMember(null);

    addToast('Team member updated', 'success');
  };

  const handleAddTask = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!taskModalMember) return;

    const formData = new FormData(e.currentTarget);

    const newTask: Task = {
      id: generateId(),
      title: String(formData.get('title') || ''),
      status: formData.get('status') as Task['status'],
      assignedAt: new Date().toISOString().split('T')[0],
    };

    addTask(taskModalMember.id, newTask);

    setTaskModalMember(null);

    addToast('Task assigned', 'success');
  };

  const handleUpdateTask = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!editingTask) return;

    const formData = new FormData(e.currentTarget);

    const updatedTask: Task = {
      ...editingTask.task,
      title: String(formData.get('title') || ''),
      status: formData.get('status') as Task['status'],
    };

    updateTask(editingTask.memberId, updatedTask);

    setEditingTask(null);

    addToast('Task updated', 'success');
  };

  const handleDeleteMember = () => {
    if (!deleteMemberTarget || !isAdmin) return;

    deleteTeamMember(deleteMemberTarget.id);

    if (viewingMember?.id === deleteMemberTarget.id) {
      setViewingMember(null);
    }

    setDeleteMemberTarget(null);

    addToast('Team member removed', 'success');
  };

  const handleDeleteTask = () => {
    if (!deleteTaskTarget) return;

    deleteTask(
      deleteTaskTarget.memberId,
      deleteTaskTarget.task.id
    );

    setDeleteTaskTarget(null);

    addToast('Task removed', 'success');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">
            Team &amp; Tasks
          </h2>

          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage your team members and their assigned tasks.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#F2C94C] text-white hover:bg-[#D4A93A] font-medium w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        {state.team.map((member) => (
          <Card
            key={member.id}
            className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]"
          >
            <CardContent className="p-4 sm:p-6">

              {/* Member Header */}
              <div className="flex items-start justify-between mb-5">

                <div className="flex items-center gap-3 min-w-0">

                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F2C94C]/20 flex items-center justify-center shrink-0">
                    <span className="text-[#D4A93A] dark:text-[#F2C94C] font-bold text-sm sm:text-base">
                      {member.name
                        .split(' ')
                        .filter(Boolean)
                        .map((name) => name[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-main)] text-sm sm:text-base truncate">
                      {member.name}
                    </p>

                    <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                      {member.role}
                    </p>
                  </div>

                </div>

                {/* Member Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-1">

                    <button
                      onClick={() => setEditingMember(member)}
                      className="p-1.5 rounded-lg hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                      title="Edit member"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteMemberTarget(member)}
                      className="p-1.5 rounded-lg hover:bg-[#E57A7A]/10 text-[var(--text-muted)] hover:text-[#E57A7A] transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${getStatusColor(
                    member.status
                  )}`}
                />

                <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                  {member.status}
                </span>
              </div>

              {/* Task Header */}
              <div className="flex items-center justify-between mb-2">

                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[var(--text-muted)]" />

                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                    Tasks ({member.tasks.length})
                  </p>
                </div>

                <button
                  onClick={() => setTaskModalMember(member)}
                  className="text-xs text-[#D4A93A] dark:text-[#F2C94C] hover:underline"
                >
                  + Add Task
                </button>

              </div>

              {/* Tasks Preview */}
              <div className="space-y-2">

                {member.tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 py-2 px-3 bg-[var(--input-bg)] rounded-lg"
                  >
                    <span className="text-sm text-[var(--text-main)] truncate flex-1">
                      {task.title}
                    </span>

                    <TaskStatusBadge status={task.status} />

                    <button
                      onClick={() =>
                        setEditingTask({
                          memberId: member.id,
                          task,
                        })
                      }
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      title="Edit task"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {member.tasks.length === 0 && (
                  <p className="text-sm text-[var(--text-muted)] py-3 text-center">
                    No tasks assigned
                  </p>
                )}

              </div>

              {/* View Tasks */}
              {member.tasks.length > 3 && (
                <button
                  onClick={() => setViewingMember(member)}
                  className="w-full text-center text-xs text-[#D4A93A] dark:text-[#F2C94C] hover:underline mt-3"
                >
                  View all {member.tasks.length} tasks
                </button>
              )}

              {member.tasks.length > 0 &&
                member.tasks.length <= 3 && (
                  <button
                    onClick={() => setViewingMember(member)}
                    className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] mt-3"
                  >
                    View tasks
                  </button>
                )}

            </CardContent>
          </Card>
        ))}

      </div>

      {/* Empty Team */}
      {state.team.length === 0 && (
        <div className="border border-dashed border-[var(--border-color)] rounded-2xl p-10 text-center">
          <UserRound className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" />

          <p className="font-medium text-[var(--text-main)]">
            No team members yet
          </p>

          <p className="text-sm text-[var(--text-muted)] mt-1">
            {isAdmin
              ? 'Add your first team member to get started.'
              : 'An admin can add team members here.'}
          </p>
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      >
        <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md max-h-[90vh] overflow-y-auto">

          <DialogHeader>
            <DialogTitle className="text-xl">
              Add Team Member
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleAddMember}
            className="space-y-4 mt-4"
          >

            <div>
              <Label htmlFor="member-name">
                Name
              </Label>

              <Input
                id="member-name"
                name="name"
                required
                className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
              />
            </div>

            <div>
              <Label htmlFor="member-email">
                Email
              </Label>

              <Input
                id="member-email"
                name="email"
                type="email"
                required
                className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
              />
            </div>

            <div>
              <Label>
                Role
              </Label>

              <Select
                name="role"
                defaultValue="Developer"
              >
                <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">

                  <SelectItem value="Designer">
                    Designer
                  </SelectItem>

                  <SelectItem value="Developer">
                    Developer
                  </SelectItem>

                  <SelectItem value="Intern">
                    Intern
                  </SelectItem>

                  <SelectItem value="Manager">
                    Manager
                  </SelectItem>

                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Status
              </Label>

              <Select
                name="status"
                defaultValue="Active"
              >
                <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">

                  <SelectItem value="Active">
                    Active
                  </SelectItem>

                  <SelectItem value="Away">
                    Away
                  </SelectItem>

                  <SelectItem value="Offline">
                    Offline
                  </SelectItem>

                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]"
            >
              Add Member
            </Button>

          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog
        open={!!editingMember}
        onOpenChange={(open) => {
          if (!open) setEditingMember(null);
        }}
      >
        <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md">

          <DialogHeader>
            <DialogTitle className="text-xl">
              Edit Team Member
            </DialogTitle>
          </DialogHeader>

          {editingMember && (
            <form
              onSubmit={handleUpdateMember}
              className="space-y-4 mt-4"
            >

              <div>
                <Label htmlFor="edit-member-name">
                  Name
                </Label>

                <Input
                  id="edit-member-name"
                  name="name"
                  defaultValue={editingMember.name}
                  required
                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                />
              </div>

              <div>
                <Label htmlFor="edit-member-email">
                  Email
                </Label>

                <Input
                  id="edit-member-email"
                  name="email"
                  type="email"
                  defaultValue={editingMember.email}
                  required
                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                />
              </div>

              <div>
                <Label>
                  Role
                </Label>

                <Select
                  name="role"
                  defaultValue={editingMember.role}
                >
                  <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">

                    <SelectItem value="Designer">
                      Designer
                    </SelectItem>

                    <SelectItem value="Developer">
                      Developer
                    </SelectItem>

                    <SelectItem value="Intern">
                      Intern
                    </SelectItem>

                    <SelectItem value="Manager">
                      Manager
                    </SelectItem>

                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Status
                </Label>

                <Select
                  name="status"
                  defaultValue={editingMember.status}
                >
                  <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">

                    <SelectItem value="Active">
                      Active
                    </SelectItem>

                    <SelectItem value="Away">
                      Away
                    </SelectItem>

                    <SelectItem value="Offline">
                      Offline
                    </SelectItem>

                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]"
              >
                Save Changes
              </Button>

            </form>
          )}

        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog
        open={!!taskModalMember}
        onOpenChange={(open) => {
          if (!open) setTaskModalMember(null);
        }}
      >
        <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md">

          <DialogHeader>
            <DialogTitle className="text-xl">
              Add Task
            </DialogTitle>
          </DialogHeader>

          {taskModalMember && (
            <form
              onSubmit={handleAddTask}
              className="space-y-4 mt-4"
            >

              <div className="text-sm text-[var(--text-muted)]">
                Assigning task to{' '}
                <span className="font-medium text-[var(--text-main)]">
                  {taskModalMember.name}
                </span>
              </div>

              <div>
                <Label htmlFor="task-title">
                  Task Title
                </Label>

                <Input
                  id="task-title"
                  name="title"
                  required
                  placeholder="e.g. Follow up with client"
                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                />
              </div>

              <div>
                <Label>
                  Status
                </Label>

                <Select
                  name="status"
                  defaultValue="Pending"
                >
                  <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">

                    <SelectItem value="Pending">
                      Pending
                    </SelectItem>

                    <SelectItem value="In Progress">
                      In Progress
                    </SelectItem>

                    <SelectItem value="Completed">
                      Completed
                    </SelectItem>

                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]"
              >
                Assign Task
              </Button>

            </form>
          )}

        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog
        open={!!editingTask}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
      >
        <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-md">

          <DialogHeader>
            <DialogTitle className="text-xl">
              Edit Task
            </DialogTitle>
          </DialogHeader>

          {editingTask && (
            <form
              onSubmit={handleUpdateTask}
              className="space-y-4 mt-4"
            >

              <div>
                <Label htmlFor="edit-task-title">
                  Task Title
                </Label>

                <Input
                  id="edit-task-title"
                  name="title"
                  defaultValue={editingTask.task.title}
                  required
                  className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]"
                />
              </div>

              <div>
                <Label>
                  Status
                </Label>

                <Select
                  name="status"
                  defaultValue={editingTask.task.status}
                >
                  <SelectTrigger className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="bg-[var(--card-bg)] border-[var(--border-color)]">

                    <SelectItem value="Pending">
                      Pending
                    </SelectItem>

                    <SelectItem value="In Progress">
                      In Progress
                    </SelectItem>

                    <SelectItem value="Completed">
                      Completed
                    </SelectItem>

                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#F2C94C] text-white hover:bg-[#D4A93A]"
              >
                Save Changes
              </Button>

            </form>
          )}

        </DialogContent>
      </Dialog>

      {/* View All Tasks Dialog */}
      <Dialog
        open={!!viewingMember}
        onOpenChange={(open) => {
          if (!open) setViewingMember(null);
        }}
      >
        <DialogContent className="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] max-w-lg max-h-[90vh] overflow-y-auto">

          <DialogHeader>
            <DialogTitle className="text-xl">
              {viewingMember?.name}'s Tasks
            </DialogTitle>
          </DialogHeader>

          {viewingMember && (
            <div className="space-y-3 mt-3">

              {viewingMember.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-[var(--input-bg)] rounded-xl"
                >

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-main)] truncate">
                      {task.title}
                    </p>

                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Assigned {task.assignedAt}
                    </p>
                  </div>

                  <TaskStatusBadge status={task.status} />

                  <button
                    onClick={() =>
                      setEditingTask({
                        memberId: viewingMember.id,
                        task,
                      })
                    }
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    title="Edit task"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      setDeleteTaskTarget({
                        memberId: viewingMember.id,
                        task,
                      })
                    }
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#E57A7A]"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              ))}

              {viewingMember.tasks.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-6">
                  No tasks assigned to this member.
                </p>
              )}

            </div>
          )}

        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation */}
      <ConfirmDialog
        open={deleteMemberTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteMemberTarget(null);
        }}
        title="Remove this team member?"
        description={
          deleteMemberTarget
            ? `${deleteMemberTarget.name} will be removed from the team list along with their tasks.`
            : 'They will be removed from the team list along with their tasks.'
        }
        confirmLabel="Remove member"
        onConfirm={handleDeleteMember}
      />

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        open={deleteTaskTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTaskTarget(null);
        }}
        title="Remove this task?"
        description={
          deleteTaskTarget
            ? `"${deleteTaskTarget.task.title}" will be removed from this member's task list.`
            : 'This task will be removed.'
        }
        confirmLabel="Remove task"
        onConfirm={handleDeleteTask}
      />

    </div>
  );
};
