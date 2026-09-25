import { useRef, useState } from 'react';
import { Camera, LogOut, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/components/Login-register/authApi';
import { getInitials, formatRole } from '@/lib/format';

export const ProfileSection = ({
  addToast,
}: {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}) => {
  const { user, logout, refresh } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out.', 'info');
    } catch {
      addToast('Could not log out. Please try again.', 'error');
    }
  };

  const handlePickFile = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    // Reset the input so picking the same file twice still fires onChange.
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      await authApi.uploadAvatar(file);
      // Re-pull the user from the auth context so every consumer
      // (Topbar, Profile) gets the new avatar URL.
      if (typeof refresh === 'function') {
        await refresh();
      }
      addToast('Profile picture updated.', 'success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not upload picture.';
      addToast(message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const rows = [
    { icon: UserIcon, label: 'Username', value: user.username },
    { icon: Mail, label: 'Email', value: user.email },
    { icon: ShieldCheck, label: 'Role', value: formatRole(user.role) },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0 max-w-2xl">
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">Profile</h2>

      <Card className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handlePickFile}
              disabled={uploading}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#F2C94C]/30 to-[#D4A93A]/30 flex items-center justify-center flex-shrink-0 group disabled:opacity-70"
              title={uploading ? 'Uploading…' : 'Change picture'}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[#D4A93A] dark:text-[#F2C94C] font-bold text-xl">
                  {getInitials(user.username)}
                </span>
              )}
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-[var(--text-main)] truncate">{user.username}</p>
              <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
              <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#F2C94C]/15 text-[#D4A93A] dark:text-[#F2C94C]">
                {formatRole(user.role)}
              </span>
            </div>

            <Button
              onClick={handlePickFile}
              disabled={uploading}
              className="bg-[#F2C94C] text-[#1a1a2e] hover:bg-[#D4A93A] flex-shrink-0"
            >
              <Camera className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading…' : 'Change picture'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[var(--card-bg)] border-[var(--border-color)] rounded-2xl sm:rounded-[28px]">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg text-[var(--text-main)]">Account details</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="divide-y divide-[var(--border-color)]">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-xl bg-[#F2C94C]/10 flex items-center justify-center flex-shrink-0">
                  <row.icon className="w-4 h-4 text-[#D4A93A] dark:text-[#F2C94C]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[var(--text-muted)]">{row.label}</p>
                  <p className="text-sm font-medium text-[var(--text-main)] truncate">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4">
            <Button
              onClick={() => void handleLogout()}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};