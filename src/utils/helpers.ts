export const formatDate = (date: string) => {
  return new Date(date + 'T00:00:00').toDateString();
};