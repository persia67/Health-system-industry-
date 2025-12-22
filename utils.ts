
export const toJalali = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  
  // Use modern Intl API for accurate Persian date conversion
  return new Intl.DateTimeFormat('fa-IR', {
    calendar: 'persian',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  } as any).format(d);
};

export const generateId = (): string => {
  // Combine timestamp and random string to ensure uniqueness
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};
