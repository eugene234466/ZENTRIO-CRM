// Topbar Component
import { useEffect, useRef, useState } from 'react';
import { Menu, Search, Sun, Moon, Bell, LogOut, User, CheckCheck, Inbox, Users, Kanban, FileText, SearchX } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme.tsx';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { api } from '@/lib/api';
import type { AuthUser, SearchResult } from '@/lib/api';
import { getInitials, formatRole } from '@/lib/format';

const KIND_LABEL: Record<string, string> = {
  overdue_invoice: 'Overdue',
  assigned_lead: 'Lead',
  assigned_task: 'Task',
  pinned_message: 'Board',
};

const RESULT_ICON = {
  client: Users,
  lead: Kanban,
  invoice: FileText,
} as const;

export const Topbar = ({
  onMenuClick,
  user,
  onGoProfile,
  onPickSearchResult,
}: {
  onMenuClick: () => void;
  user: AuthUser;
  onGoProfile: () => void;
  onPickSearchResult: (result: SearchResult) => void;
}) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications();
  const [openMenu, setOpenMenu] = useState<'bell' | 'user' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      api
        .search(q)
        .then((data) => setResults(data.results))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const closeSearch = () => setSearchOpen(false);

  const pickResult = (result: SearchResult) => {
    closeSearch();
    setQuery('');
    onPickSearchResult(result);
  };

  useEffect(() => {
    if (!openMenu && !searchOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpenMenu(null);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setSearchOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu, searchOpen]);

  const toggle = (menu: 'bell' | 'user') =>
    setOpenMenu((prev) => (prev === menu ? null : menu));

  return (
    <header className="h-[64px] bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div ref={searchRef} className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results.length > 0) {
                pickResult(results[0]);
              }
            }}
            placeholder="Search clients, leads, invoices..."
            className="w-[200px] lg:w-[280px] pl-10 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#F2C94C]/50"
          />
          {searchOpen && query.trim().length >= 2 && (
            <div className="absolute left-0 mt-2 w-[320px] max-w-[85vw] rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl overflow-hidden z-50">
              {searching ? (
                <p className="px-4 py-6 text-sm text-center text-[var(--text-muted)]">Searching…</p>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-[var(--text-muted)]">
                  <SearchX className="w-6 h-6" />
                  <p className="text-sm">No matches for “{query.trim()}”.</p>
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto py-1">
                  {results.map((r) => {
                    const Icon = RESULT_ICON[r.type];
                    return (
                      <button
                        key={`${r.type}-${r.id}`}
                        onClick={() => pickResult(r)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--hover-bg)] transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#F2C94C]/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-[#D4A93A] dark:text-[#F2C94C]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--text-main)] truncate">{r.title}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{r.subtitle}</p>
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] flex-shrink-0">
                          {r.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div ref={rootRef} className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => toggle('bell')}
            title="Notifications"
            className={`relative p-2.5 rounded-xl transition-colors ${
              openMenu === 'bell'
                ? 'bg-[#F2C94C]/15 text-[#D4A93A] dark:text-[#F2C94C]'
                : 'hover:bg-[var(--hover-bg)] text-[var(--text-muted)]'
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F2C94C] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {openMenu === 'bell' && (
            <div className="absolute right-0 mt-2 w-[320px] max-w-[85vw] rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  Notifications{unreadCount > 0 && ` (${unreadCount} unread)`}
                </p>
                {unreadCount > 0 && (
                  <button
                    onClick={() => void markAllRead()}
                    className="flex items-center gap-1 text-xs text-[#D4A93A] dark:text-[#F2C94C] hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {loading ? (
                  <p className="px-4 py-6 text-sm text-center text-[var(--text-muted)]">Loading…</p>
                ) : error ? (
                  <p className="px-4 py-6 text-sm text-center text-red-500">{error}</p>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-[var(--text-muted)]">
                    <Inbox className="w-6 h-6" />
                    <p className="text-sm">You're all caught up.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) void markRead(n.id);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--hover-bg)] transition-colors ${
                        n.is_read ? 'opacity-70' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-[#F2C94C] flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#F2C94C]/15 text-[#D4A93A] dark:text-[#F2C94C]">
                              {KIND_LABEL[n.kind] ?? n.kind}
                            </span>
                            {n.created_at && (
                              <span className="text-[11px] text-[var(--text-muted)]">
                                {new Date(n.created_at).toLocaleString('en-GH', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[var(--text-main)] truncate mt-1">{n.title}</p>
                          {n.body && (
                            <p className="text-xs text-[var(--text-muted)] truncate">{n.body}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => toggle('user')}
            title={`${user.username} (${formatRole(user.role)})`}
            className={`w-9 h-9 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center ml-1 ring-2 transition ${
              openMenu === 'user' ? 'ring-[#F2C94C]' : 'ring-transparent hover:ring-[#F2C94C]/50'
            }`}
          >
            <span className="text-[#D4A93A] dark:text-[#F2C94C] text-sm font-bold">
              {getInitials(user.username)}
            </span>
          </button>

          {openMenu === 'user' && (
            <div className="absolute right-0 mt-2 w-[260px] rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl overflow-hidden z-50">
              <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border-color)]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D4A93A] dark:text-[#F2C94C] font-bold text-sm">
                    {getInitials(user.username)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-main)] truncate">{user.username}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#F2C94C]/15 text-[#D4A93A] dark:text-[#F2C94C]">
                    {formatRole(user.role)}
                  </span>
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    onGoProfile();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-main)] hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <User className="w-4 h-4 text-[var(--text-muted)]" />
                  Profile
                </button>
                <button
                  onClick={() => void logout()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
