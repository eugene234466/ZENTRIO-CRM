import { useEffect, useState } from 'react';
import { Edit2, Pin, Send, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api, type AuthUser, type BoardMessage } from '@/lib/api';
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

    api.messages()
      .then(({ messages: loadedMessages }) => {
        if (active) setMessages(loadedMessages);
      })
      .catch((error: unknown) => {
        if (active) addToast(error instanceof Error ? error.message : 'Unable to load messages.', 'error');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [addToast]);

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;
    setIsPosting(true);
    try {
      const message = await api.createMessage(newMessage.trim());
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
      const updated = await api.setMessagePinned(message.id, !message.is_pinned);
      replaceMessage(updated);
      addToast(updated.is_pinned ? 'Message pinned.' : 'Message unpinned.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to update message.', 'error');
    }
  };

  const handleSaveEdit = async (message: BoardMessage) => {
    if (!editingContent.trim()) return;
    try {
      const updated = await api.updateMessage(message.id, editingContent.trim());
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
      await api.deleteMessage(message.id);
      setMessages((current) => current.filter((item) => item.id !== message.id));
      addToast('Message deleted.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to delete message.', 'error');
    }
  };

  const pinnedMessages = messages.filter((message) => message.is_pinned);
  const regularMessages = messages.filter((message) => !message.is_pinned);

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
      <Card className={`bg-[var(--card-bg)] ${message.is_pinned ? 'border-[#F2C94C]/30 animate-pulse-glow' : 'border-[var(--border-color)]'} rounded-2xl sm:rounded-[28px]`}>
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
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">Message Board</h2>

      {/* Compose */}
      <Card className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
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
      </Card>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
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
