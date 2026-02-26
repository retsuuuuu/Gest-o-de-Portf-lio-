export const isPastDate = (dateStr: string) => {
  if (!dateStr || dateStr.length < 10) return false;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return false;
  const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};
