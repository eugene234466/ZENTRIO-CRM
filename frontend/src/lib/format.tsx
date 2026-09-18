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
