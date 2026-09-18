import { useState } from 'react';
import { Send, Pin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/hooks/useAppState';
import type { Message } from '@/types';
import type { AuthUser } from '@/lib/api';
import { generateId, getInitials, formatRole } from '@/lib/format';

export const MessageBoardSection = ({ 
  state, 
  addMessage, 
  pinMessage, 
  unpinMessage,
  addToast,
  currentUser,
}: { 
  state: ReturnType<typeof useAppState>['state']; 
  addMessage: (message: Message) => void;
  pinMessage: (id: string) => void;
  unpinMessage: (id: string) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  currentUser: AuthUser;
}) => {
  const [newMessage, setNewMessage] = useState('');

  const handlePostMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: generateId(),
      author: currentUser.username,
      authorRole: formatRole(currentUser.role),
      content: newMessage,
      timestamp: new Date().toISOString(),
      isPinned: false,
    };
    
    addMessage(message);
    setNewMessage('');
    addToast('Message posted', 'success');
  };

  const handleTogglePin = (message: Message) => {
    if (message.isPinned) {
      unpinMessage(message.id);
      addToast('Message unpinned', 'info');
    } else {
      pinMessage(message.id);
      addToast('Message pinned', 'success');
    }
  };

  const pinnedMessages = state.messages.filter(m => m.isPinned);
  const regularMessages = state.messages.filter(m => !m.isPinned);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-GH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">Intern Message Board</h2>

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
                  disabled={!newMessage.trim()}
                  className="bg-[#F2C94C] text-white hover:bg-[#D4A93A] disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post
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
          {pinnedMessages.map((message) => (
            <Card key={message.id} className="bg-[var(--card-bg)] border-[#F2C94C]/30 rounded-2xl sm:rounded-[28px] animate-pulse-glow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#D4A93A] dark:text-[#F2C94C] font-bold text-xs sm:text-sm">{getInitials(message.author)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-medium text-[var(--text-main)] text-sm sm:text-base">{message.author}</span>
                      <span className="text-xs text-[var(--text-muted)]">({message.authorRole})</span>
                      <span className="text-xs text-[var(--text-muted)]">• {formatTime(message.timestamp)}</span>
                    </div>
                    <p className="text-[var(--text-main)] text-sm sm:text-base">{message.content}</p>
                  </div>
                  <button 
                    onClick={() => handleTogglePin(message)}
                    className="p-2 rounded-lg hover:bg-[#F2C94C]/10 text-[#D4A93A] dark:text-[#F2C94C] transition-colors flex-shrink-0"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Regular Messages */}
      <div className="space-y-3">
        {regularMessages.map((message) => (
          <Card key={message.id} className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D4A93A] dark:text-[#F2C94C] font-bold text-xs sm:text-sm">{getInitials(message.author)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-medium text-[var(--text-main)] text-sm sm:text-base">{message.author}</span>
                    <span className="text-xs text-[var(--text-muted)]">({message.authorRole})</span>
                    <span className="text-xs text-[var(--text-muted)]">• {formatTime(message.timestamp)}</span>
                  </div>
                  <p className="text-[var(--text-main)] text-sm sm:text-base">{message.content}</p>
                </div>
                <button 
                  onClick={() => handleTogglePin(message)}
                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[#D4A93A] dark:hover:text-[#F2C94C] transition-colors flex-shrink-0"
                >
                  <Pin className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};