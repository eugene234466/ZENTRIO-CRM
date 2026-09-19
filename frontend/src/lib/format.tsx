export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const formatDateFull = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GH', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const formatRole = (role: string) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};
