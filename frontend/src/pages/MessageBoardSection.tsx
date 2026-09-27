import { useEffect, useState } from 'react';
import { ArrowLeft, Edit2, Pin, Plus, Send, Trash2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api, type AuthUser, type BoardMessage, type MessageBoard } from '@/lib/api';
import { getInitials, formatRole } from '@/lib/format';

export const MessageBoardSection = ({
  addToast,
  currentUser,
}: {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  currentUser: AuthUser;
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [boards, setBoards] = useState<MessageBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const canPin = ['owner', 'admin', 'manager'].includes(currentUser.role.toLowerCase());
  const canDelete = (message: BoardMessage) =>
    message.author.id === currentUser.id || canPin;

  const replaceMessage = (updated: BoardMessage) => {
    setMessages((current) => current.map((message) => message.id === updated.id ? updated : message));
  };

  useEffect(() => {
    let active = true;

    Promise.all([api.boards(), api.boardUsers()])
      .then(([{ boards: loadedBoards }, { users: loadedUsers }]) => {
        if (!active) return;
        setBoards(loadedBoards);
        setUsers(loadedUsers);
        setSelectedBoardId(null);
      })
      .catch((error: unknown) => {
        if (active) addToast(error instanceof Error ? error.message : 'Unable to load messages.', 'error');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [addToast]);

  useEffect(() => {
    if (selectedBoardId === null) { setMessages([]); return; }
    setIsLoading(true);
    api.messages(selectedBoardId)
      .then(({ messages: loadedMessages }) => setMessages(loadedMessages))
      .catch((error: unknown) => addToast(error instanceof Error ? error.message : 'Unable to load messages.', 'error'))
      .finally(() => setIsLoading(false));
  }, [selectedBoardId, addToast]);

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;
    setIsPosting(true);
    try {
      if (selectedBoardId === null) return;
      const message = await api.createMessage(selectedBoardId, newMessage.trim());
      setMessages((current) => [message, ...current]);
      setNewMessage('');
      addToast('Message posted.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to post message.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleTogglePin = async (message: BoardMessage) => {
    try {
      if (selectedBoardId === null) return;
      const updated = await api.setMessagePinned(selectedBoardId, message.id, !message.is_pinned);
      replaceMessage(updated);
      addToast(updated.is_pinned ? 'Message pinned.' : 'Message unpinned.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to update message.', 'error');
    }
  };

  const handleSaveEdit = async (message: BoardMessage) => {
    if (!editingContent.trim()) return;
    try {
      if (selectedBoardId === null) return;
      const updated = await api.updateMessage(selectedBoardId, message.id, editingContent.trim());
      replaceMessage(updated);
      setEditingId(null);
      addToast('Message updated.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to update message.', 'error');
    }
  };

  const handleDelete = async (message: BoardMessage) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      if (selectedBoardId === null) return;
      await api.deleteMessage(selectedBoardId, message.id);
      setMessages((current) => current.filter((item) => item.id !== message.id));
      addToast('Message deleted.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to delete message.', 'error');
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const board = await api.createBoard({ name: newBoardName.trim(), description: newBoardDescription.trim(), member_ids: selectedMemberIds });
      setBoards((current) => [board, ...current]);
      setSelectedBoardId(board.id);
      setNewBoardName(''); setNewBoardDescription(''); setSelectedMemberIds([]); setShowBoardForm(false);
      addToast('Board created.', 'success');
    } catch (error) { addToast(error instanceof Error ? error.message : 'Unable to create board.', 'error'); }
  };

  const pinnedMessages = messages.filter((message) => message.is_pinned);
  const regularMessages = messages.filter((message) => !message.is_pinned);
  const selectedBoard = boards.find((board) => board.id === selectedBoardId);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-GH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MessageCard = ({ message }: { message: BoardMessage }) => {
    const isOwner = message.author.id === currentUser.id;
    const isEditing = editingId === message.id;

    return (
      <Card className={`max-w-3xl ${isOwner ? 'ml-auto' : 'mr-auto'} bg-[var(--card-bg)] ${message.is_pinned ? 'border-[#F2C94C]/30 animate-pulse-glow' : 'border-[var(--border-color)]'} rounded-2xl sm:rounded-[28px]`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[#D4A93A] dark:text-[#F2C94C] font-bold text-xs sm:text-sm">{getInitials(message.author.username)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-medium text-[var(--text-main)] text-sm sm:text-base">{message.author.username}</span>
                <span className="text-xs text-[var(--text-muted)]">({formatRole(message.author.role)})</span>
                <span className="text-xs text-[var(--text-muted)]">• {formatTime(message.created_at ?? '')}</span>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea value={editingContent} onChange={(event) => setEditingContent(event.target.value)} className="bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-main)]" />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => handleSaveEdit(message)} disabled={!editingContent.trim()}>Save</Button>
                  </div>
                </div>
              ) : <p className="text-[var(--text-main)] text-sm sm:text-base whitespace-pre-wrap">{message.content}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {isOwner && !isEditing && <button aria-label="Edit message" onClick={() => { setEditingId(message.id); setEditingContent(message.content); }} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)]"><Edit2 className="w-4 h-4" /></button>}
              {canDelete(message) && <button aria-label="Delete message" onClick={() => handleDelete(message)} className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
              {canPin && <button aria-label={message.is_pinned ? 'Unpin message' : 'Pin message'} onClick={() => handleTogglePin(message)} className="p-2 rounded-lg hover:bg-[#F2C94C]/10 text-[#D4A93A] dark:text-[#F2C94C]"><Pin className="w-4 h-4" /></button>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {selectedBoard && <Button variant="ghost" size="icon" onClick={() => setSelectedBoardId(null)} aria-label="Back to boards"><ArrowLeft className="w-5 h-5" /></Button>}
          <h2 className="truncate text-xl sm:text-2xl font-bold text-[var(--text-main)]">{selectedBoard?.name ?? 'Message Boards'}</h2>
        </div>
        {!selectedBoard && <Button onClick={() => setShowBoardForm(true)} className="shrink-0 bg-[#F2C94C] text-white hover:bg-[#D4A93A]"><Plus className="w-4 h-4 mr-1" />Create board</Button>}
      </div>

      {!selectedBoard && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => (
          <button key={board.id} type="button" onClick={() => setSelectedBoardId(board.id)} className="text-left">
            <Card className={`h-full rounded-2xl transition-colors ${selectedBoardId === board.id ? 'border-[#F2C94C] ring-1 ring-[#F2C94C]/40' : 'border-[var(--border-color)] hover:border-[#F2C94C]/60'} bg-[var(--card-bg)]`}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-[var(--text-main)]">{board.name}</h3>
                <p className="mt-1 min-h-10 text-sm text-[var(--text-muted)]">{board.description || 'No description provided.'}</p>
                <p className="mt-3 text-xs text-[var(--text-muted)]">Owner: {board.created_by.username} ({formatRole(board.created_by.role)})</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>}

      <Dialog open={showBoardForm} onOpenChange={setShowBoardForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)]">
          <DialogHeader>
            <DialogTitle>Create message board</DialogTitle>
            <DialogDescription>Choose a name, describe its purpose, and add login-capable members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label htmlFor="board-name" className="text-sm font-medium">Name</label><Input id="board-name" value={newBoardName} onChange={(event) => setNewBoardName(event.target.value)} placeholder="e.g. Product launch" maxLength={120} /></div>
            <div className="space-y-2"><label htmlFor="board-description" className="text-sm font-medium">Description</label><Textarea id="board-description" value={newBoardDescription} onChange={(event) => setNewBoardDescription(event.target.value)} placeholder="What is this board for?" maxLength={500} /></div>
            <div><p className="text-sm font-medium flex gap-1 items-center"><Users className="w-4 h-4" /> Members</p><p className="text-xs text-[var(--text-muted)] mt-1">You are automatically included.</p><div className="mt-2 max-h-48 overflow-y-auto space-y-2">{users.filter((user) => user.id !== currentUser.id).map((user) => <label key={user.id} className="flex gap-2 text-sm text-[var(--text-main)]"><input type="checkbox" checked={selectedMemberIds.includes(user.id)} onChange={() => setSelectedMemberIds((ids) => ids.includes(user.id) ? ids.filter((id) => id !== user.id) : [...ids, user.id])} />{user.username} ({formatRole(user.role)})</label>)}</div></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setShowBoardForm(false)}>Cancel</Button><Button onClick={handleCreateBoard} disabled={!newBoardName.trim()} className="bg-[#F2C94C] text-white hover:bg-[#D4A93A]">Create board</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose */}
      {selectedBoard && <Card className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[#D4A93A] dark:text-[#F2C94C] font-bold text-xs sm:text-sm">{getInitials(currentUser.username)}</span>
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
                  disabled={!newMessage.trim() || isPosting}
                  className="bg-[#F2C94C] text-white hover:bg-[#D4A93A] disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isPosting ? 'Posting…' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>}

      {/* Pinned Messages */}
      {selectedBoard && pinnedMessages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#D4A93A] dark:text-[#F2C94C]">
            <Pin className="w-4 h-4" />
            <span className="text-sm font-medium">Pinned</span>
          </div>
          {pinnedMessages.map((message) => <MessageCard key={message.id} message={message} />)}
        </div>
      )}

      {/* Regular Messages */}
      <div className="space-y-3">
        {isLoading ? <p className="text-sm text-[var(--text-muted)]">Loading messages…</p> : regularMessages.map((message) => <MessageCard key={message.id} message={message} />)}
        {!isLoading && messages.length === 0 && <p className="text-sm text-[var(--text-muted)]">No messages yet.</p>}
      </div>
    </div>
  );
};
